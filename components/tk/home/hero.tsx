// ============================================================
// Tennis Kail — Hero
// ============================================================
//
// UX-Gedanke: Wer auf die Seite einer Tennisanlage kommt, will fast immer
// dasselbe wissen — kann ich heute spielen, und wie komme ich an einen
// Platz. Der Hero beantwortet beides über der Falz: links die Marke in
// einem Satz, rechts der Live-Status mit direktem Weg in die Buchung.
// Deshalb steht hier kein Foto-Karussell und kein Fließtext.
//
// UI-Gedanke: dunkle Waldfläche, darauf eine Sandplatz-Textur als
// Lichtkeil. Die Textur ist gezeichnet (CSS-Verläufe), nicht geladen —
// der erste Bildschirm braucht damit kein einziges Bild.
// ============================================================

import Link from 'next/link';
import { BRAND, COURTS, LOCATIONS } from '@/data/tk/facility';
import { formatDayLong, formatTime, weekdayOf } from '@/lib/tk/format';
import { summariseStatus, weatherForDay, WEATHER_LABEL } from '@/lib/tk/weather';
import { findFreeBlocks } from '@/lib/tk/availability';
import { Chip } from '@/components/tk/ui/primitives';
import { FacilityArt } from '@/components/tk/media/facility-art';

export function Hero({ todayIso, nowMinute }: { todayIso: string; nowMinute: number }) {
  const weather = weatherForDay(todayIso);
  const outdoor = COURTS.filter((c) => c.kind === 'freiplatz');
  const status = summariseStatus(outdoor, todayIso);

  // Die drei nächsten freien Stunden heute — über beide Standorte.
  const wd = weekdayOf(todayIso);
  const openBlocks = LOCATIONS.flatMap(
    (l) => l.hours.find((h) => h.weekday === wd)?.blocks ?? [],
  );
  const next = findFreeBlocks(COURTS, todayIso, 60, {
    todayIso,
    nowMinute,
    openBlocks: openBlocks.length ? openBlocks : [{ from: 8 * 60, to: 22 * 60 }],
  })
    .filter((b) => b.from >= nowMinute)
    .slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-[var(--tk-forest)] text-[var(--tk-on-dark)]">
      {/* Hintergrund: Sandplatz als Lichtkeil hinter dem Text */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-[18%] -top-[12%] h-[125%] w-[78%] rotate-[8deg] opacity-[0.36]">
          <FacilityArt variant="aerial" tone="night" className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(100deg,var(--tk-forest)_38%,rgba(22,38,29,0.72)_62%,rgba(22,38,29,0.35))]" />
      </div>

      <div className="tk-shell relative grid gap-10 pb-14 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="tk-enter">
          <div className="flex flex-col gap-6">
            <span className="tk-eyebrow tk-eyebrow--dark">München · seit {BRAND.foundedText}</span>

            <h1 className="tk-display text-[var(--tk-on-dark)]">
              Zwei Anlagen,
              <br />
              {COURTS.length} Plätze,
              <br />
              <span className="text-[var(--tk-clay-soft)]">ein freier Termin.</span>
            </h1>

            <p className="tk-lede text-[var(--tk-on-dark-dim)]">
              Halle in Harlaching, Sand in Neuperlach — beides am Rand des Perlacher Forsts.
              Platz aussuchen, Uhrzeit antippen, spielen. Ohne Anruf, ohne Warteliste,
              ohne Vereinsmitgliedschaft.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/tk/buchen" className="tk-btn tk-btn--onDark tk-btn--lg">
                Freie Plätze ansehen
              </Link>
              <Link href="/tk/training" className="tk-btn tk-btn--onDarkGhost tk-btn--lg">
                Trainerstunde buchen
              </Link>
            </div>

            <dl className="mt-2 grid max-w-md grid-cols-3 gap-4 border-t border-[var(--tk-line-dark)] pt-6">
              {[
                { v: String(COURTS.length), l: 'Plätze insgesamt' },
                { v: String(COURTS.length - outdoor.length), l: 'davon in der Halle' },
                { v: '50+', l: 'Jahre in Betrieb' },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-[var(--tk-font-display)] text-[1.9rem] font-semibold leading-none">
                    {s.v}
                  </dt>
                  <dd className="mt-1 text-[0.78rem] text-[var(--tk-on-dark-dim)]">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Live-Karte: Wetter, Platzstatus, nächste freie Stunden */}
        <div className="tk-enter tk-enter--late">
          <div className="tk-card tk-card--dark overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--tk-line-dark)] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="tk-dot" aria-hidden />
                <span className="text-[0.82rem] font-semibold">Heute auf der Anlage</span>
              </div>
              <span className="text-[0.74rem] text-[var(--tk-on-dark-dim)]">
                {formatDayLong(todayIso).split(',')[0]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-px bg-[var(--tk-line-dark)]">
              <div className="bg-[var(--tk-forest-2)] px-5 py-4">
                <p className="text-[0.72rem] uppercase tracking-[0.12em] text-[var(--tk-moss)]">Wetter</p>
                <p className="mt-1 font-[var(--tk-font-display)] text-[1.7rem] leading-none">
                  {weather.maxC}°
                </p>
                <p className="mt-1 text-[0.8rem] text-[var(--tk-on-dark-dim)]">
                  {WEATHER_LABEL[weather.symbol]} · {weather.rainChance} % Regen
                </p>
              </div>
              <div className="bg-[var(--tk-forest-2)] px-5 py-4">
                <p className="text-[0.72rem] uppercase tracking-[0.12em] text-[var(--tk-moss)]">Freiplätze</p>
                <p className="mt-1 font-[var(--tk-font-display)] text-[1.7rem] leading-none">
                  {status.open + status.limited}/{outdoor.length}
                </p>
                <p className="mt-1 text-[0.8rem] text-[var(--tk-on-dark-dim)]">{status.headline}</p>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[var(--tk-moss)]">
                Nächste freie Stunden
              </p>
              {next.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {next.map((b) => (
                    <li key={`${b.courtId}-${b.from}`}>
                      <Link
                        href={`/tk/buchen?datum=${todayIso}&platz=${b.courtId}&von=${b.from}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-[rgba(244,241,233,0.06)] px-3.5 py-3 transition-colors hover:bg-[rgba(244,241,233,0.11)]"
                      >
                        <span className="flex items-center gap-3">
                          <span className="tk-num text-[0.95rem] font-semibold">
                            {formatTime(b.from)}
                          </span>
                          <span className="text-[0.85rem] text-[var(--tk-on-dark-dim)]">
                            {b.courtName} · {b.locationId === 'harlaching' ? 'Harlaching' : 'Neuperlach'}
                          </span>
                        </span>
                        <Chip tone="dark">{b.kind === 'halle' ? 'Halle' : 'Sand'}</Chip>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[0.88rem] text-[var(--tk-on-dark-dim)]">
                  Heute ist alles vergeben. Morgen sieht es wieder besser aus —{' '}
                  <Link href="/tk/buchen" className="underline underline-offset-2">
                    Raster ansehen
                  </Link>
                  .
                </p>
              )}
            </div>

            <p className="border-t border-[var(--tk-line-dark)] px-5 py-3 text-[0.72rem] text-[var(--tk-moss)]">
              Wetter und Belegung sind in dieser Demo simuliert, nicht live.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
