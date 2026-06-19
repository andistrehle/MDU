-- ============================================================
-- MDU Platform — Migration 0010: Ligawunsch bei der Anmeldung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0009).
--
-- Der Teamkapitän wählt bei der Anmeldung die HAUPTLIGA (La/A/B/C).
-- Die endgültige Staffel (B1/B2 …) setzt später die Ligaleitung in
-- assigned_competition_id (bereits aus 0008 vorhanden). Beide Felder bleiben
-- getrennt nachvollziehbar.
-- ============================================================

-- Nullable (Bestandszeilen haben keinen Wunsch); Pflicht wird im Formular
-- erzwungen. Check erlaubt die vier Hauptligen.
alter table public.team_registrations
  add column if not exists requested_league text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'team_registrations_requested_league_chk'
  ) then
    alter table public.team_registrations
      add constraint team_registrations_requested_league_chk
      check (requested_league is null or requested_league in ('la_liga','a_liga','b_liga','c_liga'));
  end if;
end $$;


-- ── Admin-Hinweis um Ligawunsch ergänzen ─────────────────────
-- (handle_registration_notification aus 0007 neu definieren)

create or replace function public.handle_registration_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  team   text := coalesce(nullif(trim(new.team_name), ''), 'Eine Mannschaft');
  liga   text := case new.requested_league
                   when 'la_liga' then 'La Liga'
                   when 'a_liga'  then 'A Liga'
                   when 'b_liga'  then 'B Liga'
                   when 'c_liga'  then 'C Liga'
                   else null
                 end;
begin
  -- Neu eingereicht → Admins + Einreicher
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then

    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'team_registration_submitted', 'Neue Mannschaftsmeldung',
      team || ' wurde zur Prüfung eingereicht.'
        || coalesce(' Gewünschte Liga: ' || liga || '.', ''),
      'Neue Mannschaftsmeldung: ' || team || coalesce(' – ' || liga, ''),
      'team_registration', new.id, '/admin/registrations/' || new.id
    from public.profiles p
    where p.role in ('league_admin', 'super_admin');

    if new.submitted_by is not null then
      insert into public.notifications
        (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
      values (new.submitted_by, 'team_registration_submitted', 'Anmeldung eingereicht',
        'Deine Mannschaftsanmeldung ' || team || ' wurde eingereicht.'
          || coalesce(' Gewünschte Liga: ' || liga || '.', ''),
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
        when 'approved' then 'Mannschaftsanmeldung ' || team || ' wurde freigegeben.'
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
