# MDU-Plattform — Vollständiges End-to-End-Review

**Datum:** 2026-07-08 · **Umfang:** gesamte Website (öffentlich + Mein Bereich + Admin) · **Methode:** statische Code-Analyse, Build/Typecheck/Lint, Server-Smoke-Tests aller Routen (HTTP-Status + Server-Log), 7 parallele Bereichs-Tiefenprüfungen. **Kein Live-DB-Zugriff in dieser Session** — RLS/Datenwerte wurden aus Code/Migrationen bewertet, nicht gegen die laufende DB verifiziert. **Keine funktionalen Änderungen vorgenommen.**

---

## 1. Executive Summary

Die Plattform ist **technisch in gutem Zustand**: `npm run build` und `tsc --noEmit` laufen grün, alle 48 Seiten liefern HTTP 200, der Server-Log ist beim Durchklicken fehlerfrei (keine 500er, keine Hydration-Fehler, keine unhandled exceptions). Architektur, Rollenmodell, Ehrlichkeitsprinzip (ehrliche E-Mail-/OCR-/Statuszustände) und RLS-Grundgerüst sind durchdacht und konsistent umgesetzt.

Es wurden **keine P0-Probleme** (kein bestätigter Datenleak, kein blockierter Login, keine kaputte Kernseite) gefunden. Es gibt **5 P1-Punkte** (nach Nachprüfung; REV-090 war ein Fehlalarm, siehe unten), die vor Go-live behoben werden sollten — am gewichtigsten ein **fehlender Rollen-Check auf `/api/notifications/email`** (jeder eingeloggte Nutzer könnte offiziell aussehende MDU-Mails versenden). Der große Rest sind UX-/Konsistenz-/Robustheits-Verbesserungen (P2/P3), viele davon Quick Wins.

> **Nachtrag REV-090 (aufgelöst):** Der gemeldete Playoff-News-Widerspruch existiert **nicht** in der Anzeige. Der prüfende Agent las nur die statische Fallback-Tabelle (`PLAYOFFS_B_AUFSTIEG_STANDINGS`, 27.05.-Snapshot, sp=7); die **tatsächlich angezeigte** Tabelle wird aus `imported-standings.json` gemergt (überschreibt statisch) und ist **final** (sp=10): Fiaker Deife, Belfort Evolution, **Freibad Bazis** auf Rang 1–3 → deckt sich exakt mit der „Saison beendet"-News. Keine Datenkorrektur nötig. Optionaler Cleanup: den überholten statischen Snapshot auf die finalen Werte angleichen oder entfernen, damit die Fallback-Ebene nicht in die Irre führt (P3).

**Gesamtnote: gut, go-live-fähig nach Abarbeitung der P1 + der sicherheits-/vertrauensrelevanten P2.**

## 2. Gesamtbewertung

| Dimension | Bewertung | Kurzbegründung |
|---|---|---|
| Technik/Stabilität | 🟢 gut | Build/tsc grün, alle Routen 200, Log sauber |
| Funktion/Workflows | 🟢 gut | Anmeldung, Spielbericht, OCR, Nachmeldung vollständig; einige Robustheitslücken |
| Benutzerführung | 🟡 mittel | solide Guards/Leerzustände; einige tote Pfade + unklare Abkürzungen |
| First-Time-UX | 🟡 mittel | Einstieg klar, aber Abkürzungen (Sp./TC) unerklärt, News widersprüchlich |
| Sicherheit/Datenschutz | 🟡 mittel | RLS-Grundgerüst stark; 1× fehlender Rollen-Check, kein Rate-Limit |
| Datenplausibilität | 🟡 mittel | 1 echter Widerspruch (Playoff vs News), 1 Zählfehler (A1 „7 Teams") |
| Responsive | 🟡 mittel | Mobil + Desktop ok, aber Tablet-Bruch 769–~1220px |
| Accessibility | 🟡 mittel | Zoom erlaubt, teils Mehrfach-Kodierung; Fokus/aria lückenhaft |
| Performance | 🟢 gut | überwiegend statisch prerendered; Bilder `unoptimized` |
| Visuelle/inhaltl. Konsistenz | 🟡 mittel | uneinheitliche Saison-Bezeichnung, Gold-Schwelle, Begriffe |

## 3. Getestete Bereiche

Öffentliche Startseite, Ligen-Übersicht + Liga-/Playoff-Detailseiten (alle 6 Ligen + 2 Playoff-Gruppen), Tabellen, Spielplan, Ergebnisse, Teams-Liste + Teamprofile, Spielerprofile, Spielstätten, News, Mehr, Downloads, Kontakt, Rechtstexte (Impressum/Datenschutz/Nutzungs-/Spielbedingungen), Login/Registrierung/Passwort-Flows, Mein Bereich (Profil, Team, Kader, Team bearbeiten, Anmeldungen, Mannschaftsanmeldung, Spielberichte, OCR, Übersicht), Admin-Konsole (14 Bereiche + Detailseite), 12 API-Routen, PDF-Vorlage, OCR-Pipeline, Benachrichtigungscenter, Migrationen/RLS.

## 4. Getestete Rollen

Gast (nicht eingeloggt), Spieler (`player`), Teamkapitän (`team_captain`), Ligaleitung (`league_admin`), Super Admin (`super_admin`). Rollenlogik zentral in `lib/auth/roles.ts`; Client prüft Sichtbarkeit, echte Grenze ist Supabase-RLS.

## 5. Technische Ergebnisse

- **Build:** `npm run build` ✅ grün. **Typecheck:** `tsc --noEmit` ✅ sauber.
- **Lint:** 31 Probleme (22 Fehler, 9 Warnungen) — überwiegend `react/no-unescaped-entities` (Kosmetik, build-neutral), `prefer-const`, ungenutzte Variablen; **2 relevante** `react-hooks/set-state-in-effect` (`lib/supabase/admin-counts.ts:105`, `lib/supabase/user-notifications.ts:133`).
- **Routing:** Alle 48 Seiten HTTP 200; echte Fehlrouten → 404. **Ausnahme:** `/ligen/[code]` ohne gültigen Code → 200 mit leerer „XYZ Liga" (REV-001).
- **Fehlende Sonderdateien:** keine `middleware.ts` (REV-002), kein `not-found.tsx`/`error.tsx`/`loading.tsx` (REV-003) → Next-Defaults (kein gebrandetes 404, keine Error-Boundaries, keine Route-Skeletons).
- **Client/Server:** 34/49 Seiten sind Client-Komponenten (auth-gated). `/teams`, `/teams/[id]`, `/spieler/[id]`, `/ligen/[code]` dynamisch (DB-Lesen mit Fallback), Rest statisch prerendered.
- **Secrets:** keine Server-Secrets (`SERVICE_ROLE`/`OCR_API_KEY`/`RESEND`) in Client-Dateien; kein `dangerouslySetInnerHTML`.
- **Server-Log:** beim Durchklicken aller Routen fehlerfrei.

## 6. First-Time-User-Experience (Szenarien)

**A – Gast:** Einstieg klar (Hero, Quickbar, Demo-Tour). Stolpersteine: „Alle News anzeigen" führt auf Baustellenseite (REV-091); widersprüchliche News „laufen" vs „beendet" (REV-092); Abkürzungen „Sp./Spiele/Diff." (REV-096) und „TC" (REV-101) unerklärt; leerer „Galerie"-Tab (REV-100). Positiv: ehrliche Leerzustände, gute Tabellen-Legende, Auf-/Abstieg farblich klar.

**B – Neuer Spieler:** Registrierung angemessen kurz, Spieler/Kapitän-Unterschied erklärt; Grund der späteren Zuordnung transparent. Leerzustände „Kein Team verknüpft" erklären den nächsten Schritt. Stolperstein: nach Login immer Redirect auf `/mein-bereich` statt zum Ziel (REV-020).

**C – Teamkapitän:** Anmelde-Wizard erklärt Ligawunsch vs Staffel gut; Nachmeldung mit vorläufiger Passnummer transparent. Stolpersteine: „Einreichen" aus der Liste umgeht Pflicht-Häkchen (REV-040); kein Datenverlust-Schutz im Wizard (REV-042); Nachmeldung erscheint erst nach Reload (REV-043); OCR-HEIC-/Größenprobleme erst nach Upload (REV-052/053).

**D – Ligaleitung:** Admin-Konsole vollständig, gefährliche Aktionen mit `confirm()`. Stolpersteine: aktiver Menüpunkt auf Detailseiten fehlt (REV-031); „Bearbeiten" verlässt die Konsole (REV-036); rohe `season_id` in Detailansicht (REV-044); nicht-funktionale Suchleiste (REV-032).

## 7. Navigation

Desktop-Top-Nav und mobile Bottom-Nav sind verständlich; Ligen-Dropdown gruppiert Playoffs/Ligen sinnvoll; „Mein Bereich"/Glocke/Login klar. Schwächen: **Tablet-Bruch 769–~1220px** (REV-070), Bottom-Nav-Tap-Targets <44px (REV-074), aktiver Admin-Menüpunkt auf Unterseiten (REV-031), Admin-„Bearbeiten"-Sackgasse (REV-036).

## 8. Responsive Design

Getestet (per CSS-/Layout-Analyse) 320/375/390/768/1024/1440/1920px. `html/body` mit Overflow-Guards; Tabellen in `.mdu-table-scroll`. Probleme: Header-Bruch 769–~1220px (REV-070), Mobile-Header-Überlauf ≤360px (REV-071), Notification-Popover mobil falsch verankert (REV-072), Tour-Button überlappt Bottom-Nav 761–768px (REV-076).

## 9. Accessibility

Positiv: Pinch-Zoom erlaubt (`maximumScale:5`), Unread/aktive Nav mehrfach kodiert (nicht nur Farbe), `aria-expanded/haspopup` an der Glocke, Escape/Outside-Click. Lücken: Popover ohne Fokus-Management/-Trap (REV-075), Icons ohne `aria-hidden` (REV-082), fehlende `:focus-visible`-Ringe auf Nav/Popover (REV-083), Footer-Attrappen nicht per Tastatur erreichbar (REV-073), Dark-Mode-Kontrast Tabellenkopf (REV-095).

## 10. Performance

Überwiegend **statisch prerendered** (gut). Punkte: alle `<Image>` mit `unoptimized` (Hero-Dartboard 1250×1250 ohne Resizing/srcset → LCP-Payload; REV-005); `/ergebnisse` + `/spielplan` als Client-Komponenten ziehen den Daten-Layer ins Client-Bundle; 2× `set-state-in-effect` (unnötige Re-Renders bei Route-Wechsel, REV-004). Kein Layout-Shift-Verdacht durch feste Bildmaße. Keine Skeletons (REV-003).

## 11. Sicherheit und Datenschutz

**Stark:** `profiles`-RLS friert `role/player_id/team_id` gegen Selbst-Eskalation ein; E-Mails nicht public-lesbar; `player_contacts` (Telefon) nur Owner/Admin + gated `/api/captain-phones` (Token+Rolle); OCR-Bucket privat + kurzlebige Signed URLs; Match-Report-Routen serverseitig auth+rollen+teamgebunden; Admin-User-Löschung serverseitig mit Schutzregeln; keine Secrets im Client. **Schwach:** `/api/notifications/email` ohne Rollen-Check (REV-010, P1); `/api/registration-checks` unauthentifiziert mit Enumeration + Mail-Relay (REV-011); kein Rate-Limiting auf Mail-Endpoints (REV-012); Rollen-/Konto-Mutation in `/admin/users` nur clientseitig+RLS (REV-016); keine `middleware.ts` (REV-002). **Vor Go-live: lückenloses RLS-Audit jeder gelesenen Tabelle.**

## 12. Datenplausibilität (stichprobenartig, nichts geändert)

- **REV-090 — kein Widerspruch (aufgelöst):** Die angezeigte Playoff-B-Aufstieg-Tabelle stammt aus `imported-standings.json` (final, sp=10: Fiaker Deife, Belfort Evolution, Freibad Bazis auf 1–3) und deckt sich mit der News. Der Erstbefund beruhte auf der statischen Fallback-Tabelle (`lib/data.ts:342-347`, 27.05.-Snapshot sp=7), die vom Merge überschrieben wird. Der Betreiber bestätigt die Stände als final. (Optional P3: statischen Snapshot angleichen/entfernen.)
- **REV-094 — erledigt:** `/ligen` A1-Karte zeigte „7 Teams", real 6 (Treff Nix Freimann früh nach A2 verschoben). Anzeigewert `leagues.ts` auf 6 korrigiert (vom Betreiber bestätigt).
- **Offen (A1-Tabelle):** Die A1-Tabelle (`A1_LIGA_STANDINGS`) ist ein Snapshot mit **uneinheitlichen/unplausiblen Spielzahlen** (sp 14/11/10/12/12/10 — bei 6 Teams max. 10). Eine saubere „jedes Team 10 Spiele"-Rekonstruktion ist aus den gespeicherten Daten **nicht** möglich: es liegen **keine A1-Einzelspiele** vor (`imported-matches.json` a1 = 0, `matches.ts` a1 = 0) und `imported-standings.json` enthält **kein a1**. Rekonstruktion braucht die Quelle (dartunion.de, derzeit nicht erreichbar) oder eine vom Betreiber gelieferte finale A1-Tabelle. **Nicht erfunden.**
- Konsistent gut: De-Wolperdinga-Rückzug überall markiert; playoff-bewusste Gruppierung auf Teams/Spielstätten/Tabellen; Spieler-Spezialwerte ehrlich „–".

## 13. P1-Probleme (hoch)

> **Umsetzungsstand (08.07.2026):** Alle 5 offenen P1 sind behoben und auf `main` — REV-010 (Mail-Rollen-Check), REV-040 (Einreichen über Wizard), REV-041 (Ziel-Saison), REV-050 (OCR-Watchdog + maxDuration), REV-070 (Nav-Breakpoint 1080px, behebt zugleich REV-076). REV-090 war ein Fehlalarm (s. o.). Hinweis: Der Mail-Rollen-Check konnte in der Review-Session mangels Supabase-ENV nur bis „503 nicht konfiguriert" getestet werden; die 401/403-Pfade greifen produktiv mit gesetzter ENV.

### REV-010 · Fehlender Rollen-Check auf `/api/notifications/email` — ✅ ERLEDIGT
- **Priorität:** P1 · **Bereich:** API/Sicherheit · **Route:** `app/api/notifications/email/route.ts:28-46` · **Rolle:** jede:r Eingeloggte · **Gerät:** alle
- **Problem:** Route prüft nur ein gültiges Token, keine Rolle. `to/name/teamName/reason` frei aus dem Body; `VALID_TYPES` enthält `registration_approved/-rejected/account_activated`. Ein Spieler kann offiziell aussehende „Anmeldung freigegeben/abgelehnt"-Mails über die verifizierte MDU-Domain an beliebige Adressen senden.
- **Erwartung:** Nur Ligaleitung/Super-Admin dürfen solche Mails auslösen; Ziel-Adresse an die betroffene Registrierung gebunden.
- **Auswirkung:** Phishing/Spam im MDU-Namen, Resend-Reputation/Suppression, DSGVO-Risiko.
- **Ursache:** Fehlende serverseitige Berechtigungsprüfung.
- **Reproduktion:** 1. Als Spieler einloggen, Token greifen. 2. POST an die Route mit beliebigem `to`+`type`. 3. Mail wird versendet.
- **Lösungsvorschlag:** `authenticateRequest` + `hasMinRole(actor,'league_admin')` erzwingen (wie Admin-Routen); `to`/`registrationId` validieren.
- **Aufwand:** klein · **Status:** offen

### REV-040 · „Einreichen" aus der Anmeldungs-Liste umgeht Validierung + Pflicht-Häkchen
- **Priorität:** P1 · **Bereich:** Mannschaftsanmeldung · **Route:** `/mein-bereich/anmeldungen` (`anmeldungen/page.tsx:34-51`) · **Rolle:** Teamkapitän · **Gerät:** alle
- **Problem:** `onSubmit` ruft `submitRegistration` direkt auf, ohne die im Wizard erzwungenen Häkchen (Rechte/Angaben + Spielbedingungen) und ohne `validate()` (Liga/Venue/Kader). Ein unvollständiger Entwurf lässt sich absenden.
- **Erwartung:** Einreichen nur mit erfüllten Pflichtfeldern + bestätigten Bedingungen.
- **Auswirkung:** Unvollständige/nicht anerkannte Anmeldungen im Prüf-Workflow; rechtlich relevante Bestätigung fehlt.
- **Ursache:** Gates existieren nur im Wizard-Client, nicht persistiert; Liste ruft Submit direkt.
- **Reproduktion:** 1. Entwurf minimal speichern. 2. In der Liste „Einreichen". 3. Wird `submitted` ohne Validierung.
- **Lösungsvorschlag:** „Einreichen" in der Liste auf den Wizard (`?id=…`) umleiten oder Bedingungen serverseitig/als DB-Feld erzwingen.
- **Aufwand:** klein · **Status:** offen

### REV-041 · Anmeldungs-Liste zeigt falsche (eingefrorene) Saison
- **Priorität:** P1 · **Bereich:** Mannschaftsanmeldung · **Route:** `/mein-bereich/anmeldungen` (`page.tsx:15,79`) · **Rolle:** Teamkapitän · **Gerät:** alle
- **Problem:** Jede Zeile zeigt `getCurrentSeason().name` statt `r.season_id`; eine 26/27-Anmeldung wird als „2025/2026" beschriftet.
- **Erwartung:** Ziel-Saison der jeweiligen Anmeldung anzeigen.
- **Auswirkung:** Kapitän sieht falsche Saison → Verwirrung/Fehlvertrauen; Kern-Datenanzeige widersprüchlich.
- **Ursache:** Modul-Konstante statt Feld der Anmeldung.
- **Reproduktion:** Anmeldung für 26/27 → Liste zeigt „2025/2026".
- **Lösungsvorschlag:** Saisonname aus `r.season_id` auflösen (Saison-Lookup wie Admin-Detail).
- **Aufwand:** klein · **Status:** offen

### REV-050 · OCR bleibt bei Timeout dauerhaft auf „processing" hängen
- **Priorität:** P1 · **Bereich:** OCR · **Route:** `app/api/match-reports/ocr/[uploadId]/route.ts:52,66,122` · **Rolle:** Teamkapitän/Admin · **Gerät:** alle
- **Problem:** Vision-Call läuft synchron im Request (bis 3 Seiten, max_tokens 16000). Reißt die Function-Timeout, bleibt die Zeile für immer `processing`; Neustart liefert nur 409 „Erkennung läuft bereits".
- **Erwartung:** Nach Timeout automatischer Reset/Neuversuch möglich.
- **Auswirkung:** Upload dauerhaft blockiert, kein Weg vorwärts — Kernfunktion tot für diesen Bogen.
- **Ursache:** Kein Watchdog; `ocr_started_at` gesetzt, aber nicht ausgewertet.
- **Reproduktion:** 1. Großes Mehrseiten-PDF. 2. OCR über Timeout. 3. Neustart → 409.
- **Lösungsvorschlag:** `processing` mit `ocr_started_at` > ~3 Min als abgebrochen behandeln + Neustart zulassen; `maxDuration` setzen; UI-Hinweis „zu lange gedauert, erneut versuchen".
- **Aufwand:** mittel · **Status:** offen

### REV-070 · Desktop-Header bricht im Tablet-Bereich 769–~1220px
- **Priorität:** P1 · **Bereich:** Responsive/Navigation · **Route:** global (`desktop-header.tsx:73-291`, `globals.css:424,436`) · **Rolle:** alle · **Gerät:** Desktop/Tablet
- **Problem:** Mobile-Umschaltung erst bei `max-width:768px`. Bei 769–~1100px passen 8 Nav-Links (`nowrap`) + Theme-Toggle + Account + Glocke (alle `flexShrink:0`, Min-Content ~1200px) nicht in die Breite; `overflow-x:hidden` schneidet stumm ab.
- **Erwartung:** Navigation bei Tablet-Breiten bleibt vollständig bedienbar.
- **Auswirkung:** Auf Tablets/kleinen Laptops sind Nav-Elemente abgeschnitten/unerreichbar.
- **Ursache:** Kein Zwischen-Breakpoint; stummer Overflow-Cut.
- **Reproduktion:** Fenster auf ~800–1100px → rechte Header-Elemente verschwinden.
- **Lösungsvorschlag:** Desktop-Nav bereits ab ~1024px auf Burger/Bottom-Nav umstellen oder Items ab ~1100px reduzieren/umbrechen.
- **Aufwand:** mittel · **Status:** offen

### REV-090 · ~~Playoff-Tabelle widerspricht „Saison beendet"-News~~ → FEHLALARM (aufgelöst)
- **Priorität:** ~~P1~~ → **kein Befund** (ggf. P3 Cleanup) · **Bereich:** Datenplausibilität · **Route:** `/ligen/playoffs-b-aufstieg` + `/`
- **Auflösung:** Die **angezeigte** Tabelle kommt aus `imported-standings.json` (final, sp=10: Fiaker Deife, Belfort Evolution, **Freibad Bazis** auf Rang 1–3) und **stimmt mit der News überein**. Der Erstbefund las nur die statische Fallback-Tabelle `PLAYOFFS_B_AUFSTIEG_STANDINGS` (27.05.-Snapshot, sp=7), die vom Merge (`STANDINGS_BY_LEAGUE`) überschrieben wird. Betreiber bestätigt die Stände als final. dartunion.de aktuell nicht erreichbar (Proxy 403) — keine Nachprüfung an der Quelle nötig, da die importierten Endstände bereits final sind.
- **Optionaler Cleanup (P3):** Statischen Snapshot an die finalen Werte angleichen oder entfernen, damit die Fallback-Ebene nicht irreführt. **Sportdaten nicht geändert.**
- **Status:** aufgelöst (kein Handlungsbedarf an den Ständen)

## 14. P2-Probleme (mittel)

> **Umsetzungsstand (08.07.2026):** Der Großteil der P2 ist behoben und auf `main` —
> REV-001, REV-003 (error-Boundary + Loading-Zustand), REV-011/012 (Rate-Limiting),
> REV-020, REV-021, REV-030 (Rollenrechte angeglichen), REV-042 (Verlassen-Warnung im
> Wizard), REV-043, REV-044, REV-051–056, REV-071, REV-072, REV-073, REV-074, REV-075,
> REV-091, REV-092, REV-093, REV-095.
> **Nachtrag (09.07.2026):** REV-016 umgesetzt (Konto-/Rollenänderungen über
> `PATCH /api/admin/users/[id]` mit service_role + Rechteprüfung). REV-002 umgesetzt
> als `proxy.ts` (Server-Guard `/admin`+`/mein-bereich` → `/login?next`, tokenfreier
> Marker-Cookie + Security-Header); die volle `@supabase/ssr`-Cookie-Auth wurde bewusst
> NICHT gemacht (erzwingt PKCE → Supabase-Mail-Templates/Redirects nötig, hier nicht
> testbar). **Bewusst offen:** REV-005 (Bild-`unoptimized` — Kosten-Entscheidung);
> vollständiger RLS-Audit vor Go-live.

| ID | Titel | Route/Datei | Problem → Lösung | Aufwand |
|---|---|---|---|---|
| REV-001 | Ungültiger Liga-Code kein 404 | `ligen/[code]/page.tsx:27` | rendert leere „XYZ Liga" → bei `!league` `notFound()` | klein |
| REV-002 | Keine `middleware.ts` (kein Server-Guard) | global | Schutz nur Client-Gate + RLS → schlanke Middleware `/admin`+`/mein-bereich` → `/login`; RLS-Audit | klein/mittel |
| REV-003 | Kein custom 404/error/loading | `app/` | Next-Defaults → gebrandete `not-found.tsx`, `error.tsx`-Boundaries, Route-Skeletons | mittel |
| REV-005 | Bilder `unoptimized` + Client-Bundles | mehrere | Hero ohne Resizing; ergebnisse/spielplan client → Hero optimieren/`sizes`, ggf. Server+Client-Filter-Wrapper | mittel |
| REV-011 | `/api/registration-checks` unauth. | `registration-checks/route.ts` | Enumeration + Mail-Relay → Token für Enum-Actions oder Boolean-Minimalantwort; Captcha/Rate-Limit | mittel |
| REV-012 | Kein Rate-Limiting auf Mail-Endpoints | kontakt/registration-checks/new-user | Mail-Flut/Kosten → IP-/Nutzer-Fenster vor Versand | mittel |
| REV-016 | `/admin/users` Rollenwechsel nur clientseitig | `users/page.tsx:307` | Trust nur RLS (uneinheitlich zum Delete) → kritische Mutationen über API oder RLS `with check` verifizieren | mittel |
| REV-020 | Kein `?next=`-Redirect nach Login | `login/page.tsx:26` | immer `/mein-bereich` → Zielpfad aus `next` routen, Login-Links mit `?next=` | klein |
| REV-021 | Veralteter „Passwort vergessen"-Hinweis | `passwort-vergessen/page.tsx:56-58` | „Versand kommt später" obwohl aktiv → Zeile entfernen/korrigieren | klein |
| REV-030 ✅ | Edit/Delete-Asymmetrie league_admin-Peers | `roles.ts:142,152` | Peer degradierbar, nicht löschbar → **erledigt:** Ligaleitung darf jetzt nur `player`/`team_captain` bearbeiten **und** als Rolle vergeben (deckt sich mit Löschen); Peers/Super-Admins nur durch Super Admin | klein |
| REV-042 | Kein Datenverlust-Schutz im Anmelde-Wizard | `mannschaft-anmelden/page.tsx` | Back/Reload verwirft Eingaben → `beforeunload`-Warnung/Autosave | mittel |
| REV-043 | Nachmeldung erscheint nicht sofort im Kader | `nachmelden-button.tsx`, `kader/page.tsx:21-24` | kein Refetch → `onSuccess`-Prop + `listMyNominations()` neu laden | klein |
| REV-044 | Admin-Detail zeigt rohe `season_id` | `registrations/[id]/page.tsx:189` | technische ID → Saisonname auflösen | klein |
| REV-051 | Ungültige Default-OCR-Model-ID | `lib/ocr/config.ts:41` | `claude-sonnet-4-6` existiert nicht → gültige ID + Boot-Log/Validierung | klein |
| REV-052 | HEIC scheitert erst nach Upload | `preprocess.ts:15`, `ocr/[uploadId]/route.ts:119` | iOS-HEIC durchgelassen → clientseitig warnen/konvertieren oder ablehnen | mittel |
| REV-053 | Keine clientseitige Dateigrößenprüfung | `match-report-uploads.ts:159` | Oversize erst nach Voll-Upload → `file.size` vor Upload prüfen | klein |
| REV-054 | „Bestätigen" irreversibel ohne Rückfrage | `spielberichte/uebersicht/page.tsx:44-50` | sperrt Bericht + löscht Originale → `confirm()`-Dialog | klein |
| REV-055 | Original-Löschung Best-Effort, still fehlschlagend | `uebersicht/page.tsx:48` | Datenschutz-Zusage bleibt evtl. aus → Fehler protokollieren + Cron-Nachlauf | mittel |
| REV-056 | Absenden erlaubt Spiele ohne Spielerzuordnung | `spielberichte/page.tsx:302-312` | Doppel/Einzel mit „?"-Slot absendbar → Vollständigkeit je Spiel prüfen | klein |
| REV-071 | Mobile-Header-Überlauf ≤360px | `desktop-header.tsx:269-290` | Mini-Toggle+Glocke+Account zu breit → Toggle icon-only/auslagern <400px | mittel |
| REV-072 | Notification-Popover mobil falsch verankert | `notification-bell.tsx:69-73` | `right:0` an nicht-randständiger Glocke → mobil `left:12/right:12` oder Bottom-Sheet | mittel |
| REV-073 | Footer-Social-Icons funktionslose Attrappen | `footer.tsx:21-34` | `cursor:pointer` ohne Link/aria → echte `<a>`+`aria-label` oder dekorativ (`aria-hidden`) | klein |
| REV-074 | Bottom-Nav Tap-Targets <44px | `bottom-nav.tsx:35-57` | ~38px Höhe → `minHeight:44`/Padding | klein |
| REV-075 | Popover ohne Fokus-Management | `notification-bell.tsx:63-74` | `role="dialog"` ohne Fokus/Trap → Fokus setzen/zurückgeben | mittel |
| REV-091 | „Alle News anzeigen" → Baustellenseite | `page.tsx:148`, `news/page.tsx:39` | toter CTA → `/news` füllen oder Link ausblenden | klein |
| REV-092 | Widersprüchliche News (laufen vs beendet) | `page.tsx:144-146`, `lib/data.ts:609-616` | veraltete `HOME_NEWS` → aussortieren/archivieren | klein |
| REV-093 | Uneinheitliche Saison-Bezeichnung | ligen/tabellen/teams/home | „2026"/„2025/26"/„2025/2026" → überall `getCurrentSeason().name` | klein |
| REV-094 | ✅ ERLEDIGT: A1-Karte „7 Teams" → 6 | `lib/data/leagues.ts:124` | korrigiert (`teams:6`, vom Betreiber bestätigt) | klein |
| REV-095 | Dark-Mode Tabellenkopf kaum sichtbar | `tabellen/page.tsx:134,198` | hardcodiert `#3A3E4A` → `var(--th-text-muted/faint)` | klein |

## 15. P3-Probleme (niedrig)

> **Umsetzungsstand (08.07.2026):** Auf Wunsch umgesetzt und auf `main` —
> REV-004 (Performance-Teil: set-state-in-effect-Kaskaden + prefer-const),
> REV-045, REV-046, REV-058, REV-060, REV-061, REV-076 (bereits durch REV-070 gelöst),
> REV-077, REV-078, REV-079, REV-080, REV-081, REV-096, REV-097 (tote Komponente entfernt),
> REV-098, REV-099, REV-100, REV-101.
> **Nachtrag (09.07.2026):** Weitere P3 auf Wunsch umgesetzt — REV-031/032/033/034/035/036/037
> (Admin-Konsole-Feinschliff), REV-082/083 (Barrierefreiheit: Icons `aria-hidden`,
> `:focus-visible`-Ringe), REV-047 (Nachmeldungs-Freigabe atomar via RPC — **Migration 0033
> im Supabase SQL Editor einspielen**). Restlicher Lint (unescaped-quotes in JSX-Text, wenige
> ungenutzte Variablen, React-Compiler-Memoization-Hinweise) ist rein kosmetisch.
>
> **Nachtrag (09.07.2026, Sicherheits-Härtungen):** REV-013 (Enumeration-Schutz new-user),
> REV-014 (Eigentümerprüfung cleanup-uploads), REV-015 (Magic-Byte-Upload-Check),
> REV-022 (`emailRedirectTo`), REV-023 (Reset-Formular nur mit Recovery-Session),
> REV-024 (eingeloggte von /login,/registrieren weg), REV-057 (Signed-URL 15 Min),
> REV-059 (atomarer OCR-Start) — alle umgesetzt.

| ID | Titel | Route/Datei | Kurzlösung | Aufwand |
|---|---|---|---|---|
| REV-004 ✅ | Lint (set-state-in-effect) | admin-counts/user-notifications u. a. | **erledigt:** Kaskaden-`setState` per `queueMicrotask` entschärft, prefer-const gefixt; Quote-Escapes bleiben kosmetisch | klein |
| REV-013 | `/api/notifications/new-user` Status-Leak | route.ts:21-46 | Antwort vereinheitlichen + Rate-Limit | klein |
| REV-014 | `cleanup-uploads` ohne Eigentümerprüfung | route.ts:30-35 | Uploader/Kapitän/Admin prüfen | klein |
| REV-015 | Upload-MIME nur client-deklariert | upload/route.ts:62 | Magic-Byte-Check ergänzen | klein |
| REV-022 | `emailRedirectTo` nicht gesetzt | auth-context.tsx:296 | `emailRedirectTo` + Supabase-URL-Konfig | klein |
| REV-023 | Reset-Formular ohne Recovery-Session | passwort-zuruecksetzen | Formular gaten + „Link abgelaufen"-Meldung | klein |
| REV-024 | Eingeloggte können /login,/registrieren öffnen | login/registrieren | bei `user` → `/mein-bereich` | klein |
| REV-031 | Aktiver Sidebar-Punkt auf Detailseiten fehlt | admin-sidebar.tsx:63 | Präfix-Match statt exakt | klein |
| REV-032 | Nicht-funktionale Admin-Suchleiste (⌘K) | admin-shell.tsx:104-112 | entfernen oder implementieren | klein |
| REV-033 | Dashboard-Karten unvollständig + ohne Badges | admin/page.tsx:19-31 | aus NAV_ITEMS ableiten + Counts | klein |
| REV-034 | „Warten auf Prüfung"-Filter inkonsistent | registrations/page.tsx:96,119 | Zähl-/Filterbedingung angleichen | klein |
| REV-035 | Nachmeldung „Bestätigen" ohne Dialog | nachmeldungen/page.tsx:102 | `confirm()` vorschalten | klein |
| REV-036 | Admin „Bearbeiten" verlässt Konsole | spielberichte/page.tsx:82 | Rücklink „← Admin" auf Zielseite | mittel |
| REV-037 | Veralteter Zugriffskommentar | users/page.tsx:6-13 | Kommentar korrigieren | klein |
| REV-045 | `kader` `roster` useMemo-Dep | kader/page.tsx:17 | `roster` in eigenem `useMemo` | klein |
| REV-046 | Wizard-Validierung: nur 1 Fehler | mannschaft-anmelden:224-233 | alle Pflichtfelder sammeln/markieren | mittel |
| REV-047 ⏸ | Nachmeldungs-Freigabe nicht atomar | nominations.ts:85-118 | **offen:** echte Atomarität braucht eine DB-RPC/Transaktion (Migration gegen Produktiv-DB) — nicht ungefragt; Status wird bereits zuletzt gesetzt | groß |
| REV-057 | Signed-URL 5 Min läuft bei „Seite öffnen" ab | signed-url/route.ts:35 | on-click frisch anfordern / 15 Min | klein |
| REV-058 | Zwei PDF-Quellen können divergieren | vorlage/page.tsx:139 | Version an `TEMPLATE_VERSION` binden/generieren | mittel |
| REV-059 | Konkurrierende OCR-Starts | ocr/[uploadId]/route.ts:52 | compare-and-set `.eq('ocr_status','pending')` | klein |
| REV-060 | OCR-Kopf-Felder immer gelb „Bitte prüfen" | pruefen/page.tsx:52-57 | Kopf neutral/Confidence im Schema | klein |
| REV-061 | processing/pending → leere Prüfseite | pruefen/page.tsx:181 | Warte-/Fehlerzustand + Rücklinks | klein |
| REV-076 ✅ | Tour-Button überlappt Bottom-Nav 761-768px | tour-restart-link.tsx:43 | **erledigt** (durch REV-070): Button + Bottom-Nav schalten beide bei ≤1080px, Lücke existiert nicht mehr | klein |
| REV-077 | Glocken-Badge deckelt Ungelesene auf 30 | user-notifications.ts:128 | `countUnreadNotifications()` nutzen | klein |
| REV-078 | Ladezustand im Glocken-Dropdown fehlt | notification-bell.tsx:95-99 | `loading`-Skeleton | klein |
| REV-079 | Kachel-Badge „offene Aufgaben" für Ungelesene | mein-bereich/page.tsx:324 | Titel je Badge-Quelle | klein |
| REV-080 | Old-School: Glocke inkonsistent | notification-bell.tsx:53 | Light-Theme-Variante | klein |
| REV-081 | markRead-Fehler verschluckt (optimistisch) | user-notifications.ts:135-144 | Rollback + Hinweis | mittel |
| REV-082 | Icons ohne `aria-hidden` | icon.tsx:9-21 | default `aria-hidden` | klein |
| REV-083 | Fokus-Ringe auf farbigen Flächen fehlen | header/bottom-nav/popover | `:focus-visible`-Outline | klein |
| REV-096 | Tabellen-Abkürzungen ohne Tooltips | standings-table.tsx:154 | `title`-Tooltips (Sp./Spiele/Diff.) | klein |
| REV-097 ✅ | Home News-Karten Hover, nicht klickbar | page.tsx:144, news-card.tsx | **erledigt:** Startseite nutzt bereits die klickbare `NewsArticleCard`; tote `news-card.tsx` entfernt | klein |
| REV-098 | „Spiele"-Spalte leer für A/B-Ligen | standings-table.tsx:161 | Spalte konditional (wie `showU`) | klein |
| REV-099 | Gold-Hervorhebung inkonsistent (≤3 vs ≤2) | tabellen:152 vs standings:219 | einheitliche Schwelle/Outcome-Config | klein |
| REV-100 | Team-Profil „Galerie"-Tab immer leer | team-detail-client.tsx:48 | Tab ausblenden bis Inhalte | klein |
| REV-101 | „TC"-Abkürzung unerklärt | spielstaetten:194, spieler:270 | „Kapitän" oder `title` | klein |

## 16. Quick Wins (klein & risikoarm)

1. REV-021 veralteten „Passwort vergessen"-Hinweis entfernen
2. REV-073 Footer-Social-Icons echt verlinken oder dekorativ kennzeichnen
3. REV-093 Saison-Bezeichnung vereinheitlichen (`getCurrentSeason().name`)
4. REV-095 Dark-Mode-Tabellenkopf auf Theme-Variablen
5. REV-091/092 tote/widersprüchliche News auf der Startseite bereinigen
6. REV-051 OCR-Default-Model-ID auf gültige ID
7. REV-001 `/ligen/[code]` `notFound()` bei ungültigem Code
8. REV-096/101 Tooltips + „TC"→„Kapitän"
9. REV-020 `?next=`-Redirect nach Login
10. REV-053/054 Dateigröße vorab prüfen + „Bestätigen"-Rückfrage

## 17. Empfohlene Reihenfolge der Korrekturen

1. **Sicherheit zuerst:** REV-010 (Mail-Rollen-Check), REV-011/012 (Auth/Rate-Limit der Public-Mail-Routen), REV-016 (Admin-Write-Trust bzw. RLS-Audit).
2. **Daten & Vertrauen:** REV-090 (Playoff-Endstände, nach Rückfrage), REV-041 (Saison-Label), REV-091/092/093 (News/Saison-Konsistenz), REV-094 (A1-Zahl).
3. **Kern-Workflows robust:** REV-040 (Anmelde-Submit-Gate), REV-050 (OCR-Watchdog), REV-054/055/056 (Bestätigen/Löschen/Validierung), REV-052/053 (Upload-UX).
4. **Navigation/Responsive:** REV-070 (Tablet-Header), REV-071/072/074 (Mobile), REV-001/002/003 (Routing/Guards/Sonderseiten).
5. **Feinschliff (P3):** Admin-Konsistenz, A11y-Fokus/aria, Tabellen-Tooltips, Lint.

## 18. Offene Fragen (vor Umsetzung klären)

- **REV-090:** Sollen die finalen Playoff-Endstände (B-Aufstieg, ggf. weitere) jetzt aus dartunion.de nachgetragen werden? (Sportdaten — nur auf Freigabe.)
- **REV-094:** A1-Team-Zahl auf 6 korrigieren (reine Anzeige, kein sportlicher Wert)?
- **REV-016/002:** Middleware + Verschieben kritischer Admin-Mutationen auf Server-API gewünscht, oder bewusst bei „RLS-only" bleiben (dann RLS-Audit)?
- **REV-047:** Nachmeldungs-Freigabe in eine atomare RPC bündeln (größerer Umbau) — jetzt oder später?
- **REV-100/032:** Leere „Galerie"/„⌘K-Suche" ausblenden (ehrlicher) oder als „kommt bald" belassen?

## 19. Seiten-/Routen-Matrix

Legende: Ö=öffentlich · L=Login nötig · Rollen: G(ast)/S(pieler)/K(apitän)/LA(Ligaleitung)/SA(Super Admin). Alle geprüften Routen: **lädt=200**, Desktop+Mobile per Layout geprüft.

| Route | Zugriff | Rollen | Lädt | Empty-State | Auffälligkeiten |
|---|---|---|---|---|---|
| `/` | Ö | alle | ✅ | ✅ | REV-091/092/097 |
| `/ligen` | Ö | alle | ✅ | ✅ | REV-093/094 |
| `/ligen/[code]` | Ö | alle | ✅ | ✅ | REV-001, REV-090, REV-096/098/099 |
| `/tabellen` | Ö | alle | ✅ | ✅ | REV-095/099 |
| `/spielplan` | Ö | alle | ✅ | ✅ (leer) | Filter erst bei Spielen sichtbar |
| `/ergebnisse` | Ö | alle | ✅ | ✅ | Liga-Filter neu (ok) |
| `/teams` · `/teams/[id]` | Ö | alle | ✅ | ✅ | REV-100 (Galerie-Tab) |
| `/spieler/[playerId]` | Ö | alle | ✅ | ✅ | REV-101 (TC) |
| `/spielstaetten` | Ö | alle | ✅ | ✅ | REV-101 (TC) |
| `/news` | Ö | alle | ✅ | — | REV-091 (Baustelle) |
| `/mehr` · `/downloads` · `/kontakt` | Ö | alle | ✅ | ✅ | Kontakt: kein Rate-Limit (REV-012) |
| `/impressum` `/datenschutz` `/nutzungs-` `/spielbedingungen` | Ö | alle | ✅ | — | Rechtstexte geprüft, ok |
| `/spielberichte/vorlage` | Ö | alle | ✅ | — | REV-058 (PDF-Quelle) |
| `/login` `/registrieren` | Ö | G | ✅ | — | REV-020/021/022/024 |
| `/passwort-vergessen` `/passwort-zuruecksetzen` | Ö | G | ✅ | — | REV-021/023 |
| `/mein-bereich` | L | S/K/LA/SA | ✅ | ✅ | REV-079 (Badge-Text) |
| `/mein-profil` | L | S+ | ✅ | ✅ | ok |
| `/mein-team` · `/kader` · `/bearbeiten` | L | K | ✅ | ✅ | REV-043/045 |
| `/mein-bereich/anmeldungen` | L | K | ✅ | ✅ | REV-040/041 |
| `/mein-bereich/mannschaft-anmelden` | L | K | ✅ | ✅ | REV-042/046 |
| `/mein-bereich/spielberichte` (+`/uebersicht`) | L | K | ✅ | ✅ | REV-054/055/056 |
| `/mein-bereich/spielberichte/ocr` (+`/[id]/pruefen`) | L | K | ✅ | teilw. | REV-050/052/053/060/061 |
| `/admin` | L | LA/SA | ✅ | ✅ | REV-032/033 |
| `/admin/users` `/roles` | L | LA/SA | ✅ | ✅ | REV-016/030/037 |
| `/admin/registrations` (+`/[id]`) | L | LA/SA | ✅ | ✅ | REV-031/034/044 |
| `/admin/nachmeldungen` | L | LA/SA | ✅ | ✅ | REV-035/047 |
| `/admin/spielberichte` | L | LA/SA | ✅ | ✅ | REV-036 |
| `/admin/teams` `/players` `/season-teams` | L | LA/SA | ✅ | ✅ | ok |
| `/admin/news` `/downloads` `/import` `/settings` `/security` | L | LA/SA | ✅ | ✅ | read-only, ehrlich |
| `/nichtvorhanden` · `/teams/xyz` · `/spieler/xyz` | — | — | 404 ✅ | — | korrekt; nur `/ligen/xyz` = 200 (REV-001) |
| **API** (12 Routen) | — | serverseitig | ✅ | — | REV-010/011/013/014/015 |

## 20. Kennzahlen

- **Geprüfte Seiten/Routen:** 48 Seiten + 12 API-Routen (60)
- **Geprüfte Rollen:** 5 (Gast, Spieler, Kapitän, Ligaleitung, Super Admin)
- **Geräte:** Desktop + Mobile (Layout/Breakpoint-Analyse 320–1920px)
- **Findings:** P0 = 0 · P1 = 5 **alle erledigt** (REV-090 war Fehlalarm) · P2 = 28 (REV-094 erledigt) · P3 = 35 offen (REV-076 miterledigt) · **offen gesamt: 63** (P2 + P3)
- **Build:** ✅ grün · **Typecheck:** ✅ · **Lint:** 31 Punkte (build-neutral)

---

*Erstellt im Rahmen des End-to-End-Reviews. Es wurden keine funktionalen Änderungen, keine Daten- oder Architektur-Eingriffe vorgenommen. Umsetzung der Findings erst nach Freigabe / in der empfohlenen Reihenfolge.*
