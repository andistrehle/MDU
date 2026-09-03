# Munich Darts Challenge (MDC) — Demo-Web-App

Eigenständige Demo-Anwendung für die **Munich Darts Challenge**, Münchens
Ranking-Serie für Einzelspieler. Liegt im MDU-Repo, ist aber inhaltlich und
technisch ein getrenntes Projekt: eigene Datenschicht, eigene Navigation,
eigenes Erscheinungsbild, eigene Passnummern. Verbunden sind MDC und MDU nur
über je einen Link in der Fußzeile.

Einstieg: **`/mdc`**

## Warum unter `/mdc` und nicht unter `/`

Die MDC bekommt eine eigene Homepage mit eigener Domain; beide Seiten
verlinken dann aufeinander. Bis dahin läuft sie als Unterpfad derselben
Next.js-Anwendung — das spart ein zweites Deployment.

Zwei Stellen sind dadurch anders als in der Aufgabenstellung beschrieben:

| Aufgabenstellung | Hier | Grund |
| --- | --- | --- |
| `/admin` | `/mdc/admin` | `/admin` gehört zur MDU-Verwaltung |
| eigene Domain | Unterpfad `/mdc` | eine Anwendung, ein Deployment |

## Was von der MDU getrennt ist — und was noch nicht

**Getrennt:**

- **Datenschicht.** Kein einziger MDC-Baustein importiert etwas aus dem
  MDU-Teil. Nachprüfbar:
  `grep -rn "from '@/lib/data" app/mdc components/mdc data lib/mdc` → leer.
- **Anmeldung.** Der MDU-Anmeldekontext wird auf MDC-Seiten nicht mehr
  eingehängt (`components/mdu/app-providers.tsx`). Vorher baute er dort beim
  Seitenaufruf eine Verbindung zur MDU-Supabase auf — eine Abfrage an ein
  fremdes Konto-System, die niemand braucht.
- **Oberflächenelemente.** Bottom-Nav, Demo-Tour und Analytics der MDU
  blenden sich unter `/mdc` aus (`components/mdu/global-chrome.tsx`).
- **Middleware.** `/mdc` läuft an Coming-Soon-Schalter und Anmelde-Guard der
  MDU vorbei (`proxy.ts`). Sonst hätte ein MDU-Wartungsmodus die MDC gleich
  mit abgeschaltet, und `/mdc/admin` wäre unter den Guard für `/admin`
  gefallen. Die Sicherheits-Header gelten weiterhin.
- **Suchmaschinen.** `/mdc` ist auf noindex gesetzt und in der robots.txt
  gesperrt.

**Noch nicht getrennt** — beides verschwindet beim Umzug in ein eigenes
Repo von selbst, deshalb hier bewusst nicht angefasst:

- **Gemeinsames Grundgerüst.** `app/layout.tsx` und `app/globals.css` (836
  Zeilen MDU-Design) laden auf MDC-Seiten mit. Die MDC hält mit eigenen
  Regeln unter `.mdc-root` dagegen. Sauber trennen ließe sich das nur, indem
  alle MDU-Routen in eine Route-Gruppe wandern — ein Eingriff in jede Seite
  der Live-MDU, dessen Ergebnis beim Umzug ohnehin weggeworfen würde.
- **Gemeinsames JS-Bündel.** Der Anmeldecode läuft auf MDC-Seiten nicht mehr,
  wird aber weiterhin geladen: vier Bündel, zusammen rund 630 KB ungepackt.
  Herausbekommen ließe er sich über einen dynamischen Import — der birgt
  aber das Risiko, dass MDU-Seiten beim ersten Rendern kurz ohne
  Anmeldekontext dastehen. Das Risiko lohnt für einen Vorteil nicht, der
  beim Umzug gratis kommt.

## Umzug in ein eigenes Repo

Alles Nötige liegt in fünf Ordnern und ist dann nur noch Kopieren:

```
app/mdc  →  app/          components/mdc  →  components/
data/    →  data/         lib/mdc         →  lib/
public/mdc → public/
```

Dazu neu: eigenes `app/layout.tsx` (Schriften direkt laden), eigenes
`globals.css` mit nur den MDC-Tokens (die `:has`-Behelfe fallen ersatzlos
weg), schlanke Middleware nur für Sicherheits-Header, eigene `robots.ts`.
Im MDU-Repo: die fünf Ordner löschen, `GlobalChrome` und `AppProviders`
zurückbauen, die MDC-Weiche aus `proxy.ts` entfernen, im Footer auf die neue
Domain zeigen.

**Konten später verknüpfen:** Dass ein MDU-Spieler sich einmal mit beiden
Konten anmelden können soll, spricht nicht gegen die Trennung — im
Gegenteil. Zwei Systeme mit einer Verknüpfungstabelle dazwischen ist der
übliche Aufbau. Die Voraussetzung dafür ist schon da: Jeder MDC-Spieler hat
eine stabile Kennung (Spieler-ID plus MDC-Passnummer), an der eine
Verknüpfung andocken kann. Vorher zu klären sind die beiden doppelt
vergebenen Passnummern (inzwischen sechs Fälle, siehe unten) — genau solche
Fälle machen beim Verknüpfen Ärger.

## Seiten

| Route                    | Inhalt                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `/mdc`                   | Bühne, laufende Saison, Archiv-Top-Listen, Kennzahlen, Wochenspielplan, letzte Turniere, Spielprinzip |
| `/mdc/rangliste`         | Wertung der laufenden Saison 2026/27, gerechnet aus den Ergebnislisten |
| `/mdc/rangliste/archiv`  | Endrangliste 2025/26 (Männer/Frauen) mit Ausschüttung + Sommer-Ranking 2026 |
| `/mdc/turniere`          | Kommende Termine mit Meldestand, gespielte Turniere                |
| `/mdc/turniere/[id]`     | Podium, Ergebnisliste, Punkte, Turnierbaum                         |
| `/mdc/spieler`           | Spielerübersicht mit Suche über Name, Spitzname und Passnummer     |
| `/mdc/spieler/[id]`      | Profil: Endstand 2025/26, Sommer-Ranking, Formkurve, Turnierhistorie (alles Archiv) |
| `/mdc/spielorte`         | Spielorte nach Wochentag                                           |
| `/mdc/spielorte/[id]`    | Adresse, Automaten, Termine, letzte Turniere                       |
| `/mdc/regeln`            | Spielprinzip, Doppel-K.-o., Punktetabelle                          |
| `/mdc/admin`             | Oberflächen-Demo der Turnierverwaltung (ohne Anmeldung, ohne Speichern) |
| `/mdc/kontakt`           | Mitspielen, Spielort werden, Fragen zur Wertung                    |
| `/mdc/impressum`, `/mdc/datenschutz` | Platzhalter, rechtlich ungeprüft                       |

## Woher die Daten kommen

Drei Quellen, sauber getrennt — und auf der Seite auch so ausgewiesen:

**Echt** sind die Unterlagen des Betreibers:

| Wertung | Stand | Dateien |
| --- | --- | --- |
| Endrangliste 2025/26, Männer + Frauen | 27.07.2026 | `ranking-2025-26-men.ts`, `-women.ts` |
| Sommer-Ranking 2026, Männer + Frauen | 01.09.2026 | `ranking-sommer-2026-men.ts`, `-women.ts` |
| Ergebnislisten Saison 2026/27 | laufend | `results-2026-27.ts` |
| Punkteschlüssel, 4–32 Starter | — | `lib/mdc/points.ts` |
| Spielorte 2026/2027 | Aug. 2026 | `venues.ts` |

Die Männer-Endrangliste 2025/26 war lange unvollständig: Die Plätze **199–280**
fehlten, weil zwei Auswertungsseiten nicht vorlagen. Sie sind nachgeliefert und
eingetragen — 82 Zeilen, jede gegen die Schnitt-Spalte des Blattes gerechnet
(`Punkte / Anzahl TN`), die Platzfolge gegen die geteilten Plätze geprüft und
der Anschluss nach oben (Platz 198, 360 Punkte) wie nach unten (Platz 281, 94
Punkte) kontrolliert. Alle vier Auswertungen sind damit lückenlos.

`RANKING_MEN_GAP` steht jetzt auf `null`. Die Mechanik bleibt: Fehlt später
wieder eine Seite, trägt man dort einen Bereich ein und die Tabelle weist ihn
von selbst aus.

Nachgezählt, mit geteilten Plätzen verrechnet — punktgleiche Spieler teilen den
Platz, und die nächste Nummer überspringt die Gruppe. **Eine fehlende
Platznummer ist deshalb nicht automatisch eine Lücke**: In der Männerliste
fehlen 40 einzelne Nummern, und trotzdem ist sie lückenlos. Richtig prüft man
über die Gruppengröße (Platz + Gruppengröße = nächster Platz):

| Auswertung | Zeilen | Platzgruppen | letzter Platz | Lücken |
| --- | --- | --- | --- | --- |
| Endrangliste Männer 2025/26 | 323 | 277 | 323 | lückenlos |
| Endrangliste Frauen 2025/26 | 76 | 76 | 76 | lückenlos |
| Sommer-Ranking Männer 2026 | 54 | 52 | 54 | lückenlos |
| Sommer-Ranking Frauen 2026 | 14 | 14 | 14 | lückenlos |

Die Nachlieferung hat eine der offenen Passnummern aus den neuen
Ergebnislisten geklärt: **531 „Hubsi" = WÜRMTAL HUBSI**, Platz 212 — passend
dazu kam der Zettel aus dem DJK Würmtal. Vier bleiben offen (156, 243, 650 und
der Widerspruch bei 280); bei den Frauen half die Nachlieferung ohnehin nicht,
deren Endrangliste war schon vorher vollständig.

**Demo** sind allein die einzelnen Turniere (`tournaments.generated.ts`,
erzeugt von `scripts/mdc-generate-tournaments.mjs`). Sie zeigen, wie
Turnierseiten, Ergebnislisten, Meldestände und Turnierbäume aussehen —
**sie zahlen auf keine Rangliste ein.**

Der Spielerstamm entsteht aus allen vier Ranglisten-Dateien. Zusammengeführt
wird über die Spieler-ID (Namens-Slug), nicht über die Passnummer — siehe den
Abschnitt „Passnummern" unten.

Gegen Tippfehler abgesichert: Was sich ausrechnen lässt, wird ausgerechnet und
nicht gepflegt.

- `Schnitt` = Punkte / Anzahl TN
- `Auszahlung` = EZR-Betrag × Prozentsatz
- Spielerstamm = alle Spieler aller Ranglisten **und** aller Ergebnislisten
- Wertung 2026/27 = Summe der Ergebnislisten
- Turnierpunkte = `lib/mdc/points.ts` (offizielle Tabelle des Betreibers)

## Passnummern: drei Auffälligkeiten

Beim Abgleich der Saison-Endrangliste mit dem Sommer-Ranking sind drei Dinge
aufgefallen. Alle drei sind in `data/parse-ranking.ts` festgehalten:

**Dieselbe Person, andere Schreibweise** — zusammengeführt über
`CANONICAL_NAMES`, sonst würde aus einem Menschen zwei:

| Passnr. | Saison 2025/26 | Sommer-Ranking | übernommen |
| --- | --- | --- | --- |
| 53 | Schul Micky | Schul Mikky | Micky |
| 153 | Pogremino Jimmy | Pogremno Jimmy | Pogremno (vom Betreiber bestätigt) |
| 312 | Machete Reinhold | Behrend Reinhold | Behrend (echter Nachname) |

**Dieselbe Passnummer, offenbar zwei verschiedene Menschen** — NICHT
zusammengeführt, beide bleiben eigene Spieler:

| Passnr. | einmal | ein andermal |
| --- | --- | --- |
| 84 | Legende Uli | Harlekin Erna |
| 303 | Obstqi Harry | Friedl Lena |
| 281 | Hundseder Markus | Roll Morris |
| 282 | Grimm Nicole | Leschinski Luca |
| 302 | Aust Daniel | P Stefan |
| 280 | Stephan Thadeus (Rangliste) | „Moni", Zettel Ambasador |

Die unteren vier sind mit den nachgelieferten Seiten dazugekommen: 281, 282 und
302 stehen dort mit anderen Namen als in den übrigen Auswertungen. 280 ist ein
Widerspruch zwischen Rangliste und Ergebniszettel.

Was dort richtig ist, muss der Betreiber klären. `passNumberConflicts()` in
`data/players.ts` listet solche Fälle auf.

## Spielorte

**Echte Daten** aus der MDC-Spielorte-Übersicht für die Saison 2026/2027
(`data/venues.ts`). Elf Lokale mit festem Spieltag:

| Tag | Lokal | Adresse | Zeit | Automaten |
| --- | --- | --- | --- | --- |
| Mo | Legendary | Kurfürstenstraße 11, 80799 München | 20:00 | 2 |
| Mo | Harlekin | Oefelestraße 21, 81543 München | 20:00 | 3 |
| Mo | Bistro 118 | Drygalskiallee 118, 81477 München | 20:00 | 2 |
| Mo | Tonys Wirtshaus | Arnulfstraße 130, 80634 München | 20:00 | 2 |
| Di | Ambasador | Bodenseestraße 19, 81241 München | 20:00 | 4 |
| Di | 5 Sterne Boazn | Trappentreustraße 31, 80339 München | 19:00 | 2 |
| Mi | DJK Würmtal | Georgenstraße 35, 82852 Planegg | 19:30 | 2 |
| Mi | Machete 1 | Heimeranplatz 1, 80339 München | 19:00 | 2 |
| Mi | 70er | Tegernseer Landstraße 34, 81541 München | 19:00 | 2 |
| Do | Fiakerstüberl | Zenettistraße 30, 80337 München | 19:30 | 4 |
| Do | Lustiger Bauer | Kantstraße 29, 80809 München | 20:00 | 4 |

Zusätzlich kann **sonntags sowie freitags oder samstags in jedem MDC-Lokal**
ein Ranking stattfinden — ab mindestens vier Personen, die Wirte entscheiden
(`FLEXIBLE_RANKING_DAYS`, angezeigt auf der Spielorte-Seite).

Ein Lokal kann mehrere Spieltage haben (`weekdays: Weekday[]`); zurzeit hat
jedes genau einen.

> **Offen: Telefonnummern.** Die Vorlage nennt für jedes Lokal eine Nummer,
> überwiegend Mobilnummern. Sie sind gespeichert, werden aber **nicht
> angezeigt** — `PHONES_PUBLIC = false` in `data/venues.ts`. Auf `true`
> stellen, sobald geklärt ist, dass sie öffentlich stehen dürfen.

Nicht gespeichert, weil nicht in der Vorlage: Stadtteile, Beschreibungstexte,
Schlagworte. Die wären erfunden.

## Punkteschlüssel — offen

`lib/mdc/points.ts` enthält einen Schlüssel, der **nicht der echte ist**. Er
wurde aus den Beispielzahlen des Briefings zurückgerechnet (20 Starter →
221/211/200/190).

Die Gegenprobe zeigt, dass er die Wirklichkeit verfehlt: Nimmt man alle
Spieler mit genau einer Teilnahme — deren Punktzahl ist also das Ergebnis
eines einzelnen Turniers —, kommen 29 verschiedene Werte vor. Neun davon kann
der Schlüssel gar nicht erzeugen: 46, 61, 65, 79, 82, 103, 107, 112, 202.
Ausgerechnet **82** ist mit neun Vorkommen der häufigste Einzelwert.

Deshalb:

- Der Schlüssel dient **nur** dazu, die Demo-Turniere mit plausiblen Zahlen zu
  füllen.
- Auf `/mdc/regeln` steht **keine** Punktetabelle mehr, sondern der Hinweis,
  dass der genaue Schlüssel noch fehlt.
- Sobald der offizielle Schlüssel vorliegt: `POINT_TABLE` ersetzen und die
  Tabelle auf der Regeln-Seite wieder einblenden.

## Turnierbaum

`lib/mdc/bracket.ts` baut einen vollständigen Doppel-K.-o.-Baum für 8, 16 oder
32 Plätze (Winner Bracket, Loser Bracket, Finale) inklusive Freilosen.

Der Baum ist eine **Rekonstruktion aus der Endplatzierung**, kein Mitschnitt:
Gesetzt wird nach Endplatzierung, und in jeder Partie gewinnt der am Ende
besser Platzierte. Podium, Ergebnisliste und Baum widersprechen sich dadurch
nie. Sobald echte Match-Daten vorliegen, ersetzt man die Simulation — die
Struktur (`Match` in `data/types.ts`) steht schon.

## Saisons: eine laufende Wertung, ein Archiv

Stand dieser Fassung:

| Wertung | Zeitraum | Status |
| --- | --- | --- |
| Saison 2026/27 | seit 31.08.2026 | **laufend, noch ohne Ergebnisse** |
| Sommer-Ranking 2026 | 27.07.–30.08.2026 | abgeschlossen, im Archiv |
| Saison 2025/26 | 01.09.2025–26.07.2026 | abgeschlossen, im Archiv (mit Ausschüttung) |

Gepflegt wird das in `data/season.ts` über das Feld `current`. Wer dort eine
Saison auf `current: false` setzt und eine neue anlegt, verschiebt sie damit
automatisch ins Archiv (`ARCHIVED_SEASONS`).

**Die Wertung der laufenden Saison wird aus den Ergebnislisten gerechnet**
(`data/results-2026-27.ts`), nicht von Hand gepflegt: Punkte je Spieler
summiert, Teilnahmen gezählt, Schnitt = Punkte / Teilnahmen. Kommt eine Liste
dazu, ändert sich die Rangliste von selbst. Liegt keine Liste vor, ist
`RUNNING_HAS_RESULTS` falsch und die Seiten zeigen einen Hinweis statt einer
leeren Tabelle:

- `/mdc/rangliste` — laufende Saison; bei leerer Wertung Hinweis plus Weg ins Archiv
- `/mdc/rangliste/archiv` — Endstand 2025/26 (mit Ausschüttung) und Sommer-Ranking 2026
- Startseite — Abschnitt „Saison 2026/27" mit Hinweis, darunter „Archiv · Endstand 2025/26"

### Eine neue Ergebnisliste eintragen

1. Zeile für Zeile in `data/results-2026-27.ts` abtippen, Format wie auf dem
   Formular: `Platz | M/F | Passnr | Punkte | Name`. M/F leer lassen, wenn es
   auf dem Zettel nicht angekreuzt ist; Passnr leer lassen bei „neu".
2. `npx tsx scripts/mdc-check-results.ts` laufen lassen.

Das Skript findet genau die Fehler, die beim Abtippen von Handschrift
passieren:

- **Punkte gegen Feldgröße.** Der Punkteschlüssel hängt an Platz und
  Teilnehmerzahl, also lässt sich aus den Punkten ableiten, wie groß das Feld
  war — und das muss zur Zahl der Zeilen passen. Eine übersehene Zeile oder
  ein verlesener Platz fällt auf. (Bei DJK Würmtal war die Feldgröße wegen
  durchgestrichener Zeilen nicht abzählbar; die Punkte ließen nur n = 19 zu.)
- **Passnummer gegen Namen.** Steht die Nummer im Stamm, muss der dortige Name
  zum Zettelnamen passen. So sind sechs verlesene Ziffern aufgefallen, etwa
  427 statt 428 („Enrico") und 412 statt 482 („Klausi").
- **Summenprobe.** Punkte und Teilnahmen der Rangliste gegen die Zettel.

Was das Skript nicht kann: eine Nummer bestätigen, die im Stamm gar nicht
steht. Der enthält nur Spieler, die vorher schon Punkte hatten — wer neu ist,
fehlt dort zwangsläufig. Solche Zeilen laufen als eigene, neue Spieler und
stehen unter „beim Betreiber nachfragen".

Was der laufenden Wertung bewusst fehlt: die Ausschüttung. Sie steht erst am
Saisonende fest (siehe `components/mdc/division-switch.tsx`).

## Eigene Grafiken einsetzen (Logo, Bühnenfoto, Skyline, Werfer)

`components/mdc/logo.tsx` zeichnet Logo, Skyline und Dartwerfer selbst; die
Startseite zeichnet ihre eigene Dartscheibe. Liegt eine echte Datei vor, tritt
die Zeichnung dafür zurück. Dazu genügt es, die Datei abzulegen —
`lib/mdc/brand.ts` sucht sie beim Bauen, es ist keine Codezeile einzutragen:

| Datei in `public/mdc/` | ersetzt |
| --- | --- |
| `logo.svg` · `logo.png` · `logo.webp` · `logo.jpg` | gezeichnetes Logo in Kopf- und Fußzeile |
| `hero.webp` · `hero.jpg` · `hero.png` · `hero.avif` | gezeichnete Dartscheibe auf der Startseite |
| `skyline.svg` · `skyline.png` | nur die Skyline im Logo |
| `werfer.svg` · `werfer.png` | nur der Dartwerfer |

Fürs **Bühnenfoto** JPG oder WebP nehmen, nicht PNG — ein Foto als PNG wiegt
schnell das Zehnfache. Querformat ab 1600 Pixel Breite; das Motiv darf rechts
der Mitte sitzen, dorthin schaut der Ausschnitt (`object-position: 89 %`).
Die Bühne schneidet das Foto rund aus und löst den Rand nach außen auf, damit
keine dunkle Kante im weißen Layout steht. Am Handy steht das Foto über der
Schrift statt dahinter — halbdurchsichtig hinter dem Text wäre es matschig.

Größen und Ausrichtung in der Kopfzeile bleiben unverändert. Ist eine Logodatei
breiter als 1,6 : 1, gilt sie als Banner: Sie trägt den Schriftzug dann selbst,
und der gezeichnete Schriftzug daneben entfällt.

Die Datei erscheint eins zu eins auf der Seite — also nur eine lizenzierte
Fassung ablegen. Stock-Vorschauen tragen ein Wasserzeichen quer über der
Grafik und sind dafür nicht geeignet.

## Vorbereitet, aber bewusst nicht gebaut

Die Datentypen sind so geschnitten, dass sie sich auf Supabase-Tabellen
abbilden lassen: flache Datensätze, stabile String-IDs, Fremdschlüssel statt
verschachtelter Objekte, ISO-Datumsangaben. Damit ist der Weg frei für Login,
Online-Anmeldung, Live-Turnierverwaltung, automatische Ranglistenberechnung,
QR-Code-Check-in, Admin-Rollen und ein Saisonarchiv (`data/season.ts` führt
bereits mehrere Saisons).

Nichts davon ist angedeutet-aber-tot: Was es in der Demo nicht gibt, steht auch
nicht als Schaltfläche herum.

## Nicht erfunden

Die Endrangliste enthält echte Personen. Deshalb gilt für den Spielerstamm:
keine Fotos, keine Geburtsdaten, keine Wurfhand, kein Lieblings-Doppel. Gezeigt
wird, was die Auswertung hergibt — plus was sich daraus ableiten lässt (z. B.
das Stammlokal bei Spielern, die die MDC unter ihrem Lokalnamen führt:
„Legendary Armin“, „RG Gerd“). Statt Platzhalterfotos gibt es Initialen-Avatare.

## Vor einer Veröffentlichung

- Impressum und Datenschutz mit echten Angaben füllen und prüfen lassen
- Telefonnummern der Spielorte durch echte ersetzen (`data/venues.ts`, aktuell Blindnummern `089 5555 xx`)
- Männer-Plätze 199–280 nachtragen
- Klären, ob die Turnier-Demodaten bestehen bleiben oder echtem Spielbetrieb weichen
- `robots` in `app/mdc/layout.tsx` freigeben

## Daten neu erzeugen

```bash
node scripts/mdc-generate-tournaments.mjs   # schreibt data/tournaments.generated.ts
npx tsc --noEmit && npm run build
```

Das Skript sucht Platzierungen, die exakt die vorgegebenen Ranglistenwerte
ergeben, und gibt am Ende eine Kontrolltabelle aus (Ziel „OK“ je Zielspieler).
Es läuft deterministisch — gleicher Lauf, gleiche Datei.
