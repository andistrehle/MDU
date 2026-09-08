'use client';

// ============================================================
// MDC — Ranglisten-Ansicht mit Umschaltern
// ============================================================
//
// Zwei Umschalter:
//   • Wertung: Saison-Endstand 2025/26 ↔ Sommer-Ranking 2026 (beide beendet)
//   • Klasse:  Männer ↔ Frauen
//
// Männer und Frauen spielen dieselben Turniere, gewertet wird am Saisonende
// aber getrennt — jede Klasse mit eigener Ausschüttung.
// ============================================================

import { useState } from 'react';
import type { Division, PayoutSummary } from '@/data/types';
import { formatDate } from '@/lib/mdc/format';
import { RankingTable, type RankingRow } from './ranking-table';
import { PayoutBox } from './payout-box';

type Scope = 'final' | 'summer';

interface RankingExplorerProps {
  final: Record<Division, RankingRow[]>;
  summer: Record<Division, RankingRow[]>;
  payouts: Record<Division, PayoutSummary>;
  finalAsOf: string;
  summerAsOf: string;
  /** Nur setzen, wenn Auswertungsseiten fehlen. */
  gap?: { from: number; to: number };
}

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

      {scope === 'final' && (
        <PayoutBox
          payout={payout}
          titel="Ausschüttung Saison 2025/26"
          hinweis={
            <>
              Vom Jackpot gehen {payout.ezrPercent} % an die Einzelrangliste, der Rest
              geht in das Abschlussturnier. Der Euro-Betrag je Platz ergibt sich aus dem
              Prozentsatz in der Tabelle.
            </>
          }
        />
      )}

      <RankingTable
        rows={rows}
        showPayout={scope === 'final'}
        gap={scope === 'final' && division === 'men' ? gap : undefined}
      />
    </div>
  );
}

