-- ============================================================
-- MDU Platform — Migration 0039: Passnummern eindeutig machen
-- ============================================================
--
-- Verhindert künftige Doppelvergabe von Passnummern auf DB-Ebene. Jeder
-- Schreibversuch mit einer bereits vergebenen Nummer schlägt dann fehl,
-- statt still eine Dublette anzulegen.
--
-- WICHTIG: Bestehende Dubletten VORHER bereinigen (Admin → Saison-Teams →
-- 🗑 an der doppelten Zeile). Solange Dubletten existieren, kann der eindeutige
-- Index nicht angelegt werden — Postgres nennt dann die kollidierende Nummer.
--
-- Zum Finden vorhandener Dubletten:
--   select license_number, count(*) from public.players
--     where license_number is not null group by 1 having count(*) > 1;
--   select season_id, license_number, count(*) from public.season_roster_assignments
--     where license_number is not null group by 1,2 having count(*) > 1;
-- ============================================================

-- Global eindeutige Passnummer je Spielerprofil.
create unique index if not exists players_license_uniq
  on public.players (license_number)
  where license_number is not null;

-- Eindeutige Passnummer je Saison im Kader.
create unique index if not exists sra_season_license_uniq
  on public.season_roster_assignments (season_id, license_number)
  where license_number is not null;
