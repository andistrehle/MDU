// ============================================================
// MDC — Spielort-Änderungen ins Repository schreiben
// ============================================================
//
// Wie bei News, Kalender und Ergebnissen: Der Eintrag wird nicht in eine
// Datenbank gelegt, sondern als Commit in `data/spielorte-aenderungen.ts`
// (siehe `lib/mdc/github.ts`). Der Push stößt den Neubau an, zwei Minuten
// später steht die Änderung online — auf der Spielorte-Seite, im Wochenplan
// und überall sonst, weil alles mit derselben Liste rechnet.
//
// Die Einträge stehen dort als JSON-Array. Deshalb wird beim Schreiben nicht
// im Text herumgeschnitten, sondern der Stand aus GitHub gelesen, die Liste
// als Ganzes eingelesen, geändert und wieder ausgegeben.
// ============================================================

import 'server-only';
import type { SpielortAenderung } from '@/data/spielorte-aenderungen';
import type { EntfernterSpielort } from '@/data/spielorte-entfernt';
import type { Venue } from '@/data/types';
import { CommitFehler, committe, kontext, leseDatei } from './github';

const PFAD = 'data/spielorte-aenderungen.ts';
const ANFANG = 'export const SPIELORT_AENDERUNGEN: SpielortAenderung[] = ';

function leseAenderungen(quelle: string): SpielortAenderung[] {
  const von = quelle.indexOf(ANFANG);
  if (von === -1) {
    throw new CommitFehler(`In ${PFAD} fehlt die Liste SPIELORT_AENDERUNGEN.`);
  }
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste SPIELORT_AENDERUNGEN ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as SpielortAenderung[];
  } catch {
    throw new CommitFehler(
      `Die Liste SPIELORT_AENDERUNGEN in ${PFAD} ist nicht mehr maschinenlesbar. `
      + 'Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

function schreibeAenderungen(quelle: string, liste: SpielortAenderung[]): string {
  const von = quelle.indexOf(ANFANG);
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  // Nach Lokal sortiert — die Datei liest sich dann wie die Spielorte-Liste.
  const sortiert = [...liste].sort((a, b) => a.venueId.localeCompare(b.venueId));
  return quelle.slice(0, start) + JSON.stringify(sortiert, null, 2) + quelle.slice(bis + 1);
}

/**
 * Legt die Änderung zu EINEM Lokal ab — und ersetzt dabei eine frühere
 * Änderung zu demselben Lokal, statt sie zu ergänzen. Zwei Einträge für
 * dasselbe Lokal gäbe es sonst nach der zweiten Berichtigung, und welcher
 * gilt, müsste man raten.
 */
export async function speichereSpielort(
  eintrag: SpielortAenderung,
  /** Für die Commit-Nachricht: „Harlekin: Automaten 3 → 4". */
  beschreibung: string,
): Promise<{ sha: string; url: string; neu: boolean }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseAenderungen(quelle);
  const ohneAlte = bisher.filter(a => a.venueId !== eintrag.venueId);
  const neu = ohneAlte.length === bisher.length;

  const nachricht = [
    `MDC Spielort: ${beschreibung}`,
    [
      neu ? 'Über /admin/spielorte geändert.' : 'Über /admin/spielorte erneut geändert.',
      eintrag.note ? `Begründung: ${eintrag.note}` : '',
    ].filter(Boolean).join('\n'),
  ].join('\n\n');

  const commit = await committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeAenderungen(quelle, [...ohneAlte, eintrag]) }],
    nachricht,
  );
  return { ...commit, neu };
}

/**
 * Nimmt die Änderung zu einem Lokal zurück — es gilt dann wieder, was in der
 * Übersicht des Betreibers steht.
 */
export async function setzeSpielortZurueck(
  venueId: string,
  beschreibung: string,
): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseAenderungen(quelle);
  const uebrig = bisher.filter(a => a.venueId !== venueId);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`Für „${beschreibung}" steht dort gar keine Änderung.`);
  }
  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeAenderungen(quelle, uebrig) }],
    `MDC Spielort: ${beschreibung} wieder wie in der Übersicht\n\n`
    + 'Die Änderung von /admin/spielorte wurde zurückgenommen.',
  );
}

// ------------------------------------------------------------
// Neue Lokale
// ------------------------------------------------------------
//
// Angelegt wird in `data/spielorte-neu.ts` — einer eigenen Liste, nicht in der
// Übersicht des Betreibers. Die ist von Hand gepflegt und kommentiert; ein
// Programm, das sie neu erzeugt, risse das heraus.
//
// Geändert wird so ein Lokal DIREKT hier und nicht über eine Überlagerung:
// Diese Liste gehört der Seite, es gibt keine ältere Fassung, über die sich
// eine Berichtigung legen müsste.

const NEU_PFAD = 'data/spielorte-neu.ts';
const NEU_ANFANG = 'export const NEUE_SPIELORTE: Venue[] = ';

function leseNeue(quelle: string): Venue[] {
  const von = quelle.indexOf(NEU_ANFANG);
  if (von === -1) throw new CommitFehler(`In ${NEU_PFAD} fehlt die Liste NEUE_SPIELORTE.`);
  const start = von + NEU_ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste NEUE_SPIELORTE ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as Venue[];
  } catch {
    throw new CommitFehler(
      `Die Liste NEUE_SPIELORTE in ${NEU_PFAD} ist nicht mehr maschinenlesbar. `
      + 'Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

function schreibeNeue(quelle: string, liste: Venue[]): string {
  const von = quelle.indexOf(NEU_ANFANG);
  const start = von + NEU_ANFANG.length;
  const bis = quelle.indexOf('];', start);
  // In der Reihenfolge, in der die Lokale dazugekommen sind — nicht sortiert.
  // Wer die Datei aufmacht, sieht damit die Geschichte.
  return quelle.slice(0, start) + JSON.stringify(liste, null, 2) + quelle.slice(bis + 1);
}

/** Legt ein neues Lokal an. */
export async function legeSpielortAn(
  venue: Venue,
): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, NEU_PFAD);
  const bisher = leseNeue(quelle);
  if (bisher.some(v => v.id === venue.id)) {
    throw new CommitFehler(
      `Ein Lokal mit der Kennung „${venue.id}" gibt es dort schon. Bitte die Seite neu laden.`,
    );
  }

  return committe(
    ctx,
    [{ pfad: NEU_PFAD, inhalt: schreibeNeue(quelle, [...bisher, venue]) }],
    [
      `MDC Spielort: ${venue.name} neu angelegt`,
      '',
      `${venue.street}, ${venue.zip} ${venue.city}`,
      `Spieltag: ${venue.weekdays.join(', ')} · Beginn ${venue.time}`,
      venue.boards === null ? 'Automaten: noch nicht bekannt' : `${venue.boards} Dartautomaten`,
      '',
      'Über /admin/spielorte angelegt.',
    ].join('\n'),
  );
}

/** Ändert ein Lokal, das auf der Seite angelegt wurde. */
export async function aendereNeuenSpielort(
  venue: Venue,
  beschreibung: string,
): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, NEU_PFAD);
  const bisher = leseNeue(quelle);
  if (!bisher.some(v => v.id === venue.id)) {
    throw new CommitFehler(
      `Das Lokal „${venue.id}" steht nicht (mehr) in ${NEU_PFAD}. Bitte die Seite neu laden.`,
    );
  }
  const liste = bisher.map(v => (v.id === venue.id ? venue : v));

  return committe(
    ctx,
    [{ pfad: NEU_PFAD, inhalt: schreibeNeue(quelle, liste) }],
    `MDC Spielort: ${beschreibung}\n\nÜber /admin/spielorte geändert.`,
  );
}

/**
 * Nimmt ein auf der Seite angelegtes Lokal wieder zurück.
 *
 * Nur, solange dort noch nichts gespielt wurde — das prüft die Aktion, bevor
 * sie hierherkommt. Ein Lokal mit Turnieren zu entfernen hieße, Ergebnissen
 * ihren Ort zu nehmen.
 */
export async function entferneNeuenSpielort(
  venueId: string,
  name: string,
): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, NEU_PFAD);
  const bisher = leseNeue(quelle);
  const uebrig = bisher.filter(v => v.id !== venueId);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`Das Lokal „${name}" steht dort gar nicht.`);
  }
  return committe(
    ctx,
    [{ pfad: NEU_PFAD, inhalt: schreibeNeue(quelle, uebrig) }],
    `MDC Spielort: ${name} wieder entfernt\n\n`
    + 'Über /admin/spielorte angelegt und zurückgenommen; dort wurde nie gespielt.',
  );
}

// ------------------------------------------------------------
// Lokale herausnehmen (Betreiber, 26.11.2026)
// ------------------------------------------------------------
//
// Bis dahin ließ sich nur ein Lokal zurücknehmen, das auf der Seite angelegt
// worden war und an dem noch kein Turnier hing. Alles andere ging nur von
// Hand in `data/venues.ts`. Jetzt geht beides von der Seite aus:
//
//   • Lokal auf der Seite angelegt, nie gespielt  → wirklich weg
//     (`entferneNeuenSpielort`, siehe oben — die Datei bleibt sauber).
//   • Alles andere → Eintrag in `data/spielorte-entfernt.ts`. Es verschwindet
//     aus dem laufenden Betrieb, die alten Ergebnisse behalten ihren Ort.
// ------------------------------------------------------------

const ENTFERNT_PFAD = 'data/spielorte-entfernt.ts';
const ENTFERNT_ANFANG = 'export const ENTFERNTE_SPIELORTE: EntfernterSpielort[] = ';

function leseEntfernte(quelle: string): EntfernterSpielort[] {
  const von = quelle.indexOf(ENTFERNT_ANFANG);
  if (von === -1) {
    throw new CommitFehler(`In ${ENTFERNT_PFAD} fehlt die Liste ENTFERNTE_SPIELORTE.`);
  }
  const start = von + ENTFERNT_ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste ENTFERNTE_SPIELORTE ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as EntfernterSpielort[];
  } catch {
    throw new CommitFehler(
      `Die Liste ENTFERNTE_SPIELORTE in ${ENTFERNT_PFAD} ist nicht mehr maschinenlesbar. `
      + 'Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

function schreibeEntfernte(quelle: string, liste: EntfernterSpielort[]): string {
  const von = quelle.indexOf(ENTFERNT_ANFANG);
  const start = von + ENTFERNT_ANFANG.length;
  const bis = quelle.indexOf('];', start);
  // Nach Lokal sortiert — wie die Änderungen, damit sich beide Dateien gleich
  // lesen.
  const sortiert = [...liste].sort((a, b) => a.venueId.localeCompare(b.venueId));
  return quelle.slice(0, start) + JSON.stringify(sortiert, null, 2) + quelle.slice(bis + 1);
}

/** Nimmt ein Lokal aus dem laufenden Betrieb — die Ergebnisse behalten es. */
export async function nimmSpielortHeraus(
  eintrag: EntfernterSpielort,
  /** Wie viele Turniere daran hängen — steht in der Commit-Nachricht. */
  turniere: number,
): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, ENTFERNT_PFAD);
  const bisher = leseEntfernte(quelle);
  if (bisher.some(e => e.venueId === eintrag.venueId)) {
    throw new CommitFehler(
      `${eintrag.name} ist dort schon herausgenommen. Bitte die Seite neu laden.`,
    );
  }

  return committe(
    ctx,
    [{ pfad: ENTFERNT_PFAD, inhalt: schreibeEntfernte(quelle, [...bisher, eintrag]) }],
    [
      `MDC Spielort: ${eintrag.name} herausgenommen`,
      '',
      eintrag.note ? `Grund: ${eintrag.note}` : 'Ohne Begründung eingetragen.',
      turniere > 0
        ? `${turniere} ausgewertete Turniere behalten den Namen (früheres Lokal).`
        : 'Dort wurde nie gespielt.',
      '',
      'Über /admin/spielorte herausgenommen, dort auch wieder aufnehmbar.',
    ].join('\n'),
  );
}

/** Nimmt ein herausgenommenes Lokal wieder in den Betrieb. */
export async function nimmSpielortWiederAuf(
  venueId: string,
  name: string,
): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, ENTFERNT_PFAD);
  const bisher = leseEntfernte(quelle);
  const uebrig = bisher.filter(e => e.venueId !== venueId);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`${name} ist gar nicht herausgenommen. Bitte die Seite neu laden.`);
  }
  return committe(
    ctx,
    [{ pfad: ENTFERNT_PFAD, inhalt: schreibeEntfernte(quelle, uebrig) }],
    `MDC Spielort: ${name} wieder aufgenommen\n\n`
    + 'Steht wieder im Wochenplan, auf der Spielorte-Seite und im Ergebnis-Upload.',
  );
}
