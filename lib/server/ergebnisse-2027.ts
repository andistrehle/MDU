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
import { berechneEinzel, rangliste, type EinzelBericht, type EinzelZeile } from '@/lib/einzelrangliste-2027';
import { bestOfFuerLiga, legsJeSpiel } from '@/lib/legs';

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
    const e = ergebnisAusBericht(row, legsJeSpiel(bestOfFuerLiga(team27(row.home_team_id)?.league)));
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

// ── Einzelrangliste 2026/27 ────────────────────────────────────
// Dieselben Berichte wie die Tabelle (zählend, zu einer Begegnung des Plans),
// aber mit Aufstellung, Einzelpartien und Highlights. Öffentlich gezeigt wird
// nur die Auswertung je Spieler (Name, Team, Bilanz) — wie bisher auf den
// Ranglisten, nie der Bericht selbst.

export interface Einzel27 {
  /** Rangliste je Liga (Liga des Teams beim letzten Einsatz) */
  jeLiga: Record<Liga27Code, EinzelZeile[]>;
  /** Zeile je Spieler-ID (für das Spielerprofil) */
  byPlayer: Record<string, EinzelZeile & { liga: Liga27Code }>;
}

export const ladeEinzel27 = cache(async (): Promise<Einzel27> => {
  const leer = { jeLiga: Object.fromEntries(LIGEN_2027.map(l => [l.code, []])) as unknown as Record<Liga27Code, EinzelZeile[]>, byPlayer: {} };
  if (!supabaseAdmin) return leer;
  const { byKey } = await ladeErgebnisse27();
  const zaehlend = Object.values(byKey).filter(e => !e.wertung);
  if (!zaehlend.length) return leer;
  const ids = zaehlend.map(e => e.reportId);

  const [rep, pl, gm] = await Promise.all([
    supabaseAdmin.from('match_reports').select('id, highlights').in('id', ids),
    supabaseAdmin.from('match_report_players').select('report_id, side, slot, name, player_id').in('report_id', ids),
    supabaseAdmin.from('match_report_games').select('report_id, game_type, home_slot, guest_slot, legs_home, legs_guest').in('report_id', ids),
  ]);
  const hl = new Map(((rep.data ?? []) as { id: string; highlights: EinzelBericht['highlights'] | null }[]).map(r => [r.id, r.highlights ?? []]));
  const byRep = <T extends { report_id: string }>(rows: T[]) => {
    const m = new Map<string, T[]>();
    for (const r of rows) (m.get(r.report_id) ?? m.set(r.report_id, []).get(r.report_id)!).push(r);
    return m;
  };
  const players = byRep((pl.data ?? []) as (EinzelBericht['players'][number] & { report_id: string })[]);
  const games = byRep((gm.data ?? []) as (EinzelBericht['games'][number] & { report_id: string })[]);

  const berichte: EinzelBericht[] = zaehlend.map(e => ({
    id: e.reportId, homeTeam: e.home, guestTeam: e.away, bestaetigt: e.bestaetigt, datum: e.datum,
    players: players.get(e.reportId) ?? [], games: games.get(e.reportId) ?? [], highlights: hl.get(e.reportId) ?? [],
  }));
  const alle = [...berechneEinzel(berichte).values()];
  const out: Einzel27 = { jeLiga: leer.jeLiga, byPlayer: {} };
  for (const l of LIGEN_2027) {
    const liste = rangliste(alle.filter(z => team27(z.teamId)?.league === l.code));
    out.jeLiga[l.code] = liste;
    for (const z of liste) if (z.playerId) out.byPlayer[z.playerId] = { ...z, liga: l.code };
  }
  return out;
});
