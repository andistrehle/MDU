# Erklärvideo für die Wirte — „Ranking ansetzen"

**Munich Darts Challenge · Kurzvideo, ca. 35 Sekunden**
Stand: 17.10.2026 · Aufbau wie beim [MDU-Einführungsvideo](einfuehrungsvideo-konzept.md):
Bildschirmaufnahme + Sprecherstimme (hier **ElevenLabs**), geschnitten in CapCut.

> Beschreibt nur, was die Seite wirklich kann (`/admin/ansetzen`, siehe
> [mdc-ansetzen.md](mdc-ansetzen.md)). Nichts versprechen, was nicht da ist.

---

## 1. Wofür, für wen

| | |
| --- | --- |
| **Zielgruppe** | Die Wirte der zwölf MDC-Lokale — am Handy, oft hinterm Tresen |
| **Ziel** | Sie sollen ihr Wochenendranking selbst eintragen, statt anzurufen |
| **Länge** | ~35 Sekunden, ohne Vorspann |
| **Format** | Hochkant 860 × 1864 (Handy), passt für WhatsApp, Facebook und die Gruppe |
| **Ton** | Freundlich, Du-Form, kein Werbesprech — wie die ganze Seite |

**Was NICHT ins Video gehört:** das Passwort selbst, Ergebnis-Upload,
Passnummern, News, Spielorte. Das Video zeigt genau eine Sache.

---

## 2. Die Bildschirmaufnahme

Liegt fertig vor, zwei Fassungen desselben Takes:

| Datei | Inhalt |
| --- | --- |
| `ansetzen-mit-text.webm` | mit eingeblendeten Schritten („1 · Euer Lokal auswählen" …) |
| `ansetzen-ohne-text.webm` | dasselbe ohne Einblendungen — falls du in CapCut eigene setzt |

Aufgenommen gegen den fertigen Build mit einem **GitHub-Doppelgänger**: Der
Ablauf ist echt bis zum Commit, geschrieben wurde nichts. Skript:
`video-ansetzen.mjs` (Arbeitsordner der Sitzung, nicht im Repo — die Aufnahme
lässt sich damit jederzeit neu erzeugen, etwa wenn sich die Seite ändert).

**WebM, nicht MP4.** CapCut am Rechner nimmt WebM; wenn du MP4 brauchst, sag
Bescheid — dafür müsste ich ein zusätzliches Umwandlungsprogramm installieren.

---

## 3. Szenen, Bild und Sprechertext

Zeiten sind Richtwerte aus dem Take. **Tipp für ElevenLabs:** jede Szene als
eigene Datei erzeugen, dann lassen sie sich in CapCut einzeln auf die passende
Stelle ziehen, ohne dass das Timing an einem einzigen langen Stück hängt.

| # | Zeit | Bild | Sprechertext | Einblendung |
| --- | --- | --- | --- | --- |
| 1 | 0:00–0:04 | Seitenkopf „Ranking ansetzen" | „Servus! Ab sofort tragt ihr euer Ranking am Wochenende selbst ein." | Ranking ansetzen · mdc-ranking.de/admin/ansetzen |
| 2 | 0:04–0:08 | Auswahl „Lokal" → Ambasador | „Zuerst euer Lokal auswählen." | 1 · Euer Lokal auswählen |
| 3 | 0:08–0:13 | Datumsfeld → Sa, 24.10.2026 | „Dann den Tag — Freitag, Samstag oder Sonntag, ganz wie ihr es ausmacht." | 2 · Den Tag wählen |
| 4 | 0:13–0:18 | Beginn → 18:00 | „Den Beginn eintragen. Lasst ihr das Feld leer, gilt eure übliche Zeit." | 3 · Beginn |
| 5 | 0:18–0:23 | Hinweis wird getippt | „Ein kurzer Hinweis kann dazu — der steht dann beim Termin auf der Seite." | 4 · Hinweis |
| 6 | 0:23–0:27 | „Ansetzen" → grüne Bestätigung | „Auf Ansetzen tippen, fertig. Ein, zwei Minuten später steht euer Turnier auf der Startseite, im Wochenplan und bei eurem Lokal." | 5 · Ansetzen — fertig |
| 7 | 0:27–0:31 | Liste „Schon angesetzt" | „Vertippt? Jeder Termin lässt sich wieder zurücknehmen." | Zurücknehmen geht immer |
| 8 | 0:31–0:35 | zurück zum Seitenkopf | „Das Passwort bekommt ihr bei der Turnierleitung — meldet euch einfach bei Andi. Absagen und feste Spieltage bleiben bei ihr. Gut Pfeil!" | Passwort bei der Turnierleitung |

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

### ElevenLabs-Einstellungen

- **Stimme:** männlich, deutsch, ruhig; dieselbe wie beim MDU-Video, damit beide
  zusammengehören. Keine Nachrichtensprecher-Stimme — das ist eine Anleitung für
  den Tresen, kein Werbespot.
- **Stability** eher hoch (gleichmäßig), **Style** niedrig. Tempo normal lassen:
  Die Pausen macht der Schnitt, nicht die Stimme.
- Nach dem Erzeugen **einmal selbst anhören**: „Ansetzen" muss auf der ersten
  Silbe betont sein, sonst klingt es nach „an-SETZEN".

---

## 4. Schnitt (CapCut)

1. Clip einfügen, Ton der Aufnahme gibt es nicht (stummer Take).
2. Sprecherspuren auf die Szenen ziehen; wo die Stimme länger ist als das Bild,
   den Standbild-Moment davor um ein paar Zehntel strecken — im Take sind nach
   jedem Schritt ruhige Sekunden eingebaut.
3. **Keine Musik** oder höchstens sehr leise. Das Video wird im Lokal am Handy
   geschaut, oft ohne Kopfhörer.
4. Am Ende 2 Sekunden Standbild mit der Adresse stehen lassen — daraus wird das
   Vorschaubild.
5. Export: 1080 × 1920 oder die Originalgröße; mehr als 35 Sekunden braucht es
   nicht.

---

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
