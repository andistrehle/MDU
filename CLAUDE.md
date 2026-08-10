@AGENTS.md

# MDU-Plattform — Projekt-Briefing für Claude

Online-Plattform der **Münchner Dart Union** (Liga-Spielbetrieb: Tabellen, Spielpläne,
Teams/Spieler-Profile, Online-Mannschaftsanmeldung, digitaler Spielbericht, OCR-Upload).
Live: **https://www.mdudarts.de** (Apex 308 → www) · Repo: `andistrehle/MDU` (main) · Deploy: Vercel (auto bei Push).

## Stack
Next.js (App Router, Turbopack) · Supabase (Auth/DB/Storage, **eine gemeinsame Prod-DB für
localhost UND live!**) · Vercel · Cloudflare (nur DNS, Website-Records „DNS only") ·
Resend (E-Mail) · Anthropic Claude Vision (OCR, `lib/ocr/`).

## Arbeitsweise (vom Betreiber festgelegt)
- **Fertige Änderungen direkt committen und auf `main` pushen — ohne nachzufragen.**
- Vor jedem Push: `npx tsc --noEmit` und `npm run build` müssen grün sein.
- Vor dem Push `git pull --rebase origin main` (eine GitHub-Action pusht ebenfalls auf main).
- Commit-Footer: `Co-Authored-By: Claude <noreply@anthropic.com>` (Modellname einsetzen).
- UI-Texte auf Deutsch, Du-Form; Ton freundlich, kein Marketing-Sprech.
- **Ehrlichkeitsprinzip:** nie Erfolg vortäuschen (E-Mail-Versand meldet ehrlich
  `skipped_no_provider`/`failed`; OCR übernimmt nie ungeprüft; keine erfundenen Daten/Features).

## Nicht ändern (bewusste Entscheidungen)
- **Profilbild ist standardmäßig öffentlich** (Checkbox vorausgewählt, Opt-out; Art. 6 I f DSGVO).
  NICHT auf Opt-in umstellen — wurde ausdrücklich so entschieden. Spitzname bleibt Opt-in.
- **`SITE_INDEXABLE = false`** in `lib/site-config.ts`: Seite ist erreichbar, aber noindex
  (Pre-Go-live). Erst beim offiziellen Go-live auf `true`.
- Rechtstexte (Impressum/Datenschutz/Nutzungs-/Spielbedingungen) sind DSB- und anwaltlich
  durchgeprüft; inhaltliche Änderungen nur auf Anweisung.

## Datenarchitektur (wichtig!)
- Liga-Daten: statische Basis in `lib/data.ts` + `lib/data/imported-*.json`
  (Merge in `lib/data/matches.ts`; dartunion.de ist autoritativ für Tabellen/Ranglisten).
- **Saison 2025/2026 ist beendet und manuell eingefroren** (letzte 2 Ergebnisse + C-Liga-Tabelle/
  Rangliste von Hand, da dartunion sie noch nicht hatte). Deshalb ist der tägliche Import-Cron in
  `.github/workflows/import-dartunion-results.yml` **pausiert** (auskommentiert; manuell per
  workflow_dispatch möglich). Ein Import-Lauf würde die manuellen Werte überschreiben —
  erst reaktivieren, wenn dartunion die Ergebnisse nachgetragen hat (Saisonstart 26/27).
- Beim Saisonstart 26/27 außerdem: Liga-Status-Texte in `components/mdu/league-detail-client.tsx`
  sind hardcoded „abgeschlossen" → dann dynamisch aus offenen Spielen ableiten.

## Supabase = Produktivdatenbank (Vorsicht bei Schreibaktionen)
Schreibende Skripte (`scripts/*.mjs`, Service-Role) treffen echte Daten. Demo-Daten fürs
Einführungsvideo (Demo-Kapitän `demo.kapitaen@example.com`, Demo-Spieler `demo.spieler@example.com`,
Demo-Anmeldung „DC Demo München", Demo-Benachrichtigungen) liegen noch in der DB —
**nach der Videoproduktion mit `node scripts/cleanup-demo-video.mjs` entfernen.**

## ENV (Namen; Werte NIE committen)
`.env.example` ist die Referenz. Lokal in `.env.local`, produktiv in Vercel gesetzt:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only), `RESEND_API_KEY`, `EMAIL_FROM`,
`OCR_FEATURE_ENABLED`, `OCR_PROVIDER` (claude|stub), `OCR_MODEL`, `OCR_API_KEY`.
Cloud-/Handy-Sessions haben KEINE `.env.local` — DB-Skripte dort nur ausführen, wenn die
ENV in der Session-Umgebung konfiguriert ist.

## Offene Punkte / Roadmap
Maßgeblich: **`docs/BACKLOG.md`** (Abschnitte „Vor Go-live" und „Bekannte To-dos").
Kurzfassung: Go-live = `SITE_INDEXABLE=true` + `NEXT_PUBLIC_SITE_URL` + Supabase-Auth-URLs
auf www.mdudarts.de + Testuser löschen + externe anwaltliche Freigabe (Banner in `LegalPage`
entfernen) + AVV mit Dienstleistern. Einführungsvideo: Konzept/Runsheet in
`docs/einfuehrungsvideo-*.md` (Aufnahme erfolgt, Schnitt in HeyGen/CapCut läuft).

## Zweites Projekt im Repo: Munich Darts Challenge (MDC)
Unter **`/mdc`** liegt eine eigenständige Demo-Web-App der Munich Darts Challenge
(Einzelspieler-Ranglistenserie, eigene Passnummern). **Keine Verknüpfung zur MDU** —
eigene Datenschicht (`data/`), eigene Komponenten (`components/mdc/`), eigene Helfer
(`lib/mdc/`), eigenes Design (`app/mdc/mdc.css`), noindex. Die MDU-Chrome (Bottom-Nav,
Demo-Tour, Analytics) blendet sich dort über `components/mdu/global-chrome.tsx` aus.
Details, Datenherkunft und offene Punkte: **`docs/mdc-demo.md`**.
**Arbeitsweise auch hier: direkt auf `main` committen und pushen — keine Pull
Requests.** Jeder PR erzeugt einen Vercel-Kommentar und damit eine E-Mail an den
Betreiber; bei kleinen Anpassungen (Farbe, Logo, neuer Spielort) steht das in
keinem Verhältnis. Ein PR nur, wenn es wirklich etwas zu prüfen gibt.
Wichtig: Endrangliste 2025/26 = echte Daten (echte Personen), Turniere = Demo-Daten.

## Drittes Projekt im Repo: Tennis Kail (Demo-Entwurf)
Unter **`/tk`** liegt eine eigenständige Premium-Demo für die Münchner Tennisanlage
**Tennis Kail** (tennis-kail.de) — Platzbuchung, Trainerbuchung, Wetter-/Platzstatus,
Camps, Events, Kundenkonto, Betreiber-Dashboard. **Keine Verknüpfung zu MDU oder MDC**:
eigene Datenschicht (`data/tk/`), eigene Logik (`lib/tk/`), eigene Komponenten
(`components/tk/`), eigenes Designsystem (`app/tk/tk.css`), eigene Schriften, noindex
(Layout + `app/robots.ts`). Die MDU-Chrome blendet sich dort über
`components/mdu/global-chrome.tsx` aus — wie bei `/mdc`.
- **Fremde Marke**: `noindex` und der `/tk`-Eintrag in `robots.ts` bleiben, bis der
  Betreiber freigibt. Nicht ohne Anlass ändern.
- **Ehrlichkeitsprinzip gilt hier besonders**: Jede Angabe trägt `provenance:
  'belegt' | 'demo'`; die Seite `/tk/datenherkunft` listet beides vollständig auf.
  Keine erfundene Angabe ohne Kennzeichnung.
- **Bilder**: `scripts/tk-fetch-images.mjs` lädt Originalbilder von tennis-kail.de nach
  `public/tk/original/` und schreibt `data/tk/original-images.json`. Beim Bau der Demo
  war die Domain vom Egress-Proxy blockiert (403) — deshalb ist das Manifest leer und es
  greifen gezeichnete SVG-Ersatzbilder. Skript erneut ausführen, sobald Netzzugang da ist;
  danach erscheinen die Fotos ohne Codeänderung. **Keine Stockfotos.**
- Neue Abhängigkeit dafür: `motion` (Framer Motion). shadcn/ui ist bewusst NICHT
  installiert — die Bausteine liegen als eigene Komponenten in `components/tk/ui/`.
- Details, Konzept und Roadmap zu allen Bereichen: **`docs/tennis-kail-demo.md`**.

## Stolperfallen
- Resend: bounct eine Adresse (z. B. Postfach existierte noch nicht), landet sie auf der
  **Suppression-Liste** und bekommt nichts mehr → im Resend-Dashboard entfernen.
- JSX verschluckt Leerzeichen nach `</strong>` am Zeilenende → `{' '}` verwenden.
- dartunion.de ist teils inkonsistent (Spielplan-Grid vs. offizielle Tabelle) — Tabellenseite
  ist die verlässlichere Quelle; nichts hardcoden, was sich beim nächsten Import selbst heilt.
