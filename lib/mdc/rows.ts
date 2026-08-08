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
