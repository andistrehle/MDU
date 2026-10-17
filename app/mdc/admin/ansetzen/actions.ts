'use server';

// ============================================================
// MDC — Ranking ansetzen (für die Wirte)
// ============================================================
//
// Die kleine Schwester von `app/mdc/admin/kalender/actions.ts`. Dieselbe
// Datei wird geschrieben (`data/kalender.ts`), aber mit engen Scheuklappen:
//
//   • NUR Zusatztermine. Absagen bleiben bei der Turnierleitung — eine Absage
//     nimmt anderen Leuten den Abend weg, das gehört nicht hinter ein
//     Passwort, das im Lokal herumliegt.
//   • NUR ab heute und höchstens vier Monate voraus.
//   • Zurücknehmen nur, was auch ein Zusatztermin ist.
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

export async function setzeZusatzAn(eingabe: AnsetzEingabe): Promise<AnsetzErgebnis> {
  if (!await darfAnsetzen()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eingabe.date)) {
    return { ok: false, fehler: 'Bitte einen Tag auswählen.' };
  }
  const heute = todayInMunich();
  const abstand = tageDazwischen(heute, eingabe.date);
  if (Number.isNaN(abstand)) return { ok: false, fehler: 'Diesen Tag gibt es nicht.' };
  if (abstand < 0) {
    return {
      ok: false,
      fehler: 'Der Tag liegt in der Vergangenheit. Ein Ranking, das schon gelaufen ist, '
        + 'wird nicht angesetzt — das Ergebnis lädt die Turnierleitung hoch.',
    };
  }
  if (abstand > MAX_TAGE_VORAUS) {
    return { ok: false, fehler: `So weit im Voraus geht es nicht — höchstens ${MAX_TAGE_VORAUS} Tage.` };
  }

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
  const tag = new Date(`${eingabe.date}T00:00:00Z`).getUTCDay();
  const wochentag = (tag === 0 ? 7 : tag) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
  if (venue.weekdays.includes(wochentag)) {
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

export async function nimmZusatzZurueck(id: string): Promise<AnsetzErgebnis> {
  if (!await darfAnsetzen()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  // Die Kennung ist `Datum-Lokal-Art`. Nur ein Zusatztermin darf hier weg:
  // Eine Absage zurückzunehmen hieße, einen Abend wieder anzusetzen, den die
  // Turnierleitung abgesagt hat.
  if (!id.endsWith('-zusatz')) {
    return { ok: false, fehler: 'Hier lassen sich nur angesetzte Termine zurücknehmen.' };
  }

  try {
    const commit = await loescheTermin(id);
    return { ok: true, url: commit.url, text: 'Der Termin ist zurückgenommen.' };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Zurücknehmen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Der Termin konnte nicht zurückgenommen werden. Bitte noch einmal versuchen.' };
  }
}
