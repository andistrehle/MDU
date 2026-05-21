// ============================================================
// Season Assignments — Münchner Dart Union
// ============================================================
//
// This file defines WHICH team plays in WHICH league during WHICH season,
// along with their venue and captain for that specific season.
//
// WHY THIS EXISTS:
//   Teams can move between leagues, change venues, and swap captains
//   every season. Storing these here (instead of on the team entity)
//   allows historical lookups to remain accurate, and makes it trivial
//   to set up a new season without changing team records.
//
// ── HOW TO SET UP A NEW SEASON ──────────────────────────────
//   1. Create the season in lib/data/seasons.ts
//   2. For each team, add a SeasonTeamAssignment with:
//        seasonId  → the new season's id
//        leagueId  → the league they play in (may differ from last season)
//        teamId    → references Team.id in lib/data/teams.ts
//        venueId   → (optional) references Venue.id in lib/data/venues.ts
//        captain   → (optional) string name
//   3. Teams NOT listed for a season are considered absent that season.
//
// ── HOW TO ARCHIVE A SEASON ─────────────────────────────────
//   1. Set the season status to 'archived' in lib/data/seasons.ts
//   2. Do NOT delete old SeasonTeamAssignments — they are the
//      historical record of who played where.
//
// ── HOW TO IMPORT FROM CSV/JSON ─────────────────────────────
//   Parse your CSV/JSON and generate SeasonTeamAssignment objects
//   with the fields below. Each row in the CSV corresponds to one
//   assignment: team, league, season, venue (optional), captain (optional).
//
// ============================================================

import type { LeagueCode } from './leagues';
import { LEAGUES } from './leagues';
import { TEAMS, type Team } from './teams';
import { VENUES, type Venue } from './venues';

export interface SeasonTeamAssignment {
  /** Unique identifier for this assignment record */
  id: string;
  /** References Season.id in lib/data/seasons.ts */
  seasonId: string;
  /** References League.id — the league this team plays in this season */
  leagueId: LeagueCode;
  /** References Team.id in lib/data/teams.ts */
  teamId: string;
  /** References Venue.id in lib/data/venues.ts — optional until venue data is available */
  venueId?: string;
  /** Captain name for this season — optional until data is available */
  captain?: string;
  /** Free-text notes (e.g. mid-season transfer, withdrawal from competition) */
  notes?: string;
}

export interface TeamPlayerAssignment {
  /** Unique identifier */
  id: string;
  /** References Season.id */
  seasonId: string;
  /** References Team.id */
  teamId: string;
  /** References Player.id in lib/data/players.ts */
  playerId: string;
  /** Player's role/status within the team for this season */
  status: 'active' | 'inactive' | 'substitute' | 'unknown';
}

// ── Saison 2026 · season-2026 ────────────────────────────────
// Source: dartunion.de · "TC's und Lokale" · scraped May 2026
//
// PRIVACY: Phone numbers from dartunion.de are NOT stored here.
//          Do NOT add phone numbers. Do NOT render them in the UI.
//
// Special cases:
//   treff-nix-freimann  — Started Saison 2026 in A1 (4 games, 0 pts, relegated early).
//                          Now assigned to A2 for the remainder of the season / playoffs.
//   de-wolperdinga      — Withdrew from competition mid-season (Rückzug, Mai 2026).
//                          Kept in A2 assignment for historical accuracy; team status: inactive.

export const SEASON_TEAM_ASSIGNMENTS: SeasonTeamAssignment[] = [
  // ── La Liga ───────────────────────────────────────────────
  { id: 'sta-2026-la-spartans',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'spartans',
    venueId: 'spartans-dart-pub', captain: 'Karolina Mauerer' },
  { id: 'sta-2026-la-ohne-jackie',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'ohne-jackie',
    venueId: 'fiaker-stueberl', captain: 'Toni Bauer' },
  { id: 'sta-2026-la-jolly-pirates-kts',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'jolly-pirates-kts',
    venueId: 'jolly-roger', captain: 'Melanie Preisendörfer' },
  { id: 'sta-2026-la-dc-null-bull',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'dc-null-bull',
    venueId: 'wirtshaus-lustiger-bauer', captain: 'Dieter Rogge' },
  { id: 'sta-2026-la-no-maam',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'no-maam',
    venueId: 'dc-moosach', captain: 'Zlatko Juric' },
  { id: 'sta-2026-la-les-dartagnons',
    seasonId: 'season-2026', leagueId: 'la', teamId: 'les-dartagnons',
    venueId: 'jimmys-restaurant', captain: 'Hubert Kandlbinder' },

  // ── A1 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-a1-alptraum',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'alptraum',
    venueId: 'dis-stueberl', captain: 'Thomas Wagner' },
  { id: 'sta-2026-a1-dc-animals-ii',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'dc-animals-ii',
    venueId: 'kegelkeller', captain: 'Alex Mückstein' },
  { id: 'sta-2026-a1-gambas',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'gambas',
    venueId: 'fiaker-stueberl', captain: 'Gerhart Romboy' },
  { id: 'sta-2026-a1-spartans-vi',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'spartans-vi',
    venueId: 'spartans-dart-pub', captain: 'Thomas Hofstetter' },
  { id: 'sta-2026-a1-sound-warriors',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'sound-warriors',
    venueId: 'jolly-roger', captain: 'Christian Rock' },
  { id: 'sta-2026-a1-game-over',
    seasonId: 'season-2026', leagueId: 'a1', teamId: 'game-over',
    venueId: 'wirtshaus-lustiger-bauer', captain: 'Annett Meyer' },

  // ── A2 Liga ───────────────────────────────────────────────
  // treff-nix-freimann: relegated from A1 early in season, now plays in A2
  { id: 'sta-2026-a2-treff-nix-freimann',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'treff-nix-freimann',
    venueId: 'gaststaette-esv-freimann', captain: 'Manuel Buchholz',
    notes: 'Transferred from A1 to A2 mid-season after early relegation (4 games in A1, 0 pts)' },
  { id: 'sta-2026-a2-silberpfeile-ii',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'silberpfeile-ii',
    venueId: 'wirtshaus-bei-toni', captain: 'Maik Koenig' },
  { id: 'sta-2026-a2-jolly-pirates-v',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'jolly-pirates-v',
    venueId: 'jolly-roger', captain: 'Harry Spitzenberger' },
  { id: 'sta-2026-a2-oldies-co',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'oldies-co',
    venueId: 'dis-stueberl', captain: 'Ute Hofmann' },
  { id: 'sta-2026-a2-de-wolperdinga',
    seasonId: 'season-2026', leagueId: 'a2', teamId: 'de-wolperdinga',
    venueId: 'bistro-118', captain: 'Mario Vaccaro',
    notes: 'Rückzug aus dem Spielbetrieb (Mai 2026)' },

  // ── B1 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-b1-flying-fighters',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'flying-fighters',
    venueId: 'fiaker-stueberl', captain: 'Stephanie Vaccaro' },
  { id: 'sta-2026-b1-master-of-desaster',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'master-of-desaster',
    venueId: 'fiaker-stueberl', captain: 'Thomas Gämmerler' },
  { id: 'sta-2026-b1-flying-seven',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'flying-seven',
    venueId: 'wirtshaus-bei-toni', captain: 'Thomas Reisinger' },
  { id: 'sta-2026-b1-lucky-darts-one',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'lucky-darts-one',
    venueId: 'players', captain: 'Torsten Bauer' },
  { id: 'sta-2026-b1-de-hutzeldarter',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'de-hutzeldarter',
    venueId: 'bistro-118', captain: 'Christian Fürsicht' },
  { id: 'sta-2026-b1-massl-ghabt',
    seasonId: 'season-2026', leagueId: 'b1', teamId: 'massl-ghabt',
    venueId: 'heuboden-bar', captain: 'Markus Kniehl' },

  // ── B2 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-b2-belfort-evolution',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'belfort-evolution',
    venueId: 'belfort-seven', captain: 'Dietmar Poppe' },
  { id: 'sta-2026-b2-fiaker-deife',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'fiaker-deife',
    venueId: 'fiaker-stueberl', captain: 'Christian Matejka' },
  { id: 'sta-2026-b2-freibad-bazis',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'freibad-bazis',
    venueId: 'fiaker-stueberl', captain: 'Andreas Strehle' },
  { id: 'sta-2026-b2-team-desaster',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'team-desaster',
    venueId: 'dc-moosach', captain: 'Stefan Fischer' },
  { id: 'sta-2026-b2-dc-dark-angels',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'dc-dark-angels',
    venueId: 'bistro-48', captain: 'Franz Eberl' },
  { id: 'sta-2026-b2-de-vogelwuidn',
    seasonId: 'season-2026', leagueId: 'b2', teamId: 'de-vogelwuidn',
    venueId: 'spartans-dart-pub', captain: 'Horst Sänger' },

  // ── C Liga ────────────────────────────────────────────────
  { id: 'sta-2026-c-wild-indians',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'wild-indians',
    venueId: 'machete-1', captain: 'Markus Steyer' },
  { id: 'sta-2026-c-muenchen-0815',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'muenchen-0815',
    venueId: 'wirtshaus-lustiger-bauer', captain: 'Lukasz Wiacek' },
  { id: 'sta-2026-c-lucky-darts-two',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'lucky-darts-two',
    venueId: 'players', captain: 'Susanne Bauer' },
  { id: 'sta-2026-c-funny-darters',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'funny-darters',
    venueId: 'sportsbar-live', captain: 'Marcus Kampmann' },
  { id: 'sta-2026-c-black-devils',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'black-devils',
    venueId: 'spartans-dart-pub', captain: 'Petra Rödl' },
  { id: 'sta-2026-c-fuenf-sterne-boazn',
    seasonId: 'season-2026', leagueId: 'c', teamId: 'fuenf-sterne-boazn',
    venueId: 'trappentreu-stueberl', captain: 'Jutta Lachner' },
];

// No public player data — to be filled when dartunion.de publishes rosters
export const TEAM_PLAYER_ASSIGNMENTS: TeamPlayerAssignment[] = [];

// ── Helper functions ──────────────────────────────────────────

/**
 * Returns the SeasonTeamAssignment for a given team in a given season.
 * Each team has at most one primary assignment per season.
 */
export function getTeamAssignment(
  teamId: string,
  seasonId: string,
): SeasonTeamAssignment | undefined {
  return SEASON_TEAM_ASSIGNMENTS.find(
    a => a.teamId === teamId && a.seasonId === seasonId,
  );
}

/**
 * Returns all SeasonTeamAssignments for a given league in a given season,
 * in the order they appear in SEASON_TEAM_ASSIGNMENTS.
 */
export function getAssignmentsForLeague(
  leagueId: LeagueCode,
  seasonId: string,
): SeasonTeamAssignment[] {
  return SEASON_TEAM_ASSIGNMENTS.filter(
    a => a.leagueId === leagueId && a.seasonId === seasonId,
  );
}

/**
 * Returns the TeamPlayerAssignments for a team in a season.
 * Empty array means no player data is available for that team/season.
 */
export function getPlayerAssignmentsForTeam(
  teamId: string,
  seasonId: string,
): TeamPlayerAssignment[] {
  return TEAM_PLAYER_ASSIGNMENTS.filter(
    a => a.teamId === teamId && a.seasonId === seasonId,
  );
}

// ── Grouped view helpers ──────────────────────────────────────

export interface TeamWithAssignment {
  team: Team;
  assignment: SeasonTeamAssignment;
  venue: Venue | null;
}

export interface LeagueGrouping {
  league: (typeof LEAGUES)[number];
  teams: TeamWithAssignment[];
}

/**
 * Returns regular-season leagues with their assigned teams for a given season,
 * sorted by league.sortOrder (La Liga first, C Liga last).
 *
 * Playoff leagues are excluded — they have no SeasonTeamAssignments.
 * Use this to render "Teams grouped by league" (Teams page, Spielstätten page).
 */
export function getLeagueGroupings(seasonId: string): LeagueGrouping[] {
  return [...LEAGUES]
    .filter(l => l.type !== 'playoff')          // exclude playoff rounds
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(league => {
      const assignments = getAssignmentsForLeague(league.id, seasonId);
      const teams: TeamWithAssignment[] = assignments
        .map(a => {
          const team = TEAMS.find(t => t.id === a.teamId);
          if (!team) return null;
          const venue = a.venueId ? (VENUES.find(v => v.id === a.venueId) ?? null) : null;
          return { team, assignment: a, venue };
        })
        .filter((x): x is TeamWithAssignment => x !== null);
      return { league, teams };
    });
}

// ── Venue-centric helpers ─────────────────────────────────────

/**
 * Returns the resolved Venue entity for a team in a given season.
 * Returns null if the team has no venue assignment or the venueId is unknown.
 */
export function getVenueForTeamInSeason(
  teamId: string,
  seasonId: string,
): Venue | null {
  const a = getTeamAssignment(teamId, seasonId);
  if (!a?.venueId) return null;
  return VENUES.find(v => v.id === a.venueId) ?? null;
}

/**
 * Returns the captain name for a team in a given season.
 * Returns null if no captain has been recorded.
 */
export function getCaptainForTeamInSeason(
  teamId: string,
  seasonId: string,
): string | null {
  return getTeamAssignment(teamId, seasonId)?.captain ?? null;
}

/**
 * One venue entry in the Spielstätten grouped view.
 * venue is null only when a team has no venueId assigned.
 */
export interface VenueWithTeams {
  venue: Venue | null;
  teams: TeamWithAssignment[];
}

/**
 * One league entry for the Spielstätten page.
 * venues groups all teams in this league by their shared venue.
 */
export interface LeagueVenueGrouping {
  league: (typeof LEAGUES)[number];
  venues: VenueWithTeams[];
}

/**
 * Returns venues with their assigned teams for a single league + season.
 *
 * Each venue appears ONCE; teams that share the same venue are listed
 * together under that venue. Teams with no venue are grouped under a
 * null-venue entry (sorted last).
 *
 * Use this to render the per-league section of the Spielstätten page.
 */
export function getVenueGroupingsForLeague(
  leagueId: LeagueCode,
  seasonId: string,
): VenueWithTeams[] {
  const assignments = getAssignmentsForLeague(leagueId, seasonId);
  const venueMap = new Map<string, VenueWithTeams>();

  for (const a of assignments) {
    const team = TEAMS.find(t => t.id === a.teamId);
    if (!team) continue;

    const key   = a.venueId ?? '__no-venue__';
    const venue = a.venueId ? (VENUES.find(v => v.id === a.venueId) ?? null) : null;

    if (!venueMap.has(key)) {
      venueMap.set(key, { venue, teams: [] });
    }
    venueMap.get(key)!.teams.push({ team, assignment: a, venue });
  }

  // Venues with data first (sorted A→Z by name), unknown venue last
  return Array.from(venueMap.values()).sort((a, b) => {
    if (a.venue && !b.venue) return -1;
    if (!a.venue && b.venue) return  1;
    return (a.venue?.name ?? '').localeCompare(b.venue?.name ?? '', 'de');
  });
}

/**
 * Returns regular-season leagues with venue-grouped teams for a given season,
 * sorted by league.sortOrder (La Liga first, C Liga last).
 *
 * Playoff leagues are excluded (no separate venue assignments).
 * Use this on the Spielstätten page to render:
 *   league → venues → teams
 */
export function getLeagueVenueGroupings(seasonId: string): LeagueVenueGrouping[] {
  return [...LEAGUES]
    .filter(l => l.type !== 'playoff')          // exclude playoff rounds
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(league => ({
      league,
      venues: getVenueGroupingsForLeague(league.id, seasonId),
    }));
}
