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
// Source: dartunion.de · scraped May 2026
// venueId: not set — no public venue data available yet
// captain:  not set — no public captain data available yet
//
// Special cases:
//   treff-nix-freimann  — Started Saison 2026 in A1 (4 games, 0 pts, relegated early).
//                          Now assigned to A2 for the remainder of the season / playoffs.
//   de-wolperdinga      — Withdrew from competition mid-season (Rückzug, Mai 2026).
//                          Kept in A2 assignment for historical accuracy; team status: inactive.

export const SEASON_TEAM_ASSIGNMENTS: SeasonTeamAssignment[] = [
  // ── La Liga ───────────────────────────────────────────────
  { id: 'sta-2026-la-spartans',          seasonId: 'season-2026', leagueId: 'la', teamId: 'spartans' },
  { id: 'sta-2026-la-ohne-jackie',       seasonId: 'season-2026', leagueId: 'la', teamId: 'ohne-jackie' },
  { id: 'sta-2026-la-jolly-pirates-kts', seasonId: 'season-2026', leagueId: 'la', teamId: 'jolly-pirates-kts' },
  { id: 'sta-2026-la-dc-null-bull',      seasonId: 'season-2026', leagueId: 'la', teamId: 'dc-null-bull' },
  { id: 'sta-2026-la-no-maam',           seasonId: 'season-2026', leagueId: 'la', teamId: 'no-maam' },
  { id: 'sta-2026-la-les-dartagnons',    seasonId: 'season-2026', leagueId: 'la', teamId: 'les-dartagnons' },

  // ── A1 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-a1-alptraum',          seasonId: 'season-2026', leagueId: 'a1', teamId: 'alptraum' },
  { id: 'sta-2026-a1-dc-animals-ii',     seasonId: 'season-2026', leagueId: 'a1', teamId: 'dc-animals-ii' },
  { id: 'sta-2026-a1-gambas',            seasonId: 'season-2026', leagueId: 'a1', teamId: 'gambas' },
  { id: 'sta-2026-a1-spartans-vi',       seasonId: 'season-2026', leagueId: 'a1', teamId: 'spartans-vi' },
  { id: 'sta-2026-a1-sound-warriors',    seasonId: 'season-2026', leagueId: 'a1', teamId: 'sound-warriors' },
  { id: 'sta-2026-a1-game-over',         seasonId: 'season-2026', leagueId: 'a1', teamId: 'game-over' },

  // ── A2 Liga ───────────────────────────────────────────────
  // treff-nix-freimann: relegated from A1 early in season, now plays in A2
  { id: 'sta-2026-a2-treff-nix-freimann', seasonId: 'season-2026', leagueId: 'a2', teamId: 'treff-nix-freimann',
    notes: 'Transferred from A1 to A2 mid-season after early relegation (4 games in A1, 0 pts)' },
  { id: 'sta-2026-a2-silberpfeile-ii',   seasonId: 'season-2026', leagueId: 'a2', teamId: 'silberpfeile-ii' },
  { id: 'sta-2026-a2-jolly-pirates-v',   seasonId: 'season-2026', leagueId: 'a2', teamId: 'jolly-pirates-v' },
  { id: 'sta-2026-a2-oldies-co',         seasonId: 'season-2026', leagueId: 'a2', teamId: 'oldies-co' },
  { id: 'sta-2026-a2-de-wolperdinga',    seasonId: 'season-2026', leagueId: 'a2', teamId: 'de-wolperdinga',
    notes: 'Rückzug aus dem Spielbetrieb (Mai 2026)' },

  // ── B1 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-b1-flying-fighters',    seasonId: 'season-2026', leagueId: 'b1', teamId: 'flying-fighters' },
  { id: 'sta-2026-b1-master-of-desaster', seasonId: 'season-2026', leagueId: 'b1', teamId: 'master-of-desaster' },
  { id: 'sta-2026-b1-flying-seven',       seasonId: 'season-2026', leagueId: 'b1', teamId: 'flying-seven' },
  { id: 'sta-2026-b1-lucky-darts-one',    seasonId: 'season-2026', leagueId: 'b1', teamId: 'lucky-darts-one' },
  { id: 'sta-2026-b1-de-hutzeldarter',    seasonId: 'season-2026', leagueId: 'b1', teamId: 'de-hutzeldarter' },
  { id: 'sta-2026-b1-massl-ghabt',        seasonId: 'season-2026', leagueId: 'b1', teamId: 'massl-ghabt' },

  // ── B2 Liga ───────────────────────────────────────────────
  { id: 'sta-2026-b2-belfort-evolution',  seasonId: 'season-2026', leagueId: 'b2', teamId: 'belfort-evolution' },
  { id: 'sta-2026-b2-fiaker-deife',       seasonId: 'season-2026', leagueId: 'b2', teamId: 'fiaker-deife' },
  { id: 'sta-2026-b2-freibad-bazis',      seasonId: 'season-2026', leagueId: 'b2', teamId: 'freibad-bazis' },
  { id: 'sta-2026-b2-team-desaster',      seasonId: 'season-2026', leagueId: 'b2', teamId: 'team-desaster' },
  { id: 'sta-2026-b2-dc-dark-angels',     seasonId: 'season-2026', leagueId: 'b2', teamId: 'dc-dark-angels' },
  { id: 'sta-2026-b2-de-vogelwuidn',      seasonId: 'season-2026', leagueId: 'b2', teamId: 'de-vogelwuidn' },

  // ── C Liga ────────────────────────────────────────────────
  { id: 'sta-2026-c-wild-indians',        seasonId: 'season-2026', leagueId: 'c', teamId: 'wild-indians' },
  { id: 'sta-2026-c-muenchen-0815',       seasonId: 'season-2026', leagueId: 'c', teamId: 'muenchen-0815' },
  { id: 'sta-2026-c-lucky-darts-two',     seasonId: 'season-2026', leagueId: 'c', teamId: 'lucky-darts-two' },
  { id: 'sta-2026-c-funny-darters',       seasonId: 'season-2026', leagueId: 'c', teamId: 'funny-darters' },
  { id: 'sta-2026-c-black-devils',        seasonId: 'season-2026', leagueId: 'c', teamId: 'black-devils' },
  { id: 'sta-2026-c-fuenf-sterne-boazn',  seasonId: 'season-2026', leagueId: 'c', teamId: 'fuenf-sterne-boazn' },
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
 * Returns all leagues with their assigned teams for a given season,
 * sorted by league.sortOrder (La Liga first, C Liga last).
 *
 * Use this to render "Teams grouped by league" or "Venues grouped by league".
 *
 * @example
 * const groups = getLeagueGroupings('season-2026');
 * groups.forEach(({ league, teams }) => {
 *   console.log(league.name);
 *   teams.forEach(({ team, venue }) => console.log(team.name, venue?.name));
 * });
 */
export function getLeagueGroupings(seasonId: string): LeagueGrouping[] {
  return [...LEAGUES]
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
