# Erklärvideo für die Wirte — „Ranking ansetzen"

**Munich Darts Challenge · Kurzvideo, 47 Sekunden, fertig vertont**
Stand: 17.10.2026 · Aufbau wie beim [MDU-Einführungsvideo](einfuehrungsvideo-konzept.md):
Bildschirmaufnahme + **ElevenLabs**-Stimme — hier aber in EINEM Lauf erzeugt
(`scripts/video-mdc-ansetzen/vertonen.js`), nicht von Hand geschnitten.

> Beschreibt nur, was die Seite wirklich kann (`/admin/ansetzen`, siehe
> [mdc-ansetzen.md](mdc-ansetzen.md)). Nichts versprechen, was nicht da ist.

---

## 1. Wofür, für wen

| | |
| --- | --- |
| **Zielgruppe** | Die Wirte der zwölf MDC-Lokale — am Handy, oft hinterm Tresen |
| **Ziel** | Sie sollen ihr Wochenendranking selbst eintragen, statt anzurufen |
| **Länge** | 47 Sekunden, ohne Vorspann |
| **Format** | Hochkant 860 × 1864 (Handy), passt für WhatsApp, Facebook und die Gruppe |
| **Ton** | Freundlich, Du-Form, kein Werbesprech — wie die ganze Seite |

**Was NICHT ins Video gehört:** das Passwort selbst, Ergebnis-Upload,
Passnummern, News, Spielorte. Das Video zeigt genau eine Sache.

---

## 2. Das fertige Video

**Es ist fertig vertont** — Bild und Stimme kommen aus einem Lauf, nichts muss
mehr zusammengeschnitten werden:

| Datei | Inhalt |
| --- | --- |
| `MDC-ansetzen.mp4` | mit Stimme und eingeblendeten Schritten (47 s, 860 × 1864, H.264/AAC) |
| `MDC-ansetzen-ohne-text.mp4` | dieselbe Vertonung, ohne Einblendungen — falls du in CapCut eigene setzt |

Erzeugt mit `scripts/video-mdc-ansetzen/vertonen.js` (siehe README dort):
Erst spricht ElevenLabs jede Szene, dann wird die **echte Seite** so lange
bedient, wie gesprochen wird, dann liegt der Ton exakt darunter. Wer einen Satz
ändert, lässt das Skript neu laufen — nur die geänderte Szene wird neu
abgerechnet.

**Geschrieben wird dabei nichts.** Die Freigabe wird im Browser abgefangen und
mit der Antwort beantwortet, die ein geglückter Commit zurückgäbe; die grüne
Bestätigung im Video ist also echt dargestellt, aber folgenlos.

## 3. Szenen, Bild und Sprechertext

Die Zeiten stammen aus dem fertigen Video (`ausgabe/szenen.json`). Jede Szene
läuft genau so lange, wie gesprochen wird — das Skript misst den Ton und hält
das Bild entsprechend. Der Text steht auch in `SZENEN` in `vertonen.js`; wer
ihn hier ändert, ändert ihn bitte dort mit (und umgekehrt).

| # | Zeit | Bild | Sprechertext | Einblendung |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:05 | Seitenkopf „Ranking ansetzen" | „Servus! Ab sofort tragt ihr euer Ranking am Wochenende selbst ein." | Ranking ansetzen · mdc-ranking.de/admin/ansetzen |
| 2 | 0:05–0:08 | Auswahl „Lokal" → Ambasador | „Zuerst euer Lokal auswählen." | 1 · Euer Lokal auswählen |
| 3 | 0:08–0:14 | Datumsfeld → Sa, 24.10.2026 | „Dann den Tag — Freitag, Samstag oder Sonntag, ganz wie ihr es ausmacht." | 2 · Den Tag wählen |
| 4 | 0:14–0:20 | Beginn → 18:00 | „Den Beginn eintragen. Lasst ihr das Feld leer, gilt eure übliche Zeit." | 3 · Beginn |
| 5 | 0:20–0:25 | Hinweis wird getippt | „Ein kurzer Hinweis kann dazu — der steht dann beim Termin auf der Seite." | 4 · Hinweis |
| 6 | 0:25–0:33 | „Ansetzen" → grüne Bestätigung | „Auf Ansetzen tippen, fertig. Ein, zwei Minuten später steht euer Turnier auf der Startseite, im Wochenplan und bei eurem Lokal." | 5 · Ansetzen — fertig |
| 7 | 0:33–0:37 | Liste „Schon angesetzt" | „Vertippt? Jeder Termin lässt sich wieder zurücknehmen." | Zurücknehmen geht immer |
| 8 | 0:37–0:47 | zurück zum Seitenkopf | „Das Passwort bekommt ihr bei der Turnierleitung — meldet euch einfach bei Andi. Absagen und feste Spieltage bleiben bei ihr. Gut Pfeil!" | Passwort bei der Turnierleitung |

### Sprechertext am Stück (zum Einfügen bei ElevenLabs)

> Servus! Ab sofort tragt ihr euer Ranking am Wochenende selbst ein.
> Zuerst euer Lokal auswählen.
> Dann den Tag — Freitag, Samstag oder Sonntag, ganz wie ihr es ausmacht.
> Den Beginn eintragen. Lasst ihr das Feld leer, gilt eure übliche Zeit.
> Ein kurzer Hinweis kann dazu — der steht dann beim Termin auf der Seite.
> Auf Ansetzen tippen, fertig. Ein, zwei Minuten später steht euer Turnier auf der Startseite, im Wochenplan und bei eurem Lokal.
> Vertippt? Jeder Termin lässt sich wieder zurücknehmen.
> Das Passwort bekommt ihr bei der Turnierleitung — meldet euch einfach bei Andi. Absagen und feste Spieltage bleiben bei ihr. Gut Pfeil!

**Wenn die Adresse mitgesprochen werden soll** (statt nur eingeblendet), so
schreiben — sonst buchstabiert die Stimme die Satzzeichen:

> em-de-ce-ranking punkt de, schrägstrich admin, schrägstrich ansetzen

### ElevenLabs-Einstellungen (so ist es erzeugt)

- **Stimme:** Benjamin, `gRJR8Fqocw86Vixo4cZV` — dieselbe wie im MDU-Video.
- **Klang:** ruhiger als dort, `speed` 1.0 statt 1.1 und `style` 0.45 statt
  0.65. Das hier ist eine Anleitung; wer sie am Tresen schaut, tippt mit.
- **Modell:** `eleven_multilingual_v2`, Sprache Deutsch.
- Die Adresse wird nicht gesprochen, sondern nur eingeblendet. Soll sie mit in
  den Ton, hinterlegt `AUSSPRACHE` in `vertonen.js` bereits die Schreibweise
  „Em De Ce Ranking Punkt De" — sonst buchstabiert die Stimme die Satzzeichen.

## 4. Nachbearbeiten (nur wenn du willst)

Das MP4 ist fertig — Schnitt ist keiner nötig. Falls du doch etwas änderst:

1. **Keine Musik** darunterlegen oder höchstens sehr leise. Das Video wird im
   Lokal am Handy geschaut, oft ohne Kopfhörer.
2. Am Ende stehen zwei Sekunden mit der Adresse — daraus wird das
   Vorschaubild.
3. Anderer Satz, andere Reihenfolge, andere Stimme? Nicht in CapCut
   nachbauen, sondern `SZENEN` in `scripts/video-mdc-ansetzen/vertonen.js`
   ändern und das Skript neu laufen lassen. Dann passen Bild und Ton wieder
   von selbst zusammen.

## 5. Was im Begleittext zur Weitergabe stehen sollte

Wenn du das Video in die Gruppe oder per WhatsApp schickst:

> Ab sofort könnt ihr euer Ranking am Freitag, Samstag oder Sonntag selbst
> eintragen: **mdc-ranking.de/admin/ansetzen** — das Passwort gibt's bei mir.
> Es gilt für alle Lokale, bitte nicht weitergeben. Absagen und feste Spieltage
> laufen weiter über mich.

Die Seite hat **keinen Knopf auf der Homepage**: Ein öffentlicher Verweis würde
bei jedem Besucher die Passwortabfrage auslösen. Die Wirte bekommen die Adresse
von dir — am besten als Link, den sie sich auf den Home-Bildschirm legen
(Safari: Teilen → „Zum Home-Bildschirm").
