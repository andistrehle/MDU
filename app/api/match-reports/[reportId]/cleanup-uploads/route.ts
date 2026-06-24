// ============================================================
// Route Handler: Upload-Originale nach Bestätigung löschen
// ============================================================
//
// POST /api/match-reports/[reportId]/cleanup-uploads
// Löscht die hochgeladenen Original-Fotos/PDF eines Spielberichts, sobald dieser
// bestätigt ist (status='confirmed') — Umsetzung der Datenschutz-Zusage
// „Original-Datei wird nach Bestätigung gelöscht". Storage-Löschung nur
// serverseitig (privater Bucket, service_role). Idempotent.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET = 'match-report-uploads';

export async function POST(request: Request, ctx: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await ctx.params;

  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  // Aufräumen erlaubt, wenn der Bericht bestätigt ist (regulärer Fall) ODER der
  // Aufrufer Admin/Ligaleitung ist (z. B. vor dem Löschen eines Berichts).
  const { data: report } = await supabaseAdmin
    .from('match_reports').select('id, status').eq('id', reportId).maybeSingle();
  if (!report) return NextResponse.json({ error: 'Spielbericht nicht gefunden.' }, { status: 404 });
  if (report.status !== 'confirmed' && !isAdminUser(auth.user)) {
    return NextResponse.json({ status: 'skipped', reason: 'not_confirmed' }, { status: 200 });
  }

  // Alle zugehörigen Seiten einsammeln: Hauptseite(n) über match_report_id,
  // Zusatzseiten (z. B. Highlights-Seite) über page_group_id.
  const { data: primaries } = await supabaseAdmin
    .from('match_report_uploads')
    .select('id, storage_path, upload_status, page_group_id')
    .eq('match_report_id', reportId);

  const rows = new Map<string, { id: string; storage_path: string; upload_status: string }>();
  for (const u of primaries ?? []) rows.set(u.id, u);

  const groupIds = [
    ...new Set([
      ...(primaries ?? []).map(u => u.id),
      ...(primaries ?? []).map(u => u.page_group_id).filter((x): x is string => !!x),
    ]),
  ];
  if (groupIds.length) {
    const { data: siblings } = await supabaseAdmin
      .from('match_report_uploads')
      .select('id, storage_path, upload_status, page_group_id')
      .in('page_group_id', groupIds);
    for (const u of siblings ?? []) rows.set(u.id, u);
  }

  // Noch nicht gelöschte Originale mit Pfad bestimmen.
  const toDelete = [...rows.values()].filter(u => u.upload_status !== 'deleted' && u.storage_path);
  if (toDelete.length === 0) {
    return NextResponse.json({ status: 'cleaned', deleted: 0 }, { status: 200 });
  }

  // Dateien aus dem privaten Bucket entfernen …
  const paths = toDelete.map(u => u.storage_path);
  const { error: rmErr } = await supabaseAdmin.storage.from(BUCKET).remove(paths);
  if (rmErr) return NextResponse.json({ error: `Löschen fehlgeschlagen: ${rmErr.message}` }, { status: 500 });

  // … und die Upload-Zeilen als gelöscht markieren (Zeile bleibt fürs Audit).
  await supabaseAdmin
    .from('match_report_uploads')
    .update({ upload_status: 'deleted' })
    .in('id', toDelete.map(u => u.id));

  return NextResponse.json({ status: 'cleaned', deleted: toDelete.length }, { status: 200 });
}
