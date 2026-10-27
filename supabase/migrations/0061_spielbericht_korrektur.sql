-- ============================================================
-- 0061 — Korrektur eines bestätigten Spielberichts durch die TCs
--        (Betreiber, 27.10.2026)
-- ============================================================
-- Ein TC (Heim ODER Gast) fragt bis 7 Tage nach dem Spiel eine Korrektur an
-- (Spieler je Spiel, Ergebnisse, Aufstellung, Highlights) — nur mit
-- Begründung. Der TC des anderen Teams bestätigt oder lehnt ab; antwortet er
-- nicht, entscheidet die Ligaleitung. Erst mit der Bestätigung gilt die
-- Korrektur, bis dahin bleibt der alte Stand öffentlich („Korrektur
-- angefragt“).
--
-- `changes` = neuer Stand { players, games, highlights }, `base` = Stand beim
-- Anfragen (Vergleich + Schutz: hat sich der Bericht inzwischen geändert,
-- wird nichts übernommen). Je Bericht höchstens EINE offene Anfrage.
-- Gelesen und geschrieben wird nur vom Server (/api/match-reports/korrektur,
-- service_role) — deshalb RLS an und keine Policy.
-- ============================================================

create table if not exists public.match_report_corrections (
  id                 uuid primary key default gen_random_uuid(),
  report_id          uuid not null references public.match_reports (id) on delete cascade,
  requested_by       uuid references auth.users (id) on delete set null,
  requested_team_id  text,
  confirm_team_id    text,
  reason             text not null check (char_length(trim(reason)) >= 15),
  changes            jsonb not null,
  base               jsonb not null,
  status             text not null default 'offen'
                     check (status in ('offen', 'bestaetigt', 'abgelehnt', 'zurueckgezogen')),
  decided_by         uuid references auth.users (id) on delete set null,
  decided_at         timestamptz,
  decision_note      text,
  created_at         timestamptz not null default now()
);

create index if not exists match_report_corrections_report_idx
  on public.match_report_corrections (report_id, created_at desc);

create unique index if not exists match_report_corrections_eine_offene
  on public.match_report_corrections (report_id) where status = 'offen';

alter table public.match_report_corrections enable row level security;
