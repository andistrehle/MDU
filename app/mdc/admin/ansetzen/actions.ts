'use server';

// ============================================================
// MDC — Ranking ansetzen (für die Wirte)
// ============================================================
//
// Die kleine Schwester von `app/mdc/admin/kalender/actions.ts`. Dieselbe
// Datei wird geschrieben (`data/kalender.ts`), aber mit engen Scheuklappen:
//
//   • NUR Zusatztermine und Absagen — nichts an Spielorten, Ergebnissen, News.
//   • Ein Zusatztermin nur an einem Tag, an dem das Lokal NICHT ohnehin
//     spielt; eine Absage nur an einem seiner festen Abende. Umgekehrt wäre
//     beides wirkungslos.
//   • NUR ab heute (heute eingeschlossen — „heute Abend fällt aus" ist der
//     häufigste Fall) und höchstens vier Monate voraus.
//   • Zurücknehmen nur die eigenen Einträge, also `-zusatz` und `-absage`.
//
// Dass die Wirte selbst absagen dürfen, hat der Betreiber am 09.11.2026
// angewiesen; die Begründung steht bei `sageRankingAb`.
//
// Beide Aktionen prüfen den Zugang selbst (`lib/mdc/zugang.ts`): Der Proxy
// schützt die Seite, aber eine Server-Aktion ist eine eigene Adresse im Netz
// und ihre Kennung ließe sich auch anderswohin schicken.
// ============================================================

import type { Terminaenderung } from '@/data/kalender';
import { getVenue } from '@/data/venues';
import { speichereTermin, loescheTermin, terminId } from '@/lib/mdc/kalender-commit';
import { CommitFehler } from '@/lib/mdc/github';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { darfAnsetzen } from '@/lib/mdc/zugang';
import { todayInMunich } from '@/data/season';

export interface AnsetzEingabe {
  date: string;
  venueId: string;
  /** Leer = die übliche Zeit des Lokals. */
  time?: string;
  note?: string;
}

export interface AbsageEingabe {
  date: string;
  venueId: string;
  /** Warum der Abend ausfällt — steht beim durchgestrichenen Termin. */
  grund: string;
}

export type AnsetzErgebnis =
  | { ok: true; url: string; text: string }
  | { ok: false; fehler: string };

const KEIN_ZUGANG = 'Kein Zugang — bitte die Seite neu laden und das Passwort eingeben.';

/** Wie weit im Voraus angesetzt werden darf. */
const MAX_TAGE_VORAUS = 120;

function bereit(): string | null {
  const status = getUploadStatus();
  return status.canPublish
    ? null
    : `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}. `
      + 'Bitte der Turnierleitung Bescheid sagen.';
}

/** Tage zwischen zwei ISO-Daten — beide als UTC-Mitternacht gelesen. */
function tageDazwischen(von: string, bis: string): number {
  const a = Date.parse(`${von}T00:00:00Z`);
  const b = Date.parse(`${bis}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Datum prüfen — für Ansetzen UND Absagen dasselbe.
 *
 * HEUTE IST ERLAUBT. Eine Absage kommt oft am selben Tag („heute Abend fällt
 * aus"), und auch ein Zusatztermin wird manchmal mittags verabredet. Verboten
 * ist nur, was schon vorbei ist.
 */
function pruefeTag(date: string, was: 'ansetzen' | 'absagen'): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Bitte einen Tag auswählen.';
  const abstand = tageDazwischen(todayInMunich(), date);
  if (Number.isNaN(abstand)) return 'Diesen Tag gibt es nicht.';
  if (abstand < 0) {
    return was === 'ansetzen'
      ? 'Der Tag liegt in der Vergangenheit. Ein Ranking, das schon gelaufen ist, '
        + 'wird nicht angesetzt — das Ergebnis lädt die Turnierleitung hoch.'
      : 'Der Tag liegt in der Vergangenheit. Was gelaufen ist, lässt sich nicht mehr '
        + 'absagen — bei einem Abend, der ausgefallen ist, bitte der Turnierleitung '
        + 'Bescheid sagen.';
  }
  if (abstand > MAX_TAGE_VORAUS) {
    return `So weit im Voraus geht es nicht — höchstens ${MAX_TAGE_VORAUS} Tage.`;
  }
  return null;
}

/** 1 = Montag … 7 = Sonntag, wie bei den Spielorten. */
function wochentagVon(date: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const tag = new Date(`${date}T00:00:00Z`).getUTCDay();
  return (tag === 0 ? 7 : tag) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export async function setzeZusatzAn(eingabe: AnsetzEingabe): Promise<AnsetzErgebnis> {
  if (!await darfAnsetzen()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const schief = pruefeTag(eingabe.date, 'ansetzen');
  if (schief) return { ok: false, fehler: schief };

  // Der Spielort ist immer eines der MDC-Lokale. Freie Eingabe gibt es hier
  // bewusst nicht: Ein hingeschriebener Name hätte keine Adresse, keine Karte
  // und keine Spielort-Seite.
  const venue = getVenue(eingabe.venueId);
  if (!venue) return { ok: false, fehler: 'Bitte eines der MDC-Lokale auswählen.' };

  const zeit = (eingabe.time ?? '').trim();
  if (zeit && !/^([01]\d|2[0-3]):[0-5]\d$/.test(zeit)) {
    return { ok: false, fehler: 'Die Uhrzeit muss wie „19:30" aussehen.' };
  }

  const note = (eingabe.note ?? '').trim();
  if (note.length > 200) {
    return { ok: false, fehler: 'Der Hinweis ist zu lang (höchstens 200 Zeichen).' };
  }

  // An seinem festen Spieltag braucht ein Lokal keinen Zusatztermin — der
  // Abend steht ohnehin im Plan, und ein zweiter Eintrag stünde doppelt auf
  // der Seite. Sagen ist besser als stillschweigend anlegen.
  if (venue.weekdays.includes(wochentagVon(eingabe.date))) {
    return {
      ok: false,
      fehler: `Im ${venue.name} ist an diesem Wochentag ohnehin Ranking — der Termin steht `
        + 'schon im Plan. Angesetzt wird nur, was nicht ohnehin stattfindet.',
    };
  }

  const eintrag: Terminaenderung = {
    id: terminId(eingabe.date, venue.id, 'zusatz'),
    date: eingabe.date,
    venueId: venue.id,
    art: 'zusatz',
    time: zeit || venue.time,
    note: note || null,
  };

  try {
    const commit = await speichereTermin(eintrag);
    return { ok: true, url: commit.url, text: `${venue.name} am ${eingabe.date} angesetzt.` };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Ansetzen fehlgeschlagen', fehler);
    return {
      ok: false,
      fehler: 'Der Termin konnte nicht abgelegt werden. Bitte noch einmal versuchen — '
        + 'klappt es wieder nicht, bitte der Turnierleitung Bescheid sagen.',
    };
  }
}

/**
 * Ein Ranking absagen (seit 09.11.2026, vom Betreiber ausdrücklich so
 * angewiesen).
 *
 * Bis dahin blieb das bei der Turnierleitung — mit der Überlegung, eine
 * Absage nehme anderen den Abend weg. Die Wirklichkeit hat das überholt: Fällt
 * ein Abend wegen einer Veranstaltung aus, weiß es der Wirt, und er sagt es
 * ohnehin — bisher auf Facebook, während die Seite weiter einen Termin
 * behauptete. Lieber steht es dort, wo die Spieler nachsehen.
 *
 * Der Termin verschwindet dabei NICHT, er wird durchgestrichen gezeigt: Wer
 * schon hinfahren wollte, soll den Grund sehen.
 */
export async function sageRankingAb(eingabe: AbsageEingabe): Promise<AnsetzErgebnis> {
  if (!await darfAnsetzen()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const schief = pruefeTag(eingabe.date, 'absagen');
  if (schief) return { ok: false, fehler: schief };

  const venue = getVenue(eingabe.venueId);
  if (!venue) return { ok: false, fehler: 'Bitte eines der MDC-Lokale auswählen.' };

  // Umgekehrt zum Ansetzen: Absagen lässt sich nur, was auch stattfindet.
  // Eine Absage an einem Tag ohne Termin wäre wirkungslos — sie stünde in der
  // Datei und auf der Seite passierte nichts.
  if (!venue.weekdays.includes(wochentagVon(eingabe.date))) {
    return {
      ok: false,
      fehler: `Im ${venue.name} ist an diesem Wochentag ohnehin kein Ranking — da gibt es `
        + 'nichts abzusagen. Geht es um einen Abend, den ihr selbst angesetzt habt, '
        + 'steht er unten in der Liste und lässt sich dort zurücknehmen.',
    };
  }

  // Der Grund ist Pflicht, und zwar aus Rücksicht auf die Spieler: „Fällt aus"
  // allein lässt jeden rätseln und bringt die Frage ins Lokal zurück.
  const grund = (eingabe.grund ?? '').trim();
  if (grund.length < 3) {
    return { ok: false, fehler: 'Bitte kurz dazuschreiben, warum — zum Beispiel „Veranstaltung im Lokal".' };
  }
  if (grund.length > 200) {
    return { ok: false, fehler: 'Der Grund ist zu lang (höchstens 200 Zeichen).' };
  }

  const eintrag: Terminaenderung = {
    id: terminId(eingabe.date, venue.id, 'absage'),
    date: eingabe.date,
    venueId: venue.id,
    art: 'absage',
    // Bei einer Absage gibt es keine Uhrzeit — der Termin fällt ja weg.
    time: null,
    note: grund,
  };

  try {
    const commit = await speichereTermin(eintrag);
    return { ok: true, url: commit.url, text: `${venue.name} am ${eingabe.date} abgesagt.` };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Absagen fehlgeschlagen', fehler);
    return {
      ok: false,
      fehler: 'Die Absage konnte nicht abgelegt werden. Bitte noch einmal versuchen — '
        + 'klappt es wieder nicht, bitte der Turnierleitung Bescheid sagen.',
    };
  }
}

/**
 * Einen eigenen Eintrag zurücknehmen — angesetzt wie abgesagt.
 *
 * Wer absagen darf, muss die Absage auch zurücknehmen können: Die
 * Veranstaltung wird verschoben, der Abend findet doch statt. Alles andere
 * hieße, wegen eines Vertippers bei der Turnierleitung anzurufen.
 */
export async function nimmZurueck(id: string): Promise<AnsetzErgebnis> {
  if (!await darfAnsetzen()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  // Die Kennung ist `Datum-Lokal-Art`. Mehr als diese beiden Arten gibt es im
  // Kalender nicht; die Prüfung bleibt trotzdem stehen, damit hier nie etwas
  // anderes gelöscht wird, falls später eine dritte Art dazukommt.
  const istZusatz = id.endsWith('-zusatz');
  if (!istZusatz && !id.endsWith('-absage')) {
    return { ok: false, fehler: 'Hier lassen sich nur eigene Einträge zurücknehmen.' };
  }

  try {
    const commit = await loescheTermin(id);
    return {
      ok: true,
      url: commit.url,
      text: istZusatz
        ? 'Der Termin ist zurückgenommen.'
        : 'Die Absage ist zurückgenommen — das Ranking steht wieder im Plan.',
    };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Zurücknehmen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Der Eintrag konnte nicht zurückgenommen werden. Bitte noch einmal versuchen.' };
  }
}
