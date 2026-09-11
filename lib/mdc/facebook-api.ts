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

  // Die Kennung hat die Form „<seite>_<beitrag>"; die Adresse setzt sich
  // daraus zusammen.
  const beitrag = antwort.id.includes('_') ? antwort.id.split('_')[1] : antwort.id;
  return {
    id: antwort.id,
    url: `https://www.facebook.com/${status.pageId}/posts/${beitrag}`,
  };
}
