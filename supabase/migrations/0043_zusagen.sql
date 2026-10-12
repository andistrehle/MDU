-- ============================================================
-- 0043 — Zu- und Absagen je Spieltag (Saison 2026/27)
-- ============================================================
--
-- Vom Betreiber festgelegt (12.10.2026):
--   • Jeder steht auf „offen“, bis er zu- oder absagt (keine Zeile = offen).
--   • Keine harte Frist: Spieler können bis Spielbeginn ändern.
--   • Spieler sehen im eigenen Team Namen + Status der anderen.
--   • Kurze Notiz (max. 140 Zeichen) zur Zu-/Absage.
--   • Kapitän setzt den Status für jeden Spieler seines Teams (auch ohne
--     Konto) und stellt ein, ab wie vielen Tagen vor dem Spiel die Erinnerung
--     in der Glocke erscheint (Vorgabe 7, 0 = aus).
--   • Kapitäne bekommen jede Zu- und Absage eines Spielers in die Glocke.
--   • Nominierung kommt im nächsten Schritt (nicht hier).
--   • Vorerst nur für Freibad Bazis + Ligaleitung freigeschaltet
--     (availability_enabled_teams), wird noch überarbeitet / evtl. Premium.
--
-- Die Begegnungen selbst stehen im Code (lib/data/saison-2027.ts), nicht in
-- der DB — Kennung ist die Begegnung „Heim|Gast“ wie bei den Spielberichten.
-- Nur lesende Tabellen anderer Bereiche werden berührt; nichts wird gelöscht.
-- ============================================================

create table if not exists public.match_availability (
  season_id   text not null,
  match_key   text not null,                 -- Heim|Gast (begegnungKey)
  team_id     text not null,                 -- Team des Spielers (Heim ODER Gast)
  player_id   text not null,                 -- players.id, sonst „name:<Name>“ (Kader ohne Profil)
  player_name text not null,
  status      text not null check (status in ('yes', 'no')),
  note        text check (note is null or char_length(note) <= 140),
  label       text,                          -- „Fr 23.10. · Freibad Bazis – Fiaker Deife“ (für die Glocke)
  updated_by  uuid references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (season_id, match_key, team_id, player_id)
);

create index if not exists match_availability_team_idx
  on public.match_availability (season_id, team_id, match_key);

create table if not exists public.team_availability_settings (
  team_id        text primary key,
  reminder_days  int  not null default 7 check (reminder_days between 0 and 30),
  updated_by     uuid references auth.users (id) on delete set null,
  updated_at     timestamptz not null default now()
);

alter table public.match_availability enable row level security;
alter table public.team_availability_settings enable row level security;

-- ── Freischaltung (12.10.2026): vorerst NUR Freibad Bazis + Ligaleitung ──
-- Schreiben dürfen nur Teams in dieser Liste (die Ligaleitung immer). Weitere
-- Teams freischalten = Zeile einfügen; gleichzeitig ZUSAGEN_TEAMS in
-- lib/features.ts ergänzen (Oberfläche + Glocke).
create table if not exists public.availability_enabled_teams (
  team_id    text primary key,
  created_at timestamptz not null default now()
);
alter table public.availability_enabled_teams enable row level security;
drop policy if exists "availability_enabled_select" on public.availability_enabled_teams;
create policy "availability_enabled_select" on public.availability_enabled_teams for select using (true);
-- Kein Schreib-Policy: Freischalten nur per SQL (service_role).
insert into public.availability_enabled_teams (team_id) values ('freibad-bazis') on conflict do nothing;

create or replace function public.zusagen_aktiv(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.availability_enabled_teams where team_id = p_team) or public.is_admin() $$;

-- Wer gehört zum Team? Spieler und Kapitän über profiles.team_id.
create or replace function public.in_team(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.profiles where id = auth.uid() and team_id = p_team) $$;

create or replace function public.is_captain_of(p_team text)
returns boolean language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.profiles where id = auth.uid() and team_id = p_team and role = 'team_captain') $$;

-- ── Lesen: eigenes Team + Ligaleitung ─────────────────────────
drop policy if exists "availability_select" on public.match_availability;
create policy "availability_select" on public.match_availability for select
  using (public.in_team(team_id) or public.is_admin());

-- ── Schreiben: eigener Eintrag (Spieler) · ganzes Team (Kapitän) · Ligaleitung ──
drop policy if exists "availability_insert" on public.match_availability;
create policy "availability_insert" on public.match_availability for insert
  with check (
    updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (
      (public.in_team(team_id) and player_id = public.current_player_id())
      or public.is_captain_of(team_id) or public.is_admin()
    )
  );

drop policy if exists "availability_update" on public.match_availability;
create policy "availability_update" on public.match_availability for update
  using (
    public.zusagen_aktiv(team_id) and (
      (public.in_team(team_id) and player_id = public.current_player_id())
      or public.is_captain_of(team_id) or public.is_admin()
    )
  )
  with check (
    updated_by = auth.uid() and public.zusagen_aktiv(team_id) and (
      (public.in_team(team_id) and player_id = public.current_player_id())
      or public.is_captain_of(team_id) or public.is_admin()
    )
  );

-- Zurück auf „offen“ = Zeile löschen.
drop policy if exists "availability_delete" on public.match_availability;
create policy "availability_delete" on public.match_availability for delete
  using (
    public.zusagen_aktiv(team_id) and (
      (public.in_team(team_id) and player_id = public.current_player_id())
      or public.is_captain_of(team_id) or public.is_admin()
    )
  );

-- ── Einstellungen: Team liest, Kapitän/Ligaleitung schreibt ───
drop policy if exists "availability_settings_select" on public.team_availability_settings;
create policy "availability_settings_select" on public.team_availability_settings for select
  using (public.in_team(team_id) or public.is_admin());

drop policy if exists "availability_settings_write" on public.team_availability_settings;
create policy "availability_settings_write" on public.team_availability_settings for all
  using (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()))
  with check (public.zusagen_aktiv(team_id) and (public.is_captain_of(team_id) or public.is_admin()));

-- ── Glocke: Kapitäne erfahren jede Zu-/Absage eines Spielers ──
-- Nicht, wenn ein Kapitän selbst (oder die Ligaleitung) den Status setzt —
-- dann weiß er es ja. Der Handelnde bekommt nie eine eigene Meldung.
create or replace function public.notify_availability_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  actor_role text;
  msg text;
begin
  if tg_op = 'UPDATE' and new.status = old.status and coalesce(new.note, '') = coalesce(old.note, '') then
    return new;
  end if;
  select role into actor_role from public.profiles where id = new.updated_by;
  if actor_role in ('team_captain', 'league_admin', 'super_admin') then
    return new;
  end if;
  msg := new.player_name || (case when new.status = 'yes' then ' hat zugesagt' else ' hat abgesagt' end)
         || coalesce(' · ' || new.label, '')
         || coalesce(' – „' || nullif(trim(new.note), '') || '“', '');
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, action_url)
  select p.id, 'availability_change',
         case when new.status = 'yes' then 'Zusage' else 'Absage' end,
         msg, msg, 'match_availability', '/mein-team/zusagen'
  from public.profiles p
  where p.team_id = new.team_id and p.role = 'team_captain' and p.id is distinct from new.updated_by;
  return new;
end;
$$;

drop trigger if exists match_availability_notify on public.match_availability;
create trigger match_availability_notify
  after insert or update on public.match_availability
  for each row execute function public.notify_availability_change();
