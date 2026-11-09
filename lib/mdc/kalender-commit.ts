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
//
// SEIT 09.11.2026 WIRD `data/news.ts` MITGESCHRIEBEN: Jede Änderung legt
// zugleich einen kurzen Beitrag unter „Termine" an (`termin-news.ts`) — im
// SELBEN Commit, sonst wären es zwei Neubauten bei Vercel. Scheitert nur der
// Beitrag, wird der Termin trotzdem abgelegt; umgekehrt nicht.
// ============================================================

import 'server-only';
import type { Terminaenderung } from '@/data/kalender';
import { todayInMunich } from '@/data/season';
import { CommitFehler, committe, kontext, leseDatei, type GhKontext } from './github';
import { NEWS_PFAD, leseBeitraege, schreibeBeitraege } from './news-commit';
import { terminBeitrag, terminBeitragId } from './termin-news';

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
 * Der News-Beitrag zu einer Terminänderung, als Datei für denselben Commit.
 *
 * `eintrag === null` heißt: Der Termin wird zurückgenommen, der Beitrag
 * gehört also weg — eine Absage, die nicht mehr gilt, darf nicht als News
 * stehenbleiben.
 *
 * SCHEITERT DAS HIER, SCHEITERT NICHT DER TERMIN. Der Kalendereintrag ist das
 * Wichtigere: Er steuert Wochenplan, Startseite und Lokal-Seite. Lässt sich
 * `data/news.ts` gerade nicht lesen (von Hand verändert, Form zerstört), wird
 * eben kein Beitrag geschrieben, statt den Wirt mit einer Fehlermeldung
 * stehen zu lassen, die mit seinem Termin nichts zu tun hat.
 */
async function newsDatei(
  ctx: GhKontext,
  terminKennung: string,
  eintrag: Terminaenderung | null,
): Promise<{ pfad: string; inhalt: string }[]> {
  try {
    const beitrag = eintrag ? terminBeitrag(eintrag, todayInMunich()) : null;
    if (eintrag && !beitrag) return [];

    const quelle = await leseDatei(ctx, NEWS_PFAD);
    const bisher = leseBeitraege(quelle);
    const kennung = terminBeitragId(terminKennung);
    const ohneAlten = bisher.filter(b => b.id !== kennung);

    // Nichts zu tun: Es gibt keinen Beitrag und es soll auch keiner hin.
    if (!beitrag && ohneAlten.length === bisher.length) return [];

    return [{
      pfad: NEWS_PFAD,
      // Nach VORN: Bei gleichem Datum bleibt die Reihenfolge stehen, der neue
      // Beitrag gehört innerhalb seines Tages nach oben.
      inhalt: schreibeBeitraege(quelle, beitrag ? [beitrag, ...ohneAlten] : ohneAlten),
    }];
  } catch (fehler) {
    console.error('[mdc] News-Beitrag zum Termin konnte nicht erzeugt werden', fehler);
    return [];
  }
}

/**
 * Legt eine Änderung ab. Gibt die Adresse des Commits zurück — damit ist
 * nachprüfbar, was geschrieben wurde.
 *
 * Dabei entsteht IM SELBEN COMMIT ein kurzer News-Beitrag unter „Termine"
 * (siehe `termin-news.ts`): Im Wochenplan steht der Termin ohnehin, aber dort
 * sieht nur nach, wer schon weiß, dass es etwas zu sehen gibt.
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
    [
      { pfad: PFAD, inhalt: schreibeTermine(quelle, [...ohneAlten, eintrag]) },
      ...await newsDatei(ctx, eintrag.id, eintrag),
    ],
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
    [
      { pfad: PFAD, inhalt: schreibeTermine(quelle, uebrig) },
      // Der Beitrag dazu geht mit — sonst stünde auf der Startseite weiter,
      // das Ranking falle aus.
      ...await newsDatei(ctx, id, null),
    ],
    `MDC Kalender: Eintrag „${id}" zurückgenommen`,
  );
}
