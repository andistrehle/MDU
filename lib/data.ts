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
import { STATISTICS_BY_LEAGUE } from './data/statistics';
import { LEAGUES as _LEAGUES } from './data/leagues';
import {
  SEASON_TEAM_ASSIGNMENTS    as _STA,
  getAssignmentsForLeague    as _getAssignmentsForLeague,
  getVenueForTeamInSeason    as _getVenueForTeamInSeason,
  getVenueGroupingsForLeague as _getVenueGroupingsForLeague,
  type LeagueGrouping,
  type TeamWithAssignment,
  type LeagueVenueGrouping,
  type VenueWithTeams,
} from './data/assignments';

// ── Re-exports ────────────────────────────────────────────────
export type { SeasonStatus, Season }          from './data/seasons';
export { SEASONS, getCurrentSeason }          from './data/seasons';

export type { RegularLeagueCode, PlayoffCode, LeagueCode, League } from './data/leagues';
export { LEAGUES, findLeague }                from './data/leagues';

export type { TeamStatus, Team }              from './data/teams';
export { TEAMS, findTeam }                    from './data/teams';

export type { Venue }                         from './data/venues';
export { VENUES, findVenue, getVenueById, getVenueFullAddress } from './data/venues';

export type { PlayerStatEntry, LeagueStatistics } from './data/statistics';
export { STATISTICS_BY_LEAGUE, getStatisticsForLeague } from './data/statistics';

export type {
  MatchStatus,
  MatchResult,
  Match as GameMatch,
}                                             from './data/matches';
export {
  MATCHES,
  getMatchesForLeague,
  getScheduledMatches,
  getCompletedMatches,
  getUpcomingMatches,
  getRecentResults,
  formatMatchDate,
  formatScheduledDate,
  normalizeTeamId,
  isFutureOrOpenMatch,
  getMatchesForTeam,
  getScheduledMatchesForTeam,
  getCompletedMatchesForTeam,
  getScheduledMatchesByLeague,
  getCompletedMatchesByLeague,
  isValidMatchResult,
  isPlaceholderDate,
  isFutureScheduledMatch,
  isPastScheduledWithoutResult,
  isUpcomingOrOpenMatch,
  isCompletedMatch,
}                                             from './data/matches';

export type { PlayerStatus, Player }          from './data/players';
export { PLAYERS, findPlayer, getPlayerDisplayName } from './data/players';

export type {
  SeasonTeamAssignment,
  TeamPlayerAssignment,
  TeamWithAssignment,
  LeagueGrouping,
  VenueWithTeams,
  LeagueVenueGrouping,
  PlayerWithAssignment,
}                                             from './data/assignments';
export {
  SEASON_TEAM_ASSIGNMENTS,
  TEAM_PLAYER_ASSIGNMENTS,
  getTeamAssignment,
  getAssignmentsForLeague,
  getPlayerAssignmentsForTeam,
  getPlayersForTeamInSeason,
  getLeagueGroupings,
  getVenueForTeamInSeason,
  getCaptainForTeamInSeason,
  getVenueGroupingsForLeague,
  getLeagueVenueGroupings,
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
  /** Individual Spiele wins:losses across all matchdays, e.g. "214:74".
   *  Undefined for leagues where this data has not been fetched yet. */
  spiele?: string;
  legs: string;
  /** Diff based on Spiele (for leagues with spiele data) or Legs otherwise. */
  diff: string;
  pts: number;
  status: StandingStatus;
}

/**
 * Legacy schedule entry used by UPCOMING and MatchCard.
 * For the richer typed match structure use Match from lib/data/matches.ts.
 */
export interface LegacyMatch {
  date: string;
  time: string;
  league: string;
  /** League code — used for filtering on league detail pages */
  leagueId?: string;
  home: string;
  away: string;
  venue: string;
}

/** Backward-compat alias — kept so existing imports don't break */
export type Match = LegacyMatch;

export interface Result {
  /** Display date, e.g. '21.05.2026' */
  date: string;
  /** Display league name, e.g. 'Playoffs A Liga Aufstieg' */
  league: string;
  /** League code for filtering, e.g. 'playoffs-a-aufstieg' — optional for backward compat */
  leagueId?: string;
  /** Home team ID from lib/data/teams.ts, e.g. 'alptraum' */
  home: string;
  /** Away team ID from lib/data/teams.ts, e.g. 'silberpfeile-ii' */
  away: string;
  /** Home score — games won out of 18 */
  hs: number;
  /** Away score — games won out of 18. hs + as should equal 18 */
  as: number;
  /** MVP player name or 'Noch nicht verfügbar' */
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
// Data from dartunion.de · Saison 2026
// Sources: ranking01.php LigaId=88(La), 86(A1), 87(A2), 84(B1), 85(B2), 94(C)
//          89(Playoffs A Auf), 91(Playoffs A Abs), 90(Playoffs B Auf), 92(Playoffs B Abs)
// La/C/Playoffs last updated: 2026-05-27 from dartunion.de
// Legs column = actual legs won:lost from dartunion.de "Legs" field.
// Diff = Legs-For minus Legs-Against.
// Scoring: 3 pts win · 1 pt draw · 0 pts loss (official dartunion.de Punkte used as-is).
// Note on treff-nix-freimann: appears in both A1 (withdrawn after 4 games)
// and A2 (transferred mid-season, 8 games). Current assignment → A2.

const LA_LIGA_STANDINGS: StandingRow[] = [
  // Source: https://dartunion.de/ranking01.php?LigaId=88 (2026-05-27)
  // Spiele = individual game wins:losses per season (sp × 18 total games).
  // Diff is Spiele-based (SpieleFor − SpieleAgainst).
  { pos: 1, team: 'spartans',          name: 'Spartans',           sp: 16, s: 15, u: 0, n: 1,  spiele: '214:74',  legs: '467:222', diff: '+140', pts: 45, status: null },
  { pos: 2, team: 'ohne-jackie',       name: 'Ohne Jackie',        sp: 18, s: 10, u: 3, n: 5,  spiele: '203:121', legs: '460:293', diff: '+82',  pts: 33, status: null },
  { pos: 3, team: 'jolly-pirates-kts', name: "Jolly Pirates KT's", sp: 15, s: 9,  u: 2, n: 4,  spiele: '165:105', legs: '375:272', diff: '+60',  pts: 29, status: null },
  { pos: 4, team: 'no-maam',           name: "No Ma'am",           sp: 16, s: 4,  u: 5, n: 7,  spiele: '131:157', legs: '331:375', diff: '-26',  pts: 14, status: null },
  { pos: 5, team: 'dc-null-bull',      name: 'DC Null Bull',       sp: 14, s: 4,  u: 1, n: 9,  spiele: '108:144', legs: '259:324', diff: '-36',  pts: 13, status: 'releg' },
  { pos: 6, team: 'les-dartagnons',    name: 'Les Dartagnons',     sp: 17, s: 0,  u: 1, n: 16, spiele: '43:263',  legs: '135:541', diff: '-220', pts: 1,  status: 'releg' },
];

const A1_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'alptraum',           name: 'Alptraum',           sp: 15, s: 12, u: 1, n: 2, legs: '396:258', diff: '+138', pts: 37, status: 'promo' },
  { pos: 2, team: 'dc-animals-ii',      name: 'DC Animals II',      sp: 11, s: 7,  u: 0, n: 4, legs: '260:230', diff: '+30',  pts: 21, status: 'promo' },
  { pos: 3, team: 'gambas',             name: 'Gambas',             sp: 10, s: 5,  u: 1, n: 4, legs: '217:232', diff: '-15',  pts: 16, status: 'promo' },
  { pos: 4, team: 'spartans-vi',        name: 'Spartans VI',        sp: 12, s: 4,  u: 3, n: 5, legs: '277:258', diff: '+19',  pts: 15, status: null },
  { pos: 5, team: 'sound-warriors',     name: "Sound Warrior's",    sp: 12, s: 4,  u: 0, n: 8, legs: '219:306', diff: '-87',  pts: 9,  status: null },
  { pos: 6, team: 'game-over',          name: 'Game Over',          sp: 10, s: 2,  u: 1, n: 7, legs: '205:246', diff: '-41',  pts: 7,  status: 'releg' },
  { pos: 7, team: 'treff-nix-freimann', name: 'Treff Nix Freimann', sp: 4,  s: 0,  u: 0, n: 4, legs: '68:112',  diff: '-44',  pts: 0,  status: 'releg' },
];

const A2_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'silberpfeile-ii',    name: 'Silberpfeile II',    sp: 8, s: 6, u: 1, n: 1, legs: '197:161', diff: '+36',  pts: 19, status: 'promo' },
  { pos: 2, team: 'treff-nix-freimann', name: 'Treff Nix Freimann', sp: 8, s: 4, u: 1, n: 3, legs: '190:162', diff: '+28',  pts: 13, status: 'promo' },
  { pos: 3, team: 'jolly-pirates-v',    name: 'Jolly Pirates V',    sp: 8, s: 3, u: 2, n: 3, legs: '191:173', diff: '+18',  pts: 11, status: 'promo' },
  // De Wolperdinga: Rückzug aus dem Spielbetrieb (dartunion.de/news.php)
  { pos: 4, team: 'de-wolperdinga',     name: 'De Wolperdinga *',   sp: 8, s: 2, u: 1, n: 5, legs: '154:199', diff: '-45',  pts: 7,  status: 'releg' },
  { pos: 5, team: 'oldies-co',          name: 'Oldies & Co',        sp: 8, s: 1, u: 3, n: 4, legs: '160:197', diff: '-37',  pts: 6,  status: 'releg' },
];

const B1_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'flying-fighters',    name: 'Flying Fighters',    sp: 10, s: 6, u: 2, n: 2, legs: '248:182', diff: '+66',  pts: 20, status: 'promo' },
  { pos: 2, team: 'master-of-desaster', name: 'Master of Desaster', sp: 10, s: 5, u: 3, n: 2, legs: '239:198', diff: '+41',  pts: 18, status: 'promo' },
  { pos: 3, team: 'flying-seven',       name: 'Flying Seven',       sp: 10, s: 5, u: 3, n: 2, legs: '229:209', diff: '+20',  pts: 18, status: 'promo' },
  { pos: 4, team: 'lucky-darts-one',    name: 'Lucky Darts One',    sp: 10, s: 5, u: 1, n: 4, legs: '208:224', diff: '-16',  pts: 16, status: null },
  { pos: 5, team: 'de-hutzeldarter',    name: 'De Hutzeldarter',    sp: 10, s: 3, u: 1, n: 6, legs: '202:235', diff: '-33',  pts: 10, status: 'releg' },
  { pos: 6, team: 'massl-ghabt',        name: 'Massl Ghabt',        sp: 10, s: 1, u: 0, n: 9, legs: '182:260', diff: '-78',  pts: 3,  status: 'releg' },
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
  // Source: https://dartunion.de/ranking01.php?LigaId=94 (2026-05-27)
  // Spiele = individual game wins:losses per season (sp × 18 total games).
  // Diff is Spiele-based (SpieleFor − SpieleAgainst).
  { pos: 1, team: 'wild-indians',       name: 'Wild Indians',         sp: 17, s: 12, u: 3, n: 2,  spiele: '190:116', legs: '440:314', diff: '+74',  pts: 39, status: 'promo' },
  { pos: 2, team: 'muenchen-0815',      name: 'München 08/15',        sp: 17, s: 9,  u: 4, n: 4,  spiele: '171:135', legs: '398:351', diff: '+36',  pts: 31, status: 'promo' },
  { pos: 3, team: 'lucky-darts-two',    name: 'Lucky Darts Two',      sp: 17, s: 9,  u: 2, n: 6,  spiele: '160:146', legs: '388:363', diff: '+14',  pts: 29, status: 'promo' },
  { pos: 4, team: 'funny-darters',      name: 'Funny Darters Munich', sp: 16, s: 6,  u: 1, n: 9,  spiele: '140:148', legs: '351:357', diff: '-8',   pts: 19, status: null },
  { pos: 5, team: 'black-devils',       name: 'Black Devils',         sp: 17, s: 3,  u: 4, n: 10, spiele: '126:180', legs: '329:413', diff: '-54',  pts: 13, status: 'releg' },
  { pos: 6, team: 'fuenf-sterne-boazn', name: '5 Sterne Boazn Team',  sp: 16, s: 2,  u: 4, n: 10, spiele: '113:175', legs: '297:405', diff: '-62',  pts: 10, status: 'releg' },
];

// ── Playoff Standings · Saison 2026 ──────────────────────────
// Source: dartunion.de LigaId=89,90,91,92 — playoffs ongoing as of May 2026.
// All 4 groups have real results. Teams are confirmed from dartunion.de.

const PLAYOFFS_A_AUFSTIEG_STANDINGS: StandingRow[] = [
  // Source: https://dartunion.de/ranking01.php?LigaId=89 (2026-05-27)
  // Spiele = individual game wins:losses per season (sp × 18 total games).
  // Diff is Spiele-based (SpieleFor − SpieleAgainst).
  { pos: 1, team: 'alptraum',           name: 'Alptraum',           sp: 6, s: 5, u: 0, n: 1, spiele: '69:39', legs: '158:106', diff: '+30', pts: 15, status: null },
  { pos: 2, team: 'gambas',             name: 'Gambas',             sp: 7, s: 4, u: 0, n: 3, spiele: '61:65', legs: '141:151', diff: '-4',  pts: 12, status: null },
  { pos: 3, team: 'silberpfeile-ii',    name: 'Silberpfeile II',    sp: 5, s: 3, u: 1, n: 1, spiele: '55:35', legs: '125:92',  diff: '+20', pts: 10, status: null },
  { pos: 4, team: 'dc-animals-ii',      name: 'DC Animals II',      sp: 7, s: 3, u: 0, n: 4, spiele: '62:64', legs: '153:148', diff: '-2',  pts: 9,  status: null },
  { pos: 5, team: 'treff-nix-freimann', name: 'Treff Nix Freimann', sp: 6, s: 2, u: 0, n: 4, spiele: '49:59', legs: '120:136', diff: '-10', pts: 6,  status: null },
  { pos: 6, team: 'jolly-pirates-v',    name: 'Jolly Pirates V',    sp: 7, s: 1, u: 1, n: 5, spiele: '46:80', legs: '119:183', diff: '-34', pts: 4,  status: null },
];

const PLAYOFFS_A_ABSTIEG_STANDINGS: StandingRow[] = [
  // Source: https://dartunion.de/ranking01.php?LigaId=91 (2026-05-27)
  // Spiele = individual game wins:losses per season (sp × 18 total games).
  // Diff is Spiele-based (SpieleFor − SpieleAgainst).
  { pos: 1, team: 'spartans-vi',    name: 'Spartans VI',    sp: 3, s: 2, u: 0, n: 1, spiele: '33:21', legs: '75:54', diff: '+12', pts: 6, status: null },
  { pos: 2, team: 'oldies-co',      name: 'Oldies & Co',    sp: 3, s: 2, u: 0, n: 1, spiele: '29:25', legs: '70:64', diff: '+4',  pts: 6, status: null },
  { pos: 3, team: 'sound-warriors', name: "Sound Warrior's",sp: 3, s: 1, u: 0, n: 2, spiele: '25:29', legs: '63:69', diff: '-4',  pts: 3, status: null },
  { pos: 4, team: 'game-over',      name: 'Game Over',      sp: 3, s: 1, u: 0, n: 2, spiele: '21:33', legs: '54:75', diff: '-12', pts: 3, status: null },
];

const PLAYOFFS_B_AUFSTIEG_STANDINGS: StandingRow[] = [
  // Source: https://dartunion.de/ranking01.php?LigaId=90 (2026-05-27)
  // Spiele = individual game wins:losses per season (sp × 18 total games).
  // Diff is Spiele-based (SpieleFor − SpieleAgainst).
  { pos: 1, team: 'belfort-evolution',  name: 'Belfort Evolution',  sp: 7, s: 5, u: 1, n: 1, spiele: '70:56', legs: '170:142', diff: '+14', pts: 16, status: null },
  { pos: 2, team: 'fiaker-deife',       name: 'Fiaker Deife',       sp: 7, s: 4, u: 0, n: 3, spiele: '72:54', legs: '160:135', diff: '+18', pts: 12, status: null },
  { pos: 3, team: 'flying-seven',       name: 'Flying Seven',       sp: 7, s: 3, u: 2, n: 2, spiele: '66:60', legs: '153:141', diff: '+6',  pts: 11, status: null },
  { pos: 4, team: 'freibad-bazis',      name: 'Freibad Bazis',      sp: 7, s: 2, u: 3, n: 2, spiele: '60:66', legs: '149:153', diff: '-6',  pts: 9,  status: null },
  { pos: 5, team: 'master-of-desaster', name: 'Master of Desaster', sp: 7, s: 2, u: 2, n: 3, spiele: '62:64', legs: '150:154', diff: '-2',  pts: 8,  status: null },
  { pos: 6, team: 'flying-fighters',    name: 'Flying Fighters',    sp: 7, s: 1, u: 0, n: 6, spiele: '48:78', legs: '121:178', diff: '-30', pts: 3,  status: null },
];

const PLAYOFFS_B_ABSTIEG_STANDINGS: StandingRow[] = [
  // Source: https://dartunion.de/ranking01.php?LigaId=92 (2026-05-27)
  // Spiele = individual game wins:losses per season (sp × 18 total games).
  // Diff is Spiele-based (SpieleFor − SpieleAgainst).
  { pos: 1, team: 'de-vogelwuidn',      name: "De Vogelwuid'n",     sp: 7, s: 4, u: 2, n: 1, spiele: '72:54', legs: '171:136', diff: '+18', pts: 14, status: null },
  { pos: 2, team: 'lucky-darts-one',    name: 'Lucky Darts One',    sp: 7, s: 4, u: 1, n: 2, spiele: '65:61', legs: '153:146', diff: '+4',  pts: 13, status: null },
  { pos: 3, team: 'team-desaster',      name: 'Team Desaster',      sp: 7, s: 3, u: 3, n: 1, spiele: '74:52', legs: '167:130', diff: '+22', pts: 12, status: null },
  { pos: 4, team: 'de-hutzeldarter',    name: 'De Hutzeldarter',    sp: 7, s: 3, u: 2, n: 2, spiele: '64:62', legs: '151:156', diff: '+2',  pts: 11, status: null },
  { pos: 5, team: 'massl-ghabt',        name: 'Massl Ghabt',        sp: 7, s: 2, u: 0, n: 5, spiele: '53:73', legs: '137:171', diff: '-20', pts: 6,  status: null },
  { pos: 6, team: 'dc-dark-angels',     name: 'DC Dark Angels',     sp: 7, s: 0, u: 2, n: 5, spiele: '50:76', legs: '129:169', diff: '-26', pts: 2,  status: null },
];

export const STANDINGS_BY_LEAGUE: Record<string, StandingRow[]> = {
  la: LA_LIGA_STANDINGS,
  a1: A1_LIGA_STANDINGS,
  a2: A2_LIGA_STANDINGS,
  b1: B1_LIGA_STANDINGS,
  b2: B2_LIGA_STANDINGS,
  c:  C_LIGA_STANDINGS,
  'playoffs-a-aufstieg': PLAYOFFS_A_AUFSTIEG_STANDINGS,
  'playoffs-a-abstieg':  PLAYOFFS_A_ABSTIEG_STANDINGS,
  'playoffs-b-aufstieg': PLAYOFFS_B_AUFSTIEG_STANDINGS,
  'playoffs-b-abstieg':  PLAYOFFS_B_ABSTIEG_STANDINGS,
};

// Legacy alias — kept so old imports don't break
export const A1_STANDINGS = A1_LIGA_STANDINGS;

// ── Playoff-aware grouping helpers ───────────────────────────
//
// These must live here (not in assignments.ts) because they need
// STANDINGS_BY_LEAGUE, which is defined in this file. Moving them
// to assignments.ts would create a circular import.

/**
 * Maps teamId → playoff league code for every team currently
 * participating in any playoff group.
 *
 * Built once at module init from STANDINGS_BY_LEAGUE.
 */
export const PLAYOFF_TEAM_MAP: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [code, rows] of Object.entries(STANDINGS_BY_LEAGUE)) {
    if (code.startsWith('playoffs-')) {
      for (const row of rows) m.set(row.team, code);
    }
  }
  return m;
})();

/**
 * Returns league groupings with playoff teams shown under their playoff
 * group rather than their regular-season league.
 *
 * Display order (sortOrder ascending):
 *   Playoffs A Auf → Playoffs A Abs → Playoffs B Auf → Playoffs B Abs →
 *   La Liga → A1 → A2 → B1 → B2 → C Liga
 *
 * Regular-season sections with zero remaining teams are omitted.
 */
export function getPlayoffAwareLeagueGroupings(seasonId: string): LeagueGrouping[] {
  const result: LeagueGrouping[] = [];

  // 1. Playoff leagues — teams drawn from STANDINGS_BY_LEAGUE
  const playoffLeagues = _LEAGUES
    .filter(l => l.type === 'playoff')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const league of playoffLeagues) {
    const rows = STANDINGS_BY_LEAGUE[league.id] ?? [];
    const teams: TeamWithAssignment[] = rows.flatMap(row => {
      const team = _TEAMS.find(t => t.id === row.team);
      if (!team) return [];
      const assignment = _STA.find(a => a.seasonId === seasonId && a.teamId === team.id);
      if (!assignment) return [];
      const venue = _getVenueForTeamInSeason(team.id, seasonId);
      return [{ team, assignment, venue }];
    });
    result.push({ league, teams });
  }

  // 2. Regular leagues — exclude teams already in a playoff group
  const regularLeagues = _LEAGUES
    .filter(l => l.type !== 'playoff')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const league of regularLeagues) {
    const assignments = _getAssignmentsForLeague(league.id, seasonId);
    const teams: TeamWithAssignment[] = assignments
      .filter(a => !PLAYOFF_TEAM_MAP.has(a.teamId))
      .flatMap(a => {
        const team = _TEAMS.find(t => t.id === a.teamId);
        if (!team) return [];
        const venue = _getVenueForTeamInSeason(a.teamId, seasonId);
        return [{ team, assignment: a, venue }];
      });
    if (teams.length > 0) result.push({ league, teams });
  }

  return result;
}

/**
 * Returns venue groupings with playoff teams shown under their playoff
 * group rather than their regular-season league.
 *
 * Same ordering logic as getPlayoffAwareLeagueGroupings.
 */
export function getPlayoffAwareVenueGroupings(seasonId: string): LeagueVenueGrouping[] {
  const result: LeagueVenueGrouping[] = [];

  // 1. Playoff leagues — venues derived from teams' regular-season venue assignments
  const playoffLeagues = _LEAGUES
    .filter(l => l.type === 'playoff')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const league of playoffLeagues) {
    const rows = STANDINGS_BY_LEAGUE[league.id] ?? [];
    if (rows.length === 0) continue;

    const venueMap = new Map<string, VenueWithTeams>();
    for (const row of rows) {
      const team = _TEAMS.find(t => t.id === row.team);
      if (!team) continue;
      const assignment = _STA.find(a => a.seasonId === seasonId && a.teamId === team.id);
      if (!assignment) continue;
      const venue = _getVenueForTeamInSeason(team.id, seasonId);
      const key = assignment.venueId ?? '__no-venue__';
      if (!venueMap.has(key)) venueMap.set(key, { venue, teams: [] });
      venueMap.get(key)!.teams.push({ team, assignment, venue });
    }

    const venues: VenueWithTeams[] = Array.from(venueMap.values()).sort((a, b) => {
      if (a.venue && !b.venue) return -1;
      if (!a.venue && b.venue) return  1;
      return (a.venue?.name ?? '').localeCompare(b.venue?.name ?? '', 'de');
    });
    result.push({ league, venues });
  }

  // 2. Regular leagues — exclude playoff teams from each venue's team list
  const regularLeagues = _LEAGUES
    .filter(l => l.type !== 'playoff')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  for (const league of regularLeagues) {
    const venues = _getVenueGroupingsForLeague(league.id, seasonId)
      .map(vg => ({
        ...vg,
        teams: vg.teams.filter(t => !PLAYOFF_TEAM_MAP.has(t.team.id)),
      }))
      .filter(vg => vg.teams.length > 0);
    if (venues.length > 0) result.push({ league, venues });
  }

  return result;
}

// ── Upcoming Matches ──────────────────────────────────────────

export const UPCOMING: LegacyMatch[] = [
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga Aufstieg', leagueId: 'playoffs-a-aufstieg', home: 'alptraum',          away: 'silberpfeile-ii',    venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga Aufstieg', leagueId: 'playoffs-a-aufstieg', home: 'gambas',             away: 'jolly-pirates-v',    venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga Abstieg',  leagueId: 'playoffs-a-abstieg',  home: 'spartans-vi',        away: 'sound-warriors',     venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga Abstieg',  leagueId: 'playoffs-a-abstieg',  home: 'oldies-co',          away: 'game-over',          venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga Aufstieg', leagueId: 'playoffs-b-aufstieg', home: 'belfort-evolution',  away: 'flying-fighters',    venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga Aufstieg', leagueId: 'playoffs-b-aufstieg', home: 'fiaker-deife',       away: 'master-of-desaster', venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga Abstieg',  leagueId: 'playoffs-b-abstieg',  home: 'de-vogelwuidn',      away: 'dc-dark-angels',     venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga Abstieg',  leagueId: 'playoffs-b-abstieg',  home: 'lucky-darts-one',    away: 'massl-ghabt',        venue: 'Noch nicht verfügbar' },
];

export const HOME_MATCHES = UPCOMING.slice(0, 3);

// ── Results ───────────────────────────────────────────────────

// ── How to add a result ────────────────────────────────────────
//
//   1. Open lib/data.ts (this file)
//   2. Add a new line to RESULTS — newest match at the TOP:
//
//   { date: 'DD.MM.YYYY',
//     league:   'Anzeigename der Liga',     // shown in the Ergebnisse table
//     leagueId: 'liga-code',               // used for filtering (see codes below)
//     home:     'team-id',                 // home team ID (see teams below)
//     away:     'team-id',                 // away team ID
//     hs:       12,                        // home games won (out of 18 total)
//     as:        6,                        // away games won (hs + as = 18)
//     mvp:      'Vorname Nachname',        // or 'Noch nicht verfügbar'
//   },
//
// ── Liga-Codes (leagueId) ──────────────────────────────────────
//   la                    La Liga
//   a1                    A1 Liga
//   a2                    A2 Liga
//   b1                    B1 Liga
//   b2                    B2 Liga
//   c                     C Liga
//   playoffs-a-aufstieg   Playoffs A Liga Aufstieg
//   playoffs-a-abstieg    Playoffs A Liga Abstieg
//   playoffs-b-aufstieg   Playoffs B Liga Aufstieg
//   playoffs-b-abstieg    Playoffs B Liga Abstieg
//
// ── Team-IDs (home / away) ────────────────────────────────────
//  La Liga:    spartans · ohne-jackie · jolly-pirates-kts · dc-null-bull · no-maam · les-dartagnons
//  A1 Liga:    alptraum · dc-animals-ii · gambas · spartans-vi · sound-warriors · game-over
//  A2 Liga:    silberpfeile-ii · treff-nix-freimann · jolly-pirates-v · oldies-co · de-wolperdinga
//  B1 Liga:    flying-fighters · master-of-desaster · flying-seven · lucky-darts-one · de-hutzeldarter · massl-ghabt
//  B2 Liga:    belfort-evolution · fiaker-deife · freibad-bazis · team-desaster · dc-dark-angels · de-vogelwuidn
//  C Liga:     wild-indians · muenchen-0815 · lucky-darts-two · funny-darters · black-devils · fuenf-sterne-boazn
//  Playoffs A Auf: alptraum · dc-animals-ii · gambas · silberpfeile-ii · treff-nix-freimann · jolly-pirates-v
//  Playoffs A Abs: spartans-vi · sound-warriors · game-over · de-wolperdinga
//  Playoffs B Auf: belfort-evolution · fiaker-deife · freibad-bazis · flying-fighters · master-of-desaster · flying-seven
//  Playoffs B Abs: lucky-darts-one · de-hutzeldarter · massl-ghabt · dc-dark-angels · de-vogelwuidn · team-desaster
//
// ─────────────────────────────────────────────────────────────

export const RESULTS: Result[] = [
  // ── Pokal 2026 · Rückspiele (18.01.2026) ────────────────────
  // Rückspiel Rd 2 — De Vogelwuidn hosted Lucky Darts One
  { date: '18.01.2026', league: 'Pokal 2026', home: 'de-vogelwuidn',      away: 'lucky-darts-one',    hs: 9,  as: 9,  mvp: 'Noch nicht verfügbar' },
  // Rückspiel Rd 2 — Game Over hosted Treff Nix Freimann
  { date: '18.01.2026', league: 'Pokal 2026', home: 'game-over',          away: 'treff-nix-freimann', hs: 14, as: 4,  mvp: 'Noch nicht verfügbar' },
  // ── Pokal 2026 · Hinspiele (07.12.2025) ─────────────────────
  // Hinspiel Rd 1 — Lucky Darts One hosted De Vogelwuidn
  { date: '07.12.2025', league: 'Pokal 2026', home: 'lucky-darts-one',    away: 'de-vogelwuidn',      hs: 10, as: 8,  mvp: 'Noch nicht verfügbar' },
  // Hinspiel Rd 1 — Treff Nix Freimann hosted Game Over
  { date: '07.12.2025', league: 'Pokal 2026', home: 'treff-nix-freimann', away: 'game-over',          hs: 6,  as: 12, mvp: 'Noch nicht verfügbar' },
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
 * Returns all results for a given league code, newest first.
 * Matches on leagueId (exact) or falls back to league name contains check.
 */
export function getResultsForLeague(leagueCode: string): Result[] {
  return RESULTS.filter(r =>
    r.leagueId
      ? r.leagueId === leagueCode.toLowerCase()
      : r.league.toLowerCase().includes(leagueCode.toLowerCase()),
  );
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
