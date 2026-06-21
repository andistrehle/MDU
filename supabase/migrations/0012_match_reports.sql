-- ============================================================
-- MDU Platform — Migration 0012: Online-Spielberichte (4er-Bogen)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0011).
--
-- Online-Erfassung des MDU 4er-Spielberichtsbogens durch den Heim-Kapitän.
-- 18 Spiele (16 Einzel + 2 Doppel), je Best of 3 Legs. Das System berechnet
-- aus den Leg-Ergebnissen: Spiele, Legs, Mannschaftspunkte (3/1/0) sowie die
-- Einzelspieler-Punkte (2:0=3, 2:1=2, 1:2=1, 0:2=0; nur Einzel).
--
-- Saisongetrennt (season_id). Schreibzugriff nur Heim-Kapitän (eigener
-- Bericht, solange draft/rejected) bzw. Ligaleitung. Kein service_role.
-- Volldigitale Übernahme in Tabelle/Einzelrangliste folgt in Phase 2.
-- ============================================================

-- ── 1. Kopfdaten ─────────────────────────────────────────────

create table if not exists public.match_reports (
  id                  uuid primary key default gen_random_uuid(),
  season_id           text references public.seasons (id),
  league_label        text,                       -- z. B. 'A-Liga'
  matchday            integer,
  match_date          date,
  venue               text,
  home_team_id        text,                       -- Slug (optional)
  guest_team_id       text,
  home_team_name      text not null,
  guest_team_name     text not null,
  tc_home             text,
  tc_guest            text,
  home_captain_user_id uuid not null default auth.uid() references auth.users (id),
  -- vom System berechnete Ergebnisse
  spiele_home         integer,
  spiele_guest        integer,
  legs_home           integer,
  legs_guest          integer,
  points_home         integer,
  points_guest        integer,
  protest             boolean not null default false,
  protest_note        text,
  report_file_path    text,                       -- optionaler Scan/Foto (Phase 1b)
  status              text not null default 'draft'
                      check (status in ('draft','submitted','approved','rejected')),
  reviewed_by         uuid references auth.users (id),
  reviewed_at         timestamptz,
  review_note         text,
  applied_at          timestamptz,                -- Phase 2: Übernahme in Saisondaten
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists match_reports_season_idx on public.match_reports (season_id, status);
create index if not exists match_reports_captain_idx on public.match_reports (home_captain_user_id);

drop trigger if exists match_reports_updated_at on public.match_reports;
create trigger match_reports_updated_at
  before update on public.match_reports
  for each row execute function public.handle_updated_at();


-- ── 2. Aufstellung (H1–H6 / G1–G6) ───────────────────────────

create table if not exists public.match_report_players (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.match_reports (id) on delete cascade,
  side        text not null check (side in ('home','guest')),
  slot        integer not null,                   -- 1..6
  pass_no     text,
  name        text not null,
  player_id   text,                               -- optionale Verknüpfung
  points      integer not null default 0,         -- berechnete Einzel-Punkte
  unique (report_id, side, slot)
);


-- ── 3. Die 18 Spiele ─────────────────────────────────────────

create table if not exists public.match_report_games (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.match_reports (id) on delete cascade,
  game_no     integer not null,                   -- 1..18 (offizielle Reihenfolge)
  game_type   text not null check (game_type in ('single','double')),
  home_slot   integer,                            -- Einzel/Doppel: 1. Spieler Heim
  guest_slot  integer,
  home_slot2  integer,                            -- Doppel: 2. Spieler Heim
  guest_slot2 integer,
  legs_home   integer,
  legs_guest  integer,
  unique (report_id, game_no)
);


-- ── 4. RLS ───────────────────────────────────────────────────

alter table public.match_reports enable row level security;

drop policy if exists "mr_select" on public.match_reports;
create policy "mr_select" on public.match_reports for select
  using (home_captain_user_id = auth.uid() or public.is_admin());

drop policy if exists "mr_insert" on public.match_reports;
create policy "mr_insert" on public.match_reports for insert
  with check (home_captain_user_id = auth.uid());

drop policy if exists "mr_update_own" on public.match_reports;
create policy "mr_update_own" on public.match_reports for update
  using (home_captain_user_id = auth.uid() and status in ('draft','rejected'))
  with check (home_captain_user_id = auth.uid());

drop policy if exists "mr_update_admin" on public.match_reports;
create policy "mr_update_admin" on public.match_reports for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mr_delete_own" on public.match_reports;
create policy "mr_delete_own" on public.match_reports for delete
  using (home_captain_user_id = auth.uid() and status in ('draft','rejected'));

-- Helper-Prädikat für Kind-Tabellen: darf der aktuelle User den Bericht ändern?
-- (Eltern-Bericht gehört ihm und ist editierbar, oder er ist Admin.)

alter table public.match_report_players enable row level security;
drop policy if exists "mrp_select" on public.match_report_players;
create policy "mrp_select" on public.match_report_players for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin())));
drop policy if exists "mrp_write" on public.match_report_players;
create policy "mrp_write" on public.match_report_players for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','rejected')) or public.is_admin())))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','rejected')) or public.is_admin())));

alter table public.match_report_games enable row level security;
drop policy if exists "mrg_select" on public.match_report_games;
create policy "mrg_select" on public.match_report_games for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin())));
drop policy if exists "mrg_write" on public.match_report_games;
create policy "mrg_write" on public.match_report_games for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','rejected')) or public.is_admin())))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','rejected')) or public.is_admin())));


-- ── 5. Benachrichtigungen (an Admins / Heim-Kapitän) ─────────

create or replace function public.handle_match_report_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  label text := coalesce(nullif(trim(new.home_team_name), ''), 'Heim')
             || ' – ' || coalesce(nullif(trim(new.guest_team_name), ''), 'Gast');
begin
  -- Eingereicht → Ligaleitung/Super Admin
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Spielbericht ' || label || ' wurde eingereicht.',
      'Neuer Spielbericht: ' || label,
      'match_report', new.id, '/admin/spielberichte'
    from public.profiles p
    where p.role in ('league_admin','super_admin');
  end if;

  -- Freigegeben/Abgelehnt → Heim-Kapitän
  if tg_op = 'UPDATE' and old.status is distinct from new.status
     and new.status in ('approved','rejected') and new.home_captain_user_id is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id,
      'match_report_' || new.status,
      case new.status when 'approved' then 'Spielbericht freigegeben' else 'Spielbericht abgelehnt' end,
      case new.status
        when 'approved' then 'Dein Spielbericht ' || label || ' wurde freigegeben.'
        else 'Dein Spielbericht ' || label || ' wurde abgelehnt.'
          || coalesce(chr(10) || 'Begründung: ' || nullif(trim(new.review_note), ''), '')
      end,
      case new.status when 'approved' then 'Spielbericht freigegeben: ' || label
                      else 'Spielbericht abgelehnt: ' || label end,
      'match_report', new.id, '/mein-bereich/spielberichte');
  end if;

  return new;
end;
$$;

drop trigger if exists on_match_report_notification on public.match_reports;
create trigger on_match_report_notification
  after insert or update on public.match_reports
  for each row execute function public.handle_match_report_notification();
