'use server';

// ============================================================
// MDC — Namen berichtigen
// ============================================================
//
// Der einzige schreibende Vorgang auf dieser Seite. Alles andere unter
// `/admin/passnummern` wertet nur aus.
//
// Wie bei News, Ergebnis-Upload und Kalender prüft die Aktion den Zugang
// selbst nach. Der Proxy tut das schon (`proxy.ts`), aber eine Aktion ist eine
// eigene Adresse im Netz und darf sich nicht darauf verlassen, dass vor ihr
// jemand aufgepasst hat.
//
// Drei Prüfungen sind hier wichtiger als das Formular selbst, weil eine
// Korrektur auf ALLE Wertungen zugleich wirkt:
//
//   1. Die Nummer muss überhaupt jemandem gehören — sonst bewirkt die
//      Korrektur nichts und verwirrt nur beim nächsten Nachschauen.
//   2. Sie darf nicht zwei Menschen gehören (heute einem, früher einem
//      anderen). Die Korrektur hängt an der Nummer, nicht am Menschen, und
//      würde beide umbenennen.
//   3. Der neue Name darf nicht die Adresse eines anderen Spielers ergeben —
//      sonst würden zwei Menschen zu einem verschmolzen.
// ============================================================

import { headers } from 'next/headers';
import type { Namenskorrektur } from '@/data/namen';
import { namensKorrektur, neuePlayerId } from '@/data/namen';
import { PLAYERS, getPlayerByPassNr, playerName } from '@/data/players';
import { registerEintrag } from '@/data/register';
import { CommitFehler } from '@/lib/mdc/github';
import { loescheName, speichereName } from '@/lib/mdc/namen-commit';
import { getUploadStatus } from '@/lib/mdc/upload-config';

export interface NameEingabe {
  passNr: number;
  lastName: string;
  firstName: string;
  note?: string;
}

export type NameErgebnis =
  | { ok: true; url: string; neu: boolean; passNr: number; playerId: string }
  | { ok: false; fehler: string };

async function zugangGeprueft(): Promise<boolean> {
  const passwort = (process.env.MDC_ADMIN_PASSWORD ?? '').trim();
  if (!passwort) return false;
  const header = (await headers()).get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return false;
  try {
    const entschluesselt = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    return entschluesselt.slice(entschluesselt.indexOf(':') + 1) === passwort;
  } catch {
    return false;
  }
}

const KEIN_ZUGANG = 'Kein Zugang zur Turnierverwaltung.';

function bereit(): string | null {
  const status = getUploadStatus();
  return status.canPublish
    ? null
    : `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}.`;
}

/**
 * Erlaubt sind Buchstaben (auch Umlaute), Ziffern, Leerzeichen und die
 * Zeichen, die in echten MDC-Namen vorkommen: Bindestrich („Müller-Rotondo"),
 * Schrägstrich („Lisa/Stephy"), Punkt und Apostroph. Klammern nur im Vornamen,
 * dort steht der Spitzname.
 */
const ERLAUBT = /^[\p{L}\p{N} ./'’-]+$/u;
const ERLAUBT_VORNAME = /^[\p{L}\p{N} ./'’()-]+$/u;

function pruefeName(wert: string, feld: string, mitKlammern: boolean): string | null {
  if (!wert) return `${feld} fehlt.`;
  if (wert.length > 40) return `${feld} ist zu lang (höchstens 40 Zeichen).`;
  const muster = mitKlammern ? ERLAUBT_VORNAME : ERLAUBT;
  if (!muster.test(wert)) return `${feld} enthält Zeichen, die in einem Namen nichts zu suchen haben.`;
  return null;
}

export async function korrigiereName(eingabe: NameEingabe): Promise<NameErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const passNr = Number(eingabe.passNr);
  if (!Number.isInteger(passNr) || passNr < 1) {
    return { ok: false, fehler: 'Die Passnummer fehlt oder ist keine ganze Zahl.' };
  }

  // Namen werden wie in der Arbeitsmappe in Großbuchstaben abgelegt; die
  // richtige Schreibweise fürs Auge macht `titleCase` beim Anzeigen.
  const lastName = eingabe.lastName.trim().replace(/\s+/g, ' ').toUpperCase();
  const firstName = eingabe.firstName.trim().replace(/\s+/g, ' ').toUpperCase();

  const fehlerNachname = pruefeName(lastName, 'Der Nachname', false);
  if (fehlerNachname) return { ok: false, fehler: fehlerNachname };
  const fehlerVorname = pruefeName(firstName, 'Der Vorname', true);
  if (fehlerVorname) return { ok: false, fehler: fehlerVorname };

  const note = (eingabe.note ?? '').trim();
  if (note.length > 200) {
    return { ok: false, fehler: 'Der Hinweis ist zu lang (höchstens 200 Zeichen).' };
  }

  // (1) Gehört die Nummer überhaupt jemandem?
  const heutiger = getPlayerByPassNr(passNr);
  const frueher = PLAYERS.filter(p => p.formerPassNr === passNr);
  if (!heutiger && frueher.length === 0 && !registerEintrag(passNr)) {
    return {
      ok: false,
      fehler: `Passnr. ${passNr} ist frei — dort gibt es keinen Namen zu berichtigen. `
        + 'Neue Nummern werden im Blatt „Teilnehmer" der Arbeitsmappe vergeben.',
    };
  }

  // (2) Trägt die Nummer mehr als einen Menschen? Dann hilft nur die Mappe.
  const betroffene = new Set([
    ...(heutiger ? [heutiger.id] : []),
    ...frueher.map(p => p.id),
  ]);
  if (betroffene.size > 1) {
    const namen = [...betroffene]
      .map(id => PLAYERS.find(p => p.id === id))
      .filter(p => p !== undefined)
      .map(p => playerName(p));
    return {
      ok: false,
      fehler: `Passnr. ${passNr} steht bei mehreren Menschen (${namen.join(', ')}). `
        + 'Eine Korrektur hängt an der Nummer und würde alle umbenennen. '
        + 'Dieser Fall gehört in die Arbeitsmappe, nicht hierher.',
    };
  }

  const alt = namensKorrektur(passNr);
  const eintrag: Namenskorrektur = {
    passNr,
    lastName,
    firstName,
    alteId: alt?.alteId ?? heutiger?.id ?? null,
    note: note || null,
  };

  // (3) Ergibt der neue Name die Adresse eines anderen Spielers?
  const neueId = neuePlayerId(eintrag);
  const fremder = PLAYERS.find(p => p.id === neueId && p.id !== heutiger?.id);
  if (fremder) {
    return {
      ok: false,
      fehler: `Unter dieser Adresse steht schon ${playerName(fremder)}`
        + `${fremder.passNr !== null ? ` (Passnr. ${fremder.passNr})` : ''}. `
        + 'Mit demselben Namen würden aus zwei Menschen einer. '
        + 'Wenn es wirklich zwei Namensgleiche sind, bitte auf der Kontaktseite melden — '
        + 'das muss von Hand entschieden werden.',
    };
  }

  try {
    const commit = await speichereName(eintrag);
    return { ok: true, url: commit.url, neu: commit.neu, passNr, playerId: neueId };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Namenskorrektur speichern fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Die Korrektur konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

export async function entferneNamenskorrektur(passNr: number): Promise<NameErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  try {
    const commit = await loescheName(passNr);
    return { ok: true, url: commit.url, neu: false, passNr, playerId: '' };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Namenskorrektur löschen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Die Korrektur konnte nicht zurückgenommen werden. Bitte noch einmal versuchen.' };
  }
}
