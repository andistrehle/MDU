// ============================================================
// Route Handler: OCR-Upload (Foto/PDF eines Papier-Spielberichts)
// ============================================================
//
// POST /api/match-reports/upload  (multipart/form-data: file, matchId, page?)
// Serverseitige Auth + Rollen-/Team-Prüfung + Datei-Validierung. Speichert die
// Originaldatei in den PRIVATEN Bucket (service_role) und legt die Upload-Zeile
// an. Kein OCR-Aufruf hier — das startet ein separater Endpoint (idempotent).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, canUploadForTeam } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { findMatch } from '@/lib/server/ocr-draft';
import { getOcrConfig, isOcrAvailable, isRoleAllowed } from '@/lib/ocr/config';
import { isAcceptedMime, extForMime } from '@/lib/ocr/preprocess';
import { getCurrentSeason, type GameMatch } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'match-report-uploads';

export async function POST(request: Request) {
  const cfg = getOcrConfig();
  if (!isOcrAvailable(cfg)) {
    return NextResponse.json({ error: 'Der OCR-Upload ist derzeit nicht verfügbar.' }, { status: 503 });
  }
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isRoleAllowed(auth.user.role, cfg)) {
    return NextResponse.json({ error: 'Keine Berechtigung für den Spielbericht-Upload.' }, { status: 403 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server-Storage ist nicht konfiguriert.' }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Upload.' }, { status: 400 });
  }
  const file = form.get('file');
  const matchId = String(form.get('matchId') ?? '').trim();
  const pageNumber = Math.max(1, Math.min(3, Number(form.get('page') ?? 1) || 1));

  if (!(file instanceof File)) return NextResponse.json({ error: 'Keine Datei übergeben.' }, { status: 400 });

  // Begegnung ist OPTIONAL. Ist sie vorgewählt, gleich die Team-Berechtigung
  // prüfen; ohne Auswahl wird sie nach dem OCR zugeordnet.
  let match: GameMatch | null = null;
  if (matchId) {
    match = findMatch(matchId);
    if (!match) return NextResponse.json({ error: 'Begegnung nicht gefunden.' }, { status: 400 });
    const allowed = canUploadForTeam(auth.user, match.homeTeamId) || canUploadForTeam(auth.user, match.awayTeamId);
    if (!allowed) {
      return NextResponse.json({ error: 'Du darfst nur Spiele der eigenen Mannschaft hochladen.' }, { status: 403 });
    }
  }

  if (!isAcceptedMime(file.type)) {
    return NextResponse.json({ error: 'Nicht unterstütztes Format. Erlaubt: JPG, PNG, WEBP, HEIC, PDF.' }, { status: 400 });
  }
  if (file.size > cfg.maxFileBytes) {
    return NextResponse.json({ error: `Datei zu groß (max. ${Math.round(cfg.maxFileBytes / 1024 / 1024)} MB).` }, { status: 400 });
  }

  const uploadId = crypto.randomUUID();
  const ext = extForMime(file.type);
  const seasonId = match?.seasonId ?? getCurrentSeason().id;
  const pathBase = match ? `${match.seasonId}/${matchId}` : `unassigned/${auth.user.id}`;
  const path = `match-reports/${pathBase}/${uploadId}/page-${pageNumber}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabaseAdmin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type, upsert: false,
  });
  if (upErr) {
    return NextResponse.json({ error: `Speichern fehlgeschlagen: ${upErr.message}` }, { status: 500 });
  }

  const { error: rowErr } = await supabaseAdmin.from('match_report_uploads').insert({
    id: uploadId,
    match_id: matchId || null,
    season_id: seasonId,
    uploaded_by: auth.user.id,
    storage_path: path,
    file_name: file.name || `page-${pageNumber}.${ext}`,
    mime_type: file.type,
    file_size: file.size,
    page_number: pageNumber,
  });
  if (rowErr) {
    // Best effort: hochgeladene Datei wieder entfernen, damit keine Waise bleibt.
    await supabaseAdmin.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: `Upload-Datensatz fehlgeschlagen: ${rowErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ uploadId, matchId, pageNumber }, { status: 200 });
}
