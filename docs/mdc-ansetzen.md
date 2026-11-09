# Ranking ansetzen und absagen — der zweite Zugang für die Wirte

*Seit 17.10.2026. Betreiber-Vorgabe: „Mach das zweite Passwort fürs Ansetzen."*
*Absagen seit 09.11.2026: „Im Wirte log in einrichten, dass sie es selbst
absagen können."*

## Warum

Das Ranking am Freitag, Samstag oder Sonntag ist **kein fester Abend**. Es wird
von Lokal zu Lokal verabredet — mal spontan, wenn genug Leute da sind. Bisher
musste der Wirt dafür bei der Turnierleitung anrufen, die es unter
`/admin/kalender` eintrug. Jetzt trägt er es selbst ein, ohne an Ergebnisse,
Passnummern oder News zu kommen.

## Die zwei Passwörter

| ENV | Wer | Darf |
| --- | --- | --- |
| `MDC_ADMIN_PASSWORD` | Turnierleitung | alles (`/admin/**`) |
| `MDC_TERMIN_PASSWORD` | die Wirte | **nur** `/admin/ansetzen` (ansetzen, absagen, zurücknehmen) |

Beide sind server-only, kein `NEXT_PUBLIC_`. Ist `MDC_TERMIN_PASSWORD` nicht
gesetzt, ändert sich nichts: Dann kommt auch auf die Ansetz-Seite nur die
Turnierleitung. Vergeben wird es im **MDC-Projekt bei Vercel** (nicht im
MDU-Projekt).

**Ehrlich dazu:** Es ist für alle Lokale **dasselbe** Passwort. Ein Eintrag
lässt sich also keinem bestimmten Wirt zuordnen, und wer es hat, kann auch für
ein anderes Lokal ansetzen. Ein Konto je Wirt bräuchte Anmeldung, Sitzung,
Cookie und Datenbank — die MDC hat nichts davon, und so steht es im
Datenschutz. Die Gegenprobe ist die Turnierleitung: Sie sieht unter
`/admin/kalender` jeden Eintrag und kann jeden zurücknehmen. Beides steht auch
auf der Seite selbst, nicht nur hier.

## Wie die Wirte hinkommen

Auf der öffentlichen Seite **Spielorte**, ganz unten: die Karte **Wirte-Login**
mit dem Knopf „Anmelden und Termin ansetzen" (`app/mdc/spielorte/page.tsx`).
Bewusst dort und nicht in der Hauptnavigation: Wer ein Lokal betreibt, landet
ohnehin auf dieser Seite; alle anderen geht der Zugang nichts an.

Der Verweis ist ein gewöhnliches `<a>`, **kein `Link`** — sonst lüde Next das
Ziel vor, der Wächter antwortete mit 401, und der Browser fragte mitten im
Scrollen jeden Besucher nach dem Passwort. So passiert erst beim Tippen etwas,
und dann ist die Abfrage gewollt. Der direkte Weg bleibt daneben bestehen:
`mdc-ranking.de/admin/ansetzen`, am besten auf den Home-Bildschirm gelegt.

## Das Passwort in Vercel anlegen (geht auch am Handy)

Im **MDC-Projekt** (das mit der Domain `mdc-ranking.de`), nicht im MDU-Projekt.

1. Direkt dorthin (Projekt `mdc-ranking` im Team `andistrehles-projects`):
   <https://vercel.com/andistrehles-projects/mdc-ranking/settings/environment-variables>

   **Am Handy führt kein Weg durchs Menü dahin:** Settings öffnet immer die
   Seite „General"; die Unterseiten der Einstellungen stehen in einer
   Seitenleiste, die dort eingeklappt ist. Wer schon im Projekt ist, hängt
   deshalb einfach `/environment-variables` an die Adresse an. Für ein anderes
   Projekt tut es Vercels eigener Auswahllink:
   <https://vercel.com/d?to=/[team]/[project]/settings/environment-variables>
2. **Key** `MDC_TERMIN_PASSWORD`, **Value** das Passwort für die Wirte.
3. Als Umgebung **Production** ankreuzen (Preview/Development nur, wenn du dort
   auch testen willst) → **Save**.
4. **Redeploy:** Neue Variablen gelten erst für den nächsten Build. Also unter
   **Deployments** beim obersten Eintrag das Dreipunkt-Menü → **Redeploy**.
   Danach kommen die Wirte hinein.

**Erledigt am 17.10.2026** — das Passwort ist vergeben und die Seite neu
gebaut. Nachprüfen lässt es sich so: `/admin/kalender` aufmachen (mit dem
Passwort der Turnierleitung); die Karte „Die Lokale setzen selbst an" sagt dort
ausdrücklich, ob `MDC_TERMIN_PASSWORD` vergeben ist. Von außen sieht man es
nicht — eine gesperrte Seite antwortet mit oder ohne gesetztes Passwort
gleich, und das ist auch richtig so.

Beim Anlegen fragt Vercel, ob der Wert **Config** oder **Secret** sein soll:
Ein Secret lässt sich nach dem Speichern nicht mehr anzeigen. Für ein Passwort,
das du den Wirten vorlesen können musst, ist **Config** praktischer — sonst
brauchst du eine eigene Notiz, wo es steht.

## Was dort geht — und was nicht

Geht:
- **Ansetzen**: Lokal, Tag, Beginn, kurzer Hinweis → Zusatztermin.
- **Absagen** (seit 09.11.2026): Lokal, einer seiner festen Abende, Grund →
  der Termin bleibt auf der Seite stehen, **durchgestrichen und mit dem
  Grund**. Der Grund ist Pflicht (3–200 Zeichen): „fällt aus" allein lässt
  jeden rätseln und bringt die Frage ins Lokal zurück.
- **Zurücknehmen**, beides. Wer absagen darf, muss die Absage auch
  zurücknehmen können — die Veranstaltung wird verschoben, der Abend findet
  doch statt.

**Warum Absagen jetzt doch hier sind:** Bis 09.11.2026 blieben sie bei der
Turnierleitung, mit der Überlegung, eine Absage nehme anderen den Abend weg.
Die Wirklichkeit hat das überholt. Fällt ein Abend wegen einer Veranstaltung
aus, weiß es der Wirt zuerst, und er sagt es ohnehin — bisher in der
Facebook-Gruppe, während die Seite weiter einen Termin behauptete. Lieber steht
es dort, wo die Spieler nachsehen. Der Betreiber hat es so angewiesen.

Geht nicht, mit Absicht:
- **Vergangene Tage.** Ein Ranking, das schon gelaufen ist, wird weder
  angesetzt noch abgesagt — vom gelaufenen kommt das Ergebnis über
  `/admin/ergebnis`, beim ausgefallenen hilft die Turnierleitung.
  **Heute ist erlaubt**, und zwar gerade beim Absagen: „heute Abend fällt aus"
  ist der häufigste Fall.
- **Weiter als 120 Tage voraus.**
- **Ansetzen am festen Spieltag des Lokals.** Dort steht der Abend ohnehin im
  Plan; ein Zusatztermin stünde doppelt auf der Seite. Die Oberfläche sperrt
  den Knopf, die Aktion lehnt es noch einmal ab.
- **Absagen an einem Tag ohne festen Abend.** Umgekehrt dasselbe: Die Absage
  stünde in der Datei und auf der Seite passierte nichts. Deshalb ist das
  Datum beim Absagen **keine freie Eingabe, sondern eine Auswahl** aus den
  festen Abenden des Lokals (schon abgesagte stehen mit drin, gesperrt). Einen
  selbst angesetzten Abend sagt man nicht ab, man nimmt ihn zurück.
- **Dauerhafte Änderungen** (anderer Wochentag, andere Zeit, neues Lokal) —
  die gehören zu den Spielorten (`/admin/spielorte`).

## Wie es technisch zugeht

- **`proxy.ts`** entscheidet am Pfad: `istAnsetzSeite()` erlaubt auf
  `/admin/ansetzen` (mit und ohne `/mdc`-Präfix) beide Passwörter, überall
  sonst nur das der Leitung. Die Bremse gegen Durchprobieren (10 Fehlversuche
  in 10 Minuten) gilt für beide.
- **`lib/mdc/zugang.ts`** ist dieselbe Prüfung für die Server-Aktionen:
  `werDaIst()` → `'leitung' | 'wirt' | null`. Doppelt mit Absicht — eine
  Server-Aktion ist eine eigene Adresse im Netz, und eine Aktions-Kennung
  ließe sich auch an eine andere Seite schicken.
- **`app/mdc/admin/ansetzen/actions.ts`** schreibt in dieselbe Datei wie der
  Kalender (`data/kalender.ts`, Commit über `lib/mdc/kalender-commit.ts`):
  `setzeZusatzAn` legt `art: 'zusatz'` ab, `sageRankingAb` ein
  `art: 'absage'` mit `time: null` und dem Grund als `note`. `nimmZurueck`
  löscht nur, was auf `-zusatz` oder `-absage` endet — die beiden Arten, die
  es im Kalender gibt. Mehr Arten kommen hier nicht durch.
- **Die Abend-Auswahl kommt aus dem Plan selbst.** Die Seite rechnet mit
  `playDaysFrom(heute, 121)` die nächsten festen Abende je Lokal aus und gibt
  sie dem Formular mit (`spieltage`, `zusatz`-Einträge übersprungen). So kann
  niemand einen Tag erwischen, an dem es nichts abzusagen gibt — die Aktion
  lehnte das zwar auch ab, aber erst nach dem Tippen.
- **Keine `AdminNav` auf der Seite.** Next lädt Verweise vorab; ein Wirt bekäme
  sonst mitten im Scrollen die Passwortabfrage für Seiten, die ihm ohnehin
  nicht aufgehen.

## Geprüft am 17.10.2026 (lokal, gegen den fertigen Build)

| Prüfung | Ergebnis |
| --- | --- |
| `/admin/ansetzen` mit Leitungs- und mit Wirt-Passwort | beide 200 |
| `/admin`, `/admin/ergebnis`, `/admin/kalender`, `/admin/news`, `/admin/passnummern`, `/admin/spielorte` mit Wirt-Passwort | jeweils **401** |
| falsches Passwort überall | 401 |
| Ansetzen als Wirt (Samstag, fremdes Lokal) | läuft bis zum Commit durch |
| Ansetzen am festen Spieltag / in der Vergangenheit | abgelehnt, mit Begründung |
| Absage-Eintrag zurücknehmen als Wirt | **geht** (seit 09.11.2026) |
| Absagen ohne Grund / mit zwei Zeichen | abgelehnt, Knopf vorher gesperrt |
| Absagen an einem Tag ohne festen Abend | abgelehnt, mit Begründung |
| Fremde Aktionen (Kalender, Ergebnis-Upload) als Wirt an `/admin/ansetzen` geschickt | liefen nicht an (leere Antwort); dieselben Aufrufe als Leitung liefen durch. Zusätzlich prüft jede dieser Aktionen das Leitungs-Passwort selbst. |

## Nachgeprüft am 09.11.2026 (lokal, gegen den fertigen Build)

Mit dem Wirt-Passwort, die Server-Aktion im Browser abgefangen — es wurde
nichts committet.

| Prüfung | Ergebnis |
| --- | --- |
| `/admin/ansetzen` ohne Passwort / als Wirt / als Wirt auf `/admin/ergebnis` | 401 / 200 / 401 |
| Abend-Auswahl je Lokal | alle zwölf Lokale, 17–18 Abende, erster Abend = der nächste feste (heute eingeschlossen) |
| Knopf „Absagen" ohne Grund / mit zwei Zeichen / mit Grund | gesperrt / gesperrt / frei |
| Absagen durchgeführt | Bestätigung „… — abgesagt", Datum und Grund kommen am Server an |
| Schon abgesagter Abend | in der Auswahl mit „· schon abgesagt" und gesperrt |
| Liste „Schon eingetragen" | zeigt Absage und Zusatztermin mit Etikett „Abgesagt"/„Angesetzt" |
| Absage zurücknehmen | richtige Kennung (`…-absage`), Meldung „findet wieder statt" |
| **Server allein** (Browser schickt absichtlich Unsinn, den das Formular nicht zuließe): Vergangenheit / Tag ohne festen Abend / Grund zu kurz / 210 Tage voraus | jeweils abgelehnt, mit Begründung, vor jedem Commit |
| Öffentlich: Wochenplan `/turniere` und Lokal-Seite | Abend durchgestrichen mit „Fällt aus: …" |
