// ============================================================
// MDC — Der Kasten mit Jackpot und Ausschüttung
// ============================================================
//
// Steht im Archiv beim Saison-Endstand und bei der laufenden Wertung. Bewusst
// dieselbe Darstellung: Es ist dieselbe Rechnung, einmal fertig und einmal im
// Lauf. Wer den Endstand kennt, muss sich beim Zwischenstand nicht neu
// zurechtfinden.
//
// Der Unterschied steckt nur in der Überschrift und in `hinweis` — bei einer
// laufenden Saison gehört dazu, dass der Betrag noch wächst.
// ============================================================

import type { ReactNode } from 'react';
import { Euro } from 'lucide-react';
import type { PayoutSummary } from '@/data/types';
import { formatNumber } from '@/lib/mdc/format';

// Schreibweise wie bisher im Archiv — 1.234,56 €.
const euro = (value: number) =>
  `${formatNumber(Math.floor(value))},${String(Math.round((value % 1) * 100)).padStart(2, '0')} €`;

export function PayoutBox({ payout, titel, hinweis }: {
  payout: PayoutSummary;
  titel: string;
  hinweis: ReactNode;
}) {
  const items = [
    { label: 'Jackpot', value: euro(payout.jackpot), strong: true },
    { label: `Einzelrangliste ${payout.ezrPercent} %`, value: euro(payout.ezrAmount) },
    { label: 'Abschlussturnier', value: euro(payout.nextTournamentAmount) },
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
          {titel}
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
        {hinweis}
      </p>
    </div>
  );
}
