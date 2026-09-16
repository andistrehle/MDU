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
