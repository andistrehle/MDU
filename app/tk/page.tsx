// ============================================================
// Tennis Kail — Startseite
// ============================================================
//
// Reihenfolge nach Absicht, nicht nach Hierarchie des Unternehmens:
//   1. Kann ich heute spielen? (Hero mit Live-Karte)
//   2. Wo? (die zwei Anlagen)
//   3. Mit wem? (Trainerteam)
//   4. Was noch? (Kinder, Camps, Events)
//   5. Wie komme ich hin? (Kontaktstreifen)
//
// Alles bis auf den Hero ist eine eigene Datei-Sektion, damit die
// Startseite lesbar bleibt und Abschnitte anderswo wiederverwendbar sind.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Hero } from '@/components/tk/home/hero';
import { TkImage } from '@/components/tk/media/tk-image';
import { Card, Chip, SectionHead, Eyebrow } from '@/components/tk/ui/primitives';
import { Reveal, Stagger, StaggerItem, CountUp } from '@/components/tk/motion/reveal';
import { BRAND, COURTS, LOCATIONS, courtsOf, hoursSummary } from '@/data/tk/facility';
import { COACHES } from '@/data/tk/coaches';
import { CAMPS, KIDS_COURSES, seatsLeft } from '@/data/tk/courses';
import { EVENTS } from '@/data/tk/events';
import { formatPriceShort, formatRange, today, nowMinutes } from '@/lib/tk/format';
import { facilityJsonLd } from '@/lib/tk/seo';

export const metadata: Metadata = {
  title: 'Tennis Kail — Halle und Sandplätze in München',
  description:
    'Platz oder Trainerstunde online buchen, Platzstatus nach Wetter, Camps und Events — ' +
    'Tennis Kail in Harlaching und Neuperlach.',
};

/** Belegung und Wetter hängen an der Uhrzeit — alle 15 Minuten neu bauen. */
export const revalidate = 900;

export default function TkHomePage() {
  const todayIso = today();
  const nowMinute = nowMinutes();

  return (
    <>
      <script
        type="application/ld+json"
        // Strukturierte Daten für Suchmaschinen; Inhalt ist statisch, kein Nutzereingabe-Risiko.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(facilityJsonLd()) }}
      />

      <Hero todayIso={todayIso} nowMinute={nowMinute} />

      {/* ---- Was die Plattform kann ---------------------------------- */}
      <section className="tk-section tk-section--wash">
        <div className="tk-shell">
          <SectionHead
            eyebrow="Warum online"
            title="Der Anruf um acht Uhr abends entfällt"
            lede="Bisher läuft die Platzvergabe über das Telefon. Diese Demo zeigt, wie derselbe Betrieb aussieht, wenn Gäste selbst sehen, was frei ist — und der Betrieb sieht, was gebucht wurde."
          />

          <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Sofort sehen, was frei ist',
                body: `Ein Raster über alle ${COURTS.length} Plätze, beide Anlagen, sieben Tage im Voraus. Freie Felder antippen, fertig — auch mit dem Daumen an der Bushaltestelle.`,
                href: '/tk/buchen',
                cta: 'Buchungsraster ansehen',
              },
              {
                title: 'Wetter entscheidet mit',
                body: 'Regnet es, sperrt sich der Sandplatz von selbst und schlägt die Halle zur selben Zeit vor. Wer schon gebucht hat, bekommt eine Nachricht statt einer Überraschung.',
                href: '/tk/platzstatus',
                cta: 'Platzstatus ansehen',
              },
              {
                title: 'Der Betrieb behält den Überblick',
                body: 'Auslastung, Umsatz, Sperren und Kurse an einer Stelle. Kein zweites System, keine Excel-Liste am Tresen.',
                href: '/tk/dashboard',
                cta: 'Dashboard ansehen',
              },
            ].map((f) => (
              <StaggerItem key={f.title}>
                <Card className="flex h-full flex-col gap-3 p-6" interactive>
                  <h3 className="tk-h3">{f.title}</h3>
                  <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">{f.body}</p>
                  <Link
                    href={f.href}
                    className="mt-auto pt-2 text-[0.88rem] font-semibold text-[var(--tk-clay)] underline-offset-4 hover:underline"
                  >
                    {f.cta} →
                  </Link>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---- Die zwei Anlagen ---------------------------------------- */}
      <section className="tk-section">
        <div className="tk-shell">
          <SectionHead
            eyebrow="Zwei Standorte"
            title="Harlaching und Neuperlach"
            lede="Beide Anlagen gehören zusammen, gebucht wird an einer Stelle. Wer in Harlaching keinen Platz bekommt, sieht sofort, was in Neuperlach frei ist."
            action={
              <Link href="/tk/anlage" className="tk-btn tk-btn--ghost">
                Alle Plätze im Detail
              </Link>
            }
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {LOCATIONS.map((loc, i) => {
              const courts = courtsOf(loc.id);
              const halls = courts.filter((c) => c.kind === 'halle').length;
              const outdoor = courts.length - halls;
              return (
                <Reveal key={loc.id} delay={i * 0.08}>
                  <Card className="flex h-full flex-col overflow-hidden" interactive as="article">
                    <TkImage slot={loc.imageSlot} ratio="16 / 9" rounded={false} sizes="(max-width: 1024px) 100vw, 50vw" />
                    <div className="flex flex-1 flex-col gap-4 p-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <Chip tone="clay">{outdoor} Sandplätze</Chip>
                        <Chip>{halls} in der Halle</Chip>
                        {loc.provenance === 'belegt' ? <Chip tone="outline">belegte Angabe</Chip> : null}
                      </div>
                      <div>
                        <h3 className="tk-h3">{loc.name}</h3>
                        <p className="mt-1 text-[0.88rem] text-[var(--tk-ink-dim)]">
                          {loc.street} · {loc.district}
                        </p>
                      </div>
                      <p className="text-[0.94rem] text-[var(--tk-ink-soft)]">{loc.blurb}</p>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 text-[0.86rem] text-[var(--tk-ink-soft)]">
                        {hoursSummary(loc).map((row) => (
                          <div key={row.days} className="contents">
                            <dt className="font-semibold">{row.days}</dt>
                            <dd className="tk-num">{row.time}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-auto flex flex-wrap gap-2 pt-2">
                        <Link href={`/tk/buchen?standort=${loc.id}`} className="tk-btn tk-btn--sm">
                          Platz hier buchen
                        </Link>
                        <Link href={`/tk/anlage#${loc.id}`} className="tk-btn tk-btn--ghost tk-btn--sm">
                          Anlage ansehen
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Zahlen -------------------------------------------------- */}
      <section className="tk-section--dark py-14">
        <div className="tk-shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { to: COURTS.length, label: 'Plätze in Harlaching und Neuperlach', suffix: '' },
            { to: 50, label: 'Jahre Familienbetrieb', suffix: '+' },
            { to: 3, label: 'Trainerinnen und Trainer', suffix: '' },
            { to: 7, label: 'Tage im Voraus buchbar', suffix: '' },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-[var(--tk-font-display)] text-[2.6rem] font-semibold leading-none text-[var(--tk-on-dark)]">
                <CountUp to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-[0.85rem] text-[var(--tk-on-dark-dim)]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Trainerteam --------------------------------------------- */}
      <section className="tk-section">
        <div className="tk-shell">
          <SectionHead
            eyebrow="Training"
            title="Drei Menschen, drei Handschriften"
            lede="Einzeln, zu zweit oder in der Gruppe — die Trainerstunde lässt sich zusammen mit dem passenden Platz in einem Zug buchen."
            action={
              <Link href="/tk/trainer" className="tk-btn tk-btn--ghost">
                Alle Profile
              </Link>
            }
          />

          <Stagger className="tk-rail mt-10" tabIndex={0} role="region" ariaLabel="Trainerteam, waagerecht scrollbar">
            {COACHES.map((coach) => (
              <StaggerItem key={coach.id}>
                <Card className="flex h-full flex-col overflow-hidden" interactive as="article">
                  <TkImage slot={coach.imageSlot} ratio="5 / 4" rounded={false} sizes="(max-width: 768px) 80vw, 33vw" />
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div>
                      <h3 className="text-[1.05rem] font-semibold">{coach.name}</h3>
                      <p className="text-[0.84rem] text-[var(--tk-ink-dim)]">{coach.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {coach.focus.slice(0, 3).map((f) => (
                        <Chip key={f} tone="outline">
                          {f}
                        </Chip>
                      ))}
                    </div>
                    <p className="text-[0.88rem] text-[var(--tk-ink-soft)]">
                      {coach.bio.split('.')[0]}.
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                      <span className="text-[0.86rem] text-[var(--tk-ink-dim)]">
                        ab{' '}
                        <strong className="tk-num text-[var(--tk-ink)]">
                          {formatPriceShort(coach.duoCents)}
                        </strong>{' '}
                        p. P.
                      </span>
                      <Link href={`/tk/training?trainer=${coach.id}`} className="tk-btn tk-btn--sm">
                        Termin
                      </Link>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---- Kinder und Camps ---------------------------------------- */}
      <section className="tk-section tk-section--clay">
        <div className="tk-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal>
            <div className="flex flex-col gap-5">
              <Eyebrow>Kinder, Jugend, Ferien</Eyebrow>
              <h2 className="tk-h2">Bei den Kleinen fängt es an</h2>
              <p className="tk-lede">
                Roter Ball auf dem Kleinfeld, oranger auf dem Dreiviertelfeld, gelber auf dem
                Großfeld. Dazu Ferien-Camps, die bei Regen einfach in die Halle wandern statt
                auszufallen.
              </p>
              <ul className="flex flex-col gap-2 text-[0.94rem] text-[var(--tk-ink-soft)]">
                {KIDS_COURSES.map((c) => (
                  <li key={c.id} className="flex items-baseline justify-between gap-4 border-b border-[var(--tk-line)] pb-2">
                    <span>
                      <strong className="font-semibold text-[var(--tk-ink)]">{c.title}</strong>{' '}
                      <span className="text-[0.86rem]">
                        · {c.ageFrom}–{c.ageTo} Jahre
                      </span>
                    </span>
                    <span className="flex-none text-[0.84rem]">
                      {seatsLeft(c) > 0 ? (
                        <span className="text-[var(--tk-free)]">{seatsLeft(c)} Plätze frei</span>
                      ) : (
                        <span className="text-[var(--tk-ink-dim)]">Warteliste</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link href="/tk/kids" className="tk-btn">
                  Kinder- und Jugendtraining
                </Link>
                <Link href="/tk/camps" className="tk-btn tk-btn--ghost">
                  Alle Camps
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {CAMPS.slice(0, 2).map((camp) => (
                <Card key={camp.id} className="flex flex-col overflow-hidden" interactive as="article">
                  <TkImage slot={camp.imageSlot} ratio="4 / 3" rounded={false} sizes="(max-width: 768px) 90vw, 30vw" />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <Chip tone="clay">{formatRange(camp.startDate, camp.endDate)}</Chip>
                    <h3 className="text-[1rem] font-semibold">{camp.title}</h3>
                    <p className="text-[0.86rem] text-[var(--tk-ink-soft)]">{camp.teaser}</p>
                    <p className="mt-auto pt-2 text-[0.86rem]">
                      <strong className="tk-num">{formatPriceShort(camp.priceCents)}</strong>{' '}
                      <span className="text-[var(--tk-ink-dim)]">· {seatsLeft(camp)} von {camp.seats} frei</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Events -------------------------------------------------- */}
      <section className="tk-section">
        <div className="tk-shell">
          <SectionHead
            eyebrow="Auf der Anlage los"
            title="Termine der nächsten Wochen"
            lede="Turniere, Clubabende, Sommerfest — alles, wofür man nicht zwingend einen Platz buchen muss."
            action={
              <Link href="/tk/events" className="tk-btn tk-btn--ghost">
                Alle Termine
              </Link>
            }
          />
          <Stagger className="tk-rail mt-10" tabIndex={0} role="region" ariaLabel="Termine, waagerecht scrollbar">
            {EVENTS.slice(0, 4).map((ev) => (
              <StaggerItem key={ev.id}>
                <Card className="flex h-full flex-col overflow-hidden" interactive as="article">
                  <TkImage slot={ev.imageSlot} ratio="16 / 10" rounded={false} sizes="(max-width: 768px) 80vw, 25vw" />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <span className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-[var(--tk-clay)]">
                      {formatRange(ev.startDate, ev.endDate)}
                    </span>
                    <h3 className="text-[1.02rem] font-semibold">{ev.title}</h3>
                    <p className="text-[0.86rem] text-[var(--tk-ink-soft)]">{ev.teaser}</p>
                    <p className="mt-auto pt-2 text-[0.82rem] text-[var(--tk-ink-dim)]">{ev.time}</p>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ---- Kontaktstreifen ----------------------------------------- */}
      <section className="tk-section--dark py-14">
        <div className="tk-shell grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col gap-3">
            <Eyebrow dark>Kurz und direkt</Eyebrow>
            <h2 className="tk-h2">Lieber doch anrufen? Geht weiterhin.</h2>
            <p className="tk-lede">
              Die Buchung online ersetzt das Telefon nicht — sie entlastet es. Wer lieber
              spricht, erreicht die Anlage zu den Öffnungszeiten wie immer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={`tel:${BRAND.phoneHref}`} className="tk-btn tk-btn--onDark tk-btn--lg">
              {BRAND.phone}
            </a>
            <Link href="/tk/kontakt" className="tk-btn tk-btn--onDarkGhost tk-btn--lg">
              Anfahrt und Kontakt
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
