// ============================================================
// Wie werden die Spielberichte 2026/27 erfasst? (Admin → Erfassung)
// ============================================================
// Betreiber, 22.10.2026: Entscheidungshilfe für einen Live-Ticker. Je
// Begegnung mit Bericht einer von drei Wegen:
//   foto          — Bericht über den Foto-Upload angelegt (match_reports.source = 'ocr')
//   live          — erstes Spielergebnis VOR Spielende eingetippt
//   abgeschrieben — erstes Spielergebnis erst NACH Spielende (Zettel abgetippt)
// Spielende = Beginn + 3,5 h wie im Team Manager; ohne Uhrzeit gilt 20:00,
// ohne festen Termin der Freitag des Spielwochenendes.
//
// „Erstes Ergebnis“ kommt aus match_report_saves (Migration 0055): bevorzugt
// die auf dem Gerät gemerkte erste Eingabe, sonst die erste Speicherung mit
// Ergebnissen. Ohne Protokoll (Bericht älter als 0055) wird das Anlegen des
// Berichts genommen und die Zeile als „geschätzt“ markiert.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NEUE_SAISON, alleBegegnungen27, team27, type Liga27Code } from '@/lib/data/saison-2027';

export type Erfassungsweg = 'live' | 'foto' | 'abgeschrieben';

export interface ErfassungZeile {
  key: string;
  spieltag: number;
  liga: Liga27Code;
  heim: string;
  gast: string;
  /** Spielbeginn (ISO) */
  beginn: string;
  weg: Erfassungsweg;
  /** Kein Protokoll vorhanden — Weg aus dem Anlegen des Berichts geraten. */
  geschaetzt: boolean;
  /** Erste / letzte Ergebnis-Eingabe (ISO), soweit bekannt */
  erstes: string | null;
  letztes: string | null;
  /** Live-Modus (Großanzeige) war beim Speichern offen */
  liveModus: boolean;
  speicherungen: number;
  status: string;
}

export interface Erfassung {
  bereit: boolean;
  zeilen: ErfassungZeile[];
}

const SPIELDAUER_MS = 3.5 * 3600 * 1000;

/** Münchner Ortszeit → Zeitpunkt (berücksichtigt Sommer-/Winterzeit). */
function berlin(datum: string, uhrzeit: string): Date {
  const roh = new Date(`${datum}T${uhrzeit}:00Z`);
  const teile = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Berlin', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(roh).reduce<Record<string, string>>((a, p) => { a[p.type] = p.value; return a; }, {});
  const alsUtc = Date.UTC(+teile.year, +teile.month - 1, +teile.day, +teile.hour, +teile.minute);
  return new Date(roh.getTime() - (alsUtc - roh.getTime()));
}

interface Bericht { id: string; home_team_id: string; guest_team_id: string; source: string | null; status: string; created_at: string; match_date: string | null; forfeit?: string | null }
interface Speichern { report_id: string; saved_at: string; games_filled: number; live_mode: boolean; first_input_at: string | null; last_input_at: string | null }

export async function ladeErfassung(): Promise<Erfassung> {
  if (!supabaseAdmin) return { bereit: false, zeilen: [] };
  let res = await supabaseAdmin.from('match_reports').select('id, home_team_id, guest_team_id, source, status, created_at, match_date, forfeit').eq('season_id', NEUE_SAISON.id);
  if (res.error) res = await supabaseAdmin.from('match_reports').select('id, home_team_id, guest_team_id, source, status, created_at, match_date').eq('season_id', NEUE_SAISON.id) as typeof res;
  if (res.error) throw new Error(res.error.message);
  const berichte = ((res.data ?? []) as Bericht[]).filter(r => !r.forfeit);

  const sp = await supabaseAdmin.from('match_report_saves').select('report_id, saved_at, games_filled, live_mode, first_input_at, last_input_at')
    .in('report_id', berichte.map(b => b.id).concat('00000000-0000-0000-0000-000000000000'));
  const bereit = !sp.error;
  const jeBericht = new Map<string, Speichern[]>();
  for (const s of (sp.data ?? []) as Speichern[]) jeBericht.set(s.report_id, [...(jeBericht.get(s.report_id) ?? []), s]);

  const plan = new Map(alleBegegnungen27().map(b => [b.key, b]));
  const zeilen: ErfassungZeile[] = [];
  for (const r of berichte) {
    const b = plan.get(`${r.home_team_id}|${r.guest_team_id}`);
    if (!b) continue;
    const beginn = berlin(b.termin?.datum ?? r.match_date ?? b.fri, b.termin?.uhrzeit ?? '20:00');
    const saves = jeBericht.get(r.id) ?? [];
    const min = (l: (string | null)[]) => l.filter((x): x is string => !!x).sort()[0] ?? null;
    const max = (l: (string | null)[]) => l.filter((x): x is string => !!x).sort().at(-1) ?? null;
    const mitErgebnis = saves.filter(s => s.games_filled > 0);
    const erstes = min(saves.map(s => s.first_input_at)) ?? min(mitErgebnis.map(s => s.saved_at));
    const letztes = max(saves.map(s => s.last_input_at)) ?? max(mitErgebnis.map(s => s.saved_at));
    const geschaetzt = !erstes;
    const bezug = erstes ?? r.created_at;
    const weg: Erfassungsweg = r.source === 'ocr' ? 'foto'
      : new Date(bezug).getTime() < beginn.getTime() + SPIELDAUER_MS ? 'live' : 'abgeschrieben';
    zeilen.push({
      key: b.key, spieltag: b.spieltag, liga: b.liga,
      heim: team27(b.home)?.name ?? b.home, gast: team27(b.away)?.name ?? b.away,
      beginn: beginn.toISOString(), weg, geschaetzt: geschaetzt && r.source !== 'ocr',
      erstes, letztes, liveModus: saves.some(s => s.live_mode), speicherungen: saves.length, status: r.status,
    });
  }
  zeilen.sort((a, b) => b.spieltag - a.spieltag || a.beginn.localeCompare(b.beginn));
  return { bereit, zeilen };
}
