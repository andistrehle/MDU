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
import { ArrowLeft, ListOrdered } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { RankingExplorer } from '@/components/mdc/ranking-explorer';
import { toRankingRows } from '@/lib/mdc/rows';
import { finalRankingOf, summerRankingOf } from '@/data/ranking';
import { PAYOUTS, RANKING_MEN_GAP } from '@/data/ranking-final';
import { FINAL_SEASON, RUNNING_SEASON, SUMMER_SEASON } from '@/data/season';
import { ARCHIVE_STATS } from '@/data/tournament-results';
import { mdcPath } from '@/lib/mdc/site';

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
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <Link href={mdcPath('/rangliste')} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
              <ArrowLeft size={16} />
              Zur Saison {RUNNING_SEASON.label}
            </Link>
            {/* Die Wertung unten entsteht aus diesen Turnieren — ein Klick
                weiter steht jede einzelne Ergebnisliste. */}
            <Link href={mdcPath('/turniere/ergebnisse')} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
              <ListOrdered size={16} />
              Die {ARCHIVE_STATS.tournaments} Turniere dazu
            </Link>
          </div>

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
