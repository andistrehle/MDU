// ============================================================
// Münchner Dart Union — main data facade
// ============================================================
//
// This is the single import point used by all pages:
//   import { ... } from '@/lib/data'
//
// Modular source files live in lib/data/:
//   seasons.ts      — Season type, SEASONS array, getCurrentSeason()
//   leagues.ts      — League type, LEAGUES array, findLeague()
//   teams.ts        — Team type, TEAMS array, findTeam()
//   venues.ts       — Venue type, VENUES array, findVenue()
//   players.ts      — Player type, PLAYERS array
//   assignments.ts  — SeasonTeamAssignment, getLeagueGroupings(), etc.
//
// Standings, matches, news, and roster data remain in this file.
// ============================================================

// ── Imports from sub-modules (needed locally AND re-exported) ─
import { TEAMS as _TEAMS }    from './data/teams';

// ── Re-exports ────────────────────────────────────────────────
export type { SeasonStatus, Season }          from './data/seasons';
export { SEASONS, getCurrentSeason }          from './data/seasons';

export type { LeagueCode, League }            from './data/leagues';
export { LEAGUES, findLeague }                from './data/leagues';

export type { TeamStatus, Team }              from './data/teams';
export { TEAMS, findTeam }                    from './data/teams';

export type { Venue }                         from './data/venues';
export { VENUES, findVenue }                  from './data/venues';

export type { PlayerStatus, Player }          from './data/players';
export { PLAYERS, findPlayer, getPlayerDisplayName } from './data/players';

export type {
  SeasonTeamAssignment,
  TeamPlayerAssignment,
  TeamWithAssignment,
  LeagueGrouping,
}                                             from './data/assignments';
export {
  SEASON_TEAM_ASSIGNMENTS,
  TEAM_PLAYER_ASSIGNMENTS,
  getTeamAssignment,
  getAssignmentsForLeague,
  getPlayerAssignmentsForTeam,
  getLeagueGroupings,
}                                             from './data/assignments';

// ── Types ─────────────────────────────────────────────────────

export type StandingStatus = 'promo' | 'playoff' | 'releg' | null;

export interface StandingRow {
  pos: number;
  team: string;
  name: string;
  sp: number;
  s: number;
  u: number;
  n: number;
  legs: string;
  diff: string;
  pts: number;
  status: StandingStatus;
}

export interface Match {
  date: string;
  time: string;
  league: string;
  home: string;
  away: string;
  venue: string;
}

export interface Result {
  date: string;
  league: string;
  home: string;
  away: string;
  hs: number;
  as: number;
  mvp: string;
}

export interface NewsItem {
  tag: string;
  tagTone: 'red' | 'gold' | 'blue' | 'neutral';
  title: string;
  date: string;
  read?: string;
}

export interface RosterPlayer {
  name: string;
  role: string;
  avg: string;
  hf: string;
  games: string;
}

// ── Standings ─────────────────────────────────────────────────
// Data from dartunion.de · Saison 2026 · playoff phase
// Scoring: 3 pts win · 1 pt draw · 0 pts loss
// Note on treff-nix-freimann: appears in both A1 (early relegation, 4 games)
// and A2 (transferred mid-season, 8 games). Current assignment → A2.

const LA_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'spartans',          name: 'Spartans',           sp: 15, s: 15, u: 0, n: 0,  legs: '207:63',  diff: '+144', pts: 45, status: null },
  { pos: 2, team: 'ohne-jackie',       name: 'Ohne Jackie',        sp: 18, s: 10, u: 3, n: 5,  legs: '203:121', diff: '+82',  pts: 33, status: null },
  { pos: 3, team: 'jolly-pirates-kts', name: "Jolly Pirates KT's", sp: 15, s: 9,  u: 2, n: 4,  legs: '165:105', diff: '+60',  pts: 29, status: null },
  { pos: 4, team: 'dc-null-bull',      name: 'DC Null Bull',       sp: 14, s: 4,  u: 1, n: 9,  legs: '108:144', diff: '-36',  pts: 13, status: null },
  { pos: 5, team: 'no-maam',           name: "No Ma'am",           sp: 15, s: 3,  u: 5, n: 7,  legs: '120:150', diff: '-30',  pts: 11, status: 'releg' },
  { pos: 6, team: 'les-dartagnons',    name: 'Les Dartagnons',     sp: 17, s: 0,  u: 1, n: 16, legs: '43:263',  diff: '-220', pts: 1,  status: 'releg' },
];

const A1_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'alptraum',           name: 'Alptraum',           sp: 15, s: 12, u: 1, n: 2, legs: '171:99',  diff: '+72',  pts: 37, status: 'promo' },
  { pos: 2, team: 'dc-animals-ii',      name: 'DC Animals II',      sp: 11, s: 7,  u: 0, n: 4, legs: '106:92',  diff: '+14',  pts: 21, status: 'promo' },
  { pos: 3, team: 'gambas',             name: 'Gambas',             sp: 10, s: 5,  u: 1, n: 4, legs: '90:90',   diff: '0',    pts: 16, status: 'promo' },
  { pos: 4, team: 'spartans-vi',        name: 'Spartans VI',        sp: 12, s: 4,  u: 3, n: 5, legs: '113:103', diff: '+10',  pts: 15, status: null },
  { pos: 5, team: 'sound-warriors',     name: "Sound Warrior's",    sp: 12, s: 4,  u: 0, n: 8, legs: '84:132',  diff: '-48',  pts: 9,  status: null },
  { pos: 6, team: 'game-over',          name: 'Game Over',          sp: 10, s: 2,  u: 1, n: 7, legs: '78:102',  diff: '-24',  pts: 7,  status: 'releg' },
  { pos: 7, team: 'treff-nix-freimann', name: 'Treff Nix Freimann', sp: 4,  s: 0,  u: 0, n: 4, legs: '24:48',   diff: '-24',  pts: 0,  status: 'releg' },
];

const A2_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'silberpfeile-ii',    name: 'Silberpfeile II',    sp: 8, s: 6, u: 1, n: 1, legs: '82:62',  diff: '+20',  pts: 19, status: 'promo' },
  { pos: 2, team: 'treff-nix-freimann', name: 'Treff Nix Freimann', sp: 8, s: 4, u: 1, n: 3, legs: '79:65',  diff: '+14',  pts: 13, status: 'promo' },
  { pos: 3, team: 'jolly-pirates-v',    name: 'Jolly Pirates V',    sp: 8, s: 3, u: 2, n: 3, legs: '77:67',  diff: '+10',  pts: 11, status: 'promo' },
  { pos: 4, team: 'oldies-co',          name: 'Oldies & Co',        sp: 8, s: 1, u: 3, n: 4, legs: '62:82',  diff: '-20',  pts: 6,  status: 'releg' },
  // De Wolperdinga: Rückzug aus dem Spielbetrieb (dartunion.de/news.php)
  { pos: 5, team: 'de-wolperdinga',     name: 'De Wolperdinga *',   sp: 8, s: 2, u: 1, n: 5, legs: '60:84',  diff: '-24',  pts: 7,  status: 'releg' },
];

const B1_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'flying-fighters',    name: 'Flying Fighters',    sp: 10, s: 6, u: 2, n: 2, legs: '110:70', diff: '+40',  pts: 20, status: 'promo' },
  { pos: 2, team: 'master-of-desaster', name: 'Master of Desaster', sp: 10, s: 5, u: 3, n: 2, legs: '100:80', diff: '+20',  pts: 18, status: 'promo' },
  { pos: 3, team: 'flying-seven',       name: 'Flying Seven',       sp: 10, s: 5, u: 3, n: 2, legs: '95:85',  diff: '+10',  pts: 18, status: 'promo' },
  { pos: 4, team: 'lucky-darts-one',    name: 'Lucky Darts One',    sp: 10, s: 5, u: 1, n: 4, legs: '85:95',  diff: '-10',  pts: 16, status: null },
  { pos: 5, team: 'de-hutzeldarter',    name: 'De Hutzeldarter',    sp: 10, s: 3, u: 1, n: 6, legs: '81:99',  diff: '-18',  pts: 10, status: 'releg' },
  { pos: 6, team: 'massl-ghabt',        name: 'Massl Ghabt',        sp: 10, s: 1, u: 0, n: 9, legs: '69:111', diff: '-42',  pts: 3,  status: 'releg' },
];

const B2_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'belfort-evolution',  name: 'Belfort Evolution',  sp: 14, s: 10, u: 2, n: 2, legs: '324:276', diff: '+48',  pts: 32, status: 'promo' },
  { pos: 2, team: 'fiaker-deife',       name: 'Fiaker Deife',       sp: 11, s: 9,  u: 1, n: 1, legs: '303:177', diff: '+126', pts: 28, status: 'promo' },
  { pos: 3, team: 'freibad-bazis',      name: 'Freibad Bazis',      sp: 11, s: 6,  u: 0, n: 5, legs: '242:235', diff: '+7',   pts: 18, status: 'promo' },
  { pos: 4, team: 'team-desaster',      name: 'Team Desaster',      sp: 11, s: 5,  u: 2, n: 4, legs: '242:242', diff: '0',    pts: 17, status: null },
  { pos: 5, team: 'dc-dark-angels',     name: 'DC Dark Angels',     sp: 11, s: 2,  u: 1, n: 8, legs: '189:285', diff: '-96',  pts: 7,  status: 'releg' },
  { pos: 6, team: 'de-vogelwuidn',      name: "De Vogelwuid'n",     sp: 10, s: 1,  u: 0, n: 9, legs: '187:245', diff: '-58',  pts: 3,  status: 'releg' },
];

const C_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'wild-indians',       name: 'Wild Indians',         sp: 17, s: 12, u: 3, n: 2,  legs: '190:116', diff: '+74',  pts: 39, status: 'promo' },
  { pos: 2, team: 'muenchen-0815',      name: 'München 08/15',        sp: 17, s: 9,  u: 4, n: 4,  legs: '171:135', diff: '+36',  pts: 31, status: 'promo' },
  { pos: 3, team: 'lucky-darts-two',    name: 'Lucky Darts Two',      sp: 17, s: 9,  u: 2, n: 6,  legs: '160:146', diff: '+14',  pts: 29, status: 'promo' },
  { pos: 4, team: 'funny-darters',      name: 'Funny Darters Munich', sp: 16, s: 6,  u: 1, n: 9,  legs: '140:148', diff: '-8',   pts: 19, status: null },
  { pos: 5, team: 'black-devils',       name: 'Black Devils',         sp: 17, s: 3,  u: 4, n: 10, legs: '126:180', diff: '-54',  pts: 13, status: 'releg' },
  { pos: 6, team: 'fuenf-sterne-boazn', name: '5 Sterne Boazn Team',  sp: 16, s: 2,  u: 4, n: 10, legs: '113:175', diff: '-62',  pts: 10, status: 'releg' },
];

export const STANDINGS_BY_LEAGUE: Record<string, StandingRow[]> = {
  la: LA_LIGA_STANDINGS,
  a1: A1_LIGA_STANDINGS,
  a2: A2_LIGA_STANDINGS,
  b1: B1_LIGA_STANDINGS,
  b2: B2_LIGA_STANDINGS,
  c:  C_LIGA_STANDINGS,
};

// Legacy alias — kept so old imports don't break
export const A1_STANDINGS = A1_LIGA_STANDINGS;

// ── Upcoming Matches ──────────────────────────────────────────

export const UPCOMING: Match[] = [
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga', home: 'alptraum',          away: 'silberpfeile-ii',   venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga', home: 'gambas',             away: 'jolly-pirates-v',   venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga', home: 'belfort-evolution',  away: 'flying-fighters',   venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga', home: 'fiaker-deife',       away: 'master-of-desaster',venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'C Liga',          home: 'wild-indians',       away: 'muenchen-0815',     venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'C Liga',          home: 'lucky-darts-two',    away: 'funny-darters',     venue: 'Noch nicht verfügbar' },
];

export const HOME_MATCHES = UPCOMING.slice(0, 3);

// ── Results ───────────────────────────────────────────────────

export const RESULTS: Result[] = [
  { date: '07.12.2025', league: 'Pokal 2026', home: 'lucky-darts-one', away: 'de-vogelwuidn',      hs: 10, as: 8,  mvp: 'Noch nicht verfügbar' },
  { date: '07.12.2025', league: 'Pokal 2026', home: 'game-over',       away: 'treff-nix-freimann', hs: 12, as: 6,  mvp: 'Noch nicht verfügbar' },
  { date: '07.12.2025', league: 'Pokal 2026', home: 'belfort-evolution',away: 'flying-fighters',   hs:  0, as: 18, mvp: 'Noch nicht verfügbar' },
];

// ── News ──────────────────────────────────────────────────────

export const HOME_NEWS: NewsItem[] = [
  { date: '21.05.2026', tag: 'AKTUELL', tagTone: 'red',
    title: 'De Wolperdinga ziehen sich mit sofortiger Wirkung vom Spielbetrieb zurück.' },
  { date: '14.05.2026', tag: 'PLAYOFFS', tagTone: 'gold',
    title: 'Playoffs Saison 2026 laufen — Aufstiegs- und Abstiegsspiele in vollem Gange.' },
  { date: '10.01.2026', tag: 'POKAL', tagTone: 'blue',
    title: 'Pokal Fight 2026: Alle Ergebnisse der Rückspiele jetzt auf dartunion.de.' },
];

// ── Roster placeholder ────────────────────────────────────────
// Use getPlayerAssignmentsForTeam(teamId, seasonId) for the real data model.
// This placeholder is shown until dartunion.de publishes rosters.

export const ROSTER: RosterPlayer[] = [
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
];

// Kept for backwards compat — was used when teams were external entries
export const EXTENDED_TEAMS: Record<string, { name: string; short: string; color: string }> = {};

// ── Helper functions ──────────────────────────────────────────

export function getStandings(code: string): StandingRow[] {
  return STANDINGS_BY_LEAGUE[code.toLowerCase()] ?? [];
}

/**
 * Returns { name, short, color } for a team by id.
 * Used by StandingsTable, MatchCard, ErgebnissePage.
 * Falls back to a generated placeholder if the id is not found.
 */
export function getExtendedTeam(id: string): { name: string; short: string; color: string } {
  const team = _TEAMS.find(t => t.id === id);
  if (team) return { name: team.name, short: team.short, color: team.color };
  return { name: id, short: id.toUpperCase().slice(0, 3), color: '#9AA4B2' };
}
