// ============================================================
// Auffangpfad für unbekannte Adressen unter /bedv
// ============================================================
//
// `app/bedv/not-found.tsx` greift in Next NUR bei `notFound()`-Aufrufen.
// Für eine Adresse, zu der es gar keine Route gibt, nähme Next die 404 des
// Wurzelordners — die der MDU, samt deren Kopfzeile und Farben.
//
// Diese Route tut nichts außer `notFound()` aufzurufen und schiebt die
// Anfrage damit in die BeDV-eigene 404. Bestehende Seiten verdeckt sie
// nicht: In Next gewinnt immer die genauere Route.
//
// Dieselbe Lösung wie unter `app/mdc/[...unbekannt]/page.tsx` — dort war es
// derselbe Fehler, mit demselben Ergebnis.
// ============================================================

import { notFound } from 'next/navigation';

export default function UnbekannteAdresse(): never {
  notFound();
}
