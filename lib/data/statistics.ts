// ============================================================
// Player Statistics — Münchner Dart Union · Saison 2026
// Source: dartunion.de Einzelranglisten (individual rankings)
// Scraped: May 2026
//
// Only publicly available ranking data is stored here.
// No throw statistics, no leg-by-leg tracking.
// ============================================================

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

const LA_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Zlatko Lozancic',   teamId: 'ohne-jackie',      teamName: 'Ohne Jackie',        pts: 128, wins: 42, losses: 20 },
  { rank:  2, name: 'Stefan Schiegg',    teamId: 'spartans',         teamName: 'Spartans',           pts:  87, wins: 32, losses:  4 },
  { rank:  3, name: 'Maximilian Burgis', teamId: 'jolly-pirates-kts',teamName: "Jolly Pirates KT's", pts:  86, wins: 32, losses: 10 },
  { rank:  4, name: 'Markus Hartmann',   teamId: 'no-maam',          teamName: "No Ma'am",           pts:  83, wins: 29, losses: 15 },
  { rank:  5, name: 'Patrick Ruhland',   teamId: 'ohne-jackie',      teamName: 'Ohne Jackie',        pts:  83, wins: 28, losses:  4 },
  { rank:  6, name: 'Markus Schneider',  teamId: 'spartans',         teamName: 'Spartans',           pts:  81, wins: 28, losses: 10 },
  { rank:  7, name: 'Thomas Fraundorfer',teamId: 'spartans',         teamName: 'Spartans',           pts:  77, wins: 28, losses:  9 },
  { rank:  8, name: 'Andre Schwarz',     teamId: 'no-maam',          teamName: "No Ma'am",           pts:  71, wins: 23, losses: 33 },
  { rank:  9, name: 'Dragan Herceg',     teamId: 'no-maam',          teamName: "No Ma'am",           pts:  67, wins: 19, losses: 33 },
  { rank: 10, name: 'Avni Loshi',        teamId: 'dc-null-bull',     teamName: 'DC Null Bull',       pts:  65, wins: 23, losses: 13 },
];

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
  { rank:  1, name: 'Andree Sonntag',          teamId: 'jolly-pirates-v',  teamName: 'Jolly Pirates V',  pts: 68, wins: 24, losses:  8 },
  { rank:  2, name: 'Fabian Hilse',            teamId: 'oldies-co',        teamName: 'Oldies & Co',      pts: 63, wins: 24, losses:  8 },
  { rank:  3, name: 'Thomas Küblböck',         teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 62, wins: 20, losses: 12 },
  { rank:  4, name: 'Zoltan Toth',             teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 58, wins: 19, losses: 11 },
  { rank:  5, name: 'Stefan Armbruster',       teamId: 'jolly-pirates-v',  teamName: 'Jolly Pirates V',  pts: 54, wins: 19, losses:  9 },
  { rank:  6, name: 'Nebojsa Bole Petrovic',   teamId: 'de-wolperdinga',   teamName: 'De Wolperdinga',   pts: 49, wins: 17, losses: 11 },
  { rank:  7, name: 'Mario Vaccaro',           teamId: 'de-wolperdinga',   teamName: 'De Wolperdinga',   pts: 47, wins: 16, losses: 10 },
  { rank:  8, name: 'Michael Daxenberger',     teamId: 'silberpfeile-ii',  teamName: 'Silberpfeile II',  pts: 47, wins: 16, losses:  8 },
  { rank:  9, name: 'Manuel Buchholz',         teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 43, wins: 17, losses:  5 },
  { rank: 10, name: 'Michael Plesa',           teamId: 'silberpfeile-ii',  teamName: 'Silberpfeile II',  pts: 35, wins: 12, losses: 10 },
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

const C_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Benjamin Bauer',       teamId: 'lucky-darts-two',   teamName: 'Lucky Darts Two',      pts: 144, wins: 51, losses: 11 },
  { rank:  2, name: 'Linda Maier',          teamId: 'wild-indians',      teamName: 'Wild Indians',          pts: 142, wins: 51, losses: 13 },
  { rank:  3, name: 'Lukasz Wiacek',        teamId: 'muenchen-0815',     teamName: 'München 08/15',         pts: 129, wins: 46, losses: 22 },
  { rank:  4, name: 'Kostas Tsopanoglou',   teamId: 'muenchen-0815',     teamName: 'München 08/15',         pts: 124, wins: 43, losses: 25 },
  { rank:  5, name: 'Peter Keil',           teamId: 'wild-indians',      teamName: 'Wild Indians',          pts: 123, wins: 45, losses: 16 },
  { rank:  6, name: 'Marcus Kampmann',      teamId: 'funny-darters',     teamName: 'Funny Darters Munich',  pts:  91, wins: 34, losses: 17 },
  { rank:  7, name: 'Jessica von Mahren',   teamId: 'lucky-darts-two',   teamName: 'Lucky Darts Two',       pts:  88, wins: 31, losses: 29 },
  { rank:  8, name: 'Johanna Attenberger',  teamId: 'lucky-darts-two',   teamName: 'Lucky Darts Two',       pts:  86, wins: 26, losses: 33 },
  { rank:  9, name: 'Markus Steyer',        teamId: 'wild-indians',      teamName: 'Wild Indians',          pts:  85, wins: 30, losses: 17 },
  { rank: 10, name: 'Mita Burdulea',        teamId: 'black-devils',      teamName: 'Black Devils',          pts:  78, wins: 26, losses: 19 },
];

const PLAYOFFS_A_AUF_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Jörg Konrad',       teamId: 'dc-animals-ii',    teamName: 'DC Animals II',     pts: 74, wins: 25, losses:  3 },
  { rank:  2, name: 'Stefan Piperea',    teamId: 'alptraum',         teamName: 'Alptraum',          pts: 49, wins: 16, losses:  8 },
  { rank:  3, name: 'Alex Mückstein',    teamId: 'dc-animals-ii',    teamName: 'DC Animals II',     pts: 45, wins: 12, losses: 14 },
  { rank:  4, name: 'Zoltan Toth',       teamId: 'treff-nix-freimann',teamName: 'Treff Nix Freimann',pts: 44, wins: 15, losses:  5 },
  { rank:  5, name: 'Hans Reinicke',     teamId: 'alptraum',         teamName: 'Alptraum',          pts: 41, wins: 15, losses:  1 },
];

const PLAYOFFS_A_ABS_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Fabian Hilse',      teamId: 'oldies-co',        teamName: 'Oldies & Co',       pts: 31, wins: 11, losses:  1 },
  { rank:  2, name: 'Stefano Bernecker', teamId: 'spartans-vi',      teamName: 'Spartans VI',       pts: 26, wins:  9, losses:  3 },
  { rank:  3, name: 'Ludwig Ploetz',     teamId: 'spartans-vi',      teamName: 'Spartans VI',       pts: 25, wins: 10, losses:  2 },
  { rank:  4, name: 'Thorsten Edelmann', teamId: 'sound-warriors',   teamName: "Sound Warrior's",   pts: 24, wins:  8, losses:  4 },
  { rank:  5, name: 'Markus Hecht',      teamId: 'spartans-vi',      teamName: 'Spartans VI',       pts: 24, wins:  8, losses:  4 },
  { rank:  6, name: 'Reiner Schlutow',   teamId: 'game-over',        teamName: 'Game Over',         pts: 20, wins:  7, losses:  5 },
  { rank:  7, name: 'Thomas Hilse',      teamId: 'oldies-co',        teamName: 'Oldies & Co',       pts: 19, wins:  6, losses:  6 },
  { rank:  8, name: 'Florian Fink',      teamId: 'sound-warriors',   teamName: "Sound Warrior's",   pts: 18, wins:  7, losses:  5 },
  { rank:  9, name: 'Christian Rock',    teamId: 'sound-warriors',   teamName: "Sound Warrior's",   pts: 14, wins:  4, losses:  8 },
  { rank: 10, name: 'Annett Meyer',      teamId: 'game-over',        teamName: 'Game Over',         pts: 11, wins:  3, losses:  3 },
];

const PLAYOFFS_B_AUF_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Stefan Witteck',    teamId: 'flying-seven',       teamName: 'Flying Seven',       pts: 63, wins: 21, losses:  3 },
  { rank:  2, name: 'Manuel Rauch',      teamId: 'freibad-bazis',      teamName: 'Freibad Bazis',      pts: 60, wins: 22, losses:  2 },
  { rank:  3, name: 'Daniel Richter',    teamId: 'belfort-evolution',  teamName: 'Belfort Evolution',  pts: 59, wins: 20, losses:  8 },
  { rank:  4, name: 'Bernhard Hoffmann', teamId: 'fiaker-deife',       teamName: 'Fiaker Deife',       pts: 56, wins: 18, losses:  9 },
  { rank:  5, name: 'Michael Schreil',   teamId: 'fiaker-deife',       teamName: 'Fiaker Deife',       pts: 52, wins: 19, losses:  9 },
  { rank:  6, name: 'Thomas Schmid',     teamId: 'master-of-desaster', teamName: 'Master of Desaster', pts: 46, wins: 17, losses:  7 },
  { rank:  7, name: 'Markus Kuchenbaur', teamId: 'flying-fighters',    teamName: 'Flying Fighters',    pts: 42, wins: 14, losses: 12 },
  { rank:  8, name: 'Manfred Kling',     teamId: 'belfort-evolution',  teamName: 'Belfort Evolution',  pts: 40, wins: 13, losses: 11 },
  { rank:  9, name: 'Franz Freinberger', teamId: 'flying-seven',       teamName: 'Flying Seven',       pts: 35, wins: 12, losses: 12 },
  { rank: 10, name: 'Moritz Becker',     teamId: 'freibad-bazis',      teamName: 'Freibad Bazis',      pts: 35, wins: 12, losses:  8 },
];

const PLAYOFFS_B_ABS_STATS: PlayerStatEntry[] = [
  { rank:  1, name: 'Stephan Soos',    teamId: 'team-desaster',    teamName: 'Team Desaster',      pts: 62, wins: 21, losses:  3 },
  { rank:  2, name: 'Armin Abraham',   teamId: 'de-vogelwuidn',    teamName: "De Vogelwuid'n",     pts: 60, wins: 21, losses:  7 },
  { rank:  3, name: 'Michael Exner',   teamId: 'lucky-darts-one',  teamName: 'Lucky Darts One',    pts: 54, wins: 20, losses:  4 },
  { rank:  4, name: 'Daniel Leitze',   teamId: 'de-vogelwuidn',    teamName: "De Vogelwuid'n",     pts: 54, wins: 19, losses:  8 },
  { rank:  5, name: 'Robert Walter',   teamId: 'dc-dark-angels',   teamName: 'DC Dark Angels',     pts: 45, wins: 14, losses: 14 },
];

export const STATISTICS_BY_LEAGUE: Record<string, PlayerStatEntry[]> = {
  la:                    LA_STATS,
  a1:                    A1_STATS,
  a2:                    A2_STATS,
  b1:                    B1_STATS,
  b2:                    B2_STATS,
  c:                     C_STATS,
  'playoffs-a-aufstieg': PLAYOFFS_A_AUF_STATS,
  'playoffs-a-abstieg':  PLAYOFFS_A_ABS_STATS,
  'playoffs-b-aufstieg': PLAYOFFS_B_AUF_STATS,
  'playoffs-b-abstieg':  PLAYOFFS_B_ABS_STATS,
};

/** Returns the player statistics for a given league code. */
export function getStatisticsForLeague(leagueCode: string): PlayerStatEntry[] {
  return STATISTICS_BY_LEAGUE[leagueCode.toLowerCase()] ?? [];
}
