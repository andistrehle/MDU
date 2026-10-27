# Promo-Video „Der Team Manager ist da!“ (Drehbuch)

Stand 27.10.2026 (Push/Web-App ergänzt, Preis 8,99 €) · Betreiber-Vorgabe: im Stil von „Was ist neu“
(`scripts/video-was-ist-neu/`), aber **noch euphorischer**. **Handy- und Webansicht
gleichzeitig** im Bild (links Laptop/Browser, rechts Handy, beide zeigen dieselbe
Funktion). **Preis erst ganz am Ende** – vorher nur „was ihr alles kriegt“.
Länge ca. 135 s (mit Push-Szenen rund +15 s) · 1920×1080, dazu Reel/Story im Hochformat wie beim letzten Video.

**Stimme:** Toby (ElevenLabs, `eEmoQJhC4SAEQpCINUov`; Benjamin war dem Betreiber zu müde), Klang
**euphorisch**: stability 0.2, style 0.9, speed 1.15 (ENV `STABILITY`/`STYLE`/`SPEED` in `vertonen.js`). Untertitel =
Sprechertext, eingebrannt. Musik: treibend, ohne Gesang (optional, Schnitt in CapCut).

**Bilder:** nur Demo-Daten (Demo-Team, erfundene Namen) – keine echten Personen.
Grundlage: die echten Seiten `/mein-team/zusagen` (Dashboard), `/mein-team/termine`,
`/spieltag/…`, `/mein-team/kasse`, `/mein-team/gegner`, Spielbericht-Formular. Die
Komponenten lassen sich wie beim letzten Video auf einer Demo-Seite (`app/zz-demo`,
nie committen) mit Beispieldaten rendern – z. B. `TeamDashboard` mit `zusagen`,
`personen`, `kasse` usw. als Props.

**Aussprache** (`AUSSPRACHE` in `vertonen.js`): „mdudarts.de“ → „Em De U Darts Punkt De“,
„TC“ → „Teamcaptain“, „8,99 €“ → „acht neunundneunzig“, „49 €“ → „neunundvierzig Euro“.

| # | Bild (links Web · rechts Handy) | Sprechertext |
|---|---|---|
| 1 | Schwarz → MDU-Logo knallt rein, Titel „DER TEAM MANAGER IST DA!“, Dartscheibe dreht sich | Achtung, alle Darter Münchens! Jetzt wird's richtig gut: Der Team Manager ist da! |
| 2 | WhatsApp-Gruppe voller Nachrichten „Wer kommt Freitag?“, „Keine Ahnung“, „Ich vielleicht“ – Bild wird rot durchgestrichen | Schluss mit dem WhatsApp-Chaos! Kein „Wer kommt am Freitag?“, kein Durcheinander mehr. |
| 3 | Dashboard: dunkelgrüne Kopfkarte, Team-Scheibe füllt sich Segment für Segment, Countdown „6 Tage“ | Ein Blick, und du weißt alles: nächstes Spiel, Countdown – und auf der Team-Scheibe siehst du sofort, wer dabei ist. |
| 4 | Finger tippt ✓ in der Kopfkarte, Segment wird grün; dann ✕ mit Begründung „bin im Urlaub“ | Zusagen? Ein Tipp. Absagen? Ein Tipp und kurz der Grund dazu. Fertig! |
| 5 | Teilnehmerliste, Teamcaptain setzt für einen Spieler „dabei“ | Und das Beste: Nicht jeder braucht ein Konto. Der Teamcaptain trägt einfach fürs ganze Team ein. Noch besser ist's natürlich, wenn alle dabei sind! |
| 6 | Tipp auf „Offen 5“ → Namen klappen auf; Glocke mit Erinnerung, daneben Push-Banner „Bitte zu- oder absagen“ auf dem Handy | Wer fehlt noch? Ein Tipp auf die Zahl, und du siehst es. Und wer trödelt, wird von der Glocke erinnert – und mit der MDU-App sogar direkt per Push aufs Handy! |
| 6b | TC tippt auf der Spielseite „Offene erinnern (3)“ → Handy-Sperrbildschirm mit Push **„Bitte zu- oder absagen“** · „… – du hast noch nicht geantwortet.“, App-Symbol mit roter 1 | Drei haben noch nicht geantwortet? Ein Tipp – und genau die drei kriegen's aufs Handy. Nur die! |
| 7 | Aufstellung H1–H8 aus den Zusagen, dann Spielbericht: „Übernehmen“ füllt H1–H8 | Die Aufstellung baust du direkt aus den Zusagen – und mit einem Klick landet sie im Spielbericht. Wahnsinn! |
| 7b | Spielseite: Zeitleiste Treffen 19:30 · Beginn 20:00 · Ende ca. 23:30, Notiz „Bitte Trikots mitbringen“, Aufgabe „Spielbericht drucken → Tim“, Tims Glocke leuchtet, dazu Push auf Tims Sperrbildschirm **„Aufgabe für dich“** | Treffzeit, Notizen, Aufgaben – alles am Spiel dran. Tim soll den Spielbericht mitbringen? Aufgabe rein, und Tim wird benachrichtigt! |
| 8 | Teamkasse: Strafenkatalog, „Bull verfehlt 0,50 €“ für drei Spieler auf einmal, Beitrag „Saison 30 €“ für alle, Reiter „Offen“: mehrere ankreuzen → „4 Posten als bezahlt abhaken“, Kassenstand springt hoch | Die Teamkasse ist auch an Bord! Strafenkatalog, Beiträge, Kassenbuch – und wer was offen hat, hakst du mit einem Wisch ab. Sogar einen Kassenwart kannst du bestimmen. Schluss mit der Zettelwirtschaft! |
| 9 | Gegneranalyse: Platz, Form S-U-N, direkter Vergleich, Top 5 | Vor dem Spiel schon wissen, was auf euch zukommt? Die Gegneranalyse zeigt Tabelle, Form und die besten Spieler des Gegners. |
| 10 | Eigene Termine in eigener Farbe mit „Extern“; neuer Termin „Training“, Häkchen **„Team benachrichtigen“** (schon angehakt) → Push **„Neuer Termin“** · „Training · Di 19:00 – bitte zu- oder absagen.“; Excel-Liste einfügen → Vorschau → alle importiert, Kalender-Abo aufs Handy | Pokal, andere Liga, Training, Weihnachtsfeier? Rein damit – in deiner Farbe, sogar ganze Listen aus Excel. Und sobald du ihn einträgst, weiß es das ganze Team. Sofort. Und alles landet automatisch in deinem Handykalender. |
| 10b | Dashboard: „Nachricht ans Team“, Text „Heute Treffen schon um 19 Uhr!“ → Abschicken → mehrere Handys leuchten gleichzeitig mit **„Nachricht vom Teamcaptain“** auf | Kurze Ansage ans ganze Team? Tippen, abschicken – zack, bei allen auf dem Handy. Ganz ohne WhatsApp-Gruppe! |
| 11 | Statistik: Quoten-Ring „92 %“, Du gegen Team-Schnitt, Umschalter „Zugesagt / Gespielt“, Rangliste | Und wer ist der treueste Spieler im Team? Die Statistik zeigt, wer wie oft zugesagt – und wer wirklich gespielt hat. Deine Quote gegen den Team-Schnitt! |
| 12 | „Spiel teilen“ → WhatsApp-Vorschau | Ein Klick auf „Teilen“, und der Link ist in eurer Gruppe. |
| 12b | iPhone: Safari → Teilen → „Zum Home-Bildschirm“ → MDU-Symbol auf dem Homescreen → nach dem Login „🔔 Benachrichtigungen aufs Handy?“ → „Ja, einschalten“; kurz eingeblendet „Android: Chrome → ⋮ → App installieren“ | Und jetzt der Turbo: Holt euch die MDU als App aufs Handy – ganz ohne App Store. Dann kommt alles als Push, und an der App siehst du sofort, ob was Neues da ist. |
| 13 | Schnelle Collage aller Funktionen, Text „UND WAS KOSTET DER SPASS?“, Trommelwirbel | Das alles für euer Team. Und jetzt haltet euch fest – was kostet der ganze Spaß? |
| 14 | Zwei Rüscherl-Gläser klirren, daneben Dartautomat „12 Spiele“, dann groß „8,99 € / Monat · fürs ganze Team“ und „oder 49 € die ganze Saison“ | Zwei Rüscherl im Monat! Oder zwölf Spiele am Automaten! Acht neunundneunzig im Monat fürs ganze Team – oder neunundvierzig Euro für die ganze Saison. Ein Spottpreis! |
| 15 | Abspann: „14 TAGE GRATIS TESTEN“ · mdudarts.de · aufs Handy holen · Team Manager | Und die ersten vierzehn Tage sind gratis! Also los: mdudarts.de, Mein Bereich, Team Manager. Auf geht's – holt euch den Team Manager jetzt! Und noch ein kleiner Zusatz: Das ist natürlich keine Pflicht. Jedes Team kann auch ohne Team Manager ganz normal am Spielbetrieb teilnehmen. Das ist ein zusätzliches Angebot an euch – gezwungen wird hier keiner. Aber mit Team Manager macht's halt doch mehr Spaß! (Einblendung „Keine Pflicht“) |

## Screenshots (Pflicht: JEDE Funktion zeigen)
Je Szene ein Paar Web + Handy mit Demo-Daten. Liste: Dashboard (Scheibe, Kacheln Kasse/Termine/
Aufgaben/Gegneranalyse, Statistik) · Zusagen-Knöpfe + Begründung · Teilnehmerliste mit
TC-Eintrag · aufgeklappte Namen hinter „Offen“ · Glocke · Aufstellung H1–H8 + „Übernehmen“
im Spielbericht · Spielseite mit Zeitleiste, Notiz, Aufgabe · Teamkasse (Spieler, Beiträge,
Offen, Kassenbuch, Strafenkatalog, Kassenwart) · Gegneranalyse · Terminliste mit externem
Termin + Import-Vorschau + Kalender-Abo · Teilen-Dialog · Upgrade-Seite (für Szene 14/15) ·
NEU: „Offene erinnern (3)“ (`OffeneErinnern`) und „Nachricht ans Team“ (`NachrichtAnsTeam`) aus
`components/mdu/team-push.tsx`, Häkchen „Team benachrichtigen“ (`TeamBenachrichtigen`) aus
`components/mdu/termin-ui.tsx`, Abfrage „Benachrichtigungen aufs Handy?“ (`components/mdu/push-abfrage.tsx`) —
wie gewohnt auf `app/zz-demo` mit Demo-Daten. Sperrbildschirm, Push-Banner, Homescreen und
Safari-Teilen-Menü sind im Video **nachgebaut** (HTML in `erklaer.html`), nicht abfotografiert.
Ziel: Neugier – „krass, was das alles kann“. Schnelle Schnitte, Zoom auf das Detail.

## Hinweise
- **Ehrlich bleiben:** Nur zeigen, was es gibt (Stand 27.10.2026 alles vorhanden). Preise
  und „14 Tage gratis“ stehen in `lib/premium.ts`. Das Premium-Angebot ist **noch nicht
  öffentlich** (`PREMIUM_OEFFENTLICH = false`) – Video erst veröffentlichen, wenn es live ist.
- **Push ehrlich darstellen** (Stand 27.10.2026 live):
  - Push gibt es nur mit installierter Web-App UND eingeschalteten Benachrichtigungen; am iPhone
    nur über das Symbol auf dem Home-Bildschirm, ab iOS 16.4. Ohne Web-App/Push bleibt es bei der Glocke.
  - Push erreicht nur Spieler mit Konto – passt zu Szene 5 („Noch besser ist's, wenn alle dabei sind!“).
  - Es pusht alles, was in der Glocke landet: eigener Termin neu/geändert/abgesagt (wenn „Team
    benachrichtigen“ angehakt ist), „Offene erinnern“ (nur an die Offenen), „Nachricht ans Team“
    (Freitext bis 200 Zeichen), Aufgabe zugewiesen (an die Person), Zu-/Absage (an den TC), tägliche
    Erinnerung an offene Zu-/Absagen. Dazu eine Zahl am App-Symbol.
  - **Treffzeit und Aufstellung pushen NICHT** – im Video nicht so darstellen.
  - Push-Titel genau wie die Seite (`app/api/team/nachricht/route.ts`, Migrationen 0047/0048):
    „Neuer Termin“, „Termin geändert“, „Termin abgesagt“, „Bitte zu- oder absagen“,
    „Nachricht vom Teamcaptain“, „Aufgabe für dich“.
- „2 Rüscherl / 12 Spiele“ ist ein Vergleich (Betreiber-Formulierung), keine Preisangabe.
- Split-Screen: Laptop-Rahmen links (ca. 62 % Breite), Handy-Rahmen rechts, gleiche Szene;
  im Hochformat (Reel) nur das Handy.
