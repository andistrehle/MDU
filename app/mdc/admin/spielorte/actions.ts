'use server';

// ============================================================
// MDC — Spielort ändern
// ============================================================
//
// Wie bei News, Kalender und Ergebnis-Upload prüft jede Aktion den Zugang
// selbst nach. Der Proxy tut das schon (`proxy.ts`), aber eine Aktion ist eine
// eigene Adresse im Netz und darf sich nicht darauf verlassen, dass vor ihr
// jemand aufgepasst hat.
//
// DEN UNTERSCHIED RECHNET DER SERVER AUS, nicht der Browser: Geschickt wird
// der vollständige Satz Angaben, wie er am Bildschirm steht. Was davon
// abweicht, wird hier gegen `VENUES_BASIS` verglichen. So kann der Eintrag gar
// nicht behaupten, vorher hätte etwas anderes dagestanden — und wer einen Wert
// wieder auf den ursprünglichen zurückdreht, löscht damit automatisch die
// Änderung, statt eine Änderung „von 3 auf 3" zu hinterlassen.
// ============================================================

import { headers } from 'next/headers';
import type { Weekday } from '@/data/types';
import { VENUES_BASIS } from '@/data/venues';
import {
  FELD_NAMEN, SPIELORT_FELDER, gleicherWert,
  type SpielortAenderung, type SpielortFeld, type SpielortFelder,
} from '@/data/spielorte-aenderungen';
import { speichereSpielort, setzeSpielortZurueck } from '@/lib/mdc/spielort-commit';
import { CommitFehler } from '@/lib/mdc/github';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { todayInMunich } from '@/data/season';

export interface SpielortEingabe {
  venueId: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  weekdays: number[];
  time: string;
  phones: string[];
  boards: number;
  note?: string;
}

export type SpielortErgebnis =
  | { ok: true; url: string; beschreibung: string; zurueckgesetzt: boolean }
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

/** Ein Wert, wie er in der Änderung steht — für die Commit-Nachricht. */
function alsText(feld: SpielortFeld, wert: unknown): string {
  if (feld === 'weekdays') {
    const kurz: Record<number, string> = { 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa', 7: 'So' };
    return (wert as number[]).map(d => kurz[d] ?? String(d)).join(' & ') || '—';
  }
  if (feld === 'phones') return (wert as string[]).join(', ') || '—';
  return String(wert);
}

/**
 * Prüft die Eingabe. Die Sätze sagen, was zu tun ist — sie landen unverändert
 * am Bildschirm.
 */
function pruefe(eingabe: SpielortEingabe): string | null {
  if (!eingabe.name.trim()) return 'Ohne Namen geht es nicht.';
  if (eingabe.name.trim().length > 60) return 'Der Name ist zu lang (höchstens 60 Zeichen).';
  if (!eingabe.street.trim()) return 'Die Straße fehlt.';
  if (!/^\d{5}$/.test(eingabe.zip.trim())) return 'Die Postleitzahl muss fünfstellig sein.';
  if (!eingabe.city.trim()) return 'Der Ort fehlt.';

  if (!Array.isArray(eingabe.weekdays) || eingabe.weekdays.length === 0) {
    return 'Mindestens ein Spieltag muss angekreuzt sein. Spielt dort gar nicht '
      + 'mehr regelmäßig, gehört das Lokal aus der Übersicht genommen — das geht hier nicht.';
  }
  if (eingabe.weekdays.some(d => !Number.isInteger(d) || d < 1 || d > 7)) {
    return 'Ein Spieltag ist keiner der sieben Wochentage.';
  }

  if (!/^\d{2}:\d{2}$/.test(eingabe.time.trim())) return 'Der Beginn muss wie „20:00" aussehen.';
  const [stunde, minute] = eingabe.time.split(':').map(Number);
  if (stunde > 23 || minute > 59) return 'Diese Uhrzeit gibt es nicht.';

  if (!Number.isInteger(eingabe.boards) || eingabe.boards < 1 || eingabe.boards > 30) {
    return 'Die Zahl der Automaten muss zwischen 1 und 30 liegen.';
  }

  if (eingabe.phones.some(t => t.length > 40)) return 'Eine Telefonnummer ist zu lang.';

  const note = (eingabe.note ?? '').trim();
  if (note.length > 200) return 'Die Begründung ist zu lang (höchstens 200 Zeichen).';
  return null;
}

export async function speichereSpielortAenderung(
  eingabe: SpielortEingabe,
): Promise<SpielortErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const basis = VENUES_BASIS.find(v => v.id === eingabe.venueId);
  if (!basis) return { ok: false, fehler: 'Diesen Spielort gibt es nicht.' };

  const fehler = pruefe(eingabe);
  if (fehler) return { ok: false, fehler };

  // Aufgeräumte Werte — Leerzeichen am Rand und leere Telefonzeilen fliegen
  // raus, bevor verglichen wird. Sonst wäre „20:00 " eine Änderung.
  const gewuenscht: Required<SpielortFelder> = {
    name: eingabe.name.trim(),
    street: eingabe.street.trim(),
    zip: eingabe.zip.trim(),
    city: eingabe.city.trim(),
    weekdays: [...new Set(eingabe.weekdays)].sort((a, b) => a - b) as Weekday[],
    time: eingabe.time.trim(),
    phones: eingabe.phones.map(t => t.trim()).filter(Boolean),
    boards: eingabe.boards,
  };

  const neu: SpielortFelder = {};
  const vorher: SpielortFelder = {};
  const teile: string[] = [];
  for (const feld of SPIELORT_FELDER) {
    if (gleicherWert(gewuenscht[feld], basis[feld])) continue;
    // @ts-expect-error — Feld für Feld typsicher, der Schlüssel ist es nicht.
    neu[feld] = gewuenscht[feld];
    // @ts-expect-error — dasselbe.
    vorher[feld] = basis[feld];
    teile.push(`${FELD_NAMEN[feld]} ${alsText(feld, basis[feld])} → ${alsText(feld, gewuenscht[feld])}`);
  }

  try {
    // Nichts weicht mehr ab: Dann gehört auch keine Änderung in die Datei.
    // Das ist der Weg zurück — Wert wieder wie in der Übersicht eintippen.
    if (teile.length === 0) {
      const commit = await setzeSpielortZurueck(basis.id, basis.name);
      return { ok: true, url: commit.url, beschreibung: basis.name, zurueckgesetzt: true };
    }

    const eintrag: SpielortAenderung = {
      venueId: basis.id,
      neu,
      vorher,
      datum: todayInMunich(),
      note: (eingabe.note ?? '').trim() || null,
    };
    const beschreibung = `${basis.name}: ${teile.join(', ')}`;
    const commit = await speichereSpielort(eintrag, beschreibung);
    return { ok: true, url: commit.url, beschreibung, zurueckgesetzt: false };
  } catch (f) {
    if (f instanceof CommitFehler) {
      // „Gar keine Änderung da" ist beim Zurücksetzen kein Fehler, sondern
      // heißt: Es stand schon alles wie in der Übersicht.
      if (teile.length === 0) {
        return { ok: false, fehler: 'Hier weicht nichts von der Übersicht ab — es gibt nichts zu speichern.' };
      }
      return { ok: false, fehler: f.message };
    }
    console.error('[mdc] Spielort speichern fehlgeschlagen', f);
    return { ok: false, fehler: 'Die Änderung konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

/** Setzt ein Lokal auf die Angaben der Übersicht zurück. */
export async function nimmSpielortAenderungZurueck(venueId: string): Promise<SpielortErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  const basis = VENUES_BASIS.find(v => v.id === venueId);
  if (!basis) return { ok: false, fehler: 'Diesen Spielort gibt es nicht.' };

  try {
    const commit = await setzeSpielortZurueck(basis.id, basis.name);
    return { ok: true, url: commit.url, beschreibung: basis.name, zurueckgesetzt: true };
  } catch (f) {
    if (f instanceof CommitFehler) return { ok: false, fehler: f.message };
    console.error('[mdc] Spielort zurücksetzen fehlgeschlagen', f);
    return { ok: false, fehler: 'Das konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}
