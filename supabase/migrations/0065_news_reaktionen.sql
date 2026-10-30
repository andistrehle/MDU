-- ============================================================
-- 0065: News — gelesen (Auge) und „Gefällt mir“ (Betreiber, 30.10.2026)
-- ============================================================
-- Je Beitrag und Gerät EINE Zeile: gelesen = Beitrag geöffnet (einmal je
-- Gerät), gefaellt = Daumen gedrückt (nochmal tippen nimmt ihn zurück).
-- Geräte-Kennung ist eine Zufallszahl aus dem Browser (localStorage), kein
-- Konto, keine IP. Geschrieben/gelesen nur über /api/news/reaktion
-- (service_role) — RLS an, bewusst keine Policy.
-- ============================================================

create table if not exists public.news_reaktionen (
  news_id      text not null references public.news(id) on delete cascade,
  geraet_id    uuid not null,
  gelesen_am   timestamptz not null default now(),
  gefaellt     boolean not null default false,
  gefaellt_am  timestamptz,
  primary key (news_id, geraet_id)
);
alter table public.news_reaktionen enable row level security;

create or replace function public.news_zahlen(ids text[])
returns table (news_id text, gelesen bigint, gefaellt bigint)
language sql stable security definer set search_path = public as $$
  select r.news_id, count(*), count(*) filter (where r.gefaellt)
  from public.news_reaktionen r
  where r.news_id = any(ids)
  group by r.news_id
$$;
revoke all on function public.news_zahlen(text[]) from public, anon, authenticated;
grant execute on function public.news_zahlen(text[]) to service_role;
