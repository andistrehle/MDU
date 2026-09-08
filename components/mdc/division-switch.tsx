'use client';

// ============================================================
// MDC — Rangliste einer laufenden Saison
// ============================================================
//
// Nur ein Umschalter: Männer ↔ Frauen. Männer und Frauen spielen dieselben
// Turniere, gewertet wird getrennt.
//
// Der Jackpot steht hier wie im Archiv, aber ohne Euro-Beträge je Platz: Der
// Topf ist ein Fakt, die Verteilung noch nicht. Wer heute Zweiter ist, kann
// im Mai Zwölfter sein — eine Zahl daneben wäre ein Versprechen, das die
// Tabelle nicht halten kann.
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
  /** Startgeld je Teilnahme, das in den Topf fließt. */
  startgeld?: number;
  seasonLabel: string;
}

export function DivisionSwitch({
  men, women, asOf, payouts, teilnahmen, startgeld, seasonLabel,
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
              Einzelrangliste, der Rest fließt in das folgende Turnier. Wie viel auf
              welchen Platz entfällt, steht deshalb noch nicht in der Tabelle.
            </>
          }
        />
      )}

      <RankingTable rows={rows} />
    </div>
  );
}
