// ============================================================
// MDC — News-Beiträge ins Repository schreiben
// ============================================================
//
// Wie bei den Ergebnissen: Der Beitrag wird nicht in eine Datenbank gelegt,
// sondern als Commit in `data/news.ts` (siehe `lib/mdc/github.ts`). Der Push
// stößt den Neubau an, zwei Minuten später steht er online.
//
// Die Beiträge stehen dort als JSON-Array. Deshalb wird beim Schreiben nicht
// im Text herumgeschnitten, sondern der Stand aus GitHub gelesen, die Liste
// als Ganzes eingelesen, geändert und wieder ausgegeben. Ein Beitrag mit
// Anführungszeichen, Zeilenumbrüchen oder Sternchen kann so nichts zerlegen.
// ============================================================

import 'server-only';
import type { NewsPost } from '@/data/news';
import { CommitFehler, committe, kontext, leseDatei } from './github';

const PFAD = 'data/news.ts';
const ANFANG = 'export const NEWS: NewsPost[] = ';

/** Die Beiträge aus der Datei. */
function leseBeitraege(quelle: string): NewsPost[] {
  const von = quelle.indexOf(ANFANG);
  if (von === -1) throw new CommitFehler('In data/news.ts fehlt die Liste NEWS.');
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste NEWS ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as NewsPost[];
  } catch {
    throw new CommitFehler(
      'Die Liste NEWS in data/news.ts ist nicht mehr maschinenlesbar. '
      + 'Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

/** Die Datei mit einer neuen Liste, sonst unverändert. */
function schreibeBeitraege(quelle: string, beitraege: NewsPost[]): string {
  const von = quelle.indexOf(ANFANG);
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  // Sortiert abgelegt: Die Datei liest sich dann wie die Seite, neueste oben.
  const sortiert = [...beitraege]
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return quelle.slice(0, start) + JSON.stringify(sortiert, null, 2) + quelle.slice(bis + 1);
}

/** „Neue Spielorte ab Oktober" → „neue-spielorte-ab-oktober" */
export function newsId(titel: string, datum: string): string {
  const slug = titel
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  // Ohne Titel bliebe die Adresse leer — dann tut es das Datum.
  return slug || `beitrag-${datum}`;
}

export interface NewsAblage {
  beitrag: NewsPost;
  /** Kennung des Beitrags, der ersetzt wird. Leer = neuer Beitrag. */
  ersetzt?: string;
}

/**
 * Legt einen Beitrag ab (neu oder geändert). Gibt die Adresse des Commits
 * zurück — damit ist nachprüfbar, was geschrieben wurde.
 */
export async function veroeffentlicheBeitrag(
  eingabe: NewsAblage,
): Promise<{ sha: string; url: string; neu: boolean }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseBeitraege(quelle);

  const alteKennung = eingabe.ersetzt ?? eingabe.beitrag.id;
  const ohneAlten = bisher.filter(p => p.id !== alteKennung);
  const neu = ohneAlten.length === bisher.length;

  // Zwei Beiträge mit derselben Kennung gäbe zwei Seiten unter einer Adresse.
  if (neu && bisher.some(p => p.id === eingabe.beitrag.id)) {
    throw new CommitFehler(
      `Es gibt schon einen Beitrag mit der Kennung „${eingabe.beitrag.id}". `
      + 'Bitte den Titel leicht ändern oder den vorhandenen Beitrag bearbeiten.',
    );
  }

  const nachricht = [
    `MDC News: ${eingabe.beitrag.title}`,
    '',
    neu ? 'Neuer Beitrag.' : 'Beitrag geändert.',
    eingabe.beitrag.published ? 'Veröffentlicht.' : 'Als Entwurf abgelegt, noch nicht sichtbar.',
  ].join('\n');

  const commit = await committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeBeitraege(quelle, [...ohneAlten, eingabe.beitrag]) }],
    nachricht,
  );
  return { ...commit, neu };
}

/** Entfernt einen Beitrag ganz. */
export async function loescheBeitrag(id: string): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseBeitraege(quelle);
  const uebrig = bisher.filter(p => p.id !== id);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`Es gibt keinen Beitrag mit der Kennung „${id}".`);
  }
  const titel = bisher.find(p => p.id === id)?.title ?? id;
  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeBeitraege(quelle, uebrig) }],
    `MDC News: „${titel}" gelöscht`,
  );
}
