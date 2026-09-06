// ============================================================
// MDC — eigene Domain oder Unterordner der MDU?
// ============================================================
//
// Dieselbe Anwendung läuft in zwei Ausprägungen:
//
//   mdudarts.de/mdc      Unterordner der MDU-Seite. Alle MDC-Verweise tragen
//                        das Präfix `/mdc`.
//   mdc-ranking.de       Eigene Domain. Die MDC liegt dort in der Wurzel:
//                        mdc-ranking.de/rangliste statt …/mdc/rangliste.
//
// Unterschieden wird über EINE Umgebungsvariable, die im jeweiligen
// Vercel-Projekt gesetzt wird:
//
//   NEXT_PUBLIC_MDC_STANDALONE=1   → eigene Domain
//   (nicht gesetzt)                → Unterordner der MDU
//
// Im Standalone-Projekt schreibt der Proxy (`proxy.ts`) jeden Aufruf intern
// auf `/mdc/…` um — die Seiten liegen im Code weiterhin unter `app/mdc`.
// Nach außen ist davon nichts zu sehen, weil alle Verweise über `mdcPath()`
// laufen und dort ohne Präfix herauskommen.
//
// Warum nicht einfach hart auf die neue Domain umstellen? Weil die MDU-Seite
// weiterhin auf die MDC verweisen können soll und die Vorschau unter
// mdudarts.de/mdc bis zum Umzug funktionieren muss.
// ============================================================

import { MDC_LEGAL_COMPLETE } from '@/data/mdc-legal';

/** Läuft dieser Build als eigenständige Seite unter mdc-ranking.de? */
export const MDC_STANDALONE = process.env.NEXT_PUBLIC_MDC_STANDALONE === '1';

/** Präfix aller MDC-Verweise: leer auf der eigenen Domain, sonst `/mdc`. */
export const MDC_BASE = MDC_STANDALONE ? '' : '/mdc';

/** Die eigene Domain — für kanonische Adressen, Sitemap und Weiterleitungen. */
export const MDC_ORIGIN = 'https://mdc-ranking.de';

/**
 * Die Facebook-Gruppe der MDC — Ankündigungen zu den Turnierabenden und die
 * aktuellen Listen.
 *
 * In den Texten steht bewusst NICHT, die Listen stünden dort zuerst: Sobald
 * die Ergebnisfotos direkt auf dieser Seite hochgeladen werden, stimmt das
 * nicht mehr.
 *
 * Bewusst ohne `?locale=`-Anhängsel: Der Parameter zwingt jedem Besucher die
 * Sprache auf, die beim Kopieren der Adresse gerade eingestellt war.
 *
 * Nur ein gewöhnlicher Verweis, kein eingebettetes Feed-Element — es lädt also
 * nichts von Facebook mit, solange niemand klickt. So steht es auch in den
 * Datenschutzhinweisen; wird das hier je zu einer Einbettung, muss der Text
 * dort mitgeändert werden.
 */
export const MDC_FACEBOOK_GROUP = 'https://www.facebook.com/groups/494489343989256/';

/**
 * Verweis innerhalb der MDC. Immer benutzen statt `/mdc/...` zu schreiben —
 * sonst zeigt der Verweis auf der eigenen Domain ins Leere.
 *
 *   mdcPath()             → '/mdc'  bzw. '/'
 *   mdcPath('/rangliste') → '/mdc/rangliste' bzw. '/rangliste'
 */
export function mdcPath(path = ''): string {
  return `${MDC_BASE}${path}` || '/';
}

/**
 * Pfad ohne das `/mdc`-Präfix — für Vergleiche in der Oberfläche.
 *
 * Nötig, weil der Proxy im Standalone-Projekt intern auf `/mdc/…` umschreibt:
 * Auf dem Server kommt dort `/mdc/rangliste` an, im Browser steht
 * `/rangliste`. Ohne diese Normalisierung würde die Kopfzeile serverseitig
 * einen anderen Punkt hervorheben als nach dem Laden im Browser.
 */
export function mdcRelativePath(pathname: string): string {
  if (pathname === '/mdc') return '/';
  if (pathname.startsWith('/mdc/')) return pathname.slice('/mdc'.length);
  return pathname;
}

/** Gehört dieser Pfad zur MDC? (In der MDU-Ausprägung die Weiche für alles.) */
export function isMdcPath(pathname: string): boolean {
  return MDC_STANDALONE || pathname === '/mdc' || pathname.startsWith('/mdc/');
}

/**
 * Darf die Seite in Suchmaschinen? Nur auf der eigenen Domain — und nur, wenn
 * die Pflichtangaben im Impressum stehen. Der zweite Teil ist Absicht: Eine
 * auffindbare Seite mit echten Personennamen ohne Anbieterkennzeichnung soll
 * gar nicht erst entstehen können.
 */
export const MDC_INDEXABLE = MDC_STANDALONE && MDC_LEGAL_COMPLETE;
