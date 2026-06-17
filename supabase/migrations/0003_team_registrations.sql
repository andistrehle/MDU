-- ============================================================
-- MDU Platform — Migration 0003: Mannschaftsanmeldung (Sprint)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0002).
--
-- Tabellen:
--   team_registrations          — eine Anmeldung pro Mannschaft/Saison
--   team_registration_players   — Kader der Anmeldung
--
-- Workflow-Status: draft → submitted → in_review → approved/rejected/changes_requested
--
-- Sicherheit (RLS):
--   • Ersteller: eigene Anmeldung lesen; bearbeiten nur solange
--     status in ('draft','changes_requested'); darf NICHT selbst
--     approved/rejected/in_review setzen.
--   • Ligaleitung/Super Admin (is_admin()): alle lesen + jeden Status setzen.
--   • Kein service_role im Frontend.
-- ============================================================


-- ── 1. team_registrations ────────────────────────────────────

create table if not exists public.team_registrations (
  id             uuid primary key default gen_random_uuid(),
  season_id      text not null,
  source_team_id text,
  is_new_team    boolean not null default false,
  team_name      text not null,
  short_name     text,
  description    text,
  logo_url       text,
  team_image_url text,
  venue_name     text,
  venue_address  text,
  venue_info     text,
  contact_name   text not null,
  contact_email  text not null,
  contact_phone  text,
  instagram_url  text,
  facebook_url   text,
  website_url    text,
  notes          text,
  status         text not null default 'draft'
                 check (status in ('draft','submitted','in_review','approved','rejected','changes_requested')),
  review_note    text,
  submitted_by   uuid not null references auth.users (id) default auth.uid(),
  reviewed_by    uuid references auth.users (id),
  submitted_at   timestamptz,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.team_registrations is
  'Online-Mannschaftsanmeldungen mit Freigabe-Workflow.';

drop trigger if exists team_registrations_updated_at on public.team_registrations;
create trigger team_registrations_updated_at
  before update on public.team_registrations
  for each row execute function public.handle_updated_at();


-- ── 2. team_registration_players ─────────────────────────────

create table if not exists public.team_registration_players (
  id                 uuid primary key default gen_random_uuid(),
  registration_id    uuid not null references public.team_registrations (id) on delete cascade,
  player_id          text,
  first_name         text not null,
  last_name          text not null,
  display_name       text not null,
  license_number     text,
  is_captain         boolean not null default false,
  is_existing_player boolean not null default true,
  status             text not null default 'active',
  created_at         timestamptz not null default now()
);

create index if not exists trp_registration_idx
  on public.team_registration_players (registration_id);


-- ── 3. Helper: Anmeldung gehört dem aktuellen Nutzer? ────────

create or replace function public.owns_registration(reg uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.team_registrations r
    where r.id = reg and r.submitted_by = auth.uid()
  );
$$;

create or replace function public.registration_editable(reg uuid)
returns boolean
language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.team_registrations r
    where r.id = reg and r.submitted_by = auth.uid()
      and r.status in ('draft','changes_requested')
  );
$$;


-- ── 4. RLS: team_registrations ───────────────────────────────

alter table public.team_registrations enable row level security;

drop policy if exists "treg_select" on public.team_registrations;
create policy "treg_select" on public.team_registrations for select
  using (submitted_by = auth.uid() or public.is_admin());

drop policy if exists "treg_insert_own" on public.team_registrations;
create policy "treg_insert_own" on public.team_registrations for insert
  with check (submitted_by = auth.uid());

-- Ersteller: bearbeiten/absenden, solange draft/changes_requested;
-- darf Status nur auf draft/submitted/changes_requested setzen (keine Selbst-Freigabe).
drop policy if exists "treg_update_own" on public.team_registrations;
create policy "treg_update_own" on public.team_registrations for update
  using (submitted_by = auth.uid() and status in ('draft','changes_requested'))
  with check (submitted_by = auth.uid() and status in ('draft','submitted','changes_requested'));

-- Admin: alles lesen/ändern (jeder Status)
drop policy if exists "treg_update_admin" on public.team_registrations;
create policy "treg_update_admin" on public.team_registrations for update
  using (public.is_admin()) with check (public.is_admin());

-- Ersteller darf eigenen Entwurf löschen; Admin alles
drop policy if exists "treg_delete" on public.team_registrations;
create policy "treg_delete" on public.team_registrations for delete
  using ((submitted_by = auth.uid() and status = 'draft') or public.is_admin());


-- ── 5. RLS: team_registration_players ────────────────────────

alter table public.team_registration_players enable row level security;

drop policy if exists "trp_select" on public.team_registration_players;
create policy "trp_select" on public.team_registration_players for select
  using (public.owns_registration(registration_id) or public.is_admin());

drop policy if exists "trp_insert" on public.team_registration_players;
create policy "trp_insert" on public.team_registration_players for insert
  with check (public.registration_editable(registration_id) or public.is_admin());

drop policy if exists "trp_update" on public.team_registration_players;
create policy "trp_update" on public.team_registration_players for update
  using (public.registration_editable(registration_id) or public.is_admin())
  with check (public.registration_editable(registration_id) or public.is_admin());

drop policy if exists "trp_delete" on public.team_registration_players;
create policy "trp_delete" on public.team_registration_players for delete
  using (public.registration_editable(registration_id) or public.is_admin());


-- ── 6. Supabase Storage (manuell anlegen) ────────────────────
-- TODO: Bucket "team-assets" (public read) im Supabase-Dashboard anlegen
--       und Upload-Policy auf eingeloggte Nutzer beschränken. Bis dahin
--       werden logo_url / team_image_url als URL-Felder gepflegt.
