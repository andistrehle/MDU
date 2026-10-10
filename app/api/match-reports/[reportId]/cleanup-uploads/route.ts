// ============================================================
// Route Handler: Upload-Originale löschen (Ligaleitung; früher nach Bestätigung)
// ============================================================
//
// POST /api/match-reports/[reportId]/cleanup-uploads
// Löscht die hochgeladenen Original-Fotos/PDF eines Spielberichts, sobald dieser
// bestätigt ist (status='confirmed') — Umsetzung der Datenschutz-Zusage
// Seit 10.10.2026 bleiben die Fotos bis Saisonende (lib/ocr/aufbewahrung.ts);
// Kapitäne lösen hier nichts mehr aus, nur die Ligaleitung. Storage-Löschung nur
// serverseitig (privater Bucket, service_role). Idempotent.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser, canUploadForTeam } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { uploadsZuBericht, loescheUploads } from '@/lib/server/report-uploads';
import { FOTOS_AUFBEWAHREN } from '@/lib/ocr/aufbewahrung';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function POST(request: Request, ctx: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await ctx.params;

  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  const { data: report } = await supabaseAdmin
    .from('match_reports')
    .select('id, status, home_captain_user_id, home_team_id, guest_team_id')
    .eq('id', reportId).maybeSingle();
  if (!report) return NextResponse.json({ error: 'Spielbericht nicht gefunden.' }, { status: 404 });

  // Eigentümer-/Rollenprüfung: nur der erfassende Kapitän, ein Kapitän der
  // beteiligten Teams oder Admin/Ligaleitung darf die Originale löschen (REV-014).
  const owns = report.home_captain_user_id === auth.user.id
    || (report.home_team_id ? canUploadForTeam(auth.user, report.home_team_id) : false)
    || (report.guest_team_id ? canUploadForTeam(auth.user, report.guest_team_id) : false)
    || isAdminUser(auth.user);
  if (!owns) return NextResponse.json({ error: 'Keine Berechtigung für diesen Spielbericht.' }, { status: 403 });

  // Aufräumen erlaubt, wenn der Bericht bestätigt ist (regulärer Fall) ODER der
  // Aufrufer Admin/Ligaleitung ist (z. B. vor dem Löschen eines Berichts).
  if (report.status !== 'confirmed' && !isAdminUser(auth.user)) {
    return NextResponse.json({ status: 'skipped', reason: 'not_confirmed' }, { status: 200 });
  }

  // Werden die Fotos bis Saisonende aufbewahrt (lib/ocr/aufbewahrung.ts), löscht
  // die Bestätigung nichts mehr — nur die Ligaleitung (Bericht löschen,
  // Aufräumen am Saisonende).
  if (FOTOS_AUFBEWAHREN && !isAdminUser(auth.user)) {
    return NextResponse.json({ status: 'kept', reason: 'retained_until_season_end' }, { status: 200 });
  }

  const { deleted, error } = await loescheUploads(await uploadsZuBericht(reportId));
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ status: 'cleaned', deleted }, { status: 200 });
}
