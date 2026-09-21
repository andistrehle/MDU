// ============================================================
// BeDV-Demo — Termine und Veranstaltungen
// ============================================================
//
// FREI ERFUNDEN, aber nach dem Jahreslauf eines Ligaverbands gebaut:
// Finaltag, Einzelmeisterschaft, Verbandstag, Schulung, Abschlussfeier.
// Die Daten sind relativ zum heutigen Tag gerechnet, damit im Gespräch
// immer etwas bevorsteht (siehe `data/bedv/news.ts`).
// ============================================================

import { heute, plusTage } from '@/lib/bedv/format';
import type { Termin } from './typen';

interface Roh extends Omit<Termin, 'datum' | 'demo'> {
  inTagen: number;
}

const ROH: Roh[] = [
  {
    slug: 'schulung-spielbericht',
    inTagen: 12,
    titel: 'Schulung: digitaler Spielbericht',
    uhrzeit: '19:00',
    ort: 'Online (Videokonferenz)',
    kategorie: 'Schulung',
    beschreibung:
      'Eine Stunde für Mannschaftsführer: Paarungen erfassen, Legs eintragen, Highlights '
      + 'melden, Bericht freigeben. Dazu der Papierweg über Foto-Upload. Fragen jederzeit.',
    aktion: 'Platz vormerken',
  },
  {
    slug: 'pokal-rueckspiele-halbfinale',
    inTagen: 21,
    titel: 'Pokal-Halbfinale, Rückspiele',
    uhrzeit: '20:00',
    ort: 'Bei den Mannschaften',
    kategorie: 'Turnier',
    beschreibung:
      'Die beiden Rückspiele des Verbandspokals. Gezählt werden beide Spiele zusammen; bei '
      + 'Gleichstand entscheidet ein Stechleg.',
    aktion: 'Paarungen ansehen',
  },
  {
    slug: 'einzelmeisterschaft',
    inTagen: 35,
    titel: 'Bayerische E-Dart-Einzelmeisterschaft',
    uhrzeit: '10:00',
    ort: 'Dart-Arena Rosenheim',
    kategorie: 'Turnier',
    beschreibung:
      'Offen für alle gemeldeten Spielerinnen und Spieler des Verbands. Gespielt wird im '
      + 'Doppel-K.-o., 501 Double-Out, drei Gewinnlegs — ab dem Viertelfinale vier.',
    aktion: 'Zur Ausschreibung',
  },
  {
    slug: 'pokalfinale',
    inTagen: 49,
    titel: 'Pokalfinale',
    uhrzeit: '18:00',
    ort: 'Sportsbar Triple 20, Augsburg',
    kategorie: 'Finale',
    beschreibung:
      'Das Endspiel um den Verbandspokal an neutralem Ort, mit Siegerehrung im Anschluss. '
      + 'Zuschauer sind ausdrücklich willkommen.',
    aktion: 'Zum Turnierbaum',
  },
  {
    slug: 'ligafinaltag',
    inTagen: 84,
    titel: 'Ligafinaltag',
    uhrzeit: '14:00',
    ort: 'Checkout Lounge, Ingolstadt',
    kategorie: 'Finale',
    beschreibung:
      'Der letzte Spieltag aller Staffeln an einem Ort und zur selben Zeit. Meister, '
      + 'Aufsteiger und Absteiger stehen am Abend fest.',
    aktion: 'Tabellenstand ansehen',
  },
  {
    slug: 'verbandstag',
    inTagen: 112,
    titel: 'Ordentlicher Verbandstag',
    uhrzeit: '11:00',
    ort: 'Gasthaus Zur Scheibe, Nürnberg',
    kategorie: 'Verband',
    beschreibung:
      'Berichte, Kassenprüfung, Entlastung und Anträge zur Spielordnung. Jeder '
      + 'Mitgliedsverein hat eine Stimme.',
    aktion: 'Unterlagen öffnen',
  },
  {
    slug: 'saisonabschluss',
    inTagen: 126,
    titel: 'Saisonabschluss und Ehrungen',
    uhrzeit: '19:00',
    ort: 'Dart-Arena Rosenheim',
    kategorie: 'Feier',
    beschreibung:
      'Ehrung der Meister, der Pokalsieger und der Bestenlisten — höchstes Finish, '
      + 'meiste 180er, kürzestes Leg. Danach offenes Spielen an allen Automaten.',
    aktion: 'Anmeldung öffnen',
  },
];

export const TERMINE: Termin[] = ROH
  .map(({ inTagen, ...rest }) => ({
    ...rest,
    datum: plusTage(heute(), inTagen),
    demo: true as const,
  }))
  .sort((a, b) => (a.datum < b.datum ? -1 : 1));

export function terminBySlug(slug: string): Termin | undefined {
  return TERMINE.find(t => t.slug === slug);
}

/** Die nächsten Termine — für Startseite und Seitenspalten. */
export function naechsteTermine(anzahl: number): Termin[] {
  return TERMINE.slice(0, anzahl);
}
