import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, DemoNote, Kpi } from '@/components/tk/ui/primitives';
import { CourseCard } from '@/components/tk/courses/course-card';
import { Reveal } from '@/components/tk/motion/reveal';
import { ADULT_COURSES, CAMPS } from '@/data/tk/courses';
import { courseJsonLd } from '@/lib/tk/seo';

export const metadata: Metadata = {
  title: 'Ferien-Camps und Kurse',
  description:
    'Ferien-Camps für Kinder und Jugendliche sowie Kurse für Erwachsene bei Tennis Kail — ' +
    'mit Schlechtwetter-Garantie in der Halle.',
};

export default function CampsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(CAMPS.map((c) => courseJsonLd(c))),
        }}
      />

      <PageHeader
        eyebrow="Camps und Kurse"
        title="Ferien, in denen etwas hängen bleibt"
        lede="Vormittags Tennis, nachmittags raus. Und wenn es regnet, wandert das Camp in die Halle statt auszufallen."
        action={
          <Link href="/tk/kontakt?anliegen=camp" className="tk-btn tk-btn--ghost">
            Frage zum Camp
          </Link>
        }
      />

      {/* Versprechen */}
      <section className="tk-section--tight">
        <div className="tk-shell grid gap-6 sm:grid-cols-3">
          {[
            { v: '4:1', l: 'Kinder pro Trainer', h: 'in den Camp-Gruppen' },
            { v: '100 %', l: 'Schlechtwetter-Garantie', h: 'Halle statt Absage' },
            { v: '8–16', l: 'Uhr Betreuung', h: 'inklusive Mittagessen' },
          ].map((k) => (
            <Card key={k.l} className="p-6">
              <Kpi value={k.v} label={k.l} hint={k.h} />
            </Card>
          ))}
        </div>
      </section>

      {/* Camps */}
      <section className="tk-section">
        <div className="tk-shell">
          <h2 className="tk-h2">Ferien-Camps</h2>
          <p className="tk-lede mt-2">
            Wochenweise buchbar, Geschwisterrabatt inklusive. Die Gruppen werden nach Alter und
            Spielstärke eingeteilt, nicht nur nach Jahrgang.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {CAMPS.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06}>
                <CourseCard course={c} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Tagesablauf */}
      <section className="tk-section tk-section--wash">
        <div className="tk-shell grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="tk-h2">So läuft ein Camptag</h2>
            <p className="tk-lede mt-2">
              Kein Programm, das um neun beginnt und um neun schon anstrengend ist. Der Tag hat
              Pausen, und er hat ein Ende, an dem alle noch reden können.
            </p>
          </div>
          <ol className="flex flex-col">
            {[
              ['08:00', 'Frühbetreuung', 'Ankommen, Bälle sortieren, aufwärmen — für alle, die früher gebracht werden.'],
              ['09:00', 'Technikblock', 'In Gruppen von vier bis sechs. Ein Schlag pro Tag im Mittelpunkt.'],
              ['11:00', 'Spielformen', 'Kleine Turniere, Punktspiele, Aufschlag-Wettbewerbe.'],
              ['12:30', 'Mittagessen', 'Warm, gemeinsam, auf der Terrasse. Bei Regen drinnen.'],
              ['13:30', 'Raus in den Wald', 'Bewegungsspiele im Perlacher Forst, Fangen, Staffeln.'],
              ['15:00', 'Match des Tages', 'Jeder spielt, jeder wird angefeuert. Ergebnis: egal.'],
              ['16:00', 'Abholen', 'Kurze Rückmeldung an die Eltern, wenn gewünscht.'],
            ].map(([time, title, text], i, arr) => (
              <li key={time} className="relative flex gap-5 pb-6 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="tk-num mt-1 text-[0.82rem] font-semibold text-[var(--tk-clay)]">
                    {time}
                  </span>
                  {i < arr.length - 1 ? (
                    <span aria-hidden className="mt-2 w-px flex-1 bg-[var(--tk-line-hard)]" />
                  ) : null}
                </div>
                <div className="pb-1">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Erwachsenenkurse */}
      <section className="tk-section">
        <div className="tk-shell">
          <h2 className="tk-h2">Kurse für Erwachsene</h2>
          <p className="tk-lede mt-2">
            Für Wiedereinsteiger und alle, die an einer Sache konzentriert arbeiten wollen.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {ADULT_COURSES.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.06}>
                <CourseCard course={c} />
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <DemoNote>
              Alle Camps, Kurse, Termine und Preise auf dieser Seite sind erfunden. Sie zeigen,
              wie ein Kursangebot mit Restplätzen, Warteliste und Direktbuchung funktioniert.
            </DemoNote>
          </div>
        </div>
      </section>
    </>
  );
}
