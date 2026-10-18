# Promo-Video „Der Team Manager ist da!“

Drehbuch: [`docs/video-team-manager-promo.md`](../../docs/video-team-manager-promo.md). 16 Szenen
(Drehbuch 1–15, 7b als eigene Szene), 2:16, Stimme Benjamin, euphorisch. Gleiche Mechanik wie
[`scripts/video-was-ist-neu`](../video-was-ist-neu). Wird NICHT deployt, nicht typgeprüft.

| Datei | Zweck |
|---|---|
| `erklaer.html` | Die Szenen (Untertitel = Sprechertext). Texte HIER ändern. `#hoch` = Hochformat, nur Handy. |
| `shots/` | Screenshots `web-*` (1440×900 @1,5) und `handy-*` (390×844 @3) mit Demo-Daten |
| `vertonen.js` | Spricht je Szene am Stück (ElevenLabs), nimmt quer UND hochkant auf, legt den Ton darunter |
| `reel.js` | Reel (= ganzes Hochformat) und Story (Intro, Scheibe, Preis, Abspann) |
| `screenshots.js`, `shots-liste.js` | Screenshots neu machen (Demo-Seite muss laufen, siehe unten) |
| `standbilder.js` | Standbild jedes Schritts ohne Ton, zum Prüfen (`node standbilder.js <ordner> [hoch]`) |
| `zz-demo/*.txt` | Die Demo-Seite (Kopien der Team-Manager-Seiten mit Demo-Daten statt Datenbank) |

## Vertonen

```bash
npm install --no-save --prefix . ffmpeg-static     # einmal je Session
export NODE_PATH=/opt/node22/lib/node_modules
ELEVENLABS_VOICE_ID=gRJR8Fqocw86Vixo4cZV node vertonen.js --probe-szenen 1,16   # Hörprobe
ELEVENLABS_VOICE_ID=gRJR8Fqocw86Vixo4cZV node vertonen.js                      # → ausgabe/
node reel.js
```

- **Klang:** stability 0.25, style 0.8, speed 1.12 (ENV `STABILITY`/`STYLE`/`SPEED`).
- **Aussprache** (`AUSSPRACHE`, nur gesprochen): „mdudarts.de“ → „Em-De-U-Darts Punkt De-E“
  (mit Bindestrichen trennt die Stimme die Buchstaben; „Em De U Darts Punkt De“ verstand die
  Spracherkennung als „MDI Darts Punkte“), „TC“ → „Teamcaptain“, „7,99 €“ → „sieben
  neunundneunzig“, „49 €“ → „neunundvierzig Euro“.
- **Prüfen:** Tonspur mit ElevenLabs Speech-to-Text (`scribe_v1`) mitschreiben lassen — so fiel
  „gegens den Teamschnitt“ auf (18.10.2026, mit Gedankenstrich behoben).
- Schritte mit `weiter: true` wechseln nur das Bild und werden nicht gesprochen.
- Ganzes Video ≈ 2.000 Zeichen; geänderte Szenen kosten nur sich selbst (Zwischenspeicher `ton/`).

## Screenshots neu machen

```bash
cp -r scripts/video-team-manager/zz-demo app/zz-demo && (cd app/zz-demo && for f in *.txt; do mv "$f" "${f%.txt}"; done)
# app/zz-demo/ steht in .git/info/exclude — NIE committen
env -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_ANON_KEY -u SUPABASE_SERVICE_ROLE_KEY \
  NEXT_PUBLIC_USE_AUTH_MOCK=true npm run build && npx next start -p 3360
cd scripts/video-team-manager && node screenshots.js shots          # oder: node screenshots.js shots nur=dash-n9,kasse-offen
rm -rf app/zz-demo   # danach wieder löschen
```

- Gebaut wird **ohne Datenbank-Variablen** und mit Schein-Login (`NEXT_PUBLIC_USE_AUTH_MOCK`,
  Profil per `sessionStorage` aus `screenshots.js`) — die echte DB wird nie berührt.
- `demo-daten.ts` benennt das Demo-Team („DC Demo München“), seine Gegner und Lokale NUR im
  Browser der Demo-Seite um; alle Spieler sind erfunden. Gegneranalyse-Zahlen sind Beispielwerte
  (Saison hatte noch nicht begonnen) → Schild „Beispieldaten“ im Video.
- Premium-Seite: PayPal-Empfänger ist im Bild durch „paypal.me/…“ ersetzt (sonst echter Name).
- Die Glocke im Kopf wird durch eine Demo-Glocke ersetzt (es gibt ZWEI im Kopf: breit und schmal).
- Der Browser braucht `--lang=de-DE` + `LANG`, sonst zeigt das Treffen-Feld „07:30 PM“.

## Veröffentlichen

Erst wenn der Team Manager öffentlich buchbar ist (`PREMIUM_OEFFENTLICH` in `lib/premium.ts`).
