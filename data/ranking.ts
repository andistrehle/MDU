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
//  2. SOMMER-RANKING 2026 — der Endstand der Zwischenserie vom 01.09.2026,
//     ebenfalls echt. Quelle: `ranking-sommer-2026-*.ts`.
//
// BEIDE Wertungen sind gepflegte Auswertungen des Betreibers. Die Turniere in
// `tournaments.generated.ts` sind dagegen weiterhin Demo-Material und zahlen
// NICHT auf diese Ranglisten ein — sie zeigen nur, wie Turnierseiten,
// Ergebnislisten und Turnierbäume aussehen.
// ============================================================

import type { Division, RankingEntry } from './types';
import { PLAYERS, PARSED_SOMMER_MEN, PARSED_SOMMER_WOMEN } from './players';
import { FINAL_RANKING_2025_26 } from './ranking-final';
import { VENUES } from './venues';

function toEntries(rows: typeof PARSED_SOMMER_MEN): RankingEntry[] {
  return rows.map(row => ({
    rank: row.rank,
    sharedRank: row.sharedRank,
    previousRank: null,
    trend: row.trend,
    playerId: row.playerId,
    points: row.points,
    tournaments: row.tournaments,
    average: Math.round((row.points / row.tournaments) * 100) / 100,
    // Beste Platzierung und Turniersiege gehen aus der Auswertung nicht
    // hervor — hier wird nichts geraten.
    bestFinish: 0,
    wins: 0,
  }));
}

const SUMMER_BY_DIVISION: Record<Division, RankingEntry[]> = {
  men: toEntries(PARSED_SOMMER_MEN),
  women: toEntries(PARSED_SOMMER_WOMEN),
};

/** Endstand des Sommer-Rankings 2026, Männer und Frauen zusammen. */
export const SUMMER_RANKING: RankingEntry[] = [
  ...SUMMER_BY_DIVISION.men,
  ...SUMMER_BY_DIVISION.women,
].sort((a, b) => b.points - a.points);

const SUMMER_BY_PLAYER = new Map(SUMMER_RANKING.map(e => [e.playerId, e]));

export function getSummerEntry(playerId: string): RankingEntry | undefined {
  return SUMMER_BY_PLAYER.get(playerId);
}

/** Sommer-Ranking einer Wertungsklasse — gespielt gemeinsam, gewertet getrennt. */
export function summerRankingOf(division: Division): RankingEntry[] {
  return SUMMER_BY_DIVISION[division];
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
  /** Turniere, die das Sommer-Ranking gewertet hat (meiste Teilnahmen). */
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
    // Untergrenze: So oft war der fleißigste Spieler dabei — mehr Turniere
    // hatte die Serie mindestens.
    summerTournaments: Math.max(0, ...SUMMER_RANKING.map(e => e.tournaments)),
  };
}

export const MDC_STATS: MdcStats = computeStats();
