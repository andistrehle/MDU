// ============================================================
// Münchner Dart Union — real data, Saison 2026
// Source: dartunion.de (scraped May 2026)
// ============================================================

// ── Types ────────────────────────────────────────────────────

export type LeagueCode = 'la' | 'a1' | 'a2' | 'b1' | 'b2' | 'c';

export interface League {
  code: LeagueCode;
  name: string;
  tier: string;
  teams: number;
  season: string;
  color: string;
  description: string;
}

export interface Team {
  id: string;
  name: string;
  short: string;
  color: string;
  venue: string;
  leagueCode?: LeagueCode;
}

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

// ── Leagues ──────────────────────────────────────────────────
// Saison 2026 · dartunion.de

export const LEAGUES: League[] = [
  {
    code: 'la',
    name: 'La Liga',
    tier: 'La Liga',
    teams: 6,
    season: '2026',
    color: '#E8B84A',
    description: 'Höchste Spielklasse der Münchner Dart Union',
  },
  {
    code: 'a1',
    name: 'A1 Liga',
    tier: 'A Liga',
    teams: 7,
    season: '2026',
    color: '#D40000',
    description: 'Zweithöchste Spielklasse der Münchner Dart Union',
  },
  {
    code: 'a2',
    name: 'A2 Liga',
    tier: 'A Liga',
    teams: 5,
    season: '2026',
    color: '#D40000',
    description: 'Dritte Spielklasse der Münchner Dart Union',
  },
  {
    code: 'b1',
    name: 'B1 Liga',
    tier: 'B Liga',
    teams: 6,
    season: '2026',
    color: '#3B82F6',
    description: 'Vierte Spielklasse der Münchner Dart Union',
  },
  {
    code: 'b2',
    name: 'B2 Liga',
    tier: 'B Liga',
    teams: 7,
    season: '2026',
    color: '#6366F1',
    description: 'Fünfte Spielklasse der Münchner Dart Union',
  },
  {
    code: 'c',
    name: 'C Liga',
    tier: 'C Liga',
    teams: 6,
    season: '2026',
    color: '#10B981',
    description: 'Unterste Spielklasse der Münchner Dart Union',
  },
];

// ── Teams ─────────────────────────────────────────────────────
// Real MDU teams · Saison 2026 · dartunion.de
// venue: 'Noch nicht verfügbar' where no public data available

export const TEAMS: Team[] = [
  // La Liga
  { id: 'spartans',          name: 'Spartans',             short: 'SPA', color: '#D40000', venue: 'Noch nicht verfügbar', leagueCode: 'la' },
  { id: 'ohne-jackie',       name: 'Ohne Jackie',          short: 'OJA', color: '#E8B84A', venue: 'Noch nicht verfügbar', leagueCode: 'la' },
  { id: 'jolly-pirates-kts', name: "Jolly Pirates KT's",   short: 'JPK', color: '#0EA5E9', venue: 'Noch nicht verfügbar', leagueCode: 'la' },
  { id: 'dc-null-bull',      name: 'DC Null Bull',         short: 'DNB', color: '#8B5CF6', venue: 'Noch nicht verfügbar', leagueCode: 'la' },
  { id: 'no-maam',           name: "No Ma'am",             short: 'NMA', color: '#22C55E', venue: 'Noch nicht verfügbar', leagueCode: 'la' },
  { id: 'les-dartagnons',    name: 'Les Dartagnons',       short: 'LDA', color: '#6B7280', venue: 'Noch nicht verfügbar', leagueCode: 'la' },

  // A1 Liga
  { id: 'alptraum',          name: 'Alptraum',             short: 'ALT', color: '#D40000', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },
  { id: 'dc-animals-ii',     name: 'DC Animals II',        short: 'DCA', color: '#3B82F6', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },
  { id: 'gambas',            name: 'Gambas',               short: 'GMB', color: '#F59E0B', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },
  { id: 'spartans-vi',       name: 'Spartans VI',          short: 'SP6', color: '#0EA5E9', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },
  { id: 'sound-warriors',    name: "Sound Warrior's",      short: 'SOW', color: '#8B5CF6', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },
  { id: 'game-over',         name: 'Game Over',            short: 'GMO', color: '#EF4444', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },
  { id: 'treff-nix-freimann',name: 'Treff Nix Freimann',  short: 'TNF', color: '#6B7280', venue: 'Noch nicht verfügbar', leagueCode: 'a1' },

  // A2 Liga
  { id: 'silberpfeile-ii',   name: 'Silberpfeile II',      short: 'SIL', color: '#C9CCD6', venue: 'Noch nicht verfügbar', leagueCode: 'a2' },
  { id: 'jolly-pirates-v',   name: 'Jolly Pirates V',      short: 'JPV', color: '#0EA5E9', venue: 'Noch nicht verfügbar', leagueCode: 'a2' },
  { id: 'de-wolperdinga',    name: 'De Wolperdinga',       short: 'DWP', color: '#A78BFA', venue: 'Noch nicht verfügbar', leagueCode: 'a2' },
  { id: 'oldies-co',         name: 'Oldies & Co',          short: 'OLD', color: '#F59E0B', venue: 'Noch nicht verfügbar', leagueCode: 'a2' },

  // B1 Liga
  { id: 'flying-fighters',   name: 'Flying Fighters',      short: 'FLF', color: '#EF4444', venue: 'Noch nicht verfügbar', leagueCode: 'b1' },
  { id: 'master-of-desaster',name: 'Master of Desaster',   short: 'MOD', color: '#8B5CF6', venue: 'Noch nicht verfügbar', leagueCode: 'b1' },
  { id: 'flying-seven',      name: 'Flying Seven',         short: 'FL7', color: '#0EA5E9', venue: 'Noch nicht verfügbar', leagueCode: 'b1' },
  { id: 'lucky-darts-one',   name: 'Lucky Darts One',      short: 'LD1', color: '#E8B84A', venue: 'Noch nicht verfügbar', leagueCode: 'b1' },
  { id: 'de-hutzeldarter',   name: 'De Hutzeldarter',      short: 'DHD', color: '#22C55E', venue: 'Noch nicht verfügbar', leagueCode: 'b1' },
  { id: 'massl-ghabt',       name: 'Massl Ghabt',          short: 'MSG', color: '#6B7280', venue: 'Noch nicht verfügbar', leagueCode: 'b1' },

  // B2 Liga
  { id: 'belfort-evolution', name: 'Belfort Evolution',    short: 'BEV', color: '#E8B84A', venue: 'Noch nicht verfügbar', leagueCode: 'b2' },
  { id: 'fiaker-deife',      name: 'Fiaker Deife',         short: 'FDF', color: '#0EA5E9', venue: 'Noch nicht verfügbar', leagueCode: 'b2' },
  { id: 'freibad-bazis',     name: 'Freibad Bazis',        short: 'FBB', color: '#D40000', venue: 'Noch nicht verfügbar', leagueCode: 'b2' },
  { id: 'team-desaster',     name: 'Team Desaster',        short: 'TDS', color: '#F59E0B', venue: 'Noch nicht verfügbar', leagueCode: 'b2' },
  { id: 'dc-dark-angels',    name: 'DC Dark Angels',       short: 'DDA', color: '#8B5CF6', venue: 'Noch nicht verfügbar', leagueCode: 'b2' },
  { id: 'de-vogelwuidn',     name: "De Vogelwuid'n",       short: 'DVN', color: '#22C55E', venue: 'Noch nicht verfügbar', leagueCode: 'b2' },

  // C Liga
  { id: 'wild-indians',      name: 'Wild Indians',         short: 'WID', color: '#E8B84A', venue: 'Noch nicht verfügbar', leagueCode: 'c' },
  { id: 'muenchen-0815',     name: 'München 08/15',        short: 'M08', color: '#D40000', venue: 'Noch nicht verfügbar', leagueCode: 'c' },
  { id: 'lucky-darts-two',   name: 'Lucky Darts Two',      short: 'LD2', color: '#22C55E', venue: 'Noch nicht verfügbar', leagueCode: 'c' },
  { id: 'funny-darters',     name: 'Funny Darters Munich', short: 'FDM', color: '#F59E0B', venue: 'Noch nicht verfügbar', leagueCode: 'c' },
  { id: 'black-devils',      name: 'Black Devils',         short: 'BLK', color: '#8B5CF6', venue: 'Noch nicht verfügbar', leagueCode: 'c' },
  { id: 'fuenf-sterne-boazn',name: '5 Sterne Boazn Team',  short: 'FSB', color: '#0EA5E9', venue: 'Noch nicht verfügbar', leagueCode: 'c' },
];

// EXTENDED_TEAMS kept for backwards compat — empty since all teams are in TEAMS
export const EXTENDED_TEAMS: Record<string, { name: string; short: string; color: string }> = {};

// ── Standings ─────────────────────────────────────────────────
// Data from dartunion.de · Saison 2026 · standings mid-season (playoff phase)
// Scoring: 3 pts per win · 1 pt draw · 0 pts loss
// Legs column = Spiele (individual game wins:losses within matches)
// Status: promo = promotion playoffs · releg = relegation playoffs

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
  // De Wolperdinga: Rückzug aus dem Spielbetrieb (Saisonabbruch — dartunion.de/news.php)
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
  { pos: 1, team: 'wild-indians',       name: 'Wild Indians',         sp: 17, s: 12, u: 3, n: 2, legs: '190:116', diff: '+74',  pts: 39, status: 'promo' },
  { pos: 2, team: 'muenchen-0815',      name: 'München 08/15',        sp: 17, s: 9,  u: 4, n: 4, legs: '171:135', diff: '+36',  pts: 31, status: 'promo' },
  { pos: 3, team: 'lucky-darts-two',    name: 'Lucky Darts Two',      sp: 17, s: 9,  u: 2, n: 6, legs: '160:146', diff: '+14',  pts: 29, status: 'promo' },
  { pos: 4, team: 'funny-darters',      name: 'Funny Darters Munich', sp: 16, s: 6,  u: 1, n: 9, legs: '140:148', diff: '-8',   pts: 19, status: null },
  { pos: 5, team: 'black-devils',       name: 'Black Devils',         sp: 17, s: 3,  u: 4, n: 10,legs: '126:180', diff: '-54',  pts: 13, status: 'releg' },
  { pos: 6, team: 'fuenf-sterne-boazn', name: '5 Sterne Boazn Team',  sp: 16, s: 2,  u: 4, n: 10,legs: '113:175', diff: '-62',  pts: 10, status: 'releg' },
];

// All standings indexed by league code
export const STANDINGS_BY_LEAGUE: Record<string, StandingRow[]> = {
  la: LA_LIGA_STANDINGS,
  a1: A1_LIGA_STANDINGS,
  a2: A2_LIGA_STANDINGS,
  b1: B1_LIGA_STANDINGS,
  b2: B2_LIGA_STANDINGS,
  c:  C_LIGA_STANDINGS,
};

// Legacy export — kept so old imports don't break while pages are updated
export const A1_STANDINGS = A1_LIGA_STANDINGS;

// ── Upcoming Matches ──────────────────────────────────────────
// Playoff phase Saison 2026 — exact dates on dartunion.de
// venue: 'Noch nicht verfügbar' where not publicly listed

export const UPCOMING: Match[] = [
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga', home: 'alptraum',          away: 'silberpfeile-ii',  venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs A Liga', home: 'gambas',             away: 'jolly-pirates-v',  venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga', home: 'belfort-evolution',  away: 'flying-fighters',  venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'Playoffs B Liga', home: 'fiaker-deife',       away: 'master-of-desaster',venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'C Liga',          home: 'wild-indians',       away: 'muenchen-0815',    venue: 'Noch nicht verfügbar' },
  { date: 'Mi · 28.05.2026', time: '20:00', league: 'C Liga',          home: 'lucky-darts-two',    away: 'funny-darters',    venue: 'Noch nicht verfügbar' },
];

export const HOME_MATCHES = UPCOMING.slice(0, 3);

// ── Results ───────────────────────────────────────────────────
// Real results from Pokal Fight 2026 (dartunion.de, Runde 1 Hinspiel)
// Individual league match results not publicly available in scrape-friendly form
// mvp: 'Noch nicht verfügbar' — not published online

export const RESULTS: Result[] = [
  { date: '07.12.2025', league: 'Pokal 2026', home: 'lucky-darts-one', away: 'de-vogelwuidn',      hs: 10, as: 8, mvp: 'Noch nicht verfügbar' },
  { date: '07.12.2025', league: 'Pokal 2026', home: 'game-over',       away: 'treff-nix-freimann', hs: 12, as: 6, mvp: 'Noch nicht verfügbar' },
  { date: '07.12.2025', league: 'Pokal 2026', home: 'belfort-evolution',away: 'flying-fighters',    hs:  0, as: 18, mvp: 'Noch nicht verfügbar' }, // walkover
];

// ── News ──────────────────────────────────────────────────────

export const HOME_NEWS: NewsItem[] = [
  {
    date: '21.05.2026',
    tag: 'AKTUELL',
    tagTone: 'red',
    title: 'De Wolperdinga ziehen sich mit sofortiger Wirkung vom Spielbetrieb zurück.',
  },
  {
    date: '14.05.2026',
    tag: 'PLAYOFFS',
    tagTone: 'gold',
    title: 'Playoffs Saison 2026 laufen — Aufstiegs- und Abstiegsspiele in vollem Gange.',
  },
  {
    date: '10.01.2026',
    tag: 'POKAL',
    tagTone: 'blue',
    title: 'Pokal Fight 2026: Alle Ergebnisse der Rückspiele jetzt auf dartunion.de.',
  },
];

// ── Roster ────────────────────────────────────────────────────
// Player data is not publicly available on dartunion.de.
// Captains / contact persons: see Kontakt on dartunion.de
// Real player rosters to be added once publicly listed.

export const ROSTER: RosterPlayer[] = [
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
  { name: 'Noch nicht verfügbar', role: 'Spieler', avg: '—', hf: '—', games: '—' },
];

// ── Helper functions ──────────────────────────────────────────

export function findTeam(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id);
}

export function findLeague(code: string): League | undefined {
  return LEAGUES.find(l => l.code === code.toLowerCase());
}

export function getStandings(code: string): StandingRow[] {
  return STANDINGS_BY_LEAGUE[code.toLowerCase()] ?? [];
}

export function getExtendedTeam(id: string): { name: string; short: string; color: string } {
  const team = TEAMS.find(t => t.id === id);
  if (team) return { name: team.name, short: team.short, color: team.color };
  // fallback for any unresolved IDs
  return { name: id, short: id.toUpperCase().slice(0, 3), color: '#9AA4B2' };
}
