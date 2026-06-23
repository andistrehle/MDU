-- ============================================================
-- MDU Platform — Migration 0020: Highlights im Spielbericht
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0019).
--
-- Highlight-Felder je Mannschaft (z. B. 180er, 171er, High Finishes,
-- Short Legs) — wie auf dem MDU-Spielberichtsbogen.
-- ============================================================

alter table public.match_reports add column if not exists highlights_home  text;
alter table public.match_reports add column if not exists highlights_guest text;
