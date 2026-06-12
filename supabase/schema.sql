-- ============================================================
-- MDU Platform — Supabase Schema (Sprint 5.2)
-- ============================================================
--
-- Ausführen im Supabase-Dashboard unter SQL Editor
-- (oder via supabase CLI: supabase db push / Migration).
--
-- Inhalt:
--   1. profiles-Tabelle (1:1 zu auth.users)
--   2. updated_at-Trigger
--   3. Auto-Profil-Trigger bei Registrierung
--   4. Row Level Security (RLS)
--
-- WICHTIG:
--   • Super Admins werden ausschließlich manuell gesetzt
--     (SQL unten, Abschnitt 5) — niemals über die Registrierung.
--   • Rollen dürfen nur Admins ändern; Nutzer können die eigene
--     Rolle NICHT selbst eskalieren (RLS-Policy unten).
-- ============================================================


-- ── 1. profiles-Tabelle ──────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  display_name text not null,
  role        text not null default 'player'
              check (role in ('guest', 'player', 'team_captain', 'league_admin', 'super_admin')),
  -- Optionale Verknüpfungen mit den App-Daten (Slugs aus lib/data)
  player_id   text,
  team_id     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'App-Benutzerprofile (Rolle, Spieler-/Team-Verknüpfung). 1:1 zu auth.users.';


-- ── 2. updated_at automatisch pflegen ────────────────────────

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();


-- ── 3. Auto-Profil bei Registrierung ─────────────────────────
-- Erstellt für jeden neuen auth.users-Eintrag automatisch ein
-- Profil. display_name aus user_metadata, Fallback E-Mail.
-- Standardrolle: player (NIEMALS admin über Registrierung).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    ),
    'player'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 4. Row Level Security ────────────────────────────────────

alter table public.profiles enable row level security;

-- Helper: ist der aktuelle Benutzer Admin (league_admin/super_admin)?
-- SECURITY DEFINER umgeht RLS für genau diese eine Prüfung und
-- verhindert damit rekursive Policy-Auswertung auf profiles.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('league_admin', 'super_admin')
  );
$$;

-- Eigenes Profil lesen
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins dürfen alle Profile lesen
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- Eigenes Profil eingeschränkt bearbeiten:
-- display_name etc. ja — aber Rolle und Verknüpfungen NICHT selbst
-- ändern (with check verhindert Selbst-Eskalation).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role      = (select p.role      from public.profiles p where p.id = auth.uid())
    and player_id is not distinct from (select p.player_id from public.profiles p where p.id = auth.uid())
    and team_id   is not distinct from (select p.team_id   from public.profiles p where p.id = auth.uid())
  );

-- Admins dürfen Profile verwalten (inkl. Rollenvergabe)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- Eigenes Profil anlegen (Fallback, falls der Trigger fehlt —
-- z. B. bei Bestandskonten). Rolle ist dabei fest 'player'.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id and role = 'player');


-- ── 5. Super Admin manuell setzen ────────────────────────────
-- Nach der Registrierung des Admin-Kontos einmalig ausführen
-- (E-Mail anpassen):
--
--   update public.profiles
--   set role = 'super_admin'
--   where email = 'admin@example.com';
