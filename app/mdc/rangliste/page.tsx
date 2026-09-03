// ============================================================
// MDC — Rangliste der laufenden Saison
// ============================================================
//
// Zeigt die Wertung der laufenden Saison. Liegt noch keine vor, steht hier
// ein ehrlicher Hinweis samt Weg ins Archiv — und keine leere Tabelle, die
// aussieht als wäre etwas kaputt.
//
// Sobald `runningRankingOf` Zeilen liefert (siehe `data/ranking.ts`),
// erscheint die Tabelle von selbst. An dieser Datei ist dafür nichts zu tun.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Archive } from 'lucide-react';
import { PageHero, EmptyRanking } from '@/components/mdc/ui';
import { RankingTable } from '@/components/mdc/ranking-table';
import { DivisionSwitch } from '@/components/mdc/division-switch';
import { toRankingRows } from '@/lib/mdc/rows';
import { runningRankingOf, RUNNING_HAS_RESULTS, openSheetRows } from '@/data/ranking';
import { DemoNotice } from '@/components/mdc/ui';
import { FINAL_SEASON, RUNNING_SEASON } from '@/data/season';
import { formatDate } from '@/lib/mdc/format';

export const metadata: Metadata = {
  title: 'Rangliste',
  description:
    'Die MDC-Rangliste der laufenden Saison 2026/27 — dazu das Archiv mit dem ' +
    'Saison-Endstand 2025/26 und dem Sommer-Ranking 2026.',
};

export default function RanglistePage() {
  const offen = openSheetRows();

  return (
    <>
      <PageHero
        kicker={`Saison ${RUNNING_SEASON.label}`}
        title="MDC Ranking"
        description="Jeder Turnierstart bringt Punkte — je größer das Feld und je weiter man kommt, desto mehr. Am Saisonende entscheidet die Rangliste über die Ausschüttung."
      />

      <section className="mdc-section">
        <div className="mdc-shell">
          {RUNNING_HAS_RESULTS ? (
            <>
              <DivisionSwitch
                men={toRankingRows(runningRankingOf('men'))}
                women={toRankingRows(runningRankingOf('women'))}
                asOf={RUNNING_SEASON.asOf}
              />

              {/* Zeilen, die (noch) in keiner der beiden Wertungen stehen
                  können — offen ausweisen statt stillschweigend weglassen. */}
              {offen.length > 0 && (
                <div style={{ marginTop: 22 }}>
                  <DemoNotice>
                    {offen.length === 1 ? 'Eine Zeile wartet' : `${offen.length} Zeilen warten`} noch
                    auf die Wertungsklasse:{' '}
                    {offen.map(o => o.row.writtenName).join(', ')}. Auf der Ergebnisliste war die
                    Spalte M/F nicht angekreuzt, und die Passnummer steht noch in keiner
                    Auswertung. Die Punkte sind erfasst, sobald geklärt ist, in welche Wertung
                    sie gehören.
                  </DemoNotice>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Kein Verweis im Kasten selbst — der Abschnitt darunter führt
                  ins Archiv und erklärt dabei, was dort steht. */}
              <EmptyRanking title={`Saison ${RUNNING_SEASON.label} — noch keine Wertung`}>
                Die Saison läuft seit dem {formatDate(RUNNING_SEASON.startDate)}. Die
                Einzelergebnisse der Ranking-Turniere werden nachgetragen, sobald sie
                vorliegen — bis dahin steht hier bewusst nichts. Es wird nichts aus der
                Vorsaison fortgeschrieben und nichts geschätzt.
              </EmptyRanking>

              <div style={{ marginTop: 28 }}>
                <h2 className="mdc-display mdc-h3" style={{ marginBottom: 10 }}>
                  Abgeschlossene Wertungen
                </h2>
                <p
                  style={{
                    color: 'var(--mdc-ink-soft)', fontSize: '0.94rem',
                    lineHeight: 1.65, maxWidth: 620, marginBottom: 16,
                  }}
                >
                  Der Endstand der Saison {FINAL_SEASON.label} vom{' '}
                  {formatDate(FINAL_SEASON.asOf)} und das Sommer-Ranking 2026 bleiben
                  vollständig einsehbar — mit Punkten, Schnitt und Ausschüttung.
                </p>
                <Link href="/mdc/rangliste/archiv" className="mdc-btn mdc-btn-primary">
                  <Archive size={18} />
                  Archiv öffnen
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
