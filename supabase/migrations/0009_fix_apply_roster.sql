-- ============================================================
-- MDU Platform — Migration 0009: Fix apply_team_registration (Kader)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0008).
--
-- Bugfix: Die RPC räumte den Saisonkader idempotent über `registration_id`
-- auf, season_roster_assignments hatte diese Spalte aber nicht (nur
-- registration_player_id). Folge: "column registration_id does not exist",
-- Übernahme schlug fehl (sauber zurückgerollt, kein Teilerfolg).
--
-- Fix: Spalte registration_id ergänzen + RPC mit korrektem Insert/Delete.
-- ============================================================

alter table public.season_roster_assignments
  add column if not exists registration_id uuid;

create index if not exists season_roster_registration_idx
  on public.season_roster_assignments (registration_id);


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
  if not public.is_admin() then
    raise exception 'Keine Berechtigung für die Freigabe.';
  end if;

  select * into reg from public.team_registrations where id = p_registration_id;
  if not found then
    raise exception 'Anmeldung nicht gefunden.';
  end if;

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

  begin
    if reg.is_new_team or reg.source_team_id is null then
      v_team_id := 'team-' ||
        left(regexp_replace(lower(coalesce(reg.team_name, 'team')), '[^a-z0-9]+', '-', 'g'), 36) ||
        '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    else
      v_team_id := reg.source_team_id;
    end if;

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

    select player_id into v_captain_player
    from public.team_registration_players
    where registration_id = reg.id and is_captain limit 1;

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
      (season_id, team_id, player_id, first_name, last_name, license_number, is_captain, status,
       registration_id, registration_player_id)
    select reg.season_id, v_team_id, p.player_id, p.first_name, p.last_name, p.license_number, p.is_captain,
      case when p.is_existing_player then 'active' else 'pending_review' end, reg.id, p.id
    from public.team_registration_players p
    where p.registration_id = reg.id;

    if v_venue_id is not null then
      update public.teams set default_venue_id = coalesce(default_venue_id, v_venue_id), updated_at = now()
      where id = v_team_id;
    end if;

    update public.team_registrations set
      result_team_id = v_team_id, applied_at = now(),
      application_status = 'completed', application_error = null,
      status = 'approved', reviewed_by = auth.uid(), reviewed_at = now()
    where id = reg.id;

  exception when others then
    update public.team_registrations set
      application_status = 'failed', application_error = left(SQLERRM, 500)
    where id = reg.id;
    return jsonb_build_object('ok', false, 'error', SQLERRM);
  end;

  return jsonb_build_object('ok', true, 'team_id', v_team_id, 'season_id', reg.season_id);
end;
$$;
