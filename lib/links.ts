// ============================================================
// Entity link helpers — Münchner Dart Union
// ============================================================
//
// Central place that builds profile URLs and resolves teams / players
// from the data they are rendered with. Kept dependency-light (only
// data sub-modules) so it can be imported from both server and client
// components without circular imports.
//
// Resolution never guesses: when a name cannot be matched confidently
// the resolver returns undefined and the caller should render plain text
// instead of a wrong link.
// ============================================================

import { TEAMS, type Team } from './data/teams';
import { getPlayerByName, normalizePlayerName } from './data/player-stats';
import type { Player } from './data/players';
import type { PlayerStatEntry } from './data/statistics';
import type { Match } from './data/matches';

/** Team profile URL, optionally carrying the competition context. */
export function getTeamUrl(teamId: string, competitionId?: string): string {
  const base = `/teams/${encodeURIComponent(teamId)}`;
  return competitionId ? `${base}?competition=${encodeURIComponent(competitionId)}` : base;
}

/** Player profile URL. */
export function getPlayerUrl(playerId: string): string {
  return `/spieler/${encodeURIComponent(playerId)}`;
}

/**
 * Resolves a Team from a display name.
 * Matching priority: exact id → normalized name → normalized short code.
 * Returns undefined when ambiguous or unknown (never guesses).
 */
export function resolveTeamFromName(name: string): Team | undefined {
  const cleaned = name.replace(' *', '').trim();
  // 1. Exact id
  const byId = TEAMS.find(t => t.id === cleaned);
  if (byId) return byId;

  const target = normalizePlayerName(cleaned);
  if (!target) return undefined;

  // 2. Normalized full name
  const byName = TEAMS.filter(t => normalizePlayerName(t.name) === target);
  if (byName.length === 1) return byName[0];
  if (byName.length > 1) return undefined; // ambiguous → don't guess

  // 3. Normalized short code
  const byShort = TEAMS.filter(t => normalizePlayerName(t.short) === target);
  return byShort.length === 1 ? byShort[0] : undefined;
}

/** Returns the { teamId, teamName } for one side of a match. */
export function resolveTeamFromMatchSide(
  match: Pick<Match, 'homeTeamId' | 'awayTeamId' | 'homeTeamName' | 'awayTeamName'>,
  side: 'home' | 'away',
): { teamId: string; teamName: string } {
  return side === 'home'
    ? { teamId: match.homeTeamId, teamName: match.homeTeamName }
    : { teamId: match.awayTeamId, teamName: match.awayTeamName };
}

/** Resolves the roster Player for an Einzelrangliste row, or undefined. */
export function resolvePlayerFromRankingRow(
  row: Pick<PlayerStatEntry, 'name'>,
): Player | undefined {
  return getPlayerByName(row.name);
}
