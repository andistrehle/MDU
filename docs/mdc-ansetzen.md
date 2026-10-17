# Ranking ansetzen — der zweite Zugang für die Wirte

*Seit 17.10.2026. Betreiber-Vorgabe: „Mach das zweite Passwort fürs Ansetzen."*

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
| `MDC_TERMIN_PASSWORD` | die Wirte | **nur** `/admin/ansetzen` |

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

## Was dort geht — und was nicht

Geht:
- **Ansetzen**: Lokal, Tag, Beginn, kurzer Hinweis → Zusatztermin.
- **Zurücknehmen** eines angesetzten Termins.

Geht nicht, mit Absicht:
- **Absagen.** Ein Ranking abzusagen nimmt anderen den Abend weg; das bleibt
  bei der Turnierleitung.
- **Vergangene Tage.** Ein Ranking, das schon gelaufen ist, wird nicht
  angesetzt — davon kommt das Ergebnis über `/admin/ergebnis`.
- **Weiter als 120 Tage voraus.**
- **Der feste Spieltag des Lokals.** Dort steht der Abend ohnehin im Plan; ein
  Zusatztermin stünde doppelt auf der Seite. Die Oberfläche sperrt den Knopf,
  die Aktion lehnt es noch einmal ab.
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
  Kalender (`data/kalender.ts`, Commit über `lib/mdc/kalender-commit.ts`), aber
  nur mit `art: 'zusatz'`. Zurückgenommen wird nur, was auf `-zusatz` endet.
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
| Absage-Eintrag zurücknehmen als Wirt | abgelehnt |
| Fremde Aktionen (Kalender, Ergebnis-Upload) als Wirt an `/admin/ansetzen` geschickt | liefen nicht an (leere Antwort); dieselben Aufrufe als Leitung liefen durch. Zusätzlich prüft jede dieser Aktionen das Leitungs-Passwort selbst. |
