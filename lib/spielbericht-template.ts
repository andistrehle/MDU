// ============================================================
// Offizieller MDU-Spielbericht (Druckvorlage) — zentrale Konfiguration
// ============================================================
//
// Eine einzige Quelle für die druckbare A4-Vorlage (Phase 0). Genutzt vom
// öffentlichen Downloadbereich, vom Teamkapitän-Bereich und von der
// Druckansicht selbst, damit alle Stellen dieselbe aktuelle Version und
// denselben (dynamischen) Dateinamen verwenden.
//
// Bewusst ohne externe PDF-Bibliothek: die Vorlage ist eine druckoptimierte
// HTML-Seite (Route TEMPLATE_ROUTE), die der Browser über „Als PDF speichern"
// ausgibt. Kein zweites PDF-System, keine doppelte Datei.
// ============================================================

// Saison, für die die Vorlage gilt — bewusst als klar konfigurierbarer Wert
// gepflegt. NICHT an getCurrentSeason() gekoppelt: jene steuert weiterhin die
// laufenden Sportdaten (Tabellen/Spielplan). Hier zur neuen Saison einfach
// Name + Slug hochsetzen.
export const TEMPLATE_SEASON_NAME = 'Saison 2026/2027';
/** Slug für den Dateinamen, z. B. „2026-2027". */
export const TEMPLATE_SEASON_SLUG = '2026-2027';

/** Versionsnummer der Vorlage. Bei einer neuen Vorlage hier hochzählen. */
export const TEMPLATE_VERSION = '1.0';

/** Saison, ab der diese Version gilt (Anzeigewert im Fußbereich). */
export const TEMPLATE_VALID_FROM = TEMPLATE_SEASON_NAME;

/** Öffentliche Druckansicht (leere Standardvorlage). */
export const TEMPLATE_ROUTE = '/spielberichte/vorlage';

/** Direkt-Drucken: dieselbe Route, öffnet den Druckdialog automatisch. */
export const TEMPLATE_PRINT_ROUTE = `${TEMPLATE_ROUTE}?print=1`;

/** Dateiname für „Als PDF speichern". */
export function templateFileName(slug: string = TEMPLATE_SEASON_SLUG): string {
  return `MDU-Spielbericht-Saison-${slug}.pdf`;
}

/** Dokumenttitel (ohne .pdf) — Browser nutzt ihn als Default-Dateiname beim Drucken. */
export function templateDocTitle(slug: string = TEMPLATE_SEASON_SLUG): string {
  return `MDU-Spielbericht-Saison-${slug}`;
}

/** Fußzeile der Vorlage, z. B. „MDU-Spielbericht · Saison 2026/2027 · Version 1.0". */
export function templateFooter(seasonName: string = TEMPLATE_SEASON_NAME): string {
  return `MDU-Spielbericht · ${seasonName} · Version ${TEMPLATE_VERSION}`;
}
