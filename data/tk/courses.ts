// ============================================================
// Tennis Kail — Kurse, Kids-Training und Ferien-Camps (DEMO)
// ============================================================
//
// Vollständig erfundene Demo-Inhalte. Sie zeigen, wie ein Kursangebot mit
// Restplätzen, Warteliste und Direktbuchung aussehen kann — Titel, Termine
// und Preise sind frei gesetzt.
// ============================================================

import type { Course } from '@/lib/tk/types';

export const COURSES: Course[] = [
  // ---- Kids --------------------------------------------------------------
  {
    id: 'bambini-rot',
    kind: 'kids',
    title: 'Bambini · Roter Ball',
    teaser: 'Erste Schläge auf dem Kleinfeld — Fangen, Werfen, Treffen.',
    description:
      'Für Kinder, die zum ersten Mal einen Schläger halten. Kleinfeld, weiche rote Bälle, ' +
      'niedriges Netz. Eine Stunde Bewegung mit viel Spiel und wenig Anstehen. Schläger zum ' +
      'Ausleihen sind da, mitbringen muss man nur Hallenschuhe.',
    ageFrom: 4,
    ageTo: 7,
    level: 'einsteiger',
    locationId: 'harlaching',
    coachIds: ['mara-hoefer'],
    startDate: '2026-09-15',
    endDate: '2026-12-15',
    schedule: 'Dienstags 15:00–16:00 Uhr · 12 Termine',
    seats: 8,
    seatsTaken: 6,
    priceCents: 16800,
    imageSlot: 'kids-bambini',
    highlights: ['Leihschläger inklusive', 'Kleinfeld und rote Bälle', 'Max. 8 Kinder'],
    provenance: 'demo',
  },
  {
    id: 'kids-orange',
    kind: 'kids',
    title: 'Kids · Oranger Ball',
    teaser: 'Vom Kleinfeld aufs Dreiviertelfeld, erste echte Ballwechsel.',
    description:
      'Aufbaukurs für Kinder, die die Grundschläge kennen. Größeres Feld, orange Bälle, ' +
      'erste Aufschlagbewegung und erste Zählweise. Wer will, spielt am Saisonende beim ' +
      'internen Kids-Turnier mit.',
    ageFrom: 7,
    ageTo: 10,
    level: 'einsteiger',
    locationId: 'neuperlach',
    coachIds: ['mara-hoefer'],
    startDate: '2026-09-16',
    endDate: '2026-12-16',
    schedule: 'Mittwochs 16:00–17:00 Uhr · 12 Termine',
    seats: 8,
    seatsTaken: 8,
    priceCents: 16800,
    imageSlot: 'kids-orange',
    highlights: ['Dreiviertelfeld', 'Aufschlag und Zählweise', 'Abschlussturnier'],
    provenance: 'demo',
  },
  {
    id: 'jugend-gelb',
    kind: 'kids',
    title: 'Jugend · Gelber Ball',
    teaser: 'Großfeld, Matchtraining, Vorbereitung auf Punktspiele.',
    description:
      'Für Jugendliche, die regelmäßig spielen und Richtung Mannschaft wollen. Technikblöcke ' +
      'im Wechsel mit Matchsituationen, dazu Aufschlag- und Returnserien. Zwei Gruppen nach ' +
      'Spielstärke.',
    ageFrom: 11,
    ageTo: 17,
    level: 'fortgeschritten',
    locationId: 'neuperlach',
    coachIds: ['mara-hoefer', 'niklas-persson'],
    startDate: '2026-09-17',
    endDate: '2026-12-17',
    schedule: 'Donnerstags 17:00–18:30 Uhr · 12 Termine',
    seats: 10,
    seatsTaken: 7,
    priceCents: 22800,
    imageSlot: 'kids-jugend',
    highlights: ['90 Minuten pro Termin', 'Zwei Leistungsgruppen', 'Punktspiel-Vorbereitung'],
    provenance: 'demo',
  },

  // ---- Camps -------------------------------------------------------------
  {
    id: 'camp-herbst-2026',
    kind: 'camp',
    title: 'Herbstcamp · Halle und Wald',
    teaser: 'Vier Tage Ferienprogramm: vormittags Tennis, nachmittags raus.',
    description:
      'Herbstferien-Camp für Kinder von 7 bis 13. Vormittags drei Stunden Tennis in Gruppen, ' +
      'mittags gemeinsames Essen, nachmittags Bewegungsspiele im Perlacher Forst. Bei Regen ' +
      'wird komplett in die Halle verlegt — das Camp fällt nie aus.',
    ageFrom: 7,
    ageTo: 13,
    level: 'alle',
    locationId: 'harlaching',
    coachIds: ['mara-hoefer', 'ekkehard-dietrich'],
    startDate: '2026-11-02',
    endDate: '2026-11-05',
    schedule: 'Mo–Do, 9:00–16:00 Uhr',
    seats: 24,
    seatsTaken: 17,
    priceCents: 29000,
    imageSlot: 'camp-herbst',
    highlights: ['Mittagessen inklusive', 'Schlechtwetter-Garantie', 'Betreuung bis 16 Uhr'],
    provenance: 'demo',
  },
  {
    id: 'camp-ostern-2027',
    kind: 'camp',
    title: 'Ostercamp · Saisonstart auf Sand',
    teaser: 'Der erste Sand des Jahres — fünf Tage Technik und Match.',
    description:
      'Wenn die Plätze frisch abgezogen sind, geht es los: fünf Tage Camp zum Saisonstart. ' +
      'Vormittags Technik in kleinen Gruppen, nachmittags Matchspiel mit Videoanalyse. ' +
      'Für Jugendliche und Erwachsene in getrennten Gruppen.',
    ageFrom: 12,
    level: 'fortgeschritten',
    locationId: 'neuperlach',
    coachIds: ['niklas-persson'],
    startDate: '2027-03-29',
    endDate: '2027-04-02',
    schedule: 'Mo–Fr, 10:00–15:00 Uhr',
    seats: 20,
    seatsTaken: 4,
    priceCents: 36000,
    imageSlot: 'camp-ostern',
    highlights: ['Videoanalyse', 'Getrennte Gruppen', 'Bespannungs-Service vor Ort'],
    provenance: 'demo',
  },
  {
    id: 'camp-sommer-2027',
    kind: 'camp',
    title: 'Sommercamp · Zwei Wochen Perlacher Forst',
    teaser: 'Das große Ferien-Camp, wochenweise buchbar.',
    description:
      'Zwei Wochen Sommerferien-Camp, wochenweise buchbar. Tennis am Vormittag, Baden, ' +
      'Waldlauf und Turniere am Nachmittag. Für Kinder von 6 bis 14, in vier Altersgruppen.',
    ageFrom: 6,
    ageTo: 14,
    level: 'alle',
    locationId: 'harlaching',
    coachIds: ['mara-hoefer', 'niklas-persson', 'ekkehard-dietrich'],
    startDate: '2027-08-02',
    endDate: '2027-08-13',
    schedule: 'Mo–Fr, 8:30–16:30 Uhr · wochenweise buchbar',
    seats: 40,
    seatsTaken: 9,
    priceCents: 34500,
    imageSlot: 'camp-sommer',
    highlights: ['Vier Altersgruppen', 'Frühbetreuung ab 8 Uhr', 'Geschwisterrabatt'],
    provenance: 'demo',
  },

  // ---- Erwachsene --------------------------------------------------------
  {
    id: 'wiedereinstieg',
    kind: 'erwachsene',
    title: 'Wiedereinstieg · Nach Jahren zurück',
    teaser: 'Sechs Abende für alle, die früher mal gespielt haben.',
    description:
      'Der Kurs für alle, die den Schläger jahrelang im Keller hatten. Ruhiges Tempo, ' +
      'viel Wiederholung, Technik im eigenen Rhythmus. Am Ende steht ein lockeres Doppel — ' +
      'und meistens eine feste Spielrunde, die weiterspielt.',
    level: 'einsteiger',
    locationId: 'neuperlach',
    coachIds: ['ekkehard-dietrich'],
    startDate: '2026-09-14',
    endDate: '2026-10-19',
    schedule: 'Montags 18:30–20:00 Uhr · 6 Termine',
    seats: 6,
    seatsTaken: 3,
    priceCents: 19800,
    imageSlot: 'kurs-wiedereinstieg',
    highlights: ['Max. 6 Personen', 'Leihschläger vorhanden', 'Abschluss-Doppel'],
    provenance: 'demo',
  },
  {
    id: 'aufschlag-intensiv',
    kind: 'erwachsene',
    title: 'Aufschlag intensiv',
    teaser: 'Ein Wochenende, ein Schlag, spürbarer Unterschied.',
    description:
      'Zwei Tage nur Aufschlag: Wurf, Beinarbeit, Schulterrotation, Slice und Kick. ' +
      'Mit Videoaufnahme am Anfang und am Ende — der Vergleich ist Teil des Kurses.',
    level: 'fortgeschritten',
    locationId: 'harlaching',
    coachIds: ['niklas-persson'],
    startDate: '2026-10-24',
    endDate: '2026-10-25',
    schedule: 'Sa und So, jeweils 10:00–13:00 Uhr',
    seats: 8,
    seatsTaken: 5,
    priceCents: 15900,
    imageSlot: 'kurs-aufschlag',
    highlights: ['Videovergleich', 'Max. 8 Personen', 'Halle, wetterunabhängig'],
    provenance: 'demo',
  },
];

export const KIDS_COURSES = COURSES.filter((c) => c.kind === 'kids');
export const CAMPS = COURSES.filter((c) => c.kind === 'camp');
export const ADULT_COURSES = COURSES.filter((c) => c.kind === 'erwachsene');

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function seatsLeft(course: Course): number {
  return Math.max(0, course.seats - course.seatsTaken);
}
