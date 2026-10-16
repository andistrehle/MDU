-- ============================================================
-- 0051 — Team Manager: Teamkasse
-- ============================================================
--
-- Vom Betreiber festgelegt (16.10.2026), Vorbild SpielerPlus-Teamkasse:
--   • Strafenkatalog + Strafen, Beiträge, Kassenbuch, Kontostand je Spieler.
--   • Buchen dürfen der TC und ein Kassenwart, den der TC bestimmt
--     (Ligaleitung immer). Alle im Team sehen ALLES (auch wer was offen hat).
--   • KEINE Erinnerungen in der Glocke.
--   • Premium wie der ganze Team Manager: nur freigeschaltete Teams
--     (zusagen_aktiv, Migration 0043).
--
-- Spieler werden über die Kader-Kennung geführt (players.id, bei Kaderzeilen
-- ohne Profil „name:Vorname Nachname“ — wie lib/supabase/season-teams.ts
-- ladeKader), damit auch Spieler OHNE Konto Strafen und Beiträge haben können.
-- Beträge in Cent. Die Kasse gehört dem Team, nicht der Saison.
-- Bestehendes bleibt unverändert; nichts wird gelöscht.
-- ============================================================

create table if not exists public.team_cash_settings (
  team_id             text primary key,
  treasurer_player_id text,                                   -- Kassenwart (players.id, braucht ein Konto)
  opening_cents       integer not null default 0 check (opening_cents between -10000000 and 10000000),
  updated_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now()
);

create table if not exists public.team_fine_types (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null,
  title         text not null check (char_length(btrim(title)) between 1 and 60),
  amount_cents  integer not null check (amount_cents between 1 and 100000),
  sort          integer not null default 0,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists team_fine_types_team_idx on public.team_fine_types (team_id, sort);

create table if not exists public.team_cash_entries (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null,
  kind          text not null check (kind in ('strafe', 'beitrag', 'einnahme', 'ausgabe')),
  player_key    text,                                          -- nur Strafe/Beitrag
  player_name   text check (player_name is null or char_length(player_name) <= 80),
  title         text not null check (char_length(btrim(title)) between 1 and 80),
  amount_cents  integer not null check (amount_cents between 1 and 10000000),
  entry_date    date not null default current_date,
  paid_at       timestamptz,                                   -- Strafe/Beitrag bezahlt → zählt in die Kasse
  paid_by       uuid references auth.users (id) on delete set null,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  check ((kind in ('strafe', 'beitrag') and player_key is not null and player_name is not null)
      or (kind in ('einnahme', 'ausgabe') and player_key is null and paid_at is null))
);
create index if not exists team_cash_entries_team_idx on public.team_cash_entries (team_id, entry_date desc);

-- Wer darf buchen? TC, Kassenwart, Ligaleitung — und nur bei freigeschalteten Teams.
create or replace function public.kasse_darf(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$
  select public.zusagen_aktiv(p_team) and (
    public.is_captain_of(p_team) or public.is_admin()
    or (public.in_team(p_team) and exists (
      select 1 from public.team_cash_settings s
      where s.team_id = p_team and s.treasurer_player_id is not null
        and s.treasurer_player_id = public.current_player_id()))
  )
$$;

alter table public.team_cash_settings enable row level security;
alter table public.team_fine_types   enable row level security;
alter table public.team_cash_entries enable row level security;

-- Lesen: ganzes Team + Ligaleitung.
drop policy if exists "cash_settings_select" on public.team_cash_settings;
create policy "cash_settings_select" on public.team_cash_settings for select using (public.in_team(team_id) or public.is_admin());
drop policy if exists "fine_types_select" on public.team_fine_types;
create policy "fine_types_select" on public.team_fine_types for select using (public.in_team(team_id) or public.is_admin());
drop policy if exists "cash_entries_select" on public.team_cash_entries;
create policy "cash_entries_select" on public.team_cash_entries for select using (public.in_team(team_id) or public.is_admin());

-- Einstellungen (Kassenwart, Anfangsbestand): nur TC + Ligaleitung.
drop policy if exists "cash_settings_insert" on public.team_cash_settings;
create policy "cash_settings_insert" on public.team_cash_settings for insert
  with check (updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));
drop policy if exists "cash_settings_update" on public.team_cash_settings;
create policy "cash_settings_update" on public.team_cash_settings for update
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()))
  with check (updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

-- Strafenkatalog und Buchungen: TC, Kassenwart, Ligaleitung.
drop policy if exists "fine_types_insert" on public.team_fine_types;
create policy "fine_types_insert" on public.team_fine_types for insert with check (created_by = auth.uid() and public.kasse_darf(team_id));
drop policy if exists "fine_types_update" on public.team_fine_types;
create policy "fine_types_update" on public.team_fine_types for update using (public.kasse_darf(team_id)) with check (public.kasse_darf(team_id));
drop policy if exists "fine_types_delete" on public.team_fine_types;
create policy "fine_types_delete" on public.team_fine_types for delete using (public.kasse_darf(team_id));

drop policy if exists "cash_entries_insert" on public.team_cash_entries;
create policy "cash_entries_insert" on public.team_cash_entries for insert with check (created_by = auth.uid() and public.kasse_darf(team_id));
drop policy if exists "cash_entries_update" on public.team_cash_entries;
create policy "cash_entries_update" on public.team_cash_entries for update using (public.kasse_darf(team_id)) with check (public.kasse_darf(team_id));
drop policy if exists "cash_entries_delete" on public.team_cash_entries;
create policy "cash_entries_delete" on public.team_cash_entries for delete using (public.kasse_darf(team_id));
