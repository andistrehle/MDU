# Erklärvideo für die Wirte — „Ranking ansetzen"

**Munich Darts Challenge · Kurzvideo, 56 Sekunden, fertig vertont**
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
| **Länge** | 56 Sekunden, ohne Vorspann |
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
| `MDC-ansetzen.mp4` | mit Stimme und eingeblendeten Schritten (56 s, 860 × 1864, H.264/AAC) |
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
| 1 | 0:00–0:05 | Spielorte-Seite, es wird gescrollt | „Servus! Ab sofort könnt ihr eure Wochenend-Spiele auch auf der Homepage einstellen …" | mdc-ranking.de · Spielorte |
| 2 | 0:05–0:14 | Karte „Wirte-Login" ganz unten → antippen | „Den Zugang findet ihr unter Spielorte, ganz unten: Wirte-Login. Antippen und das Passwort eingeben." | Spielorte → ganz unten → Wirte-Login |
| 3 | 0:14–0:17 | Auswahl „Lokal" → Ambasador | „Zuerst euer Lokal auswählen." | 1 · Euer Lokal auswählen |
| 4 | 0:17–0:23 | Datumsfeld → Sa, 24.10.2026 | „Dann den Tag — Freitag, Samstag oder Sonntag, ganz wie ihr es ausmacht." | 2 · Den Tag wählen |
| 5 | 0:23–0:29 | Beginn → 18:00 | „Den Beginn eintragen. Lasst ihr das Feld leer, gilt eure übliche Zeit." | 3 · Beginn |
| 6 | 0:29–0:34 | Hinweis wird getippt | „Ein kurzer Hinweis kann dazu — der steht dann beim Termin auf der Seite." | 4 · Hinweis |
| 7 | 0:34–0:42 | „Ansetzen" → grüne Bestätigung | „Auf Ansetzen tippen, fertig. Ein, zwei Minuten später steht euer Turnier auf der Startseite, im Wochenplan und bei eurem Lokal." | 5 · Ansetzen — fertig |
| 8 | 0:42–0:46 | Liste „Schon angesetzt" | „Vertippt? Jeder Termin lässt sich wieder zurücknehmen." | Zurücknehmen geht immer |
| 9 | 0:46–0:55 | zurück zum Seitenkopf | „Das Passwort bekommt ihr bei der Turnierleitung — meldet euch einfach bei Toni. Absagen und feste Spieltage bleiben bei ihr. Gut Pfeil!" | Passwort bei der Turnierleitung |

**Die Passwortabfrage selbst ist nicht im Bild.** Die Aufnahme bringt die
Zugangsdaten mit, deshalb springt das Video von „Wirte-Login" direkt auf die
Seite. Gesagt wird es („Antippen und das Passwort eingeben"), und in
Wirklichkeit steht dazwischen das kleine Fenster des Browsers.

### Sprechertext am Stück (zum Einfügen bei ElevenLabs)

> Servus! Ab sofort könnt ihr eure Wochenend-Spiele auch auf der Homepage einstellen …
> Den Zugang findet ihr unter Spielorte, ganz unten: Wirte-Login. Antippen und das Passwort eingeben.
> Zuerst euer Lokal auswählen.
> Dann den Tag — Freitag, Samstag oder Sonntag, ganz wie ihr es ausmacht.
> Den Beginn eintragen. Lasst ihr das Feld leer, gilt eure übliche Zeit.
> Ein kurzer Hinweis kann dazu — der steht dann beim Termin auf der Seite.
> Auf Ansetzen tippen, fertig. Ein, zwei Minuten später steht euer Turnier auf der Startseite, im Wochenplan und bei eurem Lokal.
> Vertippt? Jeder Termin lässt sich wieder zurücknehmen.
> Das Passwort bekommt ihr bei der Turnierleitung — meldet euch einfach bei Toni. Absagen und feste Spieltage bleiben bei ihr. Gut Pfeil!

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

## 5. Facebook-Beitrag (zum Video, in die Gruppe)

Kurz halten — wer am Handy scrollt, liest drei Zeilen. Das Video dazu hängen,
dann erklärt es sich selbst. In eine Facebook-GRUPPE kann kein Programm
schreiben (Meta hat das abgeschaltet), also kopieren und einfügen:

> 🎯 **Neu: Wochenend-Ranking selbst eintragen**
>
> Wirte: Ihr macht am Freitag, Samstag oder Sonntag ein Ranking? Tragt es ab
> sofort selbst auf der Seite ein — es steht dann gleich im Wochenplan und bei
> eurem Lokal.
>
> 👉 mdc-ranking.de/spielorte → ganz unten „Wirte-Login"
> Das Passwort gibt's bei Toni.
>
> Für alle anderen: Die Zusatztermine stehen damit genauso auf der Seite wie
> die festen Abende. Gut Pfeil!

## 6. Was im Begleittext zur Weitergabe stehen sollte

Wenn du das Video in die Gruppe oder per WhatsApp schickst:

> Ab sofort könnt ihr euer Ranking am Freitag, Samstag oder Sonntag selbst
> eintragen: **mdc-ranking.de/admin/ansetzen** — das Passwort gibt's bei Toni.
> Es gilt für alle Lokale, bitte nicht weitergeben. Absagen und feste Spieltage
> laufen weiter über die Turnierleitung.

Seit 17.10.2026 gibt es den Zugang auch **auf der Seite selbst**: unter
**Spielorte**, ganz unten, die Karte **Wirte-Login**. Bewusst dort und nicht in
der Hauptnavigation — wer ein Lokal betreibt, landet ohnehin auf dieser Seite,
alle anderen geht der Zugang nichts an. Der Verweis ist ein gewöhnliches `<a>`:
Erst beim Tippen passiert etwas, und dann ist die Passwortabfrage gewollt.
Zusätzlich lohnt sich der direkte Link, den die Wirte sich auf den
Home-Bildschirm legen können (Safari: Teilen → „Zum Home-Bildschirm").
