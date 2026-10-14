# Video „MDU – Was ist neu“ (Saison 2026/27)

Erklärvideo, 13 Szenen, ca. 3,5 Minuten, 1920×1080. Alles hier, damit es in jeder
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

- Jede Szene wird nur EINMAL abgerufen (Zwischenspeicher `ton/`, Schlüssel = Stimme +
  Modell + Klang + Text). Wer einen Satz ändert, zahlt nur diese Szene neu. Ganzes Video ≈ 3.100 Zeichen.
- **Stimme:** bayerisch, NICHT wienerisch (Betreiber, 14.10.2026). Der Klon der
  Betreiberstimme („Andi (MDU-Video)“, `rBHJ2c5Ox6KVBd8eW2q1`) klang wienerisch → verworfen.
- **Stimme des Videos:** Benjamin (Bibliothek, leicht bayerisch), `ELEVENLABS_VOICE_ID=gRJR8Fqocw86Vixo4cZV` → 3:27 (Stand 14.10.2026).
- **Klang:** euphorisch und etwas schneller — `STIMME` in `vertonen.js` (stability 0.3,
  style 0.65, speed 1.1; per ENV `STABILITY`/`STYLE`/`SPEED` änderbar).
- **Flüssig statt abgehackt:** Jede Szene wird AM STÜCK gesprochen (`with-timestamps`),
  die Untertitel springen an den von ElevenLabs gelieferten Satzanfängen weiter.
  Szenenwechsel 0,45 s (`VORLAUF`), Luft am Szenenende 0,35 s (`PAUSE`).
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
- Szene 6 (Spielbericht digital & live) zeigt nur eine Grafik — echtes Formular braucht Login
  (Screenshot vom Betreiber).
