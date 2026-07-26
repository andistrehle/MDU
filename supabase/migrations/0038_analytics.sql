-- ============================================================
-- 0038 · Anonyme, cookielose Nutzungsstatistik
-- ============================================================
--
-- Speichert pro Seitenaufruf ein Ereignis OHNE Personenbezug: nur Pfad, Theme
-- (dark/light), ob eingeloggt (ja/nein, NICHT welcher Nutzer) und eine zufällige
-- Session-Kennung (sessionStorage, kein Cookie, kein Personenbezug, wird beim
-- Schließen des Tabs verworfen). Keine IP, keine Konto-/Spieler-Zuordnung.
--
-- Schreiben: jeder (anonym). Lesen: nur Super-Admin (RLS + RPC-Guard).
-- ============================================================

create table if not exists public.analytics_events (
  id          bigint generated always as identity primary key,
  path        text not null,
  theme       text,                       -- 'dark' | 'light'
  logged_in   boolean not null default false,
  session_id  text,                       -- anonyme, session-scoped Kennung
  created_at  timestamptz not null default now()
);
create index if not exists analytics_events_created_idx on public.analytics_events (created_at);
create index if not exists analytics_events_path_idx    on public.analytics_events (path);

alter table public.analytics_events enable row level security;

-- Jeder darf ein anonymes Ereignis melden; lesen darf nur der Super-Admin.
drop policy if exists "analytics_insert" on public.analytics_events;
create policy "analytics_insert" on public.analytics_events
  for insert to anon, authenticated with check (true);
drop policy if exists "analytics_select_super" on public.analytics_events;
create policy "analytics_select_super" on public.analytics_events
  for select using (public.is_super_admin());

-- Tabellen-Privileg (RLS-Policy allein genügt nicht): anonyme + eingeloggte
-- Besucher dürfen ein Ereignis schreiben. Lesen läuft nur über die RPCs.
grant insert on public.analytics_events to anon, authenticated;

-- ── Aggregat-RPCs (security definer, nur Super-Admin) ─────────
create or replace function public.analytics_daily(p_days int default 30)
returns table(day date, views bigint, sessions bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_super_admin() then raise exception 'Nur Super-Admin.' using errcode = '42501'; end if;
  return query
    select date_trunc('day', e.created_at)::date, count(*)::bigint, count(distinct e.session_id)::bigint
    from public.analytics_events e
    where e.created_at >= now() - make_interval(days => p_days)
    group by 1 order by 1;
end; $$;

create or replace function public.analytics_top_paths(p_days int default 30, p_limit int default 20)
returns table(path text, views bigint, sessions bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_super_admin() then raise exception 'Nur Super-Admin.' using errcode = '42501'; end if;
  return query
    select e.path, count(*)::bigint, count(distinct e.session_id)::bigint
    from public.analytics_events e
    where e.created_at >= now() - make_interval(days => p_days)
    group by e.path order by 2 desc limit p_limit;
end; $$;

create or replace function public.analytics_theme(p_days int default 30)
returns table(theme text, views bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_super_admin() then raise exception 'Nur Super-Admin.' using errcode = '42501'; end if;
  return query
    select coalesce(e.theme, 'unbekannt'), count(*)::bigint
    from public.analytics_events e
    where e.created_at >= now() - make_interval(days => p_days)
    group by 1 order by 2 desc;
end; $$;

create or replace function public.analytics_logins(p_days int default 30)
returns table(logged_in boolean, views bigint, sessions bigint)
language plpgsql security definer set search_path = public stable as $$
begin
  if not public.is_super_admin() then raise exception 'Nur Super-Admin.' using errcode = '42501'; end if;
  return query
    select e.logged_in, count(*)::bigint, count(distinct e.session_id)::bigint
    from public.analytics_events e
    where e.created_at >= now() - make_interval(days => p_days)
    group by 1;
end; $$;

grant execute on function public.analytics_daily(int)            to authenticated;
grant execute on function public.analytics_top_paths(int, int)   to authenticated;
grant execute on function public.analytics_theme(int)            to authenticated;
grant execute on function public.analytics_logins(int)           to authenticated;
