# Tennis Kail — Premium-Demo

Eigenständige Demo-Web-App unter **`/tk`**, im selben Next.js-Projekt wie MDU und MDC,
aber ohne jede Verbindung zu beiden: eigenes Designsystem, eigene Datenschicht, eigene
Navigation, eigene Schriften. Zweck: dem Betreiber von
[tennis-kail.de](https://www.tennis-kail.de) zeigen, wie die Anlage online aussehen und
funktionieren könnte.

**Die Demo ist auf `noindex` gestellt** (Layout + `robots.ts`). Sie zeigt eine fremde
Marke und darf nie als deren offizielle Seite in Suchmaschinen auftauchen.

---

## Vorweg: was echt ist und was nicht

Das ist keine Fußnote, sondern die Grundlage jedes Gesprächs über diesen Entwurf.
Die vollständige Liste steht **in der Anwendung selbst**: `/tk/datenherkunft`
(Quelle: `data/tk/facility.ts`, Konstante `FACTS`).

**Belegt** (öffentlich recherchierbar, ohne Zugriff auf die Website selbst):

| Angabe | Quelle |
| --- | --- |
| Oberbiberger Straße 120, 81547 München (Untergiesing-Harlaching) | Branchenverzeichnisse |
| Telefon 089 648457 | Branchenverzeichnisse |
| Öffnungszeiten Harlaching: Mo–Fr 8–20, Sa 8–19, So 9–13 und 15–19 Uhr | Branchenverzeichnis |
| Lage am Perlacher Forst, über 50 Jahre in Betrieb | Selbstbeschreibung |
| Neuperlach: 8 Freiplätze (TC Neuperlach-Kail e. V.) + 3 Hallenplätze (Tennis Kail GmbH & Co. KG) | tcn-kail.de |
| Kurt-Eisner-Straße 30, 81735 München | tcn-kail.de |
| info@tcn-kail.de, platzbuchung@tcn-kail.de | tcn-kail.de |
| Trainer Niklas Persson und Ekkehard Dietrich (seit 1994) | tcn-kail.de |

**Demo** (Annahme oder frei erfunden, in der Oberfläche gekennzeichnet):
Anzahl und Belag der Plätze in Harlaching · alle Preise · alle Kurse, Camps und Events ·
das gesamte Shop-Sortiment · alle Buchungen, Kundendaten, Turnierergebnisse und
Spielpartner-Gesuche · Trainerin Mara Höfer · alle Wetterdaten.

**Und die Bilder?** Der Auftrag lautete: Originalmaterial hat Vorrang. Umgesetzt ist das
als vollständige Pipeline — **ausgeführt werden konnte sie nicht**: Die Umgebung, in der
diese Demo entstand, erreicht `www.tennis-kail.de` nicht, der Egress-Proxy blockt die
Domain (HTTP 403 im CONNECT-Tunnel, verifiziert per `curl` und über das Skript selbst).
Es wurde **kein einziges Originalbild geladen**. Statt Stockfotos einzusetzen — die eine
fremde Anlage zeigen würden — zeichnet die Anwendung eigene Grafiken. Details unter
[Abschnitt 35](#35-bildstrategie).

---

## 1. Projektvision

**UX-Konzept.** Eine Tennisanlage hat genau eine Frage, die Gäste online stellen: *Kann
ich spielen, und wann?* Alles andere — Preise, Trainer, Camps — ist Nachlauf. Die Demo
ordnet sich danach: Der erste Bildschirm beantwortet die Frage, jede weitere Seite ist
eine Vertiefung. Es gibt keinen Punkt in der Anwendung, an dem der Weg zur Buchung mehr
als zwei Tipps entfernt ist.

**UI-Konzept.** Kein Template-Look. Die Farben kommen von der Anlage: Ziegelrot als
Sandplatzfarbe, Waldgrün für den Perlacher Forst, Kreideweiß für die Linien, Ballgelb
genau einmal pro Bildschirm für das, was live ist. Als Display-Schrift eine Serife
(Fraunces) — ein Familienbetrieb mit fünf Jahrzehnten sieht nicht aus wie ein Start-up.

**Komponentenstruktur.** Drei Ebenen: `data/tk/` (Fakten), `lib/tk/` (Regeln),
`components/tk/` (Darstellung). Keine Geschäftslogik in Komponenten, keine Darstellung
in der Datenschicht. Deshalb rechnet das Buchungsraster mit denselben Funktionen wie das
Betreiber-Dashboard und kann gar nicht abweichen.

**Mock-Daten.** Siehe [Abschnitt 30](#30-mock-daten).

**Backend später.** Supabase (wie im MDU-Projekt): Postgres mit Row-Level-Security,
Auth, Storage für Bilder. Der Zuschnitt der Typen in `lib/tk/types.ts` ist bereits
tabellenfähig — Zeiten als Minuten seit Mitternacht, Preise in Cent, IDs statt
verschachtelter Objekte.

---

## 2. Analyse der bestehenden Website

**Was analysiert werden konnte.** Der direkte Zugriff auf tennis-kail.de war gesperrt.
Die Analyse stützt sich deshalb auf öffentlich zugängliche Angaben (siehe Tabelle oben)
und auf die verlinkte Vereinsseite tcn-kail.de.

**Befund.** Der Betrieb hat zwei Anlagen, elf bis neunzehn Plätze, Halle und Sand, ein
Trainerteam, über fünfzig Jahre Geschichte — und eine Platzvergabe, die **über das
Telefon läuft**. Genau dort liegt der Hebel: nicht in einer schöneren Startseite,
sondern darin, dass abends um acht niemand mehr anrufen muss, um zu erfahren, ob Platz 3
frei ist.

**Was daraus folgt.** Die Demo priorisiert Buchung, Platzstatus und Betreibersicht.
Repräsentation (Geschichte, Bilder, Vereinsleben) ist wichtig, aber nachgeordnet.

**Backend später.** Beim ersten Zugriff auf die echte Seite: `node
scripts/tk-fetch-images.mjs` ausführen, Inhalte gegen `data/tk/facility.ts` abgleichen,
`provenance`-Felder von `demo` auf `belegt` ziehen.

---

## 3. Markenidentität

**Woher die Marke kommt.** Zwei Dinge sind an Tennis Kail unverwechselbar: die Lage am
Perlacher Forst und die Dauer — über fünfzig Jahre derselbe Familienbetrieb. Beides ist
im Auftritt umgesetzt, nicht behauptet:

- **Ort.** Waldgrün als tragende Fläche, eine gezeichnete Baumkante in den Grafiken, die
  Sandtextur aus CSS-Verläufen statt aus einem Stockfoto.
- **Dauer.** Eine Serifenschrift mit weichen Übergängen, ruhige Abstände, keine
  Verlaufsflächen, keine Glasoptik. Der Ton ist Du-Form, sachlich, ohne
  Marketing-Vokabular („Erlebniswelt", „Premium-Experience" kommen nirgends vor).

**Wortmarke.** `Tennis • Kail` — der Punkt zwischen den Wörtern ist der Ball, in
Ballgelb. Reines CSS (`.tk-wordmark`), keine Bilddatei, skaliert bis 320 px Breite.

**Tonalität.** Sätze, die eine Anlage auch am Telefon sagen würde: „Bei Regen wird der
Platz automatisch gesperrt — die Buchung verfällt nicht." Keine Ausrufezeichen.

---

## 4. Designsystem

Vollständig in **`app/tk/tk.css`**, alles unter `.tk-root` gekapselt (dieselbe Trennung
wie bei der MDC-Demo, damit MDU-Styles nicht hineinragen).

**Farbtoken.**

| Rolle | Token | Wert |
| --- | --- | --- |
| Sandplatz, alle Handlungen | `--tk-clay` | `#A8503A` |
| Wald, dunkle Flächen | `--tk-forest` | `#16261D` |
| Kreide, Papierfläche | `--tk-chalk` / `--tk-paper` | `#F6F2EA` / `#FFFDF9` |
| Live-Signal | `--tk-ball` | `#D9E04F` |
| Frei / belegt / gesperrt | `--tk-free` / `--tk-busy` / `--tk-blocked` | `#276B43` / `#6B6252` / `#B4402F` |

Die Grautöne für Sekundärtext (`--tk-ink-dim`, `--tk-ink-faint`) und das Moosgrün
(`--tk-moss`) sind **nach einer Prüfung mit axe nachjustiert** worden — sie standen auf
getönten Flächen unter 4,5:1. Die Kommentare im CSS halten fest, warum welcher Wert so
ist.

**Typografie.** Fraunces (Variable, Display) und Inter (Variable, Funktionales),
JetBrains Mono für Zeiten und Preise (`.tk-num`, tabellarische Ziffern). Beide TK-
Schriften laufen als Variable Font — eine Datei je Familie statt einer je Schnitt.

**Bausteine.** `components/tk/ui/primitives.tsx` (Button, Card, Chip, Meter, Kpi, Steps,
Field, Empty, SectionHead) und `overlay.tsx` (Sheet, Segment). Die Denkweise ist die von
shadcn/ui — Komponenten liegen im Projekt, Varianten laufen über Klassen, `cn()` führt
zusammen —, **ohne** die Bibliothek und ohne Radix als Abhängigkeit. Das Aussehen kommt
aus `tk.css`, damit es genau eine Quelle gibt.

**Tailwind** wird für Layout, Abstände und Einzelfälle genutzt; alles Wiederkehrende
(Buchungsraster, Karten, Etiketten) sind benannte Klassen. Utility-Klassen für ein
Slot-Raster wären unlesbar geworden.

---

## 5. Informationsarchitektur

```
/tk                     Startseite — kann ich heute spielen?
├── /buchen             Platzbuchung (Raster, 7 Tage, beide Anlagen)
├── /training           Trainerbuchung (Trainer × Platz verschnitten)
├── /trainer            Trainerteam, Profile
├── /platzstatus        Wetter und Platzstatus, Platz für Platz
├── /anlage             Beide Standorte, alle Plätze, Anfahrt
├── /preise             Tarife nach Tageszeit, Abos, Regeln
├── /kids               Kinder und Jugend, Farbball-Stufen
├── /camps              Ferien-Camps und Erwachsenenkurse
├── /events             Termine
├── /turniere           Turnierverwaltung mit Tableau
├── /shop               Pro-Shop (Abholung, kein Versand)
├── /gutscheine         Gutschein gestalten
├── /spielpartner       Spielpartner-Finder
├── /kontakt            Kontakt, Anfahrt, Formular
├── /konto              Kundenkonto (Buchungen, Guthaben, Nachrichten, Profil)
├── /dashboard          Betreiber-Dashboard
├── /datenherkunft      Was ist echt, was ist Demo?
├── /impressum · /datenschutz
```

**Navigation.** Auf dem Telefon: eine Leiste unten mit fünf Zielen (Start, Buchen,
Status, Training, Konto) plus Menü in der Kopfzeile. Ab 1024 px wandert die
Hauptnavigation nach oben. Das ist keine Doppelung — die Leiste unten trägt, was man im
Gehen braucht, das Menü trägt den Rest.

---

## 6. Startseite

**UX.** Reihenfolge nach Absicht, nicht nach Firmenhierarchie: (1) Kann ich heute
spielen — Hero mit Live-Karte; (2) Warum überhaupt online — drei Argumente, die
tatsächlich für den Betrieb sprechen; (3) Wo — die zwei Anlagen mit Öffnungszeiten; (4)
Zahlen; (5) Mit wem — Trainerteam; (6) Was noch — Kinder, Camps, Events; (7) Wie komme
ich hin.

**UI.** Wechsel zwischen dunklen und hellen Abschnitten gibt Rhythmus. Kartenreihen sind
auf dem Telefon waagerecht scrollende „Rails" mit Snap-Punkten, ab Tablet ein Raster —
dieselbe Komponente, anderes Verhalten (`.tk-rail`).

**Komponenten.** `components/tk/home/hero.tsx`, dazu `SectionHead`, `Card`, `Chip`,
`TkImage`, `Reveal`/`Stagger`/`CountUp`.

**Backend später.** Die Live-Karte liest heute `findFreeBlocks()`; später dieselbe
Struktur aus einer Server Action. Die Startseite bleibt statisch mit ISR (`revalidate =
900`).

---

## 7. Hero-Bereich

**UX.** Links die Marke in einem Satz, rechts der Live-Status: Wetter, wie viele
Freiplätze bespielbar sind, die drei nächsten freien Stunden — jede davon ein direkter
Link ins Raster mit vorbelegtem Platz und Uhrzeit. Kein Karussell, kein Fließtext, kein
Scroll-Indikator.

**UI.** Dunkle Waldfläche, darüber eine gezeichnete Anlage aus der Vogelperspektive als
Lichtkeil (rotiert, 36 % Deckkraft), darüber ein Verlauf, der den Text freistellt. **Der
erste Bildschirm lädt kein einziges Bild** — Hintergrund und Textur sind SVG und CSS.

**Eine Lehre aus der Messung:** Der Hero war zunächst in `Reveal` (Framer Motion)
gewickelt. Das setzt `opacity: 0` und hebt es erst nach der Hydration auf — auf einem
langsamen Telefon ist die Überschrift dann sekundenlang unsichtbar, und ohne JavaScript
gar nicht zu sehen. Der Hero animiert jetzt über eine reine CSS-Animation (`.tk-enter`),
die beim ersten Paint läuft. Lighthouse-Performance stieg dadurch von 79 auf 84.

**Backend später.** Nichts Zusätzliches — der Hero konsumiert nur, was ohnehin da ist.

---

## 8. Platzbuchung

Der Kern der Anwendung. `components/tk/booking/booking-client.tsx`.

**UX.** Drei Schritte, keine Vorbereitung:

1. **Zeit wählen.** Wer die Seite öffnet, sieht sofort das Raster für heute. Standort,
   Platzart und Dauer sind Korrekturen an einer bereits sinnvollen Voreinstellung, keine
   Pflichtfelder davor.
2. **Auswahl prüfen.** Mehrere Zeitfenster sind möglich (Doppel an zwei Plätzen, zwei
   Termine hintereinander). Name und Kontakt kommen **erst hier** — wer vorher ein Konto
   anlegen muss, springt ab.
3. **Bestätigt.**

Details, die im Betrieb zählen:

- Das Raster springt beim Öffnen auf die aktuelle Uhrzeit. Wer abends um halb sieben
  schaut, scrollt nicht erst durch zehn vergangene Stunden.
- Freie Felder, in die der gewählte Block **nicht** hineinpasst, sind gedämpft
  dargestellt (`.tk-slot--kurz`) statt buchbar auszusehen. Wird so ein Feld doch
  angetippt, wählt das Panel automatisch die längste Dauer, die passt.
- Bei über 45 % Regenwahrscheinlichkeit steht über dem Raster ein Hinweis mit einem
  Knopf „Nur Halle zeigen".
- Die Legende benennt fünf Zustände: frei, frei-aber-zu-kurz, belegt, wetterbedingt
  gesperrt, vorbei, geschlossen.

**UI / Mobile first.** Waagerecht scrollendes Raster, Platzspalte bleibt stehen
(`position: sticky`), jede Zelle mindestens 46 × 46 px. Die Auswahlliste liegt auf dem
Telefon als feste Leiste über der Tab-Bar. Der Scrollbereich trägt `tabindex="0"` und
eine Beschriftung, damit er auch per Tastatur erreichbar ist.

**Mock-Daten.** Die Belegung kommt aus einer deterministischen Hash-Funktion über
(Platz, Datum, Uhrzeit) — kein `Math.random`, kein `Date.now`. Das hat drei Gründe:
Server und Browser rendern identisch (keine Hydration-Unterschiede), ein Neuladen zeigt
dasselbe Raster, und eine Vorführung ist wiederholbar. Die Nachfragekurve ist bewusst
ungleich verteilt: abends und am Wochenende voll, vormittags leer, Halle etwas voller
als Sand, Randplätze schwächer.

**Backend später.** `buildSlots()` behält seine Signatur; die Belegung kommt aus
`bookings` statt aus dem Hash. Nötig: ein Unique-Index auf `(court_id, date, from)`
gegen Doppelbuchungen und eine Transaktion beim Bestätigen. Zahlung optional (Stripe),
in der Demo bewusst „bezahlt wird an der Anlage".

---

## 9. Trainerbuchung

`components/tk/coaching/coach-booking.tsx`.

**UX.** Eine Trainerstunde ist keine Platzbuchung mit anderem Preis: Es müssen **zwei**
Kalender zusammenpassen. Die Oberfläche nimmt das ab und zeigt nur Zeitfenster, in denen
Trainer **und** Platz frei sind; der Platz wird automatisch mitgebucht und, wenn mehrere
frei sind, der günstigste gewählt. Der Preis ist aufgeschlüsselt (Honorar + Platzmiete),
bei Gruppen zusätzlich pro Person. Tage, an denen der gewählte Trainer nicht arbeitet,
sind in der Datumsleiste deaktiviert statt leer.

**UI.** Trainerauswahl als drei Karten mit Bild und Schwerpunkten, darunter Format
(Einzel / zu zweit / Gruppe), Datum, Zeit. Rechts eine mitlaufende Zusammenfassung, die
ab Tablet klebt.

**Mock-Daten.** `data/tk/coaches.ts` — Verfügbarkeiten als Wochentag-Fenster.

**Backend später.** Tabellen `coaches`, `coach_availability`, `coach_absences`. Die
Verschneidung in `options` bleibt unverändert; ergänzt würde ein Kalender-Export (ICS)
und eine Benachrichtigung an den Trainer.

---

## 10. Courts

`app/tk/anlage/page.tsx`.

**UX.** Wer hierherkommt, vergleicht. Deshalb steht jeder Platz als eigene Zeile mit
Belag, Flutlicht, Heizung, heutigem Status und direktem Link ins Raster — statt eines
Fließtexts, in dem man die Anzahl der Plätze suchen muss. Je Standort dazu: Anschrift,
Betreiber, Öffnungszeiten, drei Anfahrtswege.

**UI.** Zweispaltig ab 1024 px: links Bild und Beschreibung, rechts die Platzliste als
Karte mit Statusetiketten.

**Ehrlichkeit.** Unter der Liste für Harlaching steht ein Hinweis, dass die Aufteilung
dort eine Demo-Annahme ist. Gesteuert über `provenance` am Platz — verschwindet
automatisch, sobald die echten Daten eingetragen sind.

**Backend später.** Tabelle `courts` mit `surface`, `kind`, `floodlight`, `heated`,
`rate_group_id`.

---

## 11. Preise

**UX.** Preisseiten scheitern daran, dass man rechnen muss. Deshalb: oben drei Tafeln
(Halle, Sand, Training) mit den Werten, die 90 % der Fragen beantworten; darunter die
**vollständige** Tarifmatrix nach Wochentag und Uhrzeit; darunter die Regeln, die sonst
im Kleingedruckten verschwinden — Storno, Regen-Gutschrift, Abos.

**Wichtig:** Die Matrix rendert dieselben `RATES`, mit denen das Buchungsraster rechnet.
Es gibt keinen zweiten Datensatz, der auseinanderlaufen könnte.

**Mock-Daten.** `data/tk/pricing.ts`. Alle Werte sind Demo-Werte, angelehnt an
marktübliche Münchner Platzmieten; das steht auch auf der Seite.

**Backend später.** Tabelle `rates`; Preisänderungen brauchen ein Gültigkeitsdatum,
damit alte Buchungen ihren Preis behalten.

---

## 12. Trainer

**UX.** Pro Person: Kurzprofil, Lizenzen, Sprachen, Schwerpunkte, Standorte,
regelmäßige Zeiten, Preise, und ein Knopf, der direkt in die Buchung mit vorgewähltem
Trainer führt (`/tk/training?trainer=…`).

**UI.** Breite Karten mit Bild links, ab Tablet zweispaltig. Ein Etikett unterscheidet
sichtbar „belegte Person" von „Demo-Person" — bei echten Menschen ist das keine
Formalie.

**Backend später.** `coaches` mit Foto in Supabase Storage; Profiltexte über ein
Redaktionsfeld pflegbar.

---

## 13. Kids

**UX.** Eltern verstehen den Farbball-Stufenplan (rot → orange → grün/gelb) in dreißig
Sekunden, wenn man ihn zeigt. Er steht deshalb vor den Kursen. Danach die Kurse mit
Restplätzen, dann ein Aufklapper mit den vier Fragen, die tatsächlich immer kommen
(eigener Schläger? Probestunde? Regen? Gruppengröße?).

**UI.** Farbige Punkte für die Stufen, `<details>`-Elemente für die Fragen — nativ
zugänglich, funktioniert ohne JavaScript.

**Backend später.** `courses` mit `age_from`, `age_to`, `level`, `seats`.

---

## 14. Camps

**UX.** Kernversprechen zuerst (4:1 Betreuung, Schlechtwetter-Garantie, Betreuung 8–16
Uhr), dann die Camps mit Belegungsbalken und Warteliste, dann ein Tagesablauf als
Zeitleiste. Wer ein Kind anmeldet, will wissen, was zwischen 9 und 16 Uhr passiert.

**UI.** `CourseCard` mit Meter für die Belegung; ausgebuchte Kurse zeigen „Auf die
Warteliste" statt einer toten Schaltfläche.

**Backend später.** `course_registrations` mit Warteliste als Statusfeld, Nachrücken bei
Absagen, Geschwisterrabatt als Preisregel.

---

## 15. Events

**UX.** Chronologisch, mit Kategorie (Turnier, Clubabend, Saison, Für alle),
Anmeldestand und dem Hinweis, wenn keine Anmeldung nötig ist. Turniere verweisen in die
Turnierverwaltung, alles andere in eine Kontaktanfrage mit vorbelegtem Betreff.

**Backend später.** `events` mit optionaler Anmeldung; Termine pflegt der Betrieb im
Dashboard.

---

## 16. Shop

**Bewusste Entscheidung: Der Shop verkauft nichts online — er reserviert.** Ein
Familienbetrieb mit einer Theke braucht kein Zahlungssystem, keine Versandklassen und
keine Retourenabwicklung. Er braucht, dass jemand vorbeikommt und die Ware dann auch da
ist. Deshalb heißt der Knopf „Zurücklegen" und nicht „In den Warenkorb". Das ist auch
die ehrlichere Demo: Ein Kaufabschluss, den es nicht gibt, wäre ein Versprechen, das die
Anwendung nicht halten kann.

**UX.** Filter nach Kategorie, Bestandsanzeige, Bespannservice als Artikel („über
Nacht" / „Express"), Testschläger mit Anrechnung.

**Backend später.** `shop_items` mit Bestand; Reservierung erzeugt eine Aufgabe im
Dashboard. Ein echter Onlineverkauf wäre ein eigenes Projekt.

---

## 17. Kontakt

**UX.** Telefonnummer als erste, größte Handlung — die Anlage ist telefonisch erreichbar
und das soll so bleiben. Darunter ein Formular mit Betreffauswahl (per URL vorbelegbar:
`?anliegen=probestunde`), daneben beide Anlagen mit Zeiten und Anfahrt.

**Ehrlichkeit.** Das Formular tut nicht so, als würde es etwas verschicken. Es prüft die
Eingaben, zeigt an, **was** übermittelt worden wäre, und sagt, dass in der Demo nichts
rausgeht.

**Datenschutz als Gestaltung.** Statt einer eingebetteten Karte gibt es eine gezeichnete
Ortsskizze und einen Link zu OpenStreetMap. Eine eingebettete Karte würde schon beim
Laden Daten an Dritte senden — das gehört in eine Einwilligung, nicht in eine Demo.

**Backend später.** Server Action + Resend (im MDU-Projekt bereits im Einsatz), mit
ehrlicher Rückmeldung bei `skipped_no_provider` / `failed`.

---

## 18. Kundenkonto

`components/tk/account/account-client.tsx`.

**UX.** Ein Konto bei einer Tennisanlage hat vier Aufgaben: Wann spiele ich als
Nächstes, was ist offen, was ist mein Guthaben wert, wovon will ich hören. Eine
Übersicht, vier Reiter, keine Untermenüs.

- **Buchungen** — kommende Termine (mit Storno für selbst angelegte), Vergangenes,
  daneben die feste Abo-Stunde und der Lieblingsplatz.
- **Guthaben** — Guthaben und Gutscheine mit Restwert.
- **Nachrichten** — Posteingang plus eine Matrix, welche Art von Nachricht über welchen
  Kanal kommen soll.
- **Profil** — Stammdaten und ein Knopf „Demo-Daten löschen".

**Mock-Daten.** `data/tk/account.ts`. Die Demo-Buchungen liegen als **Tagesversatz** zum
Referenztag vor (`dayOffset`), nicht als festes Datum — „morgen" heißt in jeder
Vorführung wirklich morgen.

**Backend später.** Supabase Auth; `bookings` mit `customer_id` und RLS
(`auth.uid() = customer_id`).

---

## 19. Betreiber-Dashboard

`components/tk/admin/dashboard-client.tsx`.

**UX.** Kein Kontrollzentrum, sondern ein Tresen. Wer es aufmacht, will in fünf Sekunden
sehen: Was ist heute gebucht, was bringt das, wo klemmt es. Deshalb steht die
Tagesbelegung oben, nicht die Jahresstatistik. Vier Ansichten:

1. **Belegung** — Belegungsplan mit Namen in den Feldern, Tag vor/zurück, Auslastung je
   Platz, „Was heute auffällt", Schnellaktionen.
2. **Auslastung** — sieben Tage als Balken, Tabelle mit Auslastung, Umsatz und
   Regenwahrscheinlichkeit, dazu drei abgeleitete Empfehlungen.
3. **Kurse und Events** — Belegung und Umsatz je Kurs, Wartelisten sichtbar.
4. **Plätze sperren** — siehe [Abschnitt 33](#33-admin-funktionen).

**Warum das konsistent ist:** Die Kennzahlen rechnen aus derselben Belegung wie das
öffentliche Raster. Kundensicht und Betreibersicht können gar nicht auseinanderlaufen.

**UI.** Auch auf dem Telefon bedienbar — ein Platzwart sitzt selten am Schreibtisch. Das
Diagramm ist reines CSS (Balkenhöhe = Auslastung), keine Chart-Bibliothek.

**Backend später.** Aggregation über `bookings`; Rolle `operator` in RLS. Der
Belegungsplan wäre der einzige Ort, der Klarnamen zeigt — entsprechend eng abzusichern.

---

## 20. Wetterlogik

`lib/tk/weather.ts` — der inhaltlich interessanteste Teil der Demo.

**Ehrlich vorweg:** Hier hängt kein Wetterdienst dran. Die Vorhersage wird
deterministisch aus dem Datum errechnet (Jahresgang der Temperatur für München,
Tagesgang, Schauerspitzen am Nachmittag). Dieselbe Eingabe ergibt immer dieselbe
Ausgabe. Die Oberfläche schreibt das an jeder Stelle dazu.

**Interessant ist nicht das Wetter, sondern was daraus folgt.** `courtStatusFor()` leitet
für jeden einzelnen Platz einen Zustand ab:

| Regel | Folge |
| --- | --- |
| Halle | immer bespielbar |
| Sand, ≥ 8 mm Regen oder > 75 % Wahrscheinlichkeit | **gesperrt**, Buchung wird gutgeschrieben |
| Sand, ≥ 3 mm oder > 55 % | **feucht**, spielbar mit Hinweis |
| Höchsttemperatur ≤ 2 °C | **gesperrt** (Frost) |
| November bis März | **Winterpause** |

Diese Ableitung wirkt in die ganze Anwendung: gesperrte Plätze verschwinden als buchbar
aus dem Raster, die Statusseite zeigt sie rot, die Statusleiste in der Kopfzeile
aktualisiert sich, das Dashboard warnt, und der Umsatz zählt gesperrte Stunden nicht mit.

**UI der Statusseite.** Stundenverlauf mit Regensäulen, dann jeder Platz einzeln mit
Zustand und Empfehlung, dann sieben Tage im Überblick.

**Backend später.** Open-Meteo (kostenlos, ohne Schlüssel) — die Koordinaten beider
Anlagen stehen bereits in `data/tk/facility.ts`. Ein Cron-Job schreibt stündlich in eine
Tabelle `weather`; `courtStatusFor()` bleibt unverändert. Dazu ein Job, der bei einer
neu erkannten Sperre die betroffenen Buchungen gutschreibt und benachrichtigt.

---

## 21. Spielpartner-Finder

**UX.** Das größte Hindernis beim Tennis ist nicht der Platz, sondern der zweite Mensch.
Der Finder funktioniert ohne Konto und ohne Chat: Gesuch lesen, Zeit sehen, Kontakt
aufnehmen. Filter nur nach „Einzel/Doppel" und Standort — mehr Struktur schreckt ab.

**Datenschutz ist hier Gestaltung**, nicht Beiwerk: Nachnamen sind abgekürzt
(„Sebastian F."), es stehen keine Telefonnummern in der Liste, und der Kontakt liefe in
der Produktivversion über eine Weiterleitung. Das steht auch so auf der Seite.

**Backend später.** `partner_requests` mit Ablaufdatum (ein Gesuch von vor acht Monaten
hilft niemandem) und einer Freigabe durch den Betrieb.

---

## 22. Turnierverwaltung

**UX.** Melden mit zwei Angaben, Auslosung öffentlich, Ergebnis vom Platz aus. Das
Tableau ist die einzige Stelle der Anwendung, an der eine Tabelle wirklich eine Tabelle
sein darf: Auf dem Telefon scrollt es waagerecht, die Runden bleiben Spalten — ein
umgebrochener Turnierbaum ist unlesbar.

**UI.** Sieger grün hinterlegt mit Haken, Ergebnis in Monospace unter der Paarung,
kommende Runden als gestrichelter Platzhalter („wird ausgelost").

**Ehrlich:** Die Ergebniseingabe ist in dieser Demo nicht angeschlossen. Sie steht in
der Roadmap.

**Backend später.** `tournaments`, `tournament_entries`, `matches` mit Rundennummer und
Positionsindex; Auslosung serverseitig, Ergebnismeldung durch den Sieger mit Bestätigung
des Gegners.

---

## 23. Gutscheine

**UX.** Ein Gutschein ist ein Geschenk, kein Zahlungsvorgang. Deshalb steht die
**Vorschau** im Mittelpunkt: Betrag, Motiv und Grußzeile ändern die Karte live. Erst
danach kommt der Kaufweg.

**UI.** Drei Motive (Sand, Halle, Kinder), jeweils mit passender gezeichneter Grafik.
Betragsvorlagen sind als Nutzen benannt („Zwei Stunden Halle") statt als nackte Zahl.

**Backend später.** `vouchers` mit Code, Restwert und Buchungshistorie; Einlösung als
Teilzahlung. PDF-Erzeugung serverseitig.

---

## 24. Benachrichtigungen

**UX.** Zwei Seiten derselben Sache: der Posteingang im Konto und eine Matrix, die je
Anlass festlegt, ob Push, E-Mail oder SMS. Ohne Einstellung wird nichts verschickt.

**Die Anlässe** sind aus dem Betrieb abgeleitet, nicht aus einer Feature-Liste:
Buchungsbestätigung, **Wetterwarnung für gebuchte Freiplätze**, frei werdende
Wunschzeiten, Kurse und Wartelisten, passende Spielpartner, „Bespannung fertig".

**Backend später.** `notifications` + `notification_prefs`; Versand über Resend
(E-Mail), Web-Push für Push, SMS-Anbieter optional. Grundsatz aus dem MDU-Projekt: Der
Versand meldet ehrlich `skipped_no_provider` oder `failed`, statt Erfolg vorzutäuschen.

---

## 25. SEO

**Umgesetzt.** Metadaten je Seite (Titel-Template, Beschreibung), strukturierte Daten in
`lib/tk/seo.ts`:

- `SportsActivityLocation` je Standort mit Adresse, Koordinaten, Öffnungszeiten,
  Telefon und Platzanzahl als `amenityFeature` — daraus baut Google die Infobox, nach
  der Gäste tatsächlich suchen.
- `OfferCatalog` für die Preise.
- `Event` für Camps.

Dazu semantisches HTML (`<address>`, `<dl>`, `<table>` mit `<caption>` und `scope`),
sprechende URLs auf Deutsch, eine Überschriftenhierarchie ohne Sprünge.

**Bewusst nicht indexierbar.** `robots: { index: false }` im Layout und `/tk` in
`app/robots.ts`. Deshalb bewertet Lighthouse die SEO-Kategorie mit **63** — der einzige
Abzug ist „Page is blocked from indexing". Das ist gewollt: Der Entwurf zeigt eine fremde
Marke. Beim Livegang entfallen beide Sperren, dann greift der Rest.

---

## 26. Performance

Gemessen mit Lighthouse (Mobil, simuliertes Throttling) gegen den Produktions-Build:

| Seite | Performance | Barrierefreiheit | Best Practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/tk` | **84** | **100** | **100** | 63¹ | 4,4 s | 120 ms | **0** |
| `/tk/buchen` | **86** | **100** | **100** | 63¹ | 4,2 s | 70 ms | **0** |
| `/tk/preise` | **87** | **100** | **100** | 63¹ | 4,0 s | 60 ms | **0** |

¹ nur wegen `noindex`, siehe Abschnitt 25.

Zum Vergleich im selben Lauf: MDU-Startseite 81, MDC-Demo 92. Die Demo liegt also im
Rahmen dessen, was das Projekt hergibt.

**Was dafür getan wurde:**

- Der erste Bildschirm lädt **kein Bild** — Hero-Hintergrund und Texturen sind SVG/CSS.
- Ersatzgrafiken sind Inline-SVG (wenige Kilobyte statt Fotos).
- Beide TK-Schriften als Variable Font: zwei Dateien statt fünf.
- Der Hero animiert per CSS statt per JavaScript (siehe Abschnitt 7) — das hat die
  Startseite von 79 auf 84 gehoben.
- CLS ist auf allen Seiten 0: feste Seitenverhältnisse an Bildplätzen,
  `adjustFontFallback` von `next/font`.
- ISR statt dynamischem Rendering, wo es geht (`revalidate = 900`); nur Seiten, die die
  Uhrzeit brauchen, laufen dynamisch.

**Was bleibt.** Der LCP-Wert wird davon gebremst, dass das Wurzel-Layout des Projekts
drei MDU-Schriftfamilien vorlädt, die unter `/tk` niemand braucht. Das ließe sich nur
projektweit ändern und betrifft `/mdc` genauso — deshalb hier nicht angefasst.

---

## 27. Barrierefreiheit

Geprüft mit **axe-core** (WCAG 2.0/2.1, Stufen A und AA) über zwölf Seiten in zwei
Viewports. **Ergebnis: keine Verstöße.** Lighthouse bestätigt 100/100.

Das war nicht der erste Stand — gefunden und behoben wurden:

| Befund | Ursache | Behebung |
| --- | --- | --- |
| Heller Text auf Ballgelb, 1,3:1 | `.tk-header a { color: inherit }` überschrieb die Schaltflächenfarbe | Regel auf `a:not(.tk-btn)` eingegrenzt |
| Sekundärtext unter 4,5:1 auf getönten Flächen | `--tk-ink-dim`, `--tk-ink-faint` zu hell | nachgedunkelt (6,0:1 auf Papier) |
| Moosgrün auf Waldgrün, 3,0:1 | `--tk-moss` zu dunkel | aufgehellt (5,5:1) |
| Weiße Initialen auf Gelb, 2,3:1 | Ballgelb als Avatarfläche | dunkles Ocker (5,7:1) |
| `role="grid"` ohne Zeilenstruktur | falsche ARIA-Rolle am Buchungsraster | Rolle entfernt, Beschriftung behalten |
| Scrollbereiche nicht per Tastatur erreichbar | fehlendes `tabindex` | `tabindex="0"` + `role="region"` + Beschriftung an allen Rails und Rastern |
| Link nur an der Farbe erkennbar | Demo-Leiste | unterstrichen |
| Namen in vergangenen Feldern unlesbar | `opacity: 70 %` | eigene Schraffurklasse statt Transparenz |

**Weiter umgesetzt:** Sprungmarke „Zum Inhalt springen"; sichtbarer Fokus überall
(Ballgelb auf dunklen Flächen); Fokusfalle, Escape und Fokusrückgabe im Sheet;
`aria-label` an jedem Rasterfeld („Platz 3, 18:00 frei"); Fehlermeldungen im Formular mit
`role="alert"` und `aria-describedby`; Zielflächen mindestens 44 px;
`prefers-reduced-motion` schaltet Animationen **ab** statt sie nur zu verkürzen; `CountUp`
zeigt den Endwert im DOM, falls JavaScript aus ist.

---

## 28. Responsive Design

**Mobile first, wörtlich.** Alle Layouts starten einspaltig; Breakpoints fügen hinzu,
statt wegzunehmen.

| Breite | Verhalten |
| --- | --- |
| < 768 px | Eine Spalte, Kartenreihen als Snap-Rails, Navigation unten, Sheet fährt von unten ein |
| ≥ 768 px | Zweispaltige Raster, Rails werden zu Rastern, Sheet wird mittiger Dialog |
| ≥ 1024 px | Hauptnavigation oben, Tab-Bar aus, dreispaltige Abschnitte, klebende Seitenspalten |

**Geprüft:** Alle 18 Seiten in 390 × 844 und 1440 × 1000 — **kein waagerechter Überlauf
des Dokuments** an keiner Stelle (automatisiert geprüft). Breite Inhalte scrollen in
ihrem eigenen Container, nie die Seite.

---

## 29. Datenmodell

`lib/tk/types.ts` — bereits so geschnitten, dass die Typen als Tabellen taugen.

```
locations ──< courts ──< bookings >── customers
                │                        │
                │                        ├──< vouchers
             rates                       └──< notifications
coaches ──< coach_availability
        └──< bookings (type = 'training')
courses ──< course_registrations
events · tournaments ──< tournament_entries ──< matches
partner_requests
weather (date, hour, temp, rain_mm, rain_chance)
```

**Konventionen, die sich bewährt haben:**

- Zeiten als **Minuten seit Mitternacht** (`from`, `to`), Datum getrennt als ISO-String.
  Kein Zeitzonen-Ärger, direkt sortierbar, Raster rechnen trivial.
- Preise in **Cent** (`priceCents`) — keine Fließkomma-Rundungsfehler.
- **`provenance: 'belegt' | 'demo'`** an jedem Datensatz mit Realitätsbezug. Die
  Oberfläche liest das Feld und kennzeichnet entsprechend; beim Eintragen echter Daten
  verschwinden die Hinweise von selbst.
- Buchungen sind **ein** Typ für Platz, Training und Kurs, unterschieden über `type` —
  eine Liste im Konto, eine Auswertung im Dashboard.

---

## 30. Mock-Daten

| Datei | Inhalt | Herkunft |
| --- | --- | --- |
| `data/tk/facility.ts` | Marke, zwei Standorte, 19 Plätze, Öffnungszeiten, `FACTS` | teils belegt |
| `data/tk/pricing.ts` | 6 Tarife, 3 Preistafeln, Regeln | Demo |
| `data/tk/coaches.ts` | 3 Trainerprofile mit Verfügbarkeiten | 2 Personen belegt |
| `data/tk/courses.ts` | 3 Kids-Kurse, 3 Camps, 2 Erwachsenenkurse | Demo |
| `data/tk/events.ts` | 5 Events, 2 Turniere mit Tableau | Demo |
| `data/tk/shop.ts` | 10 Artikel in 5 Kategorien | Demo |
| `data/tk/account.ts` | Demo-Kundin, 6 Buchungen, 3 Gutscheine, 5 Nachrichten, 5 Gesuche | Demo |
| `data/tk/images.ts` | 28 Bildplätze mit Zuordnungsschlüsseln | — |
| `data/tk/original-images.json` | Manifest der Originalbilder | derzeit leer |

**Erzeugte Daten** (nicht in Dateien, sondern berechnet): Belegung aller Plätze über
`lib/tk/availability.ts`, Wetter über `lib/tk/weather.ts`. Beide deterministisch aus
Datum und Platz — reproduzierbar, hydrationssicher, ohne Datenbank.

**Laufzeitdaten** der Demo (Auswahl, Buchungen, gelesene Nachrichten) liegen im
`localStorage` unter `tk-demo-v1` und werden über „Demo-Daten löschen" im Profil
entfernt.

---

## 31. Technischer Stack

| Baustein | Umsetzung |
| --- | --- |
| **Next.js 16** (App Router, Turbopack) | vorhanden, gemeinsam mit MDU/MDC |
| **React 19** | vorhanden |
| **TypeScript** | durchgängig, `strict`; `npx tsc --noEmit` grün |
| **Tailwind CSS 4** | für Layout und Einzelfälle; Wiederkehrendes als benannte Klassen in `tk.css` |
| **Framer Motion** (`motion` 12) | neu hinzugefügt, gezielt eingesetzt (Abschnitt 34) |
| **shadcn/ui** | **nicht** als Paket installiert — siehe unten |

**Zu shadcn/ui, ehrlich:** Die Bibliothek ist nicht installiert. Umgesetzt ist ihre
Denkweise — Komponenten liegen im Projekt (`components/tk/ui/`), Varianten laufen über
Klassen, `cn()` führt Klassen zusammen —, aber ohne Radix und ohne ein zweites Theme im
Projekt. Gründe: Das Designsystem sollte genau eine Quelle haben (`tk.css`), und ein
zweiter Satz CSS-Variablen neben MDU und MDC hätte mehr gekostet als gebracht. Wer
später doch shadcn/ui möchte, tauscht `primitives.tsx` und `overlay.tsx` — die
aufrufenden Stellen ändern sich nicht.

---

## 32. Architektur

```
app/tk/                 Routen (Server Components, dünn)
  layout.tsx            Schriften, Kopf-/Fußzeile, Demo-Leiste, Store-Provider
  tk.css                Designsystem, komplett unter .tk-root
components/tk/
  ui/                   Grundbausteine (primitives, overlay, page-header)
  chrome/               Kopfzeile, Fußzeile, Tab-Leiste
  media/                Bildplatz + gezeichnete Ersatzbilder
  motion/               Reveal, Stagger, CountUp
  home/ booking/ coaching/ courses/ weather/ account/ admin/ shop/ vouchers/
  community/ contact/
lib/tk/
  types.ts              Datenmodell
  format.ts             Datum, Zeit, Preise (Europe/Berlin)
  availability.ts       Slot-Raster, freie Blöcke, Auslastung, Umsatz
  weather.ts            Wettersimulation + Ableitung Platzstatus
  seo.ts                strukturierte Daten
  store.tsx             Demo-Zustand (Context + localStorage)
data/tk/                Fakten und Mock-Daten
scripts/tk-fetch-images.mjs
```

**Regeln, die durchgehalten sind:**

1. **Serverseitig, wo möglich.** Client-Komponenten gibt es nur, wo es interaktiv wird
   (Buchung, Training, Konto, Dashboard, Shop, Gutscheine, Finder, Formular).
2. **Kein `new Date()` beim Rendern.** Der Referenztag kommt immer vom Server als
   `todayIso` in die Komponente. Sonst weichen Server- und Browser-HTML voneinander ab,
   sobald jemand um Mitternacht lädt.
3. **Kein `Math.random()`.** Alles Zufällige ist gehasht — deterministisch,
   reproduzierbar.
4. **Eine Rechenquelle.** Preise, Belegung und Status kommen für Gast und Betrieb aus
   denselben Funktionen.

**Abgrenzung.** `/tk` blendet die MDU-Oberfläche aus (`components/mdu/global-chrome.tsx`)
und ist in `app/robots.ts` gesperrt — dieselbe Behandlung wie `/mdc`.

---

## 33. Admin-Funktionen

Im Dashboard umgesetzt:

- **Belegungsplan** mit Namen, tageweise blätterbar, je Standort.
- **Auslastung und Umsatz** je Platz, je Tag, für sieben Tage im Voraus.
- **Platz sperren** — Panel mit Zeitraum, Grund (Pflege, Punktspiel, Turnier, Reparatur,
  Wetter) und einem Hinweistext für Gäste. Gesperrte Plätze verschwinden aus der
  Kundensicht; im Echtbetrieb würden betroffene Buchungen storniert, gutgeschrieben und
  die Gäste benachrichtigt.
- **Automatische Sperren** — die Wetterschwellen sind einsehbar aufgelistet.
- **Kurse und Events** — Belegung, Umsatz, Wartelisten; Anlegen/Bearbeiten als Rahmen.
- **Kundensicht öffnen** — direkter Sprung ins öffentliche Raster.

**Ehrlich:** Alle Aktionen wirken nur auf die Anzeige. Es gibt keine Datenbank dahinter.

**Backend später.** Rolle `operator` mit eigener RLS; jede Sperre und jede Stornierung
in ein Änderungsprotokoll, damit nachvollziehbar bleibt, wer wann was gesperrt hat.

---

## 34. Animationen

**Grundsatz: Bewegung erklärt Zusammenhänge, sie schmückt nicht.** Framer Motion
übernimmt vier Aufgaben und sonst nichts:

1. **Reveal** — Abschnitte kommen beim Scrollen einmal ruhig herein (nur unterhalb der
   Falz).
2. **Stagger** — Listen erscheinen kurz nacheinander statt gleichzeitig; das führt den
   Blick.
3. **CountUp** — Kennzahlen zählen hoch, wenn sie ins Bild kommen.
4. **Sheet** — Panels fahren von unten ein (Telefon) oder skalieren mittig auf (Desktop);
   `AnimatePresence` sorgt für einen sauberen Abgang.

**Was bewusst nicht animiert ist:** der Hero (siehe Abschnitt 7 — er darf nicht auf JS
warten), das Buchungsraster (Zellen, die sich bewegen, sind schwerer zu treffen), und
alle Zustandswechsel, die eine Aussage sind statt eines Übergangs.

**`prefers-reduced-motion`** schaltet in jeder Komponente über `useReducedMotion()` die
Animation komplett ab — nicht nur die Dauer. Zusätzlich neutralisiert eine CSS-Regel alle
Übergänge unter `.tk-root`.

---

## 35. Bildstrategie

**Auftrag:** Originalbilder analysieren, herunterladen, passend einbinden. Originale vor
Stockfotos.

**Umgesetzt als Zwei-Stufen-Modell:**

1. **`scripts/tk-fetch-images.mjs`** crawlt tennis-kail.de (nur diese Domain, maximal
   25 Seiten), sammelt `<img>`-Quellen und CSS-Hintergrundbilder, lädt sie nach
   `public/tk/original/`, liest die Bildmaße ohne Zusatzabhängigkeit aus den ersten
   Bytes und schreibt ein Manifest mit Ursprungs-URL und Schlüsselwörtern.
2. **28 Bildplätze** in `data/tk/images.ts` tragen Suchbegriffe („halle", „sand",
   „trainer", „camp"). `originalFor()` sucht im Manifest das Bild mit den meisten
   Treffern. Findet sich eines, rendert `TkImage` es über `next/image`; sonst zeichnet
   `FacilityArt` eine eigene Grafik.

**Ergebnis in dieser Umgebung — ehrlich:** Das Skript wurde ausgeführt und lief ins
Leere:

```
Seite übersprungen: https://www.tennis-kail.de/ — 403 Forbidden
0 Bilder gefunden
```

Der Egress-Proxy dieser Build-Umgebung blockt die Domain. Es liegt **kein einziges
Originalbild** vor.

**Warum trotzdem keine Stockfotos.** Ein gekauftes Foto einer fremden Anlage mit fremden
Menschen wäre eine Behauptung über Tennis Kail, die nicht stimmt — und genau das, was der
Auftrag ausschließt. Stattdessen zeichnet die Anwendung zehn Motivvarianten (Sandplatz in
Fluchtperspektive, Halle mit Bogenbindern, Vogelperspektive, Netz, Ball, Porträt, Kinder,
Camp, Event, Shop) in fünf Farbstimmungen, alle aus denselben Bauteilen — dadurch wirken
sie wie eine Serie und nicht wie zusammengesuchte Illustrationen. Kosten: wenige Kilobyte,
kein Netzwerkzugriff, beliebig skalierbar.

**Sobald Netzzugang besteht:**

```bash
node scripts/tk-fetch-images.mjs
```

Danach erscheinen die Fotos an allen passenden Stellen — **ohne eine Zeile Codeänderung**.
Vor einer Veröffentlichung ist die Freigabe des Betreibers einzuholen; das Manifest hält
je Bild die Ursprungs-URL fest.

---

## 36. Roadmap

**Für das Gespräch mit dem Betreiber (sofort):**

1. Originalbilder holen (`tk-fetch-images.mjs`) oder Fotos direkt übernehmen.
2. Echte Zahlen eintragen: Plätze in Harlaching, Preise, Kurse, Öffnungszeiten der
   Halle. Alles an einer Stelle je Thema in `data/tk/`.
3. `provenance` der bestätigten Angaben auf `belegt` setzen — die Demo-Hinweise
   verschwinden von selbst.

**Bis zur ersten echten Buchung:**

4. Supabase-Schema nach [Abschnitt 29](#29-datenmodell), RLS je Rolle.
5. Buchung als Server Action mit Unique-Index gegen Doppelbuchung.
6. Auth (E-Mail-Magic-Link genügt für den Anfang).
7. E-Mail-Versand über Resend, mit ehrlichem Fehlerstatus.
8. Open-Meteo statt Wettersimulation; Cron-Job für automatische Sperren und
   Gutschriften.
9. Impressum und Datenschutzerklärung vervollständigen; AV-Verträge mit Hosting-,
   E-Mail- und Wetterdienstleister.
10. `noindex` entfernen, eigene Domain, Sitemap.

**Danach, nach Bedarf:**

11. Abo-Verwaltung mit automatischer Serienbuchung.
12. Turnier-Ergebniseingabe vom Platz aus.
13. Zahlung (Stripe) — nur, wenn der Betrieb sie wirklich will; Barzahlung an der Anlage
    ist für viele Anlagen der bessere Weg.
14. Web-Push für frei werdende Wunschzeiten.
15. Kassenanbindung für den Pro-Shop.

---

## 37. Testing

**Was tatsächlich gelaufen ist** (alles gegen den Produktions-Build):

| Prüfung | Werkzeug | Ergebnis |
| --- | --- | --- |
| Typen | `npx tsc --noEmit` | grün (die zwei `PageProps`-Meldungen stammen aus MDU-Routen und bestehen unabhängig davon) |
| Produktions-Build | `npm run build` | grün, alle 18 TK-Routen |
| Seitenabruf | Playwright, 18 Seiten × 2 Viewports | alle 200, keine Konsolenfehler, keine Seitenfehler |
| Waagerechter Überlauf | Playwright, alle Seiten | nirgends |
| **User-Flows** | Playwright, 17 Schritte | **alle grün** |
| Barrierefreiheit | axe-core, WCAG A + AA, 12 Seiten × 2 Viewports | **keine Verstöße** |
| Performance | Lighthouse mobil | 84 / 86 / 87 |

**Die geprüften Flows:** Platz antippen → Panel → übernehmen → prüfen → bestätigen →
im Konto sehen → stornieren · Trainerstunde wählen → prüfen → bestätigen · Kursplatz
sichern · Warteliste bei ausgebuchtem Kurs · Shop-Artikel zurücklegen · Gutschein
gestalten und vormerken · Spielpartner kontaktieren · Kontaktformular (Fehlerfall und
Erfolgsfall) · Dashboard: alle vier Ansichten, Platz sperren · Demo-Daten löschen.

**Zwei Fehler, die dabei gefunden und behoben wurden** — beides keine Testartefakte,
sondern echte Mängel:

1. Freie Felder, in die der gewählte 90-Minuten-Block nicht passte, sahen buchbar aus und
   führten zu einer toten Schaltfläche. → Eigene Darstellung im Raster, automatische
   Dauerwahl im Panel.
2. Der Hero war bis zur Hydration unsichtbar. → CSS-Animation statt Framer Motion.

**Was fehlt.** Es gibt keine Unit-Tests im Repository. Für eine Produktivversion wären
die drei Rechenkerne die ersten Kandidaten — `availability.ts` (Slot-Raster,
Blockprüfung, Preis), `weather.ts` (Schwellwerte des Platzstatus) und `format.ts`
(Datumsrechnung über Monatsgrenzen). Alle drei sind reine Funktionen ohne Seiteneffekte
und damit unmittelbar testbar; das Projekt bringt bisher keinen Test-Runner mit, deshalb
wäre das ein eigener, bewusst zu treffender Schritt.

---

## 38. README

Kurzfassung für alle, die das Projekt aufmachen:

**Was ist das?** Ein unverbindlicher Entwurf für Tennis Kail unter `/tk`. Keine
Verbindung zur MDU-Plattform außer dem gemeinsamen Next.js-Rahmen.

**Starten**

```bash
npm install
npm run dev          # http://localhost:3000/tk
```

**Vor jedem Push** (Regel aus `CLAUDE.md`):

```bash
npx tsc --noEmit
npm run build
```

**Originalbilder nachladen**

```bash
node scripts/tk-fetch-images.mjs      # braucht Netzzugang zu tennis-kail.de
```

**Echte Daten eintragen** — alles in `data/tk/`, je Thema eine Datei. `provenance` von
`demo` auf `belegt` setzen, dann verschwinden die Demo-Hinweise in der Oberfläche.

**Was die Demo nicht tut:** keine E-Mails, keine Zahlungen, keine Datenbank, kein echtes
Wetter, keine Verbindung zur Anlage. Buchungen liegen im `localStorage` des Browsers.
Steht auch in der Anwendung unter `/tk/datenherkunft`.

**Nicht ändern ohne Grund:** `noindex` im Layout und der `/tk`-Eintrag in
`app/robots.ts`. Der Entwurf zeigt eine fremde Marke.
