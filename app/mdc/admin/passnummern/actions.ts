'use server';

// ============================================================
// MDC — Namen berichtigen und Doppeleinträge stilllegen
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
import type { RegisterKorrektur } from '@/data/register-korrekturen';
import { CommitFehler } from '@/lib/mdc/github';
import { loescheName, speichereName } from '@/lib/mdc/namen-commit';
import { loescheRegisterKorrektur, speichereRegisterKorrektur } from '@/lib/mdc/register-commit';
import { doppelteEintraege } from '@/lib/mdc/passnummern';
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

// ------------------------------------------------------------
// Doppelten Registereintrag stilllegen
// ------------------------------------------------------------
//
// Der zweite schreibende Vorgang dieser Seite — und der engste. Erlaubt ist
// genau eine Sache: eine Nummer aus dem Register nehmen, unter der derselbe
// Mensch ein ZWEITES Mal steht und mit der nie gespielt wurde.
//
// Vier Prüfungen, jede davon verhindert einen Schaden, den hinterher niemand
// mehr sieht:
//
//   1. Die Nummer muss zu einem Doppeleintrag gehören. Eine einzeln
//      vergebene Nummer stillzulegen hieße, jemandem seinen Pass zu nehmen —
//      das gehört in die Arbeitsmappe.
//   2. Mit der Nummer darf NICHTS gespielt worden sein. Sonst verlöre ein
//      Turnierergebnis seinen Menschen.
//   3. Die andere Nummer muss übrig bleiben. Beide stillzulegen ließe die
//      Person ganz verschwinden.
//   4. Der Name muss zur Registerzeile passen — er wird mit abgelegt, damit
//      eine später neu vergebene Nummer nicht still unter die alte Korrektur
//      fällt.

export type RegisterErgebnis =
  | { ok: true; url: string; neu: boolean; passNr: number }
  | { ok: false; fehler: string };

export async function legeNummerStill(
  passNr: number,
  note?: string,
): Promise<RegisterErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const nummer = Number(passNr);
  if (!Number.isInteger(nummer) || nummer < 1) {
    return { ok: false, fehler: 'Die Passnummer fehlt oder ist keine ganze Zahl.' };
  }

  const hinweis = (note ?? '').trim();
  if (hinweis.length > 200) {
    return { ok: false, fehler: 'Der Hinweis ist zu lang (höchstens 200 Zeichen).' };
  }

  // (1) Gehört die Nummer zu einem Doppeleintrag?
  const doppel = doppelteEintraege().find(d => d.nummern.some(n => n.passNr === nummer));
  const zeile = doppel?.nummern.find(n => n.passNr === nummer);
  if (!doppel || !zeile) {
    return {
      ok: false,
      fehler: `Passnr. ${nummer} steht im Register nur einmal. Stilllegen geht nur bei einem `
        + 'Menschen, der dort unter zwei Nummern geführt wird — alles andere gehört in das '
        + 'Blatt „Teilnehmer" der Arbeitsmappe.',
    };
  }

  // (2) Wurde mit der Nummer gespielt?
  if (zeile.gespielt > 0) {
    return {
      ok: false,
      fehler: `Mit Passnr. ${nummer} stehen ${zeile.gespielt} Turnierergebnisse in der `
        + 'Wertung. Diese Nummer wird nicht stillgelegt — die Ergebnisse verlören ihren '
        + 'Menschen. Stillzulegen ist die Nummer OHNE Starts.',
    };
  }

  // (3) Bleibt die andere Nummer übrig?
  const uebrig = doppel.nummern.filter(n => n.passNr !== nummer);
  if (uebrig.length === 0) {
    return { ok: false, fehler: 'Die letzte Nummer dieser Person lässt sich nicht stilllegen.' };
  }

  // (4) Name aus der Registerzeile — er sichert die Korrektur gegen eine
  //     später neu vergebene Nummer ab.
  const eintrag: RegisterKorrektur = {
    passNr: nummer,
    lastName: zeile.lastName,
    firstName: zeile.firstName,
    stattdessen: uebrig.sort((a, b) => b.gespielt - a.gespielt)[0].passNr,
    note: hinweis || null,
  };

  try {
    const commit = await speichereRegisterKorrektur(eintrag);
    return { ok: true, url: commit.url, neu: commit.neu, passNr: nummer };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Registerzeile stilllegen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Das konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

/** Stilllegung zurücknehmen — dann gilt wieder, was in der Mappe steht. */
export async function hebeStilllegungAuf(passNr: number): Promise<RegisterErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  try {
    const commit = await loescheRegisterKorrektur(Number(passNr));
    return { ok: true, url: commit.url, neu: false, passNr: Number(passNr) };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Stilllegung zurücknehmen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Das konnte nicht zurückgenommen werden. Bitte noch einmal versuchen.' };
  }
}
