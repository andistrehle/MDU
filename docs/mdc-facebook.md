# MDC — Rangliste als Facebook-Beitrag

Unter **`/admin/facebook`** steht die aktuelle Rangliste als fertiger
Beitrag: die ersten **32 Herren** und **16 Damen**, dazu der Jackpot-Stand und
der Link auf die komplette Rangliste. Text kopieren, in der MDC-Gruppe
einfügen, abschicken.

Der Text ist ein Textfeld, kein starrer Block — vor dem Kopieren lässt sich
noch ein Satz voranstellen. Kopiert wird immer das, was im Feld steht.

---

## Warum nicht direkt in die Gruppe?

**Weil Meta das abgeschaltet hat.** Die Groups-API zum Veröffentlichen
(`publish_to_groups`) wurde zurückgezogen; seither kann **kein** Programm mehr
in eine Facebook-Gruppe schreiben — kein Werkzeug, keine Seite, kein Dienst.
Wer etwas anderes verspricht, meint entweder eine Facebook-*Seite* oder es
funktioniert nicht.

Was geht:

| Ziel | Programm darf posten? |
| --- | --- |
| Facebook-**Seite** (Page) | Ja — mit Seiten-Zugriffsschlüssel und `pages_manage_posts` |
| Facebook-**Gruppe** | Nein |
| Persönliches Profil | Nein |

Die MDC hat heute eine **Gruppe**
(`MDC_FACEBOOK_GROUP` in `lib/mdc/site.ts`), keine Seite. Deshalb ist der
Kopierweg der Hauptweg — und nicht der Notbehelf.

## Falls es einmal eine MDC-Seite gibt

Dann postet die Seite selbst. Nötig sind zwei Angaben im Vercel-Projekt (und,
für den Wochenlauf, dieselben als GitHub-Secrets):

| Variable | Was |
| --- | --- |
| `MDC_FB_PAGE_ID` | Kennung der Facebook-Seite |
| `MDC_FB_PAGE_TOKEN` | **Langlebiger** Seiten-Zugriffsschlüssel mit `pages_manage_posts` |

Sind beide gesetzt, erscheint in der Verwaltung der Knopf „Auf der
Facebook-Seite einstellen"; der Wochenlauf stellt den Beitrag dann selbst ein.
Fehlt eine, sagt die Seite das und bietet nur den Kopierweg an — sie tut nicht
so, als hätte sie gepostet.

Kurzer Schlüssel läuft nach ein bis zwei Stunden ab. Gebraucht wird der
langlebige (im Graph-API-Explorer erzeugen, dann über
`oauth/access_token?grant_type=fb_exchange_token` verlängern). Läuft er doch
ab, meldet die Seite Fehlercode 190 samt Rat.

---

## Jede Woche von selbst

`.github/workflows/mdc-facebook-weekly.yml` läuft **montags um 7:00 UTC** und
lässt sich im Actions-Tab jederzeit von Hand starten.

Jeder Lauf rechnet den Beitrag und legt ihn als **Zusammenfassung** ab —
GitHub → Actions → „MDC · Rangliste für Facebook" → Lauf öffnen. Von dort
lässt er sich kopieren, auch am Handy. Ist eine Facebook-Seite hinterlegt,
stellt derselbe Lauf ihn zusätzlich ein.

Ohne Schlüssel endet der Lauf **grün** mit dem Vermerk, dass nichts eingestellt
wurde. Das ist Absicht: Eine rote Meldung jede Woche, die nichts bedeutet,
schaut sich nach dem dritten Mal niemand mehr an.

Von Hand geht es genauso:

```
npx tsx scripts/mdc-facebook-post.ts          # nur rechnen und ausgeben
npx tsx scripts/mdc-facebook-post.ts --post   # zusätzlich einstellen
```

---

## Wo was steckt

| Datei | Wofür |
| --- | --- |
| `lib/mdc/facebook-post.ts` | Baut den Text. Eine Quelle für Verwaltung und Wochenlauf |
| `lib/mdc/facebook-api.ts` | Graph-API, Status, Fehlerklartext |
| `app/mdc/admin/facebook/` | Seite und Server-Aktion |
| `components/mdc/facebook-editor.tsx` | Textfeld, Kopieren, Einstellen |
| `scripts/mdc-facebook-post.ts` | Wochenlauf |

Die Zahlen kommen aus derselben Quelle wie die Rangliste auf der Seite
(`data/ranking.ts`, `lib/mdc/jackpot.ts`) — Beitrag und Seite können also gar
nicht auseinanderlaufen.

**Bewusst nicht im Beitrag:** die Euro-Beträge je Platz. Die verschieben sich
mit jedem Turnier, und eine Zahl, die drei Tage später nicht mehr stimmt, steht
bei Facebook für immer. Der Jackpot als Ganzes ist eine Angabe über den Topf,
keine Zusage an einen Spieler — der steht drin.
