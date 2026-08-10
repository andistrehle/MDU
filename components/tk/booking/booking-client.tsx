'use client';

// ============================================================
// Tennis Kail — Platzbuchung
// ============================================================
//
// UX-Konzept
// ----------
// Die Buchung ist der Grund, warum es diese Anwendung gibt. Deshalb braucht
// sie null Vorbereitung: Wer die Seite öffnet, sieht sofort das Raster für
// heute — ohne vorher Standort, Datum und Dauer auszuwählen. Alle Filter
// sind Korrekturen an einer bereits sinnvollen Voreinstellung.
//
// Drei Schritte, mehr nicht:
//   1. Feld antippen  → Panel mit Platz, Zeit, Preis
//   2. Übernehmen     → Auswahlliste (mehrere Buchungen möglich)
//   3. Bestätigen     → Bestätigungsseite
// Es gibt bewusst kein Konto-Zwang vor Schritt 3: Wer erst am Ende Namen
// und Telefon eingibt, springt seltener ab.
//
// Mobile first
// ------------
// Das Raster scrollt waagerecht, die Platzspalte bleibt stehen. Jede Zelle
// ist mindestens 46 px hoch und breit — Daumenmaß. Die Auswahlliste liegt
// auf dem Telefon als feste Leiste am unteren Rand, damit sie nie
// verlorengeht.
//
// Produktivversion
// ----------------
// `buildSlots()` liest heute aus einer deterministischen Funktion. Später
// liefert eine Server Action dieselbe Struktur aus `bookings` (Supabase),
// mit einer Sperre auf (court_id, date, from) gegen Doppelbuchungen. Die
// Oberfläche unten bleibt unverändert.
// ============================================================

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { COURTS, LOCATIONS, SURFACE_LABEL, getCourt, getLocation } from '@/data/tk/facility';
import {
  BOOKABLE_DURATIONS, GRID_FROM, GRID_TO, SLOT_MINUTES,
  blockPrice, buildSlots, isBlockFree,
} from '@/lib/tk/availability';
import {
  addDays, formatDayLong, formatDayShort, formatPrice, formatSpan, formatTime, weekdayOf,
} from '@/lib/tk/format';
import { useTkStore } from '@/lib/tk/store';
import { courtStatusFor, weatherForDay, WEATHER_LABEL } from '@/lib/tk/weather';
import type { Slot } from '@/lib/tk/types';
import { Button, Card, Chip, Steps } from '@/components/tk/ui/primitives';
import { Segment, Sheet } from '@/components/tk/ui/overlay';
import { cn } from '@/lib/utils';

const DAYS_AHEAD = 7;
const STEPS = ['Zeit wählen', 'Auswahl prüfen', 'Bestätigt'];

interface Selection {
  courtId: string;
  from: number;
  duration: number;
}

export function BookingClient({
  todayIso,
  nowMinute,
  initialLocation,
  initialDate,
  initialCourt,
  initialFrom,
}: {
  todayIso: string;
  nowMinute: number;
  initialLocation?: string;
  initialDate?: string;
  initialCourt?: string;
  initialFrom?: number;
}) {
  const dates = useMemo(
    () => Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(todayIso, i)),
    [todayIso],
  );

  const [date, setDate] = useState(
    initialDate && dates.includes(initialDate) ? initialDate : todayIso,
  );
  const [locationId, setLocationId] = useState(
    initialLocation && LOCATIONS.some((l) => l.id === initialLocation)
      ? initialLocation
      : (getCourt(initialCourt ?? '')?.locationId ?? 'neuperlach'),
  );
  const [duration, setDuration] = useState<number>(60);
  const [kind, setKind] = useState<'alle' | 'halle' | 'freiplatz'>('alle');
  const [selection, setSelection] = useState<Selection | null>(
    initialCourt && initialFrom != null
      ? { courtId: initialCourt, from: initialFrom, duration: 60 }
      : null,
  );
  const [sheetOpen, setSheetOpen] = useState(Boolean(initialCourt && initialFrom != null));
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });

  const { cart, addLine, removeLine, clearCart, confirmCart, totalCents } = useTkStore();
  const reduce = useReducedMotion();

  const weekday = weekdayOf(date);
  // Eigene Memoisierung: Ein frisch erzeugtes Array bei jedem Rendern würde
  // sämtliche useMemo-Abhängigkeiten darunter wertlos machen.
  const openBlocks = useMemo(
    () => getLocation(locationId)?.hours.find((h) => h.weekday === weekday)?.blocks ?? [],
    [locationId, weekday],
  );
  const weather = weatherForDay(date);

  const courts = useMemo(
    () => COURTS.filter((c) => c.locationId === locationId && (kind === 'alle' || c.kind === kind)),
    [locationId, kind],
  );

  const slotsByCourt = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const c of courts) {
      map.set(c.id, buildSlots(c, date, { todayIso, nowMinute, openBlocks }));
    }
    return map;
  }, [courts, date, todayIso, nowMinute, openBlocks]);

  const times = useMemo(() => {
    const out: number[] = [];
    for (let m = GRID_FROM; m < GRID_TO; m += SLOT_MINUTES) out.push(m);
    return out;
  }, []);

  const freeCount = useMemo(() => {
    let n = 0;
    for (const c of courts) {
      const slots = slotsByCourt.get(c.id) ?? [];
      for (const s of slots) if (s.state === 'frei' && isBlockFree(slots, s.from, duration)) n++;
    }
    return n;
  }, [courts, slotsByCourt, duration]);

  /**
   * Wer abends um halb sieben die Seite öffnet, soll nicht erst durch zehn
   * vergangene Stunden scrollen. Das Raster springt deshalb auf die
   * aktuelle Uhrzeit — aber erst nach dem Rendern, damit Server und
   * Browser dasselbe HTML erzeugen.
   */
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const startAt = date === todayIso ? nowMinute : GRID_FROM;
    const columns = Math.max(0, Math.floor((startAt - GRID_FROM) / SLOT_MINUTES) - 1);
    el.scrollTo({ left: columns * 50, behavior: 'auto' });
  }, [date, todayIso, nowMinute, locationId, kind]);

  const selectedCourt = selection ? getCourt(selection.courtId) : undefined;
  const selectedSlots = selection ? (slotsByCourt.get(selection.courtId) ?? []) : [];
  const selectionPrice =
    selection && selectedSlots.length ? blockPrice(selectedSlots, selection.from, selection.duration) : 0;
  const selectionOk =
    selection && selectedSlots.length ? isBlockFree(selectedSlots, selection.from, selection.duration) : false;

  /**
   * Ein freies Feld heißt nicht, dass der gewählte Block hineinpasst — 90
   * Minuten scheitern oft an der Folgestunde. Statt den Gast mit einer
   * toten Schaltfläche stehen zu lassen, wird beim Öffnen die längste
   * Dauer genommen, die tatsächlich passt.
   */
  function openSlot(courtId: string, from: number) {
    const slots = slotsByCourt.get(courtId) ?? [];
    const fits = [...BOOKABLE_DURATIONS]
      .sort((a, b) => b - a)
      .filter((d) => d <= duration && isBlockFree(slots, from, d));
    setSelection({ courtId, from, duration: fits[0] ?? duration });
    setSheetOpen(true);
  }

  function commitSelection() {
    if (!selection || !selectedCourt || !selectionOk) return;
    const loc = getLocation(selectedCourt.locationId)!;
    addLine({
      type: 'platz',
      title: `${selectedCourt.name} · ${loc.shortName}`,
      subtitle: `${formatDayShort(date)} · ${formatSpan(selection.from, selection.from + selection.duration)}`,
      priceCents: selectionPrice,
      date,
      from: selection.from,
      to: selection.from + selection.duration,
      courtId: selection.courtId,
    });
    setSheetOpen(false);
    setSelection(null);
  }

  function confirm() {
    confirmCart(todayIso);
    setStep(2);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }

  // ---- Bestätigung ------------------------------------------------------
  if (step === 2) {
    return (
      <div className="tk-shell py-12">
        <div className="mx-auto max-w-[560px]">
          <Steps steps={STEPS} current={2} />
          <Card className="mt-8 overflow-hidden">
            <div className="tk-clay-surface px-6 py-8 text-white">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] opacity-85">
                Buchung angelegt
              </p>
              <h1 className="tk-h2 mt-2 text-white">Bis dann auf dem Platz.</h1>
            </div>
            <div className="flex flex-col gap-4 p-6">
              <p className="text-[0.95rem] text-[var(--tk-ink-soft)]">
                In dieser Demo ist die Buchung nur im Browser gespeichert. Es geht keine E-Mail
                raus, es wird nichts abgebucht, und an der Anlage weiß niemand davon. In der
                Produktivversion stünde hier die Bestätigungsnummer und eine E-Mail wäre
                unterwegs.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/tk/konto" className="tk-btn">
                  Im Konto ansehen
                </Link>
                <button
                  className="tk-btn tk-btn--ghost"
                  onClick={() => {
                    setStep(0);
                    setContact({ name: '', phone: '', email: '' });
                  }}
                >
                  Noch einen Platz buchen
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Auswahl prüfen ---------------------------------------------------
  if (step === 1) {
    return (
      <div className="tk-shell py-12">
        <div className="mx-auto max-w-[620px]">
          <Steps steps={STEPS} current={1} />
          <h1 className="tk-h2 mt-6">Auswahl prüfen</h1>

          {cart.length === 0 ? (
            <Card className="mt-6 p-6">
              <p className="text-[var(--tk-ink-soft)]">
                Die Auswahl ist leer.{' '}
                <button className="font-semibold text-[var(--tk-clay)] underline" onClick={() => setStep(0)}>
                  Zurück zum Raster
                </button>
              </p>
            </Card>
          ) : (
            <>
              <Card className="mt-6 divide-y divide-[var(--tk-line-soft)]">
                {cart.map((line) => (
                  <div key={line.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold">{line.title}</p>
                      <p className="text-[0.86rem] text-[var(--tk-ink-dim)]">{line.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tk-num font-semibold">{formatPrice(line.priceCents)}</span>
                      <button
                        onClick={() => removeLine(line.id)}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[var(--tk-chalk-2)] text-[var(--tk-ink-dim)]"
                        aria-label={`${line.title} entfernen`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between p-4">
                  <span className="font-semibold">Summe</span>
                  <span className="tk-num text-[1.15rem] font-semibold">{formatPrice(totalCents)}</span>
                </div>
              </Card>

              <Card className="mt-5 flex flex-col gap-4 p-5">
                <h2 className="tk-h3">Wer spielt?</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="tk-field">
                    <label className="tk-label" htmlFor="bk-name">
                      Name
                    </label>
                    <input
                      id="bk-name"
                      className="tk-input"
                      autoComplete="name"
                      value={contact.name}
                      onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    />
                  </div>
                  <div className="tk-field">
                    <label className="tk-label" htmlFor="bk-phone">
                      Telefon
                    </label>
                    <input
                      id="bk-phone"
                      className="tk-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    />
                  </div>
                  <div className="tk-field sm:col-span-2">
                    <label className="tk-label" htmlFor="bk-mail">
                      E-Mail
                    </label>
                    <input
                      id="bk-mail"
                      className="tk-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    />
                    <span className="tk-hint">
                      Nur für die Bestätigung. In der Demo wird nichts verschickt und nichts
                      gespeichert außer im eigenen Browser.
                    </span>
                  </div>
                </div>
                <p className="text-[0.84rem] text-[var(--tk-ink-dim)]">
                  Bezahlt wird an der Anlage. Storno bis 24 Stunden vorher kostenlos. Sperrt der
                  Platzstatus wegen Regen, wird automatisch gutgeschrieben.
                </p>
              </Card>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={confirm} size="lg">
                  Buchung bestätigen
                </Button>
                <Button tone="ghost" size="lg" onClick={() => setStep(0)}>
                  Weitere Zeit wählen
                </Button>
                <Button tone="ghost" size="lg" onClick={clearCart}>
                  Auswahl leeren
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Raster -----------------------------------------------------------
  return (
    <>
      <div className="tk-shell pt-8">
        <Steps steps={STEPS} current={0} />
        <h1 className="tk-h2 mt-5">Platz buchen</h1>
        <p className="tk-lede mt-2">
          Sieben Tage im Voraus, beide Anlagen. Grün heißt frei — antippen und Zeit übernehmen.
        </p>
      </div>

      {/* Datumsleiste */}
      <div className="tk-shell mt-6">
        <div className="tk-rail !grid-flow-col !auto-cols-[minmax(78px,1fr)] md:!grid-cols-7" tabIndex={0} role="region" aria-label="Datumsauswahl, waagerecht scrollbar">
          {dates.map((d) => {
            const w = weatherForDay(d);
            const active = d === date;
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-[14px] border px-2 py-3 transition-colors',
                  active
                    ? 'border-[var(--tk-clay)] bg-[var(--tk-clay-wash)] text-[var(--tk-clay-deep)]'
                    : 'border-[var(--tk-line)] bg-[var(--tk-paper)] text-[var(--tk-ink-soft)] hover:border-[var(--tk-line-hard)]',
                )}
              >
                <span className="text-[0.76rem] font-semibold uppercase tracking-[0.08em]">
                  {d === todayIso ? 'Heute' : formatDayShort(d).split(',')[0]}
                </span>
                <span className="tk-num text-[1.05rem] font-semibold">{d.slice(8)}.</span>
                <span className="text-[0.72rem] text-[var(--tk-ink-dim)]">
                  {w.maxC}° · {w.rainChance}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="tk-shell mt-5 flex flex-wrap items-center gap-3">
        <Segment
          label="Standort"
          value={locationId}
          onChange={setLocationId}
          options={LOCATIONS.map((l) => ({ value: l.id, label: l.shortName }))}
        />
        <Segment
          label="Platzart"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'alle', label: 'Alle' },
            { value: 'halle', label: 'Halle' },
            { value: 'freiplatz', label: 'Sand' },
          ]}
        />
        <Segment
          label="Dauer"
          value={String(duration)}
          onChange={(v) => setDuration(Number(v))}
          options={BOOKABLE_DURATIONS.map((d) => ({ value: String(d), label: `${d} min` }))}
        />
        <span className="ml-auto text-[0.85rem] text-[var(--tk-ink-dim)]">
          {freeCount} freie Zeitfenster
        </span>
      </div>

      {/* Wetterhinweis */}
      {weather.rainChance > 45 ? (
        <div className="tk-shell mt-4">
          <div className="flex items-start gap-3 rounded-[14px] border border-[rgba(165,113,26,0.28)] bg-[var(--tk-warn-wash)] px-4 py-3">
            <span aria-hidden className="text-lg leading-none">
              ☂
            </span>
            <p className="text-[0.88rem] text-[var(--tk-ink-soft)]">
              <strong>{formatDayLong(date).split(',')[0]}: {WEATHER_LABEL[weather.symbol]}</strong>,{' '}
              {weather.rainChance} % Regenwahrscheinlichkeit. Sandplätze können kurzfristig
              gesperrt werden — in der Halle bist du auf der sicheren Seite.{' '}
              <button className="font-semibold text-[var(--tk-clay)] underline" onClick={() => setKind('halle')}>
                Nur Halle zeigen
              </button>
            </p>
          </div>
        </div>
      ) : null}

      {/* Raster */}
      <div className="tk-shell mt-6">
        <div
          ref={gridRef}
          className="tk-grid-scroll rounded-[var(--tk-radius)] border border-[var(--tk-line)] bg-[var(--tk-paper)] p-3"
          tabIndex={0}
          role="region"
          aria-label="Buchungsraster, waagerecht scrollbar"
        >
          <div
            className="tk-grid"
            style={{ gridTemplateColumns: `92px repeat(${times.length}, 46px)` }}
            aria-label={`Belegung am ${formatDayLong(date)}`}
          >
            {/* Kopfzeile */}
            <div className="tk-court-name" />
            {times.map((m) => (
              <div key={m} className="tk-grid-head">
                {m % 60 === 0 ? formatTime(m) : ''}
              </div>
            ))}

            {courts.map((court) => {
              const slots = slotsByCourt.get(court.id) ?? [];
              const status = courtStatusFor(court, date, weather);
              return (
                <div key={court.id} className="contents">
                  <div className="tk-court-name">
                    <span className="text-[0.86rem] font-semibold leading-tight">{court.name}</span>
                    <span className="text-[0.7rem] text-[var(--tk-ink-dim)]">
                      {SURFACE_LABEL[court.surface]}
                      {court.floodlight ? ' · Flutlicht' : ''}
                    </span>
                  </div>
                  {slots.map((s) => {
                    const inBlock =
                      selection?.courtId === court.id &&
                      s.from >= selection.from &&
                      s.from < selection.from + selection.duration;
                    const clickable = s.state === 'frei';
                    // Passt der gewählte Block hier hinein? Wenn nicht, wird das
                    // Feld gedämpft — es ist frei, aber nicht für diese Länge.
                    const fitsDuration = clickable && isBlockFree(slots, s.from, duration);
                    const label =
                      s.state === 'frei'
                        ? `${court.name}, ${formatTime(s.from)} frei${fitsDuration ? '' : `, aber keine ${duration} Minuten am Stück`}`
                        : `${court.name}, ${formatTime(s.from)} ${s.state}`;
                    return (
                      <button
                        key={s.from}
                        type="button"
                        disabled={!clickable}
                        onClick={() => openSlot(court.id, s.from)}
                        aria-label={label}
                        title={s.state === 'gesperrt' ? status.headline : undefined}
                        className={cn(
                          'tk-slot',
                          `tk-slot--${s.state}`,
                          clickable && !fitsDuration && 'tk-slot--kurz',
                          inBlock && (s.from === selection?.from ? 'tk-slot--gewaehlt' : 'tk-slot--imBlock'),
                        )}
                      >
                        {s.state === 'gesperrt' ? '☂' : ''}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legende */}
        <div className="mt-3 flex flex-wrap gap-4 text-[0.78rem] text-[var(--tk-ink-dim)]">
          {[
            { cls: 'tk-slot--frei', label: 'frei' },
            { cls: 'tk-slot--frei tk-slot--kurz', label: `frei, aber keine ${duration} min am Stück` },
            { cls: 'tk-slot--belegt', label: 'belegt' },
            { cls: 'tk-slot--gesperrt', label: 'wegen Wetter gesperrt' },
            { cls: 'tk-slot--vergangen', label: 'vorbei' },
            { cls: 'tk-slot--geschlossen', label: 'geschlossen' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-2">
              <span className={cn('tk-slot !h-4 !min-w-[16px] !w-4 !rounded-[4px]', l.cls)} aria-hidden />
              {l.label}
            </span>
          ))}
        </div>

        <p className="mt-4 text-[0.82rem] text-[var(--tk-ink-dim)]">
          Belegung und Wetter sind für diese Demo simuliert — nachvollziehbar erzeugt aus Datum
          und Platz, damit dasselbe Raster bei jedem Aufruf gleich aussieht.
        </p>
      </div>

      {/* Auswahlleiste */}
      <AnimatePresence>
        {cart.length > 0 ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: 70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 70, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="fixed inset-x-0 bottom-[54px] z-40 border-t border-[var(--tk-line)] bg-[var(--tk-paper)] shadow-[0_-8px_30px_-16px_rgba(27,30,26,0.4)] lg:bottom-0"
          >
            <div className="tk-shell flex items-center gap-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.86rem] font-semibold">
                  {cart.length} {cart.length === 1 ? 'Zeitfenster' : 'Zeitfenster'} ausgewählt
                </p>
                <p className="truncate text-[0.8rem] text-[var(--tk-ink-dim)]">
                  {cart.map((l) => `${l.title} ${l.subtitle}`).join(' · ')}
                </p>
              </div>
              <span className="tk-num flex-none font-semibold">{formatPrice(totalCents)}</span>
              <Button className="flex-none" onClick={() => setStep(1)}>
                Weiter
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Detail-Panel */}
      <Sheet
        open={sheetOpen && Boolean(selectedCourt)}
        onClose={() => setSheetOpen(false)}
        title={selectedCourt ? `${selectedCourt.name} · ${getLocation(selectedCourt.locationId)?.shortName}` : ''}
        description={selection ? formatDayLong(date) : undefined}
        footer={
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[0.78rem] text-[var(--tk-ink-dim)]">Preis</p>
              <p className="tk-num text-[1.15rem] font-semibold">{formatPrice(selectionPrice)}</p>
            </div>
            <Button onClick={commitSelection} disabled={!selectionOk}>
              Zeit übernehmen
            </Button>
          </div>
        }
      >
        {selection && selectedCourt ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Chip tone="clay">{SURFACE_LABEL[selectedCourt.surface]}</Chip>
              <Chip>{selectedCourt.kind === 'halle' ? 'Halle, beheizt' : 'Freiplatz'}</Chip>
              {selectedCourt.floodlight ? <Chip>Flutlicht</Chip> : null}
            </div>

            <div>
              <p className="tk-label mb-2">Beginn</p>
              <div className="flex flex-wrap gap-2">
                {selectedSlots
                  .filter((s) => s.state === 'frei' || s.from === selection.from)
                  .slice(0, 18)
                  .map((s) => {
                    const ok = isBlockFree(selectedSlots, s.from, selection.duration);
                    return (
                      <button
                        key={s.from}
                        onClick={() => setSelection({ ...selection, from: s.from })}
                        disabled={!ok}
                        aria-pressed={s.from === selection.from}
                        className={cn(
                          'rounded-full border px-3.5 py-2 text-[0.86rem] font-semibold transition-colors',
                          s.from === selection.from
                            ? 'border-[var(--tk-clay)] bg-[var(--tk-clay)] text-white'
                            : ok
                              ? 'border-[var(--tk-line-hard)] text-[var(--tk-ink-soft)] hover:bg-[var(--tk-chalk)]'
                              : 'border-[var(--tk-line-soft)] text-[var(--tk-ink-faint)]',
                        )}
                      >
                        {formatTime(s.from)}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <p className="tk-label mb-2">Dauer</p>
              <Segment
                label="Dauer"
                value={String(selection.duration)}
                onChange={(v) => setSelection({ ...selection, duration: Number(v) })}
                options={BOOKABLE_DURATIONS.map((d) => ({ value: String(d), label: `${d} Minuten` }))}
              />
            </div>

            <dl className="grid grid-cols-2 gap-3 rounded-[12px] bg-[var(--tk-chalk)] p-4 text-[0.88rem]">
              <div>
                <dt className="text-[var(--tk-ink-dim)]">Zeit</dt>
                <dd className="tk-num font-semibold">
                  {formatSpan(selection.from, selection.from + selection.duration)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--tk-ink-dim)]">Wetter</dt>
                <dd className="font-semibold">
                  {weather.maxC}° · {WEATHER_LABEL[weather.symbol]}
                </dd>
              </div>
            </dl>

            {!selectionOk ? (
              <p className="rounded-[12px] bg-[var(--tk-blocked-wash)] px-4 py-3 text-[0.86rem] text-[var(--tk-blocked)]">
                In dieser Länge ist der Platz nicht durchgehend frei. Kürzere Dauer oder anderen
                Beginn wählen.
              </p>
            ) : null}

            {selectedCourt.note ? (
              <p className="text-[0.86rem] text-[var(--tk-ink-dim)]">{selectedCourt.note}</p>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </>
  );
}
