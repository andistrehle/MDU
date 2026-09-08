'use server';

// ============================================================
// MDC — News schreiben, ändern, löschen
// ============================================================
//
// Wie beim Ergebnis-Upload prüft jede Aktion den Zugang selbst nach. Der Proxy
// tut das schon (`proxy.ts`), aber eine Aktion ist eine eigene Adresse im
// Netz und darf sich nicht darauf verlassen, dass vor ihr jemand aufgepasst
// hat.
// ============================================================

import { headers } from 'next/headers';
import type { NewsPost } from '@/data/news';
import { veroeffentlicheBeitrag, loescheBeitrag, newsId } from '@/lib/mdc/news-commit';
import { CommitFehler } from '@/lib/mdc/github';
import { getUploadStatus } from '@/lib/mdc/upload-config';

export interface NewsEingabe {
  /** Gesetzt beim Bearbeiten — dann wird dieser Beitrag ersetzt. */
  ersetzt?: string;
  date: string;
  title: string;
  teaser: string;
  category: string;
  /** Roher Text aus dem Textfeld; leere Zeile trennt Absätze. */
  text: string;
  published: boolean;
}

export type NewsErgebnis =
  | { ok: true; url: string; neu: boolean; id: string; published: boolean }
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

export async function speichereBeitrag(eingabe: NewsEingabe): Promise<NewsErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };

  const status = getUploadStatus();
  if (!status.canPublish) {
    return { ok: false, fehler: `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}.` };
  }

  const title = eingabe.title.trim();
  const teaser = eingabe.teaser.trim();
  const category = eingabe.category.trim() || 'MDC';

  if (title.length < 3) return { ok: false, fehler: 'Der Titel fehlt.' };
  if (title.length > 120) return { ok: false, fehler: 'Der Titel ist zu lang (höchstens 120 Zeichen).' };
  if (teaser.length < 10) {
    return {
      ok: false,
      fehler: 'Der Teaser fehlt. Er steht in der Übersicht und auf der Startseite — '
        + 'ein Satz, worum es geht.',
    };
  }
  if (teaser.length > 300) return { ok: false, fehler: 'Der Teaser ist zu lang (höchstens 300 Zeichen).' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eingabe.date)) {
    return { ok: false, fehler: 'Das Datum fehlt oder hat die falsche Form.' };
  }

  // Leerzeile trennt Absätze — so, wie man es beim Tippen erwartet.
  const paragraphs = eingabe.text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(a => a.trim().replace(/\n+/g, ' '))
    .filter(Boolean);

  if (!paragraphs.length) {
    return { ok: false, fehler: 'Der Beitrag hat keinen Text.' };
  }

  const beitrag: NewsPost = {
    // Beim Bearbeiten bleibt die Kennung, sonst zeigen verschickte Links ins
    // Leere. Nur ein neuer Beitrag bekommt eine neue.
    id: eingabe.ersetzt ?? newsId(title, eingabe.date),
    date: eingabe.date,
    title,
    teaser,
    category,
    paragraphs,
    published: eingabe.published,
  };

  try {
    const commit = await veroeffentlicheBeitrag({ beitrag, ersetzt: eingabe.ersetzt });
    return { ok: true, url: commit.url, neu: commit.neu, id: beitrag.id, published: beitrag.published };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] News speichern fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Der Beitrag konnte nicht abgelegt werden. Bitte noch einmal versuchen.' };
  }
}

export async function entferneBeitrag(id: string): Promise<NewsErgebnis> {
  if (!await zugangGeprueft()) return { ok: false, fehler: KEIN_ZUGANG };

  const status = getUploadStatus();
  if (!status.canPublish) {
    return { ok: false, fehler: `Das Ablegen ist nicht eingerichtet: ${status.missing.join(', ')}.` };
  }

  try {
    const commit = await loescheBeitrag(id);
    return { ok: true, url: commit.url, neu: false, id, published: false };
  } catch (fehler) {
    if (fehler instanceof CommitFehler) return { ok: false, fehler: fehler.message };
    console.error('[mdc] News löschen fehlgeschlagen', fehler);
    return { ok: false, fehler: 'Der Beitrag konnte nicht gelöscht werden. Bitte noch einmal versuchen.' };
  }
}
