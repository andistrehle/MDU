// ============================================================
// OCR — Highlights: Strichlisten-Anzahl korrigieren
// ============================================================
//
// 180er und 171er werden auf dem Bogen per Strichliste gezählt (| = 1, || = 2,
// ||| = 3 …). OCR liest eine Strichfolge leicht als Dezimalzahl (|| → „11",
// ||| → „111"). Da 11/111/1111 reale 180er-/171er-Anzahlen praktisch
// ausschließt, deuten wir eine reine Einser-Folge als ANZAHL der Striche
// (Stellenzahl). Eine echte Ziffer (z. B. „2", „3") bleibt unverändert.
//
// Gilt nur für die Anzahl-Typen (180/171); High Finish (Checkout-Wert) und
// Short Leg (Dart-Anzahl) sind echte Werte und bleiben unberührt.
// Reine Logik (kein server-only) — auch in der Prüfansicht nutzbar.
// ============================================================

import type { OcrHighlight } from './schemas';

const COUNT_TYPES = new Set<OcrHighlight['type']>(['180', '171']);

/** Korrigiert eine als Strichliste fehlgelesene Anzahl (|| → 2 statt 11). */
export function normalizeHighlightValue(type: OcrHighlight['type'], value: number | null): number | null {
  if (value == null || !COUNT_TYPES.has(type)) return value;
  const s = String(value);
  // Reine Einser-Folge (1, 11, 111, …) → Anzahl der Striche = Stellenzahl.
  if (/^1{2,}$/.test(s)) return s.length;
  return value;
}

/** Liefert die Highlights mit korrigierter Anzahl (180/171). */
export function normalizeHighlights(highlights: OcrHighlight[]): OcrHighlight[] {
  return highlights.map(h => ({ ...h, value: normalizeHighlightValue(h.type, h.value) }));
}
