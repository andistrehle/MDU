// ============================================================
// MDC — kompakte Rangliste für die Startseite
// ============================================================

import Link from 'next/link';
import type { Division, RankingEntry } from '@/data/types';
import { getPlayer, playerName } from '@/data/players';
import { formatAverage, formatNumber } from '@/lib/mdc/format';
import { PlayerAvatar } from './player-avatar';
import { TrendIcon } from './ui';

interface RankingWidgetProps {
  entries: RankingEntry[];
  division: Division;
  /** Kompakt = weniger Spalten, für die schmalere Frauen-Tabelle daneben. */
  compact?: boolean;
}

export function RankingWidget({ entries, division, compact = false }: RankingWidgetProps) {
  return (
    <div className="mdc-card mdc-scroll-x">
      <table className="mdc-table">
        <thead>
          <tr>
            <th className="mdc-sticky-col">Platz</th>
            <th className="mdc-hide-narrow" style={{ width: 40 }}><span className="sr-only">Trend</span></th>
            <th>{division === 'men' ? 'Spieler' : 'Spielerin'}</th>
            {!compact && <th className="mdc-hide-narrow">Passnr.</th>}
            {!compact && <th className="mdc-td-num mdc-hide-narrow">Anzahl TN</th>}
            <th className="mdc-td-num">Punkte</th>
            <th className="mdc-td-num mdc-hide-narrow">Schnitt</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => {
            const player = getPlayer(entry.playerId);
            if (!player) return null;
            const podium = entry.rank <= 3 ? `mdc-row-${entry.rank}` : '';

            return (
              <tr key={entry.playerId} className={podium}>
                <td className={`mdc-sticky-col mdc-num ${podium}`} style={{ fontWeight: 700 }}>
                  {entry.rank}
                </td>
                <td className="mdc-hide-narrow"><TrendIcon trend={entry.trend} /></td>
                <td className="mdc-cell-name">
                  <Link
                    href={`/mdc/spieler/${player.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <PlayerAvatar player={player} size={30} highlight={entry.rank === 1} />
                    <span style={{ fontWeight: 600, color: 'var(--mdc-ink)' }}>
                      {playerName(player)}
                    </span>
                  </Link>
                  {/* Am Handy fallen TN und Schnitt als Spalten weg. */}
                  <span className="mdc-narrow-only mdc-row-meta">
                    {entry.tournaments} TN · Ø {formatAverage(entry.average)}
                  </span>
                </td>
                {!compact && (
                  <td className="mdc-num mdc-hide-narrow" style={{ color: 'var(--mdc-ink-soft)' }}>{player.passNr}</td>
                )}
                {!compact && (
                  <td className="mdc-td-num mdc-num mdc-hide-narrow">{entry.tournaments}</td>
                )}
                <td className="mdc-td-num mdc-num" style={{ fontWeight: 700, color: 'var(--mdc-ink)' }}>
                  {formatNumber(entry.points)}
                </td>
                <td className="mdc-td-num mdc-num mdc-hide-narrow" style={{ color: 'var(--mdc-ink-soft)' }}>
                  {formatAverage(entry.average)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
