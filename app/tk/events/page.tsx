import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, Chip, DemoNote, Meter } from '@/components/tk/ui/primitives';
import { TkImage } from '@/components/tk/media/tk-image';
import { Reveal } from '@/components/tk/motion/reveal';
import { EVENTS } from '@/data/tk/events';
import { getLocation } from '@/data/tk/facility';
import { formatPrice, formatRange } from '@/lib/tk/format';

export const metadata: Metadata = {
  title: 'Events und Termine',
  description:
    'Sommerfest, Flutlicht-Doppel, Turniere und Familientag — was auf der Anlage von ' +
    'Tennis Kail sonst noch läuft.',
};

const CATEGORY_LABEL: Record<string, string> = {
  turnier: 'Turnier',
  clubabend: 'Clubabend',
  saison: 'Saison',
  familie: 'Für alle',
};

export default function EventsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Auf der Anlage"
        title="Termine, für die es keinen Platz braucht"
        lede="Nicht alles hier ist Buchung. Manches ist einfach: hinkommen, mitmachen, danach sitzen bleiben."
        tone="dark"
        action={
          <Link href="/tk/turniere" className="tk-btn tk-btn--onDark">
            Turnierverwaltung ansehen
          </Link>
        }
      />

      <section className="tk-section">
        <div className="tk-shell flex flex-col gap-6">
          {EVENTS.map((ev, i) => {
            const loc = getLocation(ev.locationId);
            const seatsLeft = ev.seats != null && ev.seatsTaken != null ? ev.seats - ev.seatsTaken : null;
            return (
              <Reveal key={ev.id} delay={i * 0.05}>
                <Card className="grid overflow-hidden md:grid-cols-[280px_1fr]" as="article">
                  <TkImage
                    slot={ev.imageSlot}
                    ratio="4 / 3"
                    rounded={false}
                    className="md:h-full"
                    sizes="(max-width: 768px) 100vw, 280px"
                  />
                  <div className="flex flex-col gap-3 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip tone="clay">{formatRange(ev.startDate, ev.endDate)}</Chip>
                      <Chip tone="outline">{CATEGORY_LABEL[ev.category]}</Chip>
                      <span className="text-[0.84rem] text-[var(--tk-ink-dim)]">
                        {ev.time} · {loc?.shortName}
                      </span>
                    </div>

                    <h2 className="tk-h3">{ev.title}</h2>
                    <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">{ev.description}</p>

                    {seatsLeft != null ? (
                      <div className="max-w-[320px]">
                        <div className="mb-1.5 flex justify-between text-[0.82rem]">
                          <span className={seatsLeft > 0 ? 'text-[var(--tk-free)]' : 'text-[var(--tk-ink-dim)]'}>
                            {seatsLeft > 0 ? `${seatsLeft} Plätze frei` : 'Voll'}
                          </span>
                          <span className="text-[var(--tk-ink-dim)]">
                            {ev.seatsTaken} von {ev.seats} gemeldet
                          </span>
                        </div>
                        <Meter value={((ev.seatsTaken ?? 0) / (ev.seats ?? 1)) * 100} />
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                      <span className="text-[0.92rem]">
                        {ev.priceCents == null
                          ? 'Ohne Anmeldung'
                          : ev.priceCents === 0
                            ? 'Eintritt frei'
                            : `Beitrag ${formatPrice(ev.priceCents)}`}
                      </span>
                      {ev.category === 'turnier' ? (
                        <Link href="/tk/turniere" className="tk-btn tk-btn--sm ml-auto">
                          Zum Turnier
                        </Link>
                      ) : (
                        <Link
                          href={`/tk/kontakt?anliegen=${encodeURIComponent(ev.title)}`}
                          className="tk-btn tk-btn--ghost tk-btn--sm ml-auto"
                        >
                          Anmelden
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}

          <DemoNote>
            Alle Termine auf dieser Seite sind erfunden. Im Echtbetrieb würden sie vom Betrieb
            im Dashboard gepflegt und erschienen hier automatisch.
          </DemoNote>
        </div>
      </section>
    </>
  );
}
