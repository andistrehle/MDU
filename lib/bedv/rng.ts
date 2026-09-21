// ============================================================
// Deterministischer Zufall für die Demo-Daten
// ============================================================
//
// Alle Demo-Inhalte (Ergebnisse, Spielerstatistiken, Highlights) werden
// GERECHNET, nicht abgetippt. Damit sie trotzdem bei jedem Aufruf und in
// jedem Build gleich aussehen, kommt der Zufall aus einem Startwert, der
// sich aus einer Zeichenkette ergibt — gleicher Text, gleiche Zahlen.
//
// Warum nicht `Math.random()`: Next rendert dieselbe Seite auf dem Server
// und (bei Client-Bausteinen) im Browser. Mit echtem Zufall stünden dort
// zwei verschiedene Ergebnisse — React meldet das als Hydration-Fehler, und
// in der Demo blitzten die Zahlen beim Laden um.
// ============================================================

/** FNV-1a: kurze Zeichenkette → 32-Bit-Startwert. */
export function seedOf(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 — kleiner, schneller Generator mit guter Streuung. */
export function rngOf(text: string): () => number {
  let a = seedOf(text);
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ganze Zahl in [min, max] — beide Enden eingeschlossen. */
export function intBetween(rnd: () => number, min: number, max: number): number {
  return min + Math.floor(rnd() * (max - min + 1));
}

/** Ein Element aus der Liste. */
export function pick<T>(rnd: () => number, list: readonly T[]): T {
  return list[Math.floor(rnd() * list.length)];
}

/** Liste mischen (Fisher-Yates) — ohne die Vorlage zu verändern. */
export function shuffled<T>(rnd: () => number, list: readonly T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
