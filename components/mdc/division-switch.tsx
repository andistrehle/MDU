'use client';

// ============================================================
// MDC — Rangliste einer laufenden Saison
// ============================================================
//
// Nur ein Umschalter: Männer ↔ Frauen. Männer und Frauen spielen dieselben
// Turniere, gewertet wird getrennt.
//
// Jackpot und Verteilung stehen hier wie im Archiv — nur eben als
// Zwischenstand. Dass sich beides bis zum Saisonende noch verschiebt, sagt der
// Kasten ausdrücklich dazu: Wer heute Fünfter ist, kann im Mai 29. sein.
// ============================================================

import { useState } from 'react';
import type { Division, PayoutSummary } from '@/data/types';
import { formatDate, formatNumber } from '@/lib/mdc/format';
import { RankingTable, type RankingRow } from './ranking-table';
import { PayoutBox } from './payout-box';

interface DivisionSwitchProps {
  men: RankingRow[];
  women: RankingRow[];
  /** Stand der Wertung — steht als Datum über der Tabelle. */
  asOf: string;
  /** Jackpot je Wertung, sofern die Saison einen führt. */
  payouts?: Record<Division, PayoutSummary>;
  /** Teilnahmen je Wertung — erklärt, wie der Topf zustande kommt. */
  teilnahmen?: Record<Division, number>;
  /** Wie viele haben die Mindestzahl an Teilnahmen schon erreicht? */
  dabei?: Record<Division, number>;
  /** Startgeld je Teilnahme, das in den Topf fließt. */
  startgeld?: number;
  /** So oft muss man spielen, um bei der Ausschüttung dabei zu sein. */
  mindestTeilnahmen?: number;
  seasonLabel: string;
}

export function DivisionSwitch({
  men, women, asOf, payouts, teilnahmen, dabei, startgeld, mindestTeilnahmen, seasonLabel,
}: DivisionSwitchProps) {
  const [division, setDivision] = useState<Division>('men');
  const rows = division === 'men' ? men : women;

  return (
    <div>
      <div className="mdc-segment" role="group" aria-label="Wertungsklasse" style={{ marginBottom: 22 }}>
        <button type="button" data-active={division === 'men'} onClick={() => setDivision('men')}>
          Männer
        </button>
        <button type="button" data-active={division === 'women'} onClick={() => setDivision('women')}>
          Frauen
        </button>
      </div>

      <p
        style={{
          color: 'var(--mdc-ink-soft)', fontSize: '0.9rem',
          marginBottom: 20, maxWidth: 720, lineHeight: 1.6,
        }}
      >
        Zwischenstand vom {formatDate(asOf)} · {formatNumber(rows.length)} in der
        Wertung. Gespielt haben Männer und Frauen dieselben Turniere — gewertet
        wird getrennt.
      </p>

      {payouts && (
        <PayoutBox
          payout={payouts[division]}
          titel={`Jackpot Saison ${seasonLabel} — Zwischenstand`}
          hinweis={
            <>
              Der Topf wächst mit jedem Turnier: {startgeld ?? 3} € je Teilnahme, bisher{' '}
              {formatNumber(teilnahmen?.[division] ?? 0)}
              {' '}in dieser Wertung. Dazu der Übertrag aus der Vorsaison. Ausgeschüttet
              wird erst am Saisonende — {payouts[division].ezrPercent} % über die
              Einzelrangliste, der Rest in das Abschlussturnier. Die Beträge in der
              Tabelle sind der Stand von heute — der Topf wächst noch, und die Plätze
              verschieben sich bis zum Schluss.
              {mindestTeilnahmen !== undefined && (
                <>
                  {' '}Dabei ist, wer <strong>mindestens {mindestTeilnahmen} Turniere</strong>{' '}
                  gespielt hat — bisher{' '}
                  {(dabei?.[division] ?? 0) === 0
                    ? 'noch niemand'
                    : `${formatNumber(dabei?.[division] ?? 0)} von ${formatNumber(rows.length)}`}
                  .
                </>
              )}
            </>
          }
        />
      )}

      {/* Anteil und Euro-Betrag stehen mit dabei, sobald es einen Jackpot
          gibt — als Zwischenstand, der sich mit jedem Turnier ändert. */}
      <RankingTable rows={rows} showPayout={payouts !== undefined} />
    </div>
  );
}
