// ============================================================
// FAQ — Häufige Fragen (Seite /faq)
// ============================================================
//
// ERWEITERN: einfach eine Frage in das passende Thema schreiben (oder ein
// neues Thema anlegen). Die `id` ist der Direktlink (/faq#id) — einmal
// vergeben, nicht mehr ändern, sonst laufen geteilte Links ins Leere.
//
// Antworten kennen genau zwei Auszeichnungen: **fett** und [Text](/pfad).
// Leerzeile = neuer Absatz; ein Absatz aus Zeilen mit „- “ = Aufzählung.
// `stichworte` helfen nur der Suche (Wörter, die in der Antwort fehlen).
//
// Inhaltlich gilt: nur beschreiben, was die Plattform wirklich kann, und
// nicht von den Spielbedingungen abweichen — die sind verbindlich, die FAQ
// erklärt sie nur.
// ============================================================

export interface FaqEintrag {
  id: string;
  frage: string;
  antwort: string;
  stichworte?: string[];
}

export interface FaqThema {
  id: string;
  titel: string;
  fragen: FaqEintrag[];
}

export const FAQ: FaqThema[] = [
  {
    id: 'konto',
    titel: 'Konto & Login',
    fragen: [
      {
        id: 'registrieren',
        frage: 'Wie bekomme ich ein Konto?',
        antwort: `Unter [Registrieren](/registrieren) trägst du Vor- und Nachname, deine E-Mail-Adresse und ein Passwort ein und wählst, ob du dich als **Spieler** oder **Teamkapitän (TC)** registrierst. Danach bestätigst du deine E-Mail-Adresse über den Link, den wir dir schicken.

Die Ligaleitung verknüpft dein Konto anschließend mit deinem Spielerprofil und deinem Team. Erst danach siehst du im Login-Bereich alles zu deiner Mannschaft.`,
        stichworte: ['anmelden', 'account', 'neu'],
      },
      {
        id: 'muss-ich-mich-registrieren',
        frage: 'Muss sich jeder Spieler registrieren?',
        antwort: `Nein. Ein Konto braucht nur der Teamkapitän. Für alle anderen ist es freiwillig. Mit Konto kannst du aber dein Profil selbst pflegen (Bild, Spitzname, „Über mich“) und, falls dein Team den Team Manager nutzt, für Spieltage zu- oder absagen.`,
      },
      {
        id: 'kapitaen-werden',
        frage: 'Wie werde ich Teamkapitän?',
        antwort: `Wähle bei der Registrierung „Teamkapitän / TC“ und schreib im Kommentar kurz dazu, für welches Team. Die Rolle vergibt die Ligaleitung nach Prüfung. Jedes Team hat genau einen TC. Soll der TC wechseln, melde dich über das [Kontaktformular](/kontakt).`,
        stichworte: ['tc', 'captain', 'rolle'],
      },
      {
        id: 'passwort-vergessen',
        frage: 'Ich habe mein Passwort vergessen.',
        antwort: `Auf der Login-Seite gibt es den Link „Passwort vergessen?“. Unter [Passwort vergessen](/passwort-vergessen) gibst du deine E-Mail-Adresse ein und klickst „Link anfordern“, dann bekommst du einen Link zum Zurücksetzen.

Kommt nichts an, schau bitte im Spam-Ordner nach.`,
        stichworte: ['zurücksetzen', 'reset', 'login'],
      },
      {
        id: 'email-vergessen',
        frage: 'Ich weiß nicht mehr, mit welcher E-Mail-Adresse ich mich registriert habe.',
        antwort: `Unter [Passwort vergessen](/passwort-vergessen) findest du „E-Mail-Adresse vergessen?“. Dort gibst du deinen Namen und optional eine Nachricht ein und klickst „Ligaleitung kontaktieren“. Wir melden uns bei dir.`,
      },
      {
        id: 'spieler-bereits-vorhanden',
        frage: 'Bei der Registrierung heißt es „Spieler bereits vorhanden“.',
        antwort: `Dann ist dein Spielerprofil schon mit einem Konto verknüpft, meistens mit einem, das du selbst früher angelegt hast. Probier zuerst „Passwort vergessen – jetzt zurücksetzen“. Gehört das Konto nicht dir oder kommst du nicht mehr hinein, wähle „Verknüpfung von der Ligaleitung zurücksetzen lassen“.`,
      },
      {
        id: 'immer-wieder-abgemeldet',
        frage: 'Wie lange bleibe ich angemeldet?',
        antwort: `Du bleibst angemeldet, solange du die Seite mindestens alle 90 Tage einmal öffnest. Das gilt auch, wenn du die Seite auf dem iPhone als Symbol auf dem Home-Bildschirm abgelegt hast. Abgemeldet wirst du nur, wenn du dich selbst abmeldest oder die Website-Daten im Browser löschst.`,
        stichworte: ['abgemeldet', 'rausgeflogen', 'session', 'iphone'],
      },
      {
        id: 'konto-loeschen',
        frage: 'Wie lösche ich mein Konto?',
        antwort: `Selbst löschen geht derzeit nicht. Schreib uns über das [Kontaktformular](/kontakt), dann löscht die Ligaleitung dein Konto. Einzelheiten stehen in der [Datenschutzerklärung](/datenschutz).`,
      },
    ],
  },
  {
    id: 'profil',
    titel: 'Profil & Sichtbarkeit',
    fragen: [
      {
        id: 'profil-bearbeiten',
        frage: 'Was kann ich in meinem Profil einstellen?',
        antwort: `Unter [Mein Profil](/mein-profil) kannst du Spitzname, „Über mich“, Telefonnummer und Profilbild pflegen. Bearbeiten geht erst, wenn die Ligaleitung dein Konto mit deinem Spielerprofil verknüpft hat. Name, E-Mail und Team stehen dort nur zur Ansicht. Soll daran etwas geändert werden, melde dich über das [Kontaktformular](/kontakt).`,
        stichworte: ['bild', 'foto', 'spitzname'],
      },
      {
        id: 'profilbild-oeffentlich',
        frage: 'Wer sieht mein Profilbild und meinen Spitznamen?',
        antwort: `Dein **Profilbild** wird auf deinem öffentlichen Spielerprofil angezeigt. Willst du das nicht, nimm in deinem Profil den Haken bei „Profilbild öffentlich auf meinem Spielerprofil anzeigen“ heraus.

Deinen **Spitznamen** zeigen wir nur, wenn du das ausdrücklich ankreuzt.`,
        stichworte: ['datenschutz', 'öffentlich', 'foto'],
      },
      {
        id: 'telefonnummer',
        frage: 'Wer sieht meine Telefonnummer?',
        antwort: `Öffentlich niemand. Hast du in deinem Profil „Telefonnummer für eingeloggte Teamkapitäne sichtbar machen“ angehakt, sehen sie nur angemeldete Teamkapitäne und die Ligaleitung, zum Beispiel um ein Spiel abzusprechen. Du kannst die Nummer jederzeit ändern oder löschen.`,
        stichworte: ['handy', 'nummer', 'whatsapp'],
      },
      {
        id: 'name-oder-team-falsch',
        frage: 'Mein Name oder mein Team ist falsch eingetragen.',
        antwort: `Schreib uns über das [Kontaktformular](/kontakt), was korrigiert werden soll. Die Ligaleitung ändert es.`,
      },
    ],
  },
  {
    id: 'mannschaft',
    titel: 'Mannschaft & Kader (für TCs)',
    fragen: [
      {
        id: 'mannschaft-anmelden',
        frage: 'Wie melde ich meine Mannschaft für eine Saison an?',
        antwort: `Als TC im Login-Bereich unter „Mannschaft anmelden“. Du gehst Schritt für Schritt durch: Mannschaft, Teamdaten, Spielstätte, Kontakt, Social Media (optional), Kader, dann Prüfung und Absenden. Zwischendurch kannst du jederzeit „Als Entwurf speichern“. Nach dem Absenden prüft die Ligaleitung die Anmeldung und teilt die Staffel ein.

Vollständig ist die Meldung erst, wenn das Startgeld da ist.`,
        stichworte: ['meldung', 'saison', 'anmeldung'],
      },
      {
        id: 'startgeld',
        frage: 'Wie bezahle ich das Startgeld?',
        antwort: `Auf der Seite [Mein Team](/mein-team) zeigt die Startgeld-Karte deinen offenen Betrag. Der Knopf „… € per PayPal bezahlen“ öffnet PayPal mit dem Betrag. Bitte als „Freunde & Familie“ senden. Unter „Empfänger-Daten anzeigen“ stehen Empfänger und Verwendungszweck zum Kopieren. Bar an die Ligaleitung geht auch.

Meldest du später Spieler nach, ist nur der Unterschied offen.`,
        stichworte: ['paypal', 'bezahlen', 'gebühr', 'unkostenbeitrag'],
      },
      {
        id: 'spieler-nachmelden',
        frage: 'Wie melde ich während der Saison einen Spieler nach?',
        antwort: `Als TC in deinem Kader unter [Mein Team](/mein-team) mit „Spieler nachmelden“: Vor- und Nachname und die letzte Liga-Erfahrung eintragen, absenden. Die Ligaleitung prüft die Nachmeldung, du bekommst das Ergebnis in die Glocke. **Spielberechtigt ist der Spieler erst nach der Freigabe.**

Für die letzten zwei Spieltage ist keine Nachmeldung mehr möglich. Alle Regeln dazu stehen in den [Spielbedingungen](/spielbedingungen).`,
        stichworte: ['kader', 'neuer spieler', 'nachmeldung'],
      },
      {
        id: 'mannschaft-wechseln',
        frage: 'Kann ein Spieler während der Saison das Team wechseln?',
        antwort: `Nein. In einer Saison spielt jeder nur für die Mannschaft, für die er gemeldet ist. Wechseln geht erst zur nächsten Saison.`,
      },
      {
        id: 'tc-telefon-gegner',
        frage: 'Wie erreiche ich den Kapitän des Gegners?',
        antwort: `Bei jedem Team steht der Name des TCs. Die Telefonnummer mit „Anrufen“ und „WhatsApp-Nachricht“ siehst du, wenn du als Teamkapitän angemeldet bist und der andere TC seine Nummer freigegeben hat.`,
        stichworte: ['kontakt', 'telefon', 'kapitän'],
      },
      {
        id: 'kapitaen-wechseln',
        frage: 'Unser Teamcaptain wechselt. Wie wird das umgestellt?',
        antwort: `Den Teamcaptain stellt die Ligaleitung um, der TC kann das nicht selbst. Schreib der Ligaleitung, wer es werden soll. Der neue Kapitän braucht dafür ein Konto auf der Seite, das mit seinem Spielerprofil verknüpft ist.

Danach hat er alle Kapitänsrechte, zum Beispiel Spielberichte eintragen und das Team verwalten. Der bisherige Kapitän wird normaler Spieler, außer er soll die Rechte behalten, etwa als Stellvertreter. Beide und das ganze Team bekommen eine Nachricht.`,
        stichworte: ['kapitän', 'tc', 'wechseln', 'ändern', 'captain'],
      },
      {
        id: 'co-captain',
        frage: 'Kann ich einen Co-Captain bestimmen?',
        antwort: `Ja, einen. Als Kapitän gehst du auf „Mein Team“ → „Co-Captain bestimmen“, wählst jemanden aus dem Team (mit Konto auf der Seite) und hakst an, welche Rechte er bekommt: Spielberichte, Team Manager, Teamkasse und Verlegung & Heimrecht. Du kannst die Rechte jederzeit ändern oder ihn wieder entfernen. Er bekommt jedes Mal eine Nachricht.

Den Teamcaptain selbst wechselt nur die Ligaleitung.`,
        stichworte: ['co-captain', 'stellvertreter', 'rechte', 'kapitän'],
      },
    ],
  },
  {
    id: 'spielbericht',
    titel: 'Spielbericht',
    fragen: [
      {
        id: 'wer-traegt-ein',
        frage: 'Wer trägt den Spielbericht ein?',
        antwort: `**Immer die Heimmannschaft.** Der TC des Gastteams bestätigt den Bericht anschließend online. Ein von beiden Seiten bestätigter Bericht ist gültig, einen nachträglichen Protest gibt es dann nicht mehr.`,
        stichworte: ['heim', 'gast', 'eintragen'],
      },
      {
        id: 'spielbericht-vertretung',
        frage: 'Der Kapitän ist beim Heimspiel nicht da. Wer trägt dann den Spielbericht ein?',
        antwort: `Der Kapitän oder der Co-Captain teilt vorher jemanden aus dem Team ein: unter „Mein Team“ bei „Spielbericht – Vertretung“ (mit Team Manager auch direkt auf der Seite des Spiels). Eingeteilt werden kann jeder aus dem Team, der ein Konto auf der Seite hat. Er bekommt eine Nachricht und darf für genau dieses Spiel den Spielbericht anlegen, im Live-Modus führen und absenden.

Die Vertretung endet mit dem Absenden, spätestens Dienstag 24 Uhr nach dem Spiel. Bestätigen beim Auswärtsspiel darf ein Vertreter nicht – das machen Kapitän oder Co-Captain.`,
        stichworte: ['vertretung', 'vertreter', 'kapitän nicht da', 'live', 'eintragen'],
      },
      {
        id: 'wege-spielbericht',
        frage: 'Wie kann ich den Spielbericht erfassen?',
        antwort: `Im Login-Bereich unter „Spielberichte“ gibt es drei Wege:
- **Direkt digital während des Spiels:** „Neuer Spielbericht“, Ergebnisse gleich eintippen.
- **Auf Papier, danach abtippen:** die Vorlage findest du unter [Downloads](/downloads).
- **Auf Papier, danach fotografieren:** „Foto/PDF hochladen“. Die Plattform liest den Bogen ein, du prüfst alle Werte und schickst ihn erst dann ab.

Wird auf Papier gespielt, unterschreiben beide TCs den Bogen.`,
        stichworte: ['foto', 'ocr', 'papier', 'pdf', 'hochladen'],
      },
      {
        id: 'frist-spielbericht',
        frage: 'Bis wann muss der Spielbericht eingetragen sein?',
        antwort: `Binnen zwei Werktagen nach der Spielwoche, also **spätestens Dienstag, 24:00 Uhr**. Fehlt der Bericht dann, verliert das Heimteam automatisch mit 0:3 Punkten und 0:18 Spielen.

Klappt es technisch gar nicht, schick den Bericht ersatzweise per E-Mail oder WhatsApp an die Ligaleitung.`,
        stichworte: ['deadline', 'dienstag', 'zu spät'],
      },
      {
        id: 'bestaetigen',
        frage: 'Wie bestätige ich als Gast den Spielbericht?',
        antwort: `Sobald die Heimmannschaft den Bericht abgeschickt hat, bekommst du als Gast-TC eine Nachricht in die Glocke. In der Übersicht der Spielberichte steht er unter „Zu prüfen (Gegner)“. Dort kannst du ihn ansehen und „Bestätigen“ – danach ist er abgeschlossen.`,
        stichworte: ['gast', 'freigeben', 'bestätigung'],
      },
      {
        id: 'fehler-im-bericht',
        frage: 'Im Spielbericht des Gegners ist ein Fehler. Was tun?',
        antwort: `Statt zu bestätigen, wählst du „Änderung anfordern“. Du korrigierst die betroffenen Ergebnisse, schreibst kurz dazu, was nicht stimmt, und schickst den Vorschlag ab. Die Heimmannschaft kann ihn übernehmen und den Bericht neu einreichen, danach bestätigst du.

Echte Proteste müssen zusätzlich auf dem Spielbericht stehen und binnen zwei Werktagen schriftlich bei der Ligaleitung sein. Im Online-Spielbericht setzt du dafür den Haken „Protest eingelegt“ – nur mit Begründung (mindestens 15 Zeichen). Beim Absenden bekommen die Ligaleitung und der Gegner sofort eine Nachricht.`,
        stichworte: ['falsch', 'korrigieren', 'protest', 'einspruch'],
      },
      {
        id: 'korrektur-bestaetigt',
        frage: 'Der Spielbericht ist schon bestätigt, aber falsch. Geht das noch zu ändern?',
        antwort: `Ja, bis 7 Tage nach dem Spiel. Öffne den Bericht und tippe auf „Korrektur anfragen“. Das können die TCs beider Teams. Du änderst, was nicht stimmt: Aufstellung, Spieler je Spiel, Ergebnisse oder Highlights. Dazu schreibst du eine Begründung (mindestens 15 Zeichen) und schickst die Anfrage ab.

Der TC des anderen Teams bekommt eine Nachricht und sieht genau, was sich ändern soll. Er bestätigt oder lehnt ab. Die Ligaleitung ist informiert und entscheidet, wenn niemand antwortet. Erst mit der Bestätigung gilt die Korrektur, dann rechnen Tabelle und Ranglisten neu. Bis dahin bleibt der bisherige Stand öffentlich, mit dem Hinweis „Korrektur angefragt“. Im Verlauf des Berichts steht, wer wann was angefragt und bestätigt hat.

Nach den 7 Tagen wendest du dich an die Ligaleitung.`,
        stichworte: ['korrektur', 'bestätigt', 'nachträglich', 'ändern', 'fehler'],
      },
      {
        id: 'sternchen',
        frage: 'Was bedeutet das Sternchen (*) in der Tabelle?',
        antwort: `Ein Ergebnis zählt in der Tabelle schon ab dem Einreichen durch die Heimmannschaft. Bis das Gastteam bestätigt hat, ist es mit * markiert.`,
        stichworte: ['stern', 'vorläufig', 'unbestätigt'],
      },
      {
        id: 'live-anzeige',
        frage: 'Kann ich den Spielstand im Lokal auf einem Bildschirm zeigen?',
        antwort: `Ja. Im Spielbericht-Formular gibt es den **Live-Modus**: Auf dem Tablet geht die Eingabe auf Vollbild, ihr tippt Ergebnisse und Highlights direkt ein, und alle können mitschauen. Mit „Zweites Fenster“ öffnest du eine reine Anzeige, die du auf einen angeschlossenen Monitor oder Fernseher ziehst.

Die Anzeige läuft nur auf dem Gerät, auf dem eingegeben wird. Einen öffentlichen Link gibt es nicht.`,
        stichworte: ['tablet', 'fernseher', 'monitor', 'live'],
      },
      {
        id: 'aufstellung-uebernehmen',
        frage: 'Kann ich die Aufstellung in den Spielbericht übernehmen?',
        antwort: `Ja, wenn dein Team den Team Manager nutzt und die Aufstellung dort hinterlegt ist. Dann trägt „Übernehmen“ im Spielbericht H1–H8 ein und, falls der Gegner seine Aufstellung auch hinterlegt hat, G1–G8.`,
      },
    ],
  },
  {
    id: 'wertung',
    titel: 'Tabelle & Rangliste',
    fragen: [
      {
        id: 'tabellenpunkte',
        frage: 'Wie wird die Tabelle berechnet?',
        antwort: `Eine Begegnung hat 18 Spiele. Wer mehr Spiele gewinnt, bekommt **3 Punkte**, bei Gleichstand gibt es für beide **1 Punkt**.

Bei Punktgleichheit entscheidet:
- die Spieldifferenz,
- dann die Legdifferenz,
- dann der direkte Vergleich der punktgleichen Teams.

Die Tabelle rechnet die Plattform automatisch aus den Spielberichten.`,
        stichworte: ['punkte', 'gleichstand', 'reihenfolge'],
      },
      {
        id: 'nichtantritt',
        frage: 'Was passiert, wenn eine Mannschaft nicht antritt?',
        antwort: `Das Spiel wird mit 0:3 Punkten und 0:18 Spielen verloren gewertet, zusätzlich werden **3 Punkte abgezogen**. Das nicht angetretene Team zahlt außerdem 30 € Entschädigung an den Wirt. Wer dreimal nicht antritt, wird disqualifiziert.

Angetreten ist eine Mannschaft, wenn spätestens 30 Minuten nach der Startzeit mindestens drei Spieler da sind.`,
        stichworte: ['nicht angetreten', 'absage', 'abzug'],
      },
      {
        id: 'einzelrangliste',
        frage: 'Wie funktioniert die Einzelrangliste?',
        antwort: `Es zählen nur die Einzel, die Doppel nicht.
- **Best of 3:** 2:0 = 3 Punkte, 2:1 = 2, 1:2 = 1, 0:2 = 0.
- **La Liga (Best of 5):** 3:0 = 5, 3:1 = 4, 3:2 = 3, 2:3 = 2, 1:3 = 1, 0:3 = 0.

Bei Punktgleichheit entscheidet die Legdifferenz, danach die Zahl der Siege; ist auch das gleich, teilen sich die Spieler den Platz. Du findest die Rangliste auf der jeweiligen Ligaseite unter „Einzelrangliste“ und deine Werte in deinem Spielerprofil. Dort stehen auch alle deine Einzel; tippst du auf eins, öffnet sich der ganze Spielbericht der Begegnung (Aufstellung, alle Spiele mit Legs, Highlights). Das geht auch über jedes Ergebnis im Spielplan, bei den Ergebnissen und auf den Team- und Ligaseiten.`,
        stichworte: ['rangliste', 'einzel', 'punkte', 'spielbericht'],
      },
      {
        id: 'statistiken',
        frage: 'Gibt es Spielerstatistiken wie 180er oder High Finishes?',
        antwort: `Die Highlights (180er, 171er, High Finish ab 100, Short Leg) werden im Spielbericht erfasst. Weitere Statistiken in den Spielerprofilen kommen im Laufe der Saison dazu.`,
        stichworte: ['180', 'highlights', 'finish'],
      },
      {
        id: 'spieltagsbericht',
        frage: 'Gibt es einen Bericht zum Spielwochenende?',
        antwort: `Ja. Nach jedem Spielwochenende erscheint unter [News](/news) ein Spieltagsbericht: Highlights, knappe Begegnungen mit Spielverlauf, deutliche Siege, der Spieler des Spieltages über alle Ligen, alle Ergebnisse und was sich in den Tabellen getan hat. Der Text wird aus den eingereichten Spielberichten erstellt und von der Ligaleitung vor dem Veröffentlichen geprüft. Wer Benachrichtigungen aufs Handy eingeschaltet hat, bekommt dann einen Hinweis.

**Spieler des Spieltages** ist, wer über alle Ligen hinweg im Einzel am meisten gewonnen hat – bei Gleichstand entscheiden die Highlights. Dazu nennt der Bericht, wer die meisten Highlights hatte, und hebt besondere hervor (höchstes Finish, Finishes ab 140, Short Legs bis 15 Darts, mehrere 180er oder 171er).

Spiele, deren Bericht am Sonntagabend noch fehlt oder die verlegt sind, stehen als „offen“ im Bericht und kommen im nächsten als nachgereicht dazu.`,
        stichworte: ['spieltagsbericht', 'news', 'spieler des spieltages', 'bericht', 'wochenende'],
      },
    ],
  },
  {
    id: 'spielplan',
    titel: 'Spielplan & Termine',
    fragen: [
      {
        id: 'verlegen',
        frage: 'Können wir ein Spiel verlegen?',
        antwort: `Ja, wenn beide Teamkapitäne einverstanden sind. Unter [Mein Spielplan](/mein-team/spielplan) schlägt ein TC über „Spiel verlegen“ einen neuen Termin vor, der TC des Gegners bestätigt oder lehnt ab. Die Ligaleitung wird informiert. Freigeben muss sie nur, wenn der neue Termin vor dem Saisonstart oder nach dem letzten Spielwochenende liegt.

Bis zur Bestätigung bleibt im Spielplan der alte Termin stehen, mit dem Hinweis „Verlegung angefragt“.

Laut [Spielbedingungen](/spielbedingungen) gilt außerdem: Die Ligaleitung muss mindestens 48 Stunden vor Spielbeginn Bescheid wissen, und je Hin- und Rückrunde dürfen höchstens drei Spiele verlegt werden.`,
        stichworte: ['verschieben', 'termin ändern', 'verlegung'],
      },
      {
        id: 'heimrecht-tauschen',
        frage: 'Können wir das Heimrecht tauschen?',
        antwort: `Ja. Unter [Mein Spielplan](/mein-team/spielplan) in der Karte „Spiel verlegen / Heimrecht tauschen“ wählt ein TC „Heimrecht tauschen“ und den Gegner. Dann wechseln Hin- und Rückspiel Heim und Gast – Datum und Uhrzeit bleiben. Der TC des Gegners bestätigt, die Ligaleitung wird informiert.

Das geht nur, solange es für keines der beiden Spiele einen Spielbericht gibt. Zusagen und Aufstellung wandern automatisch zum richtigen Spiel mit.`,
        stichworte: ['heimrecht', 'tausch', 'heimspiel', 'auswärts', 'lokal'],
      },
      {
        id: 'kalender-abo',
        frage: 'Wie bekomme ich unsere Spieltage in meinen Kalender?',
        antwort: `Angemeldet unter [Mein Spielplan](/mein-team/spielplan) in der Karte „Spieltage in meinen Kalender“:
- **iPhone / Mac / Outlook abonnieren** und **Google Kalender (Android):** Das sind Abos, sie aktualisieren sich von selbst, wenn sich ein Termin ändert.
- **Datei laden (.ics):** einmaliger Stand zum Importieren, zum Beispiel in einen beliebigen anderen Kalender. Spätere Änderungen kommen dort nicht an.`,
        stichworte: ['kalender', 'ics', 'abo', 'google', 'outlook'],
      },
      {
        id: 'wirt-plan',
        frage: 'Wo sieht unser Wirt, wann bei ihm gespielt wird?',
        antwort: `Auf der Seite der Spielstätte unter [Spielstätten](/spielstaetten). Dort steht der Plan aller Heimspiele im Lokal, nach Wochenenden sortiert, und lässt sich mit „Plan drucken / als PDF“ ausdrucken.`,
        stichworte: ['lokal', 'drucken', 'spielstätte', 'wirt'],
      },
      {
        id: 'archiv',
        frage: 'Wo finde ich die Ergebnisse der letzten Saison?',
        antwort: `Spielplan, Ergebnisse, Tabellen, Ligen und Teams der Saison 2025/26 sind als Archiv weiter online. Du schaltest auf den Seiten oben mit dem Saison-Umschalter zwischen 2026/27 und 2025/26 um.`,
        stichworte: ['2025/26', 'letzte saison', 'archiv'],
      },
      {
        id: 'spielformat',
        frage: 'Was wird in welcher Liga gespielt?',
        antwort: `Gespielt wird 501, in der B- und C-Liga Master Out, in der A-Liga und La Liga Double Out. Eine Partie geht über Best of 3 Legs, in der La Liga über Best of 5 – im Einzel wie im Doppel.

Eine Begegnung hat 18 Spiele: acht Einzel, ein Doppel, acht Einzel und ein abschließendes Doppel. Alles Weitere steht in den [Spielbedingungen](/spielbedingungen).`,
        stichworte: ['501', 'double out', 'master out', 'best of'],
      },
    ],
  },
  {
    id: 'team-manager',
    titel: 'Team Manager',
    fragen: [
      {
        id: 'was-ist-team-manager',
        frage: 'Was ist der Team Manager?',
        antwort: `Der Team Manager hilft beim Organisieren rund um den Spieltag:
- Spieler sagen je Spiel zu oder ab, auch direkt in der Terminliste mit ✓ ? ✕, ohne jeden Termin einzeln zu öffnen.
- Der TC stellt aus den Zusagen die Aufstellung zusammen.
- Treffzeit, Notizen und Aufgaben stehen je Spiel an einer Stelle.
- Eigene Termine außerhalb der MDU (andere Liga, Pokal, Training) lassen sich eintragen oder aus einer Tabelle importieren.
- Die Teamkasse führt Strafen, Beiträge und den Kassenstand.

Jedes Spiel hat eine eigene Seite, deren Link ihr in der Teamgruppe teilen könnt.`,
        stichworte: ['zusagen', 'absagen', 'aufstellung', 'premium'],
      },
      {
        id: 'teamkasse',
        frage: 'Wie funktioniert die Teamkasse?',
        antwort: `Die Teamkasse gehört zum Team Manager. Der Kapitän und ein Kassenwart, den er bestimmt, tragen Strafen (gern aus einem eigenen Strafenkatalog), Beiträge, Einnahmen und Ausgaben ein. Alle im Team sehen den Kassenstand und wer noch was offen hat.

Eine Strafe oder ein Beitrag zählt in den Kassenstand, sobald er als bezahlt abgehakt ist. Auch Spieler ohne Konto können Strafen bekommen.`,
        stichworte: ['kasse', 'strafen', 'strafenkatalog', 'beitrag', 'geld', 'kassenwart'],
      },
      {
        id: 'erinnerung-zusagen',
        frage: 'Werde ich erinnert, wenn ich noch nicht zu- oder abgesagt habe?',
        antwort: `Ja, mit Team Manager. Wer für ein Spiel oder einen Termin noch nicht geantwortet hat, bekommt eine Erinnerung in die Glocke – wie viele Tage vorher, stellt der TC ein. Zusätzlich kann der TC eine **E-Mail-Erinnerung** fürs Team einschalten: Dann kommt für jeden offenen Termin einmal eine Mail. Abmelden kannst du dich über den Link in der Mail. Der TC selbst bekommt jede Zu- und Absage in die Glocke.`,
        stichworte: ['erinnerung', 'e-mail', 'mail', 'glocke', 'zusage'],
      },
      {
        id: 'nachrichten-vom-tc',
        frage: 'Kann der TC dem ganzen Team Bescheid geben?',
        antwort: `Ja, mit Team Manager. Trägt der TC einen eigenen Termin ein, ändert oder löscht ihn, bekommt das ganze Team einen Hinweis in die Glocke (er kann das beim Speichern abwählen). Auf der Seite eines Spiels oder Termins kann er mit **„Offene erinnern“** alle anstupsen, die noch nicht zu- oder abgesagt haben, und im Team Manager mit **„Nachricht ans Team“** eine kurze Nachricht an alle schicken. Wer [Benachrichtigungen aufs Handy](/faq#push) eingeschaltet hat, bekommt das auch als Push. Spieler ohne Konto auf der Seite erreicht das nicht.`,
        stichworte: ['nachricht', 'push', 'team', 'erinnern', 'tc', 'kapitän'],
      },
      {
        id: 'team-manager-freischalten',
        frage: 'Wie bekommt unser Team den Team Manager?',
        antwort: `Der Team Manager läuft gerade im Test bei einzelnen Teams. Später wird er allen Teams als kostenpflichtige Zusatzfunktion angeboten. Bei Interesse meldet euch gern über das [Kontaktformular](/kontakt).`,
      },
    ],
  },
  {
    id: 'sonstiges',
    titel: 'Sonstiges',
    fragen: [
      {
        id: 'app',
        frage: 'Gibt es eine App?',
        antwort: `Eine eigene App aus dem App Store gibt es nicht, die Seite lässt sich aber wie eine App installieren – mit MDU-Symbol, im Vollbild und mit Benachrichtigungen:
- **iPhone (Safari):** Teilen-Symbol → „Zum Home-Bildschirm“.
- **Android (Chrome):** Menü ⋮ → „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.

Angemeldet bleibst du dort genauso wie im Browser. Weil die App ohne Browserleiste läuft, gibt es oben links einen eigenen Zurück-Pfeil ‹.`,
        stichworte: ['handy', 'home-bildschirm', 'iphone', 'android', 'installieren'],
      },
      {
        id: 'push',
        frage: 'Bekomme ich Benachrichtigungen aufs Handy?',
        antwort: `Ja, wenn du sie einschaltest. Nach dem Login fragt die Seite einmal nach, danach geht es jederzeit unter [Mein Bereich](/mein-bereich) → „Benachrichtigungen aufs Handy“ (ein- und ausschalten). Du bekommst dann alles, was in deiner Glocke landet, zum Beispiel einen Spielbericht zum Bestätigen, eine Spielverlegung oder, mit Team Manager, die Erinnerung zum Zu-/Absagen.
- **iPhone:** Benachrichtigungen gibt es nur, wenn die MDU als App auf dem Home-Bildschirm liegt und du sie darüber öffnest (iOS 16.4 oder neuer).
- **Zahl am App-Symbol:** Auf dem iPhone (MDU als App) und am Computer zeigt das Symbol, wie viele Benachrichtigungen ungelesen sind – wie an der Glocke. Sie geht weg, sobald du sie in der Glocke gelesen hast. Auf Android zeigt das Handy je nach Hersteller einen Punkt statt einer Zahl.
- **Aus Versehen abgelehnt?** Dann darf die Seite nicht noch einmal fragen. Erlauben kannst du es in den Einstellungen: iPhone → Einstellungen → Mitteilungen → MDU; im Browser über das Schloss-Symbol neben der Adresse → Benachrichtigungen.

Meldest du dich ab, bekommt das Gerät keine Benachrichtigungen mehr.`,
        stichworte: ['push', 'benachrichtigung', 'mitteilung', 'handy', 'erinnerung'],
      },
      {
        id: 'glocke',
        frage: 'Wofür ist die Glocke oben?',
        antwort: `Dort landen deine Benachrichtigungen, zum Beispiel ein Spielbericht, den du bestätigen sollst, eine Änderung an deinem Konto oder Team, eine angefragte Spielverlegung oder, mit Team Manager, offene Zu-/Absagen.`,
        stichworte: ['benachrichtigung', 'nachricht'],
      },
      {
        id: 'design',
        frage: 'Kann ich das Aussehen der Seite ändern?',
        antwort: `Ja, oben im Kopf der Seite wechselst du zwischen „Old School“ (hell, grün) und „New Design“ (dunkel, rot). Die Wahl merkt sich dein Browser.`,
        stichworte: ['dunkel', 'hell', 'farbe', 'dark mode'],
      },
      {
        id: 'tour',
        frage: 'Wie starte ich die Einführungstour noch einmal?',
        antwort: `Öffne [diesen Link](/?tour=1), dann startet die Tour über die Startseite.`,
        stichworte: ['tour', 'einführung', 'hilfe'],
      },
    ],
  },
];
