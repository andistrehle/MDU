// ============================================================
// Ergebnisse + Tabellen 2026/27 aus den Spielberichten (Server)
// ============================================================
//
// Spielberichte sind per RLS nur für die beiden Teams und die Ligaleitung
// lesbar — öffentlich angezeigt wird deshalb nur, was HIER (service_role)
// daraus gerechnet wird: Spielstand, Legs, Punkte, Bestätigt-Status. Keine
// Aufstellungen, keine Namen, keine Notizen.
//
// Gezählt werden nur Berichte zu einer Begegnung des Spielplans 2026/27
// (Heim + Gast wie im Plan). Was nicht passt, steht in `ohneBegegnung` —
// für die Ligaleitung, nie öffentlich.
//
// Neu gerechnet wird, wenn eine Seite neu gebaut wird: Nach jedem Einreichen,
// Bestätigen, Ändern oder Löschen ruft die Oberfläche /api/match-reports/
// published auf, das die betroffenen Seiten zum Neubau markiert.
// ============================================================

import 'server-only';
import { cache } from 'react';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NEUE_SAISON, LIGEN_2027, alleBegegnungen27, team27, type Liga27Code } from '@/lib/data/saison-2027';
import { berechneTabelle, ergebnisAusBericht, zaehlt, type Ergebnis27, type Rohbericht, type TabellenZeile } from '@/lib/tabelle-2027';

export interface Ergebnisse27 {
  /** Ergebnis je Begegnung (Heim|Gast) */
  byKey: Record<string, Ergebnis27>;
  /** Berichte ohne passende Begegnung (Kennungen) */
  ohneBegegnung: string[];
}

const COLS = 'id, home_team_id, guest_team_id, spiele_home, spiele_guest, legs_home, legs_guest, status, match_date';

export const ladeErgebnisse27 = cache(async (): Promise<Ergebnisse27> => {
  const leer: Ergebnisse27 = { byKey: {}, ohneBegegnung: [] };
  if (!supabaseAdmin) return leer;
  // `forfeit` gibt es erst ab Migration 0042 — vorher ohne lesen.
  let res = await supabaseAdmin.from('match_reports').select(`${COLS}, forfeit`).eq('season_id', NEUE_SAISON.id);
  if (res.error) res = await supabaseAdmin.from('match_reports').select(COLS).eq('season_id', NEUE_SAISON.id) as typeof res;
  if (res.error || !res.data) return leer;

  const keys = new Set(alleBegegnungen27().map(b => b.key));
  const out: Ergebnisse27 = { byKey: {}, ohneBegegnung: [] };
  for (const r of res.data as unknown as (Rohbericht & { forfeit?: string | null })[]) {
    const row: Rohbericht = { ...r, forfeit: r.forfeit ?? null };
    if (!row.home_team_id || !row.guest_team_id || !zaehlt(row)) continue;
    const e = ergebnisAusBericht(row);
    if (!keys.has(e.key)) { out.ohneBegegnung.push(row.id); continue; }
    out.byKey[e.key] = e;
  }
  return out;
});

const name = (id: string) => team27(id)?.name ?? id;

export async function tabelle27(code: Liga27Code): Promise<TabellenZeile[]> {
  const liga = LIGEN_2027.find(l => l.code === code);
  if (!liga) return [];
  const { byKey } = await ladeErgebnisse27();
  const teams = new Set(liga.teams);
  const ergebnisse = Object.values(byKey).filter(e => teams.has(e.home) && teams.has(e.away));
  return berechneTabelle(liga.teams, ergebnisse, name);
}

export async function alleTabellen27(): Promise<Record<Liga27Code, TabellenZeile[]>> {
  const out = {} as Record<Liga27Code, TabellenZeile[]>;
  for (const l of LIGEN_2027) out[l.code] = await tabelle27(l.code);
  return out;
}
