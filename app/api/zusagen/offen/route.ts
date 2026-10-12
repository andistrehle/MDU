// ============================================================
// GET /api/zusagen/offen — offene Zu-/Absagen des eingeloggten Spielers
// ============================================================
//
// Für die Glocke: Spiele des eigenen Teams im Erinnerungsfenster (vom Kapitän
// eingestellt, Vorgabe 7 Tage, 0 = aus), für die der Spieler noch weder zu-
// noch abgesagt hat. Ohne Zeitplan-Job: gerechnet wird beim Abruf. Die
// Begegnungen stehen im Code (saison-2027), deshalb hier auf dem Server statt
// im Browser-Paket der Glocke.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { zusagenFuerTeam } from '@/lib/features';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { alleBegegnungen27, team27, terminKurz, wochenendeText, NEUE_SAISON } from '@/lib/data/saison-2027';

export const dynamic = 'force-dynamic';

const VORGABE_TAGE = 7;
const DRINGEND_TAGE = 2;

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ offen: [] }, { status: auth.status });
  const teamId = auth.user.teamId;
  // Vorerst nur freigeschaltete Teams (lib/features.ts).
  if (!supabaseAdmin || !teamId || !zusagenFuerTeam(teamId)) return NextResponse.json({ offen: [] });

  const [{ data: profil }, { data: einst, error: einstErr }] = await Promise.all([
    supabaseAdmin.from('profiles').select('player_id').eq('id', auth.user.id).maybeSingle(),
    supabaseAdmin.from('team_availability_settings').select('reminder_days').eq('team_id', teamId).maybeSingle(),
  ]);
  const playerId = (profil as { player_id?: string | null } | null)?.player_id;
  // Migration 0043 noch nicht da → still nichts melden.
  if (!playerId || (einstErr && einstErr.code === '42P01')) return NextResponse.json({ offen: [] });
  const tage = (einst as { reminder_days?: number } | null)?.reminder_days ?? VORGABE_TAGE;
  if (tage <= 0) return NextResponse.json({ offen: [] });

  const heute = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
  const bis = new Date(heute + 'T12:00:00Z'); bis.setUTCDate(bis.getUTCDate() + tage);
  const bisIso = bis.toISOString().slice(0, 10);
  const spiele = alleBegegnungen27()
    .filter(b => (b.home === teamId || b.away === teamId))
    .map(b => ({ b, datum: b.termin?.datum ?? b.fri }))
    .filter(x => x.datum >= heute && x.datum <= bisIso);
  if (!spiele.length) return NextResponse.json({ offen: [] });

  const { data: antworten, error } = await supabaseAdmin.from('match_availability')
    .select('match_key').eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).eq('player_id', playerId)
    .in('match_key', spiele.map(x => x.b.key));
  if (error) return NextResponse.json({ offen: [] });
  const beantwortet = new Set(((antworten ?? []) as { match_key: string }[]).map(a => a.match_key));

  const offen = spiele.filter(x => !beantwortet.has(x.b.key)).sort((a, z) => a.datum.localeCompare(z.datum)).map(({ b, datum }) => {
    const heim = b.home === teamId;
    const gegner = team27(heim ? b.away : b.home)?.name ?? '';
    const tageBis = Math.round((Date.parse(datum + 'T12:00:00Z') - Date.parse(heute + 'T12:00:00Z')) / 864e5);
    return {
      key: b.key,
      text: `${b.termin ? terminKurz(b.termin) : `Wochenende ${wochenendeText(b.fri, b.sun, false)}`} · ${heim ? 'gegen' : 'bei'} ${gegner}`,
      dringend: tageBis <= DRINGEND_TAGE,
    };
  });
  return NextResponse.json({ offen }, { headers: { 'Cache-Control': 'no-store' } });
}
