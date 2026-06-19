# MDU Platform — Backlog / Roadmap

## Erledigt seit Super-Admin-Login (Juni 2026)

Reihenfolge ~chronologisch. Alles live auf `mdu-three.vercel.app` (Domain `mdudarts.de` via Cloudflare).

- [x] Rollenrechte vollständig in der UI (Spieler / Teamkapitän / Ligaleitung / Super Admin)
- [x] P0 Datenschutz & Sicherheit (Datenschutz, Impressum, robots, sitemap, noindex, Doku)
- [x] MDU-Daten von dartunion.de aktualisiert
- [x] Kompletter Adminbereich (12 Sektionen) + responsive Mobile-Konsole (Drawer/Topbar)
- [x] Online-Mannschaftsanmeldung mit Freigabe-Workflow (draft → submitted → in_review → approved/rejected/changes_requested)
- [x] Automatische Spieler-/Team-Erkennung bei Registrierung (nur Vorschlag, keine Rechtevergabe)
- [x] E-Mail-Benachrichtigungen (Resend, LIVE): Team-Captain-Mails (eingereicht/freigegeben/abgelehnt/Nachbesserung)
- [x] „Konto freigeschaltet"-Mail an User inkl. Rolle + Rechtebeschreibung + Verknüpfung
- [x] DNS eingerichtet: Strato → Cloudflare (Subdomain-MX) → Resend verified; Absender no-reply@mdudarts.de
- [x] Vercel-ENV: RESEND_API_KEY, EMAIL_FROM, SUPABASE_SERVICE_ROLE_KEY (server-only)
- [x] Kachel-Badges für offene Admin-Aufgaben (Benutzerverwaltung, Saisonanmeldungen)
- [x] Einheitliches Notification-Center: Tabelle `notifications` (per-User read_at, RLS), DB-Trigger für alle Events, Glocke + Dropdown im Header für alle eingeloggten Nutzer, Kachel-Badges auch für Spieler/Kapitän
- [x] UI-Feinschliff: Glocke auffälliger, roter Badge nur auf Glocke (nicht mehr auf „Mein Bereich"), „Mein Bereich"-Button in der Admin-Konsole (kein Logout)
- [x] Excel-Übersicht aller Accounts/Keys + Architektur-Schaubild

## Wichtig / abhängig

- [ ] Supabase-Migrationen ausführen: `0004`–`0007` im SQL-Editor (zuletzt `0007_notifications_center.sql`)
- [ ] Deploy-Kontrolle: nach jedem Push prüfen, dass Vercel den neuesten Commit als „Ready" baut (war schon mal nicht auto-deployt)

## Vor Go-live (offen)

- [ ] Eindeutigkeits-/Dubletten-Regeln: 1 Spielerprofil = 1 Konto (DB-Constraint), jedes Team nur 1× pro Saison freigegeben; Namensgleichheit nur zur Admin-Prüfung markieren, nicht hart blockieren
- [ ] Alle Testuser löschen (sauberer Start), u. a. julia.andi@web.de

## Bekannte To-dos

- [ ] Datei-Uploads (Team-Logo / Mannschaftsbild) via Supabase Storage (aktuell URL-Felder)
- [ ] Übernahme freigegebener Anmeldungen in offizielle Team-/Saisondaten (`applyApprovedTeamRegistration` ist noch Stub)
- [ ] Teamname in `team_linked`/`role_changed`-Notifications (serverseitig im Trigger nicht auflösbar — Teamnamen liegen in lib/data; ggf. clientseitig nachziehen)
- [ ] Optionale User-Eingangsmail bei Registrierung bewusst ausgelassen (Supabase verschickt bereits Verifizierungs-Mail)

## Spielerstatistik an Dartlogik anpassen ✅ (Zwischensprint, Juni 2026)

Priorität: Hoch — fachliche Korrektheit

- [x] Unentschieden bei Spielerstatistiken entfernen (Spieler spielen Einzelspiele: 2:0 / 2:1 / 1:2 / 0:2)
- [x] Siege/Niederlagen durch Gewonnen/Verloren bei Einzelspielen ersetzen
- [x] Offizielle Spalte „Sp." als Einzelspiel-Bilanz verwenden (z. B. 30:2)
- [x] Offizielle Spalte „Legs" als Leg-Bilanz importieren und anzeigen (z. B. 62:14)
- [ ] Langfristig: 2:0 / 2:1 / 1:2 / 0:2-Splits ergänzen (Premium-Statistik —
      Datenfelder `wins20/wins21/losses12/losses02` sind vorbereitet, Werte
      werden NICHT erfunden; Anzeige erst, wenn echte Daten vorliegen)

Hinweis: Team-Statistiken behalten ihr Unentschieden — Mannschaftsspiele
(18 Einzelspiele) können 9:9 ausgehen. Diese Änderung betrifft nur Spieler.

## Offene Themen (aus früheren Sprints)

- [x] Supabase produktiv geschaltet (Projekt live, ENV gesetzt, Auth aktiv) (Sprint 5.2)
- [ ] Mein Bereich: restliche Coming-Soon-Kacheln umsetzen (v. a. Profilbild —
      hängt an Supabase Storage; Mannschaftsanmeldung/News-Pflege erledigt)
- [ ] Spitznamen-Speicherung im Profil an Supabase anbinden
- [ ] Darts-Spezialwerte (180er, 171er, High Finishes, Short Legs) — Felder
      vorbereitet, Datenquelle fehlt noch
- [ ] Formkurve / letzte Einzelergebnisse — Felder vorbereitet (W/L, kein
      Unentschieden), Datenquelle fehlt noch
