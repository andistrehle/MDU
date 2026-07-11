# MDU Platform — Backlog / Roadmap

## Phase 2 — Plattform ist alleinige Datenquelle (DB statt dartunion.de)

Betreiber-Entscheidung (Juli 2026): „Es läuft ab jetzt nichts mehr über dartunion.de."
Spieler + Kader-/Team-Zusammensetzung wurden in die DB übernommen. Leitplanke bei
jedem Schritt: **alles muss aussehen wie vorher** (DB-first, statischer Fallback).

- [x] **Migration `0031`** — Passnummern-/Zuordnungsfelder an `player_nominations`
  (`player_id`, `license_number`, `license_provisional`, `assigned_profile_id`)
- [x] **Migration `0032`** — Tabellen `players` + `player_assignments` (RLS: öffentlich
  lesbar, Schreiben nur `is_admin()`); Übernahme per `scripts/seed-players-roster.mts`
  (368 Spieler + 368 Zuordnungen, idempotent) — **ausgeführt**
- [x] **Passnummern-Generierung** bei Nachmeldung: Regel „höchste Teamkollegen-Nummer + 1,
  nächste global freie" (`lib/data/pass-numbers.ts`); bei Freigabe durch die Ligaleitung
  wird ein zuordenbarer Spieler + vorläufige Passnummer (`*`) angelegt und in
  `players`/`player_assignments` übernommen (`reviewNomination`) — **getestet (Hans Dampf → MDU 26 5914)**
- [x] **Stufe 1** — Team-Seite `/teams/[id]` liest die Kader-Basis aus der DB
  (`getDbRosterForTeam`), Reihenfolge/Format identisch zur statischen Basis,
  Nachmelde-Spieler hinten angehängt, statischer Fallback bei fehlenden DB-Daten
- [x] **Stufe 2** — Spielerprofil `/spieler/[id]` mit DB-Fallback (`getDbPlayer`):
  per Nachmeldung angelegte Spieler (nur in der DB) bekommen eine echte Profilseite
  statt 404; bestehende Spieler laufen unverändert über den statischen Stamm
- [x] **Cleanup-Skript** `scripts/delete-nominated-player.mts` — Test-/Fehl-Nachmeldung
  vollständig entfernen (nur `source='nomination'`, dartunion-Stamm bleibt unberührt)

### ⏳ Offen — Stufe 3: Team-Seite saison-aware machen (für den Saisonwechsel 26/27)

**Merker (bewusst auf später gelegt):** Die Team-Seite einer *bestehenden* Mannschaft
(`app/teams/[id]/page.tsx`) ist aktuell fest auf die statische Saison 25/26 verdrahtet
(`getCurrentSeason()` + `getDbRosterForTeam(season-2026, …)`). Der selbstverwaltete
DB-Saison-Pfad (`SeasonTeamView` via `getSeasonTeams`/`getSeasonRoster`) greift nur für
**neue** Teams (`!staticTeam`). Folge: Eine **freigegebene Mannschaftsanmeldung für 26/27**
legt Team + Kader (inkl. neuer Spieler) korrekt in der DB an (`season_team_assignments` /
`season_roster_assignments`), erscheint aber **nirgends öffentlich**, solange 26/27 nicht die
*aktive* Saison ist — und selbst nach dem Umschalten würde die Seite einer bestehenden
Mannschaft weiter den 25/26-Kader zeigen. **Beim Saisonwechsel 26/27** deshalb:
- Team-Seite (und `/mein-team/kader`, Statistik, Sitemap …) an der **aktiven DB-Saison**
  ausrichten, nicht an `getCurrentSeason()` (statisch)
- Für bestehende Teams die statischen Stammdaten (Farbe/Logo/Historie) mit dem
  **DB-Kader der aktiven Saison** kombinieren, statt den `SeasonTeamView`-Pfad nur für neue Teams
- Erst sinnvoll, wenn 26/27 wirklich live geht (dann existieren auch Tabellen/Spielplan 26/27)

## Android-Nutzertest (Juli 2026) — Feedback-Tickets

Quelle: **ein einzelner realer Testnutzer**, Test überwiegend auf **Android**. Mobile
Auffälligkeiten daher zunächst als Android-Beobachtung behandeln (nicht automatisch
plattformübergreifend). IDs `UT-01…UT-20` entsprechen 1:1 den Feedbackpunkten
(Nachvollziehbarkeit). Reihenfolge-/Umsetzungsempfehlung am Ende des Abschnitts.
**Noch nichts umgesetzt — reine Backlog-Erfassung.**

### Bereits erledigt / analysiert (kein offener Aufwand, nur nach Deploy gegenprüfen)

- **UT-03 · Light-/Dark-Mode dauerhaft speichern — ✅ ERLEDIGT.** Theme wird in Cookie
  (+ localStorage-Fallback) gespeichert und per synchronem Inline-Script vor dem ersten
  Paint gesetzt; Reload/Wiederbesuch behält die Wahl (im Browser beide Richtungen getestet).
  Commits `d0dadd7`/`546e54e`. → **Nach Deploy auf Android gegenprüfen** (Reproduzierbarkeit).
- **UT-04 · Toggle schneidet den Rahmen — ✅ ERLEDIGT.** Der weiße Griff schnitt den
  farbigen inset-Ring der aktiven Hälfte an; Griff mit mehr Luft → Ring wieder vollständig
  (hell + dunkel geprüft). Commit `139c8c2`. Deckt sich mit demselben Feedback von Tim Weber.
  ⚠️ **Nicht verwechseln** mit dem separaten Header-Überlauf eingeloggt 1081–1280 px
  (REV2-U01, siehe Review Runde 2) — das bleibt offen.
- **UT-18 · Cookie-/Consent-Konzept — ✅ ANALYSIERT: kein Banner nötig.** Kein Analytics,
  kein Marketing-/Social-Pixel, keine eingebetteten Medien; Fonts self-hosted (`next/font`);
  nur technisch notwendige First-Party-Mechanismen (Session, Theme, Tour-Merker,
  Kapitäns-Ansicht). Deckt sich mit Datenschutz §11. Kein Handlungsbedarf, solange nichts
  Einwilligungspflichtiges dazukommt.
- **UT-19 · Google Maps — ✅ ANALYSIERT: nur Links, keine Einbettung.** Adressen öffnen als
  `<a href="…google.com/maps…">` in neuem Tab; **kein** iFrame/Embed → kein Datenschutzbedarf.
- **UT-12 (Teil A) · Favicon/App-Icons — ✅ ERLEDIGT.** MDU-Dartboard-Emblem als
  `favicon.ico`/`icon.png`/`apple-icon.png` (Commit `77ee1d2`). Offener Rest siehe UT-12 unten.
- **UT-20 · Persönlicher Bereich (Zukunftsidee) — ➡️ ZUSAMMENGEFÜHRT** mit dem bestehenden
  Ticket „Spieler-Startseite personalisieren (Tim Weber)" (Abschnitt „Bekannte To-dos").
  Hinweis: „Mein Bereich" bietet **bereits** Kacheln Meine Mannschaft / Meine Liga / Meine
  Statistik / Benachrichtigungen; der Wunsch betrifft die **prominentere Sichtbarkeit** (u. a.
  direkt auf der Startseite). Kein separates neues Ticket.

### Umsetzungsstand (10.07.2026)
- **UT-01 ✅ erledigt** — Demo-Button erscheint auf der Startseite **und** auf dem „Mein Bereich"-Dashboard (`/mein-bereich`, exakter Pfad), aber **nicht** auf Unterseiten/Teamprofilen und **nicht** auf den „Mein Bereich"-Unterseiten (Kachel-Klick). Betreiber-Entscheidung umgesetzt.
- **UT-06 ✅ erledigt** — Button `max-width: calc(100vw - 24px)` + Label-Ellipsis; Rahmen bei hohem Zoom/In-App-Browser vollständig (bei 220/280/360 px geprüft).
- **UT-07 ✅ umgesetzt (Android-Verifikation offen)** — PlayerCard sperrt jetzt `html` UND `body` + `overscroll-behavior: contain`; echter Android-Touch-Scroll noch auf Gerät gegenzuchecken.
- **UT-11 ✅ erledigt** — alle 13 dartunion.de-Hyperlinks entfernt (Klartext ohne Link); `grep href.*dartunion` = 0. Die Verweis-Sätze („…auf dartunion.de") **bleiben textlich unverändert** (Betreiber-Entscheidung: so lassen).

### Offene Tickets

**UT-01 · „Demo Tour erneut ansehen"-Button nur auf der Startseite**
- Kategorie: UI/Navigation · Priorität: **P2** · Plattform: **plattformübergreifend**
- Beschreibung: Der schwebende CTA ist global in `app/layout.tsx` gemountet (`<DemoTourButton/>`) und erscheint auf **allen** Seiten, auch auf Teamprofilen etc.
- Nutzerfeedback: „Erscheint auch auf Unterseiten … wirkt auf Teamprofilen störend … sollte ausschließlich auf der Startseite sichtbar sein."
- Zielverhalten: CTA nur bei `pathname === '/'` rendern, auf Unterseiten ausblenden. (Die Tour selbst bleibt unberührt.)
- Akzeptanzkriterien: Button sichtbar nur auf `/`; auf `/teams/[id]`, `/ligen/*`, `/tabellen` etc. nicht vorhanden; „erneut ansehen" funktioniert weiter.
- Betroffen: `components/mdu/tour-restart-link.tsx`, `app/layout.tsx`
- Abhängigkeiten: keine · Status: **offen** · Reproduzierbarkeit: **bestätigt (Code)**

**UT-02 · Demo-Tour-Status auch bei Instagram-/UTM-Einstieg zuverlässig speichern**
- Kategorie: Bug/Analyse · Priorität: **P2** · Plattform: übergreifend (verstärkt Android)
- Beschreibung: Die Nicht-Wiederholung wurde bereits über localStorage + Cookie-Fallback gelöst (Commit `a0373de`). Feedback deutet an, dass der Einstieg über Instagram/UTM-Links die „schon gesehen"-Erkennung teils umgeht.
- Nutzerfeedback: „Beim Einstieg über Instagram bzw. UTM-Links scheint dies teilweise nicht zu funktionieren."
- Zielverhalten: „Schon gesehen" gilt unabhängig von Query-Parametern (`?utm_*`, `?tour=1`) und URL-Varianten; nur ein bewusster Neustart (Button) zeigt die Tour erneut.
- Akzeptanzkriterien: Aufruf mit `?utm_source=instagram` o. Ä. startet die Tour **nicht** erneut, wenn schon gesehen; Verhalten auf `www` vs. Apex identisch.
- Prüfen: localStorage/Cookie-Persistenz, `?tour=1`-Erzwingung, Domains/Subdomains (`www.` vs. `mdudarts.de`), In-App-Browser von Instagram (eigener WebView, evtl. eigener Storage).
- Betroffen: `components/mdu/demo-tour.tsx` · Abhängigkeiten: UT-02 baut auf `a0373de` auf
- Status: **offen** · Reproduzierbarkeit: **noch zu prüfen** (Instagram-In-App-Browser)

**UT-05 · Bottom-Navigation: Icons zu weit unten / roter Aktiv-Indikator angeschnitten**
- Kategorie: UI/Responsive · Priorität: **P2** · Plattform: **Android-spezifisch (vermutlich Safe-Area)**
- Beschreibung: `components/mdu/bottom-nav.tsx` nutzt festes `padding: '10px 6px 26px'` — **kein** `env(safe-area-inset-bottom)`. Auf Android-Gestennavigation kann das zu tief sitzen / den Indikator anschneiden.
- Nutzerfeedback: „Icons sitzen etwas zu weit unten. Der rote aktive Indikator wirkt abgeschnitten."
- Zielverhalten: Bottom-Nav respektiert die Geräte-Safe-Area; Icons + Aktiv-Indikator vollständig sichtbar, sauber vertikal zentriert.
- Akzeptanzkriterien: Auf Android (Gesten- + Button-Nav) und iOS kein Anschnitt; `env(safe-area-inset-bottom)` berücksichtigt.
- Betroffen: `components/mdu/bottom-nav.tsx` · Abhängigkeiten: keine
- Status: **offen** · Reproduzierbarkeit: **noch zu prüfen** (Android real, iOS gegentesten)

**UT-06 · „Demo Tour erneut ansehen"-Button: Rahmen abgeschnitten (Instagram-In-App-Browser, hoher Zoom)**
- Kategorie: UI/Layout · Priorität: **P2** · Plattform: **allgemein mobil (verstärkt Instagram-In-App-Browser + hohe Zoom-/Schriftgröße)**
- Beschreibung: **Per Betreiber-Screenshot geklärt:** Gemeint ist der schwebende **„Demo Tour erneut ansehen"-Button** („Demo-Schnellzugriff") — dessen roter Pill-Rahmen wirkt seitlich **angeschnitten**. Der Screenshot stammt aus dem **Instagram-In-App-Browser** bei stark vergrößerter Darstellung; Button/Border skaliert bzw. positioniert dort nicht sauber (ragt über den Rand).
- Nutzerfeedback: „Der Rahmen des Schnellzugriffs wirkt abgeschnitten." (+ Bild: Instagram-WebView, „…Tour erneut a…", oben/unten rote Border sichtbar, seitlich abgeschnitten.)
- Zielverhalten: Button samt Rahmen bei hoher Zoom-/Schriftgröße und im In-App-Browser vollständig sichtbar; nicht über den Viewport-Rand hinausragen (ggf. `max-width`/Textumbruch, sichere Positionierung).
- Akzeptanzkriterien: Bei 320–430 px, hohem Systemzoom und im Instagram-WebView ist der Button-Rahmen komplett sichtbar; kein Überlauf/Anschnitt.
- Betroffen: `components/mdu/tour-restart-link.tsx` (`.mdu-demo-tour-btn`) · Abhängigkeiten: **UT-01** (nur Startseite → seltener sichtbar), **UT-02** (Instagram-In-App-Browser-Kontext)
- Status: **offen** · Reproduzierbarkeit: **bestätigt (Bild)** — im Instagram-WebView + hohem Zoom gegentesten

**UT-07 · Player-Card-Overlay: Hintergrund scrollt (Scroll-Lock fehlt)**
- Kategorie: Bug/UX · Priorität: **P2** · Plattform: **allgemein mobil (evtl. übergreifend)**
- Beschreibung: **Betreiber-Klärung:** Nicht ein Swipe-Problem — sobald die Player-Card **geöffnet** ist (egal von welcher Seite/Liste), lässt sich der **Hintergrund** darunter scrollen. Ursache: fehlender Body-Scroll-Lock, während das Overlay offen ist (das News-Modal macht es korrekt via `document.body.style.overflow='hidden'`).
- Nutzerfeedback: „Wenn man die Player Card öffnet, egal wo, kann man den Hintergrund scrollen."
- Zielverhalten: Solange die Player-Card offen ist, ist der Seiten-Hintergrund gesperrt (kein Scrollen); nach Schließen wieder normal, Scroll-Position erhalten.
- Akzeptanzkriterien: Bei geöffneter Card scrollt der Hintergrund nicht (Android + iOS + Desktop); Schließen stellt den Scroll sauber wieder her.
- Betroffen: die Player-Card-Overlay-Komponente (überall wo sie geöffnet wird) · Abhängigkeiten: Muster analog `news-article-card.tsx` (Body-Scroll-Lock)
- Status: **offen** · Reproduzierbarkeit: **bestätigt (Betreiber: „egal wo")** — iOS/Desktop gegentesten

**UT-08 · Hover-/Selected-State bleibt nach dem Scrollen „kleben"**
- Kategorie: Bug/Touch · Priorität: **P2** · Plattform: **Android Chrome (verify)**
- Beschreibung: Klassisches Touch-Verhalten: `:hover`/`:active` bleibt nach Antippen/Scrollen an einem Teamnamen hängen.
- Nutzerfeedback: „Beim Scrollen bleibt ein Teamname teilweise markiert."
- Zielverhalten: Kein persistenter Hover/Active auf Touch-Geräten (z. B. `@media (hover: hover)`-Gating der Hover-Styles).
- Akzeptanzkriterien: Nach Tap/Scroll bleibt kein Element visuell markiert; Desktop-Hover unverändert.
- Prüfen: Hover/Focus/Active-Styles, Pointer-Events, Android Chrome · Betroffen: Team-/Tabellen-Listen (`mdu-link-name` u. a.), `app/globals.css`
- Status: **offen** · Reproduzierbarkeit: **noch zu prüfen** · Abhängigkeiten: evtl. Ursache von UT-09

**UT-09 · Tabelle mobil vereinfachen (A) + Teamprofil-Tabs sicher klickbar (B)**
- Kategorie: UX/Mobile · Priorität: **P2** · Plattform: **mobil (A) + Desktop (B)**
- Beschreibung — **zwei Aspekte** (Betreiber-Klärung):
  - **(A) Tabelle mobil:** Eine Tabellen-Zeile klappt mobil aktuell eine **Detailanzeige** auf (`StandingsTable`, `expandedPos`/`toggleExpand`) und wirkte dabei „zeitweise nicht anklickbar". Diese Anzeige wird mobil **nicht** gebraucht → ein Tap soll **direkt ins Teamprofil** springen (wie Desktop). Desktop-Tabellenzeile bleibt unverändert klickbar.
  - **(B) Teamprofil-Tabs:** Die Tabs im Teamprofil (Übersicht/Kader/Spielplan/Ergebnisse/Statistik) **müssen zuverlässig klickbar sein — insbesondere auf Desktop ausdrücklich vom Betreiber verlangt** („da müssen dann die Team Tabs aber klickbar sein"). Deckt die ursprüngliche Tester-Beobachtung ab.
- Nutzerfeedback: „Kader, Spielplan … ließen sich zeitweise nicht anklicken." + Betreiber (A): „…Anzeige unter der Tabelle … mobil brauche ich die nicht … Desktop klickbar." + Betreiber (B): „im Desktop müssen dann die Team Tabs klickbar sein."
- Zielverhalten: **(A)** Mobil: Zeilen-Tap → Teamprofil (kein Expand). **(B)** Teamprofil-Tabs auf Desktop (und mobil) jederzeit zuverlässig antippbar/klickbar.
- Akzeptanzkriterien: (A) mobiler Zeilen-Tap öffnet zuverlässig das Teamprofil, kein hängendes Expand; Desktop-Zeile unverändert. (B) alle Teamprofil-Tabs auf Desktop wiederholt und zuverlässig wechselbar (mobil ebenso).
- Betroffen: `components/mdu/standings-table.tsx` (A: `expandedPos`/`toggleExpand`, `.mdu-mobile-only`); `components/mdu/team-detail-client.tsx` (B: Tab-Leiste) · Abhängigkeiten: ggf. verwandt mit UT-08 (klebende Touch-States könnten Klicks blockieren)
- ⚠️ **Beim Umsetzen prüfen:** (A) Der mobile Expand zeigt Zusatzspalten (Sp./Legs/Diff./Form) — vor dem Entfernen bestätigen, dass diese mobil nicht vermisst werden. (B) Ursache der zeitweise nicht klickbaren Tabs identifizieren (Pointer-Events/Overlay?).
- **Umsetzung (`✅ erledigt`):**
  - **(A)** `standings-table.tsx`: mobiler Expand (`expandedPos`/`toggleExpand`/Detail-Grid) entfernt; die ganze Tabellen-Zeile ist mobil jetzt ein `TeamLink` → ein Tap springt direkt ins Teamprofil (rechts ein Navigations-Chevron als Affordanz). Desktop-Zeile unverändert. Die Zusatzwerte Sp./Legs/Diff./Form gibt es weiterhin im Teamprofil + in der Spielerkarte → mobil nicht vermisst.
  - **(B)** Ursache gefunden: der Site-Header (`desktop-header.tsx`) ist `sticky; top:0; z-index:50; height:70px`; die Tab-Leiste war `sticky; top:0; z-index:10` → beim Scrollen rutschte sie **unter** den (halbtransparenten) Header und war dort nicht mehr klickbar. Fix: Tab-Leiste in `team-detail-client.tsx` **und** `league-detail-client.tsx` auf `top:70` gesetzt → parkt unter dem Header, immer klickbar (Desktop headless verifiziert).
- Status: **✅ erledigt** (tsc + build grün, Browser verifiziert) · Reproduzierbarkeit: (A) bestätigt (Code) · (B) Ursache (Header-Overlap) identifiziert & behoben

**UT-10 · Statistik-Tab im Teamprofil: Einzelrangliste fachlich unpassend**
- Kategorie: Produkt/Content · Priorität: **P2** · Plattform: übergreifend
- Beschreibung: Der Statistik-Tab zeigt die Einzelrangliste, was für eine **Mannschafts**-Statistik unpassend wirkt. **Nicht sofort entscheiden.**
- Nutzerfeedback: „Der Statistik-Tab enthält keine wirkliche Teamstatistik. Die Einzelrangliste wirkt dort fachlich unpassend."
- **Betreiber-Entscheidung getroffen:**
  - **Teamprofil (Team-Tabs):** Statistik-Tab → **„Coming Soon"** (noch keine echte Teamstatistik anzeigen).
  - **Liga-Detailseite (Statistiken):** die **Einzelrangliste als eine** Statistik behalten; weitere Statistiken als **„Coming Soon"** kennzeichnen.
- Zielverhalten: konsistente Statistik-Darstellung; nirgends eine fachlich unpassende Einzelrangliste unter „Team-Statistik".
- Akzeptanzkriterien: Team-Tab „Statistik" zeigt einen sauberen Coming-Soon-Zustand; Liga-Statistik zeigt die Einzelrangliste + Coming-Soon-Platzhalter für die übrigen.
- Betroffen: `components/mdu/team-detail-client.tsx` (TABS), Liga-Statistik (`components/mdu/league-detail-client.tsx` / `getStatisticsForLeague`) · Abhängigkeiten: „Team-Statistiken behalten Unentschieden" (Abschnitt Spielerstatistik)
- **Umsetzung (`✅ erledigt`):**
  - **Teamprofil:** `StatistikTab` in `team-detail-client.tsx` durch einen sauberen Coming-Soon-Zustand ersetzt (Icon + „Coming Soon" + Hinweis auf Kader/Spielerkarte). Die frühere Einzelrangliste-Tabelle + `openFromEntry` samt jetzt ungenutzter Imports entfernt.
  - **Liga-Detailseite:** Einzelrangliste bleibt als **eine** Statistik; darunter ein Coming-Soon-Platzhalter „Weitere Statistiken" (gestrichelte Card + Badge) für die übrigen Auswertungen.
- Status: **✅ erledigt** (tsc + build grün, Browser verifiziert) · Reproduzierbarkeit: bestätigt (Content)

**UT-11 · Alte dartunion.de-Links entfernen/prüfen (teils „Forbidden Access")**
- Kategorie: Content/Links · Priorität: **P2** · Plattform: übergreifend
- Beschreibung: **13 user-facing `<a href="https://dartunion.de">`-Links** (Quellenangaben) über `app/ergebnisse`, `app/spielplan`, `app/spielstaetten`, `app/mehr`, `components/mdu/league-detail-client.tsx`, `team-detail-client.tsx`, `news-article-card.tsx`, `league-standings-panel.tsx`. Passt zur Phase-2-Entscheidung „nichts läuft mehr über dartunion.de".
- Nutzerfeedback: „Es existieren noch Links zur alten Seite. Teilweise führen diese auf ‚Forbidden Access'."
- **Betreiber-Entscheidung:** dartunion.de ist **offline** (liefert „Forbidden") → **alle** dartunion.de-**Hyperlinks entfernen**. Reine Quellen-/Textnennung darf bleiben, aber **nicht** mehr klickbar.
- Zielverhalten: Kein anklickbarer dartunion.de-Link mehr in der gesamten App; wo eine Quellenangabe sinnvoll ist, als Klartext (ohne `<a>`).
- Akzeptanzkriterien: `grep href.*dartunion` liefert 0 Treffer; keine ins Leere/„Forbidden" führenden externen Links; Texte inhaltlich unverändert.
- Betroffen: 13 Fundstellen in `app/ergebnisse`, `app/spielplan`, `app/spielstaetten`, `app/mehr`, `components/mdu/league-detail-client.tsx`, `team-detail-client.tsx`, `news-article-card.tsx`, `league-standings-panel.tsx` · Abhängigkeiten: keine
- Status: **offen (entschieden: alle Links raus)** · Reproduzierbarkeit: **bestätigt (Code + Betreiber)**

**UT-12 · Metadaten vervollständigen: Open Graph, Web-Manifest, `metadataBase` (Favicon ✅)**
- Kategorie: SEO/Sharing/PWA · Priorität: **P2 (OG) / P3 (Manifest)** · Plattform: übergreifend
- Beschreibung: Favicon/App-Icons sind erledigt (`77ee1d2`). **Fehlen:** Open-Graph-/Twitter-Meta (Link-Vorschau beim Teilen in WhatsApp/Instagram/FB), `app/manifest.ts`/`site.webmanifest` (PWA), `metadataBase` in `app/layout.tsx`.
- Nutzerfeedback: „Favicon, App Icons, Open Graph, Manifest, Browser Tab prüfen."
- Zielverhalten: Aussagekräftige OG-Karte (Titel, Beschreibung, MDU-Bild) beim Teilen; Web-Manifest mit Name/Icons/Theme-Color; `metadataBase` gesetzt.
- Akzeptanzkriterien: Teilen eines MDU-Links zeigt eine MDU-Vorschau (nicht leer/Vercel); Manifest valide; Icons überall MDU.
- Betroffen: `app/layout.tsx` (metadata), neue `app/manifest.ts` + `app/opengraph-image.*` (bewusst noch nicht angelegt) · Abhängigkeiten: `NEXT_PUBLIC_SITE_URL` (Go-live)
- Status: **offen (Teil B)** · Reproduzierbarkeit: bestätigt (Code)

**UT-13 · React Minified Error #418 (Hydration) analysieren**
- Kategorie: Bug/Analyse · Priorität: **P2** · Plattform: übergreifend (beobachtet Android)
- Beschreibung: `Uncaught Error: Minified React error #418` = Hydration-Mismatch (Server-HTML ≠ Client). Kandidaten: `suppressHydrationWarning`/Theme am `<html>`, zeit-/zufallsabhängige Renderpfade, ggf. Datums-/Locale-Formatierung.
- Nutzerfeedback: „In der Browserkonsole: Uncaught Error: Minified React error #418."
- Zielverhalten: Ursache identifizieren und beseitigen; keine Hydration-Fehler in der Konsole.
- Akzeptanzkriterien: Kein React #418 im Dev-Build (Klartext-Meldung reproduziert + gefixt); Konsole sauber.
- Betroffen: zu ermitteln (Analyse zuerst; Dev-Build zeigt die Klartext-Meldung mit Komponente) · Abhängigkeiten: keine
- **Hinweis:** #418 ist ein **Hydration-Mismatch** (technischer Konsolen-Fehler), **nicht** die dartunion-„Forbidden"-Sache (das ist UT-11 — Betreiber vermutete eine Verwechslung).
- **Analyse 10.07.2026:** Konsolen-Check über 12 öffentliche Seiten-Ladungen (Start/Liga/Tabellen/Teamprofil/Spielerprofil/News × mobil+Desktop) → **kein #418, kein Hydration-Fehler** (nur die env-bedingte „Supabase nicht konfiguriert"-Warnung, die live nicht auftritt). Vermutlich durch den **Theme-Refactor** bereits behoben (die zwischenzeitliche server-seitige Cookie-Theme-Variante konnte solche Mismatches erzeugen). **Eingeloggte Zustände hier nicht testbar** (kein Supabase-Login).
- Status: **vermutlich behoben / nicht reproduzierbar (öffentlich)** — als Beobachtungspunkt offen halten; falls wieder gesehen (v. a. eingeloggt), Seite/Aktion notieren · Reproduzierbarkeit: **nicht reproduziert (aktueller Stand)**

**UT-14 · Login als Modal/Dialog statt eigener Seite**
- Kategorie: UX-Idee · Priorität: **P3** · Plattform: übergreifend
- Beschreibung: Vorschlag, den Login als Overlay-Dialog zu öffnen. **Kein Bug.**
- Nutzerfeedback: „Login könnte als Modal/Dialog geöffnet werden."
- Zielverhalten: Login-Dialog über der aktuellen Seite (mit Fallback-Seite `/login` für Direktaufruf/`?next=`).
- Akzeptanzkriterien: Dialog öffnet/schließt sauber; `?next=`-Redirect bleibt; Direktaufruf `/login` funktioniert weiterhin.
- **Betreiber-Entscheidung:** Login bleibt vorerst **eigene Seite**; Modal ist eine **spätere** Idee (zurückgestellt).
- Betroffen: `app/login/page.tsx`, Header-Login-Link · Abhängigkeiten: `?next=`-Logik (REV-020)
- Status: **zurückgestellt (P3, später)** · Reproduzierbarkeit: n. a.

**UT-15 · Auth-Flow: Aktionen ohne bestätigte E-Mail möglich?**
- Kategorie: Security/Auth · Priorität: **P1 (falls bestätigt)** · Plattform: übergreifend
- Beschreibung: Eindruck, dass bestimmte Aktionen auch **ohne** E-Mail-Bestätigung möglich waren. Ganzen Auth-Flow prüfen (Supabase `email_confirmed_at`, RLS, welche Aktionen ein unbestätigtes Konto ausführen kann).
- Nutzerfeedback: „Eindruck, dass bestimmte Aktionen auch ohne bestätigte E-Mail möglich waren."
- Zielverhalten: Klare Definition, was ein unbestätigtes Konto darf (idealerweise: nichts Schreibendes); serverseitig/RLS erzwungen.
- Akzeptanzkriterien: Ohne bestätigte E-Mail keine privilegierten/schreibenden Aktionen; freundlicher Hinweis „bitte E-Mail bestätigen".
- Betroffen: `lib/auth/*`, Supabase-Auth-Konfiguration, RLS-Policies · Abhängigkeiten: **überlappt mit dem Live-RLS-Audit (Review Runde 2, zwingend vor Go-live)**
- Status: **offen** · Reproduzierbarkeit: **noch zu prüfen (Priorität!)** — braucht Live-DB/Login

**UT-16 · Eingabe-Validierung: Emojis / Sonderzeichen**
- Kategorie: Validierung/Robustheit · Priorität: **P2** · Plattform: übergreifend
- Beschreibung: Festlegen, welche Zeichen in Namen/Freitextfeldern (Registrierung, Profil, Spitzname, Teamname, „Über mich", Kontakt) erlaubt sind; Validierung vereinheitlichen.
- Nutzerfeedback: „Validierung verschiedener Eingaben prüfen. Festlegen, welche Zeichen erlaubt sein sollen."
- Zielverhalten: Definierter erlaubter Zeichensatz je Feld; konsistente, freundliche Fehlermeldungen; keine kaputte Anzeige/DB durch Sonderzeichen.
- Akzeptanzkriterien: Dokumentierte Regeln; problematische Eingaben werden sauber abgefangen; Emojis bewusst erlaubt **oder** klar abgelehnt.
- Betroffen: Formulare in Registrierung/Profil/Team/Kontakt · Abhängigkeiten: keine
- Status: **offen** · Reproduzierbarkeit: **noch zu prüfen** (welche Felder konkret auffällig)

**UT-17 · Netzwerk-Requests / Datenminimierung prüfen**
- Kategorie: Datenschutz/Security/Analyse · Priorität: **P2** · Plattform: übergreifend
- Beschreibung: Analysieren, welche Daten die Seite überträgt und ob nur Notwendiges gesendet wird (kein Over-Fetching sensibler Felder an den Client).
- Nutzerfeedback: „Welche Daten werden übertragen? Werden nur notwendige Informationen gesendet? Datenschutz/Security überprüfen."
- Zielverhalten: Öffentliche/rollenbezogene Endpunkte liefern nur nötige Felder; keine E-Mails/Telefonnummern o. Ä. an Unberechtigte.
- Akzeptanzkriterien: Ergebnis dokumentiert; ggf. Select-Felder/Policies verschlankt.
- Betroffen: Supabase-Queries/RLS, API-Routen · Abhängigkeiten: **teilweise = Live-RLS-Audit (Review Runde 2)** → dort mitbehandeln
- Status: **offen (Analyse)** · Reproduzierbarkeit: bestätigt (Analyse-Aufgabe)

### Offene Rückfragen an den Betreiber
- **UT-07 — ✅ beantwortet:** Player-Card-Overlay, „egal wo" → Body-Scroll-Lock fehlt.
- **UT-10 — ✅ beantwortet:** Team-Tab „Statistik" = Coming Soon; Liga = Einzelrangliste + Coming-Soon für weitere.
- **UT-11 — ✅ beantwortet:** dartunion.de offline → alle Hyperlinks raus.
- **UT-14 — ✅ beantwortet:** Login bleibt eigene Seite; Modal später.
- **UT-06 — ✅ geklärt (Bild):** der „Demo Tour erneut ansehen"-Button, roter Rahmen seitlich abgeschnitten im Instagram-In-App-Browser bei hohem Zoom.
- **UT-09 — ✅ geklärt:** „Anzeige unter der Tabelle" = mobiler Detail-Expand → mobil raus, direkt ins Teamprofil; Desktop klickbar lassen.
- **Weiterhin offen — UT-13:** Auf welcher Seite/bei welcher Aktion erschien React #418? (Bitte beim nächsten Auftreten notieren.)

### Empfohlene Reihenfolge (spätere Umsetzung, nicht jetzt)
1. **P1 / Sicherheit zuerst:** UT-15 (Aktionen ohne E-Mail-Bestätigung) — braucht Live-DB/Login; zusammen mit dem Live-RLS-Audit (Runde 2) + UT-17 (Datenminimierung).
2. **✅ Umgesetzt:** UT-01 (Button nur Startseite), UT-11 (dartunion-Links raus), UT-07 (Body-Scroll-Lock), UT-06 (Button-Rahmen im Zoom/WebView), UT-09 (mobiler Expand raus → Direktnavigation + Tab-Overlap-Fix), UT-10 (Coming-Soon Team-Tab + Liga).
3. **Reproduzierbarkeit klären (Android real, iOS gegentesten):** UT-08 (Hover klebt), UT-05 (Bottom-Nav Safe-Area), UT-13 (#418), UT-02 (Tour bei Instagram/UTM).
4. **Nach Detail-Klärung:** UT-16 (Zeichen-Validierung), UT-12 Teil B (OG/Manifest/metadataBase).
5. **Ideen/später:** UT-14 (Login-Modal, zurückgestellt), Personalisierung (UT-20, bereits im Backlog).

## Erledigt — Kontaktformular, Spielbedingungen, Rechts-Tiefenprüfung, Domain/Go-live (30. Juni 2026, zuletzt)

Live auf `main` / Vercel. `www.mdudarts.de` ist technisch live, bleibt aber bis zum Go-live **noindex** (nicht beworben).

- [x] **Kontaktformular** als zweiter unmittelbarer Kontaktweg (§ 5 DDG): `/kontakt` mit echtem Formular (Name/E-Mail/Betreff/Nachricht, Pflicht-Datenschutz-Einwilligung, Honeypot-Spamschutz, klare Validierung + Button-UX). Versand via Resend: **To = `kontakt@mdudarts.de`**, **Liga-Admins als verdecktes BCC**, Reply-To = Absender. Route `app/api/kontakt`, Helper `lib/server/email/send-contact.ts`, Footer-Link
- [x] **E-Mail-Empfang `kontakt@mdudarts.de`** eingerichtet (Strato-Postfach; MX `smtpin.rzone.de` zeigt korrekt auf Strato). **Root-SPF für Strato** in Cloudflare ergänzt (`v=spf1 include:_spf.strato.com ~all`) → Strato-Ausgang DMARC-konform (`p=reject`); Resend war bereits verifiziert (DKIM/MAIL-FROM `send.mdudarts.de`/DMARC). ⚠️ Bei Resend-Status „Suppressed" Adresse aus der Sperrliste entfernen (entsteht, wenn früher an noch nicht existierendes Postfach gesendet wurde)
- [x] **Spielbedingungen** veröffentlicht (`/spielbedingungen`, 22 §§): an die neuen Online-Regeln angepasst (Ein-&-Auswechslungen mit 4 Ersatzspielern, **Nachmeldung online**, **48 h** Verlegungsfrist, **30 min** Gerätereservierung, „Spielberechtigung" statt physischem Spielerpass); im Download-Bereich + als Pflicht-Checkbox bei der Mannschaftsanmeldung verlinkt; durchgängige JSX-Leerzeichen-Bugs nach `</strong>` gefixt
- [x] **Spielbericht-Druckvorlage als PDF** (`/downloads/MDU-Spielbericht-Vorlage.pdf`, 2 Seiten A4, via Chrome-Headless erzeugt); mobile Ansicht mit horizontalem Scroll, 3.-Leerseite-Bug behoben
- [x] **Telefonnummern**: `player_contacts` (Migration `0030`, zugriffsgeschützt, **nicht** öffentlich); Kapitäns-Telefon nur für eingeloggte Kapitäne via gated Route `/api/captain-phones`; Anruf/WhatsApp/SMS-Menü; Spielstätten mit Lokal-Telefon (`tel:`) + Google-Maps-Adresslink; Datenschutz §13/§14 ergänzt
- [x] **Rechts-Tiefenprüfung (DSB + anwaltlich)** der drei Rechtstexte:
  - **Impressum**: „nicht eingetragener Verein"; zweiter Kontaktweg (Kontaktformular, § 5 DDG); Verbraucherstreitbeilegung (§ 36 VSBG, bewusst **ohne** die 2025 abgeschaltete EU-OS-Plattform); unklare „DSV"-Formulierung bereinigt
  - **Datenschutz**: zuständige Aufsichtsbehörde (BayLDA); Art. 22 (keine ausschließlich automatisierte Entscheidung); §10 Kontaktformular-Daten; §18 Minderjährige (Art. 8 DSGVO). Profilbild bleibt **Default-AN** (Art. 6 I f, Opt-out) — bewusste Betreiber-Entscheidung
  - **Nutzungsbedingungen**: AGB-feste Haftung (3-Stufen-Modell mit Kardinalpflichten); Änderungsklausel § 308 Nr. 4 BGB (Widerspruch/Kündigung); Schlussbestimmungen (Recht + Salvatorische Klausel); Minderjährige
- [x] **Pre-Go-live noindex-Schalter**: `lib/site-config.ts → SITE_INDEXABLE=false` steuert zentral noindex-Meta (alle Seiten) **und** `robots.txt = Disallow: /`. Go-live = Flag auf `true`

## Erledigt — Medien, Mein Bereich, Datenpflege (Juni 2026)

Live auf `main` / Vercel.

- [x] **Medienverwaltung** (Supabase Storage, öffentlicher `media`-Bucket, CDN, ~0 Kosten):
  - Wiederverwendbare `<ImageUpload>`-Komponente: Auswahl → **Browser-Komprimierung (WebP)** → Upload → öffentliche URL
  - **Profilbild** (Profil), **Teamlogo + Mannschaftsbild** (Team bearbeiten) mit Upload/Ersetzen/Entfernen
  - Öffentliche Anzeige: Spielerseite (Foto), Teamseite (Logo + Mannschaftsbild-Banner)
  - **Vorhandene Fotos/Logos als Default** vorbelegt (statische `player.photoUrl` / `team.logoUrl`); Upload überschreibt nur individuell
  - RLS: Spieler nur eigener Pfad, Kapitän nur eigenes Team, Admin alles (Migrationen `0026`, `0027`)
- [x] **Profilbild-Veröffentlichung standardmäßig an** (Opt-out, berechtigtes Interesse); Spitzname bleibt Opt-in. Datenschutz §6 entsprechend umformuliert
- [x] **Mein Bereich aufgeräumt/erweitert**: „Mein Team" + neue „Meine Liga" für alle team-verknüpften Nutzer (Spieler lesen, Kapitän bearbeitet); neue „Meine Statistik" (→ eigenes Spielerprofil); redundante Kacheln „Team bearbeiten"/„Kader"/„Profilbild ändern" entfernt
- [x] **Benutzerverwaltung**: Benutzer löschen (Super Admin alle, Ligaleitung nur Spieler/Kapitäne; Server-Route mit Schutzregeln, FK-sichere Meldung)
- [x] **Datenimport dartunion.de** erneut ausgeführt (alle 6 Wettbewerbe; 12 neue Ergebnisse, Tabellen/Ranglisten aktualisiert, 0 Dubletten)
- [x] **Merge-Fix**: Begegnung wird je Spieltag **orientierungs-tolerant** zusammengeführt (Heim/Gast egal herum, Quelle = dartunion) → keine vertauschten Phantom-/Doppel-Spiele mehr

## Erledigt — Rechtliches & Compliance (Juni 2026)

Impressum, Datenschutz, Nutzungsbedingungen, Einwilligungen, Bildrechte. Live auf `main` / Vercel.
Offene Vereinsangaben (Anschrift/Vertretung) sind eingetragen; finaler juristischer Check ausstehend.

- [x] **Impressum** gefüllt: Münchner Dart Union, Zenettistr. 30, 80337 München; vertreten durch Anton Bauer (i. V. Andreas Strehle); §18 MStV Andreas Strehle; kontakt@mdudarts.de; §5 DDG; Urheberrecht (Vereinsregister/USt entfallen)
- [x] **Datenschutz** vollständig: Verantwortlicher; Domain/Strato + Hosting Vercel; Cloudflare; Resend; Supabase; Datei-Uploads/Storage; **OCR/Anthropic (US-Transfer, kein Training)**; Speicherdauer; Bildrechte; Liga-Datenquelle (zunehmend selbst erstellt)
- [x] **Nutzungsbedingungen**-Seite (Konten, Inhalte, Uploads, Missbrauch, Verfügbarkeit, Haftung)
- [x] **Einwilligungen**: Pflicht-Checkboxen (Datenschutz + Nutzungsbedingungen) in der Registrierung; freiwillige Einwilligungen Profilbild/Spitzname im Profil mit Speicherung + öffentlicher Anzeige-Gating (Migration `0025`)
- [x] **Bildrechte**: Upload nur Spieler selbst, Löschen Spieler + Admin, Mannschaftsbilder nur mit Zustimmung
- [x] **Foto-Löschung**: OCR-Upload-Originale werden nach Bestätigung des Berichts automatisch gelöscht; ebenso beim Löschen eines Berichts durch die Ligaleitung (Storage miträumen)
- [x] **Kontakt**-Seite befüllt (E-Mail, Anschrift, Ansprechpartner); „Mehr"/Footer verlinkt
- [x] Domain-Vorbereitung: robots/sitemap/Canonical auf `www.mdudarts.de` (Umzug-Checkliste siehe „Vor Go-live")
- [ ] **Offen (nicht Code):** finaler juristischer Check (Anwalt/DSB) → danach Hinweis-Banner aus `LegalPage` entfernen; AVV mit Vercel/Supabase/Resend/Cloudflare/Anthropic abschließen

## Erledigt — OCR-Foto-Upload + Druckvorlage (Juni 2026)

Papier-Spielbericht per Foto/PDF hochladen → automatisch per Vision auslesen →
prüfen → in den bestehenden digitalen Bericht übernehmen. Grundsatz: **OCR
erkennt und befüllt, der Mensch prüft und bestätigt** — Tabelle/Einzelrangliste
ändern sich erst über den bestehenden Gegner-/Ligaleitungs-Workflow. Live auf
`main` / Vercel.

- [x] Druckbare A4-Spielbericht-Vorlage (`/spielberichte/vorlage`): Kopf/Logo, Liga-Ankreuzfelder, Aufstellung, 18 Spiele, Highlights, Unterschriften; Druck-Pagination gefixt (kein 3. Leerblatt)
- [x] OCR-Pipeline mit abstrahiertem, per Server-Env einsteckbarem Provider; **Default Claude Vision** (server-only Key), Stub-Provider zum kostenlosen Testen; Feature per `OCR_FEATURE_ENABLED` schaltbar, Rollen über `OCR_ALLOWED_ROLES`
- [x] Upload-UI (Desktop + **mobile Kamera** `capture`): Begegnung **optional** (wird nach Erkennung vorgeschlagen), **Seite 2 (Highlights) optional** mit Nachfrage
- [x] Claude-Vision-Provider: ein Aufruf für Erkennung + Strukturierung ins MDU-Schema; robustes JSON-Parsing (kein Union-Structured-Output-Limit), tolerante Zahlen (`z.coerce`), Diagnose-Ausschnitt bei Parsefehler
- [x] Pass-/Lizenznummer als **eindeutiger Schlüssel** beim Spieler-Matching (Pass-Nr. vor Name, Dice-Fallback); Pass-Nr. überall im Kader in „Mein Bereich" angezeigt + suchbar
- [x] Begegnung: exakte Auflösung → Auto-Zuordnung; sonst **Fuzzy-Vorschlag** (Teamnamen + Spieltag/Datum), wahrscheinlichste vorausgewählt
- [x] Prüfansicht: Original-Vorschau **aller Seiten** (Signed URL), erkannte Felder mit Konfidenz/Status, Aufstellung mit Pass-Nr. + Zuordnungs-Methode, **Highlights-Block**, Begegnungs-Zuordnung, dann Übergabe an den bestehenden Editor/Submit-Workflow
- [x] Teamkapitän aus den Stammdaten **auto-befüllt**, wenn OCR die Handschrift nicht liest
- [x] Liga aus geschlossener Ankreuz-Liste (verhindert „B"→„8"); **180er/171er als Strichliste**: Modell transkribiert Striche (`||`→11), Code rechnet deterministisch in die Anzahl um (`||`=2, nie 11); High Finish/Short Leg als echte Werte
- [x] **Auswechslungen** im Spielablauf: durchgestrichene Positionsnummer + neue daneben (`H1`→`H5`) wird erkannt; tatsächlich gespielte Position landet in den Spielen (Editor), Wechsel-Block in der Prüfansicht
- [x] Vorlage: Auswechslungs-Hinweis präzisiert („Spielernummer durchstreichen und neue daneben", Beispiel `H1 5` mit schräg durchgestrichener „1")
- [x] Sicherheit: privater Storage-Bucket, Signed URLs, RLS; kein service_role/Key im Frontend; Rechte serverseitig geprüft; Idempotenz (kein Doppel-/Reload-Job)
- [x] Migrationen `0023` (OCR-Tabellen + Bucket + RLS + Notification) und `0024` (`page_group_id` für Mehrseiten); Vercel-ENV `OCR_FEATURE_ENABLED/PROVIDER/MODEL/API_KEY`

### Offene OCR-Folgepunkte (Phase 1d / Phase 2)
- [ ] Inline-Feldkorrektur direkt in der Prüfansicht (statt nur im Editor) inkl. Audit der Korrekturen (`match_report_ocr_fields`)
- [ ] Admin → Spielberichte: OCR-Statusspalte/Filter + Direktlink zur Prüfung + Original (Signed URL)
- [ ] HEIC-Konvertierung serverseitig (aktuell Hinweis „bitte als JPG/PNG"); Bildvorverarbeitung/Deskew
- [ ] Bounding-Box-Overlay zum Klicken/Gegenprüfen; QR-Code/Spielbericht-ID zum direkten Begegnungs-Match
- [ ] Highlights aus OCR in die Spielerstatistik aggregieren (siehe „Bekannte To-dos")

## Erledigt — Spielbericht / Nachmeldung / Import-Sprint (Juni 2026)

Reihenfolge ~chronologisch. Alles live auf `main` / Vercel.

- [x] Online-Spielbericht komplett: Erfassung (18 Spiele inkl. 2 Doppel), Einzelrangliste-Livetabelle, Punktelogik
- [x] Spielbericht-Verhandlung: Gegner kann Änderung anfordern (`?propose=1`), Heim sieht Vorschlag farblich markiert (übernommen ✓ / offen ➜), Verlauf/Historie, Eskalation an Ligaleitung nach 3 Runden
- [x] Admin/Ligaleitung: Hoheit über alle Spielberichte (ansehen/ändern/löschen), Übersicht nach Liga gruppiert, mobil ohne Querscrollen (Kürzel + „N. Sp."), Benachrichtigung bei neuem Bericht & Änderungen
- [x] Strukturierte Highlights im Spielbericht (eindeutig für Statistik): 180er/171 = Anzahl, High Finish = 100–180, Short Leg = Darts 9–20 (mehrere separat). Migration `0021`
- [x] Spieler nachmelden: Button unter „Team bearbeiten" + Kader, Maske mit Feld „Letzte Liga-Erfahrung" (A/B/C/La/keine), Prüf-Workflow Ligaleitung (bestätigen/ablehnen + Begründung), Benachrichtigungen, grüne Erfolgs-Einblendung, Portal-Fix. Migrationen `0019`, `0022`
- [x] Vollständiger dartunion-Import aller 6 Wettbewerbe (Ergebnisse, Tabellen, Einzelranglisten, Spieler-/Teamstatistik)
- [x] Spieltaggenaues Import-Matching `(Liga|Heim|Gast|Spieltag)` statt Paar-Dedup — behebt Ergebnis-Fehlzuordnung & Dubletten in Mehrfachrunden (La/C); Parser-Guard gegen Self-Match-Artefakt; Importer pro Liga autoritativ & re-runbar
- [x] Spielplan: innerhalb jeder Liga nach Spieltag aufsteigend sortiert

### Beobachtung (kein Bug auf unserer Seite)
- dartunion ist intern inkonsistent: Spielplan-Grid vs. offizielle Tabelle (A-Aufstieg 4 vs 1, C 9 vs 2 offene Spiele). Match-Listen spiegeln das Grid, Tabellen die Tabellenseite. Löst sich beim nächsten Import, sobald dort Scores nachgetragen sind — **nicht hardcoden**.

## Erledigt seit Super-Admin-Login (Juni 2026)

Reihenfolge ~chronologisch. Alles live auf `mdu-three.vercel.app` (Domain `mdudarts.de` via Cloudflare).

- [x] Rollenrechte vollständig in der UI (Spieler / Teamkapitän / Ligaleitung / Super Admin)
- [x] P0 Datenschutz & Sicherheit (Datenschutz, Impressum, robots, sitemap, noindex, Doku)
- [x] MDU-Daten von dartunion.de aktualisiert
- [x] Kompletter Adminbereich (12 Sektionen) + responsive Mobile-Konsole (Drawer/Topbar)
- [x] Online-Mannschaftsanmeldung mit Freigabe-Workflow (draft → submitted → in_review → approved/rejected/changes_requested)
- [x] Automatische Spieler-/Team-Erkennung bei Registrierung (nur Vorschlag, keine Rechtevergabe)
- [x] E-Mail-Benachrichtigungen (Resend, LIVE): Team-Captain-Mails (eingereicht/freigegeben/abgelehnt/Nachbesserung)
- [x] „Konto freigeschaltet"-Mail an User inkl. Rolle + Rechtebeschreibung + Verknüpfung
- [x] DNS eingerichtet: Strato → Cloudflare (Subdomain-MX) → Resend verified; Absender no-reply@mdudarts.de
- [x] Vercel-ENV: RESEND_API_KEY, EMAIL_FROM, SUPABASE_SERVICE_ROLE_KEY (server-only)
- [x] Kachel-Badges für offene Admin-Aufgaben (Benutzerverwaltung, Saisonanmeldungen)
- [x] Einheitliches Notification-Center: Tabelle `notifications` (per-User read_at, RLS), DB-Trigger für alle Events, Glocke + Dropdown im Header für alle eingeloggten Nutzer, Kachel-Badges auch für Spieler/Kapitän
- [x] UI-Feinschliff: Glocke auffälliger, roter Badge nur auf Glocke (nicht mehr auf „Mein Bereich"), „Mein Bereich"-Button in der Admin-Konsole (kein Logout)
- [x] Excel-Übersicht aller Accounts/Keys + Architektur-Schaubild

## Wichtig / abhängig

- [x] Supabase-Migrationen ausführen: bis einschließlich `0026_media_bucket.sql` im SQL-Editor
- [ ] **Migration `0027_media_team_policies.sql` im SQL-Editor ausführen** (Storage-Policies für Teamlogo/Mannschaftsbild; nötig, damit Kapitäne in den `teams/`-Pfad hochladen dürfen). Idempotent (`drop policy if exists` → `create`) — im Zweifel gefahrlos erneut ausführen, um sicherzustellen, dass es drin ist.
- [ ] **Migration `0034_uniqueness_constraints.sql` im SQL-Editor ausführen** — **erst NACH** dem Löschen der Demo-/Testkonten (das Demo-Spieler-Konto belegt `player_id='andreas-strehle'` und würde sonst den Unique-Index sprengen). Enthält Prüf-Queries; beide müssen 0 Zeilen liefern, bevor die Indizes greifen.
- [ ] **Migration `0035_news.sql` im SQL-Editor ausführen** + danach `npx tsx scripts/seed-news.mts` (übernimmt die bestehenden Meldungen als „veröffentlicht", idempotent). Erst dann verwaltet die Ligaleitung News unter **Admin → News** (Anlegen/Bearbeiten/Veröffentlichen/Archivieren/Löschen). Bis dahin bleibt der statische Bestand aus `lib/data/news.ts` sichtbar.
- [ ] Deploy-Kontrolle: nach jedem Push prüfen, dass Vercel den neuesten Commit als „Ready" baut (war schon mal nicht auto-deployt)

## Vor Go-live (offen)

- [~] Eindeutigkeits-/Dubletten-Regeln: **Migration `0034` geschrieben** — `profiles.player_id` unique (1 Spielerprofil = 1 Konto) + `team_registrations (season_id, source_team_id)` unique bei `status='approved'` (jedes bestehende Team nur 1× pro Saison freigegeben). Namensgleichheit NEUER Teams bleibt bewusst app-seitige Admin-Markierung (kein harter Constraint). Admin-PATCH gibt bei Verstoß eine verständliche Meldung. **Offen: Migration im SQL-Editor ausführen** (nach dem Test-/Demo-Cleanup, siehe „Wichtig / abhängig").
- [ ] Alle Testuser + Demo-Video-Daten löschen (sauberer Start): `node scripts/cleanup-test-data.mjs` (löscht `julia.andi@web.de` + `strehleandi@gmail.com`) und `node scripts/cleanup-demo-video.mjs` (löscht `demo.kapitaen@`/`demo.spieler@` + „DC Demo München"). Das Streukonto `demo@example.com` ist in keinem Skript — separat über die Benutzerverwaltung („Löschen") entfernen. Skripte brauchen `.env.local` (Service-Role) → lokal ausführen, nicht in Cloud-/Handy-Sessions.
- [ ] **Rechtliches:** Anschrift/Vertretung eingetragen; Rechtsform „nicht eingetragener Verein" ergänzt. Interne **DSB- + anwaltliche Tiefenprüfung** der drei Rechtstexte durchgeführt (AGB-feste Haftung, Änderungsklausel, Minderjährige, Aufsichtsbehörde, Art. 22, zweiter Kontaktweg). **Externe anwaltliche Freigabe** weiterhin empfohlen → danach Hinweis-Banner aus `LegalPage` entfernen. Außerdem offen: AVV mit Vercel/Supabase/Resend/Cloudflare/Anthropic abschließen.

### Domain-Umzug auf www.mdudarts.de (Checkliste Livegang)
Code-seitig erledigt: robots.txt, sitemap.xml und Canonical nutzen `www.mdudarts.de` (Fallback);
per `NEXT_PUBLIC_SITE_URL` überschreibbar. **Stand 30.06.2026: Domain technisch live (`www` HTTP 200, Apex 308 → www), aber `noindex` bis Go-live.**

- [x] **Vercel → Domains:** `www.mdudarts.de` (primär, Production) + `mdudarts.de` (308 → www) hinzugefügt
- [x] **DNS (Cloudflare):** `www` CNAME → `cname.vercel-dns.com`, Apex A → `76.76.21.21`, beide „DNS only" (grau); alte Strato-A/AAAA ersetzt/gelöscht; MX/Resend unangetastet
- [ ] **Vercel-ENV:** `NEXT_PUBLIC_SITE_URL=https://www.mdudarts.de` (Production) setzen, dann redeployen
- [ ] **⚠️ Supabase → Auth → URL Configuration:** Site URL = `https://www.mdudarts.de`, Redirect URLs um `https://www.mdudarts.de/**` ergänzen (sonst zeigen Bestätigungs-/Reset-Mail-Links auf die alte Domain)
- [ ] **Scharf schalten:** `SITE_INDEXABLE=true` in `lib/site-config.ts` (entfernt noindex + robots-`Disallow: /`), committen, deployen
- [ ] Optional: Cloudflare-Proxy für `www`/Apex wieder „orange" — nur zusammen mit SSL/TLS-Modus „Full"
- [x] `mdu-three.vercel.app` bleibt während des Umzugs erreichbar (Testen ohne Domain)

## Bekannte To-dos

- [ ] Datei-Uploads (Team-Logo / Mannschaftsbild) via Supabase Storage (aktuell URL-Felder)
- [ ] Übernahme freigegebener Anmeldungen in offizielle Team-/Saisondaten (RPC `apply_team_registration` vorhanden; Roster-Übernahme weiter ausbauen)
- [ ] Bestätigte Spieler-Nachmeldungen automatisch in den Saison-Kader übernehmen
- [ ] Strukturierte Spielbericht-Highlights (180er/171/High Finish/Short Leg) in die Spielerstatistik aggregieren und in Profilen anzeigen
- [ ] Teamname in `team_linked`/`role_changed`-Notifications (serverseitig im Trigger nicht auflösbar — Teamnamen liegen in lib/data; ggf. clientseitig nachziehen)
- [ ] Optionale User-Eingangsmail bei Registrierung bewusst ausgelassen (Supabase verschickt bereits Verifizierungs-Mail)
- [ ] Idee (offen): Dartboard-Hintergrund (wie auf den öffentlichen Seiten via `PageBanner`/`.mdu-pb-board-page`) auch im „Mein Bereich" einbauen — evtl. mit einem **anderen Motiv** als `mdu-hero-dartboard-2.webp`. Nur angedacht, noch nicht beauftragt.
- [ ] **Spieler-Startseite personalisieren (User-Wunsch Tim Weber; + Android-Nutzertest UT-20):** Für eingeloggte Spieler oben auf der Startseite eine personalisierte Zeile „Meine Mannschaft" und/oder „Meine Liga" mit Direktlinks anzeigen — sichtbarer Mehrwert des eigenen Bereichs direkt beim Einstieg. Der Android-Nutzertest (UT-20) wünscht darüber hinaus im Blick zu haben: meine Spiele, persönliche Statistiken, offene Aufgaben, Benachrichtigungen (vieles davon existiert bereits als Kachel in „Mein Bereich" — hier geht es um Sichtbarkeit/Zusammenführung). Nur für verknüpfte Spieler; für noch nicht zugeordnete ggf. dezenter Hinweis. **Design (Ort/Prominenz) vor Umsetzung mit Betreiber klären.**
- [ ] Idee (nur evtl.): **Demo-Tour „fortsetzen"** — bei Unterbrechung den Schritt merken und unten einen „Demo fortsetzen"-Button zeigen, der an derselben Stelle weitermacht (statt neu zu starten). User-Wunsch (Tim Weber); vom Betreiber als „ganz vielleicht" eingestuft.

## Spielerstatistik an Dartlogik anpassen ✅ (Zwischensprint, Juni 2026)

Priorität: Hoch — fachliche Korrektheit

- [x] Unentschieden bei Spielerstatistiken entfernen (Spieler spielen Einzelspiele: 2:0 / 2:1 / 1:2 / 0:2)
- [x] Siege/Niederlagen durch Gewonnen/Verloren bei Einzelspielen ersetzen
- [x] Offizielle Spalte „Sp." als Einzelspiel-Bilanz verwenden (z. B. 30:2)
- [x] Offizielle Spalte „Legs" als Leg-Bilanz importieren und anzeigen (z. B. 62:14)
- [ ] Langfristig: 2:0 / 2:1 / 1:2 / 0:2-Splits ergänzen (Premium-Statistik —
      Datenfelder `wins20/wins21/losses12/losses02` sind vorbereitet, Werte
      werden NICHT erfunden; Anzeige erst, wenn echte Daten vorliegen)

Hinweis: Team-Statistiken behalten ihr Unentschieden — Mannschaftsspiele
(18 Einzelspiele) können 9:9 ausgehen. Diese Änderung betrifft nur Spieler.

## Offene Themen (aus früheren Sprints)

- [x] Supabase produktiv geschaltet (Projekt live, ENV gesetzt, Auth aktiv) (Sprint 5.2)
- [ ] Mein Bereich: restliche Coming-Soon-Kacheln umsetzen (v. a. Profilbild —
      hängt an Supabase Storage; Mannschaftsanmeldung/News-Pflege erledigt)
- [ ] Spitznamen-Speicherung im Profil an Supabase anbinden
- [~] Darts-Spezialwerte (180er, 171er, High Finishes, Short Legs) — werden im
      Online-Spielbericht jetzt strukturiert erfasst (Migration 0021); Aggregation
      in die Spielerstatistik/Profile steht noch aus (siehe „Bekannte To-dos")
- [ ] Formkurve / letzte Einzelergebnisse — Felder vorbereitet (W/L, kein
      Unentschieden), Datenquelle fehlt noch
