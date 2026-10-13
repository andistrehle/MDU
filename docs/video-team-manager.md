# Video-Clip 1 — „Team Manager“ (Drehbuch)

Stand 13.10.2026 · Länge ca. 75 s · Hochformat 1080×1920 (WhatsApp/Instagram) und
Querformat 1920×1080 (Beamer/YouTube) aus denselben Aufnahmen.
Sprecher: ElevenLabs (deutsche Männerstimme, ruhig, Du-Form). Untertitel eingebrannt
(viele schauen ohne Ton). Musik leise, ohne Gesang.

Bildquelle: automatische Bildschirmaufnahmen (Playwright) der echten Seiten mit
**erfundenen Demo-Daten** (Demo-Team, Demo-Spieler) — keine echten Personen im Video.

| # | Zeit | Bild | Sprechertext |
|---|------|------|--------------|
| 1 | 0–5 s | Logo MDU, Titel „Team Manager“ | Servus! Das ist der Team Manager – dein Spieltag, organisiert in einer App. |
| 2 | 5–14 s | Mein Bereich → Kachel „Team Manager“ antippen, Übersicht mit Spiel-Kacheln | Für jedes Spiel deines Teams gibt es eine Kachel: wann, wo, gegen wen – und wer schon zugesagt hat. |
| 3 | 14–24 s | Kachel öffnen, „Bist du dabei?“ → „Dabei“ tippen; dann „Absage“ → Begründung tippen | Zusagen geht mit einem Tipp. Wer absagt oder unsicher ist, schreibt kurz dazu, warum. |
| 4 | 24–32 s | Glocke mit Hinweis „Sag zu oder ab“ | Wer noch nicht geantwortet hat, wird rechtzeitig vor dem Spiel in der Glocke erinnert. |
| 5 | 32–44 s | Teilnehmerliste nach Status, TC setzt Status für einen Spieler „ohne Begründung“ | Als Teamcaptain siehst du alle auf einen Blick und kannst auch für andere eintragen. |
| 6 | 44–54 s | Aufstellung H1–H8 aus den Zusagen wählen, Treffzeit ändern | Die Aufstellung stellst du direkt aus den Zusagen auf – Positionen wie auf dem Spielbericht. Die Treffzeit legst du gleich mit fest. |
| 7 | 54–64 s | Notiz + Aufgabe „Spielbericht mitbringen“ für einen Spieler, dessen Glocke | Notizen und Aufgaben fürs Spiel – wer eine Aufgabe bekommt, wird benachrichtigt. |
| 8 | 64–72 s | „Spiel teilen“ → WhatsApp-Vorschau | Und mit „Spiel teilen“ landet der Link direkt in eurer WhatsApp-Gruppe. |
| 9 | 72–75 s | Abspann: mdudarts.de · Mein Bereich → Team Manager | Probier's aus: mdudarts.de, Mein Bereich, Team Manager. |

## Weitere Clips (danach)
2. **Spielbericht live** — Live-Modus am Tablet, Ergebnis antippen, Auswechslung, Monitor-Ansicht.
3. **Tabellen & Profile** — neue Tabelle mit Legende, Einzelrangliste, Formkurve, Startseite.

## Technik
- Aufnahmen: Playwright-Video in der Cloud-Session (Klickwege als Skript, jederzeit neu
  aufnehmbar, wenn sich die Oberfläche ändert).
- Ton: ElevenLabs-API (Schlüssel als Umgebungsvariable `ELEVENLABS_API_KEY` in den
  Session-Einstellungen, nie im Code).
- Zusammenbau: ffmpeg (Bild + Ton + Untertitel + Musik), Feinschliff optional in CapCut.
