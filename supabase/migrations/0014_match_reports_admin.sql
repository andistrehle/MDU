-- ============================================================
-- MDU Platform — Migration 0014: Spielberichte-Hoheit für Admins
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0013).
--
--   • Ligaleitung/Super Admin dürfen Spielberichte ändern (bereits via
--     mr_update_admin) UND löschen (neue Policy).
--   • Bei neuem Spielbericht zusätzlich Hinweis an Ligaleitung/Super Admin.
--   • RPC notify_report_change(): benachrichtigt die Kapitäne, wenn ein Admin
--     einen Bericht ändert oder löscht.
-- ============================================================

-- ── 1. Admin-Löschrecht ──────────────────────────────────────
drop policy if exists "mr_delete_admin" on public.match_reports;
create policy "mr_delete_admin" on public.match_reports for delete
  using (public.is_admin());

-- ── 2. Benachrichtigungen: bei Einreichung auch Admins ───────
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
    -- Gast-Kapitän(e)
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Für ' || label || ' wurde ein Spielbericht eingetragen. Bitte prüfen und bestätigen.',
      'Spielbericht zu prüfen: ' || label,
      'match_report', new.id, '/mein-bereich/spielberichte/uebersicht'
    from public.profiles p
    where p.team_id = new.guest_team_id and p.role = 'team_captain';
    -- Ligaleitung / Super Admin
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Spielbericht ' || label || ' wurde eingereicht.',
      'Neuer Spielbericht: ' || label,
      'match_report', new.id, '/admin/spielberichte'
    from public.profiles p
    where p.role in ('league_admin', 'super_admin');
  end if;

  if tg_op = 'UPDATE' and new.status = 'changes_requested'
     and old.status is distinct from 'changes_requested' and new.home_captain_user_id is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_changes_requested', 'Änderung am Spielbericht angefordert',
      'Der Gegner hat zum Spielbericht ' || label || ' eine Änderung angefordert.'
        || coalesce(chr(10) || 'Hinweis: ' || nullif(trim(new.guest_change_note), ''), ''),
      'Änderung angefordert: ' || label,
      'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');
  end if;

  if tg_op = 'UPDATE' and new.status = 'confirmed'
     and old.status is distinct from 'confirmed' and new.home_captain_user_id is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_confirmed', 'Spielbericht bestätigt',
      'Der Gegner hat den Spielbericht ' || label || ' bestätigt.',
      'Spielbericht bestätigt: ' || label,
      'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');
  end if;

  return new;
end;
$$;

-- ── 3. RPC: Kapitäne bei Admin-Änderung/-Löschung informieren ─
create or replace function public.notify_report_change(p_report_id uuid, p_action text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r     record;
  label text;
  msg   text;
begin
  if not public.is_admin() then
    raise exception 'Keine Berechtigung.';
  end if;
  select * into r from public.match_reports where id = p_report_id;
  if not found then return; end if;

  label := coalesce(nullif(trim(r.home_team_name), ''), 'Heim')
        || ' – ' || coalesce(nullif(trim(r.guest_team_name), ''), 'Gast');
  msg := case p_action
           when 'deleted' then 'Der Spielbericht ' || label || ' wurde von der Ligaleitung gelöscht.'
           else 'Der Spielbericht ' || label || ' wurde von der Ligaleitung geändert.'
         end;

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
  from public.profiles p
  where p.team_id = r.guest_team_id and p.role = 'team_captain';
end;
$$;

revoke all on function public.notify_report_change(uuid, text) from public;
grant execute on function public.notify_report_change(uuid, text) to authenticated;
