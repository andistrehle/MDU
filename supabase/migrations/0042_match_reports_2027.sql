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
--   5. Schreiben enger: Weil Tabelle und Ergebnisse jetzt AUS DEN BERICHTEN
--      entstehen, darf niemand außer der Ligaleitung einen Bericht als
--      „bestätigt" oder als Wertung anlegen, nur Kapitäne der beiden Teams
--      legen an, und wer bestätigt, darf die Zahlen nicht ändern (nur Status
--      und Änderungsvorschlag). Bisher prüfte die DB nur „Eintragender = ich".
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

-- ── Anlegen: Ligaleitung, oder Kapitän eines der beiden Teams als Entwurf ──
drop policy if exists "mr_insert" on public.match_reports;
create policy "mr_insert" on public.match_reports for insert
  with check (
    home_captain_user_id = auth.uid()
    and (
      public.is_admin()
      or (status = 'draft' and forfeit is null
          and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'team_captain'
                      and me.team_id in (match_reports.home_team_id, match_reports.guest_team_id)))
    )
  );

-- ── Eintragender: bearbeiten/einreichen, aber nicht selbst bestätigen oder werten ──
drop policy if exists "mr_update_own" on public.match_reports;
create policy "mr_update_own" on public.match_reports for update
  using (home_captain_user_id = auth.uid() and status in ('draft','submitted','changes_requested'))
  -- 'changes_requested' muss bleiben dürfen: Der Eintragende speichert seine
  -- Korrektur, während der Bericht noch auf „Änderung angefordert" steht.
  with check (home_captain_user_id = auth.uid() and status in ('draft','submitted','changes_requested') and forfeit is null);

-- ── Wer nicht eingetragen hat (Bestätigender), ändert keine Zahlen ──
-- RLS kennt keine Spaltenrechte, deshalb als Trigger: Für alle außer dem
-- Eintragenden und der Ligaleitung bleiben Ergebnis, Teams, Saison und
-- Wertung unverändert. Bestätigen und Vorschlag (proposed_changes …) gehen.
create or replace function public.guard_match_report_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.is_admin() or auth.uid() is null or auth.uid() = old.home_captain_user_id then
    return new;
  end if;
  if new.spiele_home is distinct from old.spiele_home or new.spiele_guest is distinct from old.spiele_guest
     or new.legs_home is distinct from old.legs_home or new.legs_guest is distinct from old.legs_guest
     or new.points_home is distinct from old.points_home or new.points_guest is distinct from old.points_guest
     or new.home_team_id is distinct from old.home_team_id or new.guest_team_id is distinct from old.guest_team_id
     or new.season_id is distinct from old.season_id or new.forfeit is distinct from old.forfeit
     or new.home_captain_user_id is distinct from old.home_captain_user_id
     or new.confirm_team_id is distinct from old.confirm_team_id then
    raise exception 'Das Ergebnis ändert nur, wer den Spielbericht eingetragen hat — bitte einen Änderungsvorschlag schicken.';
  end if;
  if new.status not in ('confirmed', 'changes_requested') then
    raise exception 'Unzulässiger Status.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_match_report_update on public.match_reports;
create trigger guard_match_report_update
  before update on public.match_reports
  for each row execute function public.guard_match_report_update();

-- Spiele/Aufstellung des Berichts: nur Eintragender (nicht bestätigt) oder Ligaleitung.
drop policy if exists "mrp_write" on public.match_report_players;
create policy "mrp_write" on public.match_report_players for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested') and r.forfeit is null) or public.is_admin())))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested') and r.forfeit is null) or public.is_admin())));

drop policy if exists "mrg_write" on public.match_report_games;
create policy "mrg_write" on public.match_report_games for all
  using (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested') and r.forfeit is null) or public.is_admin())))
  with check (exists (select 1 from public.match_reports r where r.id = report_id
                 and ((r.home_captain_user_id = auth.uid() and r.status in ('draft','submitted','changes_requested') and r.forfeit is null) or public.is_admin())));

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
