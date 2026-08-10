// ============================================================
// Tennis Kail — Belegung und Slot-Raster
// ============================================================
//
// Die Demo hat keine Datenbank. Trotzdem muss die Belegung stabil sein:
// Wer die Buchungsseite neu lädt, muss dieselben freien Felder sehen, und
// Server-Rendering und Browser müssen übereinstimmen. Deshalb kommt die
// „vorhandene" Belegung aus einer deterministischen Hash-Funktion über
// (Platz, Datum, Uhrzeit) — kein Math.random, kein Date.now.
//
// Die Verteilung ist bewusst nicht gleichmäßig: abends und am Wochenende
// ist deutlich mehr belegt als vormittags, Halle im Winter stärker als der
// Sandplatz. So sieht das Raster aus wie ein echter Buchungsplan.
//
// In der Produktivversion ersetzt eine Abfrage `bookings` diese Funktion;
// die Signatur von `buildSlots()` bleibt gleich.
// ============================================================

import { COURTS, getCourt } from '@/data/tk/facility';
import { priceForWindow } from '@/data/tk/pricing';
import type { Court, Slot } from '@/lib/tk/types';
import { diffDays, weekdayOf } from './format';
import { courtStatusFor, weatherForDay } from './weather';

/** Raster: 30 Minuten. Buchbare Blöcke: 60 oder 90 Minuten. */
export const SLOT_MINUTES = 30;
export const BOOKABLE_DURATIONS = [60, 90] as const;

/** Betriebsfenster für die Rasterdarstellung (Zeilen der Tabelle). */
export const GRID_FROM = 8 * 60;
export const GRID_TO = 22 * 60;

/** Deterministischer 32-Bit-Hash über einen String (FNV-1a). */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Hash → Zahl zwischen 0 und 1. */
function rand01(seed: string): number {
  return hash(seed) / 0xffffffff;
}

/**
 * Wie stark ist ein Zeitfenster typischerweise gefragt? 0 = leer, 1 = voll.
 * Der Wert steuert, wie wahrscheinlich ein Feld belegt ist.
 */
function demand(court: Court, weekday: number, minute: number): number {
  const isWeekend = weekday === 0 || weekday === 6;
  let base: number;
  if (minute < 10 * 60) base = 0.18;
  else if (minute < 14 * 60) base = isWeekend ? 0.55 : 0.28;
  else if (minute < 17 * 60) base = isWeekend ? 0.62 : 0.35;
  else if (minute < 20 * 60) base = isWeekend ? 0.5 : 0.82;
  else base = isWeekend ? 0.25 : 0.55;

  // Halle läuft im Winterhalbjahr voller, Sandplätze im Sommer.
  if (court.kind === 'halle') base += 0.06;
  if (court.kind === 'freiplatz' && court.floodlight && minute >= 19 * 60) base += 0.08;
  // Plätze am Rand sind etwas weniger gefragt.
  if (/[45678]$/.test(court.name)) base -= 0.1;
  return Math.min(0.95, Math.max(0.04, base));
}

/** Namen für die Beschriftung belegter Felder im Betreiber-Dashboard. */
const DEMO_NAMES = [
  'Bauer', 'Frey', 'Lang', 'Wimmer', 'Duda', 'Sander', 'Kirchner', 'Haderer',
  'Ostermeier', 'Baumgartner', 'Reinhardt', 'Wenzel', 'Kolb', 'Höfer', 'Steiner',
];

export interface SlotOptions {
  /** Referenztag (vom Server), um Vergangenheit zu erkennen. */
  todayIso: string;
  /** Minuten seit Mitternacht am Referenztag. */
  nowMinute: number;
  /** Öffnungszeiten des Standorts als Blöcke. */
  openBlocks: { from: number; to: number }[];
  /** Beschriftung belegter Felder mitliefern (Betreibersicht). */
  withLabels?: boolean;
}

/**
 * Baut das komplette Slot-Raster eines Platzes für einen Tag.
 * Reihenfolge der Zustände: geschlossen → vergangen → gesperrt → belegt → frei.
 */
export function buildSlots(court: Court, date: string, opts: SlotOptions): Slot[] {
  const weekday = weekdayOf(date);
  const dayDiff = diffDays(opts.todayIso, date);
  const weather = weatherForDay(date);
  const status = courtStatusFor(court, date, weather);
  const slots: Slot[] = [];

  for (let m = GRID_FROM; m < GRID_TO; m += SLOT_MINUTES) {
    const to = m + SLOT_MINUTES;
    const open = opts.openBlocks.some((b) => m >= b.from && to <= b.to);
    const priceCents = priceForWindow(court.rateGroupId, weekday, m, to);

    if (!open) {
      slots.push({ courtId: court.id, date, from: m, to, state: 'geschlossen', priceCents });
      continue;
    }

    // Belegung steht unabhängig davon fest, ob das Feld noch buchbar ist —
    // sonst würde die Auslastung des laufenden Tages im Dashboard einbrechen.
    const seed = `${court.id}|${date}|${m}`;
    const booked = rand01(seed) < demand(court, weekday, m);
    const label = opts.withLabels && booked ? DEMO_NAMES[hash(seed + 'name') % DEMO_NAMES.length] : undefined;

    if (dayDiff < 0 || (dayDiff === 0 && to <= opts.nowMinute)) {
      slots.push({ courtId: court.id, date, from: m, to, state: 'vergangen', priceCents, booked, label });
      continue;
    }
    if (status.condition === 'gesperrt') {
      slots.push({
        courtId: court.id, date, from: m, to, state: 'gesperrt', priceCents, booked,
        label: opts.withLabels ? status.headline : undefined,
      });
      continue;
    }
    slots.push({
      courtId: court.id, date, from: m, to,
      state: booked ? 'belegt' : 'frei',
      priceCents, booked, label,
    });
  }
  return slots;
}

/** Ist ein Block der Länge `duration` ab `from` komplett frei? */
export function isBlockFree(slots: Slot[], from: number, duration: number): boolean {
  const needed = duration / SLOT_MINUTES;
  const start = slots.findIndex((s) => s.from === from);
  if (start < 0 || start + needed > slots.length) return false;
  for (let i = 0; i < needed; i++) {
    if (slots[start + i].state !== 'frei') return false;
  }
  return true;
}

/** Preis eines Blocks aus den Einzel-Slots. */
export function blockPrice(slots: Slot[], from: number, duration: number): number {
  const needed = duration / SLOT_MINUTES;
  const start = slots.findIndex((s) => s.from === from);
  let sum = 0;
  for (let i = 0; i < needed && start + i < slots.length; i++) sum += slots[start + i].priceCents;
  return sum;
}

export interface FreeBlock {
  courtId: string;
  courtName: string;
  locationId: string;
  from: number;
  to: number;
  priceCents: number;
  kind: Court['kind'];
}

/** Alle freien Blöcke eines Tages über mehrere Plätze — Basis für Schnellsuche. */
export function findFreeBlocks(
  courts: Court[],
  date: string,
  duration: number,
  opts: SlotOptions,
): FreeBlock[] {
  const out: FreeBlock[] = [];
  for (const court of courts) {
    const slots = buildSlots(court, date, opts);
    for (const s of slots) {
      if (s.state !== 'frei') continue;
      if (!isBlockFree(slots, s.from, duration)) continue;
      out.push({
        courtId: court.id,
        courtName: court.name,
        locationId: court.locationId,
        from: s.from,
        to: s.from + duration,
        priceCents: blockPrice(slots, s.from, duration),
        kind: court.kind,
      });
    }
  }
  return out.sort((a, b) => a.from - b.from || a.courtId.localeCompare(b.courtId));
}

/** Auslastung eines Platzes an einem Tag in Prozent (nur geöffnete Felder). */
export function utilisation(slots: Slot[]): number {
  const relevant = slots.filter((s) => s.state !== 'geschlossen');
  if (relevant.length === 0) return 0;
  const busy = relevant.filter((s) => s.booked).length;
  return Math.round((busy / relevant.length) * 100);
}

/** Tagesumsatz aus belegten Feldern — Kennzahl fürs Betreiber-Dashboard. */
export function revenueOfDay(date: string, opts: SlotOptions, courts: Court[] = COURTS): number {
  let sum = 0;
  for (const court of courts) {
    for (const s of buildSlots(court, date, opts)) {
      // Gesperrte Felder bringen keinen Umsatz — die Buchung wird gutgeschrieben.
      if (s.booked && s.state !== 'gesperrt') sum += s.priceCents;
    }
  }
  return sum;
}

/** Kurzform für Anzeigen: „Halle 2 · Neuperlach". */
export function courtLabel(courtId: string): string {
  const c = getCourt(courtId);
  return c ? c.name : courtId;
}
