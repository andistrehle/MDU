-- ============================================================
-- MDU Platform — Migration 0015: Spielbericht-Historie
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0014).
--
--   • match_report_history: Protokoll aller Schritte (eingereicht, bestätigt,
--     Änderung angefordert inkl. Hinweis, von Ligaleitung geändert).
--   • Einträge werden automatisch in den Trigger-/RPC-Funktionen erzeugt.
-- ============================================================

create table if not exists public.match_report_history (
  id            uuid primary key default gen_random_uuid(),
  report_id     uuid not null references public.match_reports (id) on delete cascade,
  action        text not null,   -- submitted | confirmed | changes_requested | admin_changed
  actor_user_id uuid references auth.users (id),
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists match_report_history_report_idx
  on public.match_report_history (report_id, created_at);

alter table public.match_report_history enable row level security;

-- Sichtbar für alle, die den Bericht sehen dürfen (Heim, Gast-Team, Admin).
drop policy if exists "mrh_select" on public.match_report_history;
create policy "mrh_select" on public.match_report_history for select
  using (exists (
    select 1 from public.match_reports r
    where r.id = report_id
      and (r.home_captain_user_id = auth.uid() or public.is_admin()
           or exists (select 1 from public.profiles me where me.id = auth.uid() and me.team_id = r.guest_team_id))
  ));
-- Inserts nur über SECURITY-DEFINER-Funktionen (keine User-Insert-Policy).


-- ── Trigger neu: + Historie ──────────────────────────────────
create or replace function public.handle_match_report_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  label text := coalesce(nullif(trim(new.home_team_name), ''), 'Heim')
             || ' – ' || coalesce(nullif(trim(new.guest_team_name), ''), 'Gast');
begin
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    insert into public.match_report_history (report_id, action, actor_user_id)
      values (new.id, 'submitted', new.home_captain_user_id);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Für ' || label || ' wurde ein Spielbericht eingetragen. Bitte prüfen und bestätigen.',
      'Spielbericht zu prüfen: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht'
    from public.profiles p where p.team_id = new.guest_team_id and p.role = 'team_captain';
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
    values (new.home_captain_user_id, 'match_report_changes_requested', 'Änderung am Spielbericht angefordert',
      'Der Gegner hat zum Spielbericht ' || label || ' eine Änderung angefordert.'
        || coalesce(chr(10) || 'Hinweis: ' || nullif(trim(new.guest_change_note), ''), ''),
      'Änderung angefordert: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');
  end if;

  if tg_op = 'UPDATE' and new.status = 'confirmed'
     and old.status is distinct from 'confirmed' and new.home_captain_user_id is not null then
    insert into public.match_report_history (report_id, action, actor_user_id)
      values (new.id, 'confirmed', new.guest_response_user_id);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_confirmed', 'Spielbericht bestätigt',
      'Der Gegner hat den Spielbericht ' || label || ' bestätigt.',
      'Spielbericht bestätigt: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');
  end if;

  return new;
end;
$$;

-- ── RPC notify_report_change: + Historie ─────────────────────
create or replace function public.notify_report_change(p_report_id uuid, p_action text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r record; label text; msg text;
begin
  if not public.is_admin() then raise exception 'Keine Berechtigung.'; end if;
  select * into r from public.match_reports where id = p_report_id;
  if not found then return; end if;

  label := coalesce(nullif(trim(r.home_team_name), ''), 'Heim')
        || ' – ' || coalesce(nullif(trim(r.guest_team_name), ''), 'Gast');
  msg := case p_action
           when 'deleted' then 'Der Spielbericht ' || label || ' wurde von der Ligaleitung gelöscht.'
           else 'Der Spielbericht ' || label || ' wurde von der Ligaleitung geändert.'
         end;

  -- Historie (bei 'deleted' entfällt sie via Cascade mit dem Bericht)
  insert into public.match_report_history (report_id, action, actor_user_id)
    values (r.id, 'admin_' || p_action, auth.uid());

  if r.home_captain_user_id is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (r.home_captain_user_id, 'match_report_admin_change', 'Spielbericht aktualisiert',
      msg, msg, 'match_report', r.id, '/mein-bereich/spielberichte/uebersicht');
  end if;
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
  select p.id, 'match_report_admin_change', 'Spielbericht aktualisiert',
    msg, msg, 'match_report', r.id, '/mein-bereich/spielberichte/uebersicht'
  from public.profiles p where p.team_id = r.guest_team_id and p.role = 'team_captain';
end;
$$;
