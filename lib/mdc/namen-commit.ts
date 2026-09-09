// ============================================================
// MDC — Namenskorrekturen ins Repository schreiben
// ============================================================
//
// Wie bei News, Ergebnissen und Kalender: kein Datenbankeintrag, sondern ein
// Commit in `data/namen.ts` (siehe `lib/mdc/github.ts`). Der Push stößt den
// Neubau an, zwei Minuten später steht der richtige Name überall.
//
// Die Liste steht dort als JSON-Array. Deshalb wird beim Schreiben nicht im
// Text herumgeschnitten, sondern der Stand aus GitHub gelesen, die Liste als
// Ganzes eingelesen, geändert und wieder ausgegeben.
// ============================================================

import 'server-only';
import type { Namenskorrektur } from '@/data/namen';
import { CommitFehler, committe, kontext, leseDatei } from './github';

const PFAD = 'data/namen.ts';
const ANFANG = 'export const NAMEN: Namenskorrektur[] = ';

function leseNamen(quelle: string): Namenskorrektur[] {
  const von = quelle.indexOf(ANFANG);
  if (von === -1) throw new CommitFehler('In data/namen.ts fehlt die Liste NAMEN.');
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste NAMEN ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as Namenskorrektur[];
  } catch {
    throw new CommitFehler(
      'Die Liste NAMEN in data/namen.ts ist nicht mehr maschinenlesbar. '
      + 'Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

function schreibeNamen(quelle: string, namen: Namenskorrektur[]): string {
  const von = quelle.indexOf(ANFANG);
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  // Nach Passnummer sortiert abgelegt — die Datei liest sich dann wie das
  // Register und man findet eine Nummer, ohne zu suchen.
  const sortiert = [...namen].sort((a, b) => a.passNr - b.passNr);
  return quelle.slice(0, start) + JSON.stringify(sortiert, null, 2) + quelle.slice(bis + 1);
}

/**
 * Legt eine Korrektur ab. Gibt die Adresse des Commits zurück — damit ist
 * nachprüfbar, was geschrieben wurde.
 */
export async function speichereName(
  eintrag: Namenskorrektur,
): Promise<{ sha: string; url: string; neu: boolean }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseNamen(quelle);

  const alt = bisher.find(n => n.passNr === eintrag.passNr);
  const ohneAlten = bisher.filter(n => n.passNr !== eintrag.passNr);

  // Wird eine Korrektur ein zweites Mal geändert, ist die frühere Adresse die
  // der ERSTEN Schreibweise — sonst zeigte die Umleitung auf eine Zwischenform,
  // die nie jemand weitergegeben hat.
  const eintragMitHerkunft: Namenskorrektur = {
    ...eintrag,
    alteId: alt?.alteId ?? eintrag.alteId,
  };

  const nachricht = [
    `MDC Namen: Passnr. ${eintrag.passNr} → ${eintrag.lastName} ${eintrag.firstName}`,
    '',
    alt
      ? `Bisher hier: ${alt.lastName} ${alt.firstName}.`
      : 'Erste Korrektur für diese Nummer.',
    eintrag.note ? `Grund: ${eintrag.note}` : '',
  ].filter(Boolean).join('\n');

  const commit = await committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeNamen(quelle, [...ohneAlten, eintragMitHerkunft]) }],
    nachricht,
  );
  return { ...commit, neu: alt === undefined };
}

/** Nimmt eine Korrektur zurück — dann gilt wieder der Name aus der Mappe. */
export async function loescheName(passNr: number): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseNamen(quelle);
  const uebrig = bisher.filter(n => n.passNr !== passNr);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`Für Passnr. ${passNr} gibt es gar keine Korrektur.`);
  }
  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeNamen(quelle, uebrig) }],
    `MDC Namen: Korrektur für Passnr. ${passNr} zurückgenommen`,
  );
}
