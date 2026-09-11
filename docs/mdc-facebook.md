# MDC — Rangliste als Facebook-Beitrag

Unter **`/admin/facebook`** steht die aktuelle Rangliste als fertiger
Beitrag — **als Bild**, nicht als Textwüste:

1. **Zwei Tabellenbilder** (1200 px breit): die ersten **32 Herren** und
   **16 Damen**, mit Platz, Name, Punkten und Teilnahmen. Unten im Bild steht
   „Komplette Rangliste auf mdc-ranking.de/rangliste".
2. **Ein kurzer Text** darüber: Stand, Jackpot, und derselbe Verweis noch
   einmal als anklickbarer Link.

**Ein Knopf macht alles fertig:** „Beitrag fertig machen" legt den Text in die
Zwischenablage und reicht beide Bilder ans Teilen-Fenster des Geräts weiter —
dort Facebook wählen, Gruppe wählen, Text einfügen, abschicken. Am
Schreibtisch gibt es kein Teilen-Fenster; dort werden beide Bilder
heruntergeladen, der Text liegt trotzdem in der Zwischenablage.

Facebook übernimmt beim Teilen die **Bilder** zuverlässig, den mitgeschickten
**Text** nicht immer. Deshalb wird er vorher kopiert — dann genügt Einfügen.

Der Text ist ein Textfeld: vor dem Kopieren lässt sich ein Satz voranstellen,
und wer die Namen doch lieber als Text hätte, schaltet auf die Langfassung um.

### Wenn „Text kopieren" nichts tut

Das passiert in den **eingebauten Browsern von Facebook und Instagram** — dort
ist `navigator.clipboard` gesperrt, und genau dort landet man, wenn man den
Link in der Gruppe antippt. Der Knopf versucht deshalb drei Wege
nacheinander: `navigator.clipboard`, dann das alte `execCommand('copy')`, und
wenn beides nichts hilft, markiert er den Text und sagt, dass jetzt „Kopieren"
aus dem Menü des Browsers dran ist. Im normalen Browser (Safari, Chrome) greift
schon der erste Weg.

Gezeichnet werden die Bilder mit `ImageResponse` (Satori) in
`lib/mdc/facebook-bild.tsx`; ausgeliefert werden sie unter
`/admin/facebook/bild/men` bzw. `/women`, immer frisch gerechnet. **Satori kann
nur Flexbox** — kein `grid`, keine Tabellen; beim Ändern daran denken. Die
Hausschrift der Seite kommt von Google Fonts und liegt nicht als Datei im
Repository, deshalb zeichnet Satori mit seiner eingebauten Schrift.

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
Ein Beitrag mit zwei Bildern braucht bei Facebook zwei Schritte (Bilder
unveröffentlicht hochladen, dann als `attached_media` an den Beitrag hängen) —
das steckt in `posteBilderAufFacebook`. **Dieser Weg ist nie gegen die echte
API gelaufen**, weil es keine MDC-Seite zum Ausprobieren gibt; er ist nach der
Dokumentation gebaut. Beim ersten Einsatz bitte nachsehen, was dabei
herauskommt.
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

Jeder Lauf legt beides ab: den **Text** als Zusammenfassung und die **beiden
Bilder** als Artefakt `facebook-bilder` (28 Tage). GitHub → Actions → „MDC ·
Rangliste für Facebook" → Lauf öffnen; Text kopieren, Bilder laden, fertig —
auch am Handy. Ist eine Facebook-Seite hinterlegt, stellt derselbe Lauf den
Beitrag mit beiden Bildern zusätzlich selbst ein.

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
| `lib/mdc/facebook-post.ts` | Baut den Text (kurz und lang). Eine Quelle für Verwaltung und Wochenlauf |
| `lib/mdc/facebook-bild.tsx` | Zeichnet die Tabellenbilder |
| `app/mdc/admin/facebook/bild/[division]/` | Liefert das PNG aus |
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
