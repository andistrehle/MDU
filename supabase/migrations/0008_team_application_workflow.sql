-- ============================================================
-- MDU Platform — Migration 0008: Freigabe → echte Team-/Saisondaten
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0007).
--
-- Persistente, SAISONGETRENNTE Datenstruktur für freigegebene
-- Mannschaftsanmeldungen + eine zentrale, idempotente, serverseitige
-- RPC apply_team_registration().
--
-- WICHTIG zur Sicherheit der laufenden Saison:
--   Das öffentliche Frontend liest die AKTIVE Saison weiterhin statisch aus
--   lib/data (Teams/Assignments/Standings/…). Diese neuen Tabellen sind davon
--   vollständig getrennt. Der Workflow schreibt ausschließlich NEUE Zeilen,
--   immer mit der Ziel-season_id verschlüsselt — niemals werden Zeilen einer
--   anderen Saison verändert. Die aktive Saison bleibt damit unberührt.
--
-- Schreibzugriff läuft ausschließlich über die SECURITY-DEFINER-RPC
-- (Admin-Check). Kein service_role im Frontend.
-- ============================================================


-- ── 1. seasons (Master) ──────────────────────────────────────

create table if not exists public.seasons (
  id                      text primary key,
  name                    text not null,
  year                    integer,
  status                  text not null default 'upcoming'
                          check (status in ('upcoming','registration_open','active','completed','archived')),
  starts_at               date,
  ends_at                 date,
  registration_opens_at   timestamptz,
  registration_closes_at  timestamptz,
  archived_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Seed: laufende Saison 2026 (active, gespiegelt zu lib/data) + Ziel-Saison 2027.
insert into public.seasons (id, name, year, status) values
  ('season-2026', 'Saison 2026', 2026, 'active'),
  ('season-2027', 'Saison 2027', 2027, 'registration_open')
on conflict (id) do nothing;


-- ── 2. teams (Master, saisonübergreifend) ────────────────────

create table if not exists public.teams (
  id                text primary key,
  name              text not null,
  short_name        text,
  logo_url          text,
  team_image_url    text,
  description       text,
  default_venue_id  text,
  instagram_url     text,
  facebook_url      text,
  website_url       text,
  status            text not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);


-- ── 3. venues ────────────────────────────────────────────────

create table if not exists public.venues (
  id          text primary key,
  name        text not null,
  address     text,
  postal_code text,
  city        text,
  maps_url    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- ── 4. season_team_assignments (saisonabhängig) ──────────────

create table if not exists public.season_team_assignments (
  id                       uuid primary key default gen_random_uuid(),
  season_id                text not null references public.seasons (id),
  team_id                  text not null references public.teams (id),
  competition_id           text,
  requested_competition_id text,
  assigned_competition_id  text,
  registration_id          uuid references public.team_registrations (id) on delete set null,
  status                   text not null default 'approved',
  captain_user_id          uuid references auth.users (id),
  captain_player_id        text,
  venue_id                 text references public.venues (id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (season_id, team_id)
);


-- ── 5. season_roster_assignments (saisonabhängig) ────────────

create table if not exists public.season_roster_assignments (
  id                      uuid primary key default gen_random_uuid(),
  season_id               text not null references public.seasons (id),
  team_id                 text not null references public.teams (id),
  player_id               text,
  first_name              text not null,
  last_name               text not null,
  license_number          text,
  is_captain              boolean not null default false,
  status                  text not null default 'active',
  registration_player_id  uuid,
  created_at              timestamptz not null default now()
);

create index if not exists season_roster_team_idx
  on public.season_roster_assignments (season_id, team_id);


-- ── 6. team_registrations: Übernahme-/Ergebnisfelder ─────────

alter table public.team_registrations add column if not exists result_team_id          text;
alter table public.team_registrations add column if not exists applied_at              timestamptz;
alter table public.team_registrations add column if not exists application_status      text;  -- pending|processing|completed|failed
alter table public.team_registrations add column if not exists application_error       text;
alter table public.team_registrations add column if not exists requested_competition_id text;
alter table public.team_registrations add column if not exists assigned_competition_id  text;


-- ── 7. RLS für die neuen Tabellen ────────────────────────────
-- Schreibzugriff erfolgt über die SECURITY-DEFINER-RPC (umgeht RLS).
-- Hier nur Lesepolicies + Admin-Schreibrechte als Fallback.

alter table public.seasons enable row level security;
drop policy if exists "seasons_select_all" on public.seasons;
create policy "seasons_select_all" on public.seasons for select using (true);
drop policy if exists "seasons_admin_write" on public.seasons;
create policy "seasons_admin_write" on public.seasons for all using (public.is_admin()) with check (public.is_admin());

alter table public.teams enable row level security;
drop policy if exists "teams_select_all" on public.teams;
create policy "teams_select_all" on public.teams for select using (true);
drop policy if exists "teams_admin_write" on public.teams;
create policy "teams_admin_write" on public.teams for all using (public.is_admin()) with check (public.is_admin());

alter table public.venues enable row level security;
drop policy if exists "venues_select_all" on public.venues;
create policy "venues_select_all" on public.venues for select using (true);
drop policy if exists "venues_admin_write" on public.venues;
create policy "venues_admin_write" on public.venues for all using (public.is_admin()) with check (public.is_admin());

alter table public.season_team_assignments enable row level security;
drop policy if exists "sta_select" on public.season_team_assignments;
create policy "sta_select" on public.season_team_assignments for select
  using (public.is_admin() or captain_user_id = auth.uid());
drop policy if exists "sta_admin_write" on public.season_team_assignments;
create policy "sta_admin_write" on public.season_team_assignments for all
  using (public.is_admin()) with check (public.is_admin());

alter table public.season_roster_assignments enable row level security;
drop policy if exists "sra_select" on public.season_roster_assignments;
create policy "sra_select" on public.season_roster_assignments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.season_team_assignments a
      where a.season_id = season_roster_assignments.season_id
        and a.team_id   = season_roster_assignments.team_id
        and a.captain_user_id = auth.uid()
    )
  );
drop policy if exists "sra_admin_write" on public.season_roster_assignments;
create policy "sra_admin_write" on public.season_roster_assignments for all
  using (public.is_admin()) with check (public.is_admin());


-- ── 8. Zentrale Apply-RPC (idempotent, atomar, Admin-only) ───

create or replace function public.apply_team_registration(
  p_registration_id uuid,
  p_allow_active    boolean default false
)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  reg              record;
  s                record;
  v_team_id        text;
  v_venue_id       text;
  v_captain_player text;
begin
  -- 1. Berechtigung
  if not public.is_admin() then
    raise exception 'Keine Berechtigung für die Freigabe.';
  end if;

  -- 2. Anmeldung laden
  select * into reg from public.team_registrations where id = p_registration_id;
  if not found then
    raise exception 'Anmeldung nicht gefunden.';
  end if;

  -- 3. Idempotenz: bereits übernommen → vorhandenes Ergebnis zurückgeben
  if reg.applied_at is not null then
    return jsonb_build_object('ok', true, 'already', true,
      'team_id', reg.result_team_id, 'season_id', reg.season_id);
  end if;

  if reg.status = 'rejected' then
    raise exception 'Eine abgelehnte Anmeldung kann nicht freigegeben werden.';
  end if;
  if coalesce(nullif(trim(reg.team_name), ''), '') = '' then
    raise exception 'Teamname fehlt.';
  end if;

  -- 4./5./6. Ziel-Saison validieren (aktive Saison nur mit ausdrücklicher Bestätigung)
  select * into s from public.seasons where id = reg.season_id;
  if not found then
    raise exception 'Ziel-Saison nicht gefunden: %', reg.season_id;
  end if;
  if s.status in ('archived', 'completed') then
    raise exception 'Ziel-Saison ist %s und nicht freigabefähig.', s.status;
  end if;
  if s.status = 'active' and not p_allow_active then
    raise exception 'ACTIVE_SEASON';
  end if;
  if s.status not in ('active', 'upcoming', 'registration_open') then
    raise exception 'Ziel-Saison erlaubt derzeit keine Anmeldungen.';
  end if;

  -- 7.–15. Datenübernahme — atomar: bei Fehler vollständiger Rollback
  begin
    -- Team-ID bestimmen
    if reg.is_new_team or reg.source_team_id is null then
      v_team_id := 'team-' ||
        left(regexp_replace(lower(coalesce(reg.team_name, 'team')), '[^a-z0-9]+', '-', 'g'), 36) ||
        '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    else
      v_team_id := reg.source_team_id;
    end if;

    -- Team-Master anlegen/aktualisieren
    insert into public.teams
      (id, name, short_name, logo_url, team_image_url, description, instagram_url, facebook_url, website_url, status)
    values
      (v_team_id, reg.team_name, reg.short_name, reg.logo_url, reg.team_image_url, reg.description,
       reg.instagram_url, reg.facebook_url, reg.website_url, 'active')
    on conflict (id) do update set
      name = excluded.name, short_name = excluded.short_name, logo_url = excluded.logo_url,
      team_image_url = excluded.team_image_url, description = excluded.description,
      instagram_url = excluded.instagram_url, facebook_url = excluded.facebook_url,
      website_url = excluded.website_url, updated_at = now();

    -- Spielstätte: vorhandene finden oder neu anlegen (keine Dubletten bei gleicher Adresse)
    if reg.venue_name is not null and trim(reg.venue_name) <> '' then
      select id into v_venue_id from public.venues
      where lower(name) = lower(reg.venue_name)
        and coalesce(lower(address), '') = coalesce(lower(reg.venue_address), '')
      limit 1;
      if v_venue_id is null then
        v_venue_id := 'venue-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
        insert into public.venues (id, name, address) values (v_venue_id, reg.venue_name, reg.venue_address);
      end if;
    end if;

    -- Kapitän-Spieler (falls im Kader markiert)
    select player_id into v_captain_player
    from public.team_registration_players
    where registration_id = reg.id and is_captain limit 1;

    -- Saisonzuordnung (idempotent über unique season_id+team_id)
    insert into public.season_team_assignments
      (season_id, team_id, registration_id, status, captain_user_id, captain_player_id, venue_id,
       requested_competition_id, assigned_competition_id)
    values
      (reg.season_id, v_team_id, reg.id, 'approved', reg.submitted_by, v_captain_player, v_venue_id,
       reg.requested_competition_id, reg.assigned_competition_id)
    on conflict (season_id, team_id) do update set
      registration_id = excluded.registration_id, status = 'approved',
      captain_user_id = excluded.captain_user_id, captain_player_id = excluded.captain_player_id,
      venue_id = excluded.venue_id, assigned_competition_id = excluded.assigned_competition_id, updated_at = now();

    -- Kader für die Ziel-Saison: nur die Zeilen DIESER Anmeldung ersetzen
    delete from public.season_roster_assignments
    where season_id = reg.season_id and team_id = v_team_id and registration_id = reg.id;

    insert into public.season_roster_assignments
      (season_id, team_id, player_id, first_name, last_name, license_number, is_captain, status, registration_player_id)
    select reg.season_id, v_team_id, p.player_id, p.first_name, p.last_name, p.license_number, p.is_captain,
      case when p.is_existing_player then 'active' else 'pending_review' end, p.id
    from public.team_registration_players p
    where p.registration_id = reg.id;

    -- Default-Spielstätte im Team-Master setzen, falls noch leer
    if v_venue_id is not null then
      update public.teams set default_venue_id = coalesce(default_venue_id, v_venue_id), updated_at = now()
      where id = v_team_id;
    end if;

    -- Anmeldung als übernommen markieren + fachlich freigeben
    update public.team_registrations set
      result_team_id = v_team_id, applied_at = now(),
      application_status = 'completed', application_error = null,
      status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = reg.id;

  exception when others then
    -- Inneren Block zurückrollen, Fehler nachvollziehbar speichern, KEIN Teilerfolg
    update public.team_registrations set
      application_status = 'failed', application_error = left(SQLERRM, 500)
    where id = reg.id;
    return jsonb_build_object('ok', false, 'error', SQLERRM);
  end;

  return jsonb_build_object('ok', true, 'team_id', v_team_id, 'season_id', reg.season_id);
end;
$$;

revoke all on function public.apply_team_registration(uuid, boolean) from public;
grant execute on function public.apply_team_registration(uuid, boolean) to authenticated;
