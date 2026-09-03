'use client';

// ============================================================
// MDC — Rangliste einer laufenden Saison
// ============================================================
//
// Nur ein Umschalter: Männer ↔ Frauen. Männer und Frauen spielen dieselben
// Turniere, gewertet wird getrennt.
//
// Ausschüttung und Lückenhinweis fehlen hier absichtlich: Beides gehört zum
// Saison-Endstand und stünde in einer laufenden Wertung nur als Versprechen.
// Der Endstand liegt im Archiv (`ranking-explorer.tsx`).
// ============================================================

import { useState } from 'react';
import type { Division } from '@/data/types';
import { formatDate, formatNumber } from '@/lib/mdc/format';
import { RankingTable, type RankingRow } from './ranking-table';

interface DivisionSwitchProps {
  men: RankingRow[];
  women: RankingRow[];
  /** Stand der Wertung — steht als Datum über der Tabelle. */
  asOf: string;
}

export function DivisionSwitch({ men, women, asOf }: DivisionSwitchProps) {
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

      <RankingTable rows={rows} />
    </div>
  );
}
