-- ============================================================
-- 0045 — Spieltag-Ansicht: Treffzeit + Aufstellung je Team und Spiel
-- ============================================================
--
-- Vom Betreiber festgelegt (12.10.2026):
--   • Ende = Beginn + 3,5 Std. (gerechnet, nicht gespeichert).
--   • Treffen: Vorgabe je Team (Minuten vor Beginn, Standard 30, 0 = kein
--     Treffen), je Spiel vom Kapitän überschreibbar (Uhrzeit).
--   • Aufstellung: Kapitän wählt Spieler aus den Zusagen; das Team sieht sie.
-- Freischaltung wie 0043 (zusagen_aktiv). Nichts Bestehendes wird geändert
-- außer einer neuen Spalte mit Vorgabewert.
-- ============================================================

alter table public.team_availability_settings
  add column if not exists meet_minutes int not null default 30 check (meet_minutes between 0 and 180);

create table if not exists public.match_team_details (
  season_id  text not null,
  match_key  text not null,               -- Heim|Gast
  team_id    text not null,
  meet_time  text check (meet_time is null or meet_time ~ '^[0-2][0-9]:[0-5][0-9]$'),  -- Treffen (überschreibt die Vorgabe)
  lineup     text[] not null default '{}', -- Spieler-IDs (wie match_availability.player_id)
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (season_id, match_key, team_id)
);

alter table public.match_team_details enable row level security;

drop policy if exists "match_team_details_select" on public.match_team_details;
create policy "match_team_details_select" on public.match_team_details for select
  using (public.in_team(team_id) or public.is_admin());

drop policy if exists "match_team_details_write" on public.match_team_details;
create policy "match_team_details_write" on public.match_team_details for all
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()))
  with check (updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));
