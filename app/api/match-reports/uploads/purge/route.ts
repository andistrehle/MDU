// ============================================================
// Route Handler: Spielbericht-Fotos einer Saison löschen (Saisonende)
// ============================================================
//
// POST /api/match-reports/uploads/purge  { seasonId }  — nur Ligaleitung.
// Löscht alle noch vorhandenen Original-Fotos der Saison aus dem privaten
// Speicher (Datenschutz: Aufbewahrung bis Saisonende). Die Spielberichte
// selbst (Zahlen, Aufstellung) bleiben.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { loescheUploads, type UploadZeile } from '@/lib/server/report-uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  const body = await request.json().catch(() => ({})) as { seasonId?: string };
  if (!body.seasonId) return NextResponse.json({ error: 'Saison fehlt.' }, { status: 400 });

  const { data, error } = await supabaseAdmin.from('match_report_uploads')
    .select('id, storage_path, upload_status, page_group_id').eq('season_id', body.seasonId).neq('upload_status', 'deleted');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const res = await loescheUploads((data ?? []) as UploadZeile[]);
  if (res.error) return NextResponse.json({ error: res.error, deleted: res.deleted }, { status: 500 });
  return NextResponse.json({ deleted: res.deleted });
}
