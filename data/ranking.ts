// ============================================================
// MDC — Wertungen
// ============================================================
//
// Es gibt zwei Ranglisten in der Demo:
//
//  1. ENDRANGLISTE 2025/26 — der echte Saison-Endstand vom 27.07.2026,
//     getrennt nach Männern und Frauen, mit Ausschüttung.
//     Quelle: `ranking-final.ts`.
//
//  2. SOMMER-RANKING 2026 — die laufende Wertung der Sommerturniere. Sie wird
//     NICHT gepflegt, sondern aus den Turnierergebnissen aufaddiert. Ändert
//     sich ein Ergebnis, ändert sich die Wertung automatisch mit.
//
// Der Trendpfeil im Sommer-Ranking entsteht ebenso ehrlich: Er vergleicht den
// aktuellen Stand mit dem Stand vor dem jeweils letzten Spieltag.
// ============================================================

import type { Division, RankingEntry, Tournament, Trend } from './types';
import { finishedTournaments } from './tournaments';
import { getPlayer, PLAYERS } from './players';
import { FINAL_RANKING_2025_26 } from './ranking-final';
import { VENUES } from './venues';

interface Tally {
  points: number;
  tournaments: number;
  bestFinish: number;
  wins: number;
}

function tally(tournaments: Tournament[]): Map<string, Tally> {
  const map = new Map<string, Tally>();
  for (const tournament of tournaments) {
    for (const result of tournament.results) {
      const cur = map.get(result.playerId)
        ?? { points: 0, tournaments: 0, bestFinish: Infinity, wins: 0 };
      map.set(result.playerId, {
        points: cur.points + result.points,
        tournaments: cur.tournaments + 1,
        bestFinish: Math.min(cur.bestFinish, result.rank),
        wins: cur.wins + (result.rank === 1 ? 1 : 0),
      });
    }
  }
  return map;
}

/**
 * Sortierung: Punkte, dann Schnitt, dann beste Platzierung, zuletzt der Name —
 * damit die Reihenfolge bei Gleichstand stabil und nicht zufällig ist.
 */
function sortTallies(map: Map<string, Tally>): { playerId: string; t: Tally }[] {
  return [...map.entries()]
    .map(([playerId, t]) => ({ playerId, t }))
    .sort((a, b) =>
      b.t.points - a.t.points ||
      b.t.points / b.t.tournaments - a.t.points / a.t.tournaments ||
      a.t.bestFinish - b.t.bestFinish ||
      a.playerId.localeCompare(b.playerId),
    );
}

function trendOf(rank: number, previousRank: number | null): Trend {
  if (previousRank === null) return 'new';
  if (rank < previousRank) return 'up';
  if (rank > previousRank) return 'down';
  return 'same';
}

/** Alle Turniere außer denen des jüngsten Spieltags. */
function beforeLastMatchday(): Tournament[] {
  const all = finishedTournaments();
  const latestDate = all[0]?.date;
  return all.filter(t => t.date !== latestDate);
}

function buildSummerRanking(): RankingEntry[] {
  const previous = new Map(
    sortTallies(tally(beforeLastMatchday())).map((e, i) => [e.playerId, i + 1]),
  );

  return sortTallies(tally(finishedTournaments())).map((entry, index) => {
    const rank = index + 1;
    const previousRank = previous.get(entry.playerId) ?? null;
    return {
      rank,
      sharedRank: false,
      previousRank,
      trend: trendOf(rank, previousRank),
      playerId: entry.playerId,
      points: entry.t.points,
      tournaments: entry.t.tournaments,
      average: Math.round((entry.t.points / entry.t.tournaments) * 100) / 100,
      bestFinish: entry.t.bestFinish,
      wins: entry.t.wins,
    };
  });
}

/** Laufende Wertung des Sommer-Rankings 2026 (Männer und Frauen gemeinsam). */
export const SUMMER_RANKING: RankingEntry[] = buildSummerRanking();

const SUMMER_BY_PLAYER = new Map(SUMMER_RANKING.map(e => [e.playerId, e]));

export function getSummerEntry(playerId: string): RankingEntry | undefined {
  return SUMMER_BY_PLAYER.get(playerId);
}

/**
 * Sommer-Ranking einer Wertungsklasse. Die Plätze werden neu durchgezählt —
 * gespielt wird gemeinsam, gewertet getrennt (wie am Saisonende).
 */
export function summerRankingOf(division: Division): RankingEntry[] {
  return SUMMER_RANKING
    .filter(e => getPlayer(e.playerId)?.division === division)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/** Endrangliste 2025/26 einer Wertungsklasse. */
export function finalRankingOf(division: Division): RankingEntry[] {
  return FINAL_RANKING_2025_26[division];
}

// ------------------------------------------------------------
// Kennzahlen für die Statistik-Karten der Startseite
// ------------------------------------------------------------

export interface MdcStats {
  /** Spitzenreiter der Männer-Endrangliste 2025/26. */
  leaderId: string | null;
  leaderPoints: number;
  /** Meiste Turnierteilnahmen der Saison — und wer sie hat. */
  mostAppearances: number;
  mostAppearancesPlayerId: string | null;
  players: number;
  venues: number;
  /** Turniere des laufenden Sommer-Rankings. */
  summerTournaments: number;
}

function computeStats(): MdcStats {
  const all = [...FINAL_RANKING_2025_26.men, ...FINAL_RANKING_2025_26.women];
  const top = all.reduce(
    (best, e) => (e.tournaments > best.tournaments ? e : best),
    all[0],
  );
  const leader = FINAL_RANKING_2025_26.men[0] ?? null;

  return {
    leaderId: leader?.playerId ?? null,
    leaderPoints: leader?.points ?? 0,
    mostAppearances: top?.tournaments ?? 0,
    mostAppearancesPlayerId: top?.playerId ?? null,
    players: PLAYERS.length,
    venues: VENUES.length,
    summerTournaments: finishedTournaments().length,
  };
}

export const MDC_STATS: MdcStats = computeStats();
