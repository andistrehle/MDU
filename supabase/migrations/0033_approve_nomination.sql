-- ============================================================
-- MDU Platform — Migration 0033: Atomare Nachmeldungs-Freigabe (RPC)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0032).
--
-- Die Freigabe einer Nachmeldung schreibt an drei Stellen: Spieler anlegen,
-- Kaderzuordnung, Nominierungsstatus. Bisher liefen diese als drei getrennte
-- Client-Aufrufe — schlug einer fehl (best-effort, nur console.warn), konnte
-- die Nominierung trotzdem als „approved" enden, ohne dass Spieler/Kader
-- existieren. Diese Funktion fasst die drei Schritte in EINER Transaktion
-- zusammen: entweder alles oder nichts (REV-047).
--
-- Die Passnummer-Generierung bleibt bewusst im Client (sie braucht den
-- Team-Kader inkl. statischer Basis) — hier wird nur atomar persistiert.
-- SECURITY DEFINER + is_admin()-Check: nur Ligaleitung/Super-Admin.
-- ============================================================

create or replace function public.approve_nomination(
  p_id          uuid,
  p_license     text,
  p_player_id   text,
  p_season_id   text,
  p_team_id     text,
  p_first_name  text,
  p_last_name   text,
  p_provisional boolean default true
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Nur Ligaleitung/Super-Admin darf Nachmeldungen freigeben.'
      using errcode = '42501';
  end if;

  -- 1) Spielerstamm anlegen/aktualisieren
  insert into public.players (id, first_name, last_name, license_number, status, source)
  values (p_player_id, p_first_name, p_last_name, p_license, 'active', 'nomination')
  on conflict (id) do update
    set first_name     = excluded.first_name,
        last_name      = excluded.last_name,
        license_number = excluded.license_number;

  -- 2) Kaderzuordnung (stabile ID pro Nominierung → idempotent)
  insert into public.player_assignments (id, season_id, team_id, player_id, status, is_captain, source)
  values ('pa-nom-' || p_id::text, p_season_id, p_team_id, p_player_id, 'active', false, 'nomination')
  on conflict (id) do update
    set season_id = excluded.season_id,
        team_id   = excluded.team_id,
        player_id = excluded.player_id,
        status    = 'active';

  -- 3) Nominierung zuletzt als freigegeben markieren
  update public.player_nominations
     set status              = 'approved',
         license_number      = p_license,
         license_provisional = p_provisional,
         player_id           = p_player_id,
         review_note         = null,
         reviewed_by         = auth.uid(),
         reviewed_at         = now()
   where id = p_id;
end;
$$;

grant execute on function public.approve_nomination(uuid, text, text, text, text, text, text, boolean) to authenticated;
