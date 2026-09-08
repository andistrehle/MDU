# MDC — Originaldateien der Marke

Lege hier die Logodateien ab. Die Seite findet sie von selbst — es muss
**keine Zeile Code** geändert werden.

| Dateiname | Was ersetzt wird |
| --- | --- |
| `logo.svg` (oder `.png`, `.webp`, `.jpg`) | das komplette runde Zeichen in Kopf- und Fußzeile |
| `icon.svg` (oder `.png`) | das Symbol im Browser-Tab — **quadratisch**, siehe unten |
| `werfer.svg` (oder `.png`) | nur die Dartwerfer-Figur neben dem Schriftzug |
| `skyline.svg` (oder `.png`) | nur die Skyline im Kreis |
| `hero.webp` (oder `.jpg`, `.png`, `.avif`) | Hintergrundfoto der Bühne auf der Startseite |

SVG ist am besten: bleibt in jeder Größe scharf und wiegt wenig. PNG geht
auch — dann bitte mit durchsichtigem Hintergrund und mindestens 512 Pixel
Kantenlänge, sonst wird das Zeichen in der Fußzeile unscharf.

**Für das Bühnenfoto** bitte **JPG oder WebP**, nicht PNG — ein Foto als PNG
wiegt schnell das Zehnfache. Querformat (16:9 oder breiter), mindestens
1600 Pixel breit. Das Motiv sollte rechts der Mitte sitzen: Die Seite blendet
das Bild nach links weich aus, dort steht die Schrift.

**Für das Tab-Symbol** (`icon.png`) bitte **quadratisch**, mindestens
256 Pixel Kantenlänge — am besten nur der runde Teil des Logos, ohne den
Schriftzug links und rechts. Aus `logo.png` lässt sich das nicht sauber
herausschneiden: Die beiden Bänder laufen hinter dem Kreis durch und ragen
beidseitig heraus, jeder Schnitt lässt entweder Fetzen stehen oder kappt den
Kreis.

**Solange diese Datei fehlt**, zeigt der Browser-Tab auf mdc-ranking.de das
Symbol der MDU (die Dartscheibe) — beide Seiten liegen im selben Projekt, und
die MDC erbt es. Das Vorschaubild beim Verschicken per WhatsApp ist davon
nicht betroffen, das kommt aus `app/mdc/opengraph-image.png`.

Ohne Datei greift die gezeichnete Fassung aus `components/mdc/logo.tsx`
beziehungsweise die gezeichnete Dartscheibe auf der Startseite.

## Hochladen

Im GitHub-Browser: in diesen Ordner gehen → **Add file → Upload files** →
Datei hineinziehen → „Commit changes". Vercel baut danach automatisch neu,
und das Logo steht auf der Seite.
