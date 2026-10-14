-- ============================================================
-- 0049 — Team Manager: Farbe je eigenem Termin
-- ============================================================
-- Vom Betreiber gewünscht (14.10.2026): eigene Termine sollen sich deutlich
-- von den MDU-Spielen abheben, die Farbe wählt der TC selbst. Erlaubt sind
-- nur die Farben aus TERMIN_FARBEN (lib/supabase/termine.ts); null = Standard
-- (Violett). Nur eine Spalte kommt dazu, sonst bleibt alles unverändert.
-- ============================================================

alter table public.team_events
  add column if not exists color text
  check (color is null or color in ('#7C5CD6', '#E07A1F', '#0F9A9A', '#D6457E', '#B8860B', '#5C6470'));
