-- ============================================================
-- MDU Platform — Migration 0022: Nachmeldung – letzte Liga-Erfahrung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0021).
-- ============================================================

alter table public.player_nominations
  add column if not exists last_league text
  check (last_league is null or last_league in ('la_liga','a_liga','b_liga','c_liga','none'));
