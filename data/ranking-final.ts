// ============================================================
// MDC — Endrangliste 2025/26 (Männer und Frauen)
// ============================================================
//
// Der offizielle Saison-Endstand vom 27.07.2026. Zwei getrennte Tabellen,
// zwei getrennte Ausschüttungen — gespielt wird gemeinsam.
//
// Schnitt und Euro-Beträge werden hier berechnet, nicht gepflegt:
//   Schnitt = Punkte / Anzahl TN     Euro = EZR-Betrag × Prozentsatz
// Damit stimmen die Spalten zwangsläufig zusammen.
// ============================================================

import type { Division, PayoutSummary, RankingEntry } from './types';
import { PARSED_MEN, PARSED_WOMEN } from './players';
import { RANKING_MEN_GAP } from './ranking-2025-26-men';

export { RANKING_MEN_GAP };

/** Ausschüttung der Saison 2025/26, wie im Kasten der Auswertung. */
export const PAYOUTS: Record<Division, PayoutSummary> = {
  men: {
    seasonId: '2025-26',
    division: 'men',
    jackpot: 22303.82,
    ezrPercent: 65,
    ezrAmount: 14497.48,
    nextTournamentAmount: 7806.34,
    transferLabel: 'Mädels 2 %',
    transferAmount: 605.74,
  },
  women: {
    seasonId: '2025-26',
    division: 'women',
    jackpot: 6329.74,
    ezrPercent: 65,
    ezrAmount: 4114.33,
    nextTournamentAmount: 2215.41,
    transferLabel: '2 % vom Männer-Jackpot',
    transferAmount: 605.74,
  },
};

function buildEntries(
  rows: typeof PARSED_MEN,
  payout: PayoutSummary,
): RankingEntry[] {
  return rows.map(row => ({
    rank: row.rank,
    sharedRank: row.sharedRank,
    previousRank: null,
    trend: row.trend,
    playerId: row.playerId,
    points: row.points,
    tournaments: row.tournaments,
    average: Math.round((row.points / row.tournaments) * 100) / 100,
    // Endstand einer abgeschlossenen Saison: Die beste Einzelplatzierung geht
    // aus der Auswertung nicht hervor — hier wird nichts geraten.
    bestFinish: 0,
    wins: 0,
    payoutPercent: row.payoutPercent ?? undefined,
    payoutEuro: row.payoutPercent === null
      ? undefined
      : Math.round(payout.ezrAmount * row.payoutPercent) / 100,
  }));
}

export const FINAL_RANKING_2025_26: Record<Division, RankingEntry[]> = {
  men: buildEntries(PARSED_MEN, PAYOUTS.men),
  women: buildEntries(PARSED_WOMEN, PAYOUTS.women),
};

/** Ranglisteneintrag eines Spielers im Saison-Endstand. */
export function getFinalEntry(playerId: string): RankingEntry | undefined {
  return FINAL_RANKING_2025_26.men.find(e => e.playerId === playerId)
    ?? FINAL_RANKING_2025_26.women.find(e => e.playerId === playerId);
}

/** Summe der ausgeschütteten Euro-Beträge einer Wertung (Kontrollwert). */
export function payoutTotal(division: Division): number {
  return FINAL_RANKING_2025_26[division]
    .reduce((sum, e) => sum + (e.payoutEuro ?? 0), 0);
}

export const DIVISION_LABEL: Record<Division, string> = {
  men: 'Männer',
  women: 'Frauen',
};
