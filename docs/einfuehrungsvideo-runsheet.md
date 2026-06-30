# Aufnahme-Runsheet – MDU Einführungsvideo

Begleitblatt zum [Konzept](einfuehrungsvideo-konzept.md). Zum Mitlesen während der Bildschirmaufnahme.
**Reihenfolge: erst die komplette öffentliche Tour, dann der Login-Bereich.** Keine Ligaleitungs-/Admin-Funktionen.

---

## Vorbereitung (einmalig, vor der Aufnahme)

1. **Demo-Daten anlegen** (Repo-Root):
   ```
   node scripts/seed-demo-video.mjs
   ```
   Legt an: Demo-Kapitän, 4 ungelesene Benachrichtigungen, 1 eingereichte Demo-Anmeldung „DC Demo München".
2. **Demo-Logins** (für die Login-Szenen) – *angelegt & verifiziert*, Passwort jeweils `MduDemo2026!`:
   - **Demo-Spieler:** `demo.spieler@example.com` · Rolle Spieler · Profil **Andreas Strehle** (mit Foto) · Glocke **3**
   - **Demo-Kapitän:** `demo.kapitaen@example.com` · Rolle Teamkapitän @ **Freibad Bazis** · Glocke **5** · „Meine Anmeldungen" → **„DC Demo München – eingereicht"**
3. **Browser:** 1920×1080, Vollbild (F11), Zoom 100 %, keine Lesezeichenleiste, keine DevTools.
4. **OCR-Szene separat** auf `localhost:3000` aufnehmen (mit `OCR_PROVIDER=stub` in `.env.local`) –
   Stub liefert feste Demo-Daten, jedes beliebige Foto genügt. Auf `www.mdudarts.de` **nicht** auf Stub umstellen.
5. Nach der Aufnahme **aufräumen**:
   ```
   node scripts/cleanup-demo-video.mjs
   ```

---

## TEIL 1 – Öffentliche Tour (ohne Login)

> Aufnahme auf `https://www.mdudarts.de`.

| # | Aktion | Worauf achten |
|---|---|---|
| 1 | `/` öffnen, langsam scrollen: Hero → „Nächste Spiele" → „Letzte Spiele" | ruhige Maus, kurze Pausen |
| 2 | **Theme-Switch** im Header 1× klicken (New Design → Old School), 2 Sek., zurück | der „Wow"-Moment |
| 3 | Header **„Ligen"** → eine **A-Liga-Staffel** öffnen | Tabelle mit Auf-/Abstiegs-/Playoff-Markierungen + Legende |
| 4 | In der Liga den Tab/Bereich **Einzelrangliste** zeigen | kurz scrollen |
| 5 | Header **„Teams"** → ein vollständiges Team öffnen (Vorschlag: **Freibad Bazis**) | Logo, Kader, Spielstätte, Ergebnisse, Teamstatistik |
| 6 | Direkt ein **Spielerprofil** öffnen (Vorschlag: ein Spieler **mit Foto**) | Foto, Spitzname, Platz, Punkte, Leg-/Spiele-Bilanz |
|   | ⚠️ **Formkurve nur zeigen, wenn gefüllt**; **180er/High Finishes nur, wenn Werte vorhanden** – sonst überspringen |  |

---

## TEIL 1b – Registrierung (kurz zeigen, NICHT absenden)

| # | Aktion | Worauf achten |
|---|---|---|
| R | `/registrieren` → Formular mit **Dummy-Daten** (Max Mustermann, `max@example.com`) zeigen; Auswahl **Spieler/Teamkapitän** + **Pflicht-Häkchen** (Datenschutz/Nutzungsbedingungen) | **NICHT absenden** (sonst echtes Konto + Bestätigungsmail); kein echter Name/Passwort |

---

## TEIL 2a – Login als Demo-SPIELER (die Sicht der meisten Nutzer)

> Login: `demo.spieler@example.com` / `MduDemo2026!` · Rolle **Spieler**, verknüpftes Profil **Andreas Strehle** (mit Foto)

| # | Aktion | Worauf achten |
|---|---|---|
| 7 | `/login` → als **Demo-Spieler** anmelden | **Passwort-Tippen nicht filmen** |
| 8 | `/mein-bereich` – **Spieler-Kacheln** zeigen | Mein Profil, **Meine Statistik**, Mein Team, Meine Liga (bewusst **weniger** Kacheln als Kapitän) |
| 9 | **Glocke** → roten Badge **(3)** → Dropdown | unverfängliche Demo-Meldungen |
| 10 | Kachel **„Meine Statistik"** → eigenes Spielerprofil | Foto, Spitzname, Platz, Punkte, Leg-/Spiele-Bilanz |
|    | Danach **abmelden** für den Kapitäns-Take | ⚠️ Formkurve/180er nur, wenn gefüllt |

---

## TEIL 2b – Login als Demo-KAPITÄN (Zusatzfunktionen je Rolle)

> Login: `demo.kapitaen@example.com` / `MduDemo2026!` · Rolle **Teamkapitän @ Freibad Bazis**

| # | Aktion | Worauf achten |
|---|---|---|
| 11 | `/login` → als **Demo-Kapitän** anmelden | direkt zeigen: **mehr Kacheln** als beim Spieler |
| 12 | `/mein-bereich` – zusätzliche Kacheln | zusätzlich **Mannschaft anmelden, Meine Anmeldungen, Spielbericht erfassen** |
| 13 | **Glocke** → roten Badge **(5)** → Dropdown | 5 Demo-Meldungen |
| 14 | Kachel **„Mannschaft anmelden"** → Formular durchscrollen | Ligawunsch (La/A/B/C), Spielstätte, Logo, Kader – **NICHT absenden** |
| 15 | Kachel **„Meine Anmeldungen"** → „DC Demo München – eingereicht" | Rückmeldungs-Status |
| 16 | Kachel **„Spielbericht erfassen"** → einen Bericht **ansehen** | 18 Spiele, 2 Doppel, Auto-Wertung, Einzelranglistenpunkte |
| 17 | Header **„Downloads"** → PDF-Spielbericht öffnen | 2-seitige A4-Vorlage |

---

## TEIL 3 – OCR (separater Mobile-Take auf localhost, Stub)

| # | Aktion | Worauf achten |
|---|---|---|
| 18 | `/mein-bereich/spielberichte/ocr` → Foto/Datei hochladen | Smartphone-Optik / Hochformat |
| 19 | Verarbeitung → **Prüfansicht**: erkannte Felder, unsichere markiert, 1 Korrektur → **Bestätigen** | „Geprüft wird immer selbst" |

---

## Mobile-Inserts (Kern-Highlight – bewusst mehrfach zeigen)

> Kurze Hochformat-Clips (echtes Gerät oder Responsive-Modus 1080×1920), später als Phone-Mockup einbauen.
> Mobile Nutzbarkeit ist eines der größten Plus der Seite – nicht nur bei OCR zeigen.

- **Startseite mobil** – scrollen + **mobile Bottom-Navigation** antippen
- **Mein Bereich mobil** – Kacheln + Glocke (5 Meldungen)
- **Spielbericht mobil** – durch die Erfassung scrollen
- **OCR mobil** – Kamera-Upload (siehe Teil 3)
- ggf. **Liga-Tabelle mobil** – kompakte Darstellung (Kürzel) ohne Querscrollen

## Finaler Sprechertext (in Aufnahme-Reihenfolge, ~1:45–2:00)

> Eine durchgehende Stimme für Avatar **und** Voice-over. In HeyGen einfügen; Pausen an die Clips anpassen.

- **Avatar-Intro:** „Servus und herzlich willkommen bei der neuen Plattform der Münchner Dart Union – modern, übersichtlich und komplett aufs Smartphone ausgelegt."
- **Startseite:** „Auf der Startseite findest du alle Infos zum Spielbetrieb auf einen Blick – News, die nächsten und die letzten Spiele. Und mit einem Klick wechselst du zwischen modernem und klassischem Design."
- **Ligen:** „Für jede Liga – und jede Playoff-Runde – gibt es aktuelle Tabellen, Spielpläne, Ergebnisse und Einzelranglisten. Die Farben zeigen sofort, wer auf Aufstiegskurs ist."
- **Team:** „Jede Mannschaft hat ein eigenes Profil – mit Kader, Spielstätte, Ergebnissen und Statistiken."
- **Spieler:** „Und jeder Spieler ein eigenes – mit Foto, Platzierung und den wichtigsten Saisonwerten."
- **Registrierung:** „Neu dabei? Die Registrierung geht in wenigen Schritten – als Spieler oder als Teamkapitän."
- **Login Spieler:** „Nach dem Login sieht jeder genau das, was zu seiner Rolle passt – Profil, Statistik, Team und Liga, mit eigenem Benachrichtigungscenter."
- **Login Kapitän:** „Ein Teamkapitän hat zusätzlich die komplette Mannschaftsverwaltung."
- **Mannschaft anmelden:** „Die Mannschaft meldet man komplett online an – mit Wunschliga, Spielstätte, Logo und Kader, egal ob bestehendes oder ganz neues Team. Den Status sieht man jederzeit im eigenen Bereich."
- **Spielbericht:** „Der Spielbericht wird digital erfasst – 18 Spiele mit zwei Doppeln. Ergebnisse und Ranglistenpunkte berechnet das System automatisch."
- **PDF:** „Wer lieber auf Papier arbeitet, lädt den offiziellen Spielbericht einfach herunter."
- **OCR:** „Oder fotografiert den ausgefüllten Bogen mit dem Handy – die Erkennung überträgt die Daten, geprüft und bestätigt wird aber immer von dir."
- **Avatar-Outro:** „Das war die neue MDU-Plattform. Schau vorbei auf mdudarts.de und probier's aus. Gut Pfeil!"

## Abschluss
- Zurück zu `/` für die Avatar-Outro-Überblendung.
- **Datenschutz-Sichtung** (siehe Konzept Abschnitt 10) vor dem Teilen.
- `node scripts/cleanup-demo-video.mjs` ausführen.

> Sprechertext + Einblendungen je Szene: siehe Konzept Abschnitte 4–5 und 12.
