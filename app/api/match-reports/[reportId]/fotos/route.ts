// ============================================================
// Route Handler: Original-Fotos eines Spielberichts ansehen
// ============================================================
//
// GET /api/match-reports/[reportId]/fotos  (Authorization: Bearer …)
// Kurzlebige signierte Links (15 Min) zu allen Seiten des hochgeladenen
// Papierbogens. Sehen dürfen: die Kapitäne der beiden Teams und die
// Ligaleitung (Vorgabe des Betreibers, 10.10.2026). Keine öffentlichen Links.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser, canUploadForTeam } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { uploadsZuBericht, UPLOAD_BUCKET } from '@/lib/server/report-uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, ctx: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await ctx.params;
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  const { data: report } = await supabaseAdmin.from('match_reports')
    .select('id, home_team_id, guest_team_id').eq('id', reportId).maybeSingle();
  if (!report) return NextResponse.json({ error: 'Spielbericht nicht gefunden.' }, { status: 404 });
  const darf = isAdminUser(auth.user)
    || (report.home_team_id ? canUploadForTeam(auth.user, report.home_team_id) : false)
    || (report.guest_team_id ? canUploadForTeam(auth.user, report.guest_team_id) : false);
  if (!darf) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });

  const rows = (await uploadsZuBericht(reportId)).filter(u => u.upload_status !== 'deleted' && u.storage_path);
  const fotos: { id: string; url: string }[] = [];
  for (const u of rows) {
    const { data } = await supabaseAdmin.storage.from(UPLOAD_BUCKET).createSignedUrl(u.storage_path, 900);
    if (data?.signedUrl) fotos.push({ id: u.id, url: data.signedUrl });
  }
  return NextResponse.json({ fotos });
}
