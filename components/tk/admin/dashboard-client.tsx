'use client';

// ============================================================
// Tennis Kail — Betreiber-Dashboard
// ============================================================
//
// UX-Konzept
// ----------
// Das Dashboard ist kein Kontrollzentrum, sondern ein Tresen. Wer es
// aufmacht, will drei Dinge in fünf Sekunden sehen: Was ist heute
// gebucht, was bringt das, und wo klemmt es. Deshalb steht die
// Tagesbelegung ganz oben — nicht die Jahresstatistik.
//
// Alles ist auch auf dem Telefon bedienbar, weil ein Platzwart selten am
// Schreibtisch sitzt. Die Belegungstabelle scrollt waagerecht, Aktionen
// liegen als große Flächen darunter statt in einem Kontextmenü.
//
// Produktivversion
// ----------------
// Die Kennzahlen kommen hier aus derselben deterministischen Belegung wie
// das öffentliche Raster — das hält Kundensicht und Betreibersicht
// zwangsläufig konsistent. Später ersetzt eine Aggregation über die
// Tabelle `bookings` diese Funktionen, die Bausteine bleiben gleich.
// ============================================================

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { COURTS, LOCATIONS, SURFACE_LABEL, getLocation } from '@/data/tk/facility';
import { COURSES, seatsLeft } from '@/data/tk/courses';
import { EVENTS } from '@/data/tk/events';
import {
  GRID_FROM, GRID_TO, SLOT_MINUTES, buildSlots, revenueOfDay, utilisation,
} from '@/lib/tk/availability';
import { addDays, formatDayShort, formatPrice, formatTime, weekdayOf } from '@/lib/tk/format';
import { courtStatusFor, forecast, weatherForDay, WEATHER_LABEL } from '@/lib/tk/weather';
import { Button, Card, Chip, Kpi, Meter } from '@/components/tk/ui/primitives';
import { Segment, Sheet } from '@/components/tk/ui/overlay';
import { CountUp } from '@/components/tk/motion/reveal';
import { cn } from '@/lib/utils';

type View = 'heute' | 'auslastung' | 'kurse' | 'sperren';

export function DashboardClient({ todayIso, nowMinute }: { todayIso: string; nowMinute: number }) {
  const [view, setView] = useState<View>('heute');
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [dayOffset, setDayOffset] = useState(0);
  const [blockSheet, setBlockSheet] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<string[]>([]);

  const date = addDays(todayIso, dayOffset);
  const location = getLocation(locationId)!;
  // Eigene Memoisierung: Ein frisch erzeugtes Array bei jedem Rendern würde
  // sämtliche useMemo-Abhängigkeiten darunter wertlos machen.
  const openBlocks = useMemo(
    () =>
      getLocation(locationId)?.hours.find((h) => h.weekday === weekdayOf(date))?.blocks ?? [],
    [locationId, date],
  );
  const weather = weatherForDay(date);

  const courts = useMemo(() => COURTS.filter((c) => c.locationId === locationId), [locationId]);

  const slotsByCourt = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildSlots>>();
    for (const c of courts) {
      map.set(c.id, buildSlots(c, date, { todayIso, nowMinute, openBlocks, withLabels: true }));
    }
    return map;
  }, [courts, date, todayIso, nowMinute, openBlocks]);

  const times = useMemo(() => {
    const out: number[] = [];
    for (let m = GRID_FROM; m < GRID_TO; m += SLOT_MINUTES) out.push(m);
    return out;
  }, []);

  // ---- Kennzahlen -------------------------------------------------------
  const revenueToday = useMemo(
    () => revenueOfDay(date, { todayIso, nowMinute, openBlocks }, courts),
    [date, todayIso, nowMinute, openBlocks, courts],
  );

  const bookingsToday = useMemo(() => {
    let n = 0;
    for (const c of courts) {
      for (const s of slotsByCourt.get(c.id) ?? []) if (s.booked) n++;
    }
    // Zwei Halbstunden-Felder sind in der Regel eine Buchung.
    return Math.round(n / 2);
  }, [courts, slotsByCourt]);

  const avgUtil = useMemo(() => {
    const values = courts.map((c) => utilisation(slotsByCourt.get(c.id) ?? []));
    return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  }, [courts, slotsByCourt]);

  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(todayIso, i);
        const wd = weekdayOf(d);
        const blocks = location.hours.find((h) => h.weekday === wd)?.blocks ?? [];
        const opts = { todayIso, nowMinute, openBlocks: blocks };
        const utils = courts.map((c) => utilisation(buildSlots(c, d, opts)));
        return {
          date: d,
          util: utils.length ? Math.round(utils.reduce((a, b) => a + b, 0) / utils.length) : 0,
          revenue: revenueOfDay(d, opts, courts),
        };
      }),
    [todayIso, nowMinute, location, courts],
  );

  const weekRevenue = week.reduce((s, d) => s + d.revenue, 0);
  const forecastDays = forecast(todayIso, 7);
  const openWaitlists = COURSES.filter((c) => seatsLeft(c) === 0).length;

  return (
    <>
      {/* Kopf */}
      <section className="tk-section--dark py-9">
        <div className="tk-shell flex flex-col gap-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="tk-eyebrow tk-eyebrow--dark">Betrieb</span>
              <h1 className="tk-display mt-3 text-[clamp(1.9rem,5.5vw,3rem)] text-[var(--tk-on-dark)]">
                Dashboard
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Segment
                label="Standort"
                value={locationId}
                onChange={setLocationId}
                options={LOCATIONS.map((l) => ({ value: l.id, label: l.shortName }))}
              />
            </div>
          </div>

          <div className="grid gap-6 border-t border-[var(--tk-line-dark)] pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { v: <CountUp to={avgUtil} suffix=" %" />, l: 'Auslastung heute', h: `${courts.length} Plätze` },
              { v: formatPrice(revenueToday), l: 'Umsatz Platzmiete heute', h: 'ohne Training und Shop' },
              { v: <CountUp to={bookingsToday} />, l: 'Buchungen heute', h: location.shortName },
              { v: formatPrice(weekRevenue), l: 'Umsatz sieben Tage', h: 'Prognose inkl. heute' },
            ].map((k, i) => (
              <div key={i}>
                <p className="font-[var(--tk-font-display)] text-[1.9rem] leading-none text-[var(--tk-on-dark)]">
                  {k.v}
                </p>
                <p className="mt-1.5 text-[0.82rem] text-[var(--tk-on-dark-dim)]">{k.l}</p>
                <p className="text-[0.74rem] text-[var(--tk-moss)]">{k.h}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Umschalter */}
      <div className="tk-shell mt-8 flex flex-wrap items-center gap-3">
        <Segment
          label="Ansicht"
          value={view}
          onChange={setView}
          options={[
            { value: 'heute', label: 'Belegung' },
            { value: 'auslastung', label: 'Auslastung' },
            { value: 'kurse', label: 'Kurse und Events' },
            { value: 'sperren', label: 'Plätze sperren' },
          ]}
        />
        {view === 'heute' ? (
          <div className="ml-auto flex items-center gap-2">
            <Button tone="ghost" size="sm" onClick={() => setDayOffset((d) => Math.max(0, d - 1))} disabled={dayOffset === 0}>
              ←
            </Button>
            <span className="min-w-[110px] text-center text-[0.88rem] font-semibold">
              {dayOffset === 0 ? 'Heute' : formatDayShort(date)}
            </span>
            <Button tone="ghost" size="sm" onClick={() => setDayOffset((d) => Math.min(6, d + 1))} disabled={dayOffset === 6}>
              →
            </Button>
          </div>
        ) : null}
      </div>

      <section className="tk-section--tight pb-16">
        <div className="tk-shell">
          {/* ---- Belegung ------------------------------------------------ */}
          {view === 'heute' ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <h2 className="tk-h3">Belegungsplan {location.shortName}</h2>
                <Chip tone={weather.rainChance > 55 ? 'warn' : 'outline'}>
                  {weather.maxC}° · {WEATHER_LABEL[weather.symbol]} · {weather.rainChance} % Regen
                </Chip>
              </div>

              <div className="tk-grid-scroll rounded-[var(--tk-radius)] border border-[var(--tk-line)] bg-[var(--tk-paper)] p-3" tabIndex={0} role="region" aria-label="Belegungsplan, waagerecht scrollbar">
                <div
                  className="tk-grid"
                  style={{ gridTemplateColumns: `104px repeat(${times.length}, 52px)` }}
                >
                  <div className="tk-court-name !min-w-[104px]" />
                  {times.map((m) => (
                    <div key={m} className="tk-grid-head">
                      {m % 60 === 0 ? formatTime(m) : ''}
                    </div>
                  ))}

                  {courts.map((court) => {
                    const slots = slotsByCourt.get(court.id) ?? [];
                    const util = utilisation(slots);
                    return (
                      <div key={court.id} className="contents">
                        <div className="tk-court-name !min-w-[104px]">
                          <span className="text-[0.86rem] font-semibold leading-tight">{court.name}</span>
                          <span className="text-[0.7rem] text-[var(--tk-ink-dim)]">
                            {util} % belegt
                          </span>
                        </div>
                        {slots.map((s) => (
                          <div
                            key={s.from}
                            className={cn(
                              'tk-slot !cursor-default !text-[0.62rem]',
                              // Im Betrieb zählt, was gebucht war — auch rückwirkend.
                              // Deshalb bleiben vergangene Buchungen als Belegung
                              // erkennbar und verschwinden nicht in der Schraffur.
                              s.state === 'vergangen' && s.booked
                                ? 'tk-slot--belegt tk-slot--past'
                                : `tk-slot--${s.state}`,
                            )}
                            title={`${court.name} ${formatTime(s.from)} — ${s.state}${s.label ? `: ${s.label}` : ''}`}
                          >
                            {s.state === 'gesperrt' ? '☂' : s.label ? s.label.slice(0, 4) : ''}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card className="flex flex-col gap-3 p-5">
                  <h3 className="tk-h3">Auslastung je Platz</h3>
                  <ul className="flex flex-col gap-2.5">
                    {courts.map((c) => {
                      const u = utilisation(slotsByCourt.get(c.id) ?? []);
                      return (
                        <li key={c.id} className="flex flex-col gap-1">
                          <div className="flex justify-between text-[0.84rem]">
                            <span>{c.name}</span>
                            <span className="tk-num font-semibold">{u} %</span>
                          </div>
                          <Meter value={u} tone={u > 80 ? 'var(--tk-blocked)' : undefined} />
                        </li>
                      );
                    })}
                  </ul>
                </Card>

                <Card className="flex flex-col gap-3 p-5">
                  <h3 className="tk-h3">Was heute auffällt</h3>
                  <ul className="flex flex-col gap-3 text-[0.9rem] text-[var(--tk-ink-soft)]">
                    {weather.rainChance > 55 ? (
                      <li>
                        <strong className="text-[var(--tk-blocked)]">Regenrisiko:</strong>{' '}
                        {weather.rainChance} % — die Sandplätze könnten kurzfristig gesperrt
                        werden. Betroffene Gäste bekämen automatisch eine Nachricht.
                      </li>
                    ) : (
                      <li>
                        <strong className="text-[var(--tk-free)]">Wetter stabil:</strong> keine
                        Sperrung zu erwarten.
                      </li>
                    )}
                    <li>
                      Die Randplätze laufen schwächer als die vorderen — ein Nachmittagstarif
                      wäre hier der schnellste Hebel.
                    </li>
                    <li>
                      {openWaitlists > 0
                        ? `${openWaitlists} Kurse haben eine Warteliste. Eine Zusatzgruppe wäre möglich.`
                        : 'Alle Kurse haben freie Plätze.'}
                    </li>
                  </ul>
                </Card>

                <Card className="flex flex-col gap-3 p-5">
                  <h3 className="tk-h3">Schnellaktionen</h3>
                  <Button tone="ghost" block onClick={() => setView('sperren')}>
                    Platz sperren
                  </Button>
                  <Button tone="ghost" block onClick={() => setView('kurse')}>
                    Kurs anlegen
                  </Button>
                  <Link href="/tk/buchen" className="tk-btn tk-btn--ghost tk-btn--block">
                    Kundensicht öffnen
                  </Link>
                  <p className="tk-hint mt-auto">
                    Aktionen sind in der Demo ohne Wirkung auf echte Daten.
                  </p>
                </Card>
              </div>
            </>
          ) : null}

          {/* ---- Auslastung ---------------------------------------------- */}
          {view === 'auslastung' ? (
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
              <Card className="flex flex-col gap-5 p-6">
                <div>
                  <h2 className="tk-h3">Sieben Tage im Überblick</h2>
                  <p className="text-[0.88rem] text-[var(--tk-ink-dim)]">
                    Durchschnitt über alle Plätze in {location.shortName}
                  </p>
                </div>

                {/* Balkendiagramm ohne Bibliothek — Höhe = Auslastung */}
                <div className="flex items-end gap-2" role="img" aria-label="Auslastung der nächsten sieben Tage">
                  {week.map((d, i) => (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                      <span className="tk-num text-[0.74rem] font-semibold">{d.util} %</span>
                      <div className="flex h-[150px] w-full items-end">
                        <div
                          className={cn(
                            'w-full rounded-t-[6px] transition-[height]',
                            d.util > 75 ? 'bg-[var(--tk-clay-deep)]' : 'bg-[var(--tk-clay)]',
                          )}
                          style={{ height: `${Math.max(4, d.util)}%` }}
                        />
                      </div>
                      <span className="text-[0.74rem] text-[var(--tk-ink-dim)]">
                        {i === 0 ? 'Heute' : formatDayShort(d.date).split(',')[0]}
                      </span>
                      <span aria-hidden className="text-[0.9rem] leading-none">
                        {forecastDays[i].rainChance > 55 ? '☂' : forecastDays[i].rainChance > 25 ? '☁' : '☀'}
                      </span>
                    </div>
                  ))}
                </div>

                <table className="tk-table">
                  <caption className="tk-sr">Auslastung und Umsatzprognose je Tag</caption>
                  <thead>
                    <tr>
                      <th scope="col">Tag</th>
                      <th scope="col" className="text-right">
                        Auslastung
                      </th>
                      <th scope="col" className="text-right">
                        Umsatz
                      </th>
                      <th scope="col" className="text-right">
                        Regen
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {week.map((d, i) => (
                      <tr key={d.date}>
                        <th scope="row" className="font-normal">
                          {i === 0 ? 'Heute' : formatDayShort(d.date)}
                        </th>
                        <td className="tk-num text-right">{d.util} %</td>
                        <td className="tk-num text-right">{formatPrice(d.revenue)}</td>
                        <td className="tk-num text-right">{forecastDays[i].rainChance} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-4 p-6">
                  <h2 className="tk-h3">Kennzahlen</h2>
                  <div className="grid grid-cols-2 gap-5">
                    <Kpi value={`${avgUtil} %`} label="Auslastung heute" />
                    <Kpi value={formatPrice(weekRevenue)} label="Umsatz 7 Tage" />
                    <Kpi value={String(courts.length)} label="Plätze am Standort" />
                    <Kpi
                      value={String(courts.filter((c) => c.kind === 'halle').length)}
                      label="davon Halle"
                    />
                  </div>
                </Card>

                <Card className="flex flex-col gap-3 p-6">
                  <h2 className="tk-h3">Was die Zahlen nahelegen</h2>
                  <ul className="flex flex-col gap-2.5 text-[0.9rem] text-[var(--tk-ink-soft)]">
                    <li>
                      Vormittags unter der Woche steht viel leer. Ein Vormittagstarif oder ein
                      Ü60-Angebot füllt genau diese Lücke.
                    </li>
                    <li>
                      Der Abend ist an beiden Anlagen die Engstelle — dort lohnt sich eher eine
                      Warteliste als ein Rabatt.
                    </li>
                    <li>
                      An Regentagen wandert die Nachfrage in die Halle. Wer den Wechsel
                      automatisch vorschlägt, verliert die Buchung nicht.
                    </li>
                  </ul>
                  <p className="tk-hint">
                    Aus simulierten Daten abgeleitet — mit echten Buchungen wäre dieselbe
                    Auswertung belastbar.
                  </p>
                </Card>
              </div>
            </div>
          ) : null}

          {/* ---- Kurse und Events ---------------------------------------- */}
          {view === 'kurse' ? (
            <div className="flex flex-col gap-6">
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tk-line-soft)] p-5">
                  <h2 className="tk-h3">Kurse und Camps</h2>
                  <Button size="sm">Kurs anlegen</Button>
                </div>
                <div className="tk-grid-scroll" tabIndex={0} role="region" aria-label="Kursliste, waagerecht scrollbar">
                  <table className="tk-table">
                    <thead>
                      <tr>
                        <th scope="col">Kurs</th>
                        <th scope="col">Termine</th>
                        <th scope="col">Standort</th>
                        <th scope="col">Belegung</th>
                        <th scope="col" className="text-right">
                          Preis
                        </th>
                        <th scope="col" className="text-right">
                          Umsatz
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {COURSES.map((c) => {
                        const left = seatsLeft(c);
                        return (
                          <tr key={c.id}>
                            <th scope="row" className="font-semibold">
                              {c.title}
                              <span className="block text-[0.78rem] font-normal text-[var(--tk-ink-dim)]">
                                {c.kind === 'camp' ? 'Camp' : c.kind === 'kids' ? 'Kinder' : 'Erwachsene'}
                              </span>
                            </th>
                            <td className="whitespace-nowrap text-[0.86rem]">{c.schedule}</td>
                            <td className="whitespace-nowrap text-[0.86rem]">
                              {getLocation(c.locationId)?.shortName}
                            </td>
                            <td className="min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <Meter
                                  value={(c.seatsTaken / c.seats) * 100}
                                  tone={left === 0 ? 'var(--tk-blocked)' : undefined}
                                />
                                <span className="tk-num whitespace-nowrap text-[0.8rem]">
                                  {c.seatsTaken}/{c.seats}
                                </span>
                              </div>
                              {left === 0 ? <Chip tone="blocked">Warteliste</Chip> : null}
                            </td>
                            <td className="tk-num text-right">{formatPrice(c.priceCents)}</td>
                            <td className="tk-num text-right font-semibold">
                              {formatPrice(c.priceCents * c.seatsTaken)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tk-line-soft)] p-5">
                  <h2 className="tk-h3">Events</h2>
                  <Button size="sm" tone="ghost">
                    Event anlegen
                  </Button>
                </div>
                <ul className="divide-y divide-[var(--tk-line-soft)]">
                  {EVENTS.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-[0.84rem] text-[var(--tk-ink-dim)]">
                          {formatDayShort(e.startDate)} · {e.time} · {getLocation(e.locationId)?.shortName}
                        </p>
                      </div>
                      {e.seats != null ? (
                        <span className="tk-num text-[0.86rem]">
                          {e.seatsTaken}/{e.seats} gemeldet
                        </span>
                      ) : (
                        <Chip tone="outline">ohne Anmeldung</Chip>
                      )}
                      <Button size="sm" tone="ghost">
                        Bearbeiten
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : null}

          {/* ---- Sperren -------------------------------------------------- */}
          {view === 'sperren' ? (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
              <Card className="overflow-hidden">
                <div className="border-b border-[var(--tk-line-soft)] p-5">
                  <h2 className="tk-h3">Plätze sperren</h2>
                  <p className="mt-1 text-[0.88rem] text-[var(--tk-ink-dim)]">
                    Für Pflege, Punktspiele oder Reparaturen. Gesperrte Zeiten verschwinden
                    sofort aus der Kundensicht; bereits gebuchte Stunden werden gutgeschrieben
                    und die Gäste benachrichtigt.
                  </p>
                </div>
                <ul className="divide-y divide-[var(--tk-line-soft)]">
                  {courts.map((c) => {
                    const isBlocked = blocked.includes(c.id);
                    const status = courtStatusFor(c, date, weather);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{c.name}</p>
                          <p className="text-[0.82rem] text-[var(--tk-ink-dim)]">
                            {SURFACE_LABEL[c.surface]} · {c.kind === 'halle' ? 'Halle' : 'draußen'}
                          </p>
                        </div>
                        {status.condition !== 'bespielbar' ? (
                          <Chip tone={status.condition === 'feucht' ? 'warn' : 'blocked'}>
                            {status.headline}
                          </Chip>
                        ) : null}
                        {isBlocked ? <Chip tone="blocked">manuell gesperrt</Chip> : null}
                        <Button
                          size="sm"
                          tone={isBlocked ? 'ghost' : 'clay'}
                          onClick={() =>
                            isBlocked
                              ? setBlocked((b) => b.filter((x) => x !== c.id))
                              : setBlockSheet(c.id)
                          }
                        >
                          {isBlocked ? 'Sperre aufheben' : 'Sperren'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card className="flex flex-col gap-3 p-6">
                <h2 className="tk-h3">Automatische Sperren</h2>
                <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">
                  Zusätzlich zu manuellen Sperren greift die Wetterregel: Ab acht Millimetern
                  Regen oder über 75 Prozent Regenwahrscheinlichkeit sperren sich die Sandplätze
                  selbst. Von November bis März sind sie ohnehin außer Betrieb.
                </p>
                <dl className="flex flex-col gap-2 text-[0.88rem]">
                  {[
                    ['Schwelle Sperrung', '8 mm oder 75 %'],
                    ['Schwelle Warnung', '3 mm oder 55 %'],
                    ['Frostgrenze', 'unter 2 °C'],
                    ['Winterpause Sand', 'November bis März'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-[var(--tk-line-soft)] pb-1.5">
                      <dt className="text-[var(--tk-ink-dim)]">{k}</dt>
                      <dd className="tk-num font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <Link href="/tk/platzstatus" className="tk-btn tk-btn--ghost mt-auto">
                  Kundensicht des Platzstatus
                </Link>
              </Card>
            </div>
          ) : null}
        </div>
      </section>

      {/* Sperrpanel */}
      <Sheet
        open={Boolean(blockSheet)}
        onClose={() => setBlockSheet(null)}
        title="Platz sperren"
        description={blockSheet ? COURTS.find((c) => c.id === blockSheet)?.name : undefined}
        footer={
          <Button
            block
            onClick={() => {
              if (blockSheet) setBlocked((b) => [...b, blockSheet]);
              setBlockSheet(null);
            }}
          >
            Sperre eintragen
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="tk-field">
              <label className="tk-label" htmlFor="bl-from">
                Von
              </label>
              <input id="bl-from" type="time" className="tk-input" defaultValue="08:00" />
            </div>
            <div className="tk-field">
              <label className="tk-label" htmlFor="bl-to">
                Bis
              </label>
              <input id="bl-to" type="time" className="tk-input" defaultValue="22:00" />
            </div>
          </div>
          <div className="tk-field">
            <label className="tk-label" htmlFor="bl-reason">
              Grund
            </label>
            <select id="bl-reason" className="tk-select">
              <option>Platzpflege</option>
              <option>Punktspiel</option>
              <option>Turnier</option>
              <option>Reparatur</option>
              <option>Wetter</option>
            </select>
          </div>
          <div className="tk-field">
            <label className="tk-label" htmlFor="bl-note">
              Hinweis für Gäste
            </label>
            <textarea
              id="bl-note"
              className="tk-textarea"
              defaultValue="Platz wird gewalzt und neu abgestreut. Ausweichplätze sind frei."
            />
          </div>
          <p className="tk-hint">
            Betroffene Buchungen werden storniert, gutgeschrieben und die Gäste benachrichtigt —
            in der Produktivversion. Diese Demo ändert nur die Anzeige.
          </p>
        </div>
      </Sheet>
    </>
  );
}
