-- ============================================================
-- MDU Platform — Migration 0013: Spielbericht-Workflow ohne Ligaleitung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0012).
--
-- Änderungen:
--   • Keine Freigabe durch die Ligaleitung mehr. Status-Fluss:
--       draft → submitted (Ergebnis zählt sofort)
--       Gegner: confirmed  ODER  changes_requested (Ergebnis bleibt)
--   • Gegner (Gast-Kapitän) sieht den Bericht + bekommt Benachrichtigung.
--   • Heim-Kapitän darf eigenen Bericht weiter bearbeiten (Tippfehler),
--     solange nicht vom Gegner bestätigt.
-- ============================================================

-- ── 1. Status-Constraint erweitern ───────────────────────────
alter table public.match_reports drop constraint if exists match_reports_status_check;
-- Alt-Status auf neues Modell mappen (frühere Tests: approved/rejected)
update public.match_reports set status = 'confirmed'         where status = 'approved';
update public.match_reports set status = 'changes_requested' where status = 'rejected';
alter table public.match_reports
  add constraint match_reports_status_check
  check (status in ('draft','submitted','confirmed','changes_requested'));

-- ── 2. Gast-Antwortfelder ────────────────────────────────────
alter table public.match_reports add column if not exists guest_change_note     text;
alter table public.match_reports add column if not exists guest_responded_at    timestamptz;
alter table public.match_reports add column if not exists guest_response_user_id uuid references auth.users (id);

-- ── 3. RLS neu: Heim-Kapitän, Gast-Kapitän, Admin ────────────

-- SELECT: eigener Bericht (Heim) ODER Admin ODER Mitglied des Gast-Teams
drop policy if exists "mr_select" on public.match_reports;
create policy "mr_select" on public.match_reports for select
  using (
    home_captain_user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.profiles me where me.id = auth.uid() and me.team_id = match_reports.guest_team_id)
  );

-- Heim darf bearbeiten, solange nicht bestätigt (Tippfehler korrigieren)
drop policy if exists "mr_update_own" on public.match_reports;
create policy "mr_update_own" on public.match_reports for update
  using (home_captain_user_id = auth.uid() and status in ('draft','submitted','changes_requested'))
  with check (home_captain_user_id = auth.uid());

-- Gast-Kapitän darf bestätigen / Änderung anfordern (eingereichter Bericht)
drop policy if exists "mr_update_guest" on public.match_reports;
create policy "mr_update_guest" on public.match_reports for update
  using (
    status = 'submitted'
    and exists (select 1 from public.profiles me where me.id = auth.uid()
                and me.team_id = match_reports.guest_team_id and me.role = 'team_captain')
  )
  with check (
    exists (select 1 from public.profiles me where me.id = auth.uid()
            and me.team_id = match_reports.guest_team_id and me.role = 'team_captain')
  );

-- Admin-Update (Korrekturen) bleibt
-- (mr_update_admin aus 0012 bleibt bestehen)

-- Kind-Tabellen: Lesen auch für Gast-Team, Schreiben weiterhin Heim/Admin
drop policy if exists "mrp_select" on public.match_report_players;
create policy "mrp_select" on public.match_report_players for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin()
                      or exists (select 1 from public.profiles me where me.id = auth.uid() and me.team_id = r.guest_team_id))));

drop policy if exists "mrg_select" on public.match_report_games;
create policy "mrg_select" on public.match_report_games for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin()
                      or exists (select 1 from public.profiles me where me.id = auth.uid() and me.team_id = r.guest_team_id))));

-- Heim darf Kinder bearbeiten solange draft/submitted/changes_requested
drop policy if exists "mrp_write" on public.match_report_players;
create policy "mrp_write" on public.match_report_players for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested')) or public.is_admin())))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested')) or public.is_admin())));

drop policy if exists "mrg_write" on public.match_report_games;
create policy "mrg_write" on public.match_report_games for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested')) or public.is_admin())))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested')) or public.is_admin())));

-- ── 4. Benachrichtigungen neu (Gegner statt Ligaleitung) ─────

create or replace function public.handle_match_report_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  label text := coalesce(nullif(trim(new.home_team_name), ''), 'Heim')
             || ' – ' || coalesce(nullif(trim(new.guest_team_name), ''), 'Gast');
begin
  -- Eingereicht → Gast-Kapitän(e) informieren (Ergebnis zählt bereits)
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Für ' || label || ' wurde ein Spielbericht eingetragen. Bitte prüfen und bestätigen.',
      'Spielbericht zu prüfen: ' || label,
      'match_report', new.id, '/mein-bereich/spielberichte'
    from public.profiles p
    where p.team_id = new.guest_team_id and p.role = 'team_captain';
  end if;

  -- Gast hat Änderung angefordert → Heim-Kapitän
  if tg_op = 'UPDATE' and new.status = 'changes_requested'
     and old.status is distinct from 'changes_requested' and new.home_captain_user_id is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_changes_requested', 'Änderung am Spielbericht angefordert',
      'Der Gegner hat zum Spielbericht ' || label || ' eine Änderung angefordert.'
        || coalesce(chr(10) || 'Hinweis: ' || nullif(trim(new.guest_change_note), ''), ''),
      'Änderung angefordert: ' || label,
      'match_report', new.id, '/mein-bereich/spielberichte');
  end if;

  -- Gast hat bestätigt → Heim-Kapitän
  if tg_op = 'UPDATE' and new.status = 'confirmed'
     and old.status is distinct from 'confirmed' and new.home_captain_user_id is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_confirmed', 'Spielbericht bestätigt',
      'Der Gegner hat den Spielbericht ' || label || ' bestätigt.',
      'Spielbericht bestätigt: ' || label,
      'match_report', new.id, '/mein-bereich/spielberichte');
  end if;

  return new;
end;
$$;
