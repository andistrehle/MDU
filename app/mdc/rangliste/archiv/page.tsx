// ============================================================
// MDC — Archiv der abgeschlossenen Wertungen
// ============================================================
//
// Hier liegen die Wertungen, die nicht mehr angefasst werden: der
// Saison-Endstand 2025/26 mit Ausschüttung und das Sommer-Ranking 2026.
// Beides sind echte Auswertungen des Betreibers.
//
// Die Ansicht ist dieselbe wie früher auf der Ranglisten-Seite — sie ist
// hierher gewandert, als die Saison 2026/27 begann.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { RankingExplorer } from '@/components/mdc/ranking-explorer';
import { toRankingRows } from '@/lib/mdc/rows';
import { finalRankingOf, summerRankingOf } from '@/data/ranking';
import { PAYOUTS, RANKING_MEN_GAP } from '@/data/ranking-final';
import { FINAL_SEASON, RUNNING_SEASON, SUMMER_SEASON } from '@/data/season';

export const metadata: Metadata = {
  title: 'Archiv',
  description:
    'Archiv der MDC-Wertungen: Saison-Endstand 2025/26 für Männer und Frauen mit ' +
    'Ausschüttung sowie der Endstand des Sommer-Rankings 2026.',
};

export default function ArchivPage() {
  return (
    <>
      <PageHero
        kicker="Archiv"
        title="Abgeschlossene Wertungen"
        description="Der Saison-Endstand 2025/26 mit Ausschüttung und das Sommer-Ranking 2026. Beide Wertungen sind abgeschlossen und werden nicht mehr verändert."
      />

      <section className="mdc-section">
        <div className="mdc-shell">
          <Link
            href="/mdc/rangliste"
            className="mdc-btn mdc-btn-ghost mdc-btn-sm"
            style={{ marginBottom: 24 }}
          >
            <ArrowLeft size={16} />
            Zur Saison {RUNNING_SEASON.label}
          </Link>

          <RankingExplorer
            final={{
              men: toRankingRows(finalRankingOf('men')),
              women: toRankingRows(finalRankingOf('women')),
            }}
            summer={{
              men: toRankingRows(summerRankingOf('men')),
              women: toRankingRows(summerRankingOf('women')),
            }}
            payouts={PAYOUTS}
            finalAsOf={FINAL_SEASON.asOf}
            summerAsOf={SUMMER_SEASON.asOf}
            gap={RANKING_MEN_GAP ?? undefined}
          />
        </div>
      </section>
    </>
  );
}
