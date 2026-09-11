@AGENTS.md

# MDU-Plattform — Projekt-Briefing für Claude

Online-Plattform der **Münchner Dart Union** (Liga-Spielbetrieb: Tabellen, Spielpläne,
Teams/Spieler-Profile, Online-Mannschaftsanmeldung, digitaler Spielbericht, OCR-Upload).
Live: **https://www.mdudarts.de** (Apex 308 → www) · Repo: `andistrehle/MDU` (main) · Deploy: Vercel (auto bei Push).

## Stack
Next.js (App Router, Turbopack) · Supabase (Auth/DB/Storage, **eine gemeinsame Prod-DB für
localhost UND live!**) · Vercel · Cloudflare (nur DNS, Website-Records „DNS only") ·
Resend (E-Mail) · Anthropic Claude Vision (OCR, `lib/ocr/`).

## Arbeitsweise (vom Betreiber festgelegt)
- **Fertige Änderungen direkt committen und auf `main` pushen — ohne nachzufragen.**
- Vor jedem Push: `npx tsc --noEmit` und `npm run build` müssen grün sein.
- Vor dem Push `git pull --rebase origin main` (eine GitHub-Action pusht ebenfalls auf main).
- Commit-Footer: `Co-Authored-By: Claude <noreply@anthropic.com>` (Modellname einsetzen).
- UI-Texte auf Deutsch, Du-Form; Ton freundlich, kein Marketing-Sprech.
- **Ehrlichkeitsprinzip:** nie Erfolg vortäuschen (E-Mail-Versand meldet ehrlich
  `skipped_no_provider`/`failed`; OCR übernimmt nie ungeprüft; keine erfundenen Daten/Features).

## Nicht ändern (bewusste Entscheidungen)
- **Profilbild ist standardmäßig öffentlich** (Checkbox vorausgewählt, Opt-out; Art. 6 I f DSGVO).
  NICHT auf Opt-in umstellen — wurde ausdrücklich so entschieden. Spitzname bleibt Opt-in.
- **`SITE_INDEXABLE = false`** in `lib/site-config.ts`: Seite ist erreichbar, aber noindex
  (Pre-Go-live). Erst beim offiziellen Go-live auf `true`.
- Rechtstexte (Impressum/Datenschutz/Nutzungs-/Spielbedingungen) sind DSB- und anwaltlich
  durchgeprüft; inhaltliche Änderungen nur auf Anweisung.

## Datenarchitektur (wichtig!)
- Liga-Daten: statische Basis in `lib/data.ts` + `lib/data/imported-*.json`
  (Merge in `lib/data/matches.ts`; dartunion.de ist autoritativ für Tabellen/Ranglisten).
- **Saison 2025/2026 ist beendet und manuell eingefroren** (letzte 2 Ergebnisse + C-Liga-Tabelle/
  Rangliste von Hand, da dartunion sie noch nicht hatte). Deshalb ist der tägliche Import-Cron in
  `.github/workflows/import-dartunion-results.yml` **pausiert** (auskommentiert; manuell per
  workflow_dispatch möglich). Ein Import-Lauf würde die manuellen Werte überschreiben —
  erst reaktivieren, wenn dartunion die Ergebnisse nachgetragen hat (Saisonstart 26/27).
- Beim Saisonstart 26/27 außerdem: Liga-Status-Texte in `components/mdu/league-detail-client.tsx`
  sind hardcoded „abgeschlossen" → dann dynamisch aus offenen Spielen ableiten.

## Supabase = Produktivdatenbank (Vorsicht bei Schreibaktionen)
Schreibende Skripte (`scripts/*.mjs`, Service-Role) treffen echte Daten. Demo-Daten fürs
Einführungsvideo (Demo-Kapitän `demo.kapitaen@example.com`, Demo-Spieler `demo.spieler@example.com`,
Demo-Anmeldung „DC Demo München", Demo-Benachrichtigungen) liegen noch in der DB —
**nach der Videoproduktion mit `node scripts/cleanup-demo-video.mjs` entfernen.**

## ENV (Namen; Werte NIE committen)
`.env.example` ist die Referenz. Lokal in `.env.local`, produktiv in Vercel gesetzt:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` (server-only), `RESEND_API_KEY`, `EMAIL_FROM`,
`OCR_FEATURE_ENABLED`, `OCR_PROVIDER` (claude|stub), `OCR_MODEL`, `OCR_API_KEY`.
Cloud-/Handy-Sessions haben KEINE `.env.local` — DB-Skripte dort nur ausführen, wenn die
ENV in der Session-Umgebung konfiguriert ist.

## Offene Punkte / Roadmap
Maßgeblich: **`docs/BACKLOG.md`** (Abschnitte „Vor Go-live" und „Bekannte To-dos").
Kurzfassung: Go-live = `SITE_INDEXABLE=true` + `NEXT_PUBLIC_SITE_URL` + Supabase-Auth-URLs
auf www.mdudarts.de + Testuser löschen + externe anwaltliche Freigabe (Banner in `LegalPage`
entfernen) + AVV mit Dienstleistern. Einführungsvideo: Konzept/Runsheet in
`docs/einfuehrungsvideo-*.md` (Aufnahme erfolgt, Schnitt in HeyGen/CapCut läuft).

## Zweites Projekt im Repo: Munich Darts Challenge (MDC)
Unter **`/mdc`** liegt eine eigenständige Demo-Web-App der Munich Darts Challenge
(Einzelspieler-Ranglistenserie, eigene Passnummern). **Keine Verknüpfung zur MDU** —
eigene Datenschicht (`data/`), eigene Komponenten (`components/mdc/`), eigene Helfer
(`lib/mdc/`), eigenes Design (`app/mdc/mdc.css`), noindex. Die MDU-Chrome (Bottom-Nav,
Demo-Tour, Analytics) blendet sich dort über `components/mdu/global-chrome.tsx` aus.
Details, Datenherkunft und offene Punkte: **`docs/mdc-demo.md`**.
**Arbeitsweise auch hier: direkt auf `main` committen und pushen — keine Pull
Requests.** Jeder PR erzeugt einen Vercel-Kommentar und damit eine E-Mail an den
Betreiber; bei kleinen Anpassungen (Farbe, Logo, neuer Spielort) steht das in
keinem Verhältnis. Ein PR nur, wenn es wirklich etwas zu prüfen gibt.
Wichtig: **Alle Daten sind echt** (echte Personen) — Ranglisten und
Einzelergebnisse beider Saisons, importiert aus den Excel-Mappen des Betreibers
(`scripts/mdc-import-saison.py <mappe> <saison>`; die Mappen selbst gehören
nicht ins Repo, sie enthalten das komplette Teilnehmerregister). Erzeugt werden
je Saison `data/results-<saison>.generated.ts` und `data/ranking-<saison>-*.ts`
— diese Dateien nie von Hand ändern. Prüfen mit
`npx tsx scripts/mdc-check-saison.ts`. Demo-Turniere gibt es nicht mehr.
**Zweite Domain (seit 06.09.2026 live):** Die MDC läuft unter
**mdc-ranking.de** — dasselbe Repo ist ein zweites Mal bei Vercel deployed,
dort schaltet `NEXT_PUBLIC_MDC_STANDALONE=1` auf Wurzelpfade um
(`lib/mdc/site.ts`, `proxy.ts`). Im MDU-Projekt sorgt `NEXT_PUBLIC_MDC_MOVED=1`
dafür, dass `mdudarts.de/mdc/...` dauerhaft dorthin weiterleitet. Im
MDC-Projekt KEINE Supabase-/Resend-/OCR-Variablen setzen — ohne sie macht die
Seite keine DB-Aufrufe und setzt keine Cookies, genau wie im Datenschutz
beschrieben. Verweise innerhalb der MDC immer über `mdcPath()`, nie hart
`/mdc/...` — sonst zeigen sie auf der eigenen Domain ins Leere. Anders als die
MDU ist die MDC **indexiert** (`MDC_INDEXABLE`, sobald die Pflichtangaben
vollständig sind). Ablauf, Abnahme und offene Punkte:
`docs/mdc-domain-umzug.md`.
Rechtstexte der MDC: `data/mdc-legal.ts` (Anbieter = wie MDU); ohne
vollständige Angaben bleibt die Seite automatisch noindex.
**Ergebnis-Upload:** Unter `/admin/ergebnis` kann die Turnierleitung den
Ergebniszettel fotografieren; Claude Vision liest ihn, die erkannte Liste
wird am Bildschirm geprüft und erst dann freigegeben. Die Punkte kommen
immer aus `pointsFor`, nie vom Zettel. **Neulinge stehen auf dem Zettel:**
Kreuz in der Spalte „neu" + leere PASSNR → `ordneSpielerZu` rät gar nicht erst
(`quelle: 'neu'`), die Oberfläche macht die Felder für den neuen Spieler auf,
Name vom Zettel, Wertungsklasse aus der Spalte M/F, und die Passnummer kommt
aus einer Liste der freien (Lücken des Registers zuerst, `passUebersicht()`);
bei mehreren Neulingen bekommt jeder eine andere. Steht der Name trotz Kreuz
schon im Stamm, wird das gemeldet statt still eine zweite Nummer anzulegen.
Freigegebene Turniere landen als
Commit in `data/results-uploaded.ts` (neue Spieler in
`data/players-uploaded.ts`) — beides von der Seite geschrieben, die Form
aber ganz normal von Hand änderbar. **Die Arbeitsmappe hat Vorrang:** Steht
dasselbe Turnier später dort, wird die hochgeladene Zeile ignoriert.
**Nachträglich berichtigen:** Unter der Upload-Maske listet
`components/mdc/turnier-korrektur.tsx` alle hochgeladenen Turniere; Datum und
Spielort lassen sich ändern, das Turnier ganz entfernen
(`lib/mdc/turnier-commit.ts`, schreibt dieselbe Datei). Nur `source: 'upload'` —
Mappen-Turniere stehen nicht in der Liste und werden serverseitig abgelehnt,
sie kämen beim nächsten Import zurück. An der Ergebnisliste ändert das nichts:
Dafür den Zettel neu hochladen, gleiche Kennung ersetzt die alte Zeile.
`/admin` ist per Passwortabfrage des Browsers geschützt (HTTP Basic in
`proxy.ts`, KEIN Cookie — die Zusage „keine Cookies" im Datenschutz gilt
weiter). Nötige ENV im MDC-Projekt: `MDC_ADMIN_PASSWORD`, `MDC_OCR_API_KEY`,
`MDC_GITHUB_TOKEN` (fehlt eine, sagt die Seite das und schaltet ab).
Ändert sich etwas am Foto-Ablauf (anderer Dienst, Fotos speichern,
Datenbank), MUSS Ziffer 9 der Datenschutzhinweise mitgeändert werden.
Ablauf, Grenzen und Einrichtung: `docs/mdc-ergebnis-upload.md`.
**News:** Unter `/admin/news` schreibt die Turnierleitung Beiträge; sie
landen als Commit in `data/news.ts` (JSON-Array in der Datei, deshalb nie
von Hand die Form zerstören) und erscheinen unter `/news`, auf der
Startseite und in der Sitemap. Entwürfe (`published: false`) stehen in der
Datei, aber nirgends auf der Seite. Der Fließtext kennt genau eine
Auszeichnung: `**fett**`. Dieselben ENV wie beim Upload; die
GitHub-Anbindung teilen sich beide über `lib/mdc/github.ts`.
**Facebook:** `/admin/facebook` zeigt die laufende Rangliste als fertigen
Beitrag — **zwei Tabellenbilder** (Top 32 Herren, Top 16 Damen; gezeichnet mit
`ImageResponse`/Satori in `lib/mdc/facebook-bild.tsx`, ausgeliefert unter
`/admin/facebook/bild/[division]`, Satori kann NUR Flexbox) plus kurzem Text
mit Jackpot und Link auf `/rangliste`. Im Bildfuß steht der Verweis noch einmal.
Ein Knopf („Beitrag fertig machen") kopiert den Text und reicht beide Bilder an
`navigator.share` weiter — am Schreibtisch stattdessen Download beider Bilder.
Kopiert wird mit drei Anläufen (`navigator.clipboard` → `execCommand` → Text
markieren und sagen, dass von Hand kopiert werden muss): In den eingebauten
Browsern von Facebook/Instagram ist die Zwischenablage gesperrt, und genau dort
landet man aus der Gruppe heraus.
`lib/mdc/facebook-post.ts` baut den Text (kurz und lang), dieselbe Quelle nutzt der Wochenlauf
`scripts/mdc-facebook-post.ts` (`.github/workflows/mdc-facebook-weekly.yml`,
montags 7:00 UTC; legt den Text als Job-Zusammenfassung und die Bilder als
Artefakt `facebook-bilder` ab, beides am Handy abrufbar). **In eine Facebook-GRUPPE kann kein Programm schreiben** — Meta hat
`publish_to_groups` abgeschaltet; für die MDC-Gruppe bleibt es beim Kopieren,
und die Oberfläche sagt das auch so. Auf eine Facebook-SEITE kann die Seite
selbst posten, sobald `MDC_FB_PAGE_ID` und `MDC_FB_PAGE_TOKEN` gesetzt sind
(`lib/mdc/facebook-api.ts`); fehlen sie, erscheint der Knopf gar nicht erst und
der Wochenlauf endet grün mit „übersprungen". Keine Euro-Beträge je Platz im
Beitrag — die ändern sich mit jedem Turnier, der Beitrag bleibt stehen.
Einzelheiten: `docs/mdc-facebook.md`.
**Kalender:** Der Wochenplan steht NICHT in einer Terminliste, sondern in den
Spielorten (fester Wochentag + Uhrzeit je Lokal, `playDaysFrom`). Unter
`/admin/kalender` trägt die Turnierleitung nur die Abweichungen ein — `absage`
(Ranking fällt aus, bleibt durchgestrichen sichtbar) und `zusatz` (ein Lokal
springt ein oder es gibt spontan eines am Wochenende). Landet als Commit in
`data/kalender.ts` (JSON-Array, Form nicht zerstören), `playDaysFrom` legt es
über den Plan, also wirkt es überall zugleich: Startseite, `/turniere`,
Spielort-Seiten, Knopf in der Kopfzeile. Der Spielort ist immer eines der elf
Lokale — freie Eingabe gibt es bewusst nicht (sonst kein Adresse/Karte/Seite).
Dauerhafte Änderungen am Spieltag gehören in `data/venues.ts`, nicht hierher.
**Jackpot:** `lib/mdc/jackpot.ts` rechnet den Topf der laufenden Saison aus den
Teilnahmen (3 € je Teilnahme, Blatt „Einzelergebnisse" J5) plus Übertrag aus der
Vorsaison (Männer 200 €, Frauen 220 €); 2 % des Männer-Topfs gehen an die Frauen,
davon 65 % über die Einzelrangliste, 35 % ins folgende Turnier. Gerechnet statt
abgeschrieben, damit der Betrag mit jedem Import mitwächst. Zwei bewusste
Abweichungen von der Mappe stehen im Kopf der Datei (`+175` → `+200` auf Anweisung
des Betreibers; „Mädels2%" verweist dort auf die leere Hilfsspalte AW13 und käme
auf 3,50 € statt der abgezogenen 16,54 € — hier gilt für beide Seiten derselbe
Betrag). Ausgeschüttet wird nur an Spieler mit mindestens 15 Teilnahmen
(`MINDEST_TEILNAHMEN`, Blatt „Einzelergebnisse" I5, vom Betreiber bestätigt) —
steht so auch auf der Regelseite. Angezeigt im gemeinsamen
`components/mdc/payout-box.tsx`: im Archiv als Endstand, in der laufenden
Wertung als Zwischenstand — dort MIT Anteil und Euro je Platz, ausdrücklich als
Stand von heute (`withPayout` in `lib/mdc/rows.ts` rechnet den Betrag aus dem
aktuellen Jackpot, statt ihn abzulegen).
**Passnummern-Register (seit 08.09.2026 maßgeblich):** Blatt „Teilnehmer" der
Arbeitsmappe ist die verbindliche Liste „welche Nummer gehört wem" — auch für
Leute, die noch nie gespielt haben. Einlesen mit
`python3 scripts/mdc-import-register.py <mappe.xlsm>` → `data/register.generated.ts`
(bewusst getrennt vom Saison-Import, damit eine alte Mappe nicht das aktuelle
Register überschreibt). `data/register.ts` wertet es aus, `data/players.ts`
baut darauf: Registereinträge ohne Wertung kommen als Spieler dazu (damit sie
auf einem Zettel auftauchen dürfen), und wessen Nummer im Register jemand
anderem gehört, verliert sie und bekommt `formerPassNr` — er behält alle
Ergebnisse, wird als „früher Passnr. X" ausgewiesen. `getPlayerByPassNr` folgt
dem Register. Ergebnisse einer Saison werden weiterhin über die Rangliste
GENAU DIESER Saison aufgelöst (`data/tournament-results.ts`) — alte Turniere
bleiben beim richtigen Menschen.
`/admin/passnummern` wertet aus (`lib/mdc/passnummern.ts`): Nummern der Reihe
nach, echte Lücken, nächste freie, Nummern mit Vorgänger — und als einzige
Fehlermeldung die Nummern, mit denen gespielt wurde, die im Register aber ohne
Namen stehen (die sehen frei aus und sind es nicht). Nummern vergeben oder
löschen kann die Seite nicht: Der Stamm entsteht aus Register und Wertungen,
wer raus soll, muss aus der Arbeitsmappe raus.
**Namen berichtigen** ist das Einzige, was dort geschrieben wird
(`components/mdc/namen-editor.tsx` → `lib/mdc/namen-commit.ts` → JSON-Array in
`data/namen.ts`, Form nicht zerstören). Zwei echte Fälle: der Spieler, der
unter seinem Lokalnamen läuft und den Nachnamen nachträgt („Ambasador David" →
Sedlmeier), und dieselbe Person in zwei Auswertungen verschieden geschrieben
(„Pogremino" ↔ „Pogremno"). Die Korrektur greift in `parseRankingRows` und
damit in ALLEN Quellen zugleich (Register, laufende Wertung, Archiv, Uploads) —
stünde sie nur an einer Stelle, würden aus einem Menschen zwei, weil die
Spieler-ID aus dem Namen entsteht. `homeVenueId` kommt weiterhin aus dem ROHEN
Nachnamen, sonst verlöre der Spieler sein Stammlokal. Drei Prüfungen in
`app/mdc/admin/passnummern/actions.ts`: die Nummer muss jemandem gehören, sie
darf nicht bei zwei Menschen stehen (die Korrektur hängt an der Nummer und
würde beide umbenennen — Fall für die Mappe), und der neue Name darf nicht die
Adresse eines anderen Spielers ergeben. Weil die Profiladresse aus dem Namen
entsteht, ändert sie sich mit: `alteId` in der Korrektur merkt sich die
frühere, `app/mdc/spieler/[id]/page.tsx` leitet von dort dauerhaft um.

## Stolperfallen
- **`app/favicon.ico` gilt für ALLE Seiten des Projekts, auch für `/mdc`.** Next behandelt
  diese Datei besonders: Ihr `<link>` steht in jedem Kopf und lässt sich — anders als
  `app/icon.png` — durch `icons` in einem Unter-Layout NICHT ersetzen. Auf mdc-ranking.de
  zeigte deshalb Google die MDU-Dartscheibe. Gelöst in `next.config.ts`: Ist
  `NEXT_PUBLIC_MDC_STANDALONE=1` gesetzt, schreibt ein `beforeFiles`-Rewrite `/favicon.ico`
  (und `/icon.png`, `/apple-icon.png`, `/apple-touch-icon*.png`) auf `/mdc/icon.png` um.
  `beforeFiles` ist Pflicht — `afterFiles` käme zu spät, dann gewönne die MDU-Datei.
  Google holt sein Symbol aus dem Zwischenspeicher; das Suchergebnis zieht erst Tage später nach.
- **ISR-Schreibvorgänge sind bei Vercel kontingentiert** (Freikontingent 200.000/Monat, danach
  werden die Projekte pausiert). Jedes Neurendern einer statischen Seite zählt. `revalidate`
  im MDC-Layout gilt für über 1.300 Seiten (546 Spielerprofile, 763 Turniere) — bei 30 Minuten
  wären das bis zu 64.000 Schreibvorgänge am Tag. Deshalb steht im Layout **86400** (ein Tag),
  und nur die wirklich datumsabhängigen Seiten setzen sich selbst einen kürzeren Wert:
  Startseite und `/turniere` 1800, `/spielorte/[id]` 3600. Von zwei Werten gilt in Next der
  KLEINERE. Vor jedem neuen `revalidate` überlegen, für wie viele Seiten er gilt.
  Auf der **MDU-Seite** gilt dasselbe: Startseite (`app/page.tsx`) und `/news` standen auf
  **60 s** (bis zu 2.880 Writes/Tag), obwohl die einzige laufend wechselnde Quelle die
  Admin-News sind — jetzt **600** (10 Min). Es gibt keine On-Demand-Revalidierung; der
  News-Schreibpfad läuft clientseitig (`lib/supabase/news.ts`). Braucht News künftig schneller
  online zu sein, wäre der saubere Hebel `revalidatePath('/')`/`'/news'` per Server-Action,
  nicht ein kürzeres `revalidate`.
- **Verweise auf `/admin` (MDC) NIE als `<Link>`, immer als `<a>`.** Next lädt Ziele vorab,
  sobald ein `Link` ins Blickfeld scrollt; auf `/admin` antwortet der Wächter mit 401 +
  `WWW-Authenticate`, und der Browser fragt daraufhin mitten im Scrollen nach dem Passwort —
  bei jedem Besucher. Trat im September 2026 in Fußzeile und Kopfzeile auf. Der Proxy
  unterdrückt die Aufforderung zusätzlich bei erkennbaren Vorabrufen (`purpose`,
  `sec-purpose`, `x-middleware-prefetch`), aber `next-router-prefetch` sieht er NICHT:
  Next entfernt den Kopf absichtlich (`next/dist/docs/…/proxy.md`, „RSC requests and
  rewrites"). Das `<a>` ist deshalb die eigentliche Vorsorge.
- Resend: bounct eine Adresse (z. B. Postfach existierte noch nicht), landet sie auf der
  **Suppression-Liste** und bekommt nichts mehr → im Resend-Dashboard entfernen.
- JSX verschluckt Leerzeichen nach `</strong>` am Zeilenende → `{' '}` verwenden.
- dartunion.de ist teils inkonsistent (Spielplan-Grid vs. offizielle Tabelle) — Tabellenseite
  ist die verlässlichere Quelle; nichts hardcoden, was sich beim nächsten Import selbst heilt.
