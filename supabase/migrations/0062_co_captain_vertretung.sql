-- ============================================================
-- 0062 — Co-Captain und Vertretung für den Spielbericht (Betreiber, 29.10.2026)
-- ============================================================
-- CO-CAPTAIN: Der Kapitän (oder die Ligaleitung) bestimmt höchstens EINEN
-- Co-Captain je Team und wählt, welche Kapitänsrechte er bekommt:
--   'spielberichte' — eintragen, bestätigen, Korrektur, Live-Modus, Foto
--   'team_manager'  — Termine, Aufstellung, Treffzeit, Aufgaben, Erinnerungen
--   'kasse'         — Teamkasse buchen
--   'verlegung'     — Spielverlegung und Heimrechttausch
-- Rechte lassen sich jederzeit ändern oder ganz entziehen (Zeile löschen).
--
-- VERTRETUNG: Kapitän oder Co-Captain (mit 'spielberichte') ernennt für EIN
-- Heimspiel jemanden aus dem Team, der den Spielbericht anlegt, live führt
-- und absendet. Sie endet mit dem Absenden (Trigger unten) oder spätestens
-- mit `gueltig_bis` (Dienstag 24 Uhr nach dem Spiel, rechnet der Server).
-- Bestätigen beim Auswärtsspiel darf der Vertreter nicht.
--
-- Geschrieben wird beides nur vom Server (service_role); lesen darf das Team.
-- ============================================================

create table if not exists public.team_co_captains (
  team_id     text primary key,                       -- höchstens einer je Team
  user_id     uuid not null references auth.users (id) on delete cascade,
  rechte      text[] not null default '{}'
              check (rechte <@ array['spielberichte', 'team_manager', 'kasse', 'verlegung']::text[]),
  ernannt_von uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now()
);
create index if not exists team_co_captains_user_idx on public.team_co_captains (user_id);

create table if not exists public.spielbericht_vertretungen (
  id           uuid primary key default gen_random_uuid(),
  team_id      text not null,
  match_key    text not null,                         -- Heim|Gast wie begegnungKey
  user_id      uuid not null references auth.users (id) on delete cascade,
  ernannt_von  uuid references auth.users (id) on delete set null,
  gueltig_bis  timestamptz not null,
  ended_at     timestamptz,
  ended_reason text,                                  -- abgesendet | entzogen | ersetzt
  created_at   timestamptz not null default now()
);
create unique index if not exists spielbericht_vertretungen_eine_aktive
  on public.spielbericht_vertretungen (team_id, match_key) where ended_at is null;
create index if not exists spielbericht_vertretungen_user_idx on public.spielbericht_vertretungen (user_id) where ended_at is null;

alter table public.team_co_captains enable row level security;
alter table public.spielbericht_vertretungen enable row level security;

drop policy if exists "co_captains_select" on public.team_co_captains;
create policy "co_captains_select" on public.team_co_captains for select
  using (user_id = auth.uid() or public.in_team(team_id) or public.is_admin());

drop policy if exists "vertretungen_select" on public.spielbericht_vertretungen;
create policy "vertretungen_select" on public.spielbericht_vertretungen for select
  using (user_id = auth.uid() or public.in_team(team_id) or public.is_admin());

-- ── Rechte-Helfer ────────────────────────────────────────────

-- Echter Kapitän des Teams (Rolle team_captain) — ohne Co-Captain.
create or replace function public.ist_tc(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.profiles where id = auth.uid() and team_id = p_team and role = 'team_captain') $$;

-- Kapitän ODER Co-Captain mit diesem Recht.
create or replace function public.tc_recht(p_team text, p_recht text)
returns boolean language sql security definer set search_path = public stable
as $$
  select public.ist_tc(p_team) or exists (
    select 1 from public.team_co_captains c
    join public.profiles p on p.id = c.user_id and p.team_id = c.team_id
    where c.team_id = p_team and c.user_id = auth.uid() and p_recht = any (c.rechte))
$$;

-- Aktive Vertretung für genau diese Begegnung.
create or replace function public.ist_vertreter(p_team text, p_key text)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (select 1 from public.spielbericht_vertretungen v
                 where v.team_id = p_team and v.match_key = p_key and v.user_id = auth.uid()
                   and v.ended_at is null and v.gueltig_bis > now())
$$;

-- Darf den Bericht als EINTRAGENDE Seite bearbeiten? (das Team, das nicht bestätigt)
create or replace function public.darf_eintragen(p_home text, p_guest text, p_confirm text)
returns boolean language sql security definer set search_path = public stable
as $$
  select public.is_admin()
      or public.tc_recht(t.team, 'spielberichte')
      or public.ist_vertreter(t.team, p_home || '|' || p_guest)
  from (select case when coalesce(p_confirm, p_guest) = p_guest then p_home else p_guest end as team) t
$$;

-- Team Manager: bisher nur der Kapitän → jetzt auch Co-Captain mit 'team_manager'.
-- (Alle Policies aus 0043–0048 nutzen diese Funktion.)
create or replace function public.is_captain_of(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$ select public.tc_recht(p_team, 'team_manager') $$;

-- Teamkasse: eigenes Recht 'kasse' (nicht über den Team Manager).
create or replace function public.kasse_darf(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$
  select public.zusagen_aktiv(p_team) and (
    public.tc_recht(p_team, 'kasse') or public.is_admin()
    or (public.in_team(p_team) and exists (
      select 1 from public.team_cash_settings s
      where s.team_id = p_team and s.treasurer_player_id is not null
        and s.treasurer_player_id = public.current_player_id()))
  )
$$;
drop policy if exists "cash_settings_insert" on public.team_cash_settings;
create policy "cash_settings_insert" on public.team_cash_settings for insert
  with check (updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.tc_recht(team_id, 'kasse') or public.is_admin()));
drop policy if exists "cash_settings_update" on public.team_cash_settings;
create policy "cash_settings_update" on public.team_cash_settings for update
  using (public.zusagen_aktiv(team_id) and (public.tc_recht(team_id, 'kasse') or public.is_admin()))
  with check (updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.tc_recht(team_id, 'kasse') or public.is_admin()));

-- ── Spielberichte ───────────────────────────────────────────

-- Anlegen: Ligaleitung, Kapitän/Co-Captain eines der beiden Teams, oder Vertreter des Heimteams.
drop policy if exists "mr_insert" on public.match_reports;
create policy "mr_insert" on public.match_reports for insert
  with check (
    home_captain_user_id = auth.uid()
    and (
      public.is_admin()
      or (status = 'draft' and forfeit is null and (
            public.tc_recht(home_team_id, 'spielberichte') or public.tc_recht(guest_team_id, 'spielberichte')
            or public.ist_vertreter(home_team_id, home_team_id || '|' || guest_team_id)))
    )
  );

-- Bearbeiten/Einreichen: wer für die eintragende Seite Rechte hat (nicht mehr nur,
-- wer angelegt hat — Kapitän und Co-Captain arbeiten am selben Bericht).
drop policy if exists "mr_update_own" on public.match_reports;
create policy "mr_update_own" on public.match_reports for update
  using (status in ('draft','submitted','changes_requested') and public.darf_eintragen(home_team_id, guest_team_id, confirm_team_id))
  with check (status in ('draft','submitted','changes_requested') and forfeit is null
              and public.darf_eintragen(home_team_id, guest_team_id, confirm_team_id));

-- Bestätigen / Änderung anfordern: Kapitän oder Co-Captain des BESTÄTIGENDEN Teams (kein Vertreter).
drop policy if exists "mr_update_guest" on public.match_reports;
create policy "mr_update_guest" on public.match_reports for update
  using (status in ('submitted', 'changes_requested')
         and public.tc_recht(coalesce(confirm_team_id, guest_team_id), 'spielberichte'))
  with check (public.tc_recht(coalesce(confirm_team_id, guest_team_id), 'spielberichte'));

create or replace function public.guard_match_report_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null or public.darf_eintragen(old.home_team_id, old.guest_team_id, old.confirm_team_id) then
    return new;
  end if;
  if new.spiele_home is distinct from old.spiele_home or new.spiele_guest is distinct from old.spiele_guest
     or new.legs_home is distinct from old.legs_home or new.legs_guest is distinct from old.legs_guest
     or new.points_home is distinct from old.points_home or new.points_guest is distinct from old.points_guest
     or new.home_team_id is distinct from old.home_team_id or new.guest_team_id is distinct from old.guest_team_id
     or new.season_id is distinct from old.season_id or new.forfeit is distinct from old.forfeit
     or new.home_captain_user_id is distinct from old.home_captain_user_id
     or new.confirm_team_id is distinct from old.confirm_team_id then
    raise exception 'Das Ergebnis ändert nur, wer den Spielbericht eingetragen hat — bitte einen Änderungsvorschlag schicken.';
  end if;
  if new.status not in ('confirmed', 'changes_requested') then
    raise exception 'Unzulässiger Status.';
  end if;
  return new;
end;
$$;

drop policy if exists "mrp_write" on public.match_report_players;
create policy "mrp_write" on public.match_report_players for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (public.is_admin() or (r.status in ('draft','submitted','changes_requested') and r.forfeit is null
                      and public.darf_eintragen(r.home_team_id, r.guest_team_id, r.confirm_team_id)))))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and (public.is_admin() or (r.status in ('draft','submitted','changes_requested') and r.forfeit is null
                      and public.darf_eintragen(r.home_team_id, r.guest_team_id, r.confirm_team_id)))));

drop policy if exists "mrg_write" on public.match_report_games;
create policy "mrg_write" on public.match_report_games for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (public.is_admin() or (r.status in ('draft','submitted','changes_requested') and r.forfeit is null
                      and public.darf_eintragen(r.home_team_id, r.guest_team_id, r.confirm_team_id)))))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and (public.is_admin() or (r.status in ('draft','submitted','changes_requested') and r.forfeit is null
                      and public.darf_eintragen(r.home_team_id, r.guest_team_id, r.confirm_team_id)))));

-- Vertretung endet mit dem Absenden.
create or replace function public.vertretung_beenden()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.status <> 'draft' and (tg_op = 'INSERT' or old.status = 'draft') then
    update public.spielbericht_vertretungen
       set ended_at = now(), ended_reason = 'abgesendet'
     where match_key = new.home_team_id || '|' || new.guest_team_id and ended_at is null;
  end if;
  return new;
end;
$$;
drop trigger if exists vertretung_beenden on public.match_reports;
create trigger vertretung_beenden after insert or update of status on public.match_reports
  for each row execute function public.vertretung_beenden();

-- Wer bekommt die Glocken zu einem Bericht? Kapitän + Co-Captain mit 'spielberichte'.
create or replace function public.bericht_empfaenger(p_team text)
returns setof uuid language sql security definer set search_path = public stable
as $$
  select p.id from public.profiles p where p.team_id = p_team and p.role = 'team_captain'
  union
  select c.user_id from public.team_co_captains c
  join public.profiles p on p.id = c.user_id and p.team_id = c.team_id
  where c.team_id = p_team and 'spielberichte' = any (c.rechte)
$$;

create or replace function public.handle_match_report_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  label text := coalesce(nullif(trim(new.home_team_name), ''), 'Heim')
             || ' – ' || coalesce(nullif(trim(new.guest_team_name), ''), 'Gast');
  confirmer text := coalesce(new.confirm_team_id, new.guest_team_id);
  eintragend text := case when coalesce(new.confirm_team_id, new.guest_team_id) = new.guest_team_id then new.home_team_id else new.guest_team_id end;
begin
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    insert into public.match_report_history (report_id, action, actor_user_id)
      values (new.id, 'submitted', coalesce(auth.uid(), new.home_captain_user_id));
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select e, 'match_report_submitted', 'Neuer Spielbericht',
      'Für ' || label || ' wurde ein Spielbericht eingetragen. Bitte prüfen und bestätigen.',
      'Spielbericht zu prüfen: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht'
    from public.bericht_empfaenger(confirmer) e
    where e is distinct from coalesce(auth.uid(), new.home_captain_user_id);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Spielbericht ' || label || ' wurde eingereicht.', 'Neuer Spielbericht: ' || label,
      'match_report', new.id, '/admin/spielberichte'
    from public.profiles p where p.role in ('league_admin', 'super_admin');
  end if;

  if tg_op = 'UPDATE' and new.status = 'changes_requested'
     and old.status is distinct from 'changes_requested' and new.home_captain_user_id is not null then
    insert into public.match_report_history (report_id, action, actor_user_id, note)
      values (new.id, 'changes_requested', new.guest_response_user_id, new.guest_change_note);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select e, 'match_report_changes_requested', 'Änderung am Spielbericht angefordert',
      'Der Gegner hat zum Spielbericht ' || label || ' eine Änderung angefordert.'
        || coalesce(chr(10) || 'Hinweis: ' || nullif(trim(new.guest_change_note), ''), ''),
      'Änderung angefordert: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht'
    from public.bericht_empfaenger(eintragend) e;

    if new.negotiation_rounds >= 3 then
      insert into public.match_report_history (report_id, action, actor_user_id, note)
        values (new.id, 'escalated', new.guest_response_user_id, 'Nach 3 Verhandlungsrunden zur Entscheidung an die Ligaleitung.');
      insert into public.notifications
        (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
      select p.id, 'match_report_escalated', 'Spielbericht: Entscheidung nötig',
        'Beim Spielbericht ' || label || ' konnten sich die Teams nach 3 Runden nicht einigen. Bitte entscheiden.',
        'Entscheidung nötig: ' || label, 'match_report', new.id, '/admin/spielberichte'
      from public.profiles p where p.role in ('league_admin', 'super_admin');
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'confirmed'
     and old.status is distinct from 'confirmed' and new.home_captain_user_id is not null then
    insert into public.match_report_history (report_id, action, actor_user_id)
      values (new.id, 'confirmed', new.guest_response_user_id);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select distinct e, 'match_report_confirmed', 'Spielbericht bestätigt',
      'Der Gegner hat den Spielbericht ' || label || ' bestätigt.',
      'Spielbericht bestätigt: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht'
    from (select new.home_captain_user_id as e union select public.bericht_empfaenger(eintragend)) x
    where e is distinct from new.guest_response_user_id;
  end if;

  return new;
end;
$$;
