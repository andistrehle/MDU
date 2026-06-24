-- ============================================================
-- MDU Platform — Migration 0025: Einwilligung Profil-Veröffentlichung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0024).
--
-- Freiwillige Einwilligung (DSGVO Art. 6 Abs. 1 lit. a) zur öffentlichen
-- Anzeige von Spitzname und Profilbild. Standard = AUS (keine Veröffentlichung
-- ohne aktive Zustimmung); jederzeit widerrufbar (Häkchen entfernen).
-- Rein additiv; bestehende Spalten/Policies bleiben unangetastet.
-- ============================================================

alter table public.player_profiles
  add column if not exists show_nickname     boolean not null default false,
  add column if not exists show_photo        boolean not null default false,
  add column if not exists consent_updated_at timestamptz;
