import type { Metadata } from 'next';
import { PageHero } from '@/components/mdc/ui';
import { RankingExplorer } from '@/components/mdc/ranking-explorer';
import { toRankingRows } from '@/lib/mdc/rows';
import { finalRankingOf, summerRankingOf } from '@/data/ranking';
import { PAYOUTS, RANKING_MEN_GAP } from '@/data/ranking-final';
import { FINAL_SEASON, getCurrentSeason } from '@/data/season';

export const metadata: Metadata = {
  title: 'Rangliste',
  description:
    'Die MDC-Rangliste: Saison-Endstand 2025/26 für Männer und Frauen mit Ausschüttung, ' +
    'dazu der laufende Zwischenstand des Sommer-Rankings.',
};

export default function RanglistePage() {
  const summerSeason = getCurrentSeason();

  return (
    <>
      <PageHero
        kicker="Wertung"
        title="MDC Ranking"
        description="Jeder Turnierstart bringt Punkte — je größer das Feld und je weiter man kommt, desto mehr. Am Saisonende entscheidet die Rangliste über die Ausschüttung."
      />

      <section className="mdc-section">
        <div className="mdc-shell">
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
            summerAsOf={summerSeason.asOf}
            gap={RANKING_MEN_GAP}
          />
        </div>
      </section>
    </>
  );
}
