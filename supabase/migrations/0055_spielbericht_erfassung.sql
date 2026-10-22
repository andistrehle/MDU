-- ============================================================
-- 0055 — Wie werden Spielberichte erfasst? (Betreiber, 22.10.2026)
-- ============================================================
-- Je Speichern eines Spielberichts eine Zeile: Uhrzeit, wie viele der Spiele
-- schon ein Ergebnis haben, ob der Live-Modus offen war und wann auf dem Gerät
-- das erste/letzte Spielergebnis eingetippt wurde (das Formular sichert sich
-- lokal — wer live tippt, speichert womöglich erst am Ende). Daraus liest
-- Admin → Erfassung, ob ein Team live am Automaten einträgt, ein Foto
-- hochlädt (match_reports.source = 'ocr') oder den Zettel hinterher abtippt.
--
-- Schreiben darf, wer den Bericht sehen darf (RLS von match_reports greift
-- im exists), und nur unter eigener Kennung. Lesen nur der Server
-- (service_role) — keine select-Policy.
-- ============================================================

create table if not exists public.match_report_saves (
  id             bigserial primary key,
  report_id      uuid not null references public.match_reports (id) on delete cascade,
  saved_at       timestamptz not null default now(),
  games_filled   integer not null default 0 check (games_filled between 0 and 40),
  live_mode      boolean not null default false,
  first_input_at timestamptz,
  last_input_at  timestamptz,
  actor_user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade
);

create index if not exists match_report_saves_report_idx on public.match_report_saves (report_id, saved_at);

alter table public.match_report_saves enable row level security;

drop policy if exists "mrs_insert" on public.match_report_saves;
create policy "mrs_insert" on public.match_report_saves for insert
  to authenticated
  with check (
    actor_user_id = auth.uid()
    and exists (select 1 from public.match_reports r where r.id = report_id)
  );
