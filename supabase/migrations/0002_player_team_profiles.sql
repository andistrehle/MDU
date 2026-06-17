-- ============================================================
-- MDU Platform — Migration 0002: Spieler- & Team-Profile (Sprint 5.4)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach supabase/schema.sql).
--
-- Zweck: editierbare Zusatzdaten zu den (statischen) Spielern/Teams aus
-- lib/data. Schlüssel sind die Slugs (text), z. B. 'manuel-rauch' /
-- 'freibad-bazis' — passend zu profiles.player_id / profiles.team_id.
--
-- Sicherheit (RLS):
--   • Lesen: öffentlich (Profile/Teamseiten sind öffentlich).
--   • Spieler: darf NUR die Zeile mit seiner eigenen player_id ändern.
--   • Teamkapitän: darf NUR die Zeile mit seiner eigenen team_id ändern.
--   • Ligaleitung/Super Admin: dürfen alle ändern (is_admin()).
--   • Kein service_role im Frontend nötig.
-- ============================================================


-- ── Hilfsfunktionen (lesen die Zuordnung aus profiles) ───────

create or replace function public.current_player_id()
returns text
language sql security definer set search_path = public stable
as $$ select player_id from public.profiles where id = auth.uid() $$;

create or replace function public.current_team_id()
returns text
language sql security definer set search_path = public stable
as $$
  select team_id from public.profiles
  where id = auth.uid() and role = 'team_captain'
$$;


-- ── 1. player_profiles ───────────────────────────────────────

create table if not exists public.player_profiles (
  player_id         text primary key,           -- Slug aus lib/data/players.ts
  nickname          text,
  about_me          text,
  profile_image_url text,
  updated_by        uuid references auth.users (id),
  updated_at        timestamptz not null default now()
);

comment on table public.player_profiles is
  'Editierbare Zusatzdaten zu Spielern (Spitzname, Über mich, Bild). Key = Spieler-Slug.';

drop trigger if exists player_profiles_updated_at on public.player_profiles;
create trigger player_profiles_updated_at
  before update on public.player_profiles
  for each row execute function public.handle_updated_at();

alter table public.player_profiles enable row level security;

drop policy if exists "player_profiles_read" on public.player_profiles;
create policy "player_profiles_read"
  on public.player_profiles for select using (true);

drop policy if exists "player_profiles_write_own" on public.player_profiles;
create policy "player_profiles_write_own"
  on public.player_profiles for insert
  with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists "player_profiles_update_own" on public.player_profiles;
create policy "player_profiles_update_own"
  on public.player_profiles for update
  using (player_id = public.current_player_id() or public.is_admin())
  with check (player_id = public.current_player_id() or public.is_admin());


-- ── 2. team_profiles ─────────────────────────────────────────

create table if not exists public.team_profiles (
  team_id        text primary key,              -- Slug aus lib/data/teams.ts
  description    text,
  logo_url       text,
  team_image_url text,
  instagram_url  text,
  facebook_url   text,
  website_url    text,
  updated_by     uuid references auth.users (id),
  updated_at     timestamptz not null default now()
);

comment on table public.team_profiles is
  'Editierbare Zusatzdaten zu Teams (Beschreibung, Logo, Social Media). Key = Team-Slug.';

drop trigger if exists team_profiles_updated_at on public.team_profiles;
create trigger team_profiles_updated_at
  before update on public.team_profiles
  for each row execute function public.handle_updated_at();

alter table public.team_profiles enable row level security;

drop policy if exists "team_profiles_read" on public.team_profiles;
create policy "team_profiles_read"
  on public.team_profiles for select using (true);

drop policy if exists "team_profiles_write_own" on public.team_profiles;
create policy "team_profiles_write_own"
  on public.team_profiles for insert
  with check (team_id = public.current_team_id() or public.is_admin());

drop policy if exists "team_profiles_update_own" on public.team_profiles;
create policy "team_profiles_update_own"
  on public.team_profiles for update
  using (team_id = public.current_team_id() or public.is_admin())
  with check (team_id = public.current_team_id() or public.is_admin());

-- Hinweis: Bild-Uploads (profile_image_url / logo_url / team_image_url)
-- benötigen später einen Supabase Storage Bucket. Für diesen Sprint werden
-- die *_url-Felder vorbereitet; das eigentliche Hochladen (Storage) folgt.
