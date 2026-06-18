-- ============================================================
-- MDU Platform — Migration 0007: Einheitliches Notification-Center
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0006).
--
-- Ein EINHEITLICHES Notification-System für ALLE eingeloggten Nutzer
-- (Spieler, Teamkapitän, Ligaleitung, Super Admin). Lesestatus (read_at)
-- wird PRO USER geführt — deshalb werden Admin-/Ligaleitungs-Hinweise als
-- konkrete Notification je berechtigtem User erzeugt (Fan-out), statt
-- rein rollenbasiert.
--
-- Ersetzt die bisherigen admin_notifications-Trigger (0005/0006): die
-- Trigger-Funktionen werden hier neu definiert und schreiben jetzt in
-- public.notifications. admin_notifications bleibt als Tabelle bestehen
-- (wird nicht mehr befüllt), um nichts zu zerstören.
--
-- Notifications werden NUR per SECURITY-DEFINER-Trigger erzeugt (keine
-- Client-Inserts, kein service_role im Frontend).
-- ============================================================

-- ── 1. Tabelle ───────────────────────────────────────────────

create table if not exists public.notifications (
  id                  uuid primary key default gen_random_uuid(),
  recipient_user_id   uuid references auth.users (id) on delete cascade,
  target_role         text,
  type                text not null,
  title               text not null,
  message             text not null,
  short_text          text not null,
  related_entity_type text,
  related_entity_id   uuid,
  action_url          text,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_user_id, read_at, created_at desc);

alter table public.notifications enable row level security;

-- Jeder sieht & quittiert NUR seine eigenen Notifications.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications for select
  using (recipient_user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications for update
  using (recipient_user_id = auth.uid())
  with check (recipient_user_id = auth.uid());

-- Kein INSERT-Policy für Nutzer: Inserts laufen ausschließlich über die
-- SECURITY-DEFINER-Trigger unten.


-- ── 2. Hilfsfunktion: deutsches Rollen-Label ─────────────────

create or replace function public.role_label_de(r text)
returns text language sql immutable as $$
  select case r
    when 'super_admin'  then 'Super Admin'
    when 'league_admin' then 'Ligaleitung'
    when 'team_captain' then 'Teamkapitän'
    when 'player'       then 'Spieler'
    else coalesce(r, 'Spieler')
  end;
$$;


-- ── 3. Neue Registrierung → Hinweis an alle Admins ───────────

create or replace function public.handle_new_profile_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  who text := coalesce(nullif(trim(new.display_name), ''), 'Ein Benutzer');
  is_tc boolean := new.registration_intent = 'team_captain';
begin
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
  select
    p.id,
    'user_registered',
    case when is_tc then 'Neue Teamcaptain-Anfrage' else 'Neue Spielerregistrierung' end,
    who || ' hat sich registriert und wartet auf Prüfung.',
    (case when is_tc then 'Neue Teamcaptain-Anfrage: ' else 'Neue Spielerregistrierung: ' end) || who,
    'profile', new.id, '/admin/users'
  from public.profiles p
  where p.role in ('league_admin', 'super_admin');
  return new;
end;
$$;

drop trigger if exists on_profile_created_notification on public.profiles;
create trigger on_profile_created_notification
  after insert on public.profiles
  for each row execute function public.handle_new_profile_notification();


-- ── 4. Profil-Änderung durch Admin → Hinweis an den User ─────

create or replace function public.handle_profile_change_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Spielerprofil verknüpft
  if new.player_id is not null and new.player_id is distinct from old.player_id then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.id, 'player_linked', 'Spielerprofil verknüpft',
      'Dein Spielerprofil wurde von der Ligaleitung verknüpft.',
      'Dein Spielerprofil wurde verknüpft.',
      'profile', new.id, '/mein-profil');
  end if;

  -- Team zugeordnet
  if new.team_id is not null and new.team_id is distinct from old.team_id then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.id, 'team_linked', 'Team zugeordnet',
      'Du wurdest einem Team zugeordnet.',
      'Du wurdest einem Team zugeordnet.',
      'team', new.id, '/mein-bereich');
  end if;

  -- Rolle geändert
  if new.role is distinct from old.role then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.id, 'role_changed', 'Rolle geändert',
      'Deine Rolle wurde auf ' || public.role_label_de(new.role) || ' geändert.',
      'Deine Rolle wurde auf ' || public.role_label_de(new.role) || ' geändert.',
      'team', new.id, '/mein-bereich');
  end if;

  return new;
end;
$$;

drop trigger if exists on_profile_changed_notification on public.profiles;
create trigger on_profile_changed_notification
  after update on public.profiles
  for each row execute function public.handle_profile_change_notification();


-- ── 5. Mannschaftsanmeldung → Hinweise (Admins + Einreicher) ─

create or replace function public.handle_registration_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  team text := coalesce(nullif(trim(new.team_name), ''), 'Eine Mannschaft');
begin
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

-- Trigger existiert bereits aus 0005 (on_registration_notification) und
-- nutzt automatisch die neue Funktionsdefinition.
drop trigger if exists on_registration_notification on public.team_registrations;
create trigger on_registration_notification
  after insert or update on public.team_registrations
  for each row execute function public.handle_registration_notification();
