# MDC — Originaldateien der Marke

Lege hier die Logodateien ab. Die Seite findet sie von selbst — es muss
**keine Zeile Code** geändert werden.

| Dateiname | Was ersetzt wird |
| --- | --- |
| `logo.svg` (oder `.png`, `.webp`, `.jpg`) | das komplette runde Zeichen in Kopf- und Fußzeile |
| `werfer.svg` (oder `.png`) | nur die Dartwerfer-Figur neben dem Schriftzug |
| `skyline.svg` (oder `.png`) | nur die Skyline im Kreis |

SVG ist am besten: bleibt in jeder Größe scharf und wiegt wenig. PNG geht
auch — dann bitte mit durchsichtigem Hintergrund und mindestens 512 Pixel
Kantenlänge, sonst wird das Zeichen in der Fußzeile unscharf.

Ohne Datei greift die gezeichnete Fassung aus `components/mdc/logo.tsx`.

## Hochladen

Im GitHub-Browser: in diesen Ordner gehen → **Add file → Upload files** →
Datei hineinziehen → „Commit changes". Vercel baut danach automatisch neu,
und das Logo steht auf der Seite.
