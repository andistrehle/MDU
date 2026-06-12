# MDU Platform — Backlog / Roadmap

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

- [ ] Supabase produktiv schalten: Projekt anlegen, `.env.local` befüllen,
      `supabase/schema.sql` ausführen, Mock-Flag entfernen (Sprint 5.2)
- [ ] Mein Bereich: Coming-Soon-Kacheln umsetzen (Profilbild, Team verwalten,
      Spielbericht, Mannschaftsanmeldung, News-Pflege, Rollenverwaltung)
- [ ] Spitznamen-Speicherung im Profil an Supabase anbinden
- [ ] Darts-Spezialwerte (180er, 171er, High Finishes, Short Legs) — Felder
      vorbereitet, Datenquelle fehlt noch
- [ ] Formkurve / letzte Einzelergebnisse — Felder vorbereitet (W/L, kein
      Unentschieden), Datenquelle fehlt noch
