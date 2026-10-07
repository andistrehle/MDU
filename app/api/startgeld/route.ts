// ============================================================
// Route Handler: Startgeld eines Teams (Kapitän des Teams oder Ligaleitung)
// ============================================================
//
// GET /api/startgeld?team=<teamId>  (Authorization: Bearer <access token>)
//
// Warum auf dem Server: Der Satz einer Nachmeldung hängt am Tag der MELDUNG
// (player_nominations.created_at). Die Tabelle dürfen Kapitäne per RLS nur für
// Meldungen lesen, die sie selbst abgeschickt haben — bei zwei Kapitänskonten
// fehlte dem einen das Datum, und der Betrag wäre falsch. Hier liest der
// service_role-Client alles; ausgeliefert wird nur das Ergebnis.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authenticateRequest, canSeeTeamFee } from '@/lib/server/auth';
import { nominatedRosterRows } from '@/lib/supabase/season-teams';
import { computeTeamFee, feeBreakdown, openAmount, type FeeMember } from '@/lib/startgeld';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const teamId = new URL(request.url).searchParams.get('team') ?? '';
  if (!teamId) return NextResponse.json({ error: 'Team fehlt.' }, { status: 400 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase ist nicht konfiguriert.' }, { status: 503 });

  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!canSeeTeamFee(auth.user, teamId)) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });

  // Neueste Saison des Teams (wie getCaptainTeamView).
  const { data: sta } = await supabaseAdmin.from('season_team_assignments')
    .select('season_id, seasons:season_id(name)').eq('team_id', teamId)
    .order('season_id', { ascending: false }).limit(1);
  const top = (sta ?? [])[0] as unknown as { season_id: string; seasons: { name: string } | null } | undefined;
  if (!top) return NextResponse.json({ error: 'Team in keiner Saison gefunden.' }, { status: 404 });
  const seasonId = top.season_id;

  const { data: roster } = await supabaseAdmin.from('season_roster_assignments')
    .select('first_name, last_name, player_id').eq('season_id', seasonId).eq('team_id', teamId);
  const rrows = ((roster ?? []) as { first_name: string | null; last_name: string | null; player_id: string | null }[])
    .filter(r => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim());
  const noms = await nominatedRosterRows(supabaseAdmin, seasonId, rrows.map(r => r.player_id), teamId);
  const members: FeeMember[] = [
    ...rrows.map(() => ({})),
    ...noms.map(n => ({ isNomination: true, nominatedAt: n.nominated_at })),
  ];
  const fee = computeTeamFee(seasonId, members);

  // paid_amount gibt es erst nach Migration 0041 — vorher ohne lesen.
  const withAmount = await supabaseAdmin.from('season_team_payments')
    .select('paid, paid_amount').eq('season_id', seasonId).eq('team_id', teamId).maybeSingle();
  const pay = withAmount.error
    ? (await supabaseAdmin.from('season_team_payments').select('paid').eq('season_id', seasonId).eq('team_id', teamId).maybeSingle()).data
    : withAmount.data;
  const p = pay as { paid?: boolean; paid_amount?: number | null } | null;
  const paid = !!p?.paid;
  const paidAmount = p?.paid_amount ?? null;

  return NextResponse.json({
    seasonId, seasonName: top.seasons?.name ?? null,
    fee, breakdown: feeBreakdown(fee),
    paid, paidAmount, open: openAmount(fee.total, paid, paidAmount),
  });
}
