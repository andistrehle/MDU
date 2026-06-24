// ============================================================
// Route Handler: Begegnung einem OCR-Upload zuordnen
// ============================================================
//
// POST /api/match-reports/ocr/[uploadId]/assign  { matchId }
// Für den Fall „ohne Vorauswahl hochgeladen": ordnet die (vom Nutzer
// bestätigte/gewählte) Begegnung zu und legt daraus den digitalen Entwurf an.
// Team-Berechtigung wird serverseitig geprüft.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, canUploadForTeam, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findMatch, finalizeDraftFromStructured } from '@/lib/server/ocr-draft';
import { getOcrConfig, isOcrAvailable, isRoleAllowed } from '@/lib/ocr/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request, ctx: { params: Promise<{ uploadId: string }> }) {
  const { uploadId } = await ctx.params;
  const cfg = getOcrConfig();
  if (!isOcrAvailable(cfg)) return NextResponse.json({ error: 'OCR ist derzeit nicht verfügbar.' }, { status: 503 });

  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isRoleAllowed(auth.user.role, cfg)) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  let body: { matchId?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Ungültiger Request.' }, { status: 400 }); }
  const matchId = String(body.matchId ?? '').trim();
  if (!matchId) return NextResponse.json({ error: 'Keine Begegnung gewählt.' }, { status: 400 });

  const { data: upload } = await supabaseAdmin.from('match_report_uploads').select('*').eq('id', uploadId).maybeSingle();
  if (!upload) return NextResponse.json({ error: 'Upload nicht gefunden.' }, { status: 404 });
  if (upload.uploaded_by !== auth.user.id && !isAdminUser(auth.user)) {
    return NextResponse.json({ error: 'Keine Berechtigung für diesen Upload.' }, { status: 403 });
  }
  if (upload.match_report_id) {
    return NextResponse.json({ matchReportId: upload.match_report_id, reused: true, status: upload.ocr_status }, { status: 200 });
  }

  const match = findMatch(matchId);
  if (!match) return NextResponse.json({ error: 'Begegnung nicht gefunden.' }, { status: 400 });

  const allowed = canUploadForTeam(auth.user, match.homeTeamId) || canUploadForTeam(auth.user, match.awayTeamId);
  if (!allowed) return NextResponse.json({ error: 'Du darfst nur Spiele der eigenen Mannschaft zuordnen.' }, { status: 403 });

  const { data: result } = await supabaseAdmin.from('match_report_ocr_results')
    .select('id, structured_result').eq('upload_id', uploadId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!result || !result.structured_result) {
    return NextResponse.json({ error: 'Kein Erkennungsergebnis vorhanden.' }, { status: 400 });
  }

  const fin = await finalizeDraftFromStructured({
    uploadId, ocrResultId: result.id, uploaderId: upload.uploaded_by, match, structured: result.structured_result,
  });
  if (fin.error || !fin.reportId) return NextResponse.json({ error: fin.error ?? 'Entwurf fehlgeschlagen.' }, { status: 500 });

  return NextResponse.json({ status: fin.status, matchReportId: fin.reportId, issues: fin.issues }, { status: 200 });
}
