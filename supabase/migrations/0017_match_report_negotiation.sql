-- ============================================================
-- MDU Platform — Migration 0017: Spielbericht-Verhandlungsrunden
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0016).
--
--   • negotiation_rounds: zählt die Änderungsanforderungen des Gegners.
--   • Ab der 3. Runde wird zusätzlich die Ligaleitung/Super Admin informiert,
--     die dann entscheidet.
-- ============================================================

alter table public.match_reports
  add column if not exists negotiation_rounds integer not null default 0;

-- Trigger neu: bei changes_requested zusätzlich Admins informieren, wenn
-- bereits 3 (oder mehr) Verhandlungsrunden erreicht sind.
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

    -- Ab 3 Runden: Ligaleitung/Super Admin entscheidet
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
    values (new.home_captain_user_id, 'match_report_confirmed', 'Spielbericht bestätigt',
      'Der Gegner hat den Spielbericht ' || label || ' bestätigt.',
      'Spielbericht bestätigt: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');
  end if;

  return new;
end;
$$;
