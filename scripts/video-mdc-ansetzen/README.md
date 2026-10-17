# Video „MDC – Ranking ansetzen" (für die Wirte)

Kurzvideo, 8 Szenen, ca. 47 Sekunden, hochkant 860 × 1864. Zeigt, wie ein Wirt
unter `/admin/ansetzen` einen Turnierabend einträgt. Drehbuch und Sprechertext:
[`docs/mdc-video-ansetzen.md`](../../docs/mdc-video-ansetzen.md) · die Funktion
selbst: [`docs/mdc-ansetzen.md`](../../docs/mdc-ansetzen.md).

Gleiche Mechanik wie [`scripts/video-was-ist-neu`](../video-was-ist-neu)
(MDU-Video), gleiche Stimme — nur wird hier **die laufende Seite** abgefilmt
statt gebauter HTML-Szenen.

| Datei | Zweck |
| --- | --- |
| `vertonen.js` | Alles: sprechen, aufnehmen, Ton darunterlegen. **Die Szenentexte stehen hier oben in `SZENEN`.** |
| `ausgabe/` | Das fertige MP4 (nicht im Repo) |
| `ton/` | Zwischenspeicher der gesprochenen Szenen (nicht im Repo) |

## Ablauf

```bash
# 1. Seite lokal starten (im Repo-Wurzelverzeichnis), mit Passwörtern:
npm run build
MDC_ADMIN_PASSWORD=chef123 MDC_TERMIN_PASSWORD=wirt456 MDC_GITHUB_TOKEN=nur-test \
  npx next start -p 3115

# 2. Im Ordner scripts/video-mdc-ansetzen:
npm install --no-save --prefix . ffmpeg-static     # einmal je Session
node vertonen.js --stimmen                         # Stimmen des Kontos
node vertonen.js --probe <voiceId>                 # Hörprobe
ELEVENLABS_VOICE_ID=gRJR8Fqocw86Vixo4cZV node vertonen.js
OHNE_TEXT=1 ELEVENLABS_VOICE_ID=gRJR8Fqocw86Vixo4cZV node vertonen.js
```

- **Stimme:** Benjamin (`gRJR8Fqocw86Vixo4cZV`) — dieselbe wie im MDU-Video,
  damit beide zusammengehören.
- **Klang:** ruhiger als dort (`SPEED` 1.0 statt 1.1, `STYLE` 0.45 statt 0.65).
  Das hier ist eine Anleitung; wer sie am Tresen schaut, tippt beim Zuschauen
  mit. Über `STABILITY`/`STYLE`/`SPEED` änderbar.
- **Kosten:** Jede Szene wird nur EINMAL abgerufen (`ton/`, Schlüssel = Stimme +
  Modell + Klang + Text). Das ganze Video sind rund 620 Zeichen; die zweite
  Fassung ohne Einblendungen kostet nichts.
- **Test ohne Schlüssel:** `TROCKEN=1 ELEVENLABS_VOICE_ID=x node vertonen.js`
  (Pieptöne statt Sprache, sonst derselbe Ablauf).
- `ELEVENLABS_API_KEY` kommt aus der Umgebung der Session — **nie** in eine
  Datei, nie in den Chat.

## Es wird nichts geschrieben

Die Aufnahme zeigt die grüne Bestätigung nach dem Ansetzen, **ohne** dass ein
Commit entsteht: `freigabeAbfangen()` fängt die Server-Aktion im Browser ab und
antwortet mit dem, was ein geglückter Commit zurückgäbe. Es läuft also weder
ein echter GitHub-Aufruf noch ein Doppelgänger-Server. `data/kalender.ts`,
`data/results-uploaded.ts` und alles andere bleiben unberührt.

**Für die Liste „Schon angesetzt"** braucht es einen Eintrag, sonst steht dort
„noch kein zusätzlicher Termin" und Szene 7 zeigt nichts. Vor der Aufnahme
deshalb in `data/kalender.ts` einen Demo-Eintrag ergänzen …

```json
{ "id": "2026-10-24-ambasador-zusatz", "date": "2026-10-24", "venueId": "ambasador",
  "art": "zusatz", "time": "18:00", "note": "Zusatzturnier, Anmeldung bis 17:45" }
```

… neu bauen, aufnehmen — und ihn **danach wieder herausnehmen**. Er gehört
nicht ins Repository: Auf der Seite stünde sonst ein Turnier, das es nicht
gibt, und jemand führe hin.

## Wenn sich die Seite ändert

Die Szenen greifen auf echte Felder zu (`select`, `input[type=date]`,
`input[type=time]`, den Knopf „Ansetzen"). Ändert sich die Maske, bricht das
Skript hörbar ab, statt still etwas Falsches zu filmen — dann die betroffene
Szene in `SZENEN` nachziehen und neu laufen lassen. Der Ton wird dabei nicht
noch einmal abgerechnet, solange der Text gleich bleibt.
