-- ============================================================
-- MDU Platform — Migration 0034: Eindeutigkeit / Dubletten-Schutz
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0033).
--
-- Zwei harte DB-Regeln vor dem Go-live:
--
--   (1) 1 Spielerprofil = 1 Konto
--       Ein Spieler-Slug (profiles.player_id) darf mit HÖCHSTENS EINEM
--       Benutzerkonto verknüpft sein. Die Gegenrichtung (Konto -> Spieler) ist
--       bereits 1:1, weil profiles genau eine player_id-Spalte hat.
--
--   (2) Jedes bestehende Team nur 1x pro Saison FREIGEGEBEN
--       Fuer eine bestehende Mannschaft (source_team_id) darf es je Saison nur
--       eine 'approved' Anmeldung geben. Entwuerfe/eingereichte/abgelehnte
--       zaehlen bewusst NICHT mit (nur der freigegebene Endzustand ist eindeutig).
--
-- Bewusst NICHT per Constraint (Betreiber-Entscheidung, siehe docs/BACKLOG.md):
--   * Namensgleichheit NEUER Teams (source_team_id IS NULL) wird nur zur
--     Admin-Pruefung markiert, NICHT hart blockiert -> daher KEIN unique auf
--     team_name / neue Teams.
--
-- ------------------------------------------------------------
-- WICHTIG — ZUERST bestehende Dubletten pruefen und aufloesen!
-- ------------------------------------------------------------
-- Ein CREATE UNIQUE INDEX schlaegt fehl, wenn schon Dubletten existieren
-- (das ist gewollt: bitte von Hand aufloesen, NICHT automatisch Daten loeschen).
-- Insbesondere ZUERST die Demo-/Testkonten entfernen — das Demo-Spieler-Konto
-- belegt player_id = 'andreas-strehle' und wuerde sonst mit einem echten Konto
-- kollidieren (scripts/cleanup-demo-video.mjs + scripts/cleanup-test-data.mjs).
--
-- Pruef-Queries (reine SELECTs, veraendern nichts):
--
--   -- (1) Selber Spieler-Slug an mehreren Konten?
--   select player_id, count(*) as konten, array_agg(email order by created_at) as emails
--   from public.profiles
--   where player_id is not null and player_id <> ''
--   group by player_id
--   having count(*) > 1;
--
--   -- (2) Bestehendes Team mehrfach je Saison freigegeben?
--   select season_id, source_team_id, count(*) as freigaben
--   from public.team_registrations
--   where status = 'approved' and source_team_id is not null and source_team_id <> ''
--   group by season_id, source_team_id
--   having count(*) > 1;
--
-- Beide Queries muessen 0 Zeilen liefern, bevor die Indizes unten angelegt werden.
-- ============================================================


-- ── (1) 1 Spielerprofil = 1 Konto ────────────────────────────
create unique index if not exists profiles_player_id_uniq
  on public.profiles (player_id)
  where player_id is not null and player_id <> '';


-- ── (2) Jedes bestehende Team nur 1x pro Saison freigegeben ──
create unique index if not exists team_registrations_approved_team_season_uniq
  on public.team_registrations (season_id, source_team_id)
  where status = 'approved' and source_team_id is not null and source_team_id <> '';
