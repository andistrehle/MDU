-- ============================================================
-- 0054 — E-Mail-Erinnerung an offene Zu-/Absagen (Team Manager)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0053).
--
-- Betreiber, 21.10.2026: Der Teamcaptain schaltet die E-Mail-Erinnerung fürs
-- ganze Team ein (Team-Einstellungen, Vorgabe AUS); jeder Spieler kann sich
-- über den Link in der Mail selbst abmelden. Verschickt wird einmal am Tag
-- (Vercel-Cron /api/cron/zusagen-mails) für Termine im Erinnerungsfenster,
-- das der Captain schon für die Glocke einstellt (reminder_days) — je Spieler
-- und Termin nur EINMAL.
--
-- Ohne diese Migration bleibt alles wie bisher: Die Seite blendet den Schalter
-- aus bzw. speichert ihn nicht, der Cron verschickt nichts.
-- ============================================================

alter table public.team_availability_settings
  add column if not exists email_reminder boolean not null default false;

-- Abmeldung des Spielers (Link in der Mail, Server-Route mit service_role)
alter table public.profiles
  add column if not exists zusage_mail_aus boolean not null default false;

-- Wer wurde für welchen Termin schon erinnert (Doppelversand verhindern)
create table if not exists public.zusage_mail_log (
  user_id    uuid not null references auth.users (id) on delete cascade,
  match_key  text not null,
  team_id    text not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, match_key)
);

comment on table public.zusage_mail_log is
  'E-Mail-Erinnerung an offene Zusagen: je Benutzer und Termin höchstens eine Mail. Nur Server (service_role).';

alter table public.zusage_mail_log enable row level security;
-- Keine Policies: Lesen/Schreiben ausschließlich serverseitig (service_role).
