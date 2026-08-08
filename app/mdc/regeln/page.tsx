import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Target, Trophy, Users } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { EXAMPLE_FIELD_SIZES, pointsTableRows } from '@/lib/mdc/points';
import { formatNumber } from '@/lib/mdc/format';

export const metadata: Metadata = {
  title: 'Regeln',
  description:
    'Spielprinzip der Munich Darts Challenge: Einzelrangliste, Doppel-K.-o., Punkte nach ' +
    'Platzierung und Teilnehmerzahl.',
};

const BLOCKS = [
  {
    icon: <Users size={20} />,
    title: 'Einzelrangliste, keine Mannschaften',
    text:
      'Die Munich Darts Challenge ist eine reine Einzelwertung. Jede und jeder spielt für sich, ' +
      'mit eigener MDC-Passnummer. Es gibt keine Teams, keine Aufstellungen und keine Vereinsbindung.',
  },
  {
    icon: <Target size={20} />,
    title: '4 bis 32 Starter pro Turnier',
    text:
      'Gespielt wird in wechselnden Münchner Lokalen, mehrmals pro Woche. Angemeldet wird vor Ort ' +
      'bis kurz vor Turnierstart. Je nach Feldgröße läuft das Turnier über einen Baum bis 8, 16 oder 32 Plätze.',
  },
  {
    icon: <Trophy size={20} />,
    title: 'Punkte für die Saisonrangliste',
    text:
      'Jede Platzierung bringt Punkte. Alle Punkte einer Saison werden aufaddiert — daraus entsteht die ' +
      'Rangliste, die am Saisonende über die Ausschüttung entscheidet. Männer und Frauen spielen gemeinsam ' +
      'und werden am Ende in zwei getrennten Tabellen gewertet.',
  },
];

const STAGES = [
  {
    step: '1',
    title: 'Winner Bracket',
    text: 'Alle starten im Winner Bracket. Wer gewinnt, bleibt dort und spielt um den Turniersieg.',
  },
  {
    step: '2',
    title: 'Erste Niederlage',
    text: 'Wer verliert, ist nicht raus: Er rutscht ins Loser Bracket und spielt dort weiter.',
  },
  {
    step: '3',
    title: 'Zweite Niederlage',
    text: 'Wer auch im Loser Bracket verliert, scheidet aus. Zwei Niederlagen — Feierabend.',
  },
  {
    step: '4',
    title: 'Finale',
    text: 'Der Sieger des Winner Brackets trifft im Finale auf den Sieger des Loser Brackets.',
  },
];

export default function RegelnPage() {
  const rows = pointsTableRows();

  return (
    <>
      <PageHero
        kicker="Spielprinzip"
        title="Regeln"
        description="Kurz gesagt: anmelden, Doppel-K.-o. spielen, Punkte sammeln. Wer zweimal verliert, scheidet aus."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {BLOCKS.map(block => (
              <article key={block.title} className="mdc-card" style={{ padding: '22px 20px' }}>
                <span style={{ color: 'var(--mdc-red)' }}>{block.icon}</span>
                <h2 className="mdc-display" style={{ fontSize: '1.2rem', marginTop: 12 }}>{block.title}</h2>
                <p style={{ marginTop: 9, fontSize: '0.92rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
                  {block.text}
                </p>
              </article>
            ))}
          </div>

          {/* ── Doppel-K.-o. ── */}
          <div>
            <h2 className="mdc-display mdc-h2" style={{ marginBottom: 10 }}>Doppel-K.-o.</h2>
            <p className="mdc-lead" style={{ marginBottom: 22, maxWidth: 720 }}>
              Der Modus gibt jedem eine zweite Chance: Eine Niederlage kostet noch nicht das Turnier.
              Das macht die Abende länger, aber auch fairer — ein schwaches Leg gegen den späteren
              Sieger wirft niemanden gleich raus.
            </p>

            <ol style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(228px, 1fr))' }}>
              {STAGES.map(stage => (
                <li key={stage.step} className="mdc-card mdc-card-accent" style={{ padding: '20px' }}>
                  <span
                    className="mdc-display"
                    style={{ fontSize: '2.2rem', color: 'var(--mdc-red)', lineHeight: 1 }}
                  >
                    {stage.step}
                  </span>
                  <h3 className="mdc-display" style={{ fontSize: '1.1rem', marginTop: 10 }}>{stage.title}</h3>
                  <p style={{ marginTop: 7, fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--mdc-ink-soft)' }}>
                    {stage.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          {/* ── Punkte ── */}
          <div>
            <h2 className="mdc-display mdc-h2" style={{ marginBottom: 10 }}>Punkte</h2>
            <p className="mdc-lead" style={{ marginBottom: 22, maxWidth: 760 }}>
              Die Punkte hängen an zwei Dingen: wie weit man kommt und wie groß das Feld war.
              Ein Sieg gegen 31 Gegner ist mehr wert als einer gegen sieben. Spieler, die im
              selben Durchgang ausscheiden, bekommen dieselbe Punktzahl.
            </p>

            <div className="mdc-card mdc-scroll-x">
              <table className="mdc-table">
                <thead>
                  <tr>
                    <th className="mdc-sticky-col">Platzierung</th>
                    {EXAMPLE_FIELD_SIZES.map(size => (
                      <th key={size} className="mdc-td-num">{size} Starter</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.group}>
                      <td className="mdc-sticky-col" style={{ fontWeight: 600 }}>{row.group}</td>
                      {row.points.map((points, index) => (
                        <td
                          key={EXAMPLE_FIELD_SIZES[index]}
                          className="mdc-td-num mdc-num"
                          style={{ color: points ? 'var(--mdc-ink)' : 'var(--mdc-ink-dim)' }}
                        >
                          {points ? formatNumber(points) : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ marginTop: 12, fontSize: '0.82rem', color: 'var(--mdc-ink-dim)', lineHeight: 1.6 }}>
              „—“ heißt: Diesen Platz gibt es in einem Feld dieser Größe nicht.
            </p>
          </div>

          {/* ── Saisonwertung ── */}
          <div>
            <h2 className="mdc-display mdc-h2" style={{ marginBottom: 10 }}>Saisonwertung</h2>
            <p className="mdc-lead" style={{ maxWidth: 760 }}>
              Alle Punkte einer Saison werden aufaddiert; der Schnitt zeigt, wie stark jemand pro
              Turnier war. Am Saisonende wird die Rangliste abgeschlossen und der Jackpot
              ausgeschüttet: Ein fester Anteil geht an die Einzelrangliste, der Rest in das
              folgende Turnier. Männer und Frauen haben dabei jeweils ihre eigene Tabelle und
              ihre eigene Ausschüttung.
            </p>
            <Link href="/mdc/rangliste" className="mdc-btn mdc-btn-primary" style={{ marginTop: 20 }}>
              Zur Rangliste
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
