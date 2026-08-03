# FoodPoints

Moderne Web-App (PWA) zur Ernährungs- und Punkteverfolgung — mit Lebensmittelsuche,
Barcode-Scanner, Foto-Mahlzeitenerkennung, Nährwerttabellen-Scan, Rezepten und einem
persönlichen Tages-/Wochenbudget.

**Wichtig:** FoodPoints verwendet eine **eigene, transparente und konfigurierbare
Näherungsformel** für die Punkteberechnung (siehe [`docs/punkteformel.md`](docs/punkteformel.md)).
Die App ist eine eigenständige Marke und kein Nachbau eines anderen Anbieters.
Alle Budget- und Zielwerte sind allgemeine Schätzungen — keine medizinische Beratung.

## Schnellstart

```bash
cd foodpoints
npm install
npm run dev        # http://localhost:3000
```

Ohne konfigurierte ENV läuft die App vollständig im **Demo-Modus**: kein Login,
Beispieldaten, MockVisionProvider — alle Daten bleiben im Browser (localStorage).
Details zur Konfiguration: [`SETUP.md`](SETUP.md).

```bash
npm run typecheck  # TypeScript
npm test           # Unit-Tests (Vitest)
npm run build      # Produktions-Build
```

## Stack

Next.js 16 (App Router, Turbopack) · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (Auth/Postgres/Storage, RLS) · Zod · zustand · ZXing (Barcode) ·
Anthropic Claude Vision (optional, austauschbar) · Vitest.

## Architektur

```
foodpoints/
├── app/                  # Routen (Heute, Tagebuch, Scannen, Rezepte, Profil, …)
│   └── api/              # Serverrouten: Vision-Analyse, Barcode, Suche (Zod + Rate-Limit)
├── components/           # UI-Primitiven + Feature-Komponenten
├── lib/
│   ├── points/           # Punkteformel: config.ts (versioniert) + engine.ts
│   ├── nutrition/        # Nährwert-Typen, Normalisierung (kJ→kcal, Dezimalkomma, 100g/Portion)
│   ├── budget/           # Kalorienziel + Punktebudget, Wochenreserve, Übertrag
│   ├── diary/            # Tages-/Wochensummen, Eintrag-Factory (Snapshots)
│   ├── recipes/          # Rezeptberechnung
│   ├── food/             # Food-Modell, Seed-DB, Open-Food-Facts-Provider, Fuzzy-Matching
│   ├── vision/           # VisionProvider-Interface, Mock- und Claude-Implementierung
│   ├── store/            # Client-Store (zustand + localStorage), Demo-Seed
│   └── supabase/         # Browser-Client (optional)
├── supabase/migrations/  # Schema inkl. Row Level Security
├── tests/                # Vitest-Unit-Tests der Kernlogik
└── docs/                 # Punkteformel, VisionProvider, API
```

Zentrale Prinzipien:

- **Eine Berechnungs-Implementierung** für Client und Server (`lib/points/engine.ts`),
  Faktoren zentral und versioniert in `lib/points/config.ts`.
- **Snapshots im Tagebuch:** Einträge frieren Punkte, Nährwerte und Formelversion ein.
- **Provider-Schichten:** Vision und Lebensmitteldaten sind austauschbar; ohne ENV
  greifen Mock-Implementierungen.
- **KI ist nie autoritativ:** Jede Erkennung durchläuft eine Bestätigungsseite.
- **API-Keys nur serverseitig**, Uploads validiert, EXIF wird clientseitig entfernt.

## Dokumentation

- [`BACKLOG.md`](BACKLOG.md) — priorisierter Backlog (P0/P1/P2) + Risiken
- [`DECISIONS.md`](DECISIONS.md) — Architektur-Entscheidungen
- [`SETUP.md`](SETUP.md) — ENV, Supabase, Deployment
- [`docs/punkteformel.md`](docs/punkteformel.md) — Formel, 0-Punkte-Regeln, Versionierung
- [`docs/vision-provider.md`](docs/vision-provider.md) — Bildanalyse-Schnittstelle
- [`docs/api.md`](docs/api.md) — Serverrouten

## Hinweis zum Repository

FoodPoints lebt als eigenständige Sub-App im MDU-Repo (siehe `DECISIONS.md`, D-001).
Die Darts-Plattform im Repo-Root bleibt unberührt; Deployment erfolgt als separates
Vercel-Projekt mit Root Directory `foodpoints`.
