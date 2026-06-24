-- ============================================================
-- MDU Platform — Migration 0024: Seiten-Gruppierung für OCR-Uploads
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0023).
--
-- Ein Papier-Spielbericht kann aus mehreren Seiten bestehen (Seite 1 =
-- Spielbericht, Seite 2 = Highlights). Ohne vorab gewählte Begegnung gibt es
-- keinen gemeinsamen Schlüssel zwischen den einzelnen Upload-Zeilen. `page_group_id`
-- verbindet die zusammengehörigen Seiten (Wert = id der ersten/Hauptseite),
-- damit die Prüfansicht alle Seiten zusammen anzeigen kann.
-- Rein additiv; bestehende Spalten/Policies bleiben unangetastet.
-- ============================================================

alter table public.match_report_uploads
  add column if not exists page_group_id uuid;

create index if not exists mru_page_group_idx
  on public.match_report_uploads (page_group_id);
