// ============================================================
// MDC — Spielorte
// ============================================================
//
// ECHTE DATEN. Quelle: Spielorte-Übersicht der MDC für die Saison 2026/2027
// (Betreiber, Stand August 2026). Tag, Lokal, PLZ/Ort, Straße, Uhrzeit,
// Telefon und Anzahl der Dartautomaten stehen genau so in der Vorlage.
//
// BEWUSST NICHT GESPEICHERT: Stadtteile, Beschreibungstexte und Schlagworte.
// Die standen nicht in der Vorlage — sie wären erfunden. Die Oberfläche zeigt
// stattdessen PLZ und Ort.
//
// TELEFONNUMMERN: Die Vorlage führt sie als Kontakt des jeweiligen Lokals.
// Mehrere davon sind Mobilnummern; ob die alle öffentlich auf die Seite
// dürfen, muss der Betreiber entscheiden (siehe `PHONES_PUBLIC`).
// ============================================================

import type { Venue, Weekday } from './types';

/**
 * Sollen die Telefonnummern öffentlich angezeigt werden?
 *
 * Die Vorlage enthält überwiegend Mobilnummern. Solange nicht geklärt ist, ob
 * die veröffentlicht werden dürfen, bleiben sie gespeichert, aber verborgen —
 * lieber eine Angabe zu wenig als eine private Nummer zu viel.
 * Auf `true` stellen, sobald der Betreiber zugestimmt hat.
 */
export const PHONES_PUBLIC = false;

export const VENUES: Venue[] = [
  // ── Montag ────────────────────────────────────────────────
  {
    id: 'legendary',
    name: 'Legendary',
    street: 'Kurfürstenstraße 11',
    zip: '80799',
    city: 'München',
    weekdays: [1],
    time: '20:00',
    phones: ['0157 87178850'],
    boards: 2,
  },
  {
    id: 'harlekin',
    name: 'Harlekin',
    street: 'Oefelestraße 21',
    zip: '81543',
    city: 'München',
    weekdays: [1],
    time: '20:00',
    phones: ['089 65113113'],
    boards: 3,
  },
  {
    id: 'bistro-118',
    name: 'Bistro 118',
    street: 'Drygalskiallee 118',
    zip: '81477',
    city: 'München',
    weekdays: [1],
    time: '20:00',
    phones: ['01522 7547784'],
    boards: 2,
  },
  {
    id: 'tonys-wirtshaus',
    name: 'Tonys Wirtshaus',
    street: 'Arnulfstraße 130',
    zip: '80634',
    city: 'München',
    weekdays: [1],
    time: '20:00',
    phones: ['089 165341'],
    boards: 2,
  },

  // ── Dienstag ──────────────────────────────────────────────
  {
    id: 'ambasador',
    name: 'Ambasador',
    street: 'Bodenseestraße 19',
    zip: '81241',
    city: 'München',
    weekdays: [2],
    time: '20:00',
    phones: ['0176 80349674'],
    boards: 4,
  },
  {
    id: 'fuenf-sterne-boazn',
    name: '5 Sterne Boazn',
    street: 'Trappentreustraße 31',
    zip: '80339',
    city: 'München',
    weekdays: [2],
    time: '19:00',
    phones: ['0174 4444642'],
    boards: 2,
  },

  // ── Mittwoch ──────────────────────────────────────────────
  {
    id: 'djk-wuermtal',
    name: 'DJK Würmtal',
    street: 'Georgenstraße 35',
    zip: '82852',
    city: 'Planegg',
    weekdays: [3],
    time: '19:30',
    phones: ['0173 3600690'],
    boards: 2,
  },
  {
    id: 'machete-1',
    name: 'Machete 1',
    street: 'Heimeranplatz 1',
    zip: '80339',
    city: 'München',
    weekdays: [3],
    time: '19:00',
    phones: ['0173 3837850', '0157 76846659'],
    boards: 2,
  },
  {
    id: 'siebziger',
    name: '70er',
    street: 'Tegernseer Landstraße 34',
    zip: '81541',
    city: 'München',
    weekdays: [3],
    time: '19:00',
    phones: ['0151 40001860'],
    boards: 2,
  },

  // ── Donnerstag ────────────────────────────────────────────
  {
    id: 'fiakerstueberl',
    name: 'Fiakerstüberl',
    street: 'Zenettistraße 30',
    zip: '80337',
    city: 'München',
    weekdays: [4],
    time: '19:30',
    phones: ['0179 5210987'],
    boards: 4,
  },
  {
    id: 'lustiger-bauer',
    name: 'Lustiger Bauer',
    street: 'Kantstraße 29',
    zip: '80809',
    city: 'München',
    weekdays: [4],
    time: '20:00',
    phones: ['089 3508571'],
    boards: 4,
  },
];

/**
 * Zusätzlich zu den festen Spieltagen kann an diesen Tagen in JEDEM
 * MDC-Lokal ein Ranking stattfinden — sofern genug Leute da sind und der
 * Wirt mitspielt. Steht so in der Spielorte-Übersicht.
 */
export const FLEXIBLE_RANKING_DAYS: { label: string; weekdays: Weekday[] }[] = [
  { label: 'Sonntag', weekdays: [7] },
  { label: 'Jeden Freitag oder Samstag', weekdays: [5, 6] },
];

/** Bedingung für die flexiblen Ranking-Tage — wörtlich aus der Vorlage. */
export const FLEXIBLE_RANKING_NOTE =
  'Möglich ab mindestens 4 Personen — die Wirte entscheiden.';

const BY_ID = new Map(VENUES.map(v => [v.id, v]));

export function getVenue(id: string): Venue | undefined {
  return BY_ID.get(id);
}

/** Name des Spielorts oder ein neutraler Platzhalter (nie erfundene Namen). */
export function venueName(id: string): string {
  return BY_ID.get(id)?.name ?? 'Unbekannter Spielort';
}

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  1: 'Montag',
  2: 'Dienstag',
  3: 'Mittwoch',
  4: 'Donnerstag',
  5: 'Freitag',
  6: 'Samstag',
  7: 'Sonntag',
};

export const WEEKDAY_SHORT: Record<Weekday, string> = {
  1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa', 7: 'So',
};

/** Spielorte nach Wochentag gruppiert — Basis für „Diese Woche bei der MDC". */
export function venuesByWeekday(): { weekday: Weekday; venues: Venue[] }[] {
  const days = [...new Set(VENUES.flatMap(v => v.weekdays))].sort((a, b) => a - b);
  return days.map(weekday => ({
    weekday,
    venues: VENUES.filter(v => v.weekdays.includes(weekday)),
  }));
}

/**
 * Spieltage ab einem Datum, aus den Spielorten abgeleitet.
 *
 * Der Wochenplan der MDC steht nicht in einer Terminliste, sondern in den
 * Spielorten selbst: Jedes Lokal hat seinen festen Wochentag und seine
 * Uhrzeit. Daraus lässt sich der Plan für jede Woche ausrechnen — und er
 * kann gar nicht veralten oder der Spielorte-Seite widersprechen.
 *
 * Nur die festen Tage. Die flexiblen Ranking-Tage (Sonntag sowie Freitag
 * oder Samstag) hängen davon ab, ob genug Leute da sind und der Wirt
 * mitmacht — die stehen in `FLEXIBLE_RANKING_DAYS` und werden getrennt
 * ausgewiesen, statt sie als Termin zu behaupten.
 */
export function playDaysFrom(fromIso: string, days = 7): {
  date: string; weekday: Weekday; venues: Venue[];
}[] {
  const start = new Date(`${fromIso}T00:00:00Z`);
  const plan: { date: string; weekday: Weekday; venues: Venue[] }[] = [];

  for (let i = 0; i < days; i++) {
    const tag = new Date(start);
    tag.setUTCDate(tag.getUTCDate() + i);
    // getUTCDay(): 0 = Sonntag. Die MDC zählt 1 = Montag … 7 = Sonntag.
    const weekday = (tag.getUTCDay() === 0 ? 7 : tag.getUTCDay()) as Weekday;
    const offene = VENUES
      .filter(v => v.weekdays.includes(weekday))
      .sort((a, b) => a.time.localeCompare(b.time) || a.name.localeCompare(b.name));
    if (offene.length) plan.push({ date: tag.toISOString().slice(0, 10), weekday, venues: offene });
  }

  return plan;
}

/** Der nächste Spieltag ab einem Datum — für den Knopf in der Kopfzeile. */
export function nextPlayDay(fromIso: string): { date: string; weekday: Weekday; venues: Venue[] } | undefined {
  // 8 Tage schauen, damit auch von einem Freitag aus der Montag gefunden wird.
  return playDaysFrom(fromIso, 8)[0];
}

/** „Montag" oder „Dienstag & Freitag" — je nach Zahl der Spieltage. */
export function venueWeekdayLabel(venue: Venue): string {
  return venue.weekdays.map(d => WEEKDAY_NAMES[d]).join(' & ');
}

/** Kurzform für enge Stellen: „Mo" oder „Di & Fr". */
export function venueWeekdayShort(venue: Venue): string {
  return venue.weekdays.map(d => WEEKDAY_SHORT[d]).join(' & ');
}

/** Vollständige Adresse in einer Zeile. */
export function venueAddress(venue: Venue): string {
  return `${venue.street}, ${venue.zip} ${venue.city}`;
}

/** Google-Maps-Suchlink (kein Einbetten, keine Tracker auf der Seite). */
export function venueMapsUrl(venue: Venue): string {
  const q = `${venue.name}, ${venue.street}, ${venue.zip} ${venue.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
