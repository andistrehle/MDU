// ============================================================
// MDC — Wertungen
// ============================================================
//
// LAUFEND — Saison 2026/27
//   Die Wertung kommt aus der Arbeitsmappe des Betreibers
//   (`ranking-2026-27-*.ts`), genau wie die Einzelergebnisse derselben Saison.
//   Beim Import wird beides gegeneinander gerechnet: Die Turnierpunkte je
//   Spieler ergeben die Punktzahl der Wertung, die Zahl der Starts die Spalte
//   „Anzahl TN". Beste Platzierung und Turniersiege kommen aus den
//   Einzelergebnissen — die Wertung selbst führt sie nicht.
//
//   Was die Wertung NICHT tut: Punkte aus der Vorsaison mitschleppen, fehlende
//   Turniere schätzen oder Spieler erfinden. Liegt noch nichts vor, ist die
//   Wertung leer und `RUNNING_HAS_RESULTS` falsch; die Seiten zeigen dann
//   einen Hinweis statt einer leeren Tabelle.
//
// ARCHIV — zwei abgeschlossene Wertungen, beide echt:
//   1. ENDRANGLISTE 2025/26 — Saison-Endstand vom 27.07.2026, getrennt nach
//      Männern und Frauen, mit Ausschüttung. Quelle: `ranking-final.ts`.
//   2. SOMMER-RANKING 2026 — Endstand der Zwischenserie vom 01.09.2026.
//      Quelle: `ranking-sommer-2026-*.ts`. Die Serie ist beendet.
// ============================================================

import type { Division, RankingEntry } from './types';
import {
  PLAYERS, PARSED_SOMMER_MEN, PARSED_SOMMER_WOMEN,
  PARSED_RUNNING_MEN, PARSED_RUNNING_WOMEN,
} from './players';
import { FINAL_RANKING_2025_26 } from './ranking-final';
import { playerSeasonStats, RUNNING_STATS } from './tournament-results';
import { RUNNING_SEASON } from './season';
import { VENUES } from './venues';

/**
 * Ranglistenzeilen aus den geparsten Rohzeilen. Liegt für die Saison eine
 * Turnierliste vor (`seasonId`), kommen beste Platzierung und Turniersiege
 * von dort — sonst bleiben sie auf 0, statt geschätzt zu werden.
 */
function toEntries(rows: typeof PARSED_SOMMER_MEN, seasonId?: string): RankingEntry[] {
  return rows.map(row => {
    const stats = seasonId ? playerSeasonStats(row.playerId, seasonId) : undefined;
    return {
      rank: row.rank,
      sharedRank: row.sharedRank,
      previousRank: null,
      trend: row.trend,
      playerId: row.playerId,
      points: row.points,
      tournaments: row.tournaments,
      average: Math.round((row.points / row.tournaments) * 100) / 100,
      bestFinish: stats?.bestFinish ?? 0,
      wins: stats?.wins ?? 0,
    };
  });
}

const SUMMER_BY_DIVISION: Record<Division, RankingEntry[]> = {
  // Für das Sommer-Ranking liegen nur die Endstände vor, keine Einzelturniere.
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

/** Endrangliste 2025/26 einer Wertungsklasse (Archiv). */
export function finalRankingOf(division: Division): RankingEntry[] {
  return FINAL_RANKING_2025_26[division];
}

// ------------------------------------------------------------
// Laufende Saison 2026/27
// ------------------------------------------------------------

/**
 * Wertung der laufenden Saison, aus der Arbeitsmappe des Betreibers.
 *
 * Geteilte Plätze stehen schon in den Rohzeilen: Wer punktgleich ist, bekommt
 * denselben Platz, und die nächste Platznummer überspringt die Gruppe. Der
 * Trend (▲/▼) ist der der Auswertung — er vergleicht mit dem Stand der
 * Vorwoche, den nur die Mappe kennt.
 */
const RUNNING_BY_DIVISION: Record<Division, RankingEntry[]> = {
  men: toEntries(PARSED_RUNNING_MEN, RUNNING_SEASON.id),
  women: toEntries(PARSED_RUNNING_WOMEN, RUNNING_SEASON.id),
};

/** Wertung der laufenden Saison einer Wertungsklasse. */
export function runningRankingOf(division: Division): RankingEntry[] {
  return RUNNING_BY_DIVISION[division];
}

/**
 * Liegt für die laufende Saison überhaupt schon eine Wertung vor?
 * Wird abgefragt, statt irgendwo ein Datum hart einzutragen — die Seiten
 * schalten dadurch von selbst um, wenn die Ergebnisse eintreffen.
 */
export const RUNNING_HAS_RESULTS =
  RUNNING_BY_DIVISION.men.length > 0 || RUNNING_BY_DIVISION.women.length > 0;

// ------------------------------------------------------------
// Kennzahlen für die Statistik-Karten der Startseite
// ------------------------------------------------------------

export interface MdcStats {
  /**
   * Spitzenreiter der Männer-Endrangliste 2025/26 — also des Archivs, nicht
   * der laufenden Saison. Der Name sagt das ausdrücklich: In der Oberfläche
   * darf daraus keine „aktuelle Nummer 1" werden, solange 2026/27 ohne
   * Ergebnisse ist.
   */
  archivedLeaderId: string | null;
  archivedLeaderPoints: number;
  /** Meiste Turnierteilnahmen der archivierten Saison — und wer sie hat. */
  mostAppearances: number;
  mostAppearancesPlayerId: string | null;
  players: number;
  venues: number;
  /** Turniere der laufenden Saison — gezählt, nicht geschätzt. */
  runningTournaments: number;
}

function computeStats(): MdcStats {
  const all = [...FINAL_RANKING_2025_26.men, ...FINAL_RANKING_2025_26.women];
  const top = all.reduce(
    (best, e) => (e.tournaments > best.tournaments ? e : best),
    all[0],
  );
  const leader = FINAL_RANKING_2025_26.men[0] ?? null;

  return {
    archivedLeaderId: leader?.playerId ?? null,
    archivedLeaderPoints: leader?.points ?? 0,
    mostAppearances: top?.tournaments ?? 0,
    mostAppearancesPlayerId: top?.playerId ?? null,
    players: PLAYERS.length,
    venues: VENUES.length,
    runningTournaments: RUNNING_STATS.tournaments,
  };
}

export const MDC_STATS: MdcStats = computeStats();
