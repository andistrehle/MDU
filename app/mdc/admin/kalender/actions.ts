'use server';

// ============================================================
// MDC — Termine absagen und ansetzen
// ============================================================
//
// Wie bei News und Ergebnis-Upload prüft jede Aktion den Zugang selbst nach.
// Der Proxy tut das schon (`proxy.ts`), aber eine Aktion ist eine eigene
// Adresse im Netz und darf sich nicht darauf verlassen, dass vor ihr jemand
// aufgepasst hat.
// ============================================================

import { headers } from 'next/headers';
import type { TerminArt, Terminaenderung } from '@/data/kalender';
import { getVenue } from '@/data/venues';
import { speichereTermin, loescheTermin, terminId } from '@/lib/mdc/kalender-commit';
import { CommitFehler } from '@/lib/mdc/github';
import { getUploadStatus } from '@/lib/mdc/upload-config';

export interface TerminEingabe {
  date: string;
  venueId: string;
  art: TerminArt;
  /** Nur beim Zusatztermin; leer = die Standardzeit des Lokals. */
  time?: string;
  note?: string;
}

export type TerminErgebnis =
  | { ok: true; url: string; neu: boolean; id: string }
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

export async function speichereAenderung(eingabe: TerminEingabe): Promise<TerminErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(eingabe.date)) {
    return { ok: false, fehler: 'Das Datum fehlt oder hat die falsche Form.' };
  }
  // Der Spielort muss eines der elf Lokale sein — freie Eingabe gibt es hier
  // bewusst nicht, sonst hätte der Termin keine Adresse und keine Seite.
  const venue = getVenue(eingabe.venueId);
  if (!venue) return { ok: false, fehler: 'Bitte einen der MDC-Spielorte auswählen.' };

  const zeit = (eingabe.time ?? '').trim();
  if (zeit && !/^\d{2}:\d{2}$/.test(zeit)) {
    return { ok: false, fehler: 'Die Uhrzeit muss wie „19:30" aussehen.' };
  }

  const note = (eingabe.note ?? '').trim();
  if (note.length > 200) {
    return { ok: false, fehler: 'Der Hinweis ist zu lang (höchstens 200 Zeichen).' };
  }

  // Eine Absage am falschen Wochentag wäre wirkungslos — dort steht ohnehin
  // kein Termin. Lieber sagen als stillschweigend nichts tun.
  if (eingabe.art === 'absage') {
    const tag = new Date(`${eingabe.date}T00:00:00Z`).getUTCDay();
    const wochentag = tag === 0 ? 7 : tag;
    if (!venue.weekdays.includes(wochentag as 1 | 2 | 3 | 4 | 5 | 6 | 7)) {
      return {
        ok: false,
        fehler: `Im ${venue.name} wird an diesem Wochentag ohnehin nicht gespielt — `
          + 'da gibt es nichts abzusagen.',
      };
    }
  }

  const eintrag: Terminaenderung = {
    id: terminId(eingabe.date, venue.id, eingabe.art),
    date: eingabe.date,
    venueId: venue.id,
    art: eingabe.art,
    time: eingabe.art === 'zusatz' ? (zeit || venue.time) : null,
    note: note || null,
  };

  try {
    const commit = await speichereTermin(eintrag);
    return { ok: true, url: commit.url, neu: commit.neu, id: eintrag.id };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Kalender speichern fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Der Eintrag konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

export async function entferneAenderung(id: string): Promise<TerminErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };
  const nichtBereit = bereit();
  if (nichtBereit) return { ok: false, fehler: nichtBereit };

  try {
    const commit = await loescheTermin(id);
    return { ok: true, url: commit.url, neu: false, id };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] Kalender löschen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Der Eintrag konnte nicht zurückgenommen werden. Bitte noch einmal versuchen.' };
  }
}
