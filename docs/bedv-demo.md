# BeDV-Demo — Design- und Funktionsdemo

Unverbindliche Demo einer möglichen neuen Plattform für den **Bayerischen
Elektronik-Dart Verein e. V. (BeDV)**.

> **Kein Auftrag, keine offizielle Seite.** Die Demo wurde nicht vom BeDV
> beauftragt, ist keine Website des Verbands und wird nicht von ihm betrieben.
> Der Hinweis steht in der Fußzeile jeder Seite und im Kopf der Startseite.
> Die Seite ist dauerhaft auf `noindex` (`BEDV_INDEXABLE = false` in
> `lib/bedv/site.ts`) — eine zweite auffindbare „BeDV-Seite" im Suchindex soll
> gar nicht erst entstehen können.

---

## 1. Wichtig zuerst: Die bestehende Seite konnte nicht ausgewertet werden

Auftragsgemäß sollte `https://www.edart-bayern.de/` vor der Umsetzung
vollständig analysiert werden — Navigation, Ligastruktur, Mannschaften,
Tabellen, News, Logo, Farben, Typografie.

**Das war in der Bausession technisch nicht möglich:** Der Egress-Proxy der
Umgebung sperrt jeden ausgehenden Zugriff auf fremde Hosts (HTTP 403 vom
Proxy, auch für `edart-bayern.de`, `dartunion.de` und `example.com`). Erreichbar
waren nur Paketregister. Ein Umweg über Archiv- oder Cache-Spiegel wäre ein
Umgehen dieser Richtlinie gewesen und wurde bewusst nicht gegangen.

Daraus folgen zwei Dinge, die bei der Vorführung wichtig sind:

1. **Es wurde NICHTS von der bestehenden Seite übernommen** — kein Text, kein
   Bild, kein Logo, kein Mannschafts- oder Personenname, keine Tabelle. Es
   wurde auch nichts „aus dem Gedächtnis" nachgebaut: Ein nachempfundenes
   Verbandslogo wäre weder das echte noch ein ehrlicher Entwurf.
2. **Alle Inhalte sind Demo-Daten.** Jeder Datensatz trägt intern
   `demo: true` (siehe `data/bedv/typen.ts`).

### Was übernommen wurde und was nicht

| Bereich | Quelle |
|---|---|
| Verbandsname, Kurzform „BeDV" | aus dem Auftrag |
| Staffelstruktur (Bezirksliga · A · B1/B2 · C1–C3 Winter, C1–C5 Sommer) | aus dem Auftrag |
| Ligabetrieb-Begriffe (Spielbericht, Passnummer, Spielstätte, Automaten, Pokal, 180er/171er/High Finish/Short Leg) | E-Dart-Ligabetrieb allgemein |
| Logo, Farben, Typografie | **eigener Entwurf** (siehe Abschnitt 4) |
| Mannschaften, Personen, Ergebnisse, Tabellen, Ranglisten | **frei erfunden**, gerechnet |
| News, Termine, Downloads | **für diese Demo geschrieben** |
| Kontaktdaten, Ansprechpartner | **Platzhalter**, bewusst ohne Namen |

### Was für einen echten Auftritt nachgezogen werden müsste

Alles davon ist eine Datei, keine Umbauarbeit — die Oberfläche bleibt:

- **Logo** → `components/bedv/brand/logo.tsx` (Bildmarke gegen die echte tauschen)
- **Farben/Schriften** → Kopf von `app/bedv/bedv.css`
- **Staffeln** → `data/bedv/ligen.ts`
- **Mannschaften** → `data/bedv/teams.ts`
- **Spielstätten** → `data/bedv/spielstaetten.ts`
- **Spieler** → `data/bedv/spieler.ts`
- **Ergebnisse** → `data/bedv/spiele.ts` (Tabellen und Ranglisten rechnen sich daraus)
- **News/Termine/Downloads** → `data/bedv/news.ts`, `events.ts`, `downloads.ts`
- **Verbandsangaben** → `data/bedv/verband.ts`

---

## 2. Installation, Entwicklung, Build

Die Demo lebt im bestehenden MDU-Repository (wie die MDC unter `/mdc`) und
braucht keine eigene Einrichtung.

```bash
npm ci
npm run dev        # http://localhost:3000/bedv
npx tsc --noEmit   # Typprüfung
npm run build      # Produktionsbau
npm start          # Produktionsbau lokal ausliefern
```

**Keine Umgebungsvariablen nötig.** Die Demo spricht mit keinem Server: keine
Datenbank, keine Anmeldung, kein E-Mail-Versand, keine OCR-Schnittstelle, kein
Kartendienst. Sie lädt auch nichts von Dritten nach.

### Vercel

Die Demo wird mit dem MDU-Projekt mitdeployt und ist dann unter
`…/bedv` erreichbar. Sie ist gegen die MDU-Weichen abgeschirmt (`proxy.ts`):
Weder der Coming-Soon-Schalter noch der MDU-Anmelde-Guard greifen dort; die
MDU-Oberfläche (Bottom-Nav, Tour) blendet sich unter `/bedv` aus
(`components/mdu/global-chrome.tsx`), und der Supabase-Anmeldekontext wird
nicht gestellt (`components/mdu/app-providers.tsx`).

Soll sie auf eine **eigene Adresse**, ist der Weg derselbe wie bei der MDC:
dasselbe Repo ein zweites Mal deployen und in `lib/bedv/site.ts` `BEDV_BASE`
auf `''` schalten. Alle Verweise laufen über `bedvPath()`, es gibt keinen
einzigen hart geschriebenen `/bedv/…`-Pfad.

### ISR-Schreibvorgänge

Vercel zählt jedes Neurendern einer statischen Seite. Die Demo hat über 600
Seiten, deshalb steht im Layout `revalidate = 86400` (ein Tag). Nur die
Seiten, die wirklich am heutigen Datum hängen, setzen sich selbst einen
kürzeren Wert:

| Seite | Wert | Grund |
|---|---|---|
| Layout (alle Seiten) | 86 400 s | Spielplan ist relativ zu „heute" gerechnet |
| `/bedv`, `/bedv/ergebnisse` | 1 800 s | „Nächste Spiele" / „Letzte Ergebnisse" |
| `/bedv/events`, `/bedv/mein-bereich`, Spielbericht + Upload | 3 600 s | relative Datumsangaben |

Vor jedem neuen `revalidate` überlegen, für wie viele Seiten er gilt.

---

## 3. Datenstruktur

```
data/bedv/
  typen.ts            alle Typen (jeder Datensatz trägt `demo: true`)
  saison.ts           Spielzeiten + Spieltagskalender (relativ zu heute)
  ligen.ts            Staffelstruktur
  spielstaetten.ts    Lokale mit Adresse und Automatenzahl
  namen.ts            Namenspools für die erfundenen Personen
  teams.ts            Mannschaften je Staffel
  spieler.ts          Kader (6 je Mannschaft) + Spielstärke
  spiele.ts           Spielplan, Ergebnisse, Einzelspiele einer Begegnung
  tabelle.ts          Ligatabellen — GERECHNET
  rangliste.ts        Einzelranglisten — GERECHNET
  highlights.ts       180er/171er/High Finish/Short Leg — GERECHNET
  pokal.ts            Verbandspokal mit Turnierbaum
  news.ts             Beiträge
  events.ts           Termine
  downloads.ts        Download-Einträge (ohne Dateien, bewusst)
  verband.ts          Verbandsangaben (Platzhalter)
  demo-konten.ts      die vier Demo-Rollen
  benachrichtigungen.ts / verwaltung.ts   Vorgänge für Glocke und Ligaleitung
  suchindex.ts        flacher Suchindex (wird NUR beim Öffnen der Suche geladen)
```

Drei Entwurfsentscheidungen, die man kennen sollte:

**1. Alles wird gerechnet, nichts abgetippt.** Tabelle, Rangliste und
Highlights entstehen aus den Ergebnissen; die 18 Einzelspiele einer Begegnung
summieren sich exakt auf das Gesamtergebnis (`einzelspieleVon` justiert die
knappsten Entscheidungen nach). Wer im Gespräch ein Ergebnis anschaut und
danach die Tabelle öffnet, findet dieselbe Zahl. Ein Spielbericht, dessen
Einzelspiele ein anderes Ergebnis ergeben als die Tabelle, wäre in einer
Verkaufsdemo der peinlichste denkbare Fehler.

**2. Der Zufall ist deterministisch** (`lib/bedv/rng.ts`, Mulberry32 mit
Startwert aus der Kennung). Gleiche Kennung, gleiche Zahlen — in jedem Build
und auf jedem Gerät. Mit `Math.random()` stünden auf Server und Browser
verschiedene Werte, und React meldete Hydration-Fehler.

**3. Der Spieltagskalender ist relativ zu „heute"** (`data/bedv/saison.ts`).
Ein fest eingetragener Spielplan wäre nach ein paar Wochen abgelaufen, und
„Nächste Spiele" stünde voller Termine aus der Vergangenheit — auf dem ersten
Bildschirm, den der Gesprächspartner sieht. Preis: Der erste Spieltag der
laufenden Saison liegt rechnerisch acht Wochen zurück, je nach Vorführtag also
im Spätsommer. Für eine Demo der bessere Kompromiss.

**Umfang:** 2 Spielzeiten · 12 Staffeln · 86 Mannschaften · 516 Spieler ·
542 Begegnungen · 15 Pokalpaarungen · 8 Beiträge · 7 Termine.

---

## 4. Gestaltung

Eigenständige Identität, klar getrennt von MDU und MDC (alle Regeln hängen
unter `.bedv-root` in `app/bedv/bedv.css`).

- **Blau** als Grundton — bayerischer Landesverband, aber ein tiefes ruhiges
  Blau, das Tabellen trägt, statt des hellen Wappenblaus.
- **Genau eine Signalfarbe** (Bernstein) für das, was zählt: Tabellenführung,
  Pokal, aktueller Spieltag. Grün und Rot bleiben Sieg und Niederlage
  vorbehalten — sonst verlieren sie ihre Bedeutung.
- **Kontraste sind nachgemessen**, nicht geschätzt; die Werte stehen im Kopf
  der CSS-Datei. Bernstein steht nie als Text auf Weiß, immer als Fläche mit
  dunkler Schrift.
- **Schriften:** Outfit (Überschriften, Zahlen) + Inter (Fließtext, Tabellen —
  echte Tabellenziffern). Bewusst andere als bei MDU (Saira Condensed/Manrope).
- **Keine Bilddateien.** Dartscheibe, Verbandszeichen, Mannschaftswappen,
  Beitragsbilder und der Kartenausschnitt sind gezeichnetes SVG/CSS. Das
  spart Ladezeit, bleibt auf jedem Bildschirm scharf — und stellt vor allem
  sicher, dass die Demo kein fremdes Logo und kein Stockfoto zeigt.
- **Das Verbandszeichen** (`components/bedv/brand/logo.tsx`) ist ein eigener
  Entwurf: Sektorenring einer Dartscheibe außen, bayerische Rauten innen.
  Beim echten Auftrag tritt an diese Stelle das Verbandslogo — eine Datei.

Bewegung ist bewusst sparsam: Karten heben sich beim Zeigen um 2 px, die
Dartscheibe im Kopfbereich dreht sich einmal in zwei Minuten (nicht als
Bewegung wahrnehmbar), Erfolgsmeldungen ploppen einmal auf. Alles respektiert
`prefers-reduced-motion`.

---

## 5. Demo-Rollen

Es gibt **keine Authentifizierung**. Der „Demo-Login" (`/bedv/login`) wählt nur
eine Rolle und legt sie im `localStorage` des Geräts ab — kein Passwort, kein
Konto, kein Server, kein Cookie. Die Rolle lässt sich jederzeit wechseln.

| Rolle | Sieht zusätzlich |
|---|---|
| **Spieler** | eigene Statistik, nächstes Spiel, Mannschaft, Liga |
| **Teamkapitän** | Kader verwalten, Spieler nachmelden, Mannschaft melden, Spielbericht erfassen und hochladen |
| **Ligaleitung** | offene Mannschaftsmeldungen und Spielberichte mit Freigabe / Nachbesserung / Ablehnung |
| **Administration** | wie Ligaleitung, dazu Staffeln, Spielstätten, Zugänge (als Ausblick) |

Die Demo-Mannschaft ist **Ghost Darts** (B1-Liga), festgelegt in
`data/bedv/demo-konten.ts`.

---

## 6. Routen

**Öffentlich**

| Route | Inhalt |
|---|---|
| `/bedv` | Startseite: Kopfbereich, Staffeln, nächste Spiele, Ergebnisse, Tabellen, Pokal, News & Termine, Plattform-Ausblick |
| `/bedv/ligen` | alle Staffeln beider Spielzeiten |
| `/bedv/ligen/[slug]` | Liga mit 6 Reitern: Übersicht · Tabelle · Spielplan · Ergebnisse · Einzelrangliste · Highlights |
| `/bedv/teams` | Mannschaftsübersicht mit Staffel- und Ortsfilter |
| `/bedv/teams/[slug]` | Mannschaftsprofil: Kader, Spielstätte, Termine, Bilanz, Pokal, Tabelle |
| `/bedv/spieler` | Spielerübersicht, suchbar nach Name, Spitzname, Passnummer |
| `/bedv/spieler/[slug]` | Spielerprofil: Bilanz, Highlights mit Ligaplatzierung, Umfeld in der Rangliste |
| `/bedv/ergebnisse` | alle Ergebnisse, Liga und Spieltag umschaltbar ohne Seitenwechsel |
| `/bedv/pokal` | Verbandspokal mit Turnierbaum über alle Runden |
| `/bedv/news`, `/bedv/news/[slug]` | Beiträge |
| `/bedv/events` | Termine |
| `/bedv/downloads` | Unterlagen |
| `/bedv/spielstaetten` | Lokale mit Adresse, Automatenzahl, Mannschaften |
| `/bedv/archiv` | abgeschlossene Spielzeiten |
| `/bedv/verband`, `/bedv/kontakt` | Verband und Kontaktformular |

**Nach dem Demo-Login**

| Route | Inhalt |
|---|---|
| `/bedv/login` | Rollenwahl |
| `/bedv/mein-bereich` | Dashboard, Inhalt je Rolle |
| `/bedv/mein-bereich/mannschaft` | Kader verwalten, Spieler nachmelden |
| `/bedv/mein-bereich/mannschaft-anmelden` | Mannschaftsmeldung in sechs geführten Schritten |
| `/bedv/mein-bereich/spielbericht` | digitaler Spielbericht, Gesamtstand rechnet mit |
| `/bedv/mein-bereich/spielbericht/upload` | Papierbogen fotografieren (als Zukunftsfeature gekennzeichnet) |
| `/bedv/ligaleitung` | Arbeitsliste der Verwaltung |

Unbekannte Adressen unter `/bedv` landen auf der BeDV-eigenen 404
(`app/bedv/not-found.tsx` + `app/bedv/[...unbekannt]/page.tsx`) — ohne den
Auffangpfad zeigte Next dort die 404 der MDU.

---

## 7. Was simuliert ist

Alles, was in einer echten Plattform mit einem Server spräche, ist reine
Oberfläche — und sagt das an Ort und Stelle (`DemoHinweis`). Es wird **nichts
gespeichert, nichts versendet und nichts übertragen.**

| Funktion | Zustand in der Demo | Für den Echtbetrieb nötig |
|---|---|---|
| Anmeldung / Rollen | Rolle im `localStorage` | Benutzerkonten, Rollen- und Rechteverwaltung |
| Mannschaftsmeldung | geführte Schritte + Prüfseite | Vorgang mit Stand, Benachrichtigung, Freigabe-Workflow |
| Kader / Nachmeldung | Änderungen im Browser | Spielerstammdaten, Passwesen, Wechselfristen |
| Digitaler Spielbericht | rechnet, reicht nicht ein | Erfassung, Bestätigung beider Mannschaften, Wertungslauf |
| Papierbogen-Upload | nachgestellter Ablauf | Bildablage + Texterkennung (z. B. Claude Vision wie in der MDC) |
| Ligaleitung | Entscheidungen im Browser | Vorgangsverwaltung, Protokoll, Benachrichtigungen |
| Benachrichtigungen | feste Liste je Rolle | Ereignisse, E-Mail/Push |
| Kontaktformular | prüft, sendet nicht | Ticket oder E-Mail-Weiterleitung |
| Downloads | Hinweis statt Datei | Dateiablage |
| Karte auf der Spielstätte | gezeichneter Platzhalter | Kartendienst — dann zwingend mit Datenschutzhinweis |

**Der Papierbogen-Upload verlässt den Browser nicht:** Das gewählte Bild wird
nur lokal über `URL.createObjectURL` angezeigt. Nichts wird hochgeladen, an
keinen Dienst geschickt. In einer Demo ohne Datenschutzerklärung ist das nicht
nur sauber, sondern die Voraussetzung dafür, sie überhaupt vorführen zu dürfen.
Die „Erkennung" liefert bewusst **zwei unsichere Zeilen**, die die Freigabe
sperren, bis ein Mensch sie bestätigt. Eine Demo, in der die Erkennung zu
100 % funktioniert, verspricht etwas, das kein System halten kann.

---

## 8. Ablauf für die Vorführung

1. **Startseite** — „So könnte der neue BeDV-Auftritt aussehen."
2. Runterscrollen: nächste Spiele · Ergebnisse · Tabellen · Pokal · News.
3. **Liga öffnen** (`B1-Liga`) — sechs Reiter, alles auf einer Adresse.
4. **Mannschaft anklicken** (Ghost Darts) — „Jede Mannschaft bekommt ihr eigenes Profil."
5. **Spieler anklicken** — Bilanz und Bestwerte mit Ligaplatzierung.
6. **Suche öffnen** (Lupe oder ⌘/Strg + K), „ghost" tippen — Treffer ohne Wartezeit.
7. **Demo-Login → Teamkapitän.**
8. **Mein Bereich** — „Nach dem Login wird aus der Homepage eine Plattform."
9. **Mannschaft melden** — sechs Schritte, der Weiter-Knopf sagt, was fehlt.
10. **Spielbericht** — ein Ergebnis antippen, der Gesamtstand oben läuft mit.
11. **Papierbogen hochladen** → „Beispielbogen verwenden" (funktioniert auch
    ohne Foto zur Hand) → Erkennung → unsichere Zeilen bestätigen.
12. **Rolle wechseln → Ligaleitung.**
13. **Offene Meldungen** öffnen, freigeben — der Zähler oben geht sofort runter.

---

## 9. Geprüft

`npx tsc --noEmit` und `npm run build` sind grün. Zusätzlich automatisiert im
Browser durchgeklickt (Chromium):

- alle 23 Routen liefern 200, unbekannte Adressen sauber 404
- keine Konsolenfehler aus der Demo
- **kein waagrechtes Scrollen** bei 320 / 375 / 430 / 768 / 1440 px
- Suche, Glocke, Reiter, Rollenwechsel, Kaderpflege, Meldeassistent
  (Sperre des Weiter-Knopfs), Spielbericht (Gesamtstand rechnet mit),
  Papierbogen-Upload (Freigabe bleibt gesperrt, bis alle unsicheren Zeilen
  bestätigt sind) und die Freigabe in der Ligaleitung funktionieren

Der einzige verbliebene Netzwerkfehler beim lokalen Ausliefern ist
`/_vercel/insights/script.js` — die Web-Analytics der MDU, die es nur auf
Vercel gibt. Auf der Demo hat das keine Wirkung.
