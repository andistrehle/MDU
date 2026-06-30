# Einführungsvideo – Konzept, Storyboard & Produktionsplan

**Münchner Dart Union (MDU) – Plattform-Vorstellung**
Stand: 30. Juni 2026 · Status: **Konzept** (noch keine Produktion, keine Website-Änderungen)

> Dieses Dokument ist die vollständige Vorlage, um das Video später mit **HeyGen**
> (oder einem vergleichbaren Avatar-/Videotool) zu produzieren. Es beschreibt
> ausschließlich **tatsächlich umgesetzte** Funktionen der aktuellen Plattform.
> Unfertige Bereiche sind als ⚠️ markiert und werden im Video **nicht prominent**
> gezeigt.

---

## 0. Faktenbasis – was die Plattform HEUTE wirklich kann

Geprüft anhand der vorhandenen Routen (`app/**/page.tsx`) und Komponenten.

### Öffentlich (ohne Login)
| Bereich | Route | Status |
|---|---|---|
| Startseite (Hero, News, Nächste/Letzte Spiele, Quick-Bar) | `/` | ✅ stabil |
| **Theme-Umschalter „Old School" (hell/grün) ↔ „New Design" (dunkel/rot)** | global im Header / `/mehr` | ✅ stabil, sehr vorzeigbar |
| Ligen-Übersicht + Liga-Detail (Tabelle, Spielplan, Ergebnisse, **Einzelrangliste**, Playoffs) | `/ligen`, `/ligen/[code]` | ✅ stabil |
| Auf-/Abstiegs- & Playoff-Markierungen inkl. Legende + Erklärtext | in Liga-Tabellen | ✅ stabil |
| Spielplan (nach Spieltag sortiert) | `/spielplan` | ✅ stabil |
| Ergebnisse | `/ergebnisse` | ✅ stabil |
| Tabellen (Gesamtübersicht) | `/tabellen` | ✅ stabil |
| Teams-Übersicht + Teamprofil (Kader, Kapitän, Spielstätte, kommende Spiele, Ergebnisse, Teamstatistik, Logo + Mannschaftsbild) | `/teams`, `/teams/[id]` | ✅ stabil |
| Spielerprofil (Foto, Spitzname, Mannschaft, Platz, Punkte, Leg-Bilanz, Spiele-Bilanz) | `/spieler/[playerId]` | ✅ stabil |
| Spielstätten (Adresse → Maps, Lokal-Telefon) | `/spielstaetten` | ✅ stabil |
| Downloads (PDF-Spielbericht + druckbare Vorlage + Spielbedingungen) | `/downloads`, `/spielberichte/vorlage` | ✅ stabil |
| Rechtstexte (Impressum, Datenschutz, Nutzungsbedingungen, Spielbedingungen, Kontakt mit Formular) | `/impressum` u. a. | ✅ stabil |

### Eingeloggt (rollenabhängig)
| Bereich | Route | Status |
|---|---|---|
| Login / Registrierung / Passwort | `/login`, `/registrieren`, `/passwort-*` | ✅ stabil |
| **Mein Bereich** (Kachel-Dashboard, rollenabhängig) | `/mein-bereich` | ✅ stabil |
| Kacheln: Mein Profil · Meine Statistik · Mein Team · Meine Liga · Mannschaft anmelden · Meine Anmeldungen · Spielbericht erfassen · Spielberichte ansehen | unter `/mein-bereich/*`, `/mein-team/*`, `/mein-profil` | ✅ stabil |
| **Benachrichtigungsglocke + roter Badge + Dropdown** | Header (eingeloggt) | ✅ stabil |
| **Mannschaftsanmeldung** (Ligawunsch La/A/B/C, Daten, Spielstätte, Logo, Kader, Kapitän, Absenden, Status) | `/mein-bereich/mannschaft-anmelden`, `/mein-bereich/anmeldungen` | ✅ stabil |
| **Digitaler Spielbericht** (18 Spiele inkl. 2 Doppel, Auto-Kapitän, Auto-Wertung, Einzelranglistenpunkte, Auswechslungen) | `/mein-bereich/spielberichte` | ✅ stabil |
| **OCR-Upload Papierbogen** (Foto/PDF, Kamera mobil, Erkennung, Prüfansicht, Korrektur, Bestätigung) | `/mein-bereich/spielberichte/ocr`, `.../pruefen` | ✅ funktionsfähig, **aber neu** – nur mit vorbereitetem Testbild zeigen (s. ⚠️) |
| **Admin/Ligaleitung**: Teams freigeben, Benutzer, Saisonanmeldungen prüfen, Spielberichte, Nachmeldungen, News | `/admin/*` | ✅ stabil (nur Prüf-/Freigabe-Workflows zeigen) |

### ⚠️ Unfertig / instabil / NICHT prominent zeigen
- **Systemeinstellungen** (`/mein-bereich` Kachel „Systemeinstellungen") → `ready: false`, Label „folgt". **Nicht zeigen.**
- **Admin → Sicherheit / Einstellungen / Import** (`/admin/security`, `/admin/settings`, `/admin/import`) → technisch/sensibel. **Nicht zeigen.**
- **Spielerprofil → „Formkurve"** zeigt häufig „Noch keine Formdaten verfügbar" → nur zeigen, wenn beim Demo-Spieler echte Form vorliegt, sonst **überspringen**.
- **Spielerprofil → Spezialwerte „180er / High Finishes / Short Legs"**: Kacheln sind umgesetzt, aber die **Aggregation aus Spielberichten in die Spielerstatistik ist noch nicht abgeschlossen**. Werte stammen aktuell aus dem dartunion-Import und können „–" sein. → Nur an einem Spieler mit gefüllten Werten zeigen, **nicht** als Kernversprechen framen.
- **OCR-Folgepunkte** (Inline-Korrektur in der Prüfansicht, HEIC-Konvertierung) noch offen → im Video nur den **bestätigten Kernablauf** zeigen.
- **Hinweis-Banner** auf den Rechtstexten („wird vor Livegang rechtlich geprüft") → im Video nicht heranzoomen.
- **Ligaleitungs-/Admin-Funktionen werden im Video bewusst NICHT gezeigt** (interne Prüf-/Freigabe-Bereiche – „geht die Öffentlichkeit nichts an", Entscheidung des Betreibers). Im Sprechertext darf die Freigabe durch die Ligaleitung erwähnt werden, aber **kein Admin-Bildschirm**.

### Wichtiger technischer Hinweis für die Aufnahme
Die Plattform nutzt **eine gemeinsame Supabase-Produktivdatenbank** (lokal + live). Schreibaktionen
(Anmeldung absenden, Spielbericht speichern, OCR-Upload) landen in **echten** Produktivdaten. Für die
Aufnahme deshalb **vorbereitete Aktionen nur ansehen / bis kurz vor dem Absenden zeigen** oder mit
gesonderten Testkonten arbeiten und danach aufräumen (siehe Demo-Daten + Demo-Modus-Bewertung).

---

## 1. Ziel und Zielgruppen

**Ziel:** Die neue MDU-Plattform verständlich, modern und kompakt vorstellen; zeigen, dass der
Spielbetrieb für alle Beteiligten einfacher und digital wird – ohne etwas zu versprechen, das es
noch nicht gibt.

**Zielgruppen & Kernnutzen:**
- **Spieler** – eigenes Profil, Statistik, alle Infos mobil auf einen Blick
- **Teamkapitäne** – Team online anmelden, Spielbericht digital, Papierbogen per OCR
- **Ligaleitung** – zentrale Prüf-/Freigabe-Workflows, weniger Verwaltung
- **Mannschaften** – eigenes Teamprofil mit Kader, Spielstätte, Statistik
- **Interessierte Besucher** – Tabellen, Spielpläne, Ergebnisse ohne Login
- **Administratoren** – Benutzer-/Saisonverwaltung, Benachrichtigungen

**Kernbotschaften (max. 7):**
1. Modern und **mobil** nutzbar
2. Alles zum Spielbetrieb **schnell erreichbar**
3. **Eigene Profile** für Spieler und Teams
4. Eingeloggt: **rollenabhängige** Zusatzfunktionen
5. **Mannschaftsanmeldung online**
6. **Spielbericht digital** – Ergebnisse & Punkte automatisch
7. **Papierbogen per OCR** – immer mit menschlicher Prüfung

---

## 2. Empfehlung zur Videolänge

| Variante | Länge | Zweck |
|---|---|---|
| **A – Kurz** | ~90 Sek. | Social Media, WhatsApp, Startseite-Teaser |
| **B – Voll** | ~3:30–4:00 Min. | Website, Vereinspräsentation, Onboarding |

**Empfehlung:** **Vollversion (B) als Master produzieren**, Kurzversion (A) als trimmed Cut daraus
ableiten (gleiche Avatar-/Voice-Assets, kürzerer Bildschirmpfad). Beide teilen Intro/Outro-Avatar.

---

## 3. Kurzversion (Variante A, ~90 Sek.) – Storyboard

> Avatar nur Intro/Outro im Vollbild, dazwischen **Voice-over aus dem Off** + Avatar klein unten rechts.

| # | Zeit | Bild / Route | Aktion | Avatar | Voice-over | Einblendung |
|---|---|---|---|---|---|---|
| A1 | 0:00–0:12 | Avatar, MDU-gebrandeter Hintergrund | – | **Vollbild** | „Willkommen bei der neuen Plattform der Münchner Dart Union – der digitale Treffpunkt für unseren Spielbetrieb." | MDU-Logo |
| A2 | 0:12–0:26 | `/` Startseite | langsam scrollen über Hero → Nächste/Letzte Spiele; **Theme-Switch 1×** | klein u. r. | „Alle Infos zum Spielbetrieb auf einen Blick – und in zwei Designs: klassisch oder modern." | „Modern & mobil" |
| A3 | 0:26–0:40 | `/ligen/[code]` | Liga öffnen → Tabelle mit Markierungen → kurz Einzelrangliste | klein | „Für jede Liga: Tabellen, Spielpläne, Ergebnisse und Einzelranglisten." | „Alle Ligen auf einen Blick" |
| A4 | 0:40–0:52 | `/teams/[id]` → `/spieler/[id]` | Teamprofil (Kader) → ein Spielerprofil | klein | „Jedes Team und jeder Spieler hat ein eigenes Profil." | „Teams & Spieler" |
| A5 | 0:52–1:05 | `/mein-bereich` | Login bereits aktiv → Dashboard, **Glocke mit Badge** kurz öffnen | klein | „Nach dem Login gibt es passende Funktionen je Rolle – mit persönlichem Benachrichtigungscenter." | „Persönlicher Bereich" |
| A6 | 1:05–1:20 | `/mein-bereich/mannschaft-anmelden` → `/mein-bereich/spielberichte` | Anmeldeformular kurz zeigen (nicht absenden) → digitalen Spielbericht kurz zeigen | klein | „Mannschaft online anmelden, Spielbericht digital erfassen – Ergebnisse rechnet das System automatisch." | „Online anmelden · Digital erfassen" |
| A7 | 1:20–1:30 | `/mein-bereich/spielberichte/ocr` | Upload-Screen + Prüfansicht (vorbereitet) kurz | klein | „Oder den Papierbogen einfach fotografieren – die Erkennung überträgt die Daten, geprüft wird immer selbst." | „Papierbogen per OCR" |
| A8 | 1:30–1:40 | Avatar | – | **Vollbild** | „Schau vorbei auf mdudarts.de – und probier's aus. Gut Pfeil!" | „mdudarts.de" |

---

## 4. Vollversion (Variante B, ~3:30–4:00) – Storyboard

> Detaillierte Szenen mit genauer Route, Klicks, Avatarposition, Voice-over, Einblendungen, Demo-Daten,
> Übergang. Avatar: Intro/Outro Vollbild; dazwischen Voice-over + Avatar klein unten rechts, bei
> Kapitelwechseln 1–2 Sek. größer einblenden.

### Szene 1 – Avatar-Intro
- **Dauer:** 0:00–0:15
- **Bild:** Avatar vor MDU-gebrandetem Hintergrund (Logo, dezenter Dartboard-Hintergrund)
- **Avatar:** Vollbild, zentral
- **Voice-over (Avatar):** „Servus und herzlich willkommen! Ich zeige dir in wenigen Minuten die neue Online-Plattform der Münchner Dart Union – modern, übersichtlich und komplett aufs Smartphone und den Desktop ausgelegt."
- **Einblendung:** MDU-Wortmarke, „Die neue Plattform"
- **Demo-Daten:** keine
- **Übergang:** weiche Überblendung in die Startseite

### Szene 2 – Startseite
- **Dauer:** 0:15–0:42
- **Route:** `/`
- **Klicks/Scroll:** langsamer Scroll über Hero → Quick-Bar (Spielplan/Tabellen) → „Aktuelles" (News) → „Nächste Spiele" → „Letzte Spiele". Danach **Theme-Switch im Header 1× klicken** (Old School ↔ New Design) und zurück.
- **Avatar:** klein unten rechts
- **Voice-over:** „Auf der neuen Startseite finden Spieler und Mannschaften alle wichtigen Informationen zum aktuellen Spielbetrieb auf einen Blick – aktuelle News, die nächsten Begegnungen und die letzten Ergebnisse. Und wer es lieber klassisch mag: Mit einem Klick wechselst du zwischen dem modernen Design und der vertrauten Old-School-Ansicht."
- **Einblendung:** „Alles auf einen Blick" → beim Switch: „Zwei Designs – ein Klick"
- **Demo-Daten:** echte öffentliche Daten genügen (News, Spiele)
- **Übergang:** Klick auf „Ligen" im Header

### Szene 3 – Ligen & Playoffs
- **Dauer:** 0:42–1:08
- **Route:** `/ligen` → `/ligen/[code]` (eine Liga mit Playoff-Markierungen, z. B. A-Liga-Staffel)
- **Klicks/Scroll:** Ligen-Übersicht kurz → eine Liga öffnen → Tabelle mit **Auf-/Abstiegs-/Playoff-Markierungen + Legende** zeigen → kurz Spielplan/Ergebnisse-Tab → **Einzelrangliste** öffnen
- **Avatar:** klein
- **Voice-over:** „Für jede Liga stehen aktuelle Tabellen, Spielpläne, Ergebnisse und Einzelranglisten übersichtlich zur Verfügung. Farbliche Markierungen zeigen sofort, wer auf Aufstiegs-, Playoff- oder Abstiegskurs ist – mit einer kurzen Erklärung direkt an der Tabelle."
- **Einblendung:** „Tabellen · Spielplan · Einzelrangliste"
- **Demo-Daten:** echte Liga-Daten
- **Übergang:** Klick auf einen Teamnamen in der Tabelle

### Szene 4 – Teamprofile
- **Dauer:** 1:08–1:30
- **Route:** `/teams` (kurz) → `/teams/[id]` (Team mit **Logo + Mannschaftsbild + gepflegtem Kader**)
- **Klicks/Scroll:** Teams-Übersicht kurz anreißen → ein Teamprofil öffnen → scrollen über Mannschaftsbild/Logo, Kapitän, Spielstätte, Kader, kommende Spiele, Ergebnisse, Teamstatistik
- **Avatar:** klein
- **Voice-over:** „Jede Mannschaft erhält ein eigenes Profil – mit Kader, Teamkapitän, Spielstätte, den kommenden Spielen, Ergebnissen und aktuellen Teamstatistiken. Logo und Mannschaftsbild machen jedes Team unverwechselbar."
- **Einblendung:** „Jedes Team – ein Profil"
- **Demo-Daten:** ein Team mit gepflegtem Logo, Mannschaftsbild und Kader (vorbereiten!)
- **Übergang:** Klick auf einen Spieler im Kader

### Szene 5 – Spielerprofile
- **Dauer:** 1:30–1:52
- **Route:** `/spieler/[playerId]` (Spieler mit **Profilbild + Spitzname** und gefüllten Werten)
- **Klicks/Scroll:** Profil öffnen → Kopf (Foto, Spitzname, Mannschaft, Platz) → Statistik (Punkte, Spiele-Bilanz, Leg-Bilanz).
  ⚠️ **„Formkurve" nur zeigen, wenn gefüllt.** ⚠️ **Spezialwerte (180er/High Finishes/Short Legs) nur zeigen, wenn beim Demo-Spieler vorhanden** – sonst überspringen.
- **Avatar:** klein
- **Voice-over:** „Auch die Spieler bekommen ein eigenes Profil – mit Profilbild, Spitzname, Mannschaft und den wichtigsten Saisonwerten wie Platzierung, Einzelspiel-Bilanz und Leg-Bilanz."
- **Einblendung:** „Deine Saison – dein Profil"
- **Demo-Daten:** Spieler mit Foto, Spitzname, echten Bilanzwerten
- **Übergang:** Schnitt auf den Login-Screen

### Szene 6 – Login & Mein Bereich
- **Dauer:** 1:52–2:14
- **Route:** `/login` → `/mein-bereich`
- **Klicks/Scroll:** Login-Screen kurz (Eingabe **nicht** im Detail filmen) → „Anmelden" → Dashboard mit Kacheln: Mein Profil, Meine Statistik, Mein Team, Meine Liga, Mannschaft anmelden, Meine Anmeldungen, Spielbericht erfassen, Spielberichte ansehen
- **Avatar:** klein, bei Kapitelstart 1–2 Sek. größer
- **Voice-over:** „Nach dem Login steht jedem Nutzer genau das zur Verfügung, was zu seiner Rolle passt – das eigene Profil, die eigene Mannschaft, die eigene Liga und die persönliche Statistik. Alles an einem Ort."
- **Einblendung:** „Persönlicher Login-Bereich"
- **Demo-Daten:** **Demo-Teamkapitän** (zeigt die meisten Kacheln); keine echten sensiblen Daten
- **Übergang:** Blick nach oben rechts zur Glocke

### Szene 7 – Benachrichtigungen
- **Dauer:** 2:14–2:30
- **Route:** Header (eingeloggt), Glocken-Dropdown
- **Klicks/Scroll:** **roten Badge** zeigen → **Glocke klicken** → Dropdown mit Beispielmeldungen
- **Avatar:** klein
- **Voice-over:** „Neue Aufgaben und Rückmeldungen erscheinen direkt im persönlichen Benachrichtigungscenter – etwa wenn eine Mannschaftsanmeldung freigegeben wurde oder ein Spielbericht auf Prüfung wartet."
- **Einblendung:** „Immer informiert"
- **Demo-Daten:** vorbereitete, **unverfängliche** Beispielmeldungen (siehe Demo-Daten). Beispiele: „Mannschaftsanmeldung freigegeben", „Spielbericht wartet auf Prüfung", „Spielerprofil zugeordnet"
- **Übergang:** Klick auf Kachel „Mannschaft anmelden"

### Szene 8 – Mannschaftsanmeldung
- **Dauer:** 2:30–2:54
- **Route:** `/mein-bereich/mannschaft-anmelden` → `/mein-bereich/anmeldungen`
- **Klicks/Scroll:** Formular durchgehen: neue/bestehende Mannschaft → **Ligawunsch (La/A/B/C)** → Mannschaftsdaten, Spielstätte, Logo, Kader, Kapitän. **Nicht real absenden** – bis zum „Absenden"-Button zeigen. Danach kurz „Meine Anmeldungen" mit dem **Status** der vorbereiteten Demo-Anmeldung. **Keine Admin-/Ligaleitungssicht.**
- **Avatar:** klein
- **Voice-over:** „Teamkapitäne melden ihre Mannschaft komplett online für die neue Saison an – mit Ligawunsch, Spielstätte, Logo und Kader. Die Ligaleitung prüft die Angaben und meldet den Status direkt zurück – sichtbar im eigenen Bereich."
- **Einblendung:** „Mannschaft online anmelden"
- **Demo-Daten:** eine vorbereitete **eingereichte Demo-Anmeldung** des Demo-Kapitäns (Status sichtbar)
- **Übergang:** Klick auf Kachel „Spielbericht erfassen"

### Szene 9 – Digitaler Spielbericht
- **Dauer:** 2:56–3:16
- **Route:** `/mein-bereich/spielberichte`
- **Klicks/Scroll:** Begegnung auswählen → Aufstellungen (auto vorbefüllter Teamkapitän, heutiges Datum) → durch die 18 Spiele scrollen (Doppel in der Mitte und am Ende) → **Auto-Gesamtwertung** und **Einzelranglistenpunkte** hervorheben. Auswechslung kurz andeuten.
- **Avatar:** klein
- **Voice-over:** „Der digitale Spielbericht führt Schritt für Schritt durch die Begegnung – acht Einzel, ein Doppel, noch einmal acht Einzel und das Schlussdoppel. Ergebnisse und Einzelranglistenpunkte berechnet das System automatisch."
- **Einblendung:** „Spielbericht digital · automatisch gewertet"
- **Demo-Daten:** vorbereiteter (Test-)Spielbericht, nur **ansehen**
- **Übergang:** Klick auf „Downloads" im Header

### Szene 10 – PDF-Spielbericht
- **Dauer:** 3:16–3:26
- **Route:** `/downloads` → PDF / `/spielberichte/vorlage`
- **Klicks/Scroll:** Download-Eintrag „Offizieller MDU-Spielbericht" → PDF öffnen (2-seitige A4-Vorlage) kurz zeigen
- **Avatar:** klein
- **Voice-over:** „Wer lieber auf Papier arbeitet, lädt den offiziellen Spielbericht einfach herunter und druckt ihn aus."
- **Einblendung:** „Lieber Papier? Kein Problem."
- **Demo-Daten:** keine
- **Übergang:** Schnitt zur Smartphone-Sequenz (OCR)

### Szene 11 – OCR-Erkennung (mit Mobile-Insert)
- **Dauer:** 3:26–3:46
- **Route:** `/mein-bereich/spielberichte/ocr` → `.../[uploadId]/pruefen`
- **Klicks/Scroll:** **Smartphone-Mockup**: Kamera-/Datei-Upload des ausgefüllten Bogens → kurze Verarbeitung → **Prüfansicht**: erkannte Felder, **unsichere Felder markiert**, eine kleine Korrektur → „Bestätigen".
  ⚠️ **Mit vorbereitetem Testbild** (kein echter privater Bogen). Für stabile Aufnahme ggf. Stub-Provider (s. Aufnahme-Checkliste).
- **Avatar:** klein
- **Voice-over:** „Der ausgefüllte Papierbogen lässt sich auch einfach abfotografieren und hochladen. Die automatische Erkennung überträgt die Daten in den digitalen Spielbericht – geprüft und bestätigt wird aber immer von dir. Offizielle Ergebnisse übernimmt das System nie ungeprüft."
- **Einblendung:** „Papierbogen fotografieren → prüfen → fertig"
- **Demo-Daten:** vorbereitetes Testfoto eines ausgefüllten Vorlagen-Bogens (oder beliebiges Foto, da Stub feste Demo-Daten liefert)
- **Übergang:** zurück zur Startseite, weiche Überblendung zum Avatar

### Szene 12 – Avatar-Abschluss
- **Dauer:** 3:46–4:00 (Voll) / passend kürzen
- **Bild:** Avatar Vollbild, MDU-gebrandet
- **Avatar:** Vollbild
- **Voice-over (Avatar):** „Das war ein erster Überblick über die neue MDU-Plattform. Probier sie selbst aus – unter mdudarts.de. Bei Fragen erreichst du uns direkt über das Kontaktformular. Wir freuen uns auf dich. Gut Pfeil!"
- **Einblendung:** „mdudarts.de · Jetzt ausprobieren"
- **Übergang:** Abblende auf MDU-Logo

---

## 5. Vollständiger Sprechertext (zum Einsprechen / für HeyGen)

### 5a. Avatar-Texte (Einstieg & Abschluss)
**Intro:** „Servus und herzlich willkommen! Ich zeige dir in wenigen Minuten die neue Online-Plattform der Münchner Dart Union – modern, übersichtlich und komplett aufs Smartphone und den Desktop ausgelegt."

**Outro:** „Das war ein erster Überblick über die neue MDU-Plattform. Probier sie selbst aus – unter mdudarts.de. Bei Fragen erreichst du uns direkt über das Kontaktformular. Wir freuen uns auf dich. Gut Pfeil!"

### 5b. Voice-over Vollversion (am Stück, Szene 2–12)
> Reihenfolge wie im Storyboard; je Absatz = eine Szene.

1. „Auf der neuen Startseite finden Spieler und Mannschaften alle wichtigen Informationen zum aktuellen Spielbetrieb auf einen Blick – aktuelle News, die nächsten Begegnungen und die letzten Ergebnisse. Und wer es lieber klassisch mag: Mit einem Klick wechselst du zwischen dem modernen Design und der vertrauten Old-School-Ansicht."
2. „Für jede Liga stehen aktuelle Tabellen, Spielpläne, Ergebnisse und Einzelranglisten übersichtlich zur Verfügung. Farbliche Markierungen zeigen sofort, wer auf Aufstiegs-, Playoff- oder Abstiegskurs ist."
3. „Jede Mannschaft erhält ein eigenes Profil – mit Kader, Teamkapitän, Spielstätte, den kommenden Spielen, Ergebnissen und aktuellen Teamstatistiken."
4. „Auch die Spieler bekommen ein eigenes Profil – mit Profilbild, Spitzname, Mannschaft und den wichtigsten Saisonwerten wie Platzierung, Einzelspiel-Bilanz und Leg-Bilanz."
5. „Nach dem Login steht jedem Nutzer genau das zur Verfügung, was zu seiner Rolle passt – das eigene Profil, die eigene Mannschaft, die eigene Liga und die persönliche Statistik."
6. „Neue Aufgaben und Rückmeldungen erscheinen direkt im persönlichen Benachrichtigungscenter – etwa wenn eine Mannschaftsanmeldung freigegeben wurde oder ein Spielbericht auf Prüfung wartet."
7. „Teamkapitäne melden ihre Mannschaft komplett online für die neue Saison an – mit Ligawunsch, Spielstätte, Logo und Kader. Die Ligaleitung prüft die Angaben und meldet den Status direkt zurück."
8. „Der digitale Spielbericht führt Schritt für Schritt durch die Begegnung und berechnet Ergebnisse und Einzelranglistenpunkte automatisch."
9. „Wer lieber auf Papier arbeitet, lädt den offiziellen Spielbericht einfach herunter und druckt ihn aus."
10. „Der ausgefüllte Papierbogen lässt sich auch abfotografieren und hochladen. Die automatische Erkennung überträgt die Daten in den digitalen Spielbericht – geprüft und bestätigt wird aber immer von dir."

### 5c. Voice-over Kurzversion (am Stück)
„Willkommen bei der neuen Plattform der Münchner Dart Union – der digitale Treffpunkt für unseren Spielbetrieb. Alle Infos auf einen Blick, in modernem oder klassischem Design. Für jede Liga: Tabellen, Spielpläne, Ergebnisse und Einzelranglisten. Jedes Team und jeder Spieler hat ein eigenes Profil. Nach dem Login gibt es passende Funktionen je Rolle – mit persönlichem Benachrichtigungscenter. Mannschaften meldet man online an, Spielberichte erfasst man digital, und der Papierbogen lässt sich einfach fotografieren und per Erkennung übernehmen – geprüft wird immer selbst. Schau vorbei auf mdudarts.de und probier's aus. Gut Pfeil!"

---

## 6. Genaue Klickroute (für die Bildschirmaufnahme, Vollversion)

> Vorab eingeloggt als **Demo-Teamkapitän**. Aufnahme der öffentlichen + Login-Szenen auf
> `www.mdudarts.de` (professionelle Adresszeile); **nur die OCR-Szene** separat auf `localhost:3000`
> mit Stub-OCR. **Erst die komplette öffentliche Tour, dann der Login-Bereich.**

1. `/` öffnen → 4–5 Sek. Hero, langsam scrollen zu „Nächste/Letzte Spiele"
2. **Theme-Switch** im Header 1× klicken (New Design → Old School), 2 Sek., zurückschalten
3. Header → **„Ligen"** → `/ligen` (kurz) → eine Liga öffnen
4. Liga-Tabelle mit Markierungen zeigen → Tab **Einzelrangliste**
5. In der Tabelle auf einen **Teamnamen** klicken → `/teams/[id]`
6. Teamprofil scrollen (Mannschaftsbild, Kader, Spielstätte, Statistik)
7. Im Kader auf einen **Spieler** klicken → `/spieler/[id]` (Werte zeigen; Formkurve/Spezialwerte nur wenn gefüllt)
8. Header/Direktnavigation → `/login` → mit **Demo-Nutzer** anmelden
9. `/mein-bereich` → Kacheln zeigen
10. **Glocke** oben rechts klicken → Dropdown mit Beispielmeldungen
11. Kachel **„Mannschaft anmelden"** → Formular durchscrollen (Ligawunsch, Spielstätte, Logo, Kader) – **nicht absenden**
12. Zurück → Kachel **„Spielbericht erfassen"** → vorbereiteten Bericht ansehen (18 Spiele, Auto-Wertung)
13. Header → **„Downloads"** → PDF-Spielbericht öffnen
14. (Mobile-Take, separat auf localhost mit Stub-OCR) `/mein-bereich/spielberichte/ocr` → Upload + Prüfansicht
15. Zurück zu `/` → Übergang Avatar-Abschluss

**Regeln:** logischer Fluss, keine langen Ladezeiten, **keine Formulare real absenden**, Highlights statt
jeder Menüpunkt, möglichst in zusammenhängenden Takes (pro Kapitel ein Take erleichtert den Schnitt).

---

## 7. Szenen mit Zeitangaben (Übersicht)

**Kurz (A):** A1 0:00–0:12 · A2 0:12–0:26 · A3 0:26–0:40 · A4 0:40–0:52 · A5 0:52–1:05 · A6 1:05–1:20 · A7 1:20–1:30 · A8 1:30–1:40

**Voll (B):** S1 0:00–0:15 · S2 0:15–0:42 · S3 0:42–1:08 · S4 1:08–1:30 · S5 1:30–1:52 · S6 1:52–2:14 · S7 2:14–2:30 · S8 2:30–2:54 · S9 2:54–3:14 · S10 3:14–3:26 · S11 3:26–3:46 · S12 (Avatar-Abschluss) 3:46–4:00

---

## 8. Benötigte Demo-Daten (vor der Aufnahme anlegen)

> Ziel: alles vorzeigbar **ohne echte personenbezogene Daten** und **ohne** echte Produktivvorgänge zu verändern.

- **Demo-Spieler** – Name unverfänglich (z. B. „Max Demo"), **Profilbild** (lizenzfrei/eigenes), **Spitzname** freigegeben, mit gefüllter Einzel-/Leg-Bilanz; idealerweise ein Spieler mit vorhandenen 180er-/Finish-Werten für Szene 5.
- **Demo-Teamkapitän** – Konto mit Rolle `team_captain`, verknüpft mit einem vorhandenen, gut gefüllten Team (öffentliche Liga-Daten). *(Keine Demo-Ligaleitung nötig – Admin wird nicht gezeigt.)*
- **Benachrichtigungen** – 3–5 vorbereitete, unverfängliche Beispielmeldungen in der Glocke (z. B. „Mannschaftsanmeldung freigegeben", „Spielbericht wartet auf Prüfung", „Spielerprofil zugeordnet"). Roter Badge sichtbar.
- **Mannschaftsanmeldung** – eine **Entwurfs-Anmeldung** (nicht freigegeben), um Formular + Status zu zeigen.
- **Digitaler Spielbericht** – ein **vorbereiteter Test-Bericht** (vollständig befüllt) nur zum Ansehen.
- **OCR-Testbild** – ein **ausgefüllter Vorlagen-Bogen**, sauber abfotografiert (kein echter privater Bogen).

> Nach der Aufnahme: Demo-Anmeldungen/-Berichte/-Uploads wieder entfernen (wie schon früher per Service-Role-Skript). **Keine** Testkonten mit echten privaten E-Mail-Adressen verwenden.

---

## 9. Aufnahme-Checkliste „Vor der Aufnahme vorbereiten"

**Konten & Daten**
- [ ] Demo-Spieler, Demo-Teamkapitän, Demo-Ligaleitung angelegt (keine echten Daten)
- [ ] Demo-Team mit Logo/Mannschaftsbild/Kader/Spielstätte gepflegt
- [ ] 3–5 unverfängliche Benachrichtigungen + roter Badge vorbereitet
- [ ] Entwurfs-Mannschaftsanmeldung + Test-Spielbericht + OCR-Testbild bereit

**Browser & Bild**
- [ ] Auflösung **1920×1080**, Browser im **Vollbild** (F11), Zoom **100 %**
- [ ] **Keine** Lesezeichenleiste, **keine** privaten Tabs, neutrales Profil
- [ ] Mauszeiger ruhig; Klicks bewusst; vor jedem Klick kurz innehalten
- [ ] Cookie-/Login-Hinweise vorab schließen; keine offenen DevTools/Konsole

**Technik/Stabilität**
- [ ] Für OCR-Szene ggf. **Stub-Provider** (`OCR_PROVIDER=stub`) verwenden → reproduzierbare, kostenlose Erkennung; **kein** echtes Claude-Vision-Billing während Takes
- [ ] Keine Debug-Ausgaben/Test-Banner sichtbar
- [ ] Stabile Internetverbindung; vorab einmal alle Routen „warmklicken" (Next.js Compile)

**Mobile-Take (optional, für OCR/Responsive)**
- [ ] Hochformat **1080×1920**, echtes Gerät oder Responsive-Modus
- [ ] Saubere Statusleiste (Uhrzeit/Akku unkritisch), keine privaten Push-Banner

---

## 10. Datenschutz-Checkliste (vor Veröffentlichung prüfen)

Im Video dürfen **nicht** sichtbar sein:
- [ ] private **E-Mail-Adressen** (Login-Feld nicht heranzoomen; Demo-Adresse generisch)
- [ ] **Telefonnummern** (Kapitäns-/Spieler-Nummern, Spielstätten nur wenn ohnehin öffentlich)
- [ ] **Passwörter** (Passwortfeld nie im Klartext, Tippen nicht filmen)
- [ ] **API-Keys, Supabase-/Vercel-Secrets**, `.env`-Inhalte
- [ ] **echte private Spielbericht-Uploads** / fremde Fotos ohne Einwilligung
- [ ] **interne Nutzer-IDs**, Admin-Sicherheits-/Einstellungsseiten
- [ ] **personenbezogene Testdaten ohne Freigabe**
- [ ] reale Namen/Bilder Dritter ohne Zustimmung → nur Demo-Inhalte
- [ ] Adresszeile/Browser-Verlauf ohne sensible URLs

> Nach dem Schnitt **finale Sichtung** ausschließlich auf diese Punkte, bevor das Video geteilt wird.

---

## 11. HeyGen-Produktionsworkflow (praktisch)

1. **Sprechertext finalisieren** (Abschnitt 5) – Intro/Outro + Voice-over je Szene.
2. **Avatar + Stimme wählen** – freundlich, deutsch, nicht zu werblich; eine durchgehende Stimme für Avatar **und** Voice-over (Konsistenz).
3. **Avatar-Intro** (Szene 1) als eigener HeyGen-Clip rendern (Vollbild, MDU-Hintergrund).
4. **Voice-over** für die Bildschirmszenen in HeyGen/TTS erzeugen (Szene 2–12), als separate Audiospuren je Kapitel exportieren.
5. **Website mit Screen-Recorder aufnehmen** (z. B. OBS / integrierter Recorder) gemäß Klickroute (Abschnitt 6) – pro Kapitel ein Take.
6. **Bildschirmaufnahme zum Voice-over schneiden** – Tempo an den Text anpassen, Pausen kürzen.
7. **Avatar als kleine Ecke** (Picture-in-Picture) über die Bildschirmaufnahme legen (optional, dezent unten rechts).
8. **Texteinblendungen/Kapitel** ergänzen (Abschnitt 12), im MDU-Stil (rot/dunkel bzw. hell).
9. **Musik dezent** unterlegen (Abschnitt 13), Stimme bleibt klar vorn.
10. **Avatar-Abschluss** (Szene 13) anhängen.
11. **Untertitel** automatisch erzeugen, Korrektur lesen (Eigennamen: „Münchner Dart Union").
12. **Export Full HD (1080p)**; danach Datenschutz-Sichtung (Abschnitt 10).

> Keine kostenpflichtige API-Integration nötig – reiner Produktions-/Editier-Workflow im Tool.

---

## 12. Schnitt- & Einblendungsvorschläge

Kurze Text-Overlays (max. wenige Wörter, **nicht** gleichzeitig mit dichtem Voice-over):
- „Modern & mobil"
- „Zwei Designs – ein Klick"
- „Alle Ligen auf einen Blick"
- „Teams & Spieler mit eigenem Profil"
- „Persönlicher Login-Bereich"
- „Immer informiert" (Benachrichtigungen)
- „Mannschaft online anmelden"
- „Spielbericht digital erfassen"
- „Papierbogen per OCR übernehmen"
- „Weniger Verwaltungsaufwand"
- „mdudarts.de · Jetzt ausprobieren"

**Stil:** kurze Einblendzeit (1,5–2,5 Sek.), MDU-Farben, gleiche Schrift wie die Seite
(Saira Condensed für Headlines, Manrope für Text). Kapitel-Chips dezent oben/unten.

---

## 13. Musik & Sound

- **Dezente Hintergrundmusik**, modern/sportlich, ohne Gesang; Lautstärke deutlich unter der Stimme.
- **Stimme immer klar im Vordergrund** – Musik bei Voice-over automatisch absenken (Ducking).
- **Keine** lauten Effekte; optional **kurze, weiche Übergangssounds** an Kapitelwechseln.
- Nur **lizenzfreie** bzw. im Videotool freigegebene Musik (HeyGen-Bibliothek / eigene Lizenz).

---

## 14. Einschätzung: separater Demo-Modus (`/demo`)?

**Idee:** eigene Route mit fixen Demo-Daten, festen Beispiel-Benachrichtigungen, vorbereiteter
Anmeldung/Spielbericht, **ohne Schreibzugriffe** auf echte Produktivdaten.

| Kriterium | Bewertung |
|---|---|
| **Nutzen** | Hoch bei **wiederkehrenden** Videos / öffentlicher Self-Service-Demo; stabile, reproduzierbare Aufnahmen ohne Datenschutzrisiko |
| **Aufwand** | **Mittel–hoch**: eigene Daten-/Auth-Schicht oder Read-only-Guard, Seed-Daten, Demo-Login – berührt sensible Bereiche (Auth, RLS, Schreibpfade) |
| **Risiko** | Mittel: Eingriffe in Auth/Datenlayer können Bugs einschleppen; gemeinsame Prod-DB erhöht das Risiko |
| **Empfehlung** | **Für dieses eine Video NICHT bauen.** Mit **Demo-Konten + vorbereiteten Daten + Stub-OCR** ist der Bedarf abgedeckt (geringeres Risiko, schneller). |

**Optionaler, leichtgewichtiger Folgevorschlag (nur falls gewünscht, getrennt umzusetzen):**
- „Aufnahme-Helfer" statt Voll-Demo-Modus: (a) **Stub-OCR-Provider** (existiert bereits) für Takes nutzen;
  (b) ein kleines Seed-Skript für **feste Demo-Benachrichtigungen**; (c) optional ein **Read-only-Flag**,
  das in der Anmelde-/Spielbericht-Maske den finalen „Absenden"-Schreibzugriff abfängt.
  Aufwand gering–mittel; **erst nach ausdrücklicher Freigabe** umsetzen.

---

## 15. Offene Fragen & Risiken

- **Gemeinsame Produktiv-DB:** Schreibaktionen während der Aufnahme verändern echte Daten → strikt nur
  bis „Absenden" zeigen oder mit Demo-Konten + Aufräumen arbeiten.
- **OCR live vs. Stub:** Live-Erkennung kostet (Claude Vision) und variiert je Aufnahme → für stabile,
  reproduzierbare Takes **Stub-Provider** empfehlen; Ergebnis sieht identisch aus.
- **Spielerprofil-Highlights (180er etc.):** Aggregation aus Spielberichten noch nicht abgeschlossen →
  nur an Spielern mit vorhandenen Importwerten zeigen, **nicht** als Versprechen framen.
- **Formkurve:** häufig leer → Szene 5 ggf. ohne Formkurve schneiden.
- **Domain-Status:** `www.mdudarts.de` ist live, aber **noindex/pre-go-live**; Inhalte (Saison/News)
  evtl. noch nicht final → vor Aufnahme prüfen, dass Demo-Liga/Team „fertig" aussehen.
- **Rechtstext-Banner** („wird vor Livegang geprüft") nicht zeigen.
- **Mobile vs. Desktop:** echte Mobile-Aufnahme (OCR-Kamera) wirkt authentischer als reiner Responsive-Modus.
- **Stimme/Avatar-Auswahl:** dialektfrei-freundlich vs. leicht bairisch – vor Massenproduktion 1 Test-Clip abnehmen.

---

## 16. Klare Empfehlung für den besten Aufbau

1. **Vollversion (B, ~3:30–4:00) als Master** in der Reihenfolge des Storyboards (Abschnitt 4)
   produzieren; **Kurzversion (A, ~90 Sek.)** als trimmed Cut daraus ableiten.
2. **Avatar nur Intro/Outro im Vollbild**, dazwischen **Voice-over + Avatar klein** unten rechts –
   die Bildschirmaufnahme steht klar im Vordergrund.
3. **Aufnahme:** primär **Desktop 1920×1080** + **eine kurze echte Mobile-Sequenz** (OCR-Kamera /
   responsive Startseite), als Phone-Mockup eingebaut. **Keine** getrennten Voll-Videos.
4. **Demo-Konten + vorbereitete Daten + Stub-OCR** statt eigenem Demo-Modus.
5. **Reihenfolge:** erst die **komplette öffentliche Tour** (Startseite → Ligen → Teams → Spieler),
   **dann der Login-Bereich** (Mein Bereich → Benachrichtigungen → Mannschaftsanmeldung →
   Digitaler Spielbericht → PDF → OCR). **Keine Ligaleitungs-/Admin-Funktionen** im Video.
6. **Tonalität:** freundlich, nahbar, sportlich; keine Werbefloskeln; „Münchner Dart Union" immer
   ausgeschrieben; nichts versprechen, das (noch) nicht live ist.

---

*Dieses Konzept beschreibt ausschließlich vorhandene Funktionen. Vor der Produktion bitte die mit
⚠️ markierten Punkte gegenprüfen. Keine Website-Änderung und kein Demo-Modus werden ohne separate
Freigabe umgesetzt.*
