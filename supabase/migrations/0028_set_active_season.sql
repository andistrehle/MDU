-- ============================================================
-- MDU Platform — Migration 0028: aktive Saison umschalten (Go-live)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0027).
--
-- Admin-only RPC, um die aktive Saison umzuschalten: die Ziel-Saison wird
-- `active`, die bisher aktive Saison wird `archived` (mit archived_at). Die
-- archivierte Saison bleibt vollständig erhalten (historisch). Atomar.
-- ============================================================

create or replace function public.set_active_season(p_season_id text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Keine Berechtigung.';
  end if;

  perform 1 from public.seasons where id = p_season_id;
  if not found then
    raise exception 'Saison nicht gefunden: %', p_season_id;
  end if;

  -- bisher aktive Saison(en) archivieren (außer der Ziel-Saison)
  update public.seasons
    set status = 'archived', archived_at = now(), updated_at = now()
  where status = 'active' and id <> p_season_id;

  -- Ziel-Saison aktiv schalten
  update public.seasons
    set status = 'active', archived_at = null, updated_at = now()
  where id = p_season_id;

  return jsonb_build_object('ok', true, 'active', p_season_id);
end;
$$;

revoke all on function public.set_active_season(text) from public;
grant execute on function public.set_active_season(text) to authenticated;
