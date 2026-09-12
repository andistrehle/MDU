// ============================================================
// MDC — Register-Berichtigungen ins Repository schreiben
// ============================================================
//
// Wie bei Namen, News, Ergebnissen und Kalender: kein Datenbankeintrag,
// sondern ein Commit in `data/register-korrekturen.ts` (siehe
// `lib/mdc/github.ts`). Der Push stößt den Neubau an, zwei Minuten später
// steht die richtige Nummer überall.
//
// Die Liste steht dort als JSON-Array. Deshalb wird beim Schreiben nicht im
// Text herumgeschnitten, sondern der Stand aus GitHub gelesen, die Liste als
// Ganzes eingelesen, geändert und wieder ausgegeben.
// ============================================================

import 'server-only';
import type { RegisterKorrektur } from '@/data/register-korrekturen';
import { CommitFehler, committe, kontext, leseDatei } from './github';

const PFAD = 'data/register-korrekturen.ts';
const ANFANG = 'export const REGISTER_KORREKTUREN: RegisterKorrektur[] = ';

function leseListe(quelle: string): RegisterKorrektur[] {
  const von = quelle.indexOf(ANFANG);
  if (von === -1) {
    throw new CommitFehler('In data/register-korrekturen.ts fehlt die Liste REGISTER_KORREKTUREN.');
  }
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  if (bis === -1) throw new CommitFehler('Die Liste REGISTER_KORREKTUREN ist nicht abgeschlossen.');
  try {
    return JSON.parse(quelle.slice(start, bis + 1)) as RegisterKorrektur[];
  } catch {
    throw new CommitFehler(
      'Die Liste REGISTER_KORREKTUREN in data/register-korrekturen.ts ist nicht mehr '
      + 'maschinenlesbar. Vermutlich wurde sie von Hand bearbeitet — bitte prüfen.',
    );
  }
}

function schreibeListe(quelle: string, liste: RegisterKorrektur[]): string {
  const von = quelle.indexOf(ANFANG);
  const start = von + ANFANG.length;
  const bis = quelle.indexOf('];', start);
  const sortiert = [...liste].sort((a, b) => a.passNr - b.passNr);
  return quelle.slice(0, start) + JSON.stringify(sortiert, null, 2) + quelle.slice(bis + 1);
}

/** Legt eine Berichtigung ab. Gibt die Adresse des Commits zurück. */
export async function speichereRegisterKorrektur(
  eintrag: RegisterKorrektur,
): Promise<{ sha: string; url: string; neu: boolean }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseListe(quelle);

  const alt = bisher.find(k => k.passNr === eintrag.passNr);
  const ohneAlten = bisher.filter(k => k.passNr !== eintrag.passNr);

  const kopf = eintrag.art === 'stillgelegt'
    ? `MDC Register: Passnr. ${eintrag.passNr} stillgelegt `
      + `(${eintrag.lastName} ${eintrag.firstName})`
    : eintrag.art === 'inhaber'
      ? `MDC Register: Passnr. ${eintrag.passNr} gehört jetzt `
        + `${eintrag.gehoertZu.lastName} ${eintrag.gehoertZu.firstName}`
      : `MDC Register: Passnr. ${eintrag.passNr} vergeben an `
        + `${eintrag.gehoertZu.lastName} ${eintrag.gehoertZu.firstName}`;

  const grund = eintrag.art === 'stillgelegt'
    ? (eintrag.stattdessen !== null
      ? `Doppelt in der Arbeitsmappe — die Person läuft unter Passnr. ${eintrag.stattdessen}.`
      : 'Doppelter Eintrag in der Arbeitsmappe.')
    : eintrag.art === 'inhaber'
      ? `In der Arbeitsmappe steht dort noch ${eintrag.lastName} ${eintrag.firstName}. `
        + 'An den Ergebnissen ändert das nichts: Jede Saison löst ihre Passnummern '
        + 'über ihre eigene Rangliste auf.'
      : 'Die Arbeitsmappe kennt die Nummer noch nicht.';

  const nachricht = [
    kopf,
    '',
    grund,
    eintrag.note ? `Grund: ${eintrag.note}` : '',
    '',
    'Gilt nur, solange die Mappe es braucht; dort nachgezogen,',
    'meldet scripts/mdc-check-saison.ts „ERLEDIGT".',
  ].filter(Boolean).join('\n');

  const commit = await committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeListe(quelle, [...ohneAlten, eintrag]) }],
    nachricht,
  );
  return { ...commit, neu: alt === undefined };
}

/** Nimmt eine Berichtigung zurück — dann gilt wieder, was in der Mappe steht. */
export async function loescheRegisterKorrektur(passNr: number): Promise<{ sha: string; url: string }> {
  const ctx = kontext();
  const quelle = await leseDatei(ctx, PFAD);
  const bisher = leseListe(quelle);
  const uebrig = bisher.filter(k => k.passNr !== passNr);
  if (uebrig.length === bisher.length) {
    throw new CommitFehler(`Für Passnr. ${passNr} gibt es gar keine Berichtigung.`);
  }
  return committe(
    ctx,
    [{ pfad: PFAD, inhalt: schreibeListe(quelle, uebrig) }],
    `MDC Register: Berichtigung für Passnr. ${passNr} zurückgenommen`,
  );
}
