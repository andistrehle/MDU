-- ============================================================
-- 0075 WM-Tipp (Darts-WM 2027, Betreiber 25.11.2026)
-- ============================================================
-- Spielplan + Ergebnisse (wm_spiele, schreibt nur die Ligaleitung bzw. der Server),
-- Tipps je Konto und Spiel (wm_tipps, nur bis Spielbeginn änderbar),
-- Vorab-Tipps + Bonusfragen (wm_vorab, nur bis zum WM-Start),
-- Auflösung der Bonusfragen (wm_auswertung, eine Zeile).
-- Lesen: eigene Tipps per RLS; die Rangliste rechnet der Server mit service_role.
-- Kein Geld, keine Zahlungsdaten.
-- ============================================================

create table if not exists public.wm_spiele (
  id          uuid primary key default gen_random_uuid(),
  runde       text not null check (runde in ('r1','r2','r3','r4','vf','hf','f')),
  nr          int  not null,
  beginn      timestamptz,
  spieler_a   text not null,
  spieler_b   text not null,
  ziel        int  not null check (ziel between 1 and 9),
  sets_a      int,
  sets_b      int,
  quelle      text not null default 'hand',
  updated_at  timestamptz not null default now(),
  unique (runde, nr)
);
alter table public.wm_spiele enable row level security;
drop policy if exists wm_spiele_lesen on public.wm_spiele;
create policy wm_spiele_lesen on public.wm_spiele for select using (true);
drop policy if exists wm_spiele_admin on public.wm_spiele;
create policy wm_spiele_admin on public.wm_spiele for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.wm_tipps (
  user_id     uuid not null references auth.users(id) on delete cascade,
  spiel_id    uuid not null references public.wm_spiele(id) on delete cascade,
  sets_a      int  not null check (sets_a >= 0),
  sets_b      int  not null check (sets_b >= 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, spiel_id)
);
alter table public.wm_tipps enable row level security;

-- Tipp nur bis zum Beginn des Spiels (ohne Beginn: offen).
create or replace function public.wm_spiel_offen(p_spiel uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select beginn is null or beginn > now() from public.wm_spiele where id = p_spiel), false);
$$;

drop policy if exists wm_tipps_eigene_lesen on public.wm_tipps;
create policy wm_tipps_eigene_lesen on public.wm_tipps for select using (user_id = auth.uid());
drop policy if exists wm_tipps_eigene_neu on public.wm_tipps;
create policy wm_tipps_eigene_neu on public.wm_tipps for insert with check (user_id = auth.uid() and public.wm_spiel_offen(spiel_id));
drop policy if exists wm_tipps_eigene_aendern on public.wm_tipps;
create policy wm_tipps_eigene_aendern on public.wm_tipps for update using (user_id = auth.uid() and public.wm_spiel_offen(spiel_id))
  with check (user_id = auth.uid() and public.wm_spiel_offen(spiel_id));
drop policy if exists wm_tipps_eigene_loeschen on public.wm_tipps;
create policy wm_tipps_eigene_loeschen on public.wm_tipps for delete using (user_id = auth.uid() and public.wm_spiel_offen(spiel_id));

create table if not exists public.wm_vorab (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  vf                text[] not null default '{}',
  hf                text[] not null default '{}',
  finale            text[] not null default '{}',
  weltmeister       text,
  n180              int check (n180 is null or n180 >= 0),
  neun_darter       boolean,
  bester_deutscher  text,
  updated_at        timestamptz not null default now()
);
alter table public.wm_vorab enable row level security;

-- WM-Start = Ende der Vorab-Tipps. Eine Stelle, damit ein verschobener Start nur hier geändert wird.
create or replace function public.wm_vorab_offen() returns boolean
language sql stable as $$ select now() < timestamptz '2026-12-11 19:30:00+01'; $$;

drop policy if exists wm_vorab_lesen on public.wm_vorab;
create policy wm_vorab_lesen on public.wm_vorab for select using (user_id = auth.uid());
drop policy if exists wm_vorab_neu on public.wm_vorab;
create policy wm_vorab_neu on public.wm_vorab for insert with check (user_id = auth.uid() and public.wm_vorab_offen());
drop policy if exists wm_vorab_aendern on public.wm_vorab;
create policy wm_vorab_aendern on public.wm_vorab for update using (user_id = auth.uid() and public.wm_vorab_offen())
  with check (user_id = auth.uid() and public.wm_vorab_offen());

create table if not exists public.wm_auswertung (
  id                int primary key default 1 check (id = 1),
  n180              int,
  neun_darter       boolean,
  bester_deutscher  text,
  updated_at        timestamptz not null default now()
);
insert into public.wm_auswertung (id) values (1) on conflict do nothing;
alter table public.wm_auswertung enable row level security;
drop policy if exists wm_auswertung_lesen on public.wm_auswertung;
create policy wm_auswertung_lesen on public.wm_auswertung for select using (true);
drop policy if exists wm_auswertung_admin on public.wm_auswertung;
create policy wm_auswertung_admin on public.wm_auswertung for all using (public.is_admin()) with check (public.is_admin());
