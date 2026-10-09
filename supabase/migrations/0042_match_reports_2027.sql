-- ============================================================
-- MDU Platform — Migration 0042: Spielberichte für die Saison 2026/27
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0041). Ändert keine bestehenden
-- Berichte (am 09.10.2026 gab es keine einzige Zeile in match_reports).
--
-- Ab 2026/27 rechnen Tabelle, Ergebnisse und Einzelrangliste aus den
-- Spielberichten (dartunion.de gibt es nicht mehr). Dafür:
--
--   1. confirm_team_id — welches Team bestätigt. Laut Spielbedingungen
--      (Ziffer 11): „Eingabe durch den einen, Online-Bestätigung durch den
--      anderen" — eintragen darf Heim ODER Gast. Bisher war die Bestätigung
--      fest an guest_team_id gebunden; trug der Gast ein (z. B. Foto-Upload),
--      hätte er seinen eigenen Bericht bestätigt. NULL = wie bisher Gast.
--   2. forfeit — Wertung durch die Ligaleitung statt gespieltem Ergebnis:
--        home_no_show / guest_no_show → 0:3 Punkte, 0:18 Spiele,
--                                        dem nicht angetretenen Team −3 Punkte
--        no_report                    → Heimteam verliert 0:3 / 0:18
--                                        (Bericht nicht bis Dienstag 24 Uhr)
--   3. Eindeutig je Begegnung: (Saison, Heim, Gast) — in der Doppelrunde gibt
--      es jede Paarung mit festem Heimrecht genau einmal. Verhindert zwei
--      Berichte zum selben Spiel.
--   4. Lesen: Mitglieder BEIDER Teams (bisher nur Eintragender + Gastteam).
-- ============================================================

alter table public.match_reports
  add column if not exists confirm_team_id text,
  add column if not exists forfeit text;

alter table public.match_reports drop constraint if exists match_reports_forfeit_check;
alter table public.match_reports add constraint match_reports_forfeit_check
  check (forfeit is null or forfeit in ('home_no_show', 'guest_no_show', 'no_report'));

create unique index if not exists match_reports_fixture_uq
  on public.match_reports (season_id, home_team_id, guest_team_id)
  where home_team_id is not null and guest_team_id is not null;

-- ── Lesen: Eintragender, Admin, Mitglieder beider Teams ─────
drop policy if exists "mr_select" on public.match_reports;
create policy "mr_select" on public.match_reports for select
  using (
    home_captain_user_id = auth.uid()
    or public.is_admin()
    or exists (select 1 from public.profiles me where me.id = auth.uid()
               and me.team_id in (match_reports.home_team_id, match_reports.guest_team_id))
  );

drop policy if exists "mrp_select" on public.match_report_players;
create policy "mrp_select" on public.match_report_players for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin()
                      or exists (select 1 from public.profiles me where me.id = auth.uid()
                                 and me.team_id in (r.home_team_id, r.guest_team_id)))));

drop policy if exists "mrg_select" on public.match_report_games;
create policy "mrg_select" on public.match_report_games for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin()
                      or exists (select 1 from public.profiles me where me.id = auth.uid()
                                 and me.team_id in (r.home_team_id, r.guest_team_id)))));

drop policy if exists "mrh_select" on public.match_report_history;
create policy "mrh_select" on public.match_report_history for select
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and (r.home_captain_user_id = auth.uid() or public.is_admin()
                      or exists (select 1 from public.profiles me where me.id = auth.uid()
                                 and me.team_id in (r.home_team_id, r.guest_team_id)))));

-- ── Bestätigen / Änderung anfordern: Kapitän des BESTÄTIGENDEN Teams ──
drop policy if exists "mr_update_guest" on public.match_reports;
create policy "mr_update_guest" on public.match_reports for update
  using (
    status in ('submitted', 'changes_requested')
    and exists (select 1 from public.profiles me where me.id = auth.uid()
                and me.team_id = coalesce(match_reports.confirm_team_id, match_reports.guest_team_id)
                and me.role = 'team_captain')
  )
  with check (
    exists (select 1 from public.profiles me where me.id = auth.uid()
            and me.team_id = coalesce(match_reports.confirm_team_id, match_reports.guest_team_id)
            and me.role = 'team_captain')
  );

-- ── Benachrichtigungen an das bestätigende Team (statt fest an Gast) ──
create or replace function public.handle_match_report_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  label text := coalesce(nullif(trim(new.home_team_name), ''), 'Heim')
             || ' – ' || coalesce(nullif(trim(new.guest_team_name), ''), 'Gast');
  confirmer text := coalesce(new.confirm_team_id, new.guest_team_id);
begin
  if new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    insert into public.match_report_history (report_id, action, actor_user_id)
      values (new.id, 'submitted', new.home_captain_user_id);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Für ' || label || ' wurde ein Spielbericht eingetragen. Bitte prüfen und bestätigen.',
      'Spielbericht zu prüfen: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht'
    from public.profiles p where p.team_id = confirmer and p.role = 'team_captain'
      and p.id is distinct from new.home_captain_user_id;
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'match_report_submitted', 'Neuer Spielbericht',
      'Spielbericht ' || label || ' wurde eingereicht.', 'Neuer Spielbericht: ' || label,
      'match_report', new.id, '/admin/spielberichte'
    from public.profiles p where p.role in ('league_admin', 'super_admin');
  end if;

  if tg_op = 'UPDATE' and new.status = 'changes_requested'
     and old.status is distinct from 'changes_requested' and new.home_captain_user_id is not null then
    insert into public.match_report_history (report_id, action, actor_user_id, note)
      values (new.id, 'changes_requested', new.guest_response_user_id, new.guest_change_note);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_changes_requested', 'Änderung am Spielbericht angefordert',
      'Der Gegner hat zum Spielbericht ' || label || ' eine Änderung angefordert.'
        || coalesce(chr(10) || 'Hinweis: ' || nullif(trim(new.guest_change_note), ''), ''),
      'Änderung angefordert: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');

    if new.negotiation_rounds >= 3 then
      insert into public.match_report_history (report_id, action, actor_user_id, note)
        values (new.id, 'escalated', new.guest_response_user_id, 'Nach 3 Verhandlungsrunden zur Entscheidung an die Ligaleitung.');
      insert into public.notifications
        (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
      select p.id, 'match_report_escalated', 'Spielbericht: Entscheidung nötig',
        'Beim Spielbericht ' || label || ' konnten sich die Teams nach 3 Runden nicht einigen. Bitte entscheiden.',
        'Entscheidung nötig: ' || label, 'match_report', new.id, '/admin/spielberichte'
      from public.profiles p where p.role in ('league_admin', 'super_admin');
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'confirmed'
     and old.status is distinct from 'confirmed' and new.home_captain_user_id is not null then
    insert into public.match_report_history (report_id, action, actor_user_id)
      values (new.id, 'confirmed', new.guest_response_user_id);
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.home_captain_user_id, 'match_report_confirmed', 'Spielbericht bestätigt',
      'Der Gegner hat den Spielbericht ' || label || ' bestätigt.',
      'Spielbericht bestätigt: ' || label, 'match_report', new.id, '/mein-bereich/spielberichte/uebersicht');
  end if;

  return new;
end;
$$;

create or replace function public.notify_report_change(p_report_id uuid, p_action text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  r record; label text; msg text;
begin
  if not public.is_admin() then raise exception 'Keine Berechtigung.'; end if;
  select * into r from public.match_reports where id = p_report_id;
  if not found then return; end if;

  label := coalesce(nullif(trim(r.home_team_name), ''), 'Heim')
        || ' – ' || coalesce(nullif(trim(r.guest_team_name), ''), 'Gast');
  msg := case p_action
           when 'deleted' then 'Der Spielbericht ' || label || ' wurde von der Ligaleitung gelöscht.'
           else 'Der Spielbericht ' || label || ' wurde von der Ligaleitung geändert.'
         end;

  insert into public.match_report_history (report_id, action, actor_user_id)
    values (r.id, 'admin_' || p_action, auth.uid());

  -- Kapitäne BEIDER Teams (und der Eintragende) erfahren es.
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
  select distinct p.id, 'match_report_admin_change', 'Spielbericht aktualisiert',
    msg, msg, 'match_report', r.id, '/mein-bereich/spielberichte/uebersicht'
  from public.profiles p
  where (p.team_id in (r.home_team_id, r.guest_team_id) and p.role = 'team_captain')
     or p.id = r.home_captain_user_id;
end;
$$;
