// ============================================================
// MDC — Turnierkarte
// ============================================================
//
// Ein gespieltes Turnier in Kurzform: Datum, Lokal, Feldgröße und das Podium.
// Kein Meldestand, keine Uhrzeit, keine Legs — das führt die Auswertung des
// Betreibers nicht, also steht es hier auch nicht.
// ============================================================

import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import type { TournamentRecord } from '@/data/tournament-results';
import { getPlayer, playerName } from '@/data/players';
import { formatDate, formatDateShort, formatNumber } from '@/lib/mdc/format';

const MEDAL = ['var(--mdc-gold)', 'var(--mdc-silver)', 'var(--mdc-bronze)'];

export function TournamentCard({ tournament }: { tournament: TournamentRecord }) {
  const top3 = tournament.results.slice(0, 3);

  return (
    <article className="mdc-card mdc-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '18px 20px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span className="mdc-chip mdc-chip-red">{formatDateShort(tournament.date)}</span>
          <span className="mdc-chip">{tournament.participants} Starter</span>
        </div>

        <h3 className="mdc-display mdc-h3" style={{ lineHeight: 1 }}>{tournament.venueName}</h3>
        <p style={{ marginTop: 6, fontSize: '0.86rem', color: 'var(--mdc-ink-soft)' }}>
          Ranking-Turnier · {formatDate(tournament.date)}
        </p>

        <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} />
            {formatNumber(tournament.results.reduce((sum, r) => sum + r.points, 0))} Punkte vergeben
          </span>
        </div>
      </div>

      <ol style={{ margin: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {top3.map(result => {
          const player = result.playerId ? getPlayer(result.playerId) : undefined;
          return (
            <li
              key={result.passNr}
              style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}
            >
              <span
                className="mdc-num"
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${MEDAL[result.rank - 1]}`,
                  color: MEDAL[result.rank - 1], fontSize: '0.7rem', fontWeight: 700,
                }}
              >
                {result.rank}
              </span>
              <span
                style={{
                  color: 'var(--mdc-ink)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                {player ? playerName(player) : `Passnr. ${result.passNr}`}
              </span>
              <span className="mdc-num" style={{ marginLeft: 'auto', color: 'var(--mdc-ink-soft)' }}>
                {formatNumber(result.points)}
              </span>
            </li>
          );
        })}
      </ol>

      <div style={{ padding: '18px 20px 20px', marginTop: 'auto' }}>
        <Link href={`/mdc/turniere/ergebnisse/${tournament.id}`} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
          Ergebnisliste
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
