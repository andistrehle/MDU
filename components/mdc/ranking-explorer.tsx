'use client';

// ============================================================
// MDC — Ranglisten-Ansicht mit Umschaltern
// ============================================================
//
// Zwei Umschalter:
//   • Wertung: Saison-Endstand 2025/26 ↔ laufendes Sommer-Ranking 2026
//   • Klasse:  Männer ↔ Frauen
//
// Männer und Frauen spielen dieselben Turniere, gewertet wird am Saisonende
// aber getrennt — jede Klasse mit eigener Ausschüttung.
// ============================================================

import { useState } from 'react';
import { Euro, Trophy } from 'lucide-react';
import type { Division, PayoutSummary } from '@/data/types';
import { formatDate, formatNumber } from '@/lib/mdc/format';
import { RankingTable, type RankingRow } from './ranking-table';

type Scope = 'final' | 'summer';

interface RankingExplorerProps {
  final: Record<Division, RankingRow[]>;
  summer: Record<Division, RankingRow[]>;
  payouts: Record<Division, PayoutSummary>;
  finalAsOf: string;
  summerAsOf: string;
  gap: { from: number; to: number };
}

const euro = (value: number) =>
  `${formatNumber(Math.floor(value))},${String(Math.round((value % 1) * 100)).padStart(2, '0')} €`;

export function RankingExplorer({
  final, summer, payouts, finalAsOf, summerAsOf, gap,
}: RankingExplorerProps) {
  const [scope, setScope] = useState<Scope>('final');
  const [division, setDivision] = useState<Division>('men');

  const rows = scope === 'final' ? final[division] : summer[division];
  const payout = payouts[division];

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
        <div className="mdc-segment" role="group" aria-label="Wertung">
          <button type="button" data-active={scope === 'final'} onClick={() => setScope('final')}>
            Endstand 2025/26
          </button>
          <button type="button" data-active={scope === 'summer'} onClick={() => setScope('summer')}>
            Sommer-Ranking 2026
          </button>
        </div>

        <div className="mdc-segment" role="group" aria-label="Wertungsklasse">
          <button type="button" data-active={division === 'men'} onClick={() => setDivision('men')}>
            Männer
          </button>
          <button type="button" data-active={division === 'women'} onClick={() => setDivision('women')}>
            Frauen
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.9rem', marginBottom: 20, maxWidth: 720, lineHeight: 1.6 }}>
        {scope === 'final' ? (
          <>
            Offizieller Saison-Endstand vom {formatDate(finalAsOf)}. Gespielt haben
            Männer und Frauen dieselben Turniere — gewertet und ausgeschüttet wird getrennt.
          </>
        ) : (
          <>
            Endstand der Sommerserie zwischen den beiden Saisons, vom {formatDate(summerAsOf)}.
            Eine eigene Wertung ohne Ausschüttung — die Punkte zählen nicht zur Saison 2025/26.
          </>
        )}
      </p>

      {scope === 'final' && <PayoutBox payout={payout} />}

      <RankingTable
        rows={rows}
        showPayout={scope === 'final'}
        gap={scope === 'final' && division === 'men' ? gap : undefined}
      />
    </div>
  );
}

function PayoutBox({ payout }: { payout: PayoutSummary }) {
  const items = [
    { label: 'Jackpot', value: euro(payout.jackpot), strong: true },
    { label: `Einzelrangliste ${payout.ezrPercent} %`, value: euro(payout.ezrAmount) },
    { label: 'Folgendes Turnier', value: euro(payout.nextTournamentAmount) },
    { label: payout.transferLabel, value: euro(payout.transferAmount) },
  ];

  return (
    <div
      className="mdc-card mdc-card-accent"
      style={{ padding: '20px 20px 18px', marginBottom: 22 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
        <Euro size={17} style={{ color: 'var(--mdc-red)' }} />
        <h3
          style={{
            fontFamily: 'var(--mdc-font-display)', textTransform: 'uppercase',
            letterSpacing: '0.13em', fontSize: '0.8rem', fontWeight: 700, color: 'var(--mdc-ink)',
          }}
        >
          Ausschüttung Saison 2025/26
        </h3>
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ fontSize: '0.74rem', color: 'var(--mdc-ink-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {item.label}
            </div>
            <div
              className="mdc-num"
              style={{
                marginTop: 5,
                fontSize: item.strong ? '1.35rem' : '1.1rem',
                fontWeight: 700,
                color: item.strong ? 'var(--mdc-gold)' : 'var(--mdc-ink)',
              }}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 14, fontSize: '0.8rem', color: 'var(--mdc-ink-dim)', lineHeight: 1.6 }}>
        <Trophy size={13} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />
        Vom Jackpot gehen {payout.ezrPercent} % an die Einzelrangliste, der Rest fließt
        in das folgende Turnier. Der Euro-Betrag je Platz ergibt sich aus dem Prozentsatz
        in der Tabelle.
      </p>
    </div>
  );
}
