// ============================================================
// Tennis Kail — Events und Turniere (DEMO)
// ============================================================
//
// Frei erfundene Demo-Inhalte. Die Turnierbäume zeigen, wie eine
// Turnierverwaltung mit Auslosung, Ergebniseingabe und Live-Tableau
// aussehen kann.
// ============================================================

import type { ClubEvent, Tournament } from '@/lib/tk/types';

export const EVENTS: ClubEvent[] = [
  {
    id: 'sommerfest-2026',
    title: 'Sommerfest mit Schleifchenturnier',
    teaser: 'Doppel in wechselnder Besetzung, danach Grillen bis es dunkel wird.',
    description:
      'Der Klassiker zum Saisonhöhepunkt: Ab 14 Uhr Schleifchenturnier auf allen Plätzen, ' +
      'jede Runde neue Partner. Ab 18 Uhr Grill, Musik und Siegerehrung. Wer nicht spielt, ' +
      'kommt trotzdem — das Fest ist offen für alle.',
    startDate: '2026-08-29',
    time: '14:00–23:00 Uhr',
    locationId: 'neuperlach',
    category: 'familie',
    seats: 64,
    seatsTaken: 41,
    priceCents: 1500,
    imageSlot: 'event-sommerfest',
    provenance: 'demo',
  },
  {
    id: 'nightsession-2026-09',
    title: 'Night Session · Flutlicht-Doppel',
    teaser: 'Vier Plätze, Flutlicht, Doppel bis 23 Uhr.',
    description:
      'Einmal im Monat bleibt das Flutlicht an. Offene Doppelrunde ohne Anmeldung — ' +
      'einfach kommen, Namen auf die Tafel, mitspielen. Getränke gibt es am Kiosk.',
    startDate: '2026-09-11',
    time: '19:00–23:00 Uhr',
    locationId: 'neuperlach',
    category: 'clubabend',
    priceCents: 800,
    imageSlot: 'event-night',
    provenance: 'demo',
  },
  {
    id: 'hallensaison-2026',
    title: 'Start der Hallensaison',
    teaser: 'Teppich frisch gereinigt, Abos ab jetzt buchbar.',
    description:
      'Ab dem 1. Oktober läuft der Hallenbetrieb wieder im Winterplan. Feste Abo-Stunden ' +
      'werden ab September vergeben, freie Restzeiten bleiben online buchbar.',
    startDate: '2026-10-01',
    time: 'ab 8:00 Uhr',
    locationId: 'harlaching',
    category: 'saison',
    imageSlot: 'event-halle',
    provenance: 'demo',
  },
  {
    id: 'kail-open-2026',
    title: 'Kail Open · Herbstturnier',
    teaser: 'Offenes Einzelturnier, Haupt- und Nebenrunde.',
    description:
      'Das Herbstturnier auf Sand, offen für Mitglieder und Gäste. Hauptrunde ab LK 15, ' +
      'Nebenrunde für alle. Gespielt wird zwei Gewinnsätze, Match-Tiebreak im dritten.',
    startDate: '2026-09-26',
    endDate: '2026-09-27',
    time: 'Sa ab 9:00, So ab 10:00 Uhr',
    locationId: 'neuperlach',
    category: 'turnier',
    seats: 32,
    seatsTaken: 22,
    priceCents: 2500,
    imageSlot: 'event-turnier',
    provenance: 'demo',
  },
  {
    id: 'familientag-2026',
    title: 'Familientag · Eltern gegen Kinder',
    teaser: 'Ein Nachmittag, gemischte Doppel, keine Ergebnislisten.',
    description:
      'Kinder spielen mit Eltern, Großeltern oder Paten. Kleinfeld für die Kleinen, ' +
      'Großfeld für alle anderen, Kuchen für jeden. Ohne Wertung, ohne Meldeschluss.',
    startDate: '2026-10-11',
    time: '13:00–18:00 Uhr',
    locationId: 'harlaching',
    category: 'familie',
    priceCents: 0,
    imageSlot: 'event-familie',
    provenance: 'demo',
  },
];

export function getEvent(id: string): ClubEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

export const TOURNAMENTS: Tournament[] = [
  {
    id: 'kail-open-2026',
    title: 'Kail Open 2026 · Herren Einzel',
    date: '2026-09-26',
    locationId: 'neuperlach',
    mode: 'K.-o., zwei Gewinnsätze, Match-Tiebreak im dritten',
    drawSize: 16,
    registered: 14,
    entryCents: 2500,
    status: 'anmeldung',
    rounds: [
      {
        name: 'Achtelfinale',
        matches: [
          { a: 'Jonas Bauer', b: 'Freilos' },
          { a: 'Timo Wenzel', b: 'Sebastian Frey' },
          { a: 'Andreas Lang', b: 'Kilian Ostermeier' },
          { a: 'Paul Reinhardt', b: 'Freilos' },
          { a: 'Marek Duda', b: 'Christoph Wimmer' },
          { a: 'Felix Sander', b: 'Freilos' },
          { a: 'David Kirchner', b: 'Nico Baumgartner' },
          { a: 'Lukas Haderer', b: 'Freilos' },
        ],
      },
      { name: 'Viertelfinale', matches: [] },
      { name: 'Halbfinale', matches: [] },
      { name: 'Finale', matches: [] },
    ],
  },
  {
    id: 'wintercup-2026',
    title: 'Wintercup 2026 · Doppel',
    date: '2026-01-24',
    locationId: 'harlaching',
    mode: 'Gruppenphase, danach K.-o.',
    drawSize: 8,
    registered: 8,
    entryCents: 3000,
    status: 'beendet',
    rounds: [
      {
        name: 'Halbfinale',
        matches: [
          { a: 'Bauer / Frey', b: 'Lang / Wimmer', score: '6:4, 3:6, 10:7', winner: 'a' },
          { a: 'Duda / Sander', b: 'Kirchner / Haderer', score: '7:5, 6:3', winner: 'a' },
        ],
      },
      {
        name: 'Finale',
        matches: [{ a: 'Bauer / Frey', b: 'Duda / Sander', score: '6:3, 4:6, 10:8', winner: 'a' }],
      },
    ],
  },
];

export function getTournament(id: string): Tournament | undefined {
  return TOURNAMENTS.find((t) => t.id === id);
}
