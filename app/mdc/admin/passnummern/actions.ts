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
import { FREIE_NUMMERN, HOECHSTE_NUMMER, registerEintrag } from '@/data/register';
import type { RegisterKorrektur } from '@/data/register-korrekturen';
import { CommitFehler } from '@/lib/mdc/github';
import { slugify } from '@/lib/mdc/names';
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
    art: 'stillgelegt',
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

/** Berichtigung zurücknehmen — dann gilt wieder, was in der Mappe steht. */
export async function hebeRegisterKorrekturAuf(passNr: number): Promise<RegisterErgebnis> {
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

// ------------------------------------------------------------
// Nummer zuordnen und Nummer vergeben
// ------------------------------------------------------------
//
// Bis September 2026 konnte die Seite gar nichts am Register ändern: Der Stamm
// entstand aus der Arbeitsmappe, und wer einen Pass bekam, wurde dort
// eingetragen. Das war unbequem genug, dass es an einem Turnierabend liegen
// blieb — deshalb geht beides jetzt hier, und zwar so, dass jeder Eintrag den
// nächsten Import übersteht und von selbst wegfällt, sobald die Mappe
// nachgezogen ist.
//
// An den ERGEBNISSEN ändert das nie etwas. Jede Saison löst ihre Passnummern
// über ihre eigene Rangliste auf; wer eine Nummer abgibt, behält alle Turniere
// und wird als „früher Passnr. X" ausgewiesen.

/** Ein Name, wie ihn die Arbeitsmappe schreibt. */
function sauberName(wert: string): string {
  return wert.trim().replace(/\s+/g, ' ').toUpperCase();
}

function pruefeInhaber(lastName: string, firstName: string): string | null {
  return pruefeName(lastName, 'Der Nachname', false)
    ?? pruefeName(firstName, 'Der Vorname', true);
}

/**
 * Die Nummer gehört ab jetzt jemand anderem.
 *
 * Fünf Prüfungen:
 *   1. Die Nummer muss im Register stehen — sonst ist sie frei und gehört
 *      vergeben, nicht umgeschrieben.
 *   2. Es muss einen anderen geben als den heutigen Inhaber.
 *   3. Der neue Inhaber darf nicht schon eine ANDERE Nummer tragen; sonst
 *      stünde er doppelt im Register, und genau das ist der Fehler, den die
 *      Seite eine Karte weiter oben meldet.
 *   4. Gleiche Wertungsklasse — das Register ist nach Männern und Frauen
 *      getrennt, und eine Zeile wechselt nicht die Liste.
 *   5. Der Name muss ein Name sein.
 */
export async function ordneNummerZu(
  passNr: number,
  playerId: string,
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

  // (1)
  const eintragMappe = registerEintrag(nummer);
  if (!eintragMappe) {
    return {
      ok: false,
      fehler: `Passnr. ${nummer} steht in keinem Register — sie ist frei. `
        + 'Eine freie Nummer wird vergeben, nicht umgeschrieben.',
    };
  }

  const neuer = PLAYERS.find(p => p.id === playerId);
  if (!neuer) return { ok: false, fehler: 'Diesen Spieler gibt es nicht.' };

  // (2)
  if (neuer.passNr === nummer) {
    return { ok: false, fehler: `Passnr. ${nummer} gehört ${playerName(neuer)} bereits.` };
  }
  // (3)
  if (neuer.passNr !== null) {
    return {
      ok: false,
      fehler: `${playerName(neuer)} trägt schon Passnr. ${neuer.passNr}. Zwei Nummern für `
        + 'einen Menschen wären genau der Fehler, den die Karte „Zweimal im Register" meldet. '
        + 'Erst die alte Nummer freimachen.',
    };
  }
  // (4)
  if (neuer.division !== eintragMappe.division) {
    return {
      ok: false,
      fehler: `Passnr. ${nummer} steht in der Liste der `
        + `${eintragMappe.division === 'men' ? 'Männer' : 'Frauen'}, `
        + `${playerName(neuer)} in der der `
        + `${neuer.division === 'men' ? 'Männer' : 'Frauen'}. Das gehört in die Arbeitsmappe.`,
    };
  }

  const lastName = sauberName(neuer.lastName);
  const firstName = sauberName(
    neuer.nickname ? `${neuer.firstName} (${neuer.nickname})` : neuer.firstName,
  );
  // (5)
  const fehlerName = pruefeInhaber(lastName, firstName);
  if (fehlerName) return { ok: false, fehler: fehlerName };

  // Der Name LAUT MAPPE sichert die Berichtigung ab: Schreibt der Betreiber
  // die Zeile selbst um, greift sie nicht mehr.
  const eintrag: RegisterKorrektur = {
    art: 'inhaber',
    passNr: nummer,
    lastName: sauberName(eintragMappe.lastName),
    firstName: sauberName(
      eintragMappe.nickname
        ? `${eintragMappe.firstName} (${eintragMappe.nickname})`
        : eintragMappe.firstName,
    ),
    gehoertZu: { lastName, firstName },
    note: hinweis || null,
  };

  try {
    const commit = await speichereRegisterKorrektur(eintrag);
    return { ok: true, url: commit.url, neu: commit.neu, passNr: nummer };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Nummer zuordnen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Das konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

export interface VergabeEingabe {
  passNr: number;
  /** Bestehender Spieler ohne Nummer — oder `null` für jemanden ganz Neuen. */
  playerId?: string | null;
  lastName?: string;
  firstName?: string;
  division?: 'men' | 'women';
  note?: string;
}

/**
 * Eine freie Nummer vergeben.
 *
 * Frei heißt: Sie steht in keinem Register und niemand trägt sie. Beides wird
 * geprüft — eine Nummer zweimal zu vergeben, fiele erst Wochen später auf.
 */
export async function vergebeNummer(eingabe: VergabeEingabe): Promise<RegisterErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const nummer = Number(eingabe.passNr);
  if (!Number.isInteger(nummer) || nummer < 1) {
    return { ok: false, fehler: 'Die Passnummer fehlt oder ist keine ganze Zahl.' };
  }
  const hinweis = (eingabe.note ?? '').trim();
  if (hinweis.length > 200) {
    return { ok: false, fehler: 'Der Hinweis ist zu lang (höchstens 200 Zeichen).' };
  }

  // Ist die Nummer wirklich frei?
  if (registerEintrag(nummer)) {
    const wer = registerEintrag(nummer);
    return {
      ok: false,
      fehler: `Passnr. ${nummer} gehört im Register schon ${wer?.firstName} ${wer?.lastName}. `
        + 'Eine vergebene Nummer wird umgeschrieben, nicht neu vergeben.',
    };
  }
  const traeger = getPlayerByPassNr(nummer);
  if (traeger) {
    return {
      ok: false,
      fehler: `Passnr. ${nummer} trägt schon ${playerName(traeger)}.`,
    };
  }
  if (nummer <= HOECHSTE_NUMMER && !FREIE_NUMMERN.includes(nummer)) {
    return { ok: false, fehler: `Passnr. ${nummer} ist nicht frei.` };
  }

  let lastName: string;
  let firstName: string;
  let division: 'men' | 'women';

  if (eingabe.playerId) {
    const spieler = PLAYERS.find(p => p.id === eingabe.playerId);
    if (!spieler) return { ok: false, fehler: 'Diesen Spieler gibt es nicht.' };
    if (spieler.passNr !== null) {
      return {
        ok: false,
        fehler: `${playerName(spieler)} trägt schon Passnr. ${spieler.passNr}. `
          + 'Zwei Nummern für einen Menschen gibt es nicht.',
      };
    }
    lastName = sauberName(spieler.lastName);
    firstName = sauberName(
      spieler.nickname ? `${spieler.firstName} (${spieler.nickname})` : spieler.firstName,
    );
    division = spieler.division;
  } else {
    lastName = sauberName(eingabe.lastName ?? '');
    firstName = sauberName(eingabe.firstName ?? '');
    const fehlerName = pruefeInhaber(lastName, firstName);
    if (fehlerName) return { ok: false, fehler: fehlerName };
    if (eingabe.division !== 'men' && eingabe.division !== 'women') {
      return { ok: false, fehler: 'Bitte Männer oder Frauen auswählen.' };
    }
    division = eingabe.division;

    // Ergibt der Name die Adresse eines bestehenden Spielers, wären das zwei
    // Menschen unter einem Profil. Dann ist es derselbe — und der gehört über
    // die Auswahl oben ausgewählt, nicht neu angelegt.
    const ohneSpitzname = firstName.replace(/\s*\([^)]*\)\s*$/, '');
    const neueId = slugify(`${ohneSpitzname} ${lastName}`);
    const schonDa = PLAYERS.find(p => p.id === neueId);
    if (schonDa) {
      return {
        ok: false,
        fehler: `${playerName(schonDa)} steht schon im Stamm`
          + `${schonDa.passNr !== null ? ` mit Passnr. ${schonDa.passNr}` : ' (ohne Nummer)'}. `
          + 'Bitte oben auswählen statt neu anlegen — sonst würden aus einem Menschen zwei.',
      };
    }
  }

  const eintrag: RegisterKorrektur = {
    art: 'vergeben',
    passNr: nummer,
    gehoertZu: { lastName, firstName },
    division,
    note: hinweis || null,
  };

  try {
    const commit = await speichereRegisterKorrektur(eintrag);
    return { ok: true, url: commit.url, neu: commit.neu, passNr: nummer };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Nummer vergeben fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Das konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}
