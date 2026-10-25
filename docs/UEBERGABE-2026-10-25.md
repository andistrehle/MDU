# Übergabe – MDU-Session bis 25.10.2026

Für die nächste Claude-Session. Projekt-Briefing steht in `CLAUDE.md` (immer zuerst lesen), offene
Punkte in `docs/BACKLOG.md`. Diese Datei fasst zusammen, was in dieser Session passiert ist und was
als Nächstes ansteht.

## Arbeitsregeln des Betreibers (verbindlich)

- **Sicherheitsregel:** Lesen ist frei. Jede SCHREIBENDE Aktion (DB, Vercel, externe Dienste)
  vorher genau zeigen (Tabelle, Zeilen, SQL/Skript) und erst nach ausdrücklicher Freigabe
  ausführen. Nie ungefragt in die Produktiv-DB schreiben. SQL immer inline in den Chat.
- **Erst fragen, dann bauen:** Bei neuen Funktionen nicht sofort loslegen, sondern die offenen
  Entscheidungen per Klick-Umfrage (AskUserQuestion) klären. Bei klaren Kleinigkeiten direkt machen.
- Nie nach API-Schlüsseln/Tokens im Chat fragen – immer als Secret in der Umgebung hinterlegen lassen.
- Rechtstexte (Datenschutz usw.) nur auf ausdrückliche Anweisung ändern.
- Fertiges direkt auf `main` (vorher `npx tsc --noEmit` + `npm run build` grün,
  `git pull --rebase origin main`). Commit-Footer:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: …`.
- Hinweise/Fehlermeldungen in der Oberfläche immer **direkt am betroffenen Feld**, so dass man
  sie sieht (Betreiber, 25.10.2026).
- Supabase SQL-Editor: https://supabase.com/dashboard/project/jbppgreathybxrakvhsh/sql/new

## ⏳ Als Nächstes: Web-App + Push live bringen

Code fertig, aber **nur auf dem Zweig `claude/sweet-heisenberg-joycu3`**, ein Commit über `main`:
`de9db8c MDU als installierbare Web-App mit Push-Benachrichtigungen (Migration 0056)`.
Beim Übernehmen nach `main` per Cherry-Pick; Konflikt kam bisher nur in `CLAUDE.md` vor
(beide Abschnitte behalten). Beschreibung steht im Abschnitt „Web-App + Push“ in `CLAUDE.md`
auf dem Zweig.

Stand:
1. ✅ **Migration 0056** (`supabase/migrations/0056_push.sql`) hat der Betreiber am 25.10.2026
   ausgeführt. Sie hat das Geheimnis in `private.push_config` erzeugt.
2. ⏳ **Vier Vercel-Variablen** (MDU-Projekt, Production) fehlen noch:
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:kontakt@mdudarts.de`),
   `PUSH_WEBHOOK_SECRET` (= `select secret from private.push_config`).
   Die VAPID-Werte hat der Betreiber als Datei bekommen (nicht im Repo!). Neue Schlüssel ließen
   sich mit `npx web-push generate-vapid-keys` erzeugen – dann aber BEIDE neu setzen.
   **Geplant:** Der Betreiber legt einen Vercel-Token als Secret `VERCEL_TOKEN` in der Umgebung an
   (evtl. auch `PUSH_WEBHOOK_SECRET` als Secret), damit Claude die Variablen per Vercel-API setzt –
   jede Änderung vorher zeigen (Werte abgekürzt) und Freigabe abwarten. Vercel-Token haben
   Vollzugriff; nichts außer den freigegebenen Variablen anfassen.
3. ⏳ **Datenschutz-Absatz** zu Push (Push-Adresse je Gerät, Push-Dienste Apple/Google/Mozilla):
   Entscheidung des Betreibers offen – nur auf Anweisung einsetzen.
4. Dann auf „Deployen“ des Betreibers: Commit nach `main` bringen, bauen, pushen.
   Test: am Handy einloggen → „Benachrichtigungen aufs Handy?“ → Ja (iPhone nur als Web-App vom
   Home-Bildschirm, iOS 16.4+), dann etwas auslösen, das in der Glocke landet.
   Bis zum Deploy ruft der DB-Trigger `/api/push/senden` ins Leere – harmlos.

## In dieser Session gebaut (alles auf `main`, live)

- **Terminliste Team Manager:** ✓ ? ✕ direkt auf jeder Kachel (`components/mdu/zusagen-ui.tsx`
  `KachelFuss`), Stand aufklappbar.
- **Öffentlicher Spielbericht** `/spielbericht/<heim>--<gast>` im Aufbau des Papierbogens
  (Aufstellung mit Punkten des Abends, 18 Spiele inkl. Doppel mit Zwischenstand, Gesamtergebnis,
  Highlights; ohne Passnummern/TCs/Protest/Fotos). Jedes Ergebnis 2026/27 verlinkt dorthin
  (Spielplan, Ergebnisse, Liga, Team, Startseite) und das Spielerprofil (Einzel → `#spiel-<nr>`).
  Datenschutz Ziffer 6 nennt „Ergebnisse“ – ob ein Satz zur öffentlichen Aufstellung ergänzt
  wird, hat der Betreiber noch nicht entschieden.
- **Spielerprofil:** Siegquote-Fehler behoben (1,0 % → 100 %); Kurve „Siegquote je Spieltag“
  (kumuliert, nur Einzel); 180er, 171er, High Finishes (Anzahl + höchstes), Short Legs
  (Anzahl + kürzestes).
- **Einzelrangliste:** Umschalter Punkte · 180er · 171er · High Finishes · Short Legs, Highlight-
  Listen auch „Alle Ligen“; Spalte E entfernt; Handy: Rang, Name, Logo, Bilanz, Punkte in einer
  Zeile, Legs/Highlights darunter (`components/mdu/einzelrangliste-27.tsx`).
- **Startseite:** „Letzte Spiele“ wechseln je Liga wie „Nächste Spiele“ (`NaechsteSpieleRotator`).
- **Admin → Spielberichte:** alle Partien nach Spieltag gruppiert, Filter Status (Alle/Fehlt/
  Eingereicht·unbestätigt/Bestätigt/Problemfälle mit Anzahl), Liga, Spieltag, Wochenende,
  Erfassungsweg, Team-Suche; Link `?status=problem`. Alte Liste als „Rohliste“ eingeklappt.
- **Protest** (Migration 0057, ✅ ausgeführt): Begründung Pflicht (≥ 15 Zeichen) + Rückfrage;
  beim Einreichen Glocke + E-Mail an Ligaleitung, Glocke an Gegner-TC
  (`app/api/match-reports/protest/route.ts`); offen bis „Protest erledigt“; roter Hinweis in
  Mein Bereich + Zahl an der Kachel „Spielberichte (Übersicht)“.
  Wild Indians hatte den Haken aus Versehen gesetzt – der Betreiber räumt das selbst ab.
- **Mein Bereich → Statistik** ist jetzt ein Untermenü (`/admin/statistik`): Erfassung der
  Spielberichte + Nutzungsstatistik (nur Super Admin).
- **Spielbericht-Formular:** Hinweise stehen am Feld (Highlight-Eingabe, betroffenes Spiel,
  Aufstellung, Kopfdaten, Protest, über den Knöpfen) und die Seite scrollt hin.
- Vorher in der Session: Erfassung der Spielberichte (Migration 0055), Startgeld-Nachmeldung
  25 € ab 12.10.2026, Heimrechttausch Belfort/Illuminati übernommen, Bazis-WhatsApp-Bot.

## Weitere offene Punkte

- **Bazis-Bot:** prüfen, ob die zeitgesteuerten Läufe (Crons 09:17/09:47/10:17/10:47 UTC in
  `.github/workflows/bazis-umfrage.yml`) wirklich starten; am 23.10. kam kein einziger. Nächstes
  Bazis-Spiel Fr 13.11.2026. Evtl. doppelte verknüpfte Geräte „Chrome (Mac OS)“ in WhatsApp.
- **Signal-Brücke** (WhatsApp-Gruppe → Signal-Empfänger): Betreiber entscheidet zwischen
  Oracle-Server (Echtzeit, empfohlen), GitHub-Variante (verzögert) oder später.
- **Mehrere Geräte im selben Spielbericht:** Es gibt keine Konfliktwarnung – der zuletzt
  Speichernde überschreibt den ganzen Bericht. Angeboten: Warnung über Speicherzeitpunkt-Vergleich
  („inzwischen an einem anderen Gerät geändert“). Noch nicht beauftragt.
- Entwurfs-Speichern löst den Seiten-Neubau aus (unnötig) – angeboten, das abzustellen.
- Next.js-Sicherheitshinweis (npm audit) prüfen – angeboten.
- Älteres aus dem Backlog: Premium (IBAN, Rechtstexte, Migration 0052), Datenschutz Team Manager,
  Spielbedingungen 48h/3-Regel, Nominierung, Demo-Daten aufräumen
  (`node scripts/cleanup-demo-video.mjs`).

## Technische Kniffe aus dieser Session

- Der Arbeitszweig trägt den Push-Commit über `main`. Fertiges für `main` daher in einem
  Worktree bauen: `git worktree add <dir> origin/main` → Patch anwenden → `npm ci` (ein
  verlinktes `node_modules` bricht Turbopack) → build/tsc → commit → `git push origin HEAD:main`.
- Testansichten ohne Datenbank: `app/zz-demo/page.tsx` (lokal, per `.git/info/exclude`
  ausgeschlossen); Playwright liegt unter `/opt/node22/lib/node_modules/playwright`, Chromium
  unter `/opt/pw-browsers/chromium`.
- Diese Cloud-Sitzungen haben keinen DB-Zugang: Eingereichte Berichte sieht man nur über die
  öffentlichen Seiten (z. B. Links `spielbericht/…` auf `/ergebnisse`), Entwürfe gar nicht.
