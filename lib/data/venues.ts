// ============================================================
// Venues (Spielstätten) — Münchner Dart Union
// ============================================================
//
// Venue data is not publicly available on dartunion.de.
// Entries will be added here once venue information is published.
//
// HOW TO ADD A VENUE:
//   1. Add a Venue record here with a unique id
//   2. Reference the venueId in lib/data/assignments.ts under the
//      relevant SeasonTeamAssignment for that team × season
//
// IMPORTANT:
//   - A venue can be used by multiple teams (multiple assignments can
//     reference the same venueId)
//   - A team can change venues between seasons — only update the
//     assignment for the new season, not the team record itself
//
// ============================================================

export interface Venue {
  /** Unique identifier (e.g. 'gasthof-zum-hirschen') */
  id: string;
  /** Public display name of the venue (pub, club, bar, etc.) */
  name: string;
  /** Street address, if publicly available */
  address?: string;
  /** City */
  city?: string;
  /** Additional notes (opening hours, table count, parking, etc.) */
  notes?: string;
}

// No public venue data available for Saison 2026 yet.
// Venue records will be added here when information is published on dartunion.de.
export const VENUES: Venue[] = [];

/** Returns a venue by id, or undefined if not found. */
export function findVenue(id: string): Venue | undefined {
  return VENUES.find(v => v.id === id);
}
