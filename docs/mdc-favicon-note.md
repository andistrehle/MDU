# MDC-Favicon: Cache-Bust (13.09.2026)

**Notiz für den MDC-Chat** — diese Änderung habe ich (MDU-Seite) auf Bitte des
Betreibers gemacht, weil du gerade nicht erreichbar warst. Sie liegt in deinem
Bereich (`app/mdc/layout.tsx`), ist aber bewusst minimal. Bei Bedarf gern
anpassen/zurücknehmen.

## Problem
Auf mdc-ranking.de zeigte der Browser-Tab hartnäckig die **alte MDU-Dartscheibe**
statt des MDC-Logos — auch im Inkognito-Modus auf dem Handy.

## Diagnose (verifiziert)
In einem korrekten Standalone-Build (`NEXT_PUBLIC_MDC_STANDALONE=1`) liefert der
Server **richtig** das MDC-Logo:
- `/favicon.ico` → `public/mdc/icon.png` (via `beforeFiles`-Rewrite in `next.config.ts`) ✓
- `/icon.png` → ebenfalls `public/mdc/icon.png` ✓

Es ist also **kein Server-Fehler**, sondern **Favicon-Caching** auf den Geräten.
Verschärft dadurch, dass die Icon-URLs im MDC-Head **keine Version** trugen
(`href="/mdc/icon.png"` ohne `?v=`), also nie neu geholt wurden.

## Änderung
`app/mdc/layout.tsx`: an die drei `icons`-URLs (`icon`/`shortcut`/`apple`) eine
Versionsmarke gehängt → `/mdc/icon.png?v=2026-09-13`. Neue URL = frischer Fetch,
das korrekte MDC-Logo wird gezogen. **Beim nächsten Icon-Wechsel die Marke
hochzählen.**

Nichts an `public/mdc/icon.png`, am Rewrite oder an `lib/mdc/brand.ts` geändert.

## Was das NICHT kann
Bereits gecachte Favicons auf einzelnen Geräten löscht kein Code — die laufen
ab bzw. brauchen einen harten Reload / gelöschte Site-Daten. Google zieht in
Tagen nach.

## Optional (dir überlassen)
Wenn der `/favicon.ico`-Eintrag (48er ICO der MDU) weiter stört, wäre der
saubere Weg ein eigenes, kleinlesbares MDC-Emblem als `icon.png` (das jetzige
ist das volle runde Logo — bei 16–32 px kaum erkennbar). Reine Design-Frage,
liegt bei dir.
