# Übergabe / Handover — MDU-Plattform

Kurznotiz für den Rechnerwechsel. Maßgeblich für Details bleiben **`CLAUDE.md`**
(Arbeitsweise) und **`docs/BACKLOG.md`** (offene Punkte). Diese Datei ist nur die
Startrampe.

## Stand
- **Repo:** `andistrehle/MDU` · **Branch:** `main` · **Deploy:** Vercel (auto bei Push auf `main`)
- **🟢 LIVE seit 20.07.2026** (Commit `90b68c5`): https://www.mdudarts.de ist **offen
  und indexierbar** (`SITE_INDEXABLE=true`, `COMING_SOON=false`). Verifiziert: Startseite
  echt, `robots.txt=Allow: /`, Bestätigungsmail-Links auf `www.mdudarts.de`, Login ok,
  Rechts-Banner entfernt.
- Working Tree ist **sauber**, lokaler `main` == `origin/main` (nichts Uncommittetes).

## Neuer Rechner — Setup
1. `git clone` des Repos, dann `npm install` (Node 22.x, npm 10.x; hier lief 22.22.2 / 10.9.7).
2. **`.env.local` neu anlegen** — Vorlage ist `.env.example`. Die echten Werte liegen
   **nicht im Repo**, sondern in **Vercel** (Project → Settings → Environment Variables)
   und im **Supabase-Dashboard**. Benötigte Namen (siehe `.env.example` / `CLAUDE.md`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` (server-only), `RESEND_API_KEY`, `EMAIL_FROM`,
   `OCR_FEATURE_ENABLED`, `OCR_PROVIDER`, `OCR_MODEL`, `OCR_API_KEY`.
   ⚠️ Achtung: **eine gemeinsame Prod-DB** für localhost UND live — schreibende
   Skripte (`scripts/*.mjs`, Service-Role) treffen echte Daten.
3. Vor jedem Push grün halten: **`npx tsc --noEmit`** und **`npm run build`**.
4. Push-Workflow: vor dem Push `git pull --rebase origin main`, dann direkt auf `main`
   (eine GitHub-Action pusht ebenfalls auf `main`).

## Zuletzt umgesetzt (diese Sitzung, alles auf `main`)
- **UT-09** Tabelle mobil: Zeilen-Tap → direkt ins Teamprofil (kein Aufklappen mehr);
  Team-/Liga-Tabs klebten beim Scrollen unter dem 70px-Header → jetzt `top:70`, klickbar.
  Zusätzlich: Team-Karte unter der Liga-Tabelle mobil ausgeblendet + dekorative
  (nicht funktionale) Tabs in dieser Karte entfernt.
- **UT-10** Statistik: Team-Tab „Statistik" → Coming-Soon; Liga-Statistik = Einzelrangliste
  + Coming-Soon-Platzhalter für weitere.
- **UT-11** Alle klickbaren dartunion.de-Links entfernt (zuletzt 4 variablen-basierte
  `href={dartUrl}` in der Liga-Detailseite; „dartunion.de" bleibt als Klartext-Quelle).
- Früher in der Serie erledigt: UT-01 (Demo-Button nur Startseite/Dashboard),
  UT-06 (Button-Rahmen im Zoom/WebView), UT-07 (Player-Card Scroll-Lock).

## Offen (Kurzfassung — Details + Begründung in `docs/BACKLOG.md`)
**Brauchen echtes Gerät (Android real + iOS gegentesten):**
UT-02 (Tour-Status bei Instagram/UTM), UT-05 (Bottom-Nav Safe-Area / roter Indikator
angeschnitten), UT-08 (Hover/Markierung „klebt" auf Touch), UT-13 (React #418 — aktuell
nicht reproduzierbar, Beobachtungspunkt).

**Entschieden/klar, umsetzbar:**
UT-12 B (Open Graph + Web-Manifest + `metadataBase`; teils abhängig von `NEXT_PUBLIC_SITE_URL`),
UT-16 (Eingabe-Validierung Emojis/Sonderzeichen — offen: welche Felder genau?),
UT-17 (Datenminimierung / Netzwerk-Requests, Analyse).

**Braucht Live-DB/Login (P1/Sicherheit):**
UT-15 (Auth-Flow: Aktionen ohne bestätigte E-Mail?).

**Zurückgestellt:** UT-14 (Login-Modal), Personalisierung (UT-20).

## Go-live — erledigt (20.07.2026)
- [x] Test-/Demo-Daten gelöscht + Migrationen 0027/0034/0035 (+ News-`sort_ts`) ausgeführt.
- [x] Vercel-ENV `NEXT_PUBLIC_SITE_URL=https://www.mdudarts.de` gesetzt.
- [x] Auth-Mock `NEXT_PUBLIC_USE_AUTH_MOCK` aus Vercel (Prod+Preview) **entfernt**.
- [x] Supabase Auth-URLs (Site URL + Redirect `…/**`) auf `www.mdudarts.de`.
- [x] Externe anwaltliche Freigabe → Rechts-Banner (Impressum/Datenschutz/Nutzungsbed.) entfernt.
- [x] `SITE_INDEXABLE=true` + `COMING_SOON=false` → live.

## Noch offen nach Go-live (organisatorisch / später)
- [ ] **AVVs** mit Vercel/Supabase/Resend/Cloudflare/Anthropic abschließen.
- [ ] **Supabase EU-Region** — bewusst verschoben (Regionwechsel = Projekt-Umzug; DSGVO
      via AVV/SCC abgedeckt). Separates Vorhaben, wenn gewünscht.
- [ ] Optional: `sitemap.xml` in der Google Search Console einreichen (schnellere Indexierung).

## Wieder „offline" nehmen (falls nötig)
`COMING_SOON=true` in `lib/site-config.ts` → Vorhang zurück. Vorschau trotz Vorhang:
`…?vorschau=mdu-intern` (aus: `?vorschau=aus`).

## Datenstand / Vorsicht (aus CLAUDE.md)
- Saison 2025/2026 ist **beendet und manuell eingefroren** — der tägliche Import-Cron
  (`.github/workflows/import-dartunion-results.yml`) ist **pausiert**. Ein Import-Lauf
  würde die manuellen Werte überschreiben. Erst zum Saisonstart 26/27 reaktivieren.
- Beim Saisonstart 26/27: hardcoded „abgeschlossen"-Status-Texte in
  `components/mdu/league-detail-client.tsx` dynamisch aus offenen Spielen ableiten.
