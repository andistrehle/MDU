// ============================================================
// MDC — Terminänderungen ins Repository schreiben
// ============================================================
//
// Wie bei News und Ergebnissen: Der Eintrag wird nicht in eine Datenbank
// gelegt, sondern als Commit in `data/kalender.ts` (siehe `lib/mdc/github.ts`).
// Der Push stößt den Neubau an, zwei Minuten später steht er online.
//
// Die Einträge stehen dort als JSON-Array. Deshalb wird beim Schreiben nicht
// im Text herumgeschnitten, sondern der Stand aus GitHub gelesen, die Liste
// als Ganzes eingelesen, geändert und wieder ausgegeben.
// ============================================================

import 'server-only';
import type { Terminaenderung } from '@/data/kalender';
import { CommitFehler, committe, kontext, leseDatei } from './github';

const PFAD = 'data/kalender.ts';
const ANFANG = 'export const KALENDER: Terminaenderung[] = ';

function leseTermine(quelle: string): Terminaenderung[] {
  const von = quelle.indexOf(ANFANG);
  if (von === -1) throw new CommitFehler('In data/kalender.ts fehlt die Liste KALENDER.');
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste KALENDER ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as Terminaenderung[];
  } catch {
    throw new CommitFehler(
      'Die Liste KALENDER in data/kalender.ts ist nicht mehr maschinenlesbar. '
      + 'Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

function schreibeTermine(quelle: string, termine: Terminaenderung[]): string {
  const von = quelle.indexOf(ANFANG);
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  // Sortiert abgelegt: Die Datei liest sich dann wie ein Kalender.
  const sortiert = [...termine]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  return quelle.slice(0, start) + JSON.stringify(sortiert, null, 2) + quelle.slice(bis + 1);
}

/** „2026-09-10" + „fiakerstueberl" + „absage" → „2026-09-10-fiakerstueberl-absage" */
export function terminId(date: string, venueId: string, art: string): string {
  return `${date}-${venueId}-${art}`;
}

/**
 * Legt eine Änderung ab. Gibt die Adresse des Commits zurück — damit ist
 * nachprüfbar, was geschrieben wurde.
 */
export async function speichereTermin(
  eintrag: Terminaenderung,
): Promise<{ sha: string; url: string; neu: boolean }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseTermine(quelle);

  const ohneAlten = bisher.filter(t => t.id !== eintrag.id);
  const neu = ohneAlten.length === bisher.length;

  // Absage und Zusatz am selben Tag im selben Lokal wäre widersprüchlich.
  const gegenteil = eintrag.art === 'absage' ? 'zusatz' : 'absage';
  if (ohneAlten.some(t => t.date === eintrag.date && t.venueId === eintrag.venueId && t.art === gegenteil)) {
    throw new CommitFehler(
      `Für diesen Tag steht dort schon ${gegenteil === 'absage' ? 'eine Absage' : 'ein Zusatztermin'}. `
      + 'Bitte den vorhandenen Eintrag zuerst entfernen.',
    );
  }

  const nachricht = [
    eintrag.art === 'absage'
      ? `MDC Kalender: ${eintrag.venueId} am ${eintrag.date} fällt aus`
      : `MDC Kalender: Zusatztermin ${eintrag.venueId} am ${eintrag.date}`,
    '',
    neu ? 'Neuer Eintrag.' : 'Eintrag geändert.',
    eintrag.note ? `Hinweis: ${eintrag.note}` : '',
  ].filter(Boolean).join('\n');

  const commit = await committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeTermine(quelle, [...ohneAlten, eintrag]) }],
    nachricht,
  );
  return { ...commit, neu };
}

/** Nimmt eine Änderung zurück — der Termin gilt dann wieder wie geplant. */
export async function loescheTermin(id: string): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseTermine(quelle);
  const uebrig = bisher.filter(t => t.id !== id);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`Es gibt keinen Kalendereintrag mit der Kennung „${id}".`);
  }
  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeTermine(quelle, uebrig) }],
    `MDC Kalender: Eintrag „${id}" zurückgenommen`,
  );
}
