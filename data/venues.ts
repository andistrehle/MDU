// ============================================================
// MDC — Spielorte (Demo-Daten)
// ============================================================
//
// Die Lokalnamen stammen aus der Münchner Kneipen-Dartszene, alle weiteren
// Angaben (Adresse, Telefon, Automatenzahl) sind für die Demo erfunden und
// als Platzhalter zu verstehen. Telefonnummern nutzen bewusst den
// Blindnummern-Block 089 5555 xx, damit niemand versehentlich angerufen wird.
// ============================================================

import type { Venue, Weekday } from './types';

export const VENUES: Venue[] = [
  {
    id: 'legendary',
    name: 'Legendary',
    street: 'Sonnenstraße 12',
    zip: '80331',
    city: 'München',
    district: 'Ludwigsvorstadt',
    weekdays: [1],
    time: '20:00',
    phone: '089 5555 01',
    boards: 4,
    description: 'Späte Kneipe mitten in der Stadt, vier Automaten im Nebenraum. Der Klassiker zum Wochenstart.',
    tags: ['Sportsbar', 'Innenstadt', 'spät geöffnet'],
  },
  {
    id: 'harlekin',
    name: 'Harlekin',
    street: 'Rosenheimer Straße 48',
    zip: '81669',
    city: 'München',
    district: 'Haidhausen',
    weekdays: [1],
    time: '20:00',
    phone: '089 5555 02',
    boards: 3,
    description: 'Haidhauser Institution mit voller Bude. Hier werden die größten Felder der Serie gemeldet.',
    tags: ['Kneipe', 'Haidhausen', 'großes Feld'],
  },
  {
    id: 'tonys-wirtshaus',
    name: 'Tonys Wirtshaus',
    street: 'Dachauer Straße 176',
    zip: '80992',
    city: 'München',
    district: 'Moosach',
    weekdays: [1],
    time: '20:00',
    phone: '089 5555 03',
    boards: 3,
    description: 'Wirtshaus mit Biergarten und eigenem Dartraum. Küche bis 22 Uhr, gespielt wird trotzdem pünktlich.',
    tags: ['Wirtshaus', 'Biergarten', 'Küche'],
  },
  {
    id: 'rg-bar',
    name: 'RG Bar',
    street: 'Landsberger Straße 89',
    zip: '80339',
    city: 'München',
    district: 'Westend',
    weekdays: [2],
    time: '19:00',
    phone: '089 5555 04',
    boards: 2,
    description: 'Kleine Bar im Westend, zwei Automaten, kurze Wege zur Theke. Enge Felder, schnelle Turniere.',
    tags: ['Bar', 'Westend', 'klein & schnell'],
  },
  {
    id: 'fuenf-sterne-boazn',
    name: '5 Sterne Boazn',
    street: 'Implerstraße 22',
    zip: '81371',
    city: 'München',
    district: 'Sendling',
    weekdays: [2],
    time: '19:00',
    phone: '089 5555 05',
    boards: 2,
    description: 'Echte Boazn mit Neonlicht und Automatenmusik. Klein, laut, legendär.',
    tags: ['Boazn', 'Sendling', 'Kult'],
  },
  {
    id: 'djk-wuermtal',
    name: 'DJK Würmtal',
    street: 'Am Sportplatz 3',
    zip: '82166',
    city: 'Gräfelfing',
    district: 'Würmtal',
    weekdays: [3],
    time: '19:30',
    phone: '089 5555 06',
    boards: 6,
    description: 'Vereinsheim mit sechs Automaten — der größte Spielort der Serie. Parkplätze direkt davor.',
    tags: ['Vereinsheim', 'Würmtal', '6 Automaten'],
  },
  {
    id: 'machete-1',
    name: 'Machete 1',
    street: 'Schleißheimer Straße 214',
    zip: '80797',
    city: 'München',
    district: 'Schwabing-West',
    weekdays: [3],
    time: '19:00',
    phone: '089 5555 07',
    boards: 3,
    description: 'Schwabinger Szeneladen, spätes Publikum. Wer im Halbfinale steht, spielt hier gern lange.',
    tags: ['Szenebar', 'Schwabing', 'spät'],
  },
  {
    id: 'siebziger',
    name: '70er',
    street: 'Tegernseer Landstraße 61',
    zip: '81541',
    city: 'München',
    district: 'Giesing',
    weekdays: [3],
    time: '19:00',
    phone: '089 5555 08',
    boards: 4,
    description: 'Holzvertäfelung, Röhrenradio, vier Automaten. Nostalgie pur und ein sehr starkes Stammfeld.',
    tags: ['Kult', 'Giesing', 'Nostalgie'],
  },
  {
    id: 'fiakerstueberl',
    name: 'Fiakerstüberl',
    street: 'Zenettistraße 9',
    zip: '80337',
    city: 'München',
    district: 'Isarvorstadt',
    weekdays: [4],
    time: '19:30',
    phone: '089 5555 09',
    boards: 3,
    description: 'Traditionsstüberl an der Isar. Kleine Karte, große Turniere, freundliche Wirtsleute.',
    tags: ['Stüberl', 'Isarvorstadt', 'Tradition'],
  },
  {
    id: 'lustiger-bauer',
    name: 'Lustiger Bauer',
    street: 'Fürstenrieder Straße 133',
    zip: '80686',
    city: 'München',
    district: 'Laim',
    weekdays: [4],
    time: '20:00',
    phone: '089 5555 10',
    boards: 4,
    description: 'Laimer Eckkneipe mit eigener Dartliga-Historie. Donnerstags wird es hier immer voll.',
    tags: ['Eckkneipe', 'Laim', 'Stammpublikum'],
  },
  {
    id: 'ambasador',
    name: 'Ambasador',
    street: 'Bodenseestraße 19',
    zip: '81241',
    city: 'München',
    district: 'Pasing',
    weekdays: [2, 5],
    time: '20:00',
    phone: '089 5555 11',
    boards: 3,
    description: 'Neues Zuhause der Illuminati und der Darts Vaders — vormals Keko, davor Lumis. Gespielt wird dienstags und freitags.',
    tags: ['Sportsbar', 'Pasing', 'zwei Spieltage'],
  },
];

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
