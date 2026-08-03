# FoodPoints — API-Routen

Alle Routen validieren Eingaben mit Zod und sind rate-limitiert (in-memory,
best effort — zentraler Store ist P1). API-Keys externer Dienste bleiben
ausschließlich serverseitig.

## POST `/api/vision/analyze-meal`

Analysiert ein Mahlzeitenfoto über den konfigurierten VisionProvider.

Request:

```json
{ "imageBase64": "<jpeg base64>", "mimeType": "image/jpeg", "hint": "optional" }
```

Response: `MealAnalysisResult` (siehe `docs/vision-provider.md`).
Fehler: `400` (Validierung), `429` (Rate-Limit), `502` (Provider-Fehler).

## POST `/api/vision/analyze-label`

Liest eine fotografierte Nährwerttabelle aus.

Request:

```json
{ "imageBase64": "<jpeg base64>", "mimeType": "image/jpeg", "frontImageBase64": "optional" }
```

Response: `LabelAnalysisResult` — Rohwerte nullable (fehlende Werte werden nie
erfunden), Bezugsgröße + Portionsgröße, `uncertainFields`.

## GET `/api/foods/search?q=…&external=1`

Lebensmittelsuche: lokale Seed-Datenbank + optional Open Food Facts.

Response:

```json
{ "local": [Food], "external": [Food], "externalError": false }
```

Externe Fehler blockieren die lokalen Treffer nie (`externalError: true`).

## GET `/api/barcode/[code]`

Barcode-Lookup (EAN-8/13, UPC-A/E; `^\d{6,14}$`). Reihenfolge: Seed-DB →
Open Food Facts. Response `{ "food": Food | null }`; `null` = unbekanntes
Produkt (Client bietet Etikett-Scan oder manuelles Anlegen an).

## Tagebuch, Rezepte, Zusammenfassungen

Tagebuch-/Rezept-Operationen und Tages-/Wochenzusammenfassungen laufen im
Demo-Modus vollständig clientseitig über den lokalen Store
(`lib/store/app-store.ts`) mit derselben Berechnungs-Engine wie der Server.
Im Supabase-Modus schreibt der Client direkt über supabase-js gegen die
RLS-gesicherten Tabellen (vollständiger Sync: Backlog P1). Datenexport ist im
Profil als JSON-Download umgesetzt; serverseitiger Export + Accountlöschung
über Supabase-RPC sind im Backlog (P1) dokumentiert.
