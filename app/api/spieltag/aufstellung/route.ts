// ============================================================
// GET /api/spieltag/aufstellung?spiel=<Heim|Gast>
// ============================================================
//
// Für den Spielbericht: die im Team Manager hinterlegten Aufstellungen BEIDER
// Teams einer Begegnung (match_team_details.lineup, Migration 0045), damit
// das Formular H1–H8 / G1–G8 übernehmen kann. Die Aufstellung des Gegners
// ist per RLS nur für dessen Team lesbar — deshalb hier über service_role,
// aber NUR für die TCs der beiden beteiligten Teams (bzw. die Ligaleitung) —
// und nur, wenn das EIGENE Team den Team Manager hat (Premium, lib/features.ts;
// vom Betreiber am 14.10.2026 so festgelegt, gilt auch für die Ligaleitung).
// Hat ein Team nichts hinterlegt (oder den Team Manager nicht), kommt null.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { zusagenFuerTeam } from '@/lib/features';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { alleBegegnungen27, NEUE_SAISON } from '@/lib/data/saison-2027';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!zusagenFuerTeam(auth.user.teamId)) return NextResponse.json({ error: 'Nur mit Team Manager.' }, { status: 403 });
  const key = new URL(request.url).searchParams.get('spiel') ?? '';
  const b = alleBegegnungen27().find(x => x.key === key);
  if (!b) return NextResponse.json({ error: 'Unbekannte Begegnung.' }, { status: 400 });
  const beteiligt = auth.user.role === 'team_captain' && (auth.user.teamId === b.home || auth.user.teamId === b.away);
  if (!isAdminUser(auth.user) && !beteiligt) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ home: null, guest: null });

  const { data, error } = await supabaseAdmin.from('match_team_details').select('team_id, lineup')
    .eq('season_id', NEUE_SAISON.id).eq('match_key', key).in('team_id', [b.home, b.away]);
  if (error) return NextResponse.json({ home: null, guest: null });
  const von = (team: string) => {
    const l = ((data ?? []) as { team_id: string; lineup: string[] | null }[]).find(r => r.team_id === team)?.lineup ?? [];
    return l.some(Boolean) ? l : null;
  };
  return NextResponse.json({ home: von(b.home), guest: von(b.away) }, { headers: { 'Cache-Control': 'no-store' } });
}
