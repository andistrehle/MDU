// ============================================================
// MDC — Spielorte von der Seite aus berichtigen
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Die Turnierleitung pflegt das unter
// `/admin/spielorte`, von dort wird diese Datei als Commit abgelegt
// (`lib/mdc/spielort-commit.ts`) — genau wie News, Kalender, Namen und
// Ergebnisse. Von Hand bearbeiten ist erlaubt; nur die Form muss stimmen,
// weil die Verwaltung sie wieder einliest.
//
// WOZU EINE ZWEITE DATEI? Maßgeblich bleibt die Spielorte-Übersicht des
// Betreibers, abgetippt in `VENUES_BASIS` (`data/venues.ts`) — mit
// Kommentaren, nach Wochentagen gruppiert, von Hand gepflegt. Ein Programm,
// das diese Datei umschreibt, müsste sie neu erzeugen und risse dabei alles
// heraus, was daran erklärend ist. Hier liegt deshalb nur, was sich geändert
// hat, und wird darübergelegt.
//
// JEDER EINTRAG MERKT SICH, WAS VORHER DASTAND (`vorher`). Er greift nur,
// solange die Übersicht diesen alten Wert noch führt. Zieht der Betreiber dort
// selbst nach — oder kommt zur neuen Saison eine neue Übersicht —, fällt der
// Eintrag von allein weg, statt eine überholte Zahl weiterzuschleppen.
// `scripts/mdc-check-saison.ts` meldet ihn dann als „ERLEDIGT".
//
// Ein Beispiel, warum das so sein muss: Im Harlekin stehen vier Automaten
// statt drei. Steht in der nächsten Übersicht des Betreibers ohnehin die Vier,
// wäre ein Eintrag „drei wird vier" nicht bloß überflüssig — er würde bei
// einer späteren Änderung auf fünf stillschweigend wieder die Vier erzwingen.
// ============================================================

import type { Venue } from './types';

/** Die Angaben eines Spielorts, die sich von der Seite aus ändern lassen. */
export type SpielortFeld =
  'name' | 'street' | 'zip' | 'city' | 'weekdays' | 'time' | 'phones' | 'boards';

/** Alle dieser Felder sind freiwillig — ein Eintrag ändert nur, was er nennt. */
export type SpielortFelder = Partial<Pick<Venue, SpielortFeld>>;

/** Die Reihenfolge, in der die Felder überall auftauchen. */
export const SPIELORT_FELDER: SpielortFeld[] =
  ['name', 'street', 'zip', 'city', 'weekdays', 'time', 'phones', 'boards'];

export const FELD_NAMEN: Record<SpielortFeld, string> = {
  name: 'Name',
  street: 'Straße',
  zip: 'PLZ',
  city: 'Ort',
  weekdays: 'Spieltage',
  time: 'Beginn',
  phones: 'Telefon',
  boards: 'Automaten',
};

export interface SpielortAenderung {
  /** Eines der Lokale aus `VENUES_BASIS`. */
  venueId: string;
  /** Was gilt. Nur die genannten Felder werden ersetzt. */
  neu: SpielortFelder;
  /**
   * Wie dieselben Felder in der Übersicht standen, als geändert wurde. Der
   * Eintrag greift nur, solange das noch stimmt.
   */
  vorher: SpielortFelder;
  /** Tag der Änderung, `JJJJ-MM-TT` — steht in der Verwaltung dabei. */
  datum: string;
  /** Kurze Begründung, z. B. „Wirt hat einen vierten Automaten aufgestellt". */
  note: string | null;
}

export const SPIELORT_AENDERUNGEN: SpielortAenderung[] = [];

/** Werte vergleichen — auch Listen (Spieltage, Telefonnummern). */
export function gleicherWert(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/**
 * Passt die Änderung noch auf diesen Eintrag der Übersicht? Verglichen wird
 * jedes Feld, das der Eintrag als `vorher` festgehalten hat.
 */
export function greiftAuf(aenderung: SpielortAenderung, basis: Venue): boolean {
  if (aenderung.venueId !== basis.id) return false;
  return (Object.keys(aenderung.vorher) as SpielortFeld[])
    .every(feld => gleicherWert(aenderung.vorher[feld], basis[feld]));
}

/** Die Änderung zu einem Lokal — oder `undefined`, wenn es keine gibt. */
export function aenderungFuer(basis: Venue): SpielortAenderung | undefined {
  return SPIELORT_AENDERUNGEN.find(a => greiftAuf(a, basis));
}

/** Übersicht plus Änderung. Ohne passende Änderung bleibt alles, wie es ist. */
export function wendeAn(basis: Venue): Venue {
  const aenderung = aenderungFuer(basis);
  return aenderung ? { ...basis, ...aenderung.neu } : basis;
}
