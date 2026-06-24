-- ============================================================
-- MDU Platform — Migration 0027: Medien-Bucket, Team-Pfade
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0026).
--
-- Erweitert den öffentlichen `media`-Bucket um Schreibrechte für Teamlogos und
-- Mannschaftsbilder. Additiv: die bestehenden Spieler-Policies aus 0026 bleiben
-- unangetastet (RLS-Policies werden ver-ODERt).
--
-- Pfadkonvention:
--   teams/{teamId}/logo.webp   — Teamlogo
--   teams/{teamId}/photo.webp  — Mannschaftsbild
--
-- Schreibrecht: der verknüpfte Teamkapitän (public.current_team_id()) für sein
-- eigenes Team; Admin/Ligaleitung für alle (bereits über die 0026-Policies via
-- is_admin() abgedeckt — hier zur Klarheit erneut erlaubt).

drop policy if exists "media_insert_team" on storage.objects;
create policy "media_insert_team" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'teams' and
        (storage.foldername(name))[2] = public.current_team_id()
      )
    )
  );

drop policy if exists "media_update_team" on storage.objects;
create policy "media_update_team" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'teams' and
        (storage.foldername(name))[2] = public.current_team_id()
      )
    )
  )
  with check (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'teams' and
        (storage.foldername(name))[2] = public.current_team_id()
      )
    )
  );

drop policy if exists "media_delete_team" on storage.objects;
create policy "media_delete_team" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'teams' and
        (storage.foldername(name))[2] = public.current_team_id()
      )
    )
  );
