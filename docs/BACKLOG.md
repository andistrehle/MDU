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
- [ ] **Migration `0027_media_team_policies.sql` im SQL-Editor ausführen** (Storage-Policies für Teamlogo/Mannschaftsbild; nötig, damit Kapitäne in den `teams/`-Pfad hochladen dürfen)
- [ ] Deploy-Kontrolle: nach jedem Push prüfen, dass Vercel den neuesten Commit als „Ready" baut (war schon mal nicht auto-deployt)

## Vor Go-live (offen)

- [ ] Eindeutigkeits-/Dubletten-Regeln: 1 Spielerprofil = 1 Konto (DB-Constraint), jedes Team nur 1× pro Saison freigegeben; Namensgleichheit nur zur Admin-Prüfung markieren, nicht hart blockieren
- [ ] Alle Testuser löschen (sauberer Start), u. a. julia.andi@web.de
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
