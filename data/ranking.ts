// ============================================================
// MDC — Wertungen
// ============================================================
//
// LAUFEND — Saison 2026/27
//   `RUNNING_RANKING` ist absichtlich leer. Die Saison läuft seit dem
//   31.08.2026, die Einzelergebnisse liefert der Betreiber nach. Solange
//   nichts vorliegt, steht dort nichts: keine fortgeschriebenen Punkte aus
//   der Vorsaison, keine Schätzungen, keine Platzhalterspieler. Die
//   Oberfläche fragt `RUNNING_HAS_RESULTS` und zeigt bis dahin einen
//   ehrlichen Hinweis. Sobald die Zeilen hier eintreffen, füllt sich die
//   Rangliste von selbst — an den Seiten ist dann nichts zu ändern.
//
// ARCHIV — zwei abgeschlossene Wertungen, beide echt:
//   1. ENDRANGLISTE 2025/26 — Saison-Endstand vom 27.07.2026, getrennt nach
//      Männern und Frauen, mit Ausschüttung. Quelle: `ranking-final.ts`.
//   2. SOMMER-RANKING 2026 — Endstand der Zwischenserie vom 01.09.2026.
//      Quelle: `ranking-sommer-2026-*.ts`.
//
// Die Turniere in `tournaments.generated.ts` sind weiterhin Demo-Material und
// zahlen auf KEINE dieser Ranglisten ein — sie zeigen nur, wie Turnierseiten,
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

/** Endrangliste 2025/26 einer Wertungsklasse (Archiv). */
export function finalRankingOf(division: Division): RankingEntry[] {
  return FINAL_RANKING_2025_26[division];
}

// ------------------------------------------------------------
// Laufende Saison 2026/27
// ------------------------------------------------------------

/**
 * Wertung der laufenden Saison. Noch keine Ergebnisse — hier kommen die
 * Zeilen des Betreibers hinein, sobald er sie liefert (gleiche Form wie
 * `ranking-sommer-2026-*.ts`, dann über `toEntries` einlesen).
 */
const RUNNING_BY_DIVISION: Record<Division, RankingEntry[]> = {
  men: [],
  women: [],
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
    archivedLeaderId: leader?.playerId ?? null,
    archivedLeaderPoints: leader?.points ?? 0,
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
