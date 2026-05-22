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
  legs: string;
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
// Legs column = actual legs won:lost (not game-level sub-scores).
// Scoring: 3 pts win · 1 pt draw · 0 pts loss
// Note on treff-nix-freimann: appears in both A1 (withdrawn after 4 games)
// and A2 (transferred mid-season, 8 games). Current assignment → A2.

const LA_LIGA_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'spartans',          name: 'Spartans',           sp: 15, s: 15, u: 0, n: 0,  legs: '446:193', diff: '+253', pts: 45, status: null },
  { pos: 2, team: 'ohne-jackie',       name: 'Ohne Jackie',        sp: 18, s: 10, u: 3, n: 5,  legs: '460:293', diff: '+167', pts: 33, status: null },
  { pos: 3, team: 'jolly-pirates-kts', name: "Jolly Pirates KT's", sp: 15, s: 9,  u: 2, n: 4,  legs: '375:272', diff: '+103', pts: 29, status: null },
  { pos: 4, team: 'dc-null-bull',      name: 'DC Null Bull',       sp: 14, s: 4,  u: 1, n: 9,  legs: '259:324', diff: '-65',  pts: 13, status: null },
  { pos: 5, team: 'no-maam',           name: "No Ma'am",           sp: 15, s: 3,  u: 5, n: 7,  legs: '302:354', diff: '-52',  pts: 11, status: 'releg' },
  { pos: 6, team: 'les-dartagnons',    name: 'Les Dartagnons',     sp: 17, s: 0,  u: 1, n: 16, legs: '135:541', diff: '-406', pts: 1,  status: 'releg' },
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
  { pos: 1, team: 'wild-indians',       name: 'Wild Indians',         sp: 17, s: 12, u: 3, n: 2,  legs: '440:314', diff: '+126', pts: 39, status: 'promo' },
  { pos: 2, team: 'muenchen-0815',      name: 'München 08/15',        sp: 17, s: 9,  u: 4, n: 4,  legs: '398:351', diff: '+47',  pts: 31, status: 'promo' },
  { pos: 3, team: 'lucky-darts-two',    name: 'Lucky Darts Two',      sp: 17, s: 9,  u: 2, n: 6,  legs: '388:363', diff: '+25',  pts: 29, status: 'promo' },
  { pos: 4, team: 'funny-darters',      name: 'Funny Darters Munich', sp: 16, s: 6,  u: 1, n: 9,  legs: '351:357', diff: '-6',   pts: 19, status: null },
  { pos: 5, team: 'black-devils',       name: 'Black Devils',         sp: 17, s: 3,  u: 4, n: 10, legs: '329:413', diff: '-84',  pts: 13, status: 'releg' },
  { pos: 6, team: 'fuenf-sterne-boazn', name: '5 Sterne Boazn Team',  sp: 16, s: 2,  u: 4, n: 10, legs: '297:405', diff: '-108', pts: 10, status: 'releg' },
];

// ── Playoff Standings · Saison 2026 ──────────────────────────
// Source: dartunion.de LigaId=89,90,91,92 — playoffs ongoing as of May 2026.
// All 4 groups have real results. Teams are confirmed from dartunion.de.

const PLAYOFFS_A_AUFSTIEG_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'alptraum',          name: 'Alptraum',          sp: 6, s: 5, u: 0, n: 1, legs: '158:106', diff: '+52', pts: 15, status: null },
  { pos: 2, team: 'dc-animals-ii',     name: 'DC Animals II',     sp: 7, s: 3, u: 0, n: 4, legs: '153:148', diff: '+5',  pts: 9,  status: null },
  { pos: 3, team: 'gambas',            name: 'Gambas',            sp: 6, s: 3, u: 0, n: 3, legs: '113:135', diff: '-22', pts: 9,  status: null },
  { pos: 4, team: 'silberpfeile-ii',   name: 'Silberpfeile II',   sp: 4, s: 3, u: 0, n: 1, legs: '104:72',  diff: '+32', pts: 9,  status: null },
  { pos: 5, team: 'treff-nix-freimann',name: 'Treff Nix Freimann',sp: 6, s: 2, u: 0, n: 4, legs: '120:136', diff: '-16', pts: 6,  status: null },
  { pos: 6, team: 'jolly-pirates-v',   name: 'Jolly Pirates V',   sp: 5, s: 1, u: 0, n: 4, legs: '83:134',  diff: '-51', pts: 3,  status: null },
];

const PLAYOFFS_A_ABSTIEG_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'spartans-vi',    name: 'Spartans VI',    sp: 3, s: 2, u: 0, n: 1, legs: '75:54', diff: '+21', pts: 6, status: null },
  { pos: 2, team: 'oldies-co',      name: 'Oldies & Co',    sp: 3, s: 2, u: 0, n: 1, legs: '70:64', diff: '+6',  pts: 6, status: null },
  { pos: 3, team: 'sound-warriors', name: "Sound Warrior's",sp: 3, s: 1, u: 0, n: 2, legs: '63:69', diff: '-6',  pts: 3, status: null },
  { pos: 4, team: 'game-over',      name: 'Game Over',      sp: 3, s: 1, u: 0, n: 2, legs: '54:75', diff: '-21', pts: 3, status: null },
];

const PLAYOFFS_B_AUFSTIEG_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'belfort-evolution',  name: 'Belfort Evolution',  sp: 7, s: 5, u: 1, n: 1, legs: '170:142', diff: '+28', pts: 16, status: null },
  { pos: 2, team: 'fiaker-deife',       name: 'Fiaker Deife',       sp: 7, s: 4, u: 0, n: 3, legs: '160:135', diff: '+25', pts: 12, status: null },
  { pos: 3, team: 'flying-seven',       name: 'Flying Seven',       sp: 6, s: 3, u: 1, n: 2, legs: '133:118', diff: '+15', pts: 10, status: null },
  { pos: 4, team: 'master-of-desaster', name: 'Master of Desaster', sp: 7, s: 2, u: 2, n: 3, legs: '150:154', diff: '-4',  pts: 8,  status: null },
  { pos: 5, team: 'freibad-bazis',      name: 'Freibad Bazis',      sp: 6, s: 2, u: 2, n: 2, legs: '126:133', diff: '-7',  pts: 8,  status: null },
  { pos: 6, team: 'flying-fighters',    name: 'Flying Fighters',    sp: 7, s: 1, u: 0, n: 6, legs: '121:178', diff: '-57', pts: 3,  status: null },
];

const PLAYOFFS_B_ABSTIEG_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'de-vogelwuidn',      name: "De Vogelwuid'n",     sp: 7, s: 4, u: 2, n: 1, legs: '171:136', diff: '+35', pts: 14, status: null },
  { pos: 2, team: 'lucky-darts-one',    name: 'Lucky Darts One',    sp: 7, s: 4, u: 1, n: 2, legs: '153:146', diff: '+7',  pts: 13, status: null },
  { pos: 3, team: 'team-desaster',      name: 'Team Desaster',      sp: 6, s: 3, u: 2, n: 1, legs: '144:109', diff: '+35', pts: 11, status: null },
  { pos: 4, team: 'de-hutzeldarter',    name: 'De Hutzeldarter',    sp: 6, s: 3, u: 1, n: 2, legs: '130:133', diff: '-3',  pts: 10, status: null },
  { pos: 5, team: 'massl-ghabt',        name: 'Massl Ghabt',        sp: 7, s: 2, u: 0, n: 5, legs: '137:171', diff: '-34', pts: 6,  status: null },
  { pos: 6, team: 'dc-dark-angels',     name: 'DC Dark Angels',     sp: 7, s: 0, u: 2, n: 5, legs: '129:169', diff: '-40', pts: 2,  status: null },
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
