-- ============================================================
-- 0066: Strafen-Tracker am Spielabend + Ersatz-Kassenwart (Betreiber, 30.10.2026)
-- ============================================================
-- Ein „Strafen-Abend“ hängt an einem Spiel (match_key) oder ist frei (nur Datum).
-- Gezählt wird LIVE in der DB (je Spieler und Strafart eine Zeile mit Anzahl),
-- „Abschließen“ bucht alles als Strafen in die Teamkasse („U26 × 3“).
-- Lesen: ganzes Team. Zählen: wer die Kasse führen darf (kasse_darf) ODER der
-- Ersatz-Kassenwart DIESES Abends (vom Kapitän/Kassenwart bestimmt), solange der
-- Abend offen ist, spätestens bis Dienstag 23:59 nach dem Datum.
-- Zählen und Abschließen nur über die Funktionen unten (keine Schreib-Policy auf
-- den Strichen) — zwei Handys zählen gleichzeitig, ohne sich zu überschreiben.
-- ============================================================

create table if not exists public.team_strafen_abende (
  id               uuid primary key default gen_random_uuid(),
  team_id          text not null,
  match_key        text,                 -- 'Heim|Gast' (MDU-Spiel) oder 'ext:<id>' — null = freier Abend
  titel            text not null default '',
  datum            date not null,
  ersatz_player_id text,                 -- Ersatz-Kassenwart (Kader-Kennung = profiles.player_id)
  ersatz_name      text,
  gueltig_bis      timestamptz not null,
  status           text not null default 'offen' check (status in ('offen', 'abgeschlossen')),
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  abgeschlossen_at timestamptz,
  abgeschlossen_by uuid references auth.users(id)
);
create unique index if not exists strafen_abend_spiel_idx on public.team_strafen_abende (team_id, match_key) where match_key is not null;
create index if not exists strafen_abend_team_idx on public.team_strafen_abende (team_id, datum desc);

create table if not exists public.team_strafen_striche (
  abend_id     uuid not null references public.team_strafen_abende(id) on delete cascade,
  player_key   text not null,
  player_name  text not null,
  art_key      text not null,            -- Strafart-ID oder 'eigen:<Bezeichnung>|<Cent>'
  title        text not null,
  amount_cents integer not null check (amount_cents > 0),
  anzahl       integer not null default 0 check (anzahl >= 0 and anzahl <= 99),
  updated_by   uuid references auth.users(id),
  updated_at   timestamptz not null default now(),
  primary key (abend_id, player_key, art_key)
);

alter table public.team_strafen_abende enable row level security;
alter table public.team_strafen_striche enable row level security;

-- Darf an diesem Abend zählen?
create or replace function public.strafen_darf(p_abend uuid)
returns boolean language sql security definer set search_path = public stable
as $$
  select exists (
    select 1 from public.team_strafen_abende a
    where a.id = p_abend and a.status = 'offen' and (
      public.kasse_darf(a.team_id)
      or (a.ersatz_player_id is not null and a.ersatz_player_id = public.current_player_id()
          and public.in_team(a.team_id) and public.zusagen_aktiv(a.team_id) and now() <= a.gueltig_bis)
    )
  )
$$;

drop policy if exists "strafen_abende_select" on public.team_strafen_abende;
create policy "strafen_abende_select" on public.team_strafen_abende for select using (public.in_team(team_id) or public.is_admin());
drop policy if exists "strafen_abende_insert" on public.team_strafen_abende;
create policy "strafen_abende_insert" on public.team_strafen_abende for insert
  with check (created_by = auth.uid() and status = 'offen' and public.kasse_darf(team_id));
-- Ersatz bestimmen/ändern, Titel: nur Kapitän/Kassenwart; Status nur über abschliessen().
drop policy if exists "strafen_abende_update" on public.team_strafen_abende;
create policy "strafen_abende_update" on public.team_strafen_abende for update
  using (public.kasse_darf(team_id) and status = 'offen') with check (public.kasse_darf(team_id) and status = 'offen');
drop policy if exists "strafen_abende_delete" on public.team_strafen_abende;
create policy "strafen_abende_delete" on public.team_strafen_abende for delete using (public.kasse_darf(team_id) and status = 'offen');

drop policy if exists "strafen_striche_select" on public.team_strafen_striche;
create policy "strafen_striche_select" on public.team_strafen_striche for select using (
  exists (select 1 from public.team_strafen_abende a where a.id = abend_id and (public.in_team(a.team_id) or public.is_admin())));

-- Zählen: +1 / −1 (atomar, mehrere Geräte gleichzeitig).
create or replace function public.strafe_zaehlen(p_abend uuid, p_player_key text, p_player_name text,
  p_art_key text, p_title text, p_cents integer, p_delta integer)
returns integer language plpgsql security definer set search_path = public
as $$
declare n integer;
begin
  if not public.strafen_darf(p_abend) then raise exception 'Keine Berechtigung oder Abend abgeschlossen.'; end if;
  if p_delta not in (-1, 1) or p_cents <= 0 or length(coalesce(trim(p_title), '')) = 0 then raise exception 'Ungültige Eingabe.'; end if;
  insert into public.team_strafen_striche (abend_id, player_key, player_name, art_key, title, amount_cents, anzahl, updated_by)
  values (p_abend, p_player_key, p_player_name, p_art_key, trim(p_title), p_cents, greatest(0, p_delta), auth.uid())
  on conflict (abend_id, player_key, art_key) do update
    set anzahl = least(99, greatest(0, team_strafen_striche.anzahl + p_delta)), updated_by = auth.uid(), updated_at = now()
  returning anzahl into n;
  return n;
end $$;

-- Abschließen: alles Gezählte als Strafen in die Kasse, Abend schließen.
create or replace function public.strafen_abschliessen(p_abend uuid)
returns integer language plpgsql security definer set search_path = public
as $$
declare a public.team_strafen_abende; n integer;
begin
  if not public.strafen_darf(p_abend) then raise exception 'Keine Berechtigung oder Abend abgeschlossen.'; end if;
  select * into a from public.team_strafen_abende where id = p_abend for update;
  -- Zwei Handys tippen gleichzeitig „Abschließen“: der zweite wartet auf die Sperre und bucht nicht doppelt.
  if a.status <> 'offen' then raise exception 'Der Abend ist schon abgeschlossen.'; end if;
  insert into public.team_cash_entries (team_id, kind, player_key, player_name, title, amount_cents, entry_date, created_by)
  select a.team_id, 'strafe', s.player_key, s.player_name,
         case when s.anzahl > 1 then s.title || ' × ' || s.anzahl else s.title end,
         s.amount_cents * s.anzahl, a.datum, auth.uid()
  from public.team_strafen_striche s where s.abend_id = p_abend and s.anzahl > 0;
  get diagnostics n = row_count;
  update public.team_strafen_abende set status = 'abgeschlossen', abgeschlossen_at = now(), abgeschlossen_by = auth.uid() where id = p_abend;
  return n;
end $$;

revoke all on function public.strafe_zaehlen(uuid, text, text, text, text, integer, integer) from public, anon;
revoke all on function public.strafen_abschliessen(uuid) from public, anon;
grant execute on function public.strafe_zaehlen(uuid, text, text, text, text, integer, integer) to authenticated;
grant execute on function public.strafen_abschliessen(uuid) to authenticated;
grant execute on function public.strafen_darf(uuid) to authenticated;
