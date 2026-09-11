# Ergebniszettel hochladen

Am Turnierabend wird die handgeschriebene Ergebnisliste fotografiert,
hochgeladen, geprüft und freigegeben. Ein bis zwei Minuten später steht das
Turnier auf mdc-ranking.de — in der Rangliste, beim Spielort und bei jedem
beteiligten Spieler.

Adresse: **`/admin/ergebnis`** (auf mdudarts.de: `/mdc/admin/ergebnis`).

---

## Der Ablauf

**1 · Turnier und Zettel.** Spielort und Datum stehen vorbelegt — vorausgewählt
ist ein Lokal, das an diesem Wochentag spielt. Dann den Zettel fotografieren.
Das Bild wird noch im Browser auf die lange Kante 1600 px verkleinert; es
verlässt das Handy also klein, nicht mit vier Megabyte.

**2 · Prüfen.** Das ist der eigentliche Schritt. Die erkannte Liste steht Zeile
für Zeile da:

- **Die Reihenfolge ist die Platzierung.** Zeilen lassen sich nach oben und
  unten schieben und löschen.
- **Jede Zeile braucht einen Spieler.** Sicher erkannte sind vorbelegt, alles
  andere ist rot markiert und muss ausgewählt werden. Darunter steht immer,
  was auf dem Zettel gelesen wurde — man sieht also, worüber man entscheidet.
- **Neulinge stehen auf dem Zettel selbst.** Ein Kreuz in der Spalte „neu" und
  keine Passnummer daneben — dann wird nicht geraten: Die Zeile ist blau
  markiert, die Felder für den neuen Spieler stehen offen, Vor- und Nachname
  vom Zettel sind eingetragen und die Wertungsklasse kommt aus der Spalte M/F.
  **Die Passnummer wählt man aus einer Liste der freien**: erst die echten
  Lücken im Register, dann die Nummern über der höchsten vergebenen. Vorbelegt
  ist die kleinste freie — und sind mehrere Neulinge dabei, bekommt jeder eine
  andere. Steht der Name trotz Kreuz schon im Spielerstamm, sagt die Zeile das
  (sonst entstünde eine zweite Nummer für dieselbe Person).
- **Wer ohne Kreuz noch in keiner Wertung steht**, lässt sich über „+ Neuen
  Spieler anlegen" genauso erfassen.
- **Die Punkte stehen daneben** und ändern sich mit jeder Zeile, die dazukommt
  oder wegfällt. Sie werden nie eingetippt.

Freigeben geht erst, wenn keine Zeile mehr offen ist.

**3 · Freigeben.** Jetzt erst wird gerechnet und abgelegt.

**Nachträglich berichtigen.** Unter der Upload-Maske stehen alle Turniere, die
über diese Seite hochgeladen wurden. Dort lassen sich **Datum und Spielort**
ändern oder das Turnier ganz entfernen — für den Fall, dass das Datum falsch
vom Zettel gelesen wurde und es erst Tage später auffällt (passiert im
September 2026 beim 70er: 29.09. statt 09.09.). Geändert wird nur die
Kopfzeile; stimmen Namen oder Reihenfolge nicht, gehört der Zettel noch einmal
hochgeladen — dasselbe Datum und Lokal ersetzt die alte Fassung. In der Liste
stehen nur Turniere, die über diese Seite hochgeladen wurden; was ausschließlich
in der Arbeitsmappe steht, gehört dort geändert (oder einmal als Zettel
hochgeladen, dann gilt die Fassung der Seite).

---

## Was dabei wohin geht

| Was | Wohin | Bleibt es dort? |
| --- | --- | --- |
| Das Foto | Anthropic (Erkennung) | Nein. Es wird nirgends gespeichert. |
| Platz, Passnummer, Punkte | `data/results-uploaded.ts` im Repository | Ja — das ist das Ergebnis. |
| Neue Spieler | `data/players-uploaded.ts` | Ja. |

Beide Dateien werden in **einem** Commit geschrieben
(`lib/mdc/ergebnis-commit.ts`, Git-Data-API). Zwei Commits wären zwei Neubauten
— und dazwischen läge ein Stand, in dem ein Ergebnis auf einen Spieler zeigt,
den es noch nicht gibt.

Der Commit steht am Ende als Link da: Man kann nachlesen, was genau geschrieben
wurde.

## Verhältnis zur Arbeitsmappe (geändert am 12.09.2026)

**Die Homepage ist die Hauptquelle.** Steht dasselbe Turnier (gleiches Datum,
gleiches Lokal) auch in der Arbeitsmappe, **gewinnt die hier freigegebene
Fassung**. Bis zum 12.09.2026 war es umgekehrt.

Der Grund: Was hier freigegeben wurde, ist am Bildschirm Zeile für Zeile gegen
den Zettel geprüft worden, und Berichtigungen (`data/corrections.ts`) hängen an
dieser Fassung. Gewönne die Mappe, würde beides beim nächsten Import still
überschrieben — und niemand merkte es.

**Die Mappe läuft anfangs parallel als Gegenprobe.** Genau dafür ist sie jetzt
da: `npx tsx scripts/mdc-check-saison.ts` vergleicht jedes doppelt geführte
Turnier und meldet

```
Gegenprobe Homepage ↔ Arbeitsmappe
  identisch  2026-09-06-siebziger
```

Steht dort `ABWEICHUNG`, sagen beide Quellen etwas Verschiedenes — dann
angesehen werden, welche stimmt. Es gilt die Fassung der Seite, aber
stillschweigend entschieden wird das nicht.

Ein Ergebnis berichtigen heißt weiterhin: dasselbe Turnier noch einmal
hochladen. Die alte Zeile wird ersetzt, nicht ergänzt — und das geht jetzt
auch, wenn die Mappe das Turnier schon führt.

---

## Einrichten (Vercel, MDC-Projekt)

Vier Variablen, alle **server-only** (kein `NEXT_PUBLIC_`), in Vercel als Typ
**Secret**:

| Variable | Wofür | Fehlt sie? |
| --- | --- | --- |
| `MDC_ADMIN_PASSWORD` | Zugang zu `/admin` | `/admin` bleibt die reine Demo, der Upload ist aus |
| `MDC_OCR_API_KEY` | Anthropic-Schlüssel zum Lesen des Zettels | Die Seite sagt, dass die Erkennung fehlt |
| `MDC_GITHUB_TOKEN` | Schreibrecht aufs Repository | Die Seite sagt, dass das Ablegen fehlt |
| `MDC_OCR_MODEL` | optional, Standard `claude-sonnet-5` | — |

Zum GitHub-Token: **Fine-grained personal access token**, beschränkt auf
`andistrehle/MDU`, Berechtigung **Contents: Read and write**. Mehr braucht es
nicht. Läuft es ab, meldet die Freigabe einen Fehler von GitHub — sie tut nicht
so, als hätte es geklappt.

Nichts davon vorgetäuscht: Solange etwas fehlt, zeigt `/admin/ergebnis` genau
an, welche Variable es ist, und bietet keine Schaltfläche an, die ins Leere
läuft.

### Passwortschutz ohne Cookie

`/admin` läuft über die Passwortabfrage des Browsers (HTTP Basic, in
`proxy.ts`). Eine Anmeldeseite bräuchte eine Sitzung und damit ein Cookie — die
MDC setzt keine, und das steht so in den Datenschutzhinweisen. Der Browser
merkt sich die Eingabe für die Sitzung; auf dem Handy fragt er einmal.

Das Passwort ändern heißt: Variable in Vercel ändern, Redeploy. Es steht an
keiner anderen Stelle.

---

## Grenzen

- **Handschrift bleibt Handschrift.** „Micky" und „Nicky", „13" und „18" sehen
  sich ähnlich. Der Prüfschritt ist deshalb kein Beiwerk, sondern der Kern:
  Das Modell darf raten, die Seite darf es nicht.
- **Ein Foto je Turnier.** Passt die Liste nicht auf ein Bild, muss der Zettel
  neu geschrieben oder das Ergebnis von Hand nachgetragen werden.
- **Felder außerhalb 4 bis 32 Startern** liegen außerhalb der offiziellen
  Punktetabelle. Die Seite rechnet nach demselben Muster weiter und weist
  ausdrücklich darauf hin.
- **Widerspruch nach Art. 21 DSGVO** wird hier noch nicht technisch erzwungen —
  wer der Veröffentlichung widersprochen hat, darf nicht aufgenommen werden.
  Solange es keinen solchen Fall gibt, steht das als Hinweis in den
  Datenschutzhinweisen; kommt einer, gehört eine Sperrliste dazu.

## Wo was steckt

| Datei | Aufgabe |
| --- | --- |
| `app/mdc/admin/ergebnis/page.tsx` | Die Seite |
| `app/mdc/admin/ergebnis/actions.ts` | Die beiden Schritte, alle Prüfungen |
| `components/mdc/ergebnis-upload.tsx` | Oberfläche, Verkleinern des Fotos |
| `lib/mdc/ergebnis-foto.ts` | Zettel lesen (Claude Vision) |
| `lib/mdc/spieler-zuordnung.ts` | Erkannten Namen einem Spieler zuordnen |
| `lib/mdc/ergebnis-commit.ts` | Commit über die GitHub-API |
| `lib/mdc/upload-config.ts` | Welche Zugangsdaten da sind — und welche nicht |
| `data/results-uploaded.ts` | Die abgelegten Turniere |
| `data/players-uploaded.ts` | Dabei neu erfasste Spieler |
| `proxy.ts` | Passwortabfrage für `/admin` |
