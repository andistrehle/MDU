-- ============================================================
-- 0037 · Freigegebene Saison-Teams + Kader öffentlich lesbar
-- ============================================================
--
-- Team-Profile sind öffentlich (wie die statischen Teams: Name, Kader inkl.
-- Passnummern werden auf der Teamseite gezeigt). Die neuen, selbstverwalteten
-- Saison-Teams lagen aber in season_team_assignments / season_roster_assignments,
-- die bisher NUR Admin/Kapitän lesen durften → öffentliche Teamseite = 404.
--
-- Diese Migration öffnet das Lesen für FREIGEGEBENE (status='approved') Teams
-- und deren Kader. Entwürfe/nicht freigegebene Anmeldungen bleiben privat.
-- Schreiben bleibt unverändert Admin-only.
-- ============================================================

drop policy if exists "sta_select" on public.season_team_assignments;
create policy "sta_select" on public.season_team_assignments for select
  using (
    public.is_admin()
    or captain_user_id = auth.uid()
    or status = 'approved'
  );

drop policy if exists "sra_select" on public.season_roster_assignments;
create policy "sra_select" on public.season_roster_assignments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.season_team_assignments a
      where a.season_id = season_roster_assignments.season_id
        and a.team_id   = season_roster_assignments.team_id
        and (a.captain_user_id = auth.uid() or a.status = 'approved')
    )
  );
