-- ============================================================
-- 0047 — Spieltag: Notiz + Aufgaben je Team und Spiel
-- ============================================================
--
-- Vom Betreiber festgelegt (13.10.2026):
--   • Notizen und Aufgaben legt NUR der TC (bzw. die Ligaleitung) an; das
--     Team liest mit.
--   • Aufgaben haben eine Person und lassen sich abhaken — vom TC oder von
--     der zugewiesenen Person selbst (die darf nur den Haken ändern).
--   • Wer eine Aufgabe zugewiesen bekommt, erhält einen Hinweis in der Glocke.
-- Freischaltung wie 0043 (zusagen_aktiv). Bestehendes bleibt unverändert,
-- es kommt nur eine Spalte (Notiz) und eine Tabelle (Aufgaben) dazu.
-- ============================================================

alter table public.match_team_details
  add column if not exists note text check (note is null or char_length(note) <= 500);

create table if not exists public.match_tasks (
  id            uuid primary key default gen_random_uuid(),
  season_id     text not null,
  match_key     text not null,                 -- Heim|Gast
  team_id       text not null,
  title         text not null check (char_length(btrim(title)) between 1 and 120),
  assignee_id   text,                          -- Spieler-ID (wie match_availability.player_id)
  assignee_name text,
  label         text,                          -- Spiel in Worten, für die Glocke
  done          boolean not null default false,
  done_by       uuid references auth.users (id) on delete set null,
  done_at       timestamptz,
  created_by    uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists match_tasks_team_idx on public.match_tasks (season_id, team_id, match_key);

alter table public.match_tasks enable row level security;

drop policy if exists "match_tasks_select" on public.match_tasks;
create policy "match_tasks_select" on public.match_tasks for select
  using (public.in_team(team_id) or public.is_admin());

drop policy if exists "match_tasks_insert" on public.match_tasks;
create policy "match_tasks_insert" on public.match_tasks for insert
  with check (created_by = auth.uid() and public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

drop policy if exists "match_tasks_delete" on public.match_tasks;
create policy "match_tasks_delete" on public.match_tasks for delete
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

-- Ändern: TC/Ligaleitung alles, die zugewiesene Person nur den Haken (Trigger unten).
drop policy if exists "match_tasks_update" on public.match_tasks;
create policy "match_tasks_update" on public.match_tasks for update
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()
         or (assignee_id is not null and assignee_id = public.current_player_id() and public.in_team(team_id))))
  with check (public.zusagen_aktiv(team_id));

create or replace function public.match_tasks_guard()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.is_captain_of(new.team_id) or public.is_admin() or auth.uid() is null then
    return new;
  end if;
  if new.title is distinct from old.title or new.assignee_id is distinct from old.assignee_id
     or new.assignee_name is distinct from old.assignee_name or new.match_key is distinct from old.match_key
     or new.team_id is distinct from old.team_id or new.season_id is distinct from old.season_id then
    raise exception 'Nur der Teamcaptain kann Aufgaben ändern.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists match_tasks_guard on public.match_tasks;
create trigger match_tasks_guard before update on public.match_tasks
  for each row execute function public.match_tasks_guard();

-- Glocke: die zugewiesene Person bekommt einen Hinweis (nicht, wenn sie sich selbst zuweist).
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
  select p.id, 'match_task', 'Aufgabe für dich', msg, msg, 'match_tasks',
         '/spieltag/' || new.team_id || '/' || replace(new.match_key, '|', '--')
  from public.profiles p
  where p.player_id = new.assignee_id and p.team_id = new.team_id and p.id is distinct from auth.uid();
  return new;
end;
$$;

drop trigger if exists match_tasks_notify on public.match_tasks;
create trigger match_tasks_notify after insert or update on public.match_tasks
  for each row execute function public.notify_match_task();

-- Glocke bei Zu-/Absagen: bisher nur an Profile mit Rolle team_captain. Der TC
-- von Freibad Bazis läuft als super_admin und bekam deshalb nichts (13.10.2026
-- aufgefallen). Jetzt an alle TC UND Ligaleitungs-Konten DIESES Teams.
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
         msg, msg, 'match_availability', '/spieltag/' || new.team_id || '/' || replace(new.match_key, '|', '--')
  from public.profiles p
  where p.team_id = new.team_id and p.role in ('team_captain', 'league_admin', 'super_admin')
    and p.id is distinct from new.updated_by;
  return new;
end;
$$;
