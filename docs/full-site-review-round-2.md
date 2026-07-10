# MDU-Plattform — Zweites vollständiges Review (Regression / Go-live-Readiness)

**Datum:** 2026-07-09 · **Art:** Nachkontroll-Review, Regressionstest, Restmängel-Check, Go-live-Readiness · **Basis:** `docs/full-site-review.md` (Runde 1, 08.07.) + alle Commits seit dem 08.07. (37 Commits).
**Methode:** statische Code-Verifikation jeder alten Finding-ID (4 parallele Bereichs-Agents mit `file:line`-Belegen), `npm run build` + `tsc` + `eslint`, Laufzeit-Smoke aller Routen (HTTP-Status), **echte Browser-Tests** (Chromium, headless) für öffentliche Seiten: Theme-Persistenz, Responsive-Overflow 320–1920 px, Liga-Seiten-Inhalte, 404-Verhalten, mobile Ansicht.

> **Ehrliche Methodik-Grenze (wie Runde 1):** Diese Session hat **keine Supabase-Zugangsdaten**. Es ist **kein Login** möglich. Alle eingeloggten Flows (Spieler/Kapitän/Ligaleitung/Super-Admin, Benachrichtigungen, Registrierung, Mannschaftsanmeldung, digitaler Spielbericht, OCR, Admin-Aktionen) und die **RLS-/Datenwerte gegen die Live-DB** konnten **nicht** zur Laufzeit ausgeführt werden. Für diese Punkte wurde der **Code** verifiziert (Guard/Check existiert) und der Status `verified_fixed_in_code` bzw. `cannot_verify_runtime` vergeben — **nicht** `fixed` im Sinne eines durchgespielten Nutzerflows. Ein echter Rollen-/RLS-Durchlauf ist selbst eine Go-live-Voraussetzung.

---

## 1. Executive Summary

Die in Runde 1 gefundenen Mängel sind **weit überwiegend behoben** — und, wo prüfbar, sauber. Von den geprüften ~70 Findings sind **~60 `verified_fixed_in_code`**, **4 `partially_fixed`**, **~4 `still_open`** (bewusst/Datenquelle), **0 `regressed` im Kern-Workflow**. Die Kern-Rechenlogik des Spielberichts (Auswechslung, Doppel nicht in der Einzelrangliste, Laden alter Berichte) ist **ohne Regression**. Build und Typecheck sind **grün**.

**Aber:** Die jüngste Theme-Korrektur (serverseitiges Cookie im Root-Layout) hat **zwei echte Nebenwirkungen** ausgelöst, die es in Runde 1 nicht gab:
1. **Die gesamte Seite rendert jetzt dynamisch** (nur `robots.txt`/`sitemap.xml` bleiben statisch). Die in Runde 1 als 🟢 bewertete „überwiegend statisch prerendered"-Performance gilt nicht mehr; `revalidate = 60` auf Start-/News-Seite ist wirkungslos (jede Anfrage = frische DB-Query).
2. **`notFound()` liefert HTTP 200 statt 404** (Soft-404) auf `/ligen/[code]`, `/teams/[id]`, `/spieler/[playerId]`. Der Nutzer sieht die korrekte gebrandete 404-Seite, Suchmaschinen bekommen aber 200 — beim Go-live (dann `SITE_INDEXABLE=true`) ein SEO-Problem.

Dazu ein **Go-live-Footgun**: Wird Migration `0035` eingespielt, aber das News-Seed **nicht** ausgeführt, blendet die Startseite/`/news` **leer** aus (statt statischen Fallback) — der Migrations-Kommentar verspricht das Gegenteil. (Der Betreiber hat den Seed bereits laufen lassen; für künftige Umgebungen bleibt es ein Fallstrick.)

Kein P0. Kein blockierendes P1. Die neuen Punkte sind P2/P3.

## 2. Go-live-Einschätzung

> ## 🟡 GO MIT RESTPUNKTEN

Begründung: **keine offenen P0, keine blockierenden P1**, Kern-Workflows im Code korrekt, Rechte-/RLS-Gerüst stark. Die Restpunkte sind nicht blockierend, aber **vor** dem Scharfschalten abzuarbeiten (v. a. Soft-404/SEO, News-Seed-Footgun, und die **noch nicht durchgeführte Live-Verifikation** von Auth/RLS). Die ehrliche Einschränkung: „produktionsreif" lässt sich **ohne einen echten eingeloggten Durchlauf gegen die Live-DB nicht abschließend bestätigen** — der ist selbst ein Pflichtpunkt.

## 3. Vergleich mit Review Runde 1

| Dimension | Runde 1 | Runde 2 | Kommentar |
|---|---|---|---|
| Technik/Stabilität | 🟢 | 🟢 | Build/tsc grün; Lint 31→23 (build-neutral) |
| Funktion/Workflows | 🟢 | 🟢 | Alle Workflow-Fixes im Code; Punktelogik ohne Regression |
| Benutzerführung | 🟡 | 🟢 | tote Pfade/Abkürzungen behoben (REV-031/036/091/096/100/101) |
| First-Time-UX | 🟡 | 🟢 | News konsistent, Abkürzungen erklärt |
| Sicherheit/Datenschutz | 🟡 | 🟢* | P1-Mail-Check + Rate-Limit + Server-Guard; *Live-RLS-Audit offen |
| Datenplausibilität | 🟡 | 🟡 | A1-Spielzahlen weiter unplausibel (Datenquelle fehlt) |
| Responsive | 🟡 | 🟢* | kein Overflow öffentlich; *Rest-Band eingeloggt (REV2-U01) |
| Accessibility | 🟡 | 🟢* | Fokus-Ringe/aria/Kontrast umgesetzt; *Screenreader-Test offen |
| Performance | 🟢 | 🟡 | **Regression:** alles dynamisch, ISR wirkungslos (REV2-C01/N02) |
| Visuelle/inhaltl. Konsistenz | 🟡 | 🟢 | Saison-Label + Gold-Schwelle vereinheitlicht |

Netto: **6 Dimensionen von 🟡 auf 🟢** (teils mit Verifikations-Sternchen), **1 Dimension von 🟢 auf 🟡** (Performance, durch die Theme-Lösung).

## 4. Statistik der alten Findings

- **Geprüfte alte Findings:** ~70 (REV-001 … REV-101, nicht fortlaufend)
- **verified_fixed_in_code:** ~60
- **partially_fixed:** 4 — REV-011, REV-055, REV-070, (REV-051 ohne Boot-Validierung)
- **still_open (bewusst/Datenquelle):** REV-005 (Bilder, Kostenentscheidung), REV-090 (veralteter statischer Snapshot – optionaler Cleanup), A1-Spielzahlen
- **regressed:** 0 in Kern-Workflows; die neuen Nebenwirkungen betreffen Rendering/Status, nicht die alten Findings
- **cannot_verify_runtime:** alle eingeloggten Flows (Auth fehlt) — Code verifiziert, Nutzerflow nicht durchgespielt

## 5. verified_fixed_in_code (Auszug, mit Beleg)

**Sicherheit/API:** REV-010 (`api/notifications/email/route.ts:31-36` `ADMIN_ONLY_TYPES`+`isAdminUser`→403), REV-012 (Rate-Limit auf kontakt/registration-checks/new-user), REV-013 (`new-user` einheitliche `accepted()`), REV-014 (`cleanup-uploads:36-40` Owner-Check), REV-015 (`upload/route.ts:78` Magic-Byte `sniffAcceptedMime`), REV-016 (`api/admin/users/[userId]:33-97` Server-PATCH mit Rollenprüfung), REV-002 (`proxy.ts:27-45` Guard + Security-Header), REV-022/023/024/057/059.
**Workflows:** REV-040 (Liste→Wizard-Link), REV-041/044 (Saisonname statt roher id), REV-042 (`beforeunload`), REV-043 (Refetch), REV-045/046, REV-047 (`rpc('approve_nomination')`, Migration 0033), REV-050 (`maxDuration=60`+Watchdog), REV-051 (`claude-sonnet-5` gültig), REV-052/053 (HEIC+Größe clientseitig), REV-054 (`window.confirm`), REV-056 (Vollständigkeitsprüfung), REV-058 (`TEMPLATE_VERSION`), REV-059/060/061.
**UI/Nav/A11y:** REV-001 (`ligen/[code]:29 notFound()`), REV-003 (`not-found/error/loading.tsx`), REV-020 (`safeNext()` open-redirect-sicher), REV-021, REV-030 (Rollen symmetrisch), REV-031–037 (Admin-Feinschliff), REV-071/072/073/074/075, REV-082 (`icon.tsx:22` `aria-hidden`), REV-083 (`:focus-visible`).
**Content/Notifications:** REV-077–081 (Glocke/Badge), REV-091/092 (News), REV-093 (Saison-Label), REV-094 (A1=6 Teams), REV-095 (Theme-Kontrast), REV-096/098/099 (Tabellen), REV-097/100/101.

**Laufzeit-bestätigt (öffentlich, echter Browser):**
- Alle **valide Liga-/Playoff-Seiten** rendern echten Inhalt: `/ligen/la`→„LA LIGA", `a1/a2/b1/b2/c`, `playoffs-a/b-aufstieg` — jeweils mit Übersicht/Tabelle-Tabs.
- **Ungültige** Codes → gebrandete „SEITE NICHT GEFUNDEN"-Seite (REV-001 UX korrekt).
- **Theme:** Hell/Dunkel überstehen Reload zuverlässig (server-cookie-getrieben), beide Richtungen getestet.
- **Responsive:** kein horizontaler Overflow auf `/`, `/ligen`, `/ligen/la`, `/tabellen`, `/teams`, `/spielstaetten`, `/news`, `/spielplan`, `/ergebnisse`, `/kontakt` bei 320/375/390/768/1024/1100/1200/1440/1920 px.

## 6. partially_fixed

- **REV-011 — P2** (`api/registration-checks/route.ts`): Rate-Limit ergänzt, aber die `account`-Aktion gibt weiterhin `playerLinked` **und den echten `captainName`** zurück (`:70-81`) — Enumeration gedrosselt, nicht beseitigt. Der Vorschlag „Token/Boolean-Minimalantwort" wurde nicht umgesetzt.
- **REV-055 → REV2-W01 — P3**: Original-Foto-Löschung meldet Fehler jetzt per `console.warn` (nicht mehr still), aber nur clientseitig; kein Server-Log/Cron-Nachlauf → verwaiste Originale möglich (DSGVO-Zusage).
- **REV-070 → REV2-U01 — P3**: Breakpoint auf 1080 px (behebt 769–1080), aber eingeloggt bleibt ein Rest-Overflow-Band ~1081–1280 px (per `overflow-x:clip` verdeckt).
- **REV-051 → REV2-W02 — P3**: gültiger Default gesetzt, aber keine Boot-Validierung der `OCR_MODEL`-Env.

## 7. still_open

- **REV-005 — P2** (bewusst): alle `<Image unoptimized>` — Kostenentscheidung des Betreibers.
- **REV-090 — P3** (optional): veralteter statischer Snapshot `PLAYOFFS_B_AUFSTIEG_STANDINGS` (`lib/data.ts:338-348`) noch vorhanden; wird zur Anzeige vom Import-Merge überschrieben, kann aber die Fallback-Ebene irreführen.
- **A1-Spielzahlen — P2 (Daten):** `A1_LIGA_STANDINGS` (`lib/data.ts:262-267`) hat unplausible `sp`-Werte (14/11/10/12/12/10 bei 6 Teams, max. 10). **Nicht rekonstruierbar** (keine A1-Einzelspiele importiert, dartunion.de nicht erreichbar). Braucht die Quelle oder eine vom Betreiber gelieferte finale A1-Tabelle. Nicht erfunden.
- **Dead Code:** `HOME_NEWS`-Export (`lib/data.ts:609`) unreferenziert — harmlos.

## 8. regressed

**Keine Regression in den alten Findings oder Kern-Workflows.** Die neuen Nebenwirkungen (Abschnitt 9, REV2-N01/N02) sind Folgen der Theme-Lösung auf Rendering-/Status-Ebene, keine Rückfälle bereits behobener Findings.

## 9. Neue Findings (Runde 2)

### REV2-N01 · P2 · Soft-404: `notFound()` liefert HTTP 200 statt 404
- **Bereich:** Routing/SEO · **Route:** `/ligen/[code]`, `/teams/[id]`, `/spieler/[playerId]` · **Rolle:** alle · **Gerät:** alle
- **Problem:** Der Code ruft korrekt `notFound()` (verifiziert), die gebrandete 404-Seite wird auch angezeigt — aber der HTTP-Status ist **200** (per `curl -D-` bestätigt: `HTTP/1.1 200 OK` für `/ligen/zzz`). Ursache: `await cookies()` im Root-Layout (`app/layout.tsx:51`) macht alle Routen dynamisch/gestreamt; `notFound()` kann den Status dann nicht mehr auf 404 setzen.
- **Auswirkung:** Beim Go-live (`SITE_INDEXABLE=true`) indexieren Suchmaschinen ungültige URLs als „echte" 200-Seiten (Soft-404). SEO-/Crawl-Budget-Problem.
- **Reproduktion:** `curl -sI /ligen/zzz` → `200`.
- **Lösungsvorschlag:** Theme-Cookie nicht im Root-Layout lesen (siehe REV2-N02-Fix), oder ungültige Codes über `generateStaticParams`/Middleware als echte 404 behandeln. **Aufwand:** mittel · **Status:** offen
- **Wichtig:** In Runde 1 lieferten `/teams/xyz` + `/spieler/xyz` noch **404** — dies ist eine **neue** Verschlechterung durch die Theme-Lösung.

### REV2-N02 (= REV2-C01) · P2 · Gesamte Seite dynamisch, `revalidate` wirkungslos
- **Bereich:** Performance/Architektur · **Datei:** `app/layout.tsx:51` (`await cookies()`) · **Beleg:** Build-Ausgabe = 63 Routen `ƒ (Dynamic)`, nur `robots.txt`/`sitemap.xml` `○`.
- **Problem:** `cookies()` im Root-Layout zwingt jede Seite in dynamisches SSR. `export const revalidate = 60` auf `app/page.tsx` und `app/news/page.tsx` ist damit **tot** — jede Anfrage rendert frisch und stößt `getHomepageNews()`/`getPublishedNews()` als neue Supabase-Query an. Auch rein statische Seiten (Impressum, Datenschutz, Spielbedingungen) rendern jetzt pro Request.
- **Auswirkung:** höhere TTFB, mehr Serverless-Aufrufe/DB-Last, verlorene Prerender-Optimierung (die Runde 1 als 🟢 wertete). Kein Korrektheitsfehler; Build grün. Kommentare „alle 60 s neu erzeugt" sind irreführend.
- **Lösungsvorschlag:** Theme serverseitig **ohne** Root-Layout-`cookies()` lösen (z. B. Cookie in der `proxy.ts`/Middleware lesen und als Request-Header/`data-theme` durchreichen, oder Theme-Klasse pro Response setzen), damit öffentliche Seiten wieder statisch/ISR sein können. Alternativ bewusst dynamisch bleiben und `revalidate`+Kommentare entfernen. **Aufwand:** mittel · **Status:** offen (Design-Entscheidung nötig)

### REV2-N03 (= REV2-C02) · P2 · Leere `news`-Tabelle blendet News leer aus (Go-live-Footgun)
- **Bereich:** News/Betrieb · **Datei:** `lib/server/news-data.ts:60,94` (bei Erfolg + 0 Zeilen → `[]`, **kein** statischer Fallback) vs. Kommentar `supabase/migrations/0035_news.sql:14-16` („solange die Tabelle … leer ist … bleibt der statische Bestand sichtbar").
- **Problem:** Migration 0035 einspielen **ohne** `npx tsx scripts/seed-news.mts` → `/` „Aktuelles" und `/news` **leer**. Code und Migrations-Kommentar widersprechen sich.
- **Auswirkung:** stille Leerseite im Betrieb, wenn die Reihenfolge nicht eingehalten wird. (Aktuell unkritisch, da der Seed lief.)
- **Lösungsvorschlag:** Migrations-Kommentar korrigieren **oder** bei leerer Tabelle auf statisch zurückfallen; Go-live an „Seed gelaufen" koppeln. **Aufwand:** klein · **Status:** offen

### REV2-N04 · P3 · Server-Guard deckt `/mein-profil` und `/mein-team*` nicht ab
- **Bereich:** Sicherheit/Konsistenz · **Datei:** `proxy.ts` (Matcher `/admin`, `/mein-bereich`) · **Beleg (Laufzeit):** unauth. `/mein-bereich`→307, aber `/mein-profil`→**200**, `/mein-team`→**200**, `/mein-team/kader`→**200**.
- **Problem:** Der REV-002-Guard schützt `/admin` + `/mein-bereich`, nicht die separaten eingeloggten Routen `/mein-profil`, `/mein-team`, `/mein-team/kader`. Diese sind nur Client-gegated.
- **Auswirkung:** gering — die Daten schützt RLS, unauth. Nutzer werden clientseitig weggeleitet; aber der Server-Guard ist inkonsistent.
- **Lösungsvorschlag:** Matcher um `/mein-profil` und `/mein-team` erweitern. **Aufwand:** klein · **Status:** offen

### Weitere P3 (kurz)
- **REV2-S01** — `PATCH /api/admin/users/[userId]` hat keinen Selbst-Degradierungs-/„letzter-Super-Admin"-Schutz (DELETE hat ihn): ein alleiniger Super-Admin kann sich per Rollenwechsel selbst aussperren. Fix: Self-Guard wie beim DELETE.
- **REV2-S02** — Rate-Limiter (`lib/server/rate-limit.ts`) ist In-Memory/pro-Instanz → auf Vercel skaliert das effektive Limit mit der Instanzzahl. Vor Go-live für die Mail-Routen auf geteilten Store (z. B. Upstash).
- **REV2-U01** — Eingeloggter Desktop-Header ~1081–1280 px: rechte Leiste (Toggle+Konto+Glocke, alle `flexShrink:0`) + 8 Nav-Links übersteigen die Breite; per `overflow-x:clip` verdeckt (Glocke abgeschnitten). Zusätzlich re-expandiert der Toggle bei >1240 px auf 220 px → eigene Clip-Zone 1241–1280. Fix: kompakten Toggle länger halten / Nav-Gap 26→16 / Cluster umbrechen.
- **REV2-W01** — verwaiste OCR-Originalfotos bei Cleanup-Fehler (nur Client-`warn`) → Server-Log/Cron. **REV2-W02** — OCR-Model-Env ohne Boot-Validierung. **REV2-W03** — Doppel erlaubt beim Absenden denselben Spieler in beiden Slots (kein Punkte-Bug, Datenqualität).
- **REV2-C03** — `getHomepageNews` ohne Obergrenze: viele veröffentlichte Meldungen im Monat → unbegrenzt viele Karten auf der Startseite. Fix: `Math.max(3, withinMonth.slice(0,6))`.
- **REV2-C04** — Admin-News-Hilfetext sagt „die **zwei** neuesten", gezeigt werden aber ≥3/Monat. Text angleichen.

## 10. Technische Prüfung

- **Build:** `npm run build` ✅ exit 0. **Typecheck:** `tsc --noEmit` ✅ sauber.
- **Lint:** `eslint` → **23 Probleme (16 Fehler, 7 Warnungen)** — von 31 in Runde 1; überwiegend `react/no-unescaped-entities` (kosmetisch, build-neutral) + 1× `react-hooks/set-state-in-effect` (`user-notifications.ts:143`).
- **Rendering:** 63 Routen **dynamisch** (ƒ), nur `robots.txt`/`sitemap.xml` statisch → REV2-N02.
- **Routen-Smoke:** alle öffentlichen Routen HTTP 200; `/mein-bereich*`, `/admin*` → 307 (Guard); `/mein-profil`,`/mein-team*` → 200 (REV2-N04); ungültige `[param]`-Routen → **200 (Soft-404, REV2-N01)**; `/nichtvorhanden` → 404.
- **API-Routen:** 12 vorhanden; Auth/Guards im Code verifiziert (Laufzeit nicht ausgeführt).
- **ENV/Storage/Mail/OCR/PDF/Import:** in dieser Session nicht konfiguriert → nur Code-seitig bewertet.

## 11. First-Time-User-Experience

Deutlich verbessert gegenüber Runde 1: News konsistent („Saison beendet"), Startseite zeigt die 3 neuesten (Monat), Tabellen-Abkürzungen mit Tooltips, „TC"→„Kapitän", leerer „Galerie"-Tab entfernt, klickbare News-Karten, gebrandete 404-Seite mit Rückwegen. **Restpunkte für Neulinge:** A1-Tabelle wirkt durch die unplausiblen Spielzahlen unstimmig (REV-A1); Unterschied digitaler Spielbericht / PDF / OCR wird erst im eingeloggten Bereich klar (nicht neu). Innerhalb von 10 s ist Zweck + Haupteinstiege (Ligen/Spielplan/Ergebnisse/Tabellen) erkennbar.

## 12. Rollen- und Workflowprüfung

**Runtime nicht möglich (kein Login).** Code-seitig verifiziert:
- **Gast:** öffentliche Seiten alle 200, Inhalte gerendert (Browser-bestätigt).
- **Spieler/Kapitän/Ligaleitung/Super-Admin:** Guards/Rollenlogik (`lib/auth/roles.ts`, `proxy.ts`, Server-APIs) vorhanden und konsistent; Admin-Rückwege (REV-036), aktive Sidebar (REV-031) im Code belegt.
- **Spielbericht-Rechenkern (Regressionsfokus):** Doppel (Spiel 9/18) fließen **nicht** in die Einzelrangliste (`match-reports.ts:170,213` `game_type==='single'`); Auswechslung korrumpiert keine Punkte (slotbasiert); alte Berichte laden (`GAME_SCHEDULE.map(...?? default)`). **Keine Regression.**
- **Migration 0034 (Eindeutigkeit):** partielle Indizes blockieren keine laufenden Workflows (nur `approved`+bestehendes Team bzw. gesetzte `player_id`).

> **Pflicht vor Go-live:** je einen echten eingeloggten Durchlauf pro Rolle gegen die Live-DB (Anmeldung, Spielbericht, OCR, Freigabe, Benachrichtigung) — hier nicht durchführbar.

## 13. Responsive

Öffentliche Seiten: **kein horizontaler Overflow** 320–1920 px (Browser-gemessen), inkl. Tablet-Band 1100/1200 px. Header schaltet ≤1080 px auf Bottom-Nav (2 sichtbare Links), >1080 px volle Desktop-Nav (10 Links). **Rest:** eingeloggter Header 1081–1280 px (REV2-U01) — nur eingeloggt prüfbar, hier nicht ausgeführt; ≤320 px eingeloggt marginal (REV-071-Rest). Admin-Konsole/Formulare mobil: `cannot_verify_runtime`.

## 14. Accessibility

Umgesetzt und im Code belegt: `:focus-visible`-Ringe (auch farbige Flächen), `aria-hidden` auf Icons, Popover-Fokus setzen/zurückgeben, echte Footer-Links mit `aria-label`, Tabellen-Tooltips, Theme-Kontrast über Variablen, Pinch-Zoom erlaubt. **Offen (Verifikation):** echter Tastatur-Durchlauf + Screenreader (NVDA/VoiceOver) + axe/Lighthouse-Audit — nicht Teil dieser Session.

## 15. Performance

**Verschlechterung** ggü. Runde 1: alles dynamisch (REV2-N02), ISR wirkungslos, DB-Query pro Request auf Start-/News-Seite. Bilder weiter `unoptimized` (REV-005, bewusst). Kein Layout-Shift-Verdacht (feste Bildmaße). Empfehlung: Theme-Lösung so umbauen, dass öffentliche Seiten wieder statisch/ISR sein können.

## 16. Sicherheit und Datenschutz

Stark und gegenüber Runde 1 klar verbessert: P1-Mail-Rollen-Check (REV-010), Rate-Limits (REV-012), Server-Guard + Security-Header (REV-002), Server-PATCH mit Rechteprüfung (REV-016), Magic-Byte-Upload (REV-015), Owner-Check Cleanup (REV-014), Signed-URL 15 min (REV-057), atomarer OCR-Start (REV-059), News-RLS (0035: public nur `published`, Schreiben nur `is_admin()`), kein `service_role` im Client. **Rest:** REV-011 (Enumeration `captainName`), REV2-S01 (Self-Degradierung), REV2-S02 (Rate-Limiter pro-Instanz), REV2-N04 (Guard-Lücke). **Pflicht vor Go-live:** vollständiger **RLS-Audit gegen die Live-DB** (jede gelesene Tabelle) — in dieser Session nicht möglich.

## 17. Datenplausibilität

- **A1-Tabelle:** unplausible Spielzahlen, nicht rekonstruierbar (Quelle/Betreiber nötig) — **still_open**.
- **Playoff-B-Aufstieg:** angezeigte (importierte) Endstände final und konsistent mit der News; nur der überholte statische Snapshot bleibt liegen (REV-090, optionaler Cleanup).
- A1-Team-Zahl 6 (REV-094) ✅, Wolperdinga-Rückzug markiert, Doppel korrekt aus Einzelwertung ausgeschlossen.

## 18. Quick Wins (klein, risikoarm)
1. REV2-C04 Admin-News-Hilfetext „zwei"→„neueste des Monats (mind. 3)"
2. REV2-N03 Migrations-Kommentar 0035 korrigieren (oder leer→statisch)
3. REV2-C03 Startseiten-News deckeln (`Math.max(3, slice(0,6))`)
4. REV2-N04 Guard-Matcher um `/mein-profil`,`/mein-team` erweitern
5. REV2-S01 Self-Degradierungs-Guard im PATCH (analog DELETE)
6. REV-090 veralteten Playoff-Snapshot angleichen/entfernen
7. `HOME_NEWS`-Dead-Code entfernen

## 19. Zwingende Punkte vor Go-live

1. **REV2-N01 Soft-404 beheben** — sobald `SITE_INDEXABLE=true`, dürfen ungültige URLs nicht als 200 indexiert werden. Hängt an der Theme-Lösung (REV2-N02).
2. **REV2-N02 Theme/Rendering entscheiden** — Theme aus dem Root-Layout-`cookies()` lösen (öffentliche Seiten wieder statisch) **oder** bewusst dynamisch akzeptieren + tote `revalidate`/Kommentare entfernen.
3. **REV2-N03 News-Seed** sicherstellen (erledigt) + Migrations-Kommentar korrigieren.
4. **Echter Rollen-Durchlauf + RLS-Audit gegen die Live-DB** (Auth, Spielbericht, OCR, Freigabe, Benachrichtigung, Telefon-Gating, Storage-Policies) — hier nicht durchführbar, aber Pflicht.
5. **Betreiber-Restliste** (aus Go-live-Bericht): Migrationen `0027`/`0034` ausführen, `sort_ts`-News-Korrektur, Test-/Demo-User-SQL, `NEXT_PUBLIC_SITE_URL` in Vercel, Supabase-Auth-URLs auf `www`, Supabase-EU-Region bestätigen, externe anwaltliche Freigabe + AVVs, dann `SITE_INDEXABLE=true` + Rechts-Banner entfernen.

## 20. Empfohlener nächster Sprint

1. **Theme/Rendering-Refactor** (REV2-N01/N02) — die eine Änderung mit dem größten Hebel (SEO + Performance in einem).
2. **Sicherheits-Restschliff:** REV-011 (Enumeration), REV2-S01 (Self-Guard), REV2-S02 (verteiltes Rate-Limit) + Live-RLS-Audit.
3. **Kleine Robustheit:** REV2-W01 (verwaiste Fotos), REV2-W03 (Doppel-Spieler), REV2-N04 (Guard), Quick Wins.
4. **Daten:** finale A1-Tabelle vom Betreiber/Quelle, dann eintragen.
5. **Verifikation:** eingeloggte Rollen-Durchläufe, axe/Screenreader, echte Geräte — der Schritt von 🟢 „gut" zu „geprüft exzellent".

---

## 25. Vergleichstabelle der alten Findings

Legende Status: ✅ verified_fixed_in_code · ◑ partially_fixed · ○ still_open · ⟳ cannot_verify_runtime (Code ok). „Getestet": C=Code, R=Runtime/Browser.

| ID | Prio | Bereich | Runde 1 | Runde 2 | Getestet | Restproblem |
|---|---|---|---|---|---|---|
| REV-001 | P2 | Routing | fixed | ✅ (UX) / ◑ Status | R | Soft-404 200 statt 404 → REV2-N01 |
| REV-002 | P2 | Security | fixed | ✅ | C+R | Guard-Lücke /mein-profil,/mein-team → REV2-N04 |
| REV-003 | P2 | Routing | fixed | ✅ | R | not-found/error/loading vorhanden |
| REV-005 | P2 | Perf | offen | ○ | C | Bilder unoptimized (bewusst) |
| REV-010 | P1 | Security | fixed | ✅ | C | Admin-only-Typen 403 |
| REV-011 | P2 | Security | fixed | ◑ | C | captainName-Enumeration bleibt |
| REV-012 | P2 | Security | fixed | ✅ | C | Rate-Limit (pro-Instanz, REV2-S02) |
| REV-013/014/015 | P3 | Security | fixed | ✅ | C | — |
| REV-016 | P2 | Security | fixed | ✅ | C | Server-PATCH + Rechteprüfung |
| REV-020/021 | P2 | Auth-UX | fixed | ✅ | C | safeNext open-redirect-sicher |
| REV-022/023/024 | P3 | Auth | fixed | ✅ | C | — |
| REV-030 | P2 | Rollen | fixed | ✅ | C | Edit/Assign/Delete symmetrisch |
| REV-031–037 | P3 | Admin | fixed | ✅ | C | REV-033 zwei Kartenquellen (Nit) |
| REV-040/041 | P1/P2 | Anmeldung | fixed | ✅ | C | Wizard-Gate + Saisonname |
| REV-042/043/044/045/046 | P2/P3 | Anmeldung | fixed | ✅ | C | — |
| REV-047 | P3 | Nachmeldung | fixed | ✅ | C | RPC (Migration 0033 einspielen) |
| REV-050 | P1 | OCR | fixed | ✅ | C | Watchdog + maxDuration |
| REV-051 | P3 | OCR | fixed | ◑ | C | keine Boot-Validierung (REV2-W02) |
| REV-052/053/054/056 | P2 | OCR/Bericht | fixed | ✅ | C | — |
| REV-055 | P2 | Datenschutz | fixed | ◑ | C | nur Client-warn (REV2-W01) |
| REV-057/058/059/060/061 | P2/P3 | OCR/Bericht | fixed | ✅ | C | — |
| REV-070 | P1 | Responsive | fixed | ◑ | C+R | Rest-Band eingeloggt (REV2-U01) |
| REV-071/072/073/074/075 | P2 | Responsive/A11y | fixed | ✅ | C+R | ≤320px eingeloggt marginal |
| REV-076 | P3 | Responsive | fixed | ✅ | C | kein Overlap (1080px) |
| REV-077–081 | P3 | Notifications | fixed | ✅ | C | — |
| REV-082/083 | P3 | A11y | fixed | ✅ | C | Screenreader-Test offen |
| REV-090 | P1→— | Daten | Fehlalarm | ○ | C | statischer Snapshot bleibt |
| REV-091/092/093 | P2/P3 | News/Konsistenz | fixed | ✅ | C+R | HOME_NEWS Dead-Code |
| REV-094 | P2 | Daten | fixed | ✅ | C | A1=6 Teams |
| REV-095/096/097/098/099/100/101 | P2/P3 | Tabellen/UI | fixed | ✅ | C | — |
| A1-Spielzahlen | P2 | Daten | offen | ○ | C | Quelle/Betreiber nötig |

## 28. Terminal-Zusammenfassung

```
ZWEITES REVIEW — MDU-Plattform — 2026-07-09
Alte Findings geprüft:      ~70
  verified_fixed_in_code:   ~60
  partially_fixed:          4  (REV-011, REV-055, REV-070, REV-051)
  still_open:               3  (REV-005 bewusst, REV-090 optional, A1-Daten)
  regressed (alte):         0
  cannot_verify_runtime:    alle eingeloggten Flows (kein Supabase-Login)
Neue Findings:              0×P0 · 0×P1 · 4×P2 · 8×P3
  P2: REV2-N01 Soft-404(200) · REV2-N02 alles dynamisch/ISR tot ·
      REV2-N03 leere News-Tabelle blendet aus · REV2-N04 Guard-Lücke
  P3: S01 Self-Guard · S02 Rate-Limit pro-Instanz · U01 Header-Band ·
      W01 Fotos · W02 OCR-Model · W03 Doppel-Spieler · C03 News-Deckel · C04 Text
Build: ✅ grün   Typecheck: ✅   Lint: 23 (16E/7W, build-neutral)
Getestete Rollen: Gast (Runtime) · S/K/LA/SA (nur Code, kein Login)
Getestete Routen: 60 (alle öffentlichen Runtime-200; Liga-Inhalte Browser-bestätigt)
Go-live: 🟡 GO MIT RESTPUNKTEN (kein P0/P1; SEO/Perf/Verifikation vor Scharfschalten)

Wichtigste 5 Restpunkte:
 1. Soft-404 (REV2-N01) + Theme/Rendering-Entscheidung (REV2-N02) — 1 Refactor, 2 Effekte
 2. Echter Rollen-Durchlauf + RLS-Audit gegen Live-DB (nicht hier möglich)
 3. News-Seed/Migrations-Kommentar (REV2-N03) + Quick Wins
 4. REV-011 Enumeration + REV2-S01/S02 Sicherheits-Restschliff
 5. Finale A1-Tabelle (Datenquelle) eintragen
```

---

*Erstellt im Rahmen des zweiten End-to-End-Reviews. Es wurden keine funktionalen Änderungen vorgenommen (reines Prüf-/Dokumentations-Review). `docs/full-site-review.md` (Runde 1) bleibt unverändert. Umsetzung der Restpunkte erst nach Freigabe.*
