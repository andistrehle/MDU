// ============================================================
// Players — Münchner Dart Union
// ============================================================
//
// Player data is NOT publicly available on dartunion.de.
// DO NOT invent or guess player names or team assignments.
//
// HOW TO ADD PLAYERS (once data is published):
//   1. Add Player records here with a unique id per player
//   2. Add TeamPlayerAssignment records in lib/data/assignments.ts
//      linking each player to their team and season with a status
//
// Player display names default to "firstName lastName" unless
// displayName is set explicitly.
//
// ============================================================

export type PlayerStatus = 'active' | 'inactive' | 'substitute' | 'unknown';

export interface Player {
  /** Unique slug identifier (e.g. 'max-mustermann') */
  id: string;
  firstName: string;
  lastName: string;
  /** Optional display name override (e.g. nickname). Falls back to "firstName lastName". */
  displayName?: string;
  status: PlayerStatus;
}

// No public player data available. PLAYERS will be populated when
// dartunion.de publishes roster information for the current season.
export const PLAYERS: Player[] = [];

/** Returns a player by id, or undefined. */
export function findPlayer(id: string): Player | undefined {
  return PLAYERS.find(p => p.id === id);
}

/**
 * Returns the display name for a player.
 * Uses player.displayName if set, otherwise "firstName lastName".
 */
export function getPlayerDisplayName(player: Player): string {
  return player.displayName ?? `${player.firstName} ${player.lastName}`.trim();
}
