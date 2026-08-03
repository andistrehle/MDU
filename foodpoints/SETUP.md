# FoodPoints — Setup

## Lokal entwickeln

```bash
cd foodpoints
npm install
npm run dev
```

Ohne weitere Konfiguration startet die App im **Demo-Modus** (kein Login,
Daten im Browser, MockVisionProvider). Das reicht für UI-Entwicklung und
alle Kern-Flows.

## Umgebungsvariablen

Referenz: [`.env.example`](.env.example) — lokal in `foodpoints/.env.local`,
produktiv im Vercel-Projekt setzen. **Werte niemals committen.**

| Variable | Zweck |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Aktiviert Supabase (Auth). Fehlen sie → Demo-Modus. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, für Admin-/Cleanup-Skripte. |
| `NEXT_PUBLIC_SITE_URL` | Basis-URL für Auth-Redirects. |
| `VISION_PROVIDER` | `mock` (Default) oder `claude`. |
| `VISION_API_KEY` / `VISION_MODEL` | Server-only; Anthropic-Key + Modell für die Bildanalyse. |
| `FOOD_DATA_PROVIDER` | `openfoodfacts` (Default) oder `mock`. |

## Supabase einrichten

1. Neues Supabase-Projekt anlegen (eigenes Projekt — **nicht** die MDU-Datenbank!).
2. Migration ausführen: Inhalt von `supabase/migrations/0001_init.sql` im
   SQL-Editor ausführen (oder `supabase db push` mit dem Supabase-CLI).
   Die Migration legt alle Tabellen, Indizes, RLS-Policies, den privaten
   Storage-Bucket `meal-photos` und die Formelversion `fp-v1` an.
3. Auth → E-Mail-Provider aktivieren; Redirect-URLs auf die App-Domain setzen.
4. ENV-Variablen setzen (siehe oben).

## Tests

```bash
npm test           # Vitest-Unit-Tests (Formel, Normalisierung, Budget, Tagebuch, Rezepte)
npm run typecheck  # tsc --noEmit
npm run build      # Produktions-Build (muss grün sein vor jedem Push)
```

## Deployment (Vercel)

1. Neues Vercel-Projekt auf dieses Repo, **Root Directory: `foodpoints`**.
2. ENV-Variablen im Projekt setzen.
3. Build Command/Install Command: Standard (`next build` / `npm install`).

Die Darts-Plattform im Repo-Root hat ihr eigenes Vercel-Projekt; beide Apps
deployen unabhängig.
