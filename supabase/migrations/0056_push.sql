-- ============================================================
-- 0056 — Push-Benachrichtigungen aufs Handy (Betreiber, 22.10.2026)
-- ============================================================
-- Jede neue Zeile in public.notifications (die Glocke) geht zusätzlich als
-- Push an alle Geräte des Empfängers, die Push eingeschaltet haben.
--
--   zusage_push_log — die tägliche Zusagen-Erinnerung je Spieler+Termin nur einmal.
--   push_subscriptions — je Gerät/Browser ein Abo (Endpunkt + Schlüssel des
--     Push-Dienstes von Apple/Google/Mozilla). Geschrieben und gelesen NUR vom
--     Server (service_role, /api/push/abo) — keine Policies. Meldet sich auf
--     einem Gerät jemand anderes an, wandert das Abo zu ihm (endpoint unique).
--   private.push_config — Adresse von /api/push/senden + gemeinsames Geheimnis.
--     Das Geheimnis wird HIER erzeugt und nur in Vercel eingetragen
--     (PUSH_WEBHOOK_SECRET), es steht nirgends im Repo.
--   Trigger auf notifications → pg_net ruft /api/push/senden mit der Kennung
--     der Benachrichtigung auf (asynchron; die Glocke wartet nicht darauf, und
--     ein Fehler beim Push hält die Benachrichtigung nie auf).
-- ============================================================

create extension if not exists pg_net with schema extensions;

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  created_at  timestamptz not null default now(),
  last_ok_at  timestamptz
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;

-- Zusagen-Erinnerung als Push (täglicher Cron /api/cron/zusagen-mails): je
-- Spieler und Termin nur einmal, wie bei der E-Mail (zusage_mail_log).
create table if not exists public.zusage_push_log (
  user_id    uuid not null references auth.users (id) on delete cascade,
  match_key  text not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, match_key)
);
alter table public.zusage_push_log enable row level security;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.push_config (
  id      integer primary key default 1 check (id = 1),
  url     text not null,
  secret  text not null
);

create or replace function public.push_bei_benachrichtigung()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c record;
begin
  select url, secret into c from private.push_config where id = 1;
  if c.url is null then return new; end if;
  perform net.http_post(
    url := c.url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', c.secret),
    body := jsonb_build_object('id', new.id)
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists notifications_push on public.notifications;
create trigger notifications_push
  after insert on public.notifications
  for each row execute function public.push_bei_benachrichtigung();

-- Adresse + Geheimnis einmalig anlegen (läuft nur, solange noch nichts drinsteht).
-- Das Ergebnis dieser Abfrage ist das Geheimnis für Vercel (PUSH_WEBHOOK_SECRET).
insert into private.push_config (id, url, secret)
values (1, 'https://www.mdudarts.de/api/push/senden', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (id) do nothing;

select secret as "PUSH_WEBHOOK_SECRET für Vercel" from private.push_config where id = 1;
