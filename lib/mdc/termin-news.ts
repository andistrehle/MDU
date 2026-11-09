// ============================================================
// MDC — Aus einer Terminänderung wird ein News-Beitrag
// ============================================================
//
// Betreiber, 09.11.2026: „künftig: automatisch anlegen wenn jemand ein Termin
// absagt oder ansetzt."
//
// Warum überhaupt: Ein Zusatztermin oder eine Absage steht zwar sofort im
// Wochenplan und beim Lokal — aber nur, wer dort nachsieht, erfährt davon.
// Die Leute schauen auf die Startseite und in die Facebook-Gruppe. Also legt
// jede Änderung ihren eigenen kurzen Beitrag an, unter „Termine".
//
// DER BEITRAG HÄNGT AM EINTRAG, nicht am Menschen, der ihn geschrieben hat:
// Die Kennung ist aus der Kennung des Kalendereintrags abgeleitet
// (`termin-2026-11-10-ambasador-absage`). Wird der Eintrag geändert, wird der
// Beitrag ersetzt; wird er zurückgenommen, verschwindet auch der Beitrag —
// eine Absage, die wieder abgesagt ist, darf nicht als News stehenbleiben.
//
// Geschrieben wird er im SELBEN Commit wie der Kalendereintrag (siehe
// `kalender-commit.ts`): zwei Commits wären zwei Neubauten bei Vercel, und
// dazwischen läge ein Stand, in dem der Beitrag von einem Termin erzählt, den
// es noch nicht gibt.
//
// Der Text ist absichtlich kurz und besteht aus Tatsachen (Tag, Lokal, Zeit,
// Grund). Es wird nichts dazuerfunden und nichts beworben — wer es schreibt,
// ist ein Programm.
// ============================================================

import type { Terminaenderung } from '@/data/kalender';
import type { NewsPost } from '@/data/news';
import { getVenue } from '@/data/venues';
import { formatDate, formatTime, weekdayName } from '@/lib/mdc/format';

/**
 * Macht aus dem, was ein Wirt ins Feld getippt hat, einen Satz: Punkt dran,
 * wenn keiner da ist. „Veranstaltung im Lokal" und „Veranstaltung im Lokal!"
 * sollen beide sauber im Fließtext stehen.
 */
function satz(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** `2026-11-10-ambasador-absage` → `termin-2026-11-10-ambasador-absage` */
export function terminBeitragId(terminId: string): string {
  return `termin-${terminId}`;
}

/**
 * Der Beitrag zu einer Terminänderung — oder `null`, wenn sich keiner
 * schreiben lässt (unbekanntes Lokal). Dann wird eben keiner angelegt; der
 * Kalendereintrag ist das Wichtigere und darf daran nicht scheitern.
 *
 * `heute` ist das Datum des Beitrags (wann es bekannt wurde), NICHT der Tag
 * des Termins: Danach sortiert die Startseite, und bekannt wurde es heute.
 */
export function terminBeitrag(eintrag: Terminaenderung, heute: string): NewsPost | null {
  const venue = getVenue(eintrag.venueId);
  if (!venue) return null;

  const tag = `${weekdayName(eintrag.date)}, ${formatDate(eintrag.date)}`;
  const grund = (eintrag.note ?? '').trim();

  if (eintrag.art === 'absage') {
    return {
      id: terminBeitragId(eintrag.id),
      date: heute,
      title: `Kein Ranking am ${formatDate(eintrag.date)} im ${venue.name}`,
      teaser: `Das Ranking am ${tag} im ${venue.name} fällt aus${grund ? `: ${satz(grund)}` : '.'}`,
      category: 'Termine',
      paragraphs: [
        `Am **${tag}** gibt es im **${venue.name}** kein Ranking.`
        + (grund ? ` Grund: ${satz(grund)}` : '')
        + ' Der Termin steht durchgestrichen im Wochenplan. Danach läuft wieder alles wie gewohnt.',
      ],
      published: true,
    };
  }

  const zeit = formatTime(eintrag.time ?? venue.time);
  return {
    id: terminBeitragId(eintrag.id),
    date: heute,
    title: `Zusätzliches Ranking am ${formatDate(eintrag.date)} im ${venue.name}`,
    teaser: `Am ${tag} gibt es im ${venue.name} ein zusätzliches Ranking, Beginn ${zeit}.`,
    category: 'Termine',
    paragraphs: [
      `Am **${tag}** gibt es im **${venue.name}** ein zusätzliches Ranking. Beginn: **${zeit}**.`
      + (grund ? ` ${satz(grund)}` : '')
      + ' Angemeldet wird wie immer vor Ort im Lokal.',
    ],
    published: true,
  };
}
