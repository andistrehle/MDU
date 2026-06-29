-- ============================================================
-- MDU Platform — Migration 0029: Zugewiesene Liga in der Freigabe-Benachrichtigung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0028).
--
-- Kontext:
--   Bei der Mannschaftsmeldung wählt der Kapitän eine Hauptliga (requested_league:
--   la_liga|a_liga|b_liga|c_liga). Die Ligaleitung weist bei der Freigabe die
--   tatsächliche Hauptliga zu — gespeichert in team_registrations.assigned_competition_id
--   (gleiche Vokabel wie requested_league).
--
-- Diese Migration erweitert die In-App-Benachrichtigung „Anmeldung freigegeben"
-- um die zugewiesene Liga und — falls sie vom Ligawunsch abweicht — um einen
-- ausdrücklichen Hinweis. (Die Freigabe-E-Mail erhält denselben Hinweis im
-- Anwendungscode.) Es werden KEINE Tabellen/Spalten geändert, nur die
-- Trigger-Funktion neu definiert.
-- ============================================================


-- ── Helper: Hauptliga-Schlüssel → Anzeigename ────────────────
create or replace function public.main_league_label_de(code text)
returns text
language sql
immutable
as $$
  select case code
    when 'la_liga' then 'La Liga'
    when 'a_liga'  then 'A Liga'
    when 'b_liga'  then 'B Liga'
    when 'c_liga'  then 'C Liga'
    else null
  end;
$$;


-- ── Trigger-Funktion neu: Freigabe nennt die zugewiesene Liga ─
create or replace function public.handle_registration_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  team            text := coalesce(nullif(trim(new.team_name), ''), 'Eine Mannschaft');
  assigned_label  text := public.main_league_label_de(new.assigned_competition_id);
  requested_label text := public.main_league_label_de(new.requested_league);
  liga_note       text := '';
begin
  -- Liga-Zusatz nur bei Freigabe und nur, wenn eine Liga zugewiesen wurde.
  if new.status = 'approved' and assigned_label is not null then
    liga_note := chr(10) || 'Zugewiesene Liga: ' || assigned_label;
    if requested_label is not null
       and new.assigned_competition_id is distinct from new.requested_league then
      liga_note := liga_note || chr(10)
        || 'Hinweis: Diese Liga weicht von eurer Anmeldung (' || requested_label || ') ab.';
    end if;
  end if;

  -- Neu eingereicht → Admins + Einreicher
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then

    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'team_registration_submitted', 'Neue Mannschaftsmeldung',
      team || ' wurde zur Prüfung eingereicht.',
      'Neue Mannschaftsmeldung: ' || team,
      'team_registration', new.id, '/admin/registrations/' || new.id
    from public.profiles p
    where p.role in ('league_admin', 'super_admin');

    if new.submitted_by is not null then
      insert into public.notifications
        (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
      values (new.submitted_by, 'team_registration_submitted', 'Anmeldung eingereicht',
        'Deine Mannschaftsanmeldung ' || team || ' wurde eingereicht.',
        'Deine Mannschaftsanmeldung wurde eingereicht.',
        'team_registration', new.id, '/mein-bereich/anmeldungen');
    end if;
  end if;

  -- Statuswechsel durch Ligaleitung → Einreicher
  if tg_op = 'UPDATE'
     and old.status is distinct from new.status
     and new.status in ('approved', 'rejected', 'changes_requested')
     and new.submitted_by is not null then

    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (
      new.submitted_by,
      'team_registration_' || new.status,
      case new.status
        when 'approved' then 'Anmeldung freigegeben'
        when 'rejected' then 'Anmeldung abgelehnt'
        else 'Nachbesserung erforderlich'
      end,
      case new.status
        when 'approved' then 'Mannschaftsanmeldung ' || team || ' wurde freigegeben.' || liga_note
        when 'rejected' then 'Mannschaftsanmeldung ' || team || ' wurde abgelehnt.' ||
          coalesce(chr(10) || 'Begründung: ' || nullif(trim(new.review_note), ''), '')
        else 'Nachbesserung erforderlich: ' || team || '.' ||
          coalesce(chr(10) || 'Hinweis der Ligaleitung: ' || nullif(trim(new.review_note), ''), '')
      end,
      case new.status
        when 'approved' then 'Mannschaftsanmeldung ' || team || ' wurde freigegeben.'
        when 'rejected' then 'Mannschaftsanmeldung ' || team || ' wurde abgelehnt.'
        else 'Nachbesserung erforderlich: ' || team || '.'
      end,
      'team_registration', new.id, '/mein-bereich/anmeldungen'
    );
  end if;

  return new;
end;
$$;

-- Trigger bleibt bestehen und nutzt automatisch die neue Funktionsdefinition.
drop trigger if exists on_registration_notification on public.team_registrations;
create trigger on_registration_notification
  after insert or update on public.team_registrations
  for each row execute function public.handle_registration_notification();
