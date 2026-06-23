// ============================================================
// Route Handler: OCR-Erkennung starten
// ============================================================
//
// POST /api/match-reports/ocr/[uploadId]
// Idempotent: pro Upload nur ein aktiver Job; bereits erkannte Uploads werden
// nicht erneut (kostenpflichtig) verarbeitet. Ruft den Vision-Provider
// serverseitig auf, speichert Roh-/Strukturergebnis + Felder und legt einen
// digitalen Spielbericht-ENTWURF an. Tabellen/Statistik bleiben unverändert.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, canUploadForTeam } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findMatch, buildOcrContext, createOcrDraft } from '@/lib/server/ocr-draft';
import { getOcrConfig, isOcrAvailable, isRoleAllowed } from '@/lib/ocr/config';
import { getOcrProvider, type OcrInputPage } from '@/lib/ocr/provider';
import { parseMatchReport } from '@/lib/ocr/parse-match-report';
import { isOcrReadyMime, fileToInputPage } from '@/lib/ocr/preprocess';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'match-report-uploads';

export async function POST(request: Request, ctx: { params: Promise<{ uploadId: string }> }) {
  const { uploadId } = await ctx.params;
  const cfg = getOcrConfig();
  if (!isOcrAvailable(cfg)) return NextResponse.json({ error: 'OCR ist derzeit nicht verfügbar.' }, { status: 503 });

  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isRoleAllowed(auth.user.role, cfg)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  // ── Upload laden + Berechtigung ─────────────────────────────
  const { data: upload } = await supabaseAdmin.from('match_report_uploads').select('*').eq('id', uploadId).maybeSingle();
  if (!upload) return NextResponse.json({ error: 'Upload nicht gefunden.' }, { status: 404 });

  const match = upload.match_id ? findMatch(upload.match_id) : null;
  if (!match) return NextResponse.json({ error: 'Begegnung nicht gefunden.' }, { status: 400 });

  const owns = upload.uploaded_by === auth.user.id
    || canUploadForTeam(auth.user, match.homeTeamId) || canUploadForTeam(auth.user, match.awayTeamId);
  if (!owns) return NextResponse.json({ error: 'Keine Berechtigung für diesen Upload.' }, { status: 403 });

  // ── Idempotenz ──────────────────────────────────────────────
  if (upload.ocr_status === 'processing') {
    return NextResponse.json({ error: 'Erkennung läuft bereits.' }, { status: 409 });
  }
  if ((upload.ocr_status === 'completed' || upload.ocr_status === 'needs_review') && upload.match_report_id) {
    return NextResponse.json({ matchReportId: upload.match_report_id, reused: true, status: upload.ocr_status }, { status: 200 });
  }

  const provider = await getOcrProvider(cfg);
  if (!provider) {
    await supabaseAdmin.from('match_report_uploads').update({ ocr_status: 'failed', ocr_error: 'Provider nicht konfiguriert.' }).eq('id', uploadId);
    return NextResponse.json({ error: 'OCR-Provider ist nicht konfiguriert.' }, { status: 503 });
  }

  await supabaseAdmin.from('match_report_uploads').update({
    ocr_status: 'processing', ocr_provider: provider.name, ocr_model: cfg.model,
    attempt_count: (upload.attempt_count ?? 0) + 1, last_attempt_at: new Date().toISOString(),
    ocr_started_at: new Date().toISOString(), ocr_error: null,
  }).eq('id', uploadId);

  try {
    // ── Alle Seiten (Vorder-/Rückseite) dieser Begegnung sammeln ──
    const { data: pages } = await supabaseAdmin.from('match_report_uploads')
      .select('storage_path, mime_type, page_number')
      .eq('match_id', upload.match_id).eq('uploaded_by', upload.uploaded_by)
      .neq('upload_status', 'deleted').order('page_number');

    const inputPages: OcrInputPage[] = [];
    for (const p of (pages ?? []).slice(0, 3)) {
      if (!isOcrReadyMime(p.mime_type)) continue; // HEIC etc. (Konvertierung später)
      const { data: blob } = await supabaseAdmin.storage.from(BUCKET).download(p.storage_path);
      if (!blob) continue;
      inputPages.push(await fileToInputPage(await blob.arrayBuffer(), p.mime_type));
    }
    if (inputPages.length === 0) {
      throw new Error('Keine verarbeitbare Bilddatei gefunden (HEIC bitte als JPG/PNG hochladen).');
    }

    const { providerCtx, parseCtx } = buildOcrContext(match);
    const result = await provider.extract(inputPages, providerCtx);

    const structured = result.structuredData;
    if (!structured || structured.documentType !== 'mdu_match_report') {
      const { data: resRow } = await supabaseAdmin.from('match_report_ocr_results').insert({
        upload_id: uploadId, raw_text: result.rawText, raw_result: structured ?? null,
        overall_confidence: result.confidence, provider: result.provider,
        model_version: result.modelVersion, warnings: result.warnings,
      }).select('id').maybeSingle();
      await supabaseAdmin.from('match_report_uploads').update({
        ocr_status: 'failed', ocr_completed_at: new Date().toISOString(),
        ocr_error: 'Dokument wurde nicht als MDU-Spielbericht erkannt.',
      }).eq('id', uploadId);
      return NextResponse.json({ status: 'failed', ocrResultId: resRow?.id ?? null,
        error: 'Dokument wurde nicht als MDU-Spielbericht erkannt. Du kannst es erneut hochladen oder manuell erfassen.' }, { status: 200 });
    }

    const parsed = parseMatchReport(structured, parseCtx);

    // OCR-Ergebnis speichern (Original nicht überschreiben).
    const { data: resRow, error: resErr } = await supabaseAdmin.from('match_report_ocr_results').insert({
      upload_id: uploadId, raw_text: result.rawText, raw_result: structured,
      structured_result: structured, overall_confidence: result.confidence,
      provider: result.provider, model_version: result.modelVersion,
      parser_version: '1', warnings: result.warnings,
    }).select('id').maybeSingle();
    if (resErr || !resRow) throw new Error(resErr?.message ?? 'OCR-Ergebnis konnte nicht gespeichert werden.');
    const ocrResultId = (resRow as { id: string }).id;

    // Felder (für Prüfansicht/Audit).
    if (parsed.fields.length) {
      await supabaseAdmin.from('match_report_ocr_fields').insert(parsed.fields.map(f => ({
        ocr_result_id: ocrResultId, field_key: f.fieldKey, detected_value: f.detectedValue,
        normalized_value: f.detectedValue, confidence: f.confidence,
        status: f.level === 'missing' ? 'unresolved' : 'detected',
      })));
    }

    // Digitalen Entwurf anlegen.
    const draft = await createOcrDraft({
      header: parsed.header, homePlayers: parsed.homePlayers, guestPlayers: parsed.guestPlayers,
      games: parsed.games, uploaderId: upload.uploaded_by, uploadId, ocrResultId,
    });
    if (draft.error || !draft.id) throw new Error(draft.error ?? 'Entwurf konnte nicht angelegt werden.');

    await supabaseAdmin.from('match_report_ocr_results').update({ match_report_id: draft.id }).eq('id', ocrResultId);

    const hasErrors = parsed.issues.some(i => i.level === 'error');
    await supabaseAdmin.from('match_report_uploads').update({
      ocr_status: hasErrors ? 'needs_review' : 'completed',
      ocr_completed_at: new Date().toISOString(),
      match_report_id: draft.id,
    }).eq('id', uploadId);

    return NextResponse.json({
      status: hasErrors ? 'needs_review' : 'completed',
      matchReportId: draft.id, ocrResultId,
      issues: parsed.issues, warnings: result.warnings,
    }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler bei der Erkennung.';
    await supabaseAdmin.from('match_report_uploads').update({
      ocr_status: 'failed', ocr_completed_at: new Date().toISOString(), ocr_error: message,
    }).eq('id', uploadId);
    return NextResponse.json({ status: 'failed', error: message }, { status: 200 });
  }
}
