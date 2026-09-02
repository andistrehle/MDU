// ============================================================
// MDC — Originaldateien der Marke finden
// ============================================================
//
// Liegt eine Logodatei unter `public/mdc/`, wird sie benutzt — sonst greift
// die gezeichnete Fassung in `components/mdc/logo.tsx`.
//
// Zweck: Der Betreiber soll die Datei nur ablegen müssen. Kein Pfad
// eintragen, keine Zeile Code ändern, nichts umbenennen außer dem Dateinamen.
//
// Geprüft wird beim Bauen der Seite. Eine neu hochgeladene Datei ist also mit
// dem nächsten Deploy da — bei Vercel passiert das durch den Upload selbst.
// ============================================================

import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** Reihenfolge der Suche — SVG zuerst, weil es in jeder Größe scharf bleibt. */
const CANDIDATES = ['logo.svg', 'logo.png', 'logo.webp', 'logo.jpg'];

function findInPublic(files: string[]): string | null {
  for (const file of files) {
    if (existsSync(join(process.cwd(), 'public', 'mdc', file))) {
      return `/mdc/${file}`;
    }
  }
  return null;
}

/**
 * Pfad zur Logodatei oder `null`, wenn keine hinterlegt ist.
 *
 * Wird im Layout aufgerufen und an Kopf- und Fußzeile weitergereicht —
 * `node:fs` gibt es nur auf dem Server, nicht im Browser.
 */
export function logoSrc(): string | null {
  return findInPublic(CANDIDATES);
}

/** Nur die Skyline, falls sie einzeln vorliegt. */
export function skylineSrc(): string | null {
  return findInPublic(['skyline.svg', 'skyline.png']);
}

/** Nur der Dartwerfer, falls er einzeln vorliegt. */
export function throwerSrc(): string | null {
  return findInPublic(['werfer.svg', 'werfer.png', 'thrower.svg']);
}
