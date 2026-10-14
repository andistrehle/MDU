# Video „MDU – Was ist neu“ (Saison 2026/27)

Erklärvideo, 14 Szenen, ca. 4–4,5 Minuten, 1920×1080. Alles hier, damit es in jeder
neuen Session ohne Vorarbeit weitergeht. Wird NICHT deployt (`.vercelignore`) und
nicht typgeprüft (`scripts/` ist in tsconfig ausgenommen).

| Datei | Zweck |
|---|---|
| `erklaer.html` | Die Szenen (Bild, Untertitel = Sprechertext, Dauer je Satz). Texte HIER ändern. |
| `shots/` | Screenshots, die die Szenen zeigen (Beispieldaten bzw. öffentliche Seiten) |
| `fonts.css`, `media-fonts/` | Schriften der Homepage (aus dem Next-Build gezogen) |
| `vertonen.js` | Spricht jeden Satz mit ElevenLabs, nimmt die Szenen auf, legt den Ton darunter |
| `screenshots-*.js` | Screenshots neu machen (brauchen laufenden Server, siehe unten) |
| `zz-demo.page.tsx.txt` | Demo-Seite mit erfundenen Daten für Live-/Tabellen-Shots |

## Vertonen (ElevenLabs)

Voraussetzung: `ELEVENLABS_API_KEY` in den Umgebungseinstellungen der Session
(nie in den Chat, nie in eine Datei). Dann im Ordner `scripts/video-was-ist-neu`:

```bash
npm install --no-save --prefix . ffmpeg-static
export NODE_PATH=/opt/node22/lib/node_modules
node vertonen.js --stimmen                 # verfügbare Stimmen
node vertonen.js --probe <voiceId>         # Hörprobe → probe-<voiceId>.mp3
ELEVENLABS_VOICE_ID=<id> node vertonen.js  # fertiges Video → ausgabe/MDU-was-ist-neu.mp4
```

- Jeder Satz wird nur EINMAL abgerufen (Zwischenspeicher `ton/`, Schlüssel = Stimme +
  Modell + Text). Wer einen Satz ändert, zahlt nur diesen neu. Ganzes Video ≈ 3.100 Zeichen.
- Die Szene läuft so lange, wie gesprochen wird (+0,7 s Luft), der Ton liegt exakt am
  Untertitel (geprüft am 13.10.2026 per `silencedetect`: Einsatz 0,80 s = Untertitel).
- **Stimme des Videos:** Klon der Betreiberstimme „Andi (MDU-Video)“ im ElevenLabs-Konto,
  `ELEVENLABS_VOICE_ID=rBHJ2c5Ox6KVBd8eW2q1` (angelegt 14.10.2026 aus einer 1:33-Aufnahme).
- **Aussprache:** `AUSSPRACHE` in `vertonen.js` ersetzt Wörter NUR im gesprochenen Text
  („mdudarts.de“ → „Em De U Darts Punkt De“), der Untertitel bleibt.
- **Stimmen:** `--stimmen` zeigt nur die englischen Standardstimmen des Kontos. Deutsche
  (auch bayerische) gibt es in der ElevenLabs-Bibliothek (`/v1/shared-voices?language=de`,
  Suche „bavarian“); deren `voice_id` funktioniert direkt mit `--probe` und
  `ELEVENLABS_VOICE_ID` (Starter-Plan reicht).
- Test ohne Schlüssel: `TROCKEN=1 ELEVENLABS_VOICE_ID=x node vertonen.js` (Pieptöne).

## Screenshots neu machen

`zz-demo.page.tsx.txt` nach `app/zz-demo/page.tsx` kopieren (NIE committen — in
`.git/info/exclude` eintragen), `npm run build && npx next start -p 3340`, dann
`node screenshots-demo.js shots` bzw. `node screenshots-spielort.js shots`
(Ausgabe nach `shots/`). Danach `app/zz-demo` wieder löschen.

## Offen
- Szene 6 (Spielbericht digital) zeigt nur eine Grafik — echtes Formular braucht Login
  (Screenshot vom Betreiber).
