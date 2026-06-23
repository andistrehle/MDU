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

import { getCurrentSeason } from '@/lib/data';

/** Versionsnummer der Vorlage. Bei einer neuen Vorlage hier hochzählen. */
export const TEMPLATE_VERSION = '1.0';

/** Saison, ab der diese Version gilt (Anzeigewert im Fußbereich). */
export const TEMPLATE_VALID_FROM = getCurrentSeason().name;

/** Öffentliche Druckansicht (leere Standardvorlage). */
export const TEMPLATE_ROUTE = '/spielberichte/vorlage';

/** Direkt-Drucken: dieselbe Route, öffnet den Druckdialog automatisch. */
export const TEMPLATE_PRINT_ROUTE = `${TEMPLATE_ROUTE}?print=1`;

/**
 * Dateiname für „Als PDF speichern". Die Saison wird dynamisch aus der
 * aktiven Saison abgeleitet; ist keine verfügbar, greift der übergebene
 * Fallback-Jahreswert.
 */
export function templateFileName(year: number = getCurrentSeason().year): string {
  return `MDU-Spielbericht-Saison-${year}.pdf`;
}

/** Dokumenttitel (ohne .pdf) — Browser nutzt ihn als Default-Dateiname beim Drucken. */
export function templateDocTitle(year: number = getCurrentSeason().year): string {
  return `MDU-Spielbericht-Saison-${year}`;
}

/** Fußzeile der Vorlage, z. B. „MDU-Spielbericht · Saison 2025/2026 · Version 1.0". */
export function templateFooter(seasonName: string = getCurrentSeason().name): string {
  return `MDU-Spielbericht · ${seasonName} · Version ${TEMPLATE_VERSION}`;
}
