import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, Chip, DemoNote } from '@/components/tk/ui/primitives';
import { TkImage } from '@/components/tk/media/tk-image';
import { Reveal } from '@/components/tk/motion/reveal';
import { COACHES } from '@/data/tk/coaches';
import { getLocation, WEEKDAY_SHORT } from '@/data/tk/facility';
import { formatPrice, formatTime } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Trainerteam',
  description:
    'Das Trainerteam von Tennis Kail: Schwerpunkte, Sprachen, Lizenzen und Preise — ' +
    'mit direkter Terminbuchung.',
};

export default function TrainerPage() {
  return (
    <>
      <PageHeader
        eyebrow="Training"
        title="Wer hier trainiert"
        lede="Drei Handschriften, ein Anspruch: Es soll besser werden, nicht komplizierter. Alle Stunden sind auch ohne Mitgliedschaft buchbar."
        action={
          <Link href="/tk/training" className="tk-btn">
            Termin finden
          </Link>
        }
      />

      <section className="tk-section">
        <div className="tk-shell flex flex-col gap-8">
          {COACHES.map((coach, i) => (
            <Reveal key={coach.id} delay={i * 0.06}>
              <Card className="grid overflow-hidden md:grid-cols-[300px_1fr]" as="article">
                <TkImage
                  slot={coach.imageSlot}
                  ratio="4 / 3"
                  rounded={false}
                  className="md:h-full"
                  sizes="(max-width: 768px) 100vw, 300px"
                />
                <div className="flex flex-col gap-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="tk-h3">{coach.name}</h2>
                      <p className="text-[0.88rem] text-[var(--tk-ink-dim)]">{coach.role}</p>
                    </div>
                    <Chip tone={coach.provenance === 'belegt' ? 'outline' : 'warn'}>
                      {coach.provenance === 'belegt' ? 'belegte Person' : 'Demo-Person'}
                    </Chip>
                  </div>

                  <p className="text-[0.96rem] text-[var(--tk-ink-soft)]">{coach.bio}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {coach.focus.map((f) => (
                      <Chip key={f} tone="clay">
                        {f}
                      </Chip>
                    ))}
                  </div>

                  <dl className="grid gap-x-8 gap-y-2 text-[0.9rem] sm:grid-cols-2">
                    <div>
                      <dt className="tk-label">Lizenzen</dt>
                      <dd className="text-[var(--tk-ink-soft)]">{coach.licences.join(', ')}</dd>
                    </div>
                    <div>
                      <dt className="tk-label">Sprachen</dt>
                      <dd className="text-[var(--tk-ink-soft)]">{coach.languages.join(', ')}</dd>
                    </div>
                    <div>
                      <dt className="tk-label">Trainiert an</dt>
                      <dd className="text-[var(--tk-ink-soft)]">
                        {coach.locationIds.map((id) => getLocation(id)?.shortName).join(' und ')}
                      </dd>
                    </div>
                    <div>
                      <dt className="tk-label">Regelmäßig da</dt>
                      <dd className="text-[var(--tk-ink-soft)]">
                        {coach.availability
                          .map((a) => `${WEEKDAY_SHORT[a.weekday]} ${formatTime(a.from)}–${formatTime(a.to)}`)
                          .join(' · ')}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex flex-wrap items-center gap-4 border-t border-[var(--tk-line-soft)] pt-4">
                    <div className="text-[0.9rem]">
                      <span className="text-[var(--tk-ink-dim)]">Einzelstunde </span>
                      <strong className="tk-num">{formatPrice(coach.singleCents)}</strong>
                      <span className="text-[var(--tk-ink-dim)]"> · zu zweit </span>
                      <strong className="tk-num">{formatPrice(coach.duoCents)}</strong>
                      <span className="text-[var(--tk-ink-dim)]"> p. P.</span>
                    </div>
                    <Link href={`/tk/training?trainer=${coach.id}`} className="tk-btn tk-btn--sm ml-auto">
                      Termin bei {coach.name.split(' ')[0]}
                    </Link>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}

          <DemoNote>
            Niklas Persson und Ekkehard Dietrich sind über die Vereinsseite als Trainer belegt.
            Kurzprofile, Preise und Verfügbarkeiten sind für die Demo gesetzt; Mara Höfer ist eine
            erfundene Person, damit die Buchung mit mehreren Kalendern vorführbar ist.
          </DemoNote>
        </div>
      </section>
    </>
  );
}
