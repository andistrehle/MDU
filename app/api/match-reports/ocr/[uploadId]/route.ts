// ============================================================
// Route Handler: OCR-Erkennung starten
// ============================================================
//
// POST /api/match-reports/ocr/[uploadId]
// Idempotent. Ruft den Vision-Provider serverseitig auf und speichert das
// Ergebnis. Die Begegnung kann vorab gewählt sein ODER wird aus den erkannten
// Teams (+Datum) automatisch zugeordnet. Ist sie eindeutig und gehört dem
// Nutzer, wird direkt ein digitaler Entwurf angelegt; sonst „needs_review" mit
// Begegnungsvorschlägen (Zuordnung über die assign-Route).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, canUploadForTeam } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findMatch, buildOcrContext, finalizeDraftFromStructured } from '@/lib/server/ocr-draft';
import { resolveMatchFromExtraction, matchLabel } from '@/lib/ocr/resolve-match';
import { getOcrConfig, isOcrAvailable, isRoleAllowed } from '@/lib/ocr/config';
import { getOcrProvider, type OcrInputPage, type OcrMatchContext } from '@/lib/ocr/provider';
import { isOcrReadyMime, fileToInputPage } from '@/lib/ocr/preprocess';
import type { GameMatch } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vision-Erkennung kann für Mehrseiten-Berichte länger dauern — Function-Timeout
// anheben (Vercel clamped auf das Plan-Limit).
export const maxDuration = 60;

// Grace-Fenster: bleibt ein „processing"-Lauf länger als das hängen (Timeout/
// Absturz), gilt er als abgebrochen und darf neu gestartet werden.
const OCR_STALE_MS = 3 * 60 * 1000;

const BUCKET = 'match-report-uploads';
const EMPTY_CTX: OcrMatchContext = {
  season: null, league: null, matchday: null, date: null, venue: null,
  homeTeam: null, guestTeam: null, homeRoster: [], guestRoster: [],
};

export async function POST(request: Request, ctx: { params: Promise<{ uploadId: string }> }) {
  const { uploadId } = await ctx.params;
  const cfg = getOcrConfig();
  if (!isOcrAvailable(cfg)) return NextResponse.json({ error: 'OCR ist derzeit nicht verfügbar.' }, { status: 503 });

  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isRoleAllowed(auth.user.role, cfg)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  const { data: upload } = await supabaseAdmin.from('match_report_uploads').select('*').eq('id', uploadId).maybeSingle();
  if (!upload) return NextResponse.json({ error: 'Upload nicht gefunden.' }, { status: 404 });

  // Basis-Berechtigung: eigener Upload, oder (falls Begegnung vorgewählt) eigenes Team / Admin.
  const preMatch: GameMatch | null = upload.match_id ? findMatch(upload.match_id) : null;
  const ownsUpload = upload.uploaded_by === auth.user.id
    || (preMatch && (canUploadForTeam(auth.user, preMatch.homeTeamId) || canUploadForTeam(auth.user, preMatch.awayTeamId)));
  if (!ownsUpload) return NextResponse.json({ error: 'Keine Berechtigung für diesen Upload.' }, { status: 403 });

  // Idempotenz: laufend/abgeschlossen nicht erneut (kostenpflichtig) ausführen.
  // Ausnahme: ein „processing", das länger als das Grace-Fenster her ist, gilt als
  // hängengeblieben (Timeout/Absturz) und darf neu gestartet werden — sonst bliebe
  // der Upload für immer blockiert.
  if (upload.ocr_status === 'processing') {
    const startedAt = upload.ocr_started_at ? new Date(upload.ocr_started_at).getTime() : 0;
    const stale = !startedAt || (Date.now() - startedAt) > OCR_STALE_MS;
    if (!stale) return NextResponse.json({ error: 'Erkennung läuft bereits.' }, { status: 409 });
    // sonst: unten als neuer Versuch behandeln (Status wird gleich neu gesetzt).
  }
  if (upload.ocr_completed_at && upload.ocr_status !== 'failed') {
    return NextResponse.json({
      status: upload.ocr_status, matchReportId: upload.match_report_id ?? null,
      needsMatch: !upload.match_report_id, reused: true,
    }, { status: 200 });
  }

  const provider = await getOcrProvider(cfg);
  if (!provider) {
    await supabaseAdmin.from('match_report_uploads').update({ ocr_status: 'failed', ocr_error: 'Provider nicht konfiguriert.' }).eq('id', uploadId);
    return NextResponse.json({ error: 'OCR-Provider ist nicht konfiguriert.' }, { status: 503 });
  }

  // Atomarer „Claim" gegen konkurrierende Starts (Doppelklick / parallele Tabs):
  // Nur wer den erwarteten Ausgangszustand noch vorfindet, darf die (kosten-
  // pflichtige) OCR starten. Beim Stale-Retry zusätzlich über ocr_started_at,
  // damit auch dort nur ein Aufruf gewinnt (REV-059).
  let claim = supabaseAdmin.from('match_report_uploads').update({
    ocr_status: 'processing', ocr_provider: provider.name, ocr_model: cfg.model,
    attempt_count: (upload.attempt_count ?? 0) + 1, last_attempt_at: new Date().toISOString(),
    ocr_started_at: new Date().toISOString(), ocr_error: null,
  }).eq('id', uploadId).eq('ocr_status', upload.ocr_status);
  if (upload.ocr_status === 'processing') {
    claim = upload.ocr_started_at
      ? claim.eq('ocr_started_at', upload.ocr_started_at)
      : claim.is('ocr_started_at', null);
  }
  const { data: claimed } = await claim.select('id').maybeSingle();
  if (!claimed) return NextResponse.json({ error: 'Erkennung läuft bereits.' }, { status: 409 });

  // Optional vom Client: weitere Seiten (z. B. Seite 2 mit Highlights), die
  // zusammen mit dieser hochgeladen wurden, aber (mangels Begegnung) nicht über
  // match_id gruppiert sind.
  let extraPageIds: string[] = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.pageUploadIds)) extraPageIds = body.pageUploadIds.filter((x: unknown): x is string => typeof x === 'string');
  } catch { /* kein/Leerer Body — ok */ }

  // Seiten-Gruppe markieren (Hauptseite = Gruppen-Id), damit die Prüfansicht
  // alle zusammengehörigen Seiten findet — auch ohne gewählte Begegnung.
  if (extraPageIds.length) {
    const groupIds = [uploadId, ...extraPageIds].filter((v, i, a) => a.indexOf(v) === i);
    await supabaseAdmin.from('match_report_uploads')
      .update({ page_group_id: uploadId })
      .in('id', groupIds).eq('uploaded_by', upload.uploaded_by);
  }

  try {
    let pageRows: { storage_path: string; mime_type: string }[];
    if (upload.match_id) {
      // Pre-Auswahl: alle Seiten dieser Begegnung.
      const { data: pages } = await supabaseAdmin.from('match_report_uploads')
        .select('storage_path, mime_type, page_number')
        .eq('match_id', upload.match_id).eq('uploaded_by', upload.uploaded_by)
        .neq('upload_status', 'deleted').order('page_number');
      pageRows = pages ?? [];
    } else if (extraPageIds.length) {
      // Ohne Begegnung: diese Datei + die explizit mitgegebenen Zusatzseiten
      // (nur eigene Uploads), nach Seitenzahl sortiert.
      const ids = [uploadId, ...extraPageIds].filter((v, i, a) => a.indexOf(v) === i);
      const { data: pages } = await supabaseAdmin.from('match_report_uploads')
        .select('storage_path, mime_type, page_number')
        .in('id', ids).eq('uploaded_by', upload.uploaded_by)
        .neq('upload_status', 'deleted').order('page_number');
      pageRows = pages ?? [{ storage_path: upload.storage_path, mime_type: upload.mime_type }];
    } else {
      pageRows = [{ storage_path: upload.storage_path, mime_type: upload.mime_type }];
    }

    const inputPages: OcrInputPage[] = [];
    for (const p of pageRows.slice(0, 3)) {
      if (!isOcrReadyMime(p.mime_type)) continue;
      const { data: blob } = await supabaseAdmin.storage.from(BUCKET).download(p.storage_path);
      if (!blob) continue;
      inputPages.push(await fileToInputPage(await blob.arrayBuffer(), p.mime_type));
    }
    if (inputPages.length === 0) throw new Error('Keine verarbeitbare Bilddatei gefunden (HEIC bitte als JPG/PNG hochladen).');

    const providerCtx = preMatch ? buildOcrContext(preMatch).providerCtx : EMPTY_CTX;
    const result = await provider.extract(inputPages, providerCtx);
    const structured = result.structuredData;

    if (!structured || structured.documentType !== 'mdu_match_report') {
      const { data: resRow } = await supabaseAdmin.from('match_report_ocr_results').insert({
        upload_id: uploadId, raw_text: result.rawText, raw_result: structured ?? null,
        overall_confidence: result.confidence, provider: result.provider, model_version: result.modelVersion, warnings: result.warnings,
      }).select('id').maybeSingle();
      const jsonFailed = !structured;
      const snippet = (result.rawText ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);
      const ocrError = jsonFailed
        ? `Antwort konnte nicht als JSON gelesen werden.${snippet ? ' Modellantwort (Anfang): ' + snippet : ' (leere Antwort)'}`
        : 'Dokument wurde nicht als MDU-Spielbericht erkannt.';
      await supabaseAdmin.from('match_report_uploads').update({
        ocr_status: 'failed', ocr_completed_at: new Date().toISOString(), ocr_error: ocrError,
      }).eq('id', uploadId);
      return NextResponse.json({ status: 'failed', ocrResultId: resRow?.id ?? null, error: ocrError }, { status: 200 });
    }

    // OCR-Ergebnis speichern (Original nicht überschreiben).
    const { data: resRow, error: resErr } = await supabaseAdmin.from('match_report_ocr_results').insert({
      upload_id: uploadId, raw_text: result.rawText, raw_result: structured, structured_result: structured,
      overall_confidence: result.confidence, provider: result.provider, model_version: result.modelVersion,
      parser_version: '1', warnings: result.warnings,
    }).select('id').maybeSingle();
    if (resErr || !resRow) throw new Error(resErr?.message ?? 'OCR-Ergebnis konnte nicht gespeichert werden.');
    const ocrResultId = (resRow as { id: string }).id;

    // Begegnung bestimmen: vorgewählt ODER aus dem Ergebnis ableiten.
    let match = preMatch;
    let candidates: GameMatch[] = [];
    if (!match) {
      const res = resolveMatchFromExtraction(structured);
      candidates = res.candidates;
      match = res.match;
    }

    // Nur automatisch übernehmen, wenn die Begegnung dem Nutzer gehört (Kapitän) bzw. Admin.
    const ownsMatch = !!match && (canUploadForTeam(auth.user, match.homeTeamId) || canUploadForTeam(auth.user, match.awayTeamId));
    if (match && ownsMatch) {
      const fin = await finalizeDraftFromStructured({ uploadId, ocrResultId, uploaderId: upload.uploaded_by, match, structured });
      if (fin.error) throw new Error(fin.error);
      return NextResponse.json({ status: fin.status, matchReportId: fin.reportId, ocrResultId, issues: fin.issues }, { status: 200 });
    }

    // Keine (eindeutige/eigene) Begegnung → Zuordnung durch den Nutzer nötig.
    await supabaseAdmin.from('match_report_uploads').update({
      ocr_status: 'needs_review', ocr_completed_at: new Date().toISOString(),
    }).eq('id', uploadId);
    return NextResponse.json({
      status: 'needs_review', needsMatch: true, ocrResultId,
      candidates: candidates.map(m => ({ id: m.id, label: matchLabel(m) })),
    }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler bei der Erkennung.';
    await supabaseAdmin.from('match_report_uploads').update({
      ocr_status: 'failed', ocr_completed_at: new Date().toISOString(), ocr_error: message,
    }).eq('id', uploadId);
    return NextResponse.json({ status: 'failed', error: message }, { status: 200 });
  }
}
