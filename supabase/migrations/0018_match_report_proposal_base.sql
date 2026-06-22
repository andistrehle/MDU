-- ============================================================
-- MDU Platform — Migration 0018: Basis-Snapshot für Vorschlags-Vergleich
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0017).
--
-- proposal_base = Spiel-Ergebnisse zum Zeitpunkt des Vorschlags (Ausgangswert).
-- Damit kann angezeigt werden, welche vorgeschlagenen Änderungen ÜBERNOMMEN
-- wurden (grün) und welche abweichen (gold) — pro Spiel: Basis → aktuell.
-- ============================================================

alter table public.match_reports add column if not exists proposal_base jsonb;
