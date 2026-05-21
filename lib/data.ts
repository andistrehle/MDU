export type LeagueCode = 'LA' | 'A' | 'A2' | 'B' | 'B2' | 'C' | 'C2';

export interface League {
  code: LeagueCode;
  name: string;
  tier: string;
  teams: number;
  season: string;
  color: string;
}

export interface Team {
  id: string;
  name: string;
  short: string;
  color: string;
  venue: string;
}

export type StandingStatus = 'promo' | 'playoff' | 'releg' | null;

export interface Standing {
  pos: number;
  team: string;
  p: number;
  w: number;
  l: number;
  legs: string;
  diff: string;
  pts: number;
  form: ('W' | 'L')[];
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
  title: string;
  date: string;
  read: string;
}

export interface RosterPlayer {
  name: string;
  role: string;
  avg: number;
  hf: string;
  games: number;
}

export const LEAGUES: League[] = [
  { code: 'LA', name: 'La Liga',  tier: 'Elite',    teams: 10, season: '2025/26', color: '#E8B84A' },
  { code: 'A',  name: 'A Liga',   tier: 'Division', teams: 12, season: '2025/26', color: '#D40000' },
  { code: 'A2', name: 'A2 Liga',  tier: 'Division', teams: 12, season: '2025/26', color: '#D40000' },
  { code: 'B',  name: 'B Liga',   tier: 'Division', teams: 14, season: '2025/26', color: '#FF6B35' },
  { code: 'B2', name: 'B2 Liga',  tier: 'Division', teams: 14, season: '2025/26', color: '#FF6B35' },
  { code: 'C',  name: 'C Liga',   tier: 'Division', teams: 16, season: '2025/26', color: '#3B82F6' },
  { code: 'C2', name: 'C2 Liga',  tier: 'Division', teams: 16, season: '2025/26', color: '#3B82F6' },
];

export const TEAMS: Team[] = [
  { id: 'fb',  name: 'Freibad Bazis',       short: 'FBB', color: '#D40000', venue: 'Fiaker Stüberl' },
  { id: 'fd',  name: 'Fiaker Deife',         short: 'FDF', color: '#0EA5E9', venue: "Toni's Wirtshaus" },
  { id: 'be',  name: 'Belfort Evolution',    short: 'BEV', color: '#E8B84A', venue: 'Dartpoint Giesing' },
  { id: 'vw',  name: 'Vogelwuid’n',     short: 'VWN', color: '#22C55E', venue: 'Pasinger Stadl' },
  { id: 'fa',  name: 'Flying Arrows',        short: 'FLA', color: '#8B5CF6', venue: 'Bullseye Schwabing' },
  { id: 'db',  name: 'DC Bavaria',           short: 'DCB', color: '#F59E0B', venue: 'Maxvorstadt Treff' },
  { id: 'gh',  name: 'Giesinger Highscores', short: 'GHS', color: '#EF4444', venue: 'Dartpoint Giesing' },
  { id: 'wb',  name: 'Wiesn Bullseyes',      short: 'WSB', color: '#10B981', venue: "Toni's Wirtshaus" },
  { id: 'sw',  name: 'Schwabing Sharks',     short: 'SWS', color: '#3B82F6', venue: 'Bullseye Schwabing' },
  { id: 'ob',  name: 'Olympia Bombers',      short: 'OBR', color: '#A78BFA', venue: 'Olympia Bar' },
];

export const EXTENDED_TEAMS: Record<string, { name: string; short: string; color: string }> = {
  db: { name: 'DC Bavaria',       short: 'DCB', color: '#F59E0B' },
  fa: { name: 'Flying Arrows',    short: 'FLA', color: '#8B5CF6' },
  sb: { name: 'Super Bulls',      short: 'SBL', color: '#EF4444' },
  dc: { name: 'Dart Crew',        short: 'DRC', color: '#0EA5E9' },
  tt: { name: 'Triple Trouble',   short: 'TT',  color: '#10B981' },
  sf: { name: 'Schwabing Flyers', short: 'SF',  color: '#A78BFA' },
  dw: { name: 'Dart Wizards',     short: 'DW',  color: '#3B82F6' },
  be: { name: "Bull's Eye",       short: 'BE',  color: '#EF4444' },
  nf: { name: 'Night Flights',    short: 'NF',  color: '#0EA5E9' },
  dd: { name: 'Die Dartiven',     short: 'DD',  color: '#A78BFA' },
  cc: { name: 'Close Call',       short: 'CC',  color: '#10B981' },
  os: { name: 'Old School Darts', short: 'OS',  color: '#6B7280' },
};

export const STANDINGS: Standing[] = [
  { pos: 1,  team: 'fb', p: 14, w: 12, l: 2,  legs: '168:84',  diff: '+84', pts: 36, form: ['W','W','W','W','L'], status: 'promo' },
  { pos: 2,  team: 'be', p: 14, w: 11, l: 3,  legs: '162:90',  diff: '+72', pts: 33, form: ['W','W','L','W','W'], status: 'promo' },
  { pos: 3,  team: 'sw', p: 14, w: 10, l: 4,  legs: '155:97',  diff: '+58', pts: 30, form: ['W','L','W','W','W'], status: 'playoff' },
  { pos: 4,  team: 'fa', p: 14, w: 9,  l: 5,  legs: '148:104', diff: '+44', pts: 27, form: ['W','W','W','L','L'], status: 'playoff' },
  { pos: 5,  team: 'db', p: 14, w: 8,  l: 6,  legs: '139:113', diff: '+26', pts: 24, form: ['L','W','W','W','W'], status: null },
  { pos: 6,  team: 'gh', p: 14, w: 7,  l: 7,  legs: '128:124', diff: '+4',  pts: 21, form: ['L','W','L','W','W'], status: null },
  { pos: 7,  team: 'wb', p: 14, w: 6,  l: 8,  legs: '122:130', diff: '-8',  pts: 18, form: ['W','L','L','W','L'], status: null },
  { pos: 8,  team: 'fd', p: 14, w: 5,  l: 9,  legs: '114:138', diff: '-24', pts: 15, form: ['L','L','W','L','W'], status: null },
  { pos: 9,  team: 'ob', p: 14, w: 4,  l: 10, legs: '108:144', diff: '-36', pts: 12, form: ['L','W','L','L','L'], status: 'releg' },
  { pos: 10, team: 'vw', p: 14, w: 2,  l: 12, legs: '92:160',  diff: '-68', pts: 6,  form: ['L','L','L','L','W'], status: 'releg' },
];

export const A1_STANDINGS = [
  { pos: 1, team: 'db', name: 'DC Bavaria',      sp: 10, s: 8, u: 1, n: 1, legs: '78:42',  diff: '+36', pts: 17, status: 'promo' as StandingStatus },
  { pos: 2, team: 'fa', name: 'Flying Arrows',   sp: 10, s: 7, u: 1, n: 2, legs: '75:45',  diff: '+30', pts: 15, status: 'promo' as StandingStatus },
  { pos: 3, team: 'dw', name: 'Dart Wizards',    sp: 10, s: 6, u: 0, n: 4, legs: '68:52',  diff: '+16', pts: 12, status: 'playoff' as StandingStatus },
  { pos: 4, team: 'be', name: "Bull's Eye",      sp: 10, s: 5, u: 1, n: 4, legs: '60:60',  diff: '0',   pts: 11, status: 'playoff' as StandingStatus },
  { pos: 5, team: 'nf', name: 'Night Flights',   sp: 10, s: 3, u: 1, n: 6, legs: '50:70',  diff: '-20', pts: 7,  status: null },
  { pos: 6, team: 'dd', name: 'Die Dartiven',    sp: 10, s: 2, u: 1, n: 7, legs: '44:76',  diff: '-32', pts: 5,  status: null },
  { pos: 7, team: 'cc', name: 'Close Call',      sp: 10, s: 1, u: 1, n: 8, legs: '38:82',  diff: '-44', pts: 3,  status: 'releg' as StandingStatus },
  { pos: 8, team: 'os', name: 'Old School Darts',sp: 10, s: 0, u: 0, n: 10,legs: '28:92',  diff: '-64', pts: 0,  status: 'releg' as StandingStatus },
];

export const UPCOMING: Match[] = [
  { date: 'Mi · 22.05', time: '19:30', league: 'A Liga',  home: 'fb', away: 'be', venue: 'Fiaker Stüberl' },
  { date: 'Mi · 22.05', time: '19:30', league: 'A Liga',  home: 'sw', away: 'fa', venue: 'Bullseye Schwabing' },
  { date: 'Do · 23.05', time: '20:00', league: 'B Liga',  home: 'db', away: 'gh', venue: 'Maxvorstadt Treff' },
  { date: 'Do · 23.05', time: '20:00', league: 'A Liga',  home: 'wb', away: 'fd', venue: "Toni's Wirtshaus" },
];

export const HOME_MATCHES = [
  { league: 'A1 Liga', home: 'db', away: 'fa', date: '25.05.2024', time: '19:30 Uhr', venue: 'Dartpoint Giesing' },
  { league: 'B2 Liga', home: 'sb', away: 'dc', date: '26.05.2024', time: '18:00 Uhr', venue: 'Zum Roten Pfeil' },
  { league: 'C2 Liga', home: 'tt', away: 'sf', date: '26.05.2024', time: '17:00 Uhr', venue: 'Dart Base' },
];

export const RESULTS: Result[] = [
  { date: '15.05', league: 'A Liga',   home: 'fb', away: 'fd', hs: 7, as: 2, mvp: 'M. Achatz' },
  { date: '15.05', league: 'A Liga',   home: 'be', away: 'vw', hs: 8, as: 1, mvp: 'L. Reiter' },
  { date: '14.05', league: 'B Liga',   home: 'gh', away: 'sw', hs: 5, as: 4, mvp: 'T. Huber' },
  { date: '14.05', league: 'A2 Liga',  home: 'ob', away: 'wb', hs: 3, as: 6, mvp: 'F. König' },
  { date: '13.05', league: 'La Liga',  home: 'fa', away: 'db', hs: 6, as: 3, mvp: 'S. Brandl' },
];

export const NEWS: NewsItem[] = [
  { tag: 'Saison',    title: 'Endspurt der Saison 2025/26: Wer fährt zum Finalturnier?',       date: '18. Mai 2026', read: '4 Min' },
  { tag: 'Interview', title: '„Wir sind hungrig wie nie" – Captain Achatz im Gespräch',        date: '16. Mai 2026', read: '6 Min' },
  { tag: 'Verein',    title: 'Neue Spielstätte in Pasing — die Stadl-Stuben öffnen ihre Türen',date: '14. Mai 2026', read: '3 Min' },
];

export const HOME_NEWS = [
  { date: '20.05.2024', tag: 'ALLGEMEIN', tagTone: 'red'  as const, title: 'Die neue Saison 2026 startet im September — alle Infos folgen!' },
  { date: '18.05.2024', tag: 'TURNIER',   tagTone: 'gold' as const, title: 'Anmeldung zum MDU Sommer Cup ab sofort geöffnet.' },
  { date: '15.05.2024', tag: 'INFO',      tagTone: 'blue' as const, title: 'Neue Spielstätte in der C2 Liga: Dartpoint Giesing' },
];

export const ROSTER: RosterPlayer[] = [
  { name: 'M. Achatz',    role: 'Captain', avg: 92.4, hf: '180×24', games: 28 },
  { name: 'S. Brandl',    role: 'Vice',    avg: 88.1, hf: '180×19', games: 28 },
  { name: 'L. Reiter',    role: 'Spieler', avg: 86.7, hf: '180×17', games: 27 },
  { name: 'T. Huber',     role: 'Spieler', avg: 84.2, hf: '180×14', games: 25 },
  { name: 'F. König',     role: 'Spieler', avg: 82.9, hf: '180×12', games: 24 },
  { name: 'A. Steininger',role: 'Spieler', avg: 81.4, hf: '180×9',  games: 22 },
  { name: 'J. Vogl',      role: 'Reserve', avg: 79.6, hf: '180×6',  games: 14 },
  { name: 'P. Hartl',     role: 'Reserve', avg: 77.8, hf: '180×3',  games: 9 },
];

export function findTeam(id: string): Team | undefined {
  return TEAMS.find(t => t.id === id);
}

export function getExtendedTeam(id: string) {
  return EXTENDED_TEAMS[id] ?? TEAMS.find(t => t.id === id) ?? { name: id, short: id.toUpperCase().slice(0, 3), color: '#9AA4B2' };
}
