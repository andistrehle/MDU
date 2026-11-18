-- ============================================================
-- 0070 — Postfach kontakt@mdudarts.de in der Plattform (Betreiber, 18.11.2026)
-- ============================================================
-- Die Plattform holt die Mails stündlich per IMAP bei Strato ab
-- (/api/cron/postfach, angestoßen von pg_cron über pg_net — Vercel-Crons laufen
-- nur täglich), zeigt sie der Ligaleitung unter Admin → Postfach und schickt
-- Antworten über Resend als kontakt@mdudarts.de.
--
--   postfach_mails  — ein- und ausgehende Mails (Text, keine HTML-Fassung).
--     Gelesen und geschrieben NUR vom Server (service_role) — keine Policies.
--   postfach_stand  — bis zu welcher Nachricht (IMAP-UID) schon abgeholt ist.
--   Bucket postfach — Anhänge, privat; Abruf nur über signierte Links vom Server.
--
-- Das Geheimnis für den Aufruf ist das vorhandene aus private.push_config
-- (PUSH_WEBHOOK_SECRET in Vercel) — es muss NICHTS kopiert werden.
-- ============================================================

create table if not exists public.postfach_mails (
  id            uuid primary key default gen_random_uuid(),
  richtung      text not null check (richtung in ('ein', 'aus')),
  message_id    text unique,
  imap_uid      bigint,
  in_reply_to   text,
  bezug         uuid references public.postfach_mails (id) on delete set null,
  von_name      text,
  von_email     text not null,
  an            text not null,
  betreff       text not null default '',
  text          text not null default '',
  datum         timestamptz not null,
  faden         text not null,
  status        text not null default 'offen' check (status in ('offen', 'erledigt')),
  automatisch   boolean not null default false,
  anhaenge      jsonb not null default '[]'::jsonb,
  entwurf       text,
  notiz         text,
  erledigt_von  uuid references auth.users (id) on delete set null,
  erledigt_am   timestamptz,
  gesendet_von  uuid references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists postfach_mails_status_idx on public.postfach_mails (status, datum desc);
create index if not exists postfach_mails_faden_idx on public.postfach_mails (faden, datum);

alter table public.postfach_mails enable row level security;

create table if not exists public.postfach_stand (
  id             integer primary key default 1 check (id = 1),
  uidvalidity    bigint,
  letzte_uid     bigint not null default 0,
  letzter_lauf   timestamptz,
  letzter_fehler text
);
insert into public.postfach_stand (id) values (1) on conflict (id) do nothing;
alter table public.postfach_stand enable row level security;

insert into storage.buckets (id, name, public) values ('postfach', 'postfach', false)
on conflict (id) do nothing;

-- Stündlicher Anstoß: ruft /api/cron/postfach mit dem vorhandenen Geheimnis auf.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create or replace function private.postfach_anstossen()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  c record;
begin
  select secret into c from private.push_config where id = 1;
  if c.secret is null then return; end if;
  perform net.http_post(
    url := 'https://www.mdudarts.de/api/cron/postfach',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', c.secret),
    body := '{}'::jsonb
  );
end;
$$;

do $$
begin
  perform cron.unschedule('postfach-abholen');
exception when others then null;
end $$;
select cron.schedule('postfach-abholen', '7 * * * *', $$ select private.postfach_anstossen(); $$);
