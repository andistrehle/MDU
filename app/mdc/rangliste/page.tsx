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
import { AlertTriangle, Archive } from 'lucide-react';
import { PageHero, EmptyRanking } from '@/components/mdc/ui';
import { DivisionSwitch } from '@/components/mdc/division-switch';
import { toRankingRows } from '@/lib/mdc/rows';
import { runningRankingOf, RUNNING_HAS_RESULTS, RUNNING_IS_CORRECTED } from '@/data/ranking';
import { CORRECTIONS } from '@/data/corrections';
import { RUNNING_STATS } from '@/data/tournament-results';
import { FINAL_SEASON, RUNNING_SEASON } from '@/data/season';
import { formatDate } from '@/lib/mdc/format';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  title: 'Rangliste',
  description:
    'Die MDC-Rangliste der laufenden Saison 2026/27 — dazu das Archiv mit dem ' +
    'Saison-Endstand 2025/26 und dem Sommer-Ranking 2026.',
};

export default function RanglistePage() {
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
              {RUNNING_IS_CORRECTED && (
                <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                  {CORRECTIONS.map(hinweis => (
                    <div
                      key={hinweis.tournamentId}
                      className="mdc-card"
                      style={{
                        display: 'flex', gap: 12, padding: '14px 16px',
                        borderColor: 'var(--mdc-red-a35)', background: 'var(--mdc-red-a08)',
                        fontSize: '0.86rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)',
                      }}
                    >
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
                      <p>
                        <strong>Ein Turnier ist berichtigt.</strong> {hinweis.note}{' '}
                        Dadurch weichen einzelne Punktzahlen und Plätze von der ausgehängten
                        Liste ab.{' '}
                        <Link href={mdcPath(`/turniere/ergebnisse/${hinweis.tournamentId}`)}>
                          Zum Turnier
                        </Link>
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <DivisionSwitch
                men={toRankingRows(runningRankingOf('men'))}
                women={toRankingRows(runningRankingOf('women'))}
                asOf={RUNNING_SEASON.asOf}
              />

              <p style={{ marginTop: 20, fontSize: '0.84rem', color: 'var(--mdc-ink-dim)', maxWidth: 700, lineHeight: 1.65 }}>
                Gerechnet aus {RUNNING_STATS.tournaments} Turnieren seit dem{' '}
                {formatDate(RUNNING_SEASON.startDate)} — {RUNNING_STATS.entries} Starts,{' '}
                {RUNNING_STATS.points.toLocaleString('de-DE')} vergebene Punkte. Jedes einzelne
                Turnier steht in der{' '}
                <Link href={mdcPath('/turniere/ergebnisse')}>Ergebnisübersicht</Link>.
              </p>
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
                <Link href={mdcPath('/rangliste/archiv')} className="mdc-btn mdc-btn-primary">
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
