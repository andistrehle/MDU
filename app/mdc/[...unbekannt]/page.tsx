// ============================================================
// MDC — Auffangpfad für unbekannte Adressen
// ============================================================
//
// WOZU DIESE DATEI: `app/mdc/not-found.tsx` greift in Next NUR, wenn eine
// Seite `notFound()` aufruft — etwa `/spieler/gibtsdennicht`. Für eine Adresse,
// zu der es GAR KEINE Route gibt, nimmt Next die 404 des WURZEL-Ordners. Und
// die ist die der MDU.
//
// Das hatte zwei sichtbare Folgen:
//
//   mdc-ranking.de   Ein Tippfehler landete auf einer nackten Seite ohne Kopf-
//                    und Fußzeile, im Reiter stand „Münchner Dart Union (MDU)
//                    – Dart-Liga München". Falsche Marke auf der eigenen
//                    Domain, dazu eine Sackgasse ohne Navigation.
//
//   mdudarts.de/mdc  Schlimmer: Die MDU-404 rendert `<DesktopHeader />`, der
//                    `useAuth()` aufruft. Unter `/mdc` stellt
//                    `components/mdu/app-providers.tsx` den Anmeldekontext
//                    absichtlich NICHT — der Aufruf warf beim Hydrieren, und
//                    aus dem Tippfehler wurde „Da ist etwas schiefgelaufen".
//
// Diese Route fängt alles ab, was unterhalb von `/mdc` sonst nirgends passt,
// und ruft `notFound()` auf. Damit greift die nächstgelegene 404 — und das ist
// `app/mdc/not-found.tsx`, mitsamt Kopf- und Fußzeile der MDC und ihren
// Seitenangaben.
//
// Bestehende Seiten verdeckt sie nicht: In Next gewinnt die genauere Route,
// ein Auffangpfad steht immer hinten an.
// ============================================================

import { notFound } from 'next/navigation';

export default function MdcUnbekanntePage() {
  notFound();
}
