-- ============================================================
-- 0040 · Startgeld-Status je Team & Saison (Bezahlt / offen)
-- ============================================================
--
-- Bewusst EIGENE Tabelle statt einer Spalte auf season_team_assignments:
-- deren Zeilen sind öffentlich lesbar (Migration 0037), der Zahlungsstatus soll
-- aber NUR eingeloggt sichtbar sein — für die Ligaleitung und den jeweiligen
-- Teamkapitän, nie öffentlich.
--
-- Betrag wird NICHT gespeichert (20 € / Spieler × Kadergröße wird in der App
-- dynamisch berechnet), damit er bei Kaderänderungen automatisch stimmt.
-- ============================================================

create table if not exists public.season_team_payments (
  season_id  text not null references public.seasons (id),
  team_id    text not null references public.teams (id),
  paid       boolean not null default false,
  paid_at    timestamptz,
  updated_by uuid references auth.users (id),
  updated_at timestamptz not null default now(),
  primary key (season_id, team_id)
);

alter table public.season_team_payments enable row level security;

-- Lesen: Ligaleitung/Admin ODER der Kapitän genau dieses Teams (eingeloggt).
-- KEIN öffentlicher Zugriff (anders als season_team_assignments).
drop policy if exists "stp_select" on public.season_team_payments;
create policy "stp_select" on public.season_team_payments for select
  using (
    public.is_admin()
    -- Der bei der Anmeldung hinterlegte Kapitän dieses Teams …
    or exists (
      select 1 from public.season_team_assignments a
      where a.season_id = season_team_payments.season_id
        and a.team_id   = season_team_payments.team_id
        and a.captain_user_id = auth.uid()
    )
    -- … oder ein als Teamkapitän verknüpftes Konto desselben Teams (falls das
    -- Kapitäns-Konto von der Anmelde-Kennung abweicht).
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.team_id = season_team_payments.team_id
        and p.role = 'team_captain'
    )
  );

-- Schreiben (umschalten): nur Ligaleitung/Admin.
drop policy if exists "stp_admin_write" on public.season_team_payments;
create policy "stp_admin_write" on public.season_team_payments for all
  using (public.is_admin()) with check (public.is_admin());
