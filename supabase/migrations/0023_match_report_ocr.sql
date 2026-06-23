-- ============================================================
-- MDU Platform — Migration 0023: OCR-Upload für Papier-Spielberichte
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0022).
--
-- Phase-0/1-Pilot: ein handschriftlich ausgefüllter Papier-Spielbericht wird
-- als Foto/PDF hochgeladen, per OCR/Vision ausgelesen und als ENTWURF in den
-- bestehenden digitalen Spielbericht (Migration 0012) übernommen. Der Mensch
-- prüft und bestätigt; die Übernahme in Tabelle/Einzelrangliste erfolgt erst
-- über den vorhandenen Submit-/Bestätigungs-Workflow — hier passiert nichts
-- daran.
--
-- Sicherheit: privater Storage-Bucket, RLS, kein service_role im Frontend.
-- Schreibzugriffe auf Storage laufen ausschließlich serverseitig (Route
-- Handler mit service_role); Signed URLs werden serverseitig erzeugt.
-- ============================================================

-- ── 1. Uploads (Original-Datei + Verarbeitungsstatus) ────────

create table if not exists public.match_report_uploads (
  id                 uuid primary key default gen_random_uuid(),
  -- Begegnung: vorab gewählt (Match-Slug/-Id aus Spielplan). Text, da Matches
  -- in lib/data liegen, nicht in einer DB-Tabelle.
  match_id           text,
  season_id          text references public.seasons (id),
  -- Verknüpfung mit dem erzeugten digitalen Entwurf (nach OCR).
  match_report_id    uuid references public.match_reports (id) on delete set null,
  uploaded_by        uuid not null default auth.uid() references auth.users (id),
  storage_path       text not null,            -- Pfad im privaten Bucket
  file_name          text not null,
  mime_type          text not null,
  file_size          bigint,
  page_number        integer not null default 1,
  upload_status      text not null default 'uploaded'
                     check (upload_status in ('uploaded','quarantined','deleted')),
  ocr_status         text not null default 'pending'
                     check (ocr_status in ('pending','processing','completed','needs_review','failed')),
  ocr_provider       text,
  ocr_model          text,
  provider_request_id text,
  ocr_started_at     timestamptz,
  ocr_completed_at   timestamptz,
  ocr_error          text,
  -- Missbrauchs-/Kostenschutz + Idempotenz
  attempt_count      integer not null default 0,
  last_attempt_at    timestamptz,
  -- Review-Status des Uploads
  review_status      text not null default 'pending_review'
                     check (review_status in ('pending_review','in_review','confirmed','rejected')),
  reviewed_by        uuid references auth.users (id),
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists mru_match_idx   on public.match_report_uploads (match_id, ocr_status);
create index if not exists mru_uploader_idx on public.match_report_uploads (uploaded_by);
create index if not exists mru_status_idx   on public.match_report_uploads (ocr_status, review_status);

drop trigger if exists match_report_uploads_updated_at on public.match_report_uploads;
create trigger match_report_uploads_updated_at
  before update on public.match_report_uploads
  for each row execute function public.handle_updated_at();


-- ── 2. OCR-Rohergebnis je Upload (Originalerkennung, nicht überschreiben) ──

create table if not exists public.match_report_ocr_results (
  id                 uuid primary key default gen_random_uuid(),
  upload_id          uuid not null references public.match_report_uploads (id) on delete cascade,
  match_report_id    uuid references public.match_reports (id) on delete set null,
  raw_text           text,
  raw_result         jsonb,                    -- ungefiltertes Provider-Ergebnis
  structured_result  jsonb,                    -- in MDU-Schema überführt (Zod-validiert)
  overall_confidence numeric,
  provider           text,
  model_version      text,
  parser_version     text,
  warnings           jsonb,
  created_at         timestamptz not null default now()
);

create index if not exists mror_upload_idx on public.match_report_ocr_results (upload_id);


-- ── 3. Erkannte Einzelfelder (für Prüfung + Audit der Korrekturen) ──

create table if not exists public.match_report_ocr_fields (
  id                 uuid primary key default gen_random_uuid(),
  ocr_result_id      uuid not null references public.match_report_ocr_results (id) on delete cascade,
  field_key          text not null,            -- z. B. 'match.homeTeam', 'game.4.legs'
  detected_value     text,
  normalized_value   text,
  confidence         numeric,
  bounding_box       jsonb,
  status             text not null default 'detected'
                     check (status in ('detected','confirmed','corrected','rejected','unresolved')),
  corrected_value    text,
  corrected_by       uuid references auth.users (id),
  corrected_at       timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists mrof_result_idx on public.match_report_ocr_fields (ocr_result_id);


-- ── 4. Erweiterung des digitalen Spielberichts (Herkunft + Review) ──
-- Bestehende Spalten bleiben unangetastet; nur additive Felder.

alter table public.match_reports add column if not exists source text not null default 'manual'
  check (source in ('manual','ocr'));
alter table public.match_reports add column if not exists ocr_upload_id uuid
  references public.match_report_uploads (id) on delete set null;
alter table public.match_reports add column if not exists ocr_result_id uuid
  references public.match_report_ocr_results (id) on delete set null;
alter table public.match_reports add column if not exists ocr_review_status text
  check (ocr_review_status in ('pending_review','in_review','confirmed','rejected'));
alter table public.match_reports add column if not exists ocr_processed_at timestamptz;


-- ── 5. RLS ───────────────────────────────────────────────────
-- Lesen/Ändern: Uploader (eigene) oder Admin. Schreibzugriffe der Pipeline
-- laufen serverseitig mit service_role (umgeht RLS); diese Policies sichern
-- den Client-Zugriff (Review-UI) ab.

alter table public.match_report_uploads enable row level security;

drop policy if exists "mru_select" on public.match_report_uploads;
create policy "mru_select" on public.match_report_uploads for select
  using (uploaded_by = auth.uid() or public.is_admin());

drop policy if exists "mru_insert" on public.match_report_uploads;
create policy "mru_insert" on public.match_report_uploads for insert
  with check (uploaded_by = auth.uid());

drop policy if exists "mru_update_own" on public.match_report_uploads;
create policy "mru_update_own" on public.match_report_uploads for update
  using (uploaded_by = auth.uid() or public.is_admin())
  with check (uploaded_by = auth.uid() or public.is_admin());

alter table public.match_report_ocr_results enable row level security;

drop policy if exists "mror_select" on public.match_report_ocr_results;
create policy "mror_select" on public.match_report_ocr_results for select
  using (exists (select 1 from public.match_report_uploads u where u.id = upload_id
                 and (u.uploaded_by = auth.uid() or public.is_admin())));

alter table public.match_report_ocr_fields enable row level security;

drop policy if exists "mrof_select" on public.match_report_ocr_fields;
create policy "mrof_select" on public.match_report_ocr_fields for select
  using (exists (select 1 from public.match_report_ocr_results r
                 join public.match_report_uploads u on u.id = r.upload_id
                 where r.id = ocr_result_id and (u.uploaded_by = auth.uid() or public.is_admin())));

-- Feld-Korrekturen darf der Uploader (oder Admin) direkt speichern.
drop policy if exists "mrof_update" on public.match_report_ocr_fields;
create policy "mrof_update" on public.match_report_ocr_fields for update
  using (exists (select 1 from public.match_report_ocr_results r
                 join public.match_report_uploads u on u.id = r.upload_id
                 where r.id = ocr_result_id and (u.uploaded_by = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.match_report_ocr_results r
                 join public.match_report_uploads u on u.id = r.upload_id
                 where r.id = ocr_result_id and (u.uploaded_by = auth.uid() or public.is_admin())));


-- ── 6. Privater Storage-Bucket ───────────────────────────────
-- Nicht öffentlich. Max. 15 MB. Nur Bild-/PDF-Typen. Schreibzugriff/Signed
-- URLs ausschließlich serverseitig (service_role). Keine zusätzlichen
-- storage.objects-Policies → für anon/authenticated standardmäßig kein
-- Direktzugriff (RLS default deny), service_role umgeht RLS.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'match-report-uploads', 'match-report-uploads', false, 15728640,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ── 7. Benachrichtigung: OCR erkannt → an Uploader ───────────
-- Reuse der notifications-Tabelle/Muster aus 0012. Feuert, wenn ocr_status
-- auf 'completed' oder 'needs_review' wechselt.

create or replace function public.handle_match_report_ocr_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.ocr_status is distinct from old.ocr_status
     and new.ocr_status in ('completed','needs_review')
     and new.uploaded_by is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (
      new.uploaded_by,
      'match_report_ocr_' || new.ocr_status,
      'Spielbericht erkannt',
      case new.ocr_status
        when 'completed' then 'Dein hochgeladener Spielbericht wurde erkannt und wartet auf deine Prüfung.'
        else 'Dein Spielbericht wurde teilweise erkannt — bitte prüfe die unsicheren Angaben.'
      end,
      'Spielbericht wartet auf Prüfung',
      'match_report_upload', new.id,
      '/mein-bereich/spielberichte/ocr/' || new.id::text || '/pruefen');
  end if;

  if tg_op = 'UPDATE'
     and new.ocr_status is distinct from old.ocr_status
     and new.ocr_status = 'failed'
     and new.uploaded_by is not null then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (
      new.uploaded_by,
      'match_report_ocr_failed',
      'Erkennung fehlgeschlagen',
      'Der Spielbericht konnte nicht vollständig erkannt werden. Du kannst ihn erneut hochladen oder manuell erfassen.',
      'OCR fehlgeschlagen',
      'match_report_upload', new.id,
      '/mein-bereich/spielberichte/ocr/' || new.id::text || '/pruefen');
  end if;

  return new;
end;
$$;

drop trigger if exists on_match_report_ocr_notification on public.match_report_uploads;
create trigger on_match_report_ocr_notification
  after update on public.match_report_uploads
  for each row execute function public.handle_match_report_ocr_notification();
