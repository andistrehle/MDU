// ============================================================
// BeDV-Demo — Grundeinstellungen
// ============================================================
//
// Unverbindliche Design- und Funktionsdemo für den Bayerischen
// Elektronik-Dart Verein e. V. (BeDV). KEIN Auftrag des Verbands, keine
// offizielle Seite — der Hinweis darauf steht in der Fußzeile jeder Seite
// und im Kopf der Startseite.
//
// Eigenständig neben MDU und MDC: eigene Datenschicht (`data/bedv/`),
// eigene Bausteine (`components/bedv/`), eigenes Erscheinungsbild
// (`app/bedv/bedv.css`). Gemeinsam ist nur der Next.js-Rahmen.
// ============================================================

/** Präfix aller Verweise innerhalb der Demo. */
export const BEDV_BASE = '/bedv';

/**
 * Verweis innerhalb der BeDV-Demo. Immer benutzen statt `/bedv/...` zu
 * schreiben — falls die Demo je auf eine eigene Adresse zieht, hängt die
 * Umstellung an dieser einen Funktion (so wie bei der MDC).
 *
 *   bedvPath()          → '/bedv'
 *   bedvPath('/ligen')  → '/bedv/ligen'
 */
export function bedvPath(path = ''): string {
  return `${BEDV_BASE}${path}` || '/';
}

/** Gehört dieser Pfad zur BeDV-Demo? Weiche für die MDU-Oberfläche. */
export function isBedvPath(pathname: string): boolean {
  return pathname === BEDV_BASE || pathname.startsWith(`${BEDV_BASE}/`);
}

/** Pfad ohne Präfix — für Vergleiche in der Navigation. */
export function bedvRelativePath(pathname: string): string {
  if (pathname === BEDV_BASE) return '/';
  if (pathname.startsWith(`${BEDV_BASE}/`)) return pathname.slice(BEDV_BASE.length);
  return pathname;
}

/**
 * Niemals indexieren.
 *
 * Das ist keine Vorsichtsmaßnahme auf Zeit wie bei der MDU, sondern
 * dauerhaft: Die Demo trägt Verbandsnamen und Verbandsstruktur, ist aber
 * nicht vom BeDV beauftragt. Eine auffindbare Kopie wäre eine zweite
 * „BeDV-Seite" im Suchindex — genau das darf nicht passieren.
 */
export const BEDV_INDEXABLE = false as const;

/** Voller Verbandsname — steht so auf der bestehenden Seite des BeDV. */
export const BEDV_NAME_LANG = 'Bayerischer Elektronik-Dart Verein e. V.';
export const BEDV_NAME_KURZ = 'BeDV';

/** Der Hinweis, der auf jeder Seite sichtbar bleiben muss. */
export const BEDV_DISCLAIMER =
  'Unverbindliche Design- und Funktionsdemo – keine offizielle Website des BeDV.';

export const BEDV_DISCLAIMER_LANG =
  'Diese Seite ist eine unverbindliche Design- und Funktionsdemo. Sie wurde ' +
  'nicht vom Bayerischen Elektronik-Dart Verein e. V. beauftragt, ist keine ' +
  'offizielle Website des Verbands und wird nicht von ihm betrieben. ' +
  'Mannschaften, Spielerinnen und Spieler, Ergebnisse, Termine und Beiträge ' +
  'sind frei erfundene Demo-Daten.';
