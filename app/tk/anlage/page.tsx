// ============================================================
// Tennis Kail — Anlage und Plätze
// ============================================================
//
// UX-Gedanke: Wer diese Seite aufruft, vergleicht. Deshalb steht jeder
// Platz als eigene Zeile mit Belag, Flutlicht, Status und direktem
// Buchungslink — statt eines Fließtexts, in dem man die Anzahl der Plätze
// suchen muss.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/tk/ui/page-header';
import { Card, Chip, DemoNote } from '@/components/tk/ui/primitives';
import { TkImage } from '@/components/tk/media/tk-image';
import { Reveal } from '@/components/tk/motion/reveal';
import { COURTS, LOCATIONS, SURFACE_LABEL, courtsOf, hoursSummary } from '@/data/tk/facility';
import { today } from '@/lib/tk/format';
import { courtStatusFor, weatherForDay } from '@/lib/tk/weather';

export const metadata: Metadata = {
  title: 'Anlage und Plätze',
  description:
    'Neunzehn Plätze an zwei Standorten: Halle in Harlaching und Neuperlach, Sandplätze am ' +
    'Perlacher Forst. Belag, Flutlicht und Öffnungszeiten im Überblick.',
};

export const revalidate = 900;

export default function AnlagePage() {
  const todayIso = today();
  const weather = weatherForDay(todayIso);

  return (
    <>
      <PageHeader
        eyebrow="Die Anlage"
        title={`${COURTS.length} Plätze am Rand des Waldes`}
        lede="Zwei Standorte, zehn Gehminuten Bahnfahrt auseinander. Halle das ganze Jahr, Sand von April bis Oktober."
        action={
          <Link href="/tk/buchen" className="tk-btn">
            Freie Zeiten ansehen
          </Link>
        }
      />

      {LOCATIONS.map((loc, idx) => {
        const courts = courtsOf(loc.id);
        return (
          <section key={loc.id} id={loc.id} className="tk-section scroll-mt-24">
            <div className="tk-shell grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
              <Reveal>
                <TkImage
                  slot={loc.imageSlot}
                  ratio="4 / 3"
                  priority={idx === 0}
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <div className="mt-6 flex flex-col gap-4">
                  <h2 className="tk-h2">{loc.name}</h2>
                  <p className="tk-lede">{loc.blurb}</p>
                  <address className="not-italic text-[0.95rem] text-[var(--tk-ink-soft)]">
                    {loc.street}
                    <br />
                    {loc.zip} {loc.city} · {loc.district}
                  </address>
                  <div>
                    <h3 className="tk-label mb-1">Betrieb</h3>
                    <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{loc.operator}</p>
                  </div>
                  <div>
                    <h3 className="tk-label mb-1">Öffnungszeiten</h3>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-0.5 text-[0.9rem] text-[var(--tk-ink-soft)]">
                      {hoursSummary(loc).map((r) => (
                        <div key={r.days} className="contents">
                          <dt className="font-semibold">{r.days}</dt>
                          <dd className="tk-num">{r.time}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div>
                    <h3 className="tk-label mb-1">Anfahrt</h3>
                    <ul className="flex flex-col gap-1 text-[0.9rem] text-[var(--tk-ink-soft)]">
                      {loc.arrival.map((a) => (
                        <li key={a} className="flex gap-2">
                          <span aria-hidden className="text-[var(--tk-clay)]">
                            ·
                          </span>
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--tk-line-soft)] px-5 py-4">
                    <h3 className="tk-h3">{courts.length} Plätze</h3>
                    <span className="text-[0.8rem] text-[var(--tk-ink-dim)]">Status heute</span>
                  </div>
                  <ul className="divide-y divide-[var(--tk-line-soft)]">
                    {courts.map((court) => {
                      const status = courtStatusFor(court, todayIso, weather);
                      return (
                        <li key={court.id} className="flex items-center gap-4 px-5 py-3.5">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{court.name}</p>
                            <p className="text-[0.8rem] text-[var(--tk-ink-dim)]">
                              {SURFACE_LABEL[court.surface]}
                              {court.kind === 'halle' ? ' · Halle' : ' · draußen'}
                              {court.floodlight ? ' · Flutlicht' : ''}
                              {court.heated ? ' · beheizt' : ''}
                            </p>
                            {court.note ? (
                              <p className="mt-0.5 text-[0.8rem] text-[var(--tk-ink-dim)]">{court.note}</p>
                            ) : null}
                          </div>
                          <Chip
                            tone={
                              status.condition === 'bespielbar'
                                ? 'free'
                                : status.condition === 'feucht'
                                  ? 'warn'
                                  : status.condition === 'gesperrt'
                                    ? 'blocked'
                                    : 'neutral'
                            }
                          >
                            {status.headline}
                          </Chip>
                          <Link
                            href={`/tk/buchen?standort=${loc.id}&platz=${court.id}`}
                            className="tk-btn tk-btn--ghost tk-btn--sm hidden sm:inline-flex"
                          >
                            Zeiten
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="border-t border-[var(--tk-line-soft)] bg-[var(--tk-chalk)] px-5 py-4">
                    <Link href={`/tk/buchen?standort=${loc.id}`} className="tk-btn tk-btn--block">
                      Raster für {loc.shortName} öffnen
                    </Link>
                  </div>
                </Card>

                {courts.some((c) => c.provenance === 'demo') ? (
                  <div className="mt-4">
                    <DemoNote>
                      Für {loc.shortName} ist die Aufteilung der Plätze eine Annahme für die
                      Demo — die tatsächliche Anzahl und der Belag müssen vom Betrieb bestätigt
                      werden. Was belegt ist und was nicht, steht auf der Seite{' '}
                      <Link href="/tk/datenherkunft" className="underline">
                        Datenherkunft
                      </Link>
                      .
                    </DemoNote>
                  </div>
                ) : null}
              </Reveal>
            </div>
          </section>
        );
      })}

      {/* Ausstattung */}
      <section className="tk-section tk-section--wash">
        <div className="tk-shell">
          <h2 className="tk-h2">Drumherum</h2>
          <div className="tk-rail mt-8" tabIndex={0} role="region" aria-label="Ausstattung, waagerecht scrollbar">
            {[
              { t: 'Pro-Shop mit Bespannung', b: 'Saiten, Bälle, Griffbänder — und ein Schläger, der über Nacht fertig wird.', href: '/tk/shop' },
              { t: 'Umkleiden und Duschen', b: 'An beiden Anlagen, ganzjährig geöffnet.', href: undefined },
              { t: 'Kiosk und Terrasse', b: 'Getränke, Kaffee, Blick auf die Plätze.', href: undefined },
              { t: 'Parkplätze direkt vor Ort', b: 'An beiden Standorten, ohne Parkschein.', href: '/tk/kontakt' },
            ].map((x) => (
              <Card key={x.t} className="flex flex-col gap-2 p-5">
                <h3 className="text-[1rem] font-semibold">{x.t}</h3>
                <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{x.b}</p>
                {x.href ? (
                  <Link
                    href={x.href}
                    className="mt-auto pt-2 text-[0.86rem] font-semibold text-[var(--tk-clay)] underline-offset-4 hover:underline"
                  >
                    Mehr →
                  </Link>
                ) : null}
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <DemoNote>
              Ausstattungspunkte sind für die Demo gesetzt und mit dem Betrieb abzugleichen.
            </DemoNote>
          </div>
        </div>
      </section>
    </>
  );
}
