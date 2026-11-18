-- ============================================================
-- 0071 — Spieler umbenennen: Name UND Profil-Adresse (Betreiber, 18.11.2026)
-- ============================================================
-- Die Adresse /spieler/<kennung> IST die Kennung des Spielers und steht in vielen
-- Tabellen. public.spieler_umbenennen() stellt ALLE Stellen in einem Schritt um
-- (eine Transaktion: alles oder nichts) und merkt sich die alte Kennung in
-- player_id_aliases, damit alte Links dauerhaft weiterleiten.
--
-- Umgestellt werden:
--   players (Kennung, Name) · player_assignments · season_roster_assignments ·
--   profiles (player_id, matched_player_id) · player_profiles · player_contacts ·
--   player_nominations · team_registration_players · match_report_players ·
--   match_availability · match_team_details.lineup · match_tasks ·
--   season_team_assignments.captain_player_id · team_cash_entries ·
--   team_strafen_striche · team_cash_settings.treasurer_player_id ·
--   team_strafen_abende.ersatz_player_id · JSON in match_report_corrections
--   (changes, base) und match_reports (proposed_changes, proposal_base).
-- NEUE Tabellen mit Spieler-Kennung müssen hier nachgetragen werden.
--
-- Aufruf nur durch den Server (service_role) über /api/admin/spieler.
-- p_pruefen = true ändert nichts und liefert nur die Zahl der betroffenen Zeilen.
-- ============================================================

create table if not exists public.player_id_aliases (
  alt        text primary key,
  neu        text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);
alter table public.player_id_aliases enable row level security;

create or replace function public.spieler_umbenennen(
  p_alt text, p_neu text, p_vorname text, p_nachname text, p_von uuid default null, p_pruefen boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alt_name text;
  v_neu_name text := btrim(coalesce(p_vorname, '') || ' ' || coalesce(p_nachname, ''));
  v_wechsel  boolean := p_neu is distinct from p_alt;
  v_lizenz   text;
  v_q        text := '"' || p_alt || '"';
  z          jsonb;
begin
  if coalesce(btrim(p_alt), '') = '' or coalesce(btrim(p_neu), '') = '' then raise exception 'Kennung fehlt.'; end if;
  if v_neu_name = '' then raise exception 'Name fehlt.'; end if;
  if p_neu !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then raise exception 'Neue Adresse darf nur Kleinbuchstaben, Ziffern und Bindestriche enthalten.'; end if;

  select btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), license_number into v_alt_name, v_lizenz
    from players where id = p_alt for update;
  if not found then raise exception 'Spieler % nicht gefunden.', p_alt; end if;
  if v_wechsel and exists (select 1 from players where id = p_neu) then
    raise exception 'Die Adresse % ist schon an einen anderen Spieler vergeben.', p_neu;
  end if;
  if v_wechsel and exists (select 1 from player_id_aliases a where a.alt = p_neu and a.neu <> p_alt) then
    raise exception 'Die Adresse % war früher die eines anderen Spielers und leitet weiter.', p_neu;
  end if;

  z := jsonb_build_object(
    'player_assignments',        (select count(*) from player_assignments where player_id = p_alt),
    'season_roster_assignments', (select count(*) from season_roster_assignments where player_id = p_alt),
    'profiles',                  (select count(*) from profiles where player_id = p_alt or matched_player_id = p_alt),
    'player_profiles',           (select count(*) from player_profiles where player_id = p_alt),
    'player_contacts',           (select count(*) from player_contacts where player_id = p_alt),
    'player_nominations',        (select count(*) from player_nominations where player_id = p_alt),
    'team_registration_players', (select count(*) from team_registration_players where player_id = p_alt),
    'match_report_players',      (select count(*) from match_report_players where player_id = p_alt),
    'match_availability',        (select count(*) from match_availability where player_id = p_alt),
    'match_team_details',        (select count(*) from match_team_details where p_alt = any (lineup)),
    'match_tasks',               (select count(*) from match_tasks where assignee_id = p_alt),
    'season_team_assignments',   (select count(*) from season_team_assignments where captain_player_id = p_alt),
    'team_cash_entries',         (select count(*) from team_cash_entries where player_key = p_alt),
    'team_strafen_striche',      (select count(*) from team_strafen_striche where player_key = p_alt),
    'team_cash_settings',        (select count(*) from team_cash_settings where treasurer_player_id = p_alt),
    'team_strafen_abende',       (select count(*) from team_strafen_abende where ersatz_player_id = p_alt),
    'match_report_corrections',  (select count(*) from match_report_corrections where changes::text like '%' || v_q || '%' or base::text like '%' || v_q || '%'),
    'match_reports',             (select count(*) from match_reports where proposed_changes::text like '%' || v_q || '%' or proposal_base::text like '%' || v_q || '%')
  );
  if p_pruefen then
    return jsonb_build_object('neu', p_neu, 'wechsel', v_wechsel, 'alter_name', v_alt_name, 'zahlen', z);
  end if;

  -- 1) Spielerstamm. Bei neuer Kennung: Zeile kopieren (alle Spalten), Kinder umhängen, alte löschen —
  --    so braucht es keinen ON UPDATE CASCADE am Fremdschlüssel von player_assignments.
  if v_wechsel then
    update players set license_number = null where id = p_alt;
    insert into players
      select (jsonb_populate_record(null::players, to_jsonb(p) || jsonb_build_object('id', p_neu, 'license_number', v_lizenz))).*
      from players p where p.id = p_alt;
  end if;
  update players set
      first_name = btrim(p_vorname), last_name = btrim(p_nachname),
      display_name = case when display_name is null or btrim(display_name) = '' or btrim(display_name) = v_alt_name then v_neu_name else display_name end,
      updated_at = now()
    where id = p_neu;

  -- 2) Alle Verweise (Kennung) und Namenskopien.
  -- match_tasks ZUERST: der Glocken-Auslöser „Aufgabe für dich“ feuert, wenn sich assignee_id ändert, und sucht das
  -- Konto über profiles.player_id — solange das noch die alte Kennung trägt, geht keine falsche Glocke raus.
  update match_tasks               set assignee_id = p_neu, assignee_name = v_neu_name where assignee_id = p_alt;
  update player_assignments        set player_id = p_neu where player_id = p_alt;
  update season_roster_assignments set player_id = p_neu, first_name = btrim(p_vorname), last_name = btrim(p_nachname) where player_id = p_alt;
  update profiles                  set player_id = p_neu where player_id = p_alt;
  update profiles                  set matched_player_id = p_neu where matched_player_id = p_alt;
  update player_profiles           set player_id = p_neu where player_id = p_alt;
  update player_contacts           set player_id = p_neu where player_id = p_alt;
  update player_nominations        set player_id = p_neu, first_name = btrim(p_vorname), last_name = btrim(p_nachname) where player_id = p_alt;
  update team_registration_players set player_id = p_neu, first_name = btrim(p_vorname), last_name = btrim(p_nachname) where player_id = p_alt;
  update match_report_players      set player_id = p_neu, name = v_neu_name where player_id = p_alt;
  update match_availability        set player_id = p_neu, player_name = v_neu_name where player_id = p_alt;
  update match_team_details        set lineup = array_replace(lineup, p_alt, p_neu) where p_alt = any (lineup);
  update season_team_assignments   set captain_player_id = p_neu where captain_player_id = p_alt;
  update team_cash_entries         set player_key = p_neu, player_name = v_neu_name where player_key = p_alt;
  update team_strafen_striche      set player_key = p_neu, player_name = v_neu_name where player_key = p_alt;
  update team_cash_settings        set treasurer_player_id = p_neu where treasurer_player_id = p_alt;
  update team_strafen_abende       set ersatz_player_id = p_neu where ersatz_player_id = p_alt;

  if v_wechsel then
    update match_report_corrections set changes = replace(changes::text, v_q, '"' || p_neu || '"')::jsonb where changes::text like '%' || v_q || '%';
    update match_report_corrections set base    = replace(base::text,    v_q, '"' || p_neu || '"')::jsonb where base::text    like '%' || v_q || '%';
    update match_reports set proposed_changes = replace(proposed_changes::text, v_q, '"' || p_neu || '"')::jsonb where proposed_changes::text like '%' || v_q || '%';
    update match_reports set proposal_base    = replace(proposal_base::text,    v_q, '"' || p_neu || '"')::jsonb where proposal_base::text    like '%' || v_q || '%';

    -- 3) Alte Zeile weg (nichts hängt mehr daran), alte Adresse merken; frühere Weiterleitungen nachziehen.
    delete from players where id = p_alt;
    delete from player_id_aliases where alt = p_neu;
    update player_id_aliases set neu = p_neu where neu = p_alt;
    insert into player_id_aliases (alt, neu, created_by) values (p_alt, p_neu, p_von)
      on conflict (alt) do update set neu = excluded.neu, created_by = excluded.created_by, created_at = now();
  end if;

  return jsonb_build_object('neu', p_neu, 'wechsel', v_wechsel, 'alter_name', v_alt_name, 'zahlen', z);
end;
$$;

revoke all on function public.spieler_umbenennen(text, text, text, text, uuid, boolean) from public, anon, authenticated;
grant execute on function public.spieler_umbenennen(text, text, text, text, uuid, boolean) to service_role;
