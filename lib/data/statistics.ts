// ============================================================
// Player Statistics — Münchner Dart Union · Saison 2026
// Source: dartunion.de Einzelranglisten (individual rankings)
//
// Architecture:
//   • Active leagues (La, C, all four Playoff groups) are served from
//     imported-statistics.json — updated by `npm run import:dartunion`.
//   • Completed regular-season leagues (A1, A2, B1, B2) are kept as
//     static TypeScript constants; their season is over and won't change.
//
// Only publicly available ranking data is stored here.
// No throw statistics, no leg-by-leg tracking.
// ============================================================

import importedRaw from './imported-statistics.json';

export interface PlayerStatEntry {
  rank:     number;
  name:     string;
  teamId:   string;
  teamName: string;
  pts:      number;
  wins:     number;
  losses:   number;
}

export interface LeagueStatistics {
  leagueId: string;
  players:  PlayerStatEntry[];
}

// ── Completed regular-season leagues (static) ─────────────────
// These leagues finished their season. Data will not change.

const A1_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Stefan Piperea',     teamId: 'alptraum',       teamName: 'Alptraum',         pts: 110, wins: 37, losses: 17 },
  { rank:  2, name: 'Stefano Bernecker',  teamId: 'spartans-vi',    teamName: 'Spartans VI',      pts: 105, wins: 39, losses:  9 },
  { rank:  3, name: 'Hans Reinicke',      teamId: 'alptraum',       teamName: 'Alptraum',         pts: 103, wins: 39, losses:  1 },
  { rank:  4, name: 'Jörg Konrad',        teamId: 'dc-animals-ii',  teamName: 'DC Animals II',    pts:  95, wins: 33, losses: 10 },
  { rank:  5, name: 'Thorsten Edelmann',  teamId: 'sound-warriors', teamName: "Sound Warrior's",  pts:  86, wins: 29, losses: 15 },
  { rank:  6, name: 'Markus Hecht',       teamId: 'spartans-vi',    teamName: 'Spartans VI',      pts:  65, wins: 23, losses: 20 },
  { rank:  7, name: 'Christian Rock',     teamId: 'sound-warriors', teamName: "Sound Warrior's",  pts:  65, wins: 21, losses: 23 },
  { rank:  8, name: 'Harald Rathgeb',     teamId: 'gambas',         teamName: 'Gambas',           pts:  58, wins: 20, losses: 18 },
  { rank:  9, name: 'Axel Heider',        teamId: 'gambas',         teamName: 'Gambas',           pts:  57, wins: 22, losses: 18 },
  { rank: 10, name: 'Annett Meyer',       teamId: 'game-over',      teamName: 'Game Over',        pts:  53, wins: 18, losses: 18 },
];

const A2_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Andree Sonntag',          teamId: 'jolly-pirates-v',   teamName: 'Jolly Pirates V',   pts: 68, wins: 24, losses:  8 },
  { rank:  2, name: 'Fabian Hilse',            teamId: 'oldies-co',         teamName: 'Oldies & Co',       pts: 63, wins: 24, losses:  8 },
  { rank:  3, name: 'Thomas Küblböck',         teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 62, wins: 20, losses: 12 },
  { rank:  4, name: 'Zoltan Toth',             teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 58, wins: 19, losses: 11 },
  { rank:  5, name: 'Stefan Armbruster',       teamId: 'jolly-pirates-v',   teamName: 'Jolly Pirates V',   pts: 54, wins: 19, losses:  9 },
  { rank:  6, name: 'Nebojsa Bole Petrovic',   teamId: 'de-wolperdinga',    teamName: 'De Wolperdinga',    pts: 49, wins: 17, losses: 11 },
  { rank:  7, name: 'Mario Vaccaro',           teamId: 'de-wolperdinga',    teamName: 'De Wolperdinga',    pts: 47, wins: 16, losses: 10 },
  { rank:  8, name: 'Michael Daxenberger',     teamId: 'silberpfeile-ii',   teamName: 'Silberpfeile II',   pts: 47, wins: 16, losses:  8 },
  { rank:  9, name: 'Manuel Buchholz',         teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 43, wins: 17, losses:  5 },
  { rank: 10, name: 'Michael Plesa',           teamId: 'silberpfeile-ii',   teamName: 'Silberpfeile II',   pts: 35, wins: 12, losses: 10 },
];

const B1_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Stefan Witteck',    teamId: 'flying-seven',       teamName: 'Flying Seven',       pts: 99, wins: 37, losses:  1 },
  { rank:  2, name: 'Dominik Brengel',   teamId: 'flying-fighters',    teamName: 'Flying Fighters',    pts: 82, wins: 30, losses:  8 },
  { rank:  3, name: 'Christoph Löb',     teamId: 'de-hutzeldarter',    teamName: 'De Hutzeldarter',    pts: 67, wins: 22, losses: 13 },
  { rank:  4, name: 'Torsten Bauer',     teamId: 'lucky-darts-one',    teamName: 'Lucky Darts One',    pts: 65, wins: 23, losses: 16 },
  { rank:  5, name: 'Fritz Müller',      teamId: 'de-hutzeldarter',    teamName: 'De Hutzeldarter',    pts: 58, wins: 20, losses: 16 },
  { rank:  6, name: 'Nikola Masic',      teamId: 'flying-fighters',    teamName: 'Flying Fighters',    pts: 58, wins: 20, losses:  8 },
  { rank:  7, name: 'Benjamin Kouhi',    teamId: 'master-of-desaster', teamName: 'Master of Desaster', pts: 56, wins: 21, losses:  5 },
  { rank:  8, name: 'Andre Widl',        teamId: 'master-of-desaster', teamName: 'Master of Desaster', pts: 53, wins: 19, losses:  5 },
  { rank:  9, name: 'Thomas Schmid',     teamId: 'master-of-desaster', teamName: 'Master of Desaster', pts: 53, wins: 17, losses:  8 },
  { rank: 10, name: 'Uli Biber',         teamId: 'flying-fighters',    teamName: 'Flying Fighters',    pts: 52, wins: 19, losses:  4 },
];

const B2_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Daniel Richter',    teamId: 'belfort-evolution',  teamName: 'Belfort Evolution',  pts: 118, wins: 43, losses: 13 },
  { rank:  2, name: 'Bernhard Hoffmann', teamId: 'fiaker-deife',       teamName: 'Fiaker Deife',       pts:  94, wins: 34, losses:  8 },
  { rank:  3, name: 'Manuel Rauch',      teamId: 'freibad-bazis',      teamName: 'Freibad Bazis',      pts:  92, wins: 33, losses:  3 },
  { rank:  4, name: 'Stephan Soos',      teamId: 'team-desaster',      teamName: 'Team Desaster',      pts:  92, wins: 31, losses: 12 },
  { rank:  5, name: 'Christian Matejka', teamId: 'fiaker-deife',       teamName: 'Fiaker Deife',       pts:  85, wins: 29, losses:  6 },
  { rank:  6, name: 'Michael Schreil',   teamId: 'fiaker-deife',       teamName: 'Fiaker Deife',       pts:  72, wins: 25, losses:  9 },
  { rank:  7, name: 'Franz Eberl',       teamId: 'dc-dark-angels',     teamName: 'DC Dark Angels',     pts:  64, wins: 24, losses: 20 },
  { rank:  8, name: 'Robert Walter',     teamId: 'dc-dark-angels',     teamName: 'DC Dark Angels',     pts:  63, wins: 20, losses: 24 },
  { rank:  9, name: 'Manfred Kling',     teamId: 'belfort-evolution',  teamName: 'Belfort Evolution',  pts:  62, wins: 21, losses: 25 },
  { rank: 10, name: 'Uli Kurz',          teamId: 'team-desaster',      teamName: 'Team Desaster',      pts:  61, wins: 18, losses: 24 },
];

// ── Active leagues — loaded from imported-statistics.json ──────
// Run `npm run import:dartunion` to refresh.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IMPORTED = importedRaw as unknown as Record<string, PlayerStatEntry[]>;

// ── Unified map ────────────────────────────────────────────────

export const STATISTICS_BY_LEAGUE: Record<string, PlayerStatEntry[]> = {
  a1: A1_STATS,
  a2: A2_STATS,
  b1: B1_STATS,
  b2: B2_STATS,
  ...IMPORTED,
};

/** Returns the player statistics for a given league code. */
export function getStatisticsForLeague(leagueCode: string): PlayerStatEntry[] {
  return STATISTICS_BY_LEAGUE[leagueCode.toLowerCase()] ?? [];
}
