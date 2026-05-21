// ============================================================
// Seasons — Münchner Dart Union
// ============================================================
//
// HOW TO ADD A NEW SEASON:
//   1. Add a new Season to SEASONS with a unique id and status: 'planned'
//   2. When the season starts, change its status to 'current'
//   3. Change the old 'current' season to status: 'archived'
//   4. Add SeasonTeamAssignments in lib/data/assignments.ts for every
//      team → league → venue mapping in the new season
//   5. Add standings data in lib/data/standings.ts
//   6. Add upcoming matches in lib/data/matches.ts
//
// HOW TO ARCHIVE A SEASON:
//   Set status: 'archived' — do NOT delete the season entry.
//   Historical standings and assignments rely on the seasonId.
//
// ============================================================

export type SeasonStatus = 'current' | 'archived' | 'planned';

export interface Season {
  /** Unique identifier used in assignments (e.g. 'season-2026') */
  id: string;
  /** Display name shown in the UI (e.g. 'Saison 2026') */
  name: string;
  /** Calendar year */
  year: number;
  status: SeasonStatus;
}

export const SEASONS: Season[] = [
  {
    id: 'season-2026',
    name: 'Saison 2026',
    year: 2026,
    status: 'current',
  },
  // Previous seasons can be added here as 'archived' for historical data.
  // Example:
  // { id: 'season-2025', name: 'Saison 2025', year: 2025, status: 'archived' },
];

/**
 * Returns the currently active season.
 * Throws if no season has status 'current' — ensure SEASONS has exactly one 'current' entry.
 */
export function getCurrentSeason(): Season {
  const s = SEASONS.find(s => s.status === 'current');
  if (!s) throw new Error('No current season defined. Set status: "current" on one Season in lib/data/seasons.ts');
  return s;
}
