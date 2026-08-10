import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, DemoNote } from '@/components/tk/ui/primitives';
import { CourseCard } from '@/components/tk/courses/course-card';
import { Reveal, Stagger, StaggerItem } from '@/components/tk/motion/reveal';
import { KIDS_COURSES } from '@/data/tk/courses';

export const metadata: Metadata = {
  title: 'Kinder und Jugend',
  description:
    'Vom roten Ball auf dem Kleinfeld bis zum Punktspiel: Kinder- und Jugendtraining bei ' +
    'Tennis Kail, mit Leihschlägern und kleinen Gruppen.',
};

/** Der Farbball-Stufenplan des DTB — er erklärt Eltern in 30 Sekunden alles. */
const STAGES = [
  {
    colour: '#C0392B',
    name: 'Roter Ball',
    age: '4–7 Jahre',
    text: 'Kleinfeld, weicher Ball, niedriges Netz. Es geht um Treffen, Laufen und Spaß — nicht um Technik.',
  },
  {
    colour: '#D98324',
    name: 'Oranger Ball',
    age: '7–10 Jahre',
    text: 'Dreiviertelfeld, etwas härterer Ball. Erste Aufschlagbewegung, erstes Zählen, erste Matches.',
  },
  {
    colour: '#3E7C4A',
    name: 'Grüner und gelber Ball',
    age: 'ab 10 Jahren',
    text: 'Großfeld, normaler Ball. Technik wird gefestigt, Taktik kommt dazu, Punktspiele werden ein Thema.',
  },
];

export default function KidsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Kinder und Jugend"
        title="Erst der rote Ball, dann die Welt"
        lede="Kleine Gruppen, viel Bewegung, kein Anstehen. Schläger gibt es zum Ausleihen — mitbringen muss man nur Hallenschuhe."
        tone="clay"
        action={
          <Link href="/tk/camps" className="tk-btn">
            Ferien-Camps ansehen
          </Link>
        }
      />

      {/* Stufenplan */}
      <section className="tk-section--tight">
        <div className="tk-shell">
          <h2 className="tk-h2">Wie die Stufen funktionieren</h2>
          <p className="tk-lede mt-2">
            Kinder spielen nicht auf verkleinerten Erwachsenenplätzen, sondern auf Feldern, die
            zu ihrer Größe passen. Der Ball wird mit jeder Stufe schneller.
          </p>
          <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
            {STAGES.map((s) => (
              <StaggerItem key={s.name}>
                <Card className="flex h-full flex-col gap-3 p-6">
                  <span
                    aria-hidden
                    className="h-9 w-9 rounded-full"
                    style={{ background: s.colour, boxShadow: `0 0 0 5px ${s.colour}22` }}
                  />
                  <div>
                    <h3 className="tk-h3">{s.name}</h3>
                    <p className="text-[0.84rem] text-[var(--tk-ink-dim)]">{s.age}</p>
                  </div>
                  <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">{s.text}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Kurse */}
      <section className="tk-section tk-section--wash">
        <div className="tk-shell">
          <h2 className="tk-h2">Kurse dieser Saison</h2>
          <p className="tk-lede mt-2">
            Zwölf Termine pro Kurs. Wer mitten in der Saison einsteigt, zahlt anteilig.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {KIDS_COURSES.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06}>
                <CourseCard course={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Eltern-Fragen */}
      <section className="tk-section">
        <div className="tk-shell grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="tk-h2">Was Eltern meistens fragen</h2>
            <div className="mt-6 flex flex-col gap-3">
              {[
                ['Braucht mein Kind einen eigenen Schläger?', 'Nein. Für die ersten Stunden gibt es Leihschläger in allen Größen. Wer dabeibleibt, bekommt im Shop einen passenden — die Testgebühr wird angerechnet.'],
                ['Kann mein Kind einmal reinschnuppern?', 'Ja, eine Probestunde ist kostenlos. Einfach auf der Kontaktseite melden, dann wird es in eine passende Gruppe gesetzt.'],
                ['Was passiert bei Regen?', 'Kindertraining wird in die Halle verlegt, nicht abgesagt. Bei Camps gilt dasselbe.'],
                ['Wie groß sind die Gruppen?', 'Höchstens acht Kinder bei den Kleinen, zehn in der Jugend. Ab vier Kindern findet der Kurs statt.'],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-[var(--tk-radius)] border border-[var(--tk-line)] bg-[var(--tk-paper)] p-4">
                  <summary className="cursor-pointer list-none font-semibold marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {q}
                      <span aria-hidden className="text-[var(--tk-clay)] transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-2 text-[0.92rem] text-[var(--tk-ink-soft)]">{a}</p>
                </details>
              ))}
            </div>
          </div>

          <Card className="flex flex-col gap-4 self-start p-6">
            <h2 className="tk-h3">Probestunde anfragen</h2>
            <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">
              Kurz Alter und Vorerfahrung schreiben, dann kommt ein Vorschlag für eine Gruppe.
              Kostenlos und unverbindlich.
            </p>
            <Link href="/tk/kontakt?anliegen=probestunde" className="tk-btn">
              Anfrage schreiben
            </Link>
            <DemoNote>
              Kurse, Termine und Preise sind Demo-Inhalte und bilden das echte Angebot nicht ab.
            </DemoNote>
          </Card>
        </div>
      </section>
    </>
  );
}
