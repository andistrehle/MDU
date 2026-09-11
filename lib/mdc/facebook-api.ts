// ============================================================
// MDC — Beitrag bei Facebook einstellen
// ============================================================
//
// WAS GEHT UND WAS NICHT — das ist hier das Wesentliche, und es liegt nicht
// an dieser Seite, sondern an Facebook:
//
//   SEITE (Page)    Beiträge lassen sich über die Graph-API einstellen, mit
//                   einem Seiten-Zugriffsschlüssel und der Berechtigung
//                   `pages_manage_posts`. Das ist der Weg, den dieses Modul
//                   geht.
//
//   GRUPPE          Geht NICHT. Meta hat die Groups-API zum Veröffentlichen
//                   abgeschaltet (`publish_to_groups` wurde zurückgezogen).
//                   Kein Programm kann in eine Facebook-Gruppe schreiben —
//                   auch keins von jemand anderem. Für die MDC-Gruppe bleibt
//                   deshalb: Text kopieren, in der Gruppe einfügen. Genau
//                   dafür gibt es den Kopierknopf in der Verwaltung.
//
//   PROFIL          Geht ebenfalls nicht; persönliche Chroniken sind für
//                   Programme seit Jahren zu.
//
// Ohne hinterlegten Schlüssel wird hier nichts versucht und nichts
// vorgetäuscht: `facebookStatus()` sagt, was fehlt, und die Verwaltung zeigt
// dann nur den Kopierweg.
// ============================================================

import 'server-only';

/** Feste Version der Graph-API — ohne Angabe wandert Facebook weiter. */
const GRAPH = 'https://graph.facebook.com/v21.0';

export interface FacebookStatus {
  /** Kann die Seite selbst posten? */
  canPost: boolean;
  /** Welche Angaben fehlen dafür — Klartext für die Oberfläche. */
  missing: string[];
  /** Kennung der Facebook-Seite, falls hinterlegt. */
  pageId: string | null;
}

export function facebookStatus(): FacebookStatus {
  const pageId = (process.env.MDC_FB_PAGE_ID ?? '').trim();
  const token = (process.env.MDC_FB_PAGE_TOKEN ?? '').trim();
  const missing: string[] = [];
  if (!pageId) missing.push('MDC_FB_PAGE_ID (Kennung der Facebook-Seite)');
  if (!token) missing.push('MDC_FB_PAGE_TOKEN (Zugriffsschlüssel der Seite)');
  return { canPost: missing.length === 0, missing, pageId: pageId || null };
}

export class FacebookFehler extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FacebookFehler';
  }
}

/**
 * Stellt den Beitrag auf der hinterlegten Seite ein und gibt die Adresse des
 * Beitrags zurück. Wirft mit Klartext, wenn Facebook ablehnt — die häufigen
 * Fälle stehen im Rat mit dabei.
 */
export async function posteAufFacebook(
  text: string,
  link?: string,
): Promise<{ id: string; url: string }> {
  const status = facebookStatus();
  if (!status.canPost) {
    throw new FacebookFehler(`Facebook ist nicht eingerichtet: ${status.missing.join(', ')}.`);
  }

  const body = new URLSearchParams({
    message: text,
    access_token: (process.env.MDC_FB_PAGE_TOKEN ?? '').trim(),
  });
  // Mit `link` zieht Facebook die Vorschau der Seite in den Beitrag — dasselbe
  // Bild, das WhatsApp zeigt (`app/mdc/opengraph-image.png`).
  if (link) body.set('link', link);

  const res = await fetch(`${GRAPH}/${status.pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });

  const antwort = await res.json().catch(() => null) as
    { id?: string; error?: { message?: string; code?: number; type?: string } } | null;

  if (!res.ok || !antwort?.id) {
    const meldung = antwort?.error?.message ?? `HTTP ${res.status}`;
    const code = antwort?.error?.code;
    const rat = code === 190
      ? '\n\nDer Zugriffsschlüssel gilt nicht mehr. Seiten-Schlüssel laufen ab, wenn sie '
        + 'nicht als langlebiger Schlüssel erzeugt wurden — im Meta-Entwicklerbereich einen '
        + 'neuen holen und als MDC_FB_PAGE_TOKEN hinterlegen.'
      : code === 200
        ? '\n\nDem Schlüssel fehlt die Berechtigung `pages_manage_posts` für diese Seite.'
        : '';
    throw new FacebookFehler(`Facebook hat abgelehnt: ${meldung}${rat}`);
  }

  return { id: antwort.id, url: beitragsAdresse(antwort.id, status.pageId as string) };
}

/** Die Kennung hat die Form „<seite>_<beitrag>" — daraus wird die Adresse. */
function beitragsAdresse(id: string, pageId: string): string {
  const beitrag = id.includes('_') ? id.split('_')[1] : id;
  return `https://www.facebook.com/${pageId}/posts/${beitrag}`;
}

/**
 * Beitrag mit mehreren Bildern.
 *
 * Facebook kennt dafür keinen einzelnen Aufruf: Erst wird jedes Bild
 * hochgeladen, aber NICHT veröffentlicht (`published=false`) — das gibt je
 * eine Kennung. Die werden dann als `attached_media` an den eigentlichen
 * Beitrag gehängt. Anders bekäme man zwei einzelne Bildbeiträge statt eines
 * mit zwei Bildern.
 *
 * ACHTUNG: Dieser Weg ist gegen die Graph-API nicht erprobt — die MDC hat
 * heute keine Facebook-Seite, an der sich das ausprobieren ließe. Er ist nach
 * der Dokumentation gebaut. Wer ihn zum ersten Mal benutzt, prüft bitte nach,
 * was dabei herauskommt.
 */
export async function posteBilderAufFacebook(
  text: string,
  bilder: { name: string; daten: Uint8Array }[],
): Promise<{ id: string; url: string }> {
  const status = facebookStatus();
  if (!status.canPost) {
    throw new FacebookFehler(`Facebook ist nicht eingerichtet: ${status.missing.join(', ')}.`);
  }
  if (!bilder.length) throw new FacebookFehler('Kein Bild zum Einstellen.');

  const token = (process.env.MDC_FB_PAGE_TOKEN ?? '').trim();
  const kennungen: string[] = [];

  for (const bild of bilder) {
    const form = new FormData();
    form.set('published', 'false');
    form.set('access_token', token);
    form.set('source', new Blob([new Uint8Array(bild.daten)], { type: 'image/png' }), bild.name);

    const res = await fetch(`${GRAPH}/${status.pageId}/photos`, {
      method: 'POST',
      body: form,
      cache: 'no-store',
    });
    const antwort = await res.json().catch(() => null) as
      { id?: string; error?: { message?: string } } | null;
    if (!res.ok || !antwort?.id) {
      throw new FacebookFehler(
        `Facebook hat das Bild „${bild.name}" abgelehnt: `
        + `${antwort?.error?.message ?? `HTTP ${res.status}`}`,
      );
    }
    kennungen.push(antwort.id);
  }

  const body = new URLSearchParams({ message: text, access_token: token });
  kennungen.forEach((id, i) => {
    body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
  });

  const res = await fetch(`${GRAPH}/${status.pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const antwort = await res.json().catch(() => null) as
    { id?: string; error?: { message?: string } } | null;
  if (!res.ok || !antwort?.id) {
    throw new FacebookFehler(
      'Die Bilder liegen bei Facebook, der Beitrag dazu ist aber nicht entstanden: '
      + `${antwort?.error?.message ?? `HTTP ${res.status}`}`,
    );
  }

  return { id: antwort.id, url: beitragsAdresse(antwort.id, status.pageId as string) };
}
