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

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface BrandImage {
  src: string;
  width: number;
  height: number;
  /** Breiter als hoch (Banner) statt quadratisch (Emblem). */
  wide: boolean;
}

/** Maße aus dem Dateikopf lesen — PNG-Header bzw. viewBox des SVG. */
function readSize(path: string): { width: number; height: number } | null {
  const data = readFileSync(path);
  // PNG: Breite und Höhe stehen fest an Byte 16–24.
  if (data.subarray(1, 4).toString() === 'PNG') {
    return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
  }
  // SVG: viewBox bevorzugt, sonst width/height.
  const text = data.subarray(0, 2000).toString('utf8');
  const viewBox = text.match(/viewBox=["']\s*[\d.-]+[ ,]+[\d.-]+[ ,]+([\d.]+)[ ,]+([\d.]+)/);
  if (viewBox) return { width: Number(viewBox[1]), height: Number(viewBox[2]) };
  const w = text.match(/\swidth=["']([\d.]+)/);
  const h = text.match(/\sheight=["']([\d.]+)/);
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
  return null;
}

/** Reihenfolge der Suche — SVG zuerst, weil es in jeder Größe scharf bleibt. */
const CANDIDATES = ['logo.svg', 'logo.png', 'logo.webp', 'logo.jpg'];

function findInPublic(files: string[]): BrandImage | null {
  for (const file of files) {
    const path = join(process.cwd(), 'public', 'mdc', file);
    if (!existsSync(path)) continue;
    const size = readSize(path) ?? { width: 1, height: 1 };
    return {
      src: `/mdc/${file}`,
      width: size.width,
      height: size.height,
      // Ab Seitenverhältnis 1,6 behandeln wir die Datei als Banner: Sie trägt
      // dann den Schriftzug schon selbst und ersetzt ihn daneben.
      wide: size.width / size.height >= 1.6,
    };
  }
  return null;
}

/**
 * Pfad zur Logodatei oder `null`, wenn keine hinterlegt ist.
 *
 * Wird im Layout aufgerufen und an Kopf- und Fußzeile weitergereicht —
 * `node:fs` gibt es nur auf dem Server, nicht im Browser.
 */
export function logoSrc(): BrandImage | null {
  return findInPublic(CANDIDATES);
}

/** Nur die Skyline, falls sie einzeln vorliegt. */
export function skylineSrc(): BrandImage | null {
  return findInPublic(['skyline.svg', 'skyline.png']);
}

/** Nur der Dartwerfer, falls er einzeln vorliegt. */
export function throwerSrc(): BrandImage | null {
  return findInPublic(['werfer.svg', 'werfer.png', 'thrower.svg']);
}
