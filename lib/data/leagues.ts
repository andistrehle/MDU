// ============================================================
// Leagues — Münchner Dart Union
// ============================================================
//
// Official league order (level 1 = highest division):
//   1  La Liga
//   2  A1 Liga
//   3  A2 Liga
//   4  B1 Liga
//   5  B2 Liga
//   6  C Liga
//
// A team's league assignment is stored in lib/data/assignments.ts,
// NOT on the team entity itself. This allows teams to move between
// leagues each season.
//
// ============================================================

/** Regular-season league codes (used as foreign key in SeasonTeamAssignment). */
export type RegularLeagueCode = 'la' | 'a1' | 'a2' | 'b1' | 'b2' | 'c';

/** Playoff competition codes — NOT used in SeasonTeamAssignment. */
export type PlayoffCode =
  | 'playoffs-a-aufstieg'
  | 'playoffs-a-abstieg'
  | 'playoffs-b-aufstieg'
  | 'playoffs-b-abstieg';

/** Union of all competition codes — used in League.id / League.code. */
export type LeagueCode = RegularLeagueCode | PlayoffCode;

export interface League {
  /** Canonical identifier — same value as code */
  id: LeagueCode;
  /** Backwards-compat field — same value as id (used by existing pages) */
  code: LeagueCode;
  /** Full display name (e.g. 'A1 Liga') */
  name: string;
  /** Division level: 1 = highest, ascending */
  level: number;
  /** Display sort order for listing pages (matches level for MDU) */
  sortOrder: number;
  /** Tier group label (e.g. 'A Liga') — kept for backwards compat */
  tier: string;
  /** Team count for the current season (informational) */
  teams: number;
  /** Current season label (e.g. '2026') — kept for backwards compat */
  season: string;
  /** Brand color hex */
  color: string;
  /** Short description */
  description: string;
  /** 'regular' = normal league season; 'playoff' = promotion/relegation rounds */
  type?: 'regular' | 'playoff';
}

// Official league order per MDU regulations
export const LEAGUES: League[] = [
  {
    id: 'la', code: 'la',
    name: 'La Liga', tier: 'La Liga',
    level: 1, sortOrder: 1,
    teams: 6, season: '2026',
    color: '#E8B84A',
    description: 'Höchste Spielklasse der Münchner Dart Union',
  },
  {
    id: 'a1', code: 'a1',
    name: 'A1 Liga', tier: 'A Liga',
    level: 2, sortOrder: 2,
    teams: 7, season: '2026',
    color: '#D40000',
    description: 'Zweithöchste Spielklasse der Münchner Dart Union',
  },
  {
    id: 'a2', code: 'a2',
    name: 'A2 Liga', tier: 'A Liga',
    level: 3, sortOrder: 3,
    teams: 5, season: '2026',
    color: '#D40000',
    description: 'Dritte Spielklasse der Münchner Dart Union',
  },
  {
    id: 'b1', code: 'b1',
    name: 'B1 Liga', tier: 'B Liga',
    level: 4, sortOrder: 4,
    teams: 6, season: '2026',
    color: '#3B82F6',
    description: 'Vierte Spielklasse der Münchner Dart Union',
  },
  {
    id: 'b2', code: 'b2',
    name: 'B2 Liga', tier: 'B Liga',
    level: 5, sortOrder: 5,
    teams: 6, season: '2026',
    color: '#6366F1',
    description: 'Fünfte Spielklasse der Münchner Dart Union',
  },
  {
    id: 'c', code: 'c',
    name: 'C Liga', tier: 'C Liga',
    level: 6, sortOrder: 6,
    teams: 6, season: '2026',
    color: '#10B981',
    description: 'Unterste Spielklasse der Münchner Dart Union',
  },

  // ── Playoff Rounds · Saison 2026 ─────────────────────────────
  // Source: dartunion.de (9 competitions listed, 4 playoff groups)
  // Aufstieg teams sourced from confirmed upcoming matches.
  // Abstieg teams: Daten folgen auf dartunion.de.
  {
    id: 'playoffs-a-aufstieg', code: 'playoffs-a-aufstieg',
    name: 'Playoffs A Liga Aufstieg', tier: 'Playoffs A Liga',
    level: 7, sortOrder: 7,
    teams: 6, season: '2026',
    color: '#D40000',
    description: 'Aufstiegs-Playoffs der A Liga · Saison 2026',
    type: 'playoff',
  },
  {
    id: 'playoffs-a-abstieg', code: 'playoffs-a-abstieg',
    name: 'Playoffs A Liga Abstieg', tier: 'Playoffs A Liga',
    level: 8, sortOrder: 8,
    teams: 4, season: '2026',
    color: '#D40000',
    description: 'Abstiegs-Playoffs der A Liga · Saison 2026',
    type: 'playoff',
  },
  {
    id: 'playoffs-b-aufstieg', code: 'playoffs-b-aufstieg',
    name: 'Playoffs B Liga Aufstieg', tier: 'Playoffs B Liga',
    level: 9, sortOrder: 9,
    teams: 6, season: '2026',
    color: '#3B82F6',
    description: 'Aufstiegs-Playoffs der B Liga · Saison 2026',
    type: 'playoff',
  },
  {
    id: 'playoffs-b-abstieg', code: 'playoffs-b-abstieg',
    name: 'Playoffs B Liga Abstieg', tier: 'Playoffs B Liga',
    level: 10, sortOrder: 10,
    teams: 6, season: '2026',
    color: '#6366F1',
    description: 'Abstiegs-Playoffs der B Liga · Saison 2026',
    type: 'playoff',
  },
];

/** Returns a league by its code/id, or undefined if not found. */
export function findLeague(code: string): League | undefined {
  return LEAGUES.find(l => l.code === code.toLowerCase());
}
