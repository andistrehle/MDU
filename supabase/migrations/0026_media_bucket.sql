-- ============================================================
-- MDU Platform — Migration 0026: Medien-Bucket (öffentlich)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0025).
--
-- Öffentlicher Bucket `media` für anzeigbare Bilder (Profilbilder; später
-- Teamlogos/Mannschaftsbilder). Öffentliche Auslieferung über CDN-URLs.
-- Schreibzugriff via Storage-RLS: Spieler nur den eigenen Pfad
-- `players/{playerId}/…`, Admin/Ligaleitung alles.
--
-- Pfadkonvention:
--   players/{playerId}/avatar.webp     — Profilbild
--   (später) teams/{teamId}/logo.webp · teams/{teamId}/photo.webp
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Öffentliches Lesen (Bucket ist public; explizite Policy zur Klarheit).
drop policy if exists "media_read" on storage.objects;
create policy "media_read" on storage.objects
  for select using (bucket_id = 'media');

-- Helper-Prädikat: darf der aktuelle Nutzer diesen Pfad schreiben?
--   players/{playerId}/…  → nur der verknüpfte Spieler  · Admin: alles
-- (storage.foldername(name) liefert die Ordner als text[]; [1]=Bereich, [2]=Id)

drop policy if exists "media_insert_own" on storage.objects;
create policy "media_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'players' and
        (storage.foldername(name))[2] = public.current_player_id()
      )
    )
  );

drop policy if exists "media_update_own" on storage.objects;
create policy "media_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'players' and
        (storage.foldername(name))[2] = public.current_player_id()
      )
    )
  )
  with check (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'players' and
        (storage.foldername(name))[2] = public.current_player_id()
      )
    )
  );

drop policy if exists "media_delete_own" on storage.objects;
create policy "media_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media' and (
      public.is_admin() or (
        (storage.foldername(name))[1] = 'players' and
        (storage.foldername(name))[2] = public.current_player_id()
      )
    )
  );
