# Ask Andreas AI

Öffentlicher, mobilfreundlicher Ein-Seiten-Chatbot, der Fragen zum beruflichen
Profil von **Andreas Strehle** beantwortet – Teil einer Bewerbung als Digital &
AI Manager. Kein Datenbank-Backend, keine Chat-Persistenz, keine Cookies, kein
Tracking. Der Verlauf lebt nur im Browser-State.

> Eigenständiges Next.js-Projekt im Unterordner `ask-andreas-ai/` des MDU-Repos.
> Es teilt sich **nichts** mit der Darts-Plattform und wird separat deployt.

## Tech-Stack

- Next.js (App Router, TypeScript), Deployment auf Vercel
- Anthropic API über die serverseitige Route `/api/chat` (Streaming)
- Modell: `claude-haiku-4-5-20251001`

## Lokaler Start

```bash
cd ask-andreas-ai
cp .env.example .env.local   # ANTHROPIC_API_KEY eintragen
npm install
npm run dev                  # http://localhost:3000
```

`.env.local` ist in `.gitignore` und wird **nie** committet. Der API-Key wird
ausschließlich serverseitig verwendet und landet nicht im Client-Bundle.

## Deployment (Vercel)

1. Neues Vercel-Projekt anlegen und als **Root Directory** `ask-andreas-ai`
   auswählen (wichtig, da das Projekt im Unterordner liegt).
2. Environment Variable `ANTHROPIC_API_KEY` setzen (Production + Preview).
3. Deploy – Vercel erkennt Next.js automatisch. Bei jedem Push wird neu gebaut.

## Wo liegt der System-Prompt?

In **`system-prompt-ask-andreas-ai.md`** (Projektwurzel). Diese Datei ist die
einzige Quelle; sie wird serverseitig von `lib/system-prompt.ts` eingelesen und
an die API gesendet (HTML-Kommentare werden dabei entfernt). Zum Anpassen einfach
die Markdown-Datei bearbeiten – die mit `[PLATZHALTER …]` markierten Stellen mit
echten Inhalten füllen. Kein Code-Neustart nötig außer beim Deploy.

## Vorschlags-Chips ändern

Die antippbaren Chips unter der Begrüßung stehen in
**`lib/config.ts`** → `SUGGESTION_CHIPS`. Dort lassen sich auch Begrüßung
(`GREETING`), Kontaktadresse (`CONTACT_EMAIL`), Limits und das Modell anpassen.

## Schutzmaßnahmen

- **Rate Limiting:** max. 20 Nachrichten pro Session (Client) und ein
  großzügiges In-Memory-Limit pro IP (Server, `lib/rate-limit.ts`).
- **Input-Limit:** max. 1.000 Zeichen pro Nachricht (Client + Server geprüft).
- **Verlaufs-Limit:** nur die letzten 12 Turns gehen an die API.
- **Fehler:** bei API-Fehlern erscheint eine freundliche deutsche Meldung im
  Chat – niemals Stacktraces oder technische Details.

## Noch auszufüllen vor Go-live

- `system-prompt-ask-andreas-ai.md`: echte Profil-Inhalte statt Platzhalter
- `lib/config.ts`: `CONTACT_EMAIL`
- `app/impressum/page.tsx` und `app/datenschutz/page.tsx`: Name/Anschrift
