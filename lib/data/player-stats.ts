// ============================================================
// Season Player Statistics — Münchner Dart Union
// ============================================================
//
// This module connects two separate data layers WITHOUT mixing them:
//
//   • Player master data        → lib/data/players.ts (PLAYERS)
//   • Official Einzelranglisten  → lib/data/statistics.ts (PlayerStatEntry)
//
// The Einzelrangliste only publishes: rank, name, team, points, wins, losses.
// It does NOT contain draws or darts-special values (180s, 171s, high
// finishes, short legs) on a per-player level. Those fields are therefore
// PREPARED in the data model but left `null` until real data exists — we
// never fabricate numbers.
//
// Matching priority (see findStatEntryForPlayer):
//   1. playerId       — not present in Einzelrangliste data → skipped
//   2. licenseNumber  — not present in Einzelrangliste data → skipped
//   3. normalized name + team   (confident, disambiguated)
//   4. unique normalized name   (only when unambiguous)
//
// ============================================================

import { PLAYERS, getPlayerDisplayName, type Player } from './players';
import type { PlayerStatEntry } from './statistics';

/** Einzelspiel-Ausgang: gewonnen oder verloren — kein Unentschieden bei Spielern. */
export type FormResult = 'W' | 'L';

/** Removes combining diacritical marks (range U+0300–U+036F) after NFD decomposition. */
function stripDiacritics(input: string): string {
  const combiningStart = 0x0300;
  const combiningEnd = 0x036f;
  return input
    .normalize('NFD')
    .split('')
    .filter(ch => {
      const code = ch.charCodeAt(0);
      return code < combiningStart || code > combiningEnd;
    })
    .join('');
}

/** One recent individual result for the form curve / "Letzte Ergebnisse". */
export interface PlayerRecentResult {
  opponent: string;
  /** Score string, e.g. "2:0". */
  result: string;
  outcome: FormResult;
  matchday?: number;
  /** The team fixture this single game was part of, e.g. "Freibad Bazis vs Fiaker Deife". */
  teamMatch?: string;
}

/**
 * Per-season, per-competition statistics for a single player.
 *
 * Dart-Fachlogik: Ein Spieler spielt EINZELSPIELE (2:0 / 2:1 / 1:2 / 0:2)
 * — ein Unentschieden gibt es bei Spielern nicht. Team-Statistiken behalten
 * ihr Unentschieden, dieses Modell hier ist ausschließlich für Spieler.
 *
 * `hasOfficialStats` distinguishes a player that was confidently matched to
 * an Einzelrangliste entry (real numbers) from one that was not (clean
 * placeholders). Premium-Splits (2:0/2:1/…), Darts-Specials, Form und
 * recentResults are PREPARED fields — populated only when real data exists.
 */
export interface SeasonPlayerStats {
  seasonId: string;
  playerId: string;
  teamId: string;
  competitionId: string;
  rank: number | null;
  /** Anzahl Einzelspiele = singlesWon + singlesLost (kein Unentschieden). */
  singlesPlayed: number;
  /** Gewonnene Einzelspiele (offizielle Spalte „Sp.", linker Wert). */
  singlesWon: number;
  /** Verlorene Einzelspiele (offizielle Spalte „Sp.", rechter Wert). */
  singlesLost: number;
  /** Einzelspiel-Bilanz als String, z. B. "30:2" — null ohne offizielle Daten. */
  singlesBalance: string | null;
  /** Siegquote in Prozent (0–100), null wenn singlesPlayed = 0. */
  winRate: number | null;
  points: number | null;
  /** Gewonnene Legs (offizielle Spalte „Legs") — null wenn nicht erfasst. */
  legsWon: number | null;
  /** Verlorene Legs — null wenn nicht erfasst. */
  legsLost: number | null;
  /** Leg-Bilanz als String, z. B. "62:14" — null wenn nicht erfasst. */
  legBalance: string | null;
  // ── Vorbereitet für spätere Premium-Statistik (nie erfinden) ──
  /** 2:0-Siege */ wins20: number | null;
  /** 2:1-Siege */ wins21: number | null;
  /** 1:2-Niederlagen */ losses12: number | null;
  /** 0:2-Niederlagen */ losses02: number | null;
  oneEighties: number | null;
  oneSeventyOnes: number | null;
  highFinishes: number | null;
  shortLegs: number | null;
  form: FormResult[];
  recentResults: PlayerRecentResult[];
  /** True when matched to an official Einzelrangliste entry. */
  hasOfficialStats: boolean;
}

/**
 * Normalises a player name for matching: strips diacritics, lowercases,
 * drops punctuation, collapses whitespace. e.g. "Mirek “wasi“ Watzlawek"
 * → "mirek wasi watzlawek".
 */
export function normalizePlayerName(name: string): string {
  return stripDiacritics(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Siegquote: gewonnene / gespielte Einzelspiele * 100, null bei 0 Spielen. */
export function computeWinRate(wins: number, matches: number): number | null {
  if (matches <= 0) return null;
  return (wins / matches) * 100;
}

/** Formats a win rate as a German percentage string, or '–' when unavailable. */
export function formatWinRate(rate: number | null): string {
  if (rate === null) return '–';
  return `${rate.toFixed(1).replace('.', ',')} %`;
}

/** Resolves a roster player from an Einzelrangliste name (unique match only). */
export function getPlayerByName(name: string): Player | undefined {
  const target = normalizePlayerName(name);
  if (!target) return undefined;
  const matches = PLAYERS.filter(
    p => normalizePlayerName(getPlayerDisplayName(p)) === target,
  );
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * Matches a roster player to an official Einzelrangliste entry.
 * Returns null when no confident match exists — never guesses.
 */
export function findStatEntryForPlayer(
  player: Player,
  teamId: string,
  stats: PlayerStatEntry[],
): PlayerStatEntry | null {
  const target = normalizePlayerName(getPlayerDisplayName(player));
  if (!target) return null;

  const nameMatches = stats.filter(s => normalizePlayerName(s.name) === target);
  if (nameMatches.length === 0) return null;

  // Prefer a same-team match (priority 3: name + team)
  const teamMatch = nameMatches.find(s => s.teamId === teamId);
  if (teamMatch) return teamMatch;

  // Otherwise accept a name-only match only when unambiguous (priority 4)
  return nameMatches.length === 1 ? nameMatches[0] : null;
}

/**
 * Builds the season-stat object for a player.
 *
 * When `entry` is supplied its official numbers are used; otherwise every
 * stat field is zeroed / null so the UI shows clean placeholders.
 * Premium-Splits und Darts-Specials are not published upstream, so they
 * stay null — the fields exist purely to be ready for future data.
 */
export function buildSeasonPlayerStats(
  playerId: string,
  teamId: string,
  competitionId: string,
  seasonId: string,
  entry: PlayerStatEntry | null,
): SeasonPlayerStats {
  const singlesWon  = entry?.wins ?? 0;
  const singlesLost = entry?.losses ?? 0;
  const singlesPlayed = singlesWon + singlesLost;
  const legsWon  = entry?.legsWon ?? null;
  const legsLost = entry?.legsLost ?? null;

  return {
    seasonId,
    playerId,
    teamId,
    competitionId,
    rank: entry?.rank ?? null,
    singlesPlayed,
    singlesWon,
    singlesLost,
    singlesBalance: entry ? `${singlesWon}:${singlesLost}` : null,
    winRate: computeWinRate(singlesWon, singlesPlayed),
    points: entry?.pts ?? null,
    legsWon,
    legsLost,
    legBalance: legsWon !== null && legsLost !== null ? `${legsWon}:${legsLost}` : null,
    wins20: entry?.wins20 ?? null,
    wins21: entry?.wins21 ?? null,
    losses12: entry?.losses12 ?? null,
    losses02: entry?.losses02 ?? null,
    oneEighties: null,
    oneSeventyOnes: null,
    highFinishes: null,
    shortLegs: null,
    form: [],
    recentResults: [],
    hasOfficialStats: entry !== null,
  };
}

/**
 * Performance ordering for ranking players inside a team:
 *   1. Points          (desc)
 *   2. Win rate        (desc)
 *   3. Wins            (desc)
 *   4. Fewer losses    (asc)
 *   5. Name            (alphabetical fallback)
 */
export function comparePlayerPerformance(
  a: { stats: SeasonPlayerStats; name: string },
  b: { stats: SeasonPlayerStats; name: string },
): number {
  const pa = a.stats.points ?? -1;
  const pb = b.stats.points ?? -1;
  if (pb !== pa) return pb - pa;

  const wa = a.stats.winRate ?? -1;
  const wb = b.stats.winRate ?? -1;
  if (wb !== wa) return wb - wa;

  if (b.stats.singlesWon !== a.stats.singlesWon) return b.stats.singlesWon - a.stats.singlesWon;
  if (a.stats.singlesLost !== b.stats.singlesLost) return a.stats.singlesLost - b.stats.singlesLost;

  return a.name.localeCompare(b.name, 'de');
}
