# Promo-Video „Der Team Manager ist da!“ (Drehbuch)

Stand 18.10.2026 · Betreiber-Vorgabe: im Stil von „Was ist neu“
(`scripts/video-was-ist-neu/`), aber **noch euphorischer**. **Handy- und Webansicht
gleichzeitig** im Bild (links Laptop/Browser, rechts Handy, beide zeigen dieselbe
Funktion). **Preis erst ganz am Ende** – vorher nur „was ihr alles kriegt“.
Länge ca. 95–110 s · 1920×1080, dazu Reel/Story im Hochformat wie beim letzten Video.

**Stimme:** Benjamin (ElevenLabs, leicht bayerisch, `gRJR8Fqocw86Vixo4cZV`), Klang
**euphorisch**: mehr Energie als beim letzten Video (z. B. stability 0.25, style 0.8,
speed 1.12 – per ENV `STABILITY`/`STYLE`/`SPEED` in `vertonen.js` testen). Untertitel =
Sprechertext, eingebrannt. Musik: treibend, ohne Gesang (optional, Schnitt in CapCut).

**Bilder:** nur Demo-Daten (Demo-Team, erfundene Namen) – keine echten Personen.
Grundlage: die echten Seiten `/mein-team/zusagen` (Dashboard), `/mein-team/termine`,
`/spieltag/…`, `/mein-team/kasse`, `/mein-team/gegner`, Spielbericht-Formular. Die
Komponenten lassen sich wie beim letzten Video auf einer Demo-Seite (`app/zz-demo`,
nie committen) mit Beispieldaten rendern – z. B. `TeamDashboard` mit `zusagen`,
`personen`, `kasse` usw. als Props.

**Aussprache** (`AUSSPRACHE` in `vertonen.js`): „mdudarts.de“ → „Em De U Darts Punkt De“,
„TC“ → „Teamcaptain“, „7,99 €“ → „sieben neunundneunzig“, „49 €“ → „neunundvierzig Euro“.

| # | Bild (links Web · rechts Handy) | Sprechertext |
|---|---|---|
| 1 | Schwarz → MDU-Logo knallt rein, Titel „DER TEAM MANAGER IST DA!“, Dartscheibe dreht sich | Achtung, alle Darter Münchens! Jetzt wird's richtig gut: Der Team Manager ist da! |
| 2 | WhatsApp-Gruppe voller Nachrichten „Wer kommt Freitag?“, „Keine Ahnung“, „Ich vielleicht“ – Bild wird rot durchgestrichen | Schluss mit dem WhatsApp-Chaos! Kein „Wer kommt am Freitag?“, kein Durcheinander mehr. |
| 3 | Dashboard: dunkelgrüne Kopfkarte, Team-Scheibe füllt sich Segment für Segment, Countdown „6 Tage“ | Ein Blick, und du weißt alles: nächstes Spiel, Countdown – und auf der Team-Scheibe siehst du sofort, wer dabei ist. |
| 4 | Finger tippt ✓ in der Kopfkarte, Segment wird grün; dann ✕ mit Begründung „bin im Urlaub“ | Zusagen? Ein Tipp. Absagen? Ein Tipp und kurz der Grund dazu. Fertig! |
| 5 | Teilnehmerliste, Teamcaptain setzt für einen Spieler „dabei“ | Und das Beste: Nicht jeder braucht ein Konto. Der Teamcaptain trägt einfach fürs ganze Team ein. Noch besser ist's natürlich, wenn alle dabei sind! |
| 6 | Tipp auf „Offen 5“ → Namen klappen auf; Glocke mit Erinnerung | Wer fehlt noch? Ein Tipp auf die Zahl, und du siehst es. Und wer trödelt, wird von der Glocke erinnert. |
| 7 | Aufstellung H1–H8 aus den Zusagen, dann Spielbericht: „Übernehmen“ füllt H1–H8 | Die Aufstellung baust du direkt aus den Zusagen – und mit einem Klick landet sie im Spielbericht. Wahnsinn! |
| 8 | Teamkasse: Strafenkatalog, „Bull verfehlt 0,50 €“ eintragen, Beitrag abhaken, Kassenstand springt hoch | Die Teamkasse ist auch an Bord! Strafen, Beiträge, Kassenstand – alles abgehakt, alles im Griff. Keine Zettelwirtschaft mehr! |
| 9 | Gegneranalyse: Platz, Form S-U-N, direkter Vergleich, Top 5 | Vor dem Spiel schon wissen, was auf euch zukommt? Die Gegneranalyse zeigt Tabelle, Form und die besten Spieler des Gegners. |
| 10 | Eigene Termine (violett „Extern“), Excel-Import, Kalender-Abo aufs Handy | Pokal, Training, Weihnachtsfeier? Rein damit – sogar aus Excel. Und alles landet automatisch in deinem Handykalender. |
| 11 | Statistik: Quoten-Ring „92 %“, Rangliste „Wer kommt am häufigsten?“ | Und wer ist der treueste Spieler im Team? Die Statistik verrät's! |
| 12 | „Spiel teilen“ → WhatsApp-Vorschau | Ein Klick auf „Teilen“, und der Link ist in eurer Gruppe. |
| 13 | Schnelle Collage aller Funktionen, Text „UND WAS KOSTET DER SPASS?“, Trommelwirbel | Das alles für euer Team. Und jetzt haltet euch fest – was kostet der ganze Spaß? |
| 14 | Zwei Rüscherl-Gläser klirren, daneben Dartautomat „12 Spiele“, dann groß „7,99 € / Monat · fürs ganze Team“ und „oder 49 € die ganze Saison“ | Zwei Rüscherl im Monat! Oder zwölf Spiele am Automaten! Sieben neunundneunzig im Monat fürs ganze Team – oder neunundvierzig Euro für die ganze Saison. Ein Spottpreis! |
| 15 | Abspann: „14 TAGE GRATIS TESTEN“ · mdudarts.de · Mein Bereich → Team Manager | Und die ersten vierzehn Tage sind gratis! Also los: mdudarts.de, Mein Bereich, Team Manager. Packt's an! |

## Hinweise
- **Ehrlich bleiben:** Nur zeigen, was es gibt (Stand 18.10.2026 alles vorhanden). Preise
  und „14 Tage gratis“ stehen in `lib/premium.ts`. Das Premium-Angebot ist **noch nicht
  öffentlich** (`PREMIUM_OEFFENTLICH = false`) – Video erst veröffentlichen, wenn es live ist.
- „2 Rüscherl / 12 Spiele“ ist ein Vergleich (Betreiber-Formulierung), keine Preisangabe.
- Split-Screen: Laptop-Rahmen links (ca. 62 % Breite), Handy-Rahmen rechts, gleiche Szene;
  im Hochformat (Reel) nur das Handy.
