# Munich Darts Challenge (MDC) — Demo-Web-App

Eigenständige Demo-Anwendung für die **Munich Darts Challenge**, Münchens
Ranking-Serie für Einzelspieler. Liegt im MDU-Repo, ist aber inhaltlich und
technisch ein getrenntes Projekt: eigene Datenschicht, eigene Navigation,
eigenes Erscheinungsbild, eigene Passnummern. Verbunden sind MDC und MDU nur
über je einen Link in der Fußzeile.

Einstieg: **`/mdc`**

## Warum unter `/mdc` und nicht unter `/`

Die MDC soll später eine eigene Domain bekommen. Für die Abstimmung mit dem
Betreiber läuft sie vorerst als Unterpfad derselben Next.js-Anwendung — das
spart ein zweites Deployment. Der Umzug ist vorbereitet: Alles, was zur MDC
gehört, liegt in vier Ordnern (`app/mdc`, `components/mdc`, `data`, `lib/mdc`)
und greift auf nichts aus dem MDU-Teil zu.

Zwei Stellen sind dadurch anders als in der Aufgabenstellung beschrieben:

| Aufgabenstellung | Hier                | Grund                                   |
| ---------------- | ------------------- | --------------------------------------- |
| `/admin`         | `/mdc/admin`        | `/admin` gehört zur MDU-Verwaltung       |
| eigene Domain    | Unterpfad `/mdc`    | eine Anwendung, ein Deployment           |

Die MDU-Oberflächenelemente (Bottom-Nav, Demo-Tour, Analytics) blenden sich
unter `/mdc` selbst aus — siehe `components/mdu/global-chrome.tsx`.

Die MDC-Seiten sind auf **noindex** gesetzt (`app/mdc/layout.tsx`). Sie zeigen
echte Spielernamen und sind zur internen Abstimmung gedacht, nicht als
öffentliche Seite.

## Seiten

| Route                    | Inhalt                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `/mdc`                   | Bühne, Ranking-Widget, Kennzahlen, Wochenspielplan, letzte Turniere, Spielprinzip |
| `/mdc/rangliste`         | Endrangliste 2025/26 (Männer/Frauen) mit Ausschüttung + laufendes Sommer-Ranking |
| `/mdc/turniere`          | Kommende Termine mit Meldestand, gespielte Turniere                |
| `/mdc/turniere/[id]`     | Podium, Ergebnisliste, Punkte, Turnierbaum                         |
| `/mdc/spieler`           | Spielerübersicht mit Suche über Name, Spitzname und Passnummer     |
| `/mdc/spieler/[id]`      | Profil: Saison-Endstand, Sommerwertung, Formkurve, Turnierhistorie |
| `/mdc/spielorte`         | Spielorte nach Wochentag                                           |
| `/mdc/spielorte/[id]`    | Adresse, Automaten, Termine, letzte Turniere                       |
| `/mdc/regeln`            | Spielprinzip, Doppel-K.-o., Punktetabelle                          |
| `/mdc/admin`             | Oberflächen-Demo der Turnierverwaltung (ohne Anmeldung, ohne Speichern) |
| `/mdc/kontakt`           | Mitspielen, Spielort werden, Fragen zur Wertung                    |
| `/mdc/impressum`, `/mdc/datenschutz` | Platzhalter, rechtlich ungeprüft                       |

## Woher die Daten kommen

Zwei Quellen, sauber getrennt — und auf der Seite auch so ausgewiesen:

**Echt** ist die offizielle MDC-Endrangliste vom 27.07.2026, aus den
Auswertungsbildern des Betreibers übertragen:

- `data/ranking-2025-26-men.ts` — Plätze 1–198 und 281–323
- `data/ranking-2025-26-women.ts` — Plätze 1–76 (vollständig)
- Ausschüttung (Jackpot, EZR 65 %, folgendes Turnier, Übertrag) in `data/ranking-final.ts`

> **Offen:** Die Männer-Plätze **199–280** liegen noch nicht vor (zwei fehlende
> Auswertungsseiten). Sie werden in der Tabelle als Lücke ausgewiesen, statt
> geraten zu werden. Nachtragen: Zeilen in `data/ranking-2025-26-men.ts`
> ergänzen und `RANKING_MEN_GAP` entfernen.

**Demo** ist der laufende Spielbetrieb: das Sommer-Ranking 2026 mit 13
gespielten und 10 kommenden Turnieren (`data/tournaments.generated.ts`),
erzeugt von `scripts/mdc-generate-tournaments.mjs`.

Gegen Tippfehler abgesichert: Was sich ausrechnen lässt, wird ausgerechnet und
nicht gepflegt.

- `Schnitt` = Punkte / Anzahl TN
- `Auszahlung` = EZR-Betrag × Prozentsatz
- Sommer-Ranking = Summe der Turnierergebnisse
- Spielerstamm = alle Spieler beider Endranglisten
- Turnierpunkte = `lib/mdc/points.ts`

## Punkteschlüssel

`Punkte = round(Teilnehmer × Punktwert(Platz) / 100)`, Punktwert je 100
gemeldeter Spieler. Bei 20 Startern ergibt das 221 / 211 / 200 / 190 für die
Plätze 1 bis 4. Plätze, die im selben Durchgang ausscheiden, sind zu Gruppen
zusammengefasst (5.–6., 7.–8., 9.–12. …). Siehe `lib/mdc/points.ts`, angezeigt
auf `/mdc/regeln`.

## Turnierbaum

`lib/mdc/bracket.ts` baut einen vollständigen Doppel-K.-o.-Baum für 8, 16 oder
32 Plätze (Winner Bracket, Loser Bracket, Finale) inklusive Freilosen.

Der Baum ist eine **Rekonstruktion aus der Endplatzierung**, kein Mitschnitt:
Gesetzt wird nach Endplatzierung, und in jeder Partie gewinnt der am Ende
besser Platzierte. Podium, Ergebnisliste und Baum widersprechen sich dadurch
nie. Sobald echte Match-Daten vorliegen, ersetzt man die Simulation — die
Struktur (`Match` in `data/types.ts`) steht schon.

## Eigene Skyline-Grafik einsetzen

Das Zeichen (`components/mdc/logo.tsx`) zeichnet die Münchner Silhouette
selbst. Liegt eine lizenzierte Grafikdatei vor, ersetzt sie die Zeichnung in
zwei Schritten:

1. Datei nach `public/mdc/skyline.svg` legen (SVG bevorzugt; PNG mit
   durchsichtigem Hintergrund geht auch)
2. In `components/mdc/logo.tsx` ganz oben eintragen:
   `const SKYLINE_IMAGE: string | null = '/mdc/skyline.svg';`

Oval, rote Linie und alle Größen bleiben unverändert. Ohne Eintrag greift die
gezeichnete Fassung.

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
