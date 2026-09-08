// ============================================================
// MDC — Ranglisteneinträge in Tabellenzeilen übersetzen
// ============================================================
//
// Serverseitig werden Wertung und Spielerstamm zusammengeführt, damit die
// Tabellenkomponente im Browser nur noch fertige Zeilen bekommt (und nicht
// den kompletten Spielerstamm laden muss).
// ============================================================

import type { RankingEntry } from '@/data/types';
import { getPlayer } from '@/data/players';
import type { RankingRow } from '@/components/mdc/ranking-table';

/**
 * Der Euro-Betrag je Platz, gerechnet aus dem Anteil der Auswertung und dem
 * Betrag, der über die Einzelrangliste ausgeschüttet wird.
 *
 * Bei einer laufenden Saison ist das ein Zwischenstand: Der Jackpot wächst mit
 * jedem Turnier, und die Plätze verschieben sich sowieso. Genau deshalb wird
 * hier gerechnet und nicht abgelegt — sonst stünde in der Tabelle irgendwann
 * ein Betrag, den es nicht mehr gibt.
 */
export function withPayout(rows: RankingRow[], ezrAmount: number): RankingRow[] {
  return rows.map(row => (
    row.payoutPercent === undefined
      ? row
      : { ...row, payoutEuro: Math.round(ezrAmount * row.payoutPercent) / 100 }
  ));
}

export function toRankingRows(entries: RankingEntry[]): RankingRow[] {
  return entries.flatMap(entry => {
    const player = getPlayer(entry.playerId);
    // Ohne Spieler im Stamm keine Zeile — lieber eine Zeile weniger als eine
    // Zeile mit erfundenem Namen.
    if (!player) return [];
    return [{
      rank: entry.rank,
      sharedRank: entry.sharedRank,
      trend: entry.trend,
      playerId: player.id,
      passNr: player.passNr,
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname,
      tournaments: entry.tournaments,
      points: entry.points,
      average: entry.average,
      payoutPercent: entry.payoutPercent,
      payoutEuro: entry.payoutEuro,
    }];
  });
}
