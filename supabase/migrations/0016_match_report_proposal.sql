-- ============================================================
-- MDU Platform — Migration 0016: Änderungsvorschlag des Gegners
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0015).
--
-- Der Gast-Kapitän kann beim „Änderung anfordern" einen konkreten Vorschlag
-- (geänderte Spiel-Ergebnisse) mitschicken. Dieser wird NICHT direkt
-- übernommen, sondern in proposed_changes gespeichert und dem Heim-Kapitän
-- angezeigt, der entscheidet. Übernimmt der Heim-Kapitän, wird neu eingereicht
-- (Historie via 0015-Trigger). proposed_changes wird dann geleert.
-- ============================================================

alter table public.match_reports add column if not exists proposed_changes jsonb;
alter table public.match_reports add column if not exists proposed_by       uuid references auth.users (id);
alter table public.match_reports add column if not exists proposed_at       timestamptz;

-- Gast-Kapitän darf den Bericht auch bei status 'changes_requested' aktualisieren
-- (z. B. Vorschlag nachschärfen), nicht nur bei 'submitted'.
drop policy if exists "mr_update_guest" on public.match_reports;
create policy "mr_update_guest" on public.match_reports for update
  using (
    status in ('submitted', 'changes_requested')
    and exists (select 1 from public.profiles me where me.id = auth.uid()
                and me.team_id = match_reports.guest_team_id and me.role = 'team_captain')
  )
  with check (
    exists (select 1 from public.profiles me where me.id = auth.uid()
            and me.team_id = match_reports.guest_team_id and me.role = 'team_captain')
  );
