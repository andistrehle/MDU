-- ============================================================
-- MDU Platform — Migration 0032: Spieler & Kader in die DB
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0031).
--
-- Überführt den Spielerstamm und die Kader-/Team-Zusammensetzung von der
-- statischen Basis (lib/data) in die DB. Ab jetzt pflegt die Plattform diese
-- Daten selbst (nichts mehr über dartunion). Die Übernahme der vorhandenen
-- Daten erfolgt per Seed-Script:  npx tsx scripts/seed-players-roster.mts
-- (rein additiv/idempotent — kann gefahrlos erneut laufen).
-- ============================================================

-- ── Spielerstamm ─────────────────────────────────────────────
create table if not exists public.players (
  id             text primary key,          -- Slug (wie profiles.player_id)
  first_name     text not null,
  last_name      text not null,
  display_name   text,
  nickname       text,
  license_number text,                       -- Passnummer
  status         text not null default 'active',
  photo_url      text,
  source         text not null default 'dartunion',   -- 'dartunion' | 'nomination'
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Kader-/Team-Zusammensetzung (wer spielt wo, je Saison) ───
create table if not exists public.player_assignments (
  id          text primary key,             -- stabile ID (z. B. 'tpa-2026-...')
  season_id   text not null,
  team_id     text not null,
  player_id   text not null references public.players (id) on delete cascade,
  status      text not null default 'active' check (status in ('active','inactive','substitute','unknown')),
  is_captain  boolean not null default false,
  source      text not null default 'dartunion',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists player_assignments_team_season_idx
  on public.player_assignments (team_id, season_id);
create unique index if not exists player_assignments_uniq
  on public.player_assignments (season_id, team_id, player_id);

-- ── updated_at-Trigger ───────────────────────────────────────
drop trigger if exists players_updated_at on public.players;
create trigger players_updated_at before update on public.players
  for each row execute function public.handle_updated_at();
drop trigger if exists player_assignments_updated_at on public.player_assignments;
create trigger player_assignments_updated_at before update on public.player_assignments
  for each row execute function public.handle_updated_at();

-- ── RLS: öffentlich lesbar, nur Ligaleitung/Super-Admin schreibt ─
alter table public.players enable row level security;
alter table public.player_assignments enable row level security;

drop policy if exists "players_read" on public.players;
create policy "players_read" on public.players for select using (true);
drop policy if exists "players_write" on public.players;
create policy "players_write" on public.players for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pa_read" on public.player_assignments;
create policy "pa_read" on public.player_assignments for select using (true);
drop policy if exists "pa_write" on public.player_assignments;
create policy "pa_write" on public.player_assignments for all
  using (public.is_admin()) with check (public.is_admin());
