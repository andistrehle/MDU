-- ============================================================
-- MDU Platform — Migration 0005: Benachrichtigungen (Sprint)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0004).
--
-- 1. team_registrations: Felder für Notification-/Mail-Status
-- 2. admin_notifications  — interne Hinweise für Ligaleitung/Super Admin
-- 3. email_logs           — Protokoll der E-Mail-Versuche (nur Admins sichtbar)
-- 4. Trigger: bei „submitted" Hinweis erzeugen, bei Abschluss erledigen
--
-- E-Mails werden NICHT in der DB versendet — der Versand läuft serverseitig
-- über /api/notifications/email. email_logs wird vom Server geschrieben.
-- ============================================================

alter table public.team_registrations add column if not exists last_notification_sent_at timestamptz;
alter table public.team_registrations add column if not exists email_status text;


-- ── 1. admin_notifications ───────────────────────────────────

create table if not exists public.admin_notifications (
  id                  uuid primary key default gen_random_uuid(),
  type                text not null,
  title               text not null,
  message             text not null,
  target_roles        text[] not null,
  related_entity_type text,
  related_entity_id   uuid,
  status              text not null default 'unread' check (status in ('unread','read')),
  created_at          timestamptz not null default now(),
  read_at             timestamptz,
  read_by             uuid references auth.users (id)
);

create index if not exists admin_notifications_status_idx on public.admin_notifications (status, created_at desc);

alter table public.admin_notifications enable row level security;

-- Nur Ligaleitung/Super Admin sehen & quittieren Hinweise.
drop policy if exists "admin_notifications_select" on public.admin_notifications;
create policy "admin_notifications_select" on public.admin_notifications for select
  using (public.is_admin());

drop policy if exists "admin_notifications_update" on public.admin_notifications;
create policy "admin_notifications_update" on public.admin_notifications for update
  using (public.is_admin()) with check (public.is_admin());


-- ── 2. email_logs (nur Admins sichtbar; Insert via Server) ───

create table if not exists public.email_logs (
  id                  uuid primary key default gen_random_uuid(),
  to_email            text not null,
  subject             text not null,
  type                text not null,
  related_entity_type text,
  related_entity_id   uuid,
  status              text not null check (status in ('pending','sent','failed','skipped_no_provider')),
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.email_logs enable row level security;

-- Lesen nur Admins. Inserts erfolgen serverseitig (service_role umgeht RLS).
drop policy if exists "email_logs_select" on public.email_logs;
create policy "email_logs_select" on public.email_logs for select
  using (public.is_admin());


-- ── 3. Trigger: Hinweise automatisch erzeugen / erledigen ────

create or replace function public.handle_registration_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Neue Einreichung → Hinweis für Ligaleitung/Super Admin
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    insert into public.admin_notifications (type, title, message, target_roles, related_entity_type, related_entity_id)
    values (
      'team_registration_submitted',
      'Neue Mannschaftsanmeldung',
      coalesce(new.team_name, 'Eine Mannschaft') || ' wurde zur Prüfung eingereicht.',
      array['league_admin','super_admin'],
      'team_registration',
      new.id
    );
  end if;

  -- Abschluss → offene Hinweise zu dieser Anmeldung erledigen
  if tg_op = 'UPDATE'
     and new.status in ('approved','rejected','changes_requested')
     and old.status is distinct from new.status then
    update public.admin_notifications
      set status = 'read', read_at = now()
      where related_entity_id = new.id and status = 'unread';
  end if;

  return new;
end;
$$;

drop trigger if exists on_registration_notification on public.team_registrations;
create trigger on_registration_notification
  after insert or update on public.team_registrations
  for each row execute function public.handle_registration_notification();
