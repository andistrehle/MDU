-- ============================================================
-- 0053 — Heimrechttausch durch die Teamcaptains (Saison 2026/27)
-- ============================================================
--
-- Vom Betreiber festgelegt (20.10.2026): An derselben Stelle wie „Spiel
-- verlegen“ können TCs einen Heimrechttausch anfragen. Bei einer Paarung
-- tauschen Hin- und Rückspiel Heim/Gast; Datum und Uhrzeit bleiben. Der
-- Gegner-TC bestätigt, die Ligaleitung wird nur informiert. Nur solange für
-- keines der beiden Spiele ein Spielbericht existiert.
--
-- Die Anfragen liegen in derselben Tabelle wie die Verlegungen
-- (match_reschedules, Migration 0050) — neue Spalte kind. Bei 'heimrecht'
-- gibt es keinen neuen Termin (new_date leer); match_key = Hinspiel.
-- Bestehende Zeilen werden 'verlegung'. Nichts wird gelöscht.
-- ============================================================

alter table public.match_reschedules add column if not exists kind text not null default 'verlegung';

alter table public.match_reschedules drop constraint if exists match_reschedules_kind_check;
alter table public.match_reschedules add constraint match_reschedules_kind_check check (kind in ('verlegung', 'heimrecht'));

alter table public.match_reschedules alter column new_date drop not null;
alter table public.match_reschedules drop constraint if exists match_reschedules_datum_check;
alter table public.match_reschedules add constraint match_reschedules_datum_check check (kind = 'heimrecht' or new_date is not null);

-- Je Spiel höchstens EINE laufende Anfrage je Art.
drop index if exists public.match_reschedules_eine_offene;
create unique index if not exists match_reschedules_eine_offene
  on public.match_reschedules (season_id, match_key, kind) where status in ('offen', 'freigabe');
