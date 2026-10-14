// Spielplan eines Teams als abonnierbarer Kalender: /kalender/<team-id>.ics
// Statisch beim Build erzeugt (je Team eine Datei), Aufbau in lib/kalender-ics.ts.
// Freigeschaltete Teams (Team Manager) bekommen ihre eigenen Termine dazu;
// nach jeder Änderung markiert /api/termine/geaendert genau diese Datei.
import { alleTeams27, NEUE_SAISON } from '@/lib/data/saison-2027';
import { teamKalender } from '@/lib/kalender-ics';
import { zusagenFuerTeam } from '@/lib/features';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { TeamTermin } from '@/lib/supabase/termine';

async function eigeneTermine(teamId: string): Promise<TeamTermin[]> {
  if (!supabaseAdmin || !zusagenFuerTeam(teamId)) return [];
  const { data, error } = await supabaseAdmin.from('team_events')
    .select('id, team_id, kind, title, league, opponent, is_home, event_date, start_time, end_time, venue, address')
    .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId);
  return error ? [] : (data ?? []) as TeamTermin[];
}

export const dynamicParams = false;

export function generateStaticParams() {
  return alleTeams27().map(t => ({ datei: `${t.id}.ics` }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ datei: string }> }) {
  const { datei } = await params;
  const teamId = datei.replace(/\.ics$/, '');
  const ics = teamKalender(teamId, new Date(), await eigeneTermine(teamId));
  if (!ics) return new Response('Unbekanntes Team', { status: 404 });
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${datei}"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
