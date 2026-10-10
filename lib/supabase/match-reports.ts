// ============================================================
// Spielberichte (4er-Bogen) — Datenzugriff + Auto-Berechnung
// ============================================================
//
// Online-Erfassung des MDU 4er-Spielberichtsbogens. 18 Spiele in fester
// offizieller Reihenfolge (16 Einzel + 2 Doppel in der Mitte). Das System
// berechnet aus den Leg-Ergebnissen Spiele/Legs/Mannschaftspunkte sowie die
// Einzelspieler-Punkte (nur Einzel). RLS in der DB (Migration 0012).
// ============================================================

import { supabase } from './client';
import { pointsForLegs, bestOfFuerLiga, legsJeSpiel } from '@/lib/legs';

export type ReportStatus = 'draft' | 'submitted' | 'confirmed' | 'changes_requested';

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  draft: 'Entwurf', submitted: 'Eingereicht', confirmed: 'Vom Gegner bestätigt', changes_requested: 'Änderung angefordert',
};

/** Feste Spielreihenfolge des MDU 4er-Bogens. Doppel (9/10) in der Mitte. */
export interface ScheduleEntry {
  no: number;
  type: 'single' | 'double';
  /** Standard-Positionen (Slot 1..4) für Einzel; bei Doppel frei wählbar. */
  homeSlot?: number;
  guestSlot?: number;
  round: string;
}

export const GAME_SCHEDULE: ScheduleEntry[] = [
  { no: 1, type: 'single', homeSlot: 1, guestSlot: 1, round: '1. Einzel-Runde' },
  { no: 2, type: 'single', homeSlot: 2, guestSlot: 2, round: '1. Einzel-Runde' },
  { no: 3, type: 'single', homeSlot: 3, guestSlot: 3, round: '1. Einzel-Runde' },
  { no: 4, type: 'single', homeSlot: 4, guestSlot: 4, round: '1. Einzel-Runde' },
  { no: 5, type: 'single', homeSlot: 1, guestSlot: 2, round: '2. Einzel-Runde' },
  { no: 6, type: 'single', homeSlot: 2, guestSlot: 1, round: '2. Einzel-Runde' },
  { no: 7, type: 'single', homeSlot: 3, guestSlot: 4, round: '2. Einzel-Runde' },
  { no: 8, type: 'single', homeSlot: 4, guestSlot: 3, round: '2. Einzel-Runde' },
  { no: 9, type: 'double', round: 'Doppel (Mitte)' },
  { no: 10, type: 'single', homeSlot: 1, guestSlot: 3, round: '3. Einzel-Runde' },
  { no: 11, type: 'single', homeSlot: 2, guestSlot: 4, round: '3. Einzel-Runde' },
  { no: 12, type: 'single', homeSlot: 3, guestSlot: 1, round: '3. Einzel-Runde' },
  { no: 13, type: 'single', homeSlot: 4, guestSlot: 2, round: '3. Einzel-Runde' },
  { no: 14, type: 'single', homeSlot: 1, guestSlot: 4, round: '4. Einzel-Runde' },
  { no: 15, type: 'single', homeSlot: 2, guestSlot: 3, round: '4. Einzel-Runde' },
  { no: 16, type: 'single', homeSlot: 3, guestSlot: 2, round: '4. Einzel-Runde' },
  { no: 17, type: 'single', homeSlot: 4, guestSlot: 1, round: '4. Einzel-Runde' },
  { no: 18, type: 'double', round: 'Doppel (Ende)' },
];

/** Highlight-Typen für die Einzelstatistik. */
export type HighlightType = '180' | '171' | 'high_finish' | 'short_leg';
export const HIGHLIGHT_TYPES: HighlightType[] = ['180', '171', 'high_finish', 'short_leg'];
export const HIGHLIGHT_TYPE_LABELS: Record<HighlightType, string> = {
  '180': '180er', '171': '171er', high_finish: 'High Finish', short_leg: 'Short Leg',
};
/**
 * Wertfeld je Highlight-Typ:
 *   180/171     → Anzahl
 *   high_finish → Checkout (100–180), freie Eingabe
 *   short_leg   → Darts (9–20), je Short Leg ein eigener Eintrag
 */
export const HIGHLIGHT_VALUE_CONFIG: Record<HighlightType, { label: string; min: number; max: number; isCount: boolean }> = {
  '180':       { label: 'Anzahl',   min: 1,   max: 99,  isCount: true },
  '171':       { label: 'Anzahl',   min: 1,   max: 99,  isCount: true },
  high_finish: { label: 'Checkout', min: 100, max: 180, isCount: false },
  short_leg:   { label: 'Darts',    min: 9,   max: 20,  isCount: false },
};

export interface HighlightEntry {
  side: 'home' | 'guest';
  slot: number;
  type: HighlightType;
  value: number | null;
}

// Leg-Ergebnisse und Einzelpunkte (Best of 3 / La Liga Best of 5): lib/legs.ts
export { LEG_RESULTS_BO3, LEG_RESULTS_BO5, legResults, bestOfFuerLiga, pointsForLegs, type LegResult, type BestOf } from '@/lib/legs';

export interface ReportPlayer {
  side: 'home' | 'guest';
  slot: number;
  pass_no: string | null;
  name: string;
  player_id: string | null;
  points: number;
}

export interface ReportGame {
  game_no: number;
  game_type: 'single' | 'double';
  home_slot: number | null;
  guest_slot: number | null;
  home_slot2: number | null;
  guest_slot2: number | null;
  legs_home: number | null;
  legs_guest: number | null;
}

export interface MatchReport {
  id: string;
  season_id: string | null;
  league_label: string | null;
  matchday: number | null;
  match_date: string | null;
  venue: string | null;
  home_team_id: string | null;
  guest_team_id: string | null;
  home_team_name: string;
  guest_team_name: string;
  tc_home: string | null;
  tc_guest: string | null;
  home_captain_user_id: string;
  spiele_home: number | null;
  spiele_guest: number | null;
  legs_home: number | null;
  legs_guest: number | null;
  points_home: number | null;
  points_guest: number | null;
  protest: boolean;
  protest_note: string | null;
  highlights_home: string | null;
  highlights_guest: string | null;
  highlights: HighlightEntry[] | null;
  status: ReportStatus;
  /** Bestätigendes Team (Migration 0042); fehlt = Gastteam wie früher. */
  confirm_team_id?: string | null;
  /** Wertung durch die Ligaleitung (Migration 0042). */
  forfeit?: 'home_no_show' | 'guest_no_show' | 'no_report' | null;
  review_note: string | null;
  reviewed_at: string | null;
  guest_change_note: string | null;
  guest_responded_at: string | null;
  guest_response_user_id: string | null;
  proposed_changes: ReportGame[] | null;
  proposal_base: ReportGame[] | null;
  proposed_by: string | null;
  proposed_at: string | null;
  negotiation_rounds: number;
  created_at: string;
  updated_at: string;
}

export interface ReportTotals {
  spieleHome: number; spieleGuest: number;
  legsHome: number; legsGuest: number;
  pointsHome: number; pointsGuest: number;
  /** slot → points, je Seite (nur Einzel) */
  homePlayerPoints: Record<number, number>;
  guestPlayerPoints: Record<number, number>;
}

/** Berechnet Ergebnis + Spielerpunkte aus den eingetragenen Spielen. */
export function computeTotals(games: ReportGame[]): ReportTotals {
  let spieleHome = 0, spieleGuest = 0, legsHome = 0, legsGuest = 0;
  const homePlayerPoints: Record<number, number> = {};
  const guestPlayerPoints: Record<number, number> = {};

  for (const g of games) {
    if (g.legs_home == null || g.legs_guest == null) continue;
    legsHome += g.legs_home; legsGuest += g.legs_guest;
    if (g.legs_home > g.legs_guest) spieleHome++;
    else if (g.legs_guest > g.legs_home) spieleGuest++;

    // Einzelspieler-Punkte nur für Einzel
    if (g.game_type === 'single') {
      if (g.home_slot != null) homePlayerPoints[g.home_slot] = (homePlayerPoints[g.home_slot] ?? 0) + pointsForLegs(g.legs_home, g.legs_guest);
      if (g.guest_slot != null) guestPlayerPoints[g.guest_slot] = (guestPlayerPoints[g.guest_slot] ?? 0) + pointsForLegs(g.legs_guest, g.legs_home);
    }
  }
  const pointsHome = spieleHome > spieleGuest ? 3 : spieleHome === spieleGuest ? 1 : 0;
  const pointsGuest = spieleGuest > spieleHome ? 3 : spieleHome === spieleGuest ? 1 : 0;
  return { spieleHome, spieleGuest, legsHome, legsGuest, pointsHome, pointsGuest, homePlayerPoints, guestPlayerPoints };
}

export interface PlayerRankingRow {
  side: 'home' | 'guest';
  slot: number;
  name: string;
  team: string;
  singles: number;
  wins: number;
  losses: number;
  legsWon: number;
  legsLost: number;
  points: number;
}

/**
 * Einzelranglisten-Auswertung — pro tatsächlich eingesetztem Spieler (Slot),
 * nur Einzelspiele, reproduzierbar aus den gespeicherten Spielen.
 */
export function computePlayerRanking(
  games: ReportGame[], players: ReportPlayer[], homeTeam: string, guestTeam: string,
): PlayerRankingRow[] {
  const map = new Map<string, PlayerRankingRow>();
  const ensure = (side: 'home' | 'guest', slot: number): PlayerRankingRow => {
    const key = side + slot;
    let r = map.get(key);
    if (!r) {
      const p = players.find(x => x.side === side && x.slot === slot);
      r = { side, slot, name: p?.name?.trim() || `${side === 'home' ? 'H' : 'G'}${slot}`,
        team: side === 'home' ? homeTeam : guestTeam, singles: 0, wins: 0, losses: 0, legsWon: 0, legsLost: 0, points: 0 };
      map.set(key, r);
    }
    return r;
  };
  for (const g of games) {
    if (g.game_type !== 'single' || g.legs_home == null || g.legs_guest == null) continue;
    if (g.home_slot != null) {
      const r = ensure('home', g.home_slot);
      r.singles++; r.legsWon += g.legs_home; r.legsLost += g.legs_guest;
      if (g.legs_home > g.legs_guest) r.wins++; else r.losses++;
      r.points += pointsForLegs(g.legs_home, g.legs_guest);
    }
    if (g.guest_slot != null) {
      const r = ensure('guest', g.guest_slot);
      r.singles++; r.legsWon += g.legs_guest; r.legsLost += g.legs_home;
      if (g.legs_guest > g.legs_home) r.wins++; else r.losses++;
      r.points += pointsForLegs(g.legs_guest, g.legs_home);
    }
  }
  return [...map.values()]
    .filter(r => r.singles > 0)
    .sort((a, b) => a.side !== b.side
      ? (a.side === 'home' ? -1 : 1)
      : (b.points - a.points) || ((b.legsWon - b.legsLost) - (a.legsWon - a.legsLost)));
}

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

export type ReportHeaderDraft = Pick<MatchReport,
  'season_id' | 'league_label' | 'matchday' | 'match_date' | 'venue' |
  'home_team_id' | 'guest_team_id' | 'home_team_name' | 'guest_team_name' |
  'tc_home' | 'tc_guest' | 'protest' | 'protest_note' | 'highlights'> & {
  /** Team, das bestätigt — immer das andere als das eintragende (Migration 0042). */
  confirm_team_id?: string | null;
};

/** Verständliche Meldung für DB-Fehler beim Speichern. */
function speicherFehler(msg: string): string {
  if (/match_reports_fixture_uq|duplicate key/i.test(msg)) {
    return 'Für diese Begegnung gibt es schon einen Spielbericht. Du findest ihn unter „Meine Spielberichte" — oder der Gegner hat ihn bereits eingetragen.';
  }
  return msg;
}

/** Spalten, die erst Migration 0042 anlegt: Fehlen sie noch, ohne sie speichern. */
const ohne0042 = <T extends Record<string, unknown>>(row: T) => { const { confirm_team_id: _c, ...rest } = row; void _c; return rest; };

// ── Lesen ──────────────────────────────────────────────────────

/** Welches Team bestätigt diesen Bericht? (das andere als das eintragende) */
export const bestaetigendesTeam = (r: Pick<MatchReport, 'confirm_team_id' | 'guest_team_id'>) => r.confirm_team_id ?? r.guest_team_id;

export async function listMyReports(): Promise<MatchReport[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('match_reports').select('*').order('created_at', { ascending: false });
  return (data ?? []) as MatchReport[];
}

export async function listAllReports(): Promise<MatchReport[]> {
  return listMyReports(); // RLS entscheidet (Admin sieht alle)
}

export async function getReport(id: string): Promise<MatchReport | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('match_reports').select('*').eq('id', id).maybeSingle();
  return (data as MatchReport) ?? null;
}

export async function getReportPlayers(reportId: string): Promise<ReportPlayer[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('match_report_players').select('*').eq('report_id', reportId).order('side').order('slot');
  return (data ?? []) as ReportPlayer[];
}

export async function getReportGames(reportId: string): Promise<ReportGame[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('match_report_games').select('*').eq('report_id', reportId).order('game_no');
  return (data ?? []) as ReportGame[];
}

export interface ReportHistoryEntry {
  id: string;
  report_id: string;
  action: string;
  actor_user_id: string | null;
  note: string | null;
  created_at: string;
}

export const HISTORY_ACTION_LABELS: Record<string, string> = {
  submitted: 'Eingereicht',
  confirmed: 'Vom Gegner bestätigt',
  changes_requested: 'Änderung angefordert',
  admin_changed: 'Von der Ligaleitung geändert',
  escalated: 'An Ligaleitung eskaliert',
};

export async function getReportHistory(reportId: string): Promise<ReportHistoryEntry[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('match_report_history')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: true });
  return (data ?? []) as ReportHistoryEntry[];
}

// ── Schreiben ──────────────────────────────────────────────────

/** Legt einen Bericht (Entwurf) an inkl. Aufstellung + Spiele. */
export async function createReport(
  header: ReportHeaderDraft, players: ReportPlayer[], games: ReportGame[],
): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: NOT_CONFIGURED };
  const totals = computeTotals(games);
  const row = {
    ...header, status: 'draft',
    spiele_home: totals.spieleHome, spiele_guest: totals.spieleGuest,
    legs_home: totals.legsHome, legs_guest: totals.legsGuest,
    points_home: totals.pointsHome, points_guest: totals.pointsGuest,
  };
  let { data, error } = await supabase.from('match_reports').insert(row).select('id').maybeSingle();
  if (error && /confirm_team_id/.test(error.message)) ({ data, error } = await supabase.from('match_reports').insert(ohne0042(row)).select('id').maybeSingle());
  if (error || !data) return { id: null, error: speicherFehler(error?.message ?? 'Anlegen fehlgeschlagen.') };
  const id = (data as { id: string }).id;
  const perr = await replaceChildren(id, players, games, totals);
  return { id, error: perr };
}

export async function updateReport(
  id: string, header: Partial<ReportHeaderDraft>, players: ReportPlayer[], games: ReportGame[],
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const totals = computeTotals(games);
  const row = {
    ...header,
    spiele_home: totals.spieleHome, spiele_guest: totals.spieleGuest,
    legs_home: totals.legsHome, legs_guest: totals.legsGuest,
    points_home: totals.pointsHome, points_guest: totals.pointsGuest,
  };
  let { error } = await supabase.from('match_reports').update(row).eq('id', id);
  if (error && /confirm_team_id/.test(error.message)) ({ error } = await supabase.from('match_reports').update(ohne0042(row)).eq('id', id));
  if (error) return { error: speicherFehler(error.message) };
  const childErr = await replaceChildren(id, players, games, totals);
  // Ein schon eingereichter Bericht zählt bereits — geänderte Zahlen neu anzeigen.
  if (!childErr) void ergebnisSeitenNeuBauen();
  return { error: childErr };
}

async function replaceChildren(reportId: string, players: ReportPlayer[], games: ReportGame[], totals: ReportTotals): Promise<string | null> {
  if (!supabase) return NOT_CONFIGURED;
  await supabase.from('match_report_players').delete().eq('report_id', reportId);
  await supabase.from('match_report_games').delete().eq('report_id', reportId);

  const playerRows = players
    .filter(p => p.name.trim())
    .map(p => ({
      report_id: reportId, side: p.side, slot: p.slot, pass_no: p.pass_no || null,
      name: p.name.trim(), player_id: p.player_id && !p.player_id.startsWith('name:') ? p.player_id : null,
      points: (p.side === 'home' ? totals.homePlayerPoints[p.slot] : totals.guestPlayerPoints[p.slot]) ?? 0,
    }));
  if (playerRows.length) {
    const { error } = await supabase.from('match_report_players').insert(playerRows);
    if (error) return error.message;
  }

  const gameRows = games.map(g => ({
    report_id: reportId, game_no: g.game_no, game_type: g.game_type,
    home_slot: g.home_slot, guest_slot: g.guest_slot, home_slot2: g.home_slot2, guest_slot2: g.guest_slot2,
    legs_home: g.legs_home, legs_guest: g.legs_guest,
  }));
  const { error: gerr } = await supabase.from('match_report_games').insert(gameRows);
  return gerr?.message ?? null;
}

/**
 * Ergebnis-Seiten (Tabellen, Ergebnisse, Spielplan, Liga- und Teamseiten) zum
 * Neubau markieren — nach jeder Änderung, die das Ergebnis betrifft. Schlägt
 * es fehl, holen die Seiten den Stand spätestens beim nächsten Neubau nach.
 */
export async function ergebnisSeitenNeuBauen(): Promise<void> {
  if (!supabase || typeof window === 'undefined') return;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    await fetch('/api/match-reports/published', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch { /* nicht kritisch */ }
}

export async function submitReport(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('match_reports').update({ status: 'submitted' }).eq('id', id);
  if (!error) void ergebnisSeitenNeuBauen();
  return { error: error?.message ?? null };
}

/** Admin: Bericht löschen (Kinder via Cascade). */
export async function deleteReport(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('match_reports').delete().eq('id', id);
  if (!error) void ergebnisSeitenNeuBauen();
  return { error: error?.message ?? null };
}

/** Admin: Kapitäne über Änderung/Löschung benachrichtigen (RPC, security definer). */
export async function notifyReportChange(id: string, action: 'changed' | 'deleted'): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('notify_report_change', { p_report_id: id, p_action: action });
}

/** Gast-Kapitän schickt einen konkreten Änderungsvorschlag (Spiel-Ergebnisse) mit. */
const slimGame = (g: ReportGame) => ({
  game_no: g.game_no, game_type: g.game_type,
  home_slot: g.home_slot, guest_slot: g.guest_slot, home_slot2: g.home_slot2, guest_slot2: g.guest_slot2,
  legs_home: g.legs_home, legs_guest: g.legs_guest,
});

export async function submitGuestProposal(id: string, games: ReportGame[], base: ReportGame[], note: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: auth } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const { data: rep } = await supabase.from('match_reports').select('negotiation_rounds').eq('id', id).maybeSingle();
  const rounds = (((rep as { negotiation_rounds?: number } | null)?.negotiation_rounds) ?? 0) + 1;
  const { error } = await supabase.from('match_reports').update({
    proposed_changes: games.map(slimGame), proposal_base: base.map(slimGame),
    proposed_by: auth.user?.id ?? null, proposed_at: now,
    guest_change_note: note, status: 'changes_requested', guest_responded_at: now, guest_response_user_id: auth.user?.id ?? null,
    negotiation_rounds: rounds,
  }).eq('id', id);
  return { error: error?.message ?? null };
}

/** Vorschlag zurücksetzen (z. B. nachdem der Heim-Kapitän ihn übernommen/abgelehnt hat). */
export async function clearProposal(id: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('match_reports').update({ proposed_changes: null, proposed_by: null, proposed_at: null }).eq('id', id);
}

/** Gast-Kapitän bestätigt den Spielbericht. */
export async function confirmReport(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('match_reports').update({
    status: 'confirmed', guest_responded_at: new Date().toISOString(), guest_response_user_id: auth.user?.id ?? null,
    proposed_changes: null, proposal_base: null, proposed_by: null, proposed_at: null,
  }).eq('id', id);
  if (!error) void ergebnisSeitenNeuBauen();
  return { error: error?.message ?? null };
}

/** Gast-Kapitän fordert eine Änderung an (Ergebnis bleibt vorerst bestehen). */
export async function requestReportChange(id: string, note: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('match_reports').update({
    status: 'changes_requested', guest_change_note: note,
    guest_responded_at: new Date().toISOString(), guest_response_user_id: auth.user?.id ?? null,
  }).eq('id', id);
  return { error: error?.message ?? null };
}

// ── Wertung durch die Ligaleitung (Nichtantritt / kein Spielbericht) ──

export type Wertung = 'home_no_show' | 'guest_no_show' | 'no_report';
export const WERTUNG_LABELS: Record<Wertung, string> = {
  home_no_show: 'Heimteam nicht angetreten',
  guest_no_show: 'Gastteam nicht angetreten',
  no_report: 'Kein Spielbericht (Heimteam verliert)',
};

/**
 * Admin: Begegnung werten statt spielen (Spielbedingungen Ziffer 11).
 * Nichtantritt: 0:3 Punkte / 0:18 Spiele, dem nicht angetretenen Team −3
 * (Abzug rechnet lib/tabelle-2027.ts aus `forfeit`). Kein Bericht bis
 * Dienstag 24 Uhr: Heimteam verliert 0:3 / 0:18. Als bestätigt angelegt —
 * es gibt nichts zu bestätigen. Beide Kapitäne werden benachrichtigt.
 */
export async function setzeWertung(b: {
  seasonId: string; leagueLabel: string; matchday: number; date: string;
  homeId: string; homeName: string; guestId: string; guestName: string;
}, wertung: Wertung): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: auth } = await supabase.auth.getUser();
  const homeVerliert = wertung !== 'guest_no_show';
  const legs = 18 * legsJeSpiel(bestOfFuerLiga(b.leagueLabel)); // La Liga: 18 × 3:0
  const { data, error } = await supabase.from('match_reports').insert({
    season_id: b.seasonId, league_label: b.leagueLabel, matchday: b.matchday, match_date: b.date,
    home_team_id: b.homeId, guest_team_id: b.guestId, home_team_name: b.homeName, guest_team_name: b.guestName,
    home_captain_user_id: auth.user?.id, status: 'confirmed', forfeit: wertung,
    spiele_home: homeVerliert ? 0 : 18, spiele_guest: homeVerliert ? 18 : 0,
    legs_home: homeVerliert ? 0 : legs, legs_guest: homeVerliert ? legs : 0,
    points_home: homeVerliert ? 0 : 3, points_guest: homeVerliert ? 3 : 0,
    protest: false, review_note: `Wertung: ${WERTUNG_LABELS[wertung]}`,
  }).select('id').maybeSingle();
  if (error) {
    if (/forfeit/.test(error.message)) return { error: 'Die Datenbank kennt die Wertung noch nicht — bitte zuerst Migration 0042 einspielen.' };
    if (/match_reports_fixture_uq|duplicate key/i.test(error.message)) return { error: 'Für diese Begegnung gibt es schon einen Spielbericht. Bitte ihn zuerst löschen, dann werten.' };
    return { error: error.message };
  }
  const id = (data as { id: string } | null)?.id;
  if (id) await notifyReportChange(id, 'changed');
  void ergebnisSeitenNeuBauen();
  return { error: null };
}
