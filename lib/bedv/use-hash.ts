'use client';

// ============================================================
// Die Sprungmarke der Adresse lesen (`#tabelle`)
// ============================================================
//
// Bewusst über `useSyncExternalStore` statt über einen Effekt, der beim
// Einhängen den Zustand setzt. Zwei Gründe:
//
//   • React rät von `setState` direkt im Effektrumpf ab — es erzwingt einen
//     zweiten Durchgang, und der Linter dieses Projekts meldet es als Fehler.
//   • Nebenbei fällt ein Fehler weg, den die Effekt-Variante gar nicht
//     abgedeckt hätte: Ändert sich die Marke später (zweiter Klick auf einen
//     Verweis mit `#…`), zieht die Oberfläche jetzt mit.
//
// Auf dem Server gibt es keine Sprungmarke — dort ist die Antwort leer, und
// damit rendern Server und Browser im ersten Durchgang dasselbe.
// ============================================================

import { useSyncExternalStore } from 'react';

function abonnieren(melden: () => void): () => void {
  window.addEventListener('hashchange', melden);
  return () => window.removeEventListener('hashchange', melden);
}

function jetzt(): string {
  return window.location.hash.replace('#', '');
}

function aufDemServer(): string {
  return '';
}

/** Die aktuelle Sprungmarke ohne `#`. Leer, solange keine gesetzt ist. */
export function useHash(): string {
  return useSyncExternalStore(abonnieren, jetzt, aufDemServer);
}
