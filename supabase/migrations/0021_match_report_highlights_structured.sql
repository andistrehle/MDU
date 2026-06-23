-- ============================================================
-- MDU Platform — Migration 0021: Strukturierte Highlights
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0020).
--
-- Highlights eindeutig erfassbar (für spätere Spielerstatistik):
-- Array von Einträgen { side, slot, type, value } in highlights (jsonb).
--   type: '180' | '171' | 'high_finish' | 'short_leg'
--   value: nur bei high_finish (Checkout) / short_leg (Darts)
-- Die alten Freitextfelder (0020) bleiben bestehen, werden aber nicht mehr
-- befüllt.
-- ============================================================

alter table public.match_reports add column if not exists highlights jsonb;
