-- ============================================================
-- 0048 — Team Manager: eigene Termine außerhalb der MDU
-- ============================================================
--
-- Vom Betreiber festgelegt (14.10.2026):
--   • Neben den MDU-Spielen (stehen im Code) trägt der TC eigene Termine
--     fürs ganze Team ein: Spiele anderer Ligen/Pokale und Sonstiges
--     (Training, Teamabend …). Klar als „Extern“ gekennzeichnet.
--   • Alle im Team sehen sie und sagen zu/ab wie bei MDU-Spielen.
--   • Anlegen, ändern, löschen: NUR der TC (bzw. die Ligaleitung).
--   • Premium wie der ganze Team Manager: Schreiben nur für freigeschaltete
--     Teams (zusagen_aktiv, Migration 0043).
--   • Import per Excel/CSV kommt später (Spalte source).
--
-- Zu-/Absagen, Notiz, Treffzeit und Aufgaben laufen über die vorhandenen
-- Tabellen mit der Kennung match_key = 'ext:<id>'. Löscht der TC einen
-- Termin, verschwinden diese Zeilen mit (Trigger unten).
-- Bestehendes bleibt unverändert; nur die beiden Glocken-Funktionen bekommen
-- für 'ext:'-Termine den richtigen Link (/termin/<id>).
-- ============================================================

create table if not exists public.team_events (
  id          uuid primary key default gen_random_uuid(),
  season_id   text not null,
  team_id     text not null,
  kind        text not null default 'spiel' check (kind in ('spiel', 'sonstiges')),
  title       text check (title is null or char_length(btrim(title)) between 1 and 80),
  league      text check (league is null or char_length(league) <= 60),     -- Liga/Wettbewerb, z. B. „DSAB Bezirksliga“
  opponent    text check (opponent is null or char_length(opponent) <= 80),
  is_home     boolean,                                                       -- nur bei Spielen
  event_date  date not null,
  start_time  text check (start_time is null or start_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  end_time    text check (end_time is null or end_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  venue       text check (venue is null or char_length(venue) <= 80),
  address     text check (address is null or char_length(address) <= 120),
  source      text not null default 'manual' check (source in ('manual', 'import')),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Spiel braucht einen Gegner, Sonstiges einen Titel
  check ((kind = 'spiel' and opponent is not null) or (kind = 'sonstiges' and title is not null))
);
create index if not exists team_events_team_idx on public.team_events (season_id, team_id, event_date);

alter table public.team_events enable row level security;

drop policy if exists "team_events_select" on public.team_events;
create policy "team_events_select" on public.team_events for select
  using (public.in_team(team_id) or public.is_admin());

drop policy if exists "team_events_insert" on public.team_events;
create policy "team_events_insert" on public.team_events for insert
  with check (created_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

drop policy if exists "team_events_update" on public.team_events;
create policy "team_events_update" on public.team_events for update
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()))
  with check (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

drop policy if exists "team_events_delete" on public.team_events;
create policy "team_events_delete" on public.team_events for delete
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

-- Termin weg → Zu-/Absagen, Notiz/Treffzeit und Aufgaben dazu auch weg.
create or replace function public.team_events_aufraeumen()
returns trigger language plpgsql security definer set search_path = public
as $$
declare k text := 'ext:' || old.id::text;
begin
  delete from public.match_availability where team_id = old.team_id and match_key = k;
  delete from public.match_team_details where team_id = old.team_id and match_key = k;
  delete from public.match_tasks        where team_id = old.team_id and match_key = k;
  return old;
end;
$$;
drop trigger if exists team_events_aufraeumen on public.team_events;
create trigger team_events_aufraeumen after delete on public.team_events
  for each row execute function public.team_events_aufraeumen();

-- Link für die Glocke: MDU-Spiel → Spieltag-Seite, eigener Termin → /termin/<id>.
create or replace function public.termin_link(p_team text, p_key text)
returns text language sql immutable
as $$ select case when p_key like 'ext:%' then '/termin/' || substr(p_key, 5)
                  else '/spieltag/' || p_team || '/' || replace(p_key, '|', '--') end $$;

-- Wie 0047, nur der Link geht jetzt über termin_link().
create or replace function public.notify_availability_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  actor_role text;
  msg text;
begin
  if tg_op = 'UPDATE' and new.status = old.status and coalesce(new.note, '') = coalesce(old.note, '') then
    return new;
  end if;
  select role into actor_role from public.profiles where id = new.updated_by;
  if actor_role in ('team_captain', 'league_admin', 'super_admin') then
    return new;
  end if;
  msg := new.player_name
         || (case new.status when 'yes' then ' hat zugesagt' when 'no' then ' hat abgesagt' else ' ist unsicher' end)
         || coalesce(' · ' || new.label, '')
         || coalesce(' – „' || nullif(trim(new.note), '') || '“', '');
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, action_url)
  select p.id, 'availability_change',
         case new.status when 'yes' then 'Zusage' when 'no' then 'Absage' else 'Unsicher' end,
         msg, msg, 'match_availability', public.termin_link(new.team_id, new.match_key)
  from public.profiles p
  where p.team_id = new.team_id and p.role in ('team_captain', 'league_admin', 'super_admin')
    and p.id is distinct from new.updated_by;
  return new;
end;
$$;

create or replace function public.notify_match_task()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  msg text;
begin
  if new.assignee_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.assignee_id is not distinct from old.assignee_id then return new; end if;
  msg := 'Neue Aufgabe: ' || new.title || coalesce(' · ' || new.label, '');
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, action_url)
  select p.id, 'match_task', 'Aufgabe für dich', msg, msg, 'match_tasks', public.termin_link(new.team_id, new.match_key)
  from public.profiles p
  where p.player_id = new.assignee_id and p.team_id = new.team_id and p.id is distinct from auth.uid();
  return new;
end;
$$;
