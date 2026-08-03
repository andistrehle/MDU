# FoodPoints — Entscheidungen

Kurzprotokoll der Architektur- und Produktentscheidungen (neueste zuerst ergänzen).

## D-001: Eigenständige Sub-App im MDU-Repo
Das Repo enthält die produktive MDU-Dart-Plattform (eigene Marke, eigenes Layout,
Produktions-DB). FoodPoints ist ein anderes Produkt. Es lebt deshalb als eigenständige
Next.js-App unter `foodpoints/` mit eigener `package.json`, eigenem Build und eigenen
Supabase-Migrationen. Vorteile: Root-Build der Darts-Plattform bleibt unberührt, separates
Vercel-Projekt (Root Directory `foodpoints`), keine Vermischung von Routen, Auth oder DB-Schema.

## D-002: Eigene Punkteformel, versioniert, zentral konfiguriert
Die Punkteberechnung ist eine **eigene Näherungsformel** (nicht die Formel eines anderen
Anbieters) und liegt zentral in `lib/points/config.ts`. Jede Faktoränderung erzeugt eine neue
Formelversion; Tagebucheinträge speichern die verwendete Version (`formula_version`), damit
historische Einträge nachvollziehbar bleiben. Die DB-Tabelle `point_formula_versions` spiegelt
die Versionen für serverseitige Auswertungen.

## D-003: Demo-Modus als First-Class-Betriebsart
Ohne `NEXT_PUBLIC_SUPABASE_URL` läuft die App vollständig im Demo-Modus: Datenhaltung im
Browser (localStorage über einen Store-Adapter), Beispieldaten, MockVisionProvider. Dadurch ist
jede Funktion ohne externe Dienste lokal testbar (Anforderung „Mock-Modus ohne externe API").
Der Datenzugriff läuft überall über das Interface `DataStore`, sodass der Supabase-Store die
gleiche API implementiert.

## D-004: UI-Kit selbst gebaut statt shadcn/ui-Generator
Kleine, eigene UI-Primitiven (`components/ui/`) im shadcn-Stil (Tailwind v4, cva-frei, klare
Varianten). Grund: volle Kontrolle, keine Generator-Abhängigkeit, deutlich kleinerer
Abhängigkeitsbaum. Die Komponenten sind bewusst kompatibel benannt (Button, Card, Input, …),
sodass ein späterer Wechsel auf shadcn/ui mechanisch möglich ist.

## D-005: Barcode über ZXing statt BarcodeDetector
`BarcodeDetector` fehlt in Safari/iOS. `@zxing/browser` dekodiert EAN-8/13 und UPC-A/E per
`getUserMedia` auf allen Zielplattformen. Die Kamera-Logik ist in einer Komponente gekapselt;
ein Wechsel der Dekoder-Bibliothek bleibt lokal.

## D-006: Vision hinter Provider-Interface, Keys nur serverseitig
`VisionProvider` (analyzeMealImage / analyzeNutritionLabel) mit zwei Implementierungen:
`MockVisionProvider` (deterministisch, für Demo/Tests) und `ClaudeVisionProvider`
(Anthropic-API, strukturierte JSON-Antwort). Auswahl per ENV `VISION_PROVIDER`. Aufrufe laufen
ausschließlich über API-Routen; `VISION_API_KEY` erreicht nie den Client. KI-Ergebnisse werden
nie ungeprüft übernommen — immer Bestätigungsseite.

## D-007: Lebensmitteldaten über Provider-Schicht, Open Food Facts als externe Quelle
`FoodDataProvider` abstrahiert Suche und Barcode-Lookup. Open Food Facts ist die externe
Standardquelle (kein API-Key nötig, freie Lizenz, gute EAN-Abdeckung in DE). Jeder Datensatz
trägt `source` und `confidence`; externe Werte sind vor dem Speichern editier- und
bestätigungspflichtig.

## D-008: Kein TanStack Query im MVP
Datenzugriff ist im Demo-Modus synchron-lokal (zustand + localStorage), im Supabase-Modus
über wenige, klar geschnittene Aufrufe. TanStack Query brächte im MVP mehr Komplexität als
Nutzen; bei wachsender Server-Interaktion (P1: vollständiger Supabase-Sync) wird die
Entscheidung überprüft.

## D-009: EXIF-Entfernung durch Canvas-Re-Encoding
Fotos werden clientseitig vor dem Upload über ein Canvas neu kodiert (JPEG, max. 1600 px,
Qualität 0,82). Das komprimiert und entfernt EXIF-Metadaten (inkl. GPS). Serverseitige
Zweitabsicherung ist als P1 im Backlog.

## D-010: Zod v4 und Next.js 16
Das Repo pinnt Zod v4 (neue API: `z.email()`, geänderte Error-Struktur) und Next 16
(App Router, async `params`/`searchParams`, Node-Runtime-Defaults). Die Sub-App nutzt dieselben
Versionen wie das Root-Projekt, damit sich beide Apps im Repo gleich verhalten.

## D-011: Punkte werden zum Erfassungszeitpunkt eingefroren
Tagebucheinträge speichern die berechneten Punkte + Nährwerte als Snapshot (nicht nur eine
Food-Referenz). Ändert sich später ein Lebensmittel oder die Formel, bleiben historische Tage
stabil. Portionsänderungen im Tagebuch berechnen den Snapshot neu (mit der aktuellen Formel).
