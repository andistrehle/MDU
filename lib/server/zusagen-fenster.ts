// ============================================================
// Termine eines Teams im Erinnerungsfenster (Glocke UND E-Mail)
// ============================================================
//
// MDU-Spiele aus dem Plan (saison-2027) plus eigene Termine (team_events,
// „Extern“) von heute bis heute + `tage`. Eine Quelle für /api/zusagen/offen
// (Glocke) und /api/cron/zusagen-mails (E-Mail), damit beide dasselbe rechnen.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { alleBegegnungen27, team27, terminKurz, wochenendeText, NEUE_SAISON } from '@/lib/data/saison-2027';
import { spieltagPfad } from '@/lib/spieltag';

export interface FensterTermin {
  key: string;
  datum: string;
  /** z. B. „Fr 23.10. · 20:00 · gegen Bullseye Buam“ */
  text: string;
  /** Pfad der Spiel-/Terminseite */
  pfad: string;
}

export const heuteBerlin = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());

export async function termineImFenster(teamId: string, tage: number): Promise<FensterTermin[]> {
  const heute = heuteBerlin();
  const bis = new Date(heute + 'T12:00:00Z'); bis.setUTCDate(bis.getUTCDate() + tage);
  const bisIso = bis.toISOString().slice(0, 10);
  const liste: FensterTermin[] = alleBegegnungen27()
    .filter(b => (b.home === teamId || b.away === teamId))
    .map(b => ({ b, datum: b.termin?.datum ?? b.fri }))
    .filter(x => x.datum >= heute && x.datum <= bisIso)
    .map(({ b, datum }) => {
      const heim = b.home === teamId;
      const gegner = team27(heim ? b.away : b.home)?.name ?? '';
      return {
        key: b.key, datum, pfad: spieltagPfad(teamId, b.key),
        text: `${b.termin ? terminKurz(b.termin) : `Wochenende ${wochenendeText(b.fri, b.sun, false)}`} · ${heim ? 'gegen' : 'bei'} ${gegner}`,
      };
    });
  // Eigene Termine (fehlt die Tabelle noch, bleibt es bei den MDU-Spielen).
  if (supabaseAdmin) {
    const { data: eigene } = await supabaseAdmin.from('team_events')
      .select('id, kind, title, opponent, is_home, event_date, start_time')
      .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).gte('event_date', heute).lte('event_date', bisIso);
    for (const e of (eigene ?? []) as { id: string; kind: string; title: string | null; opponent: string | null; is_home: boolean | null; event_date: string; start_time: string | null }[]) {
      const tag = terminKurz({ datum: e.event_date, uhrzeit: e.start_time ?? undefined });
      liste.push({ key: 'ext:' + e.id, datum: e.event_date, pfad: `/termin/${e.id}`,
        text: `${tag} · ${e.kind === 'spiel' ? `${e.is_home === false ? 'bei' : 'gegen'} ${e.opponent}` : e.title} (Extern)` });
    }
  }
  return liste.sort((a, z) => a.datum.localeCompare(z.datum));
}
