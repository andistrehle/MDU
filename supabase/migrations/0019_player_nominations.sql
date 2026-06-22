-- ============================================================
-- MDU Platform — Migration 0019: Spieler-Nachmeldungen
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0018).
--
-- Teamkapitäne melden Spieler nach → Prüfung durch Ligaleitung/Super Admin
-- (bestätigen/ablehnen, Ablehnung mit Begründung). Benachrichtigungen an
-- Admins (neue Nachmeldung) und an den Kapitän (Ergebnis).
-- ============================================================

create table if not exists public.player_nominations (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null,
  team_name     text not null,
  first_name    text not null,
  last_name     text not null,
  submitted_by  uuid not null default auth.uid() references auth.users (id),
  status        text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note   text,
  reviewed_by   uuid references auth.users (id),
  reviewed_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists player_nominations_status_idx on public.player_nominations (status, created_at desc);

drop trigger if exists player_nominations_updated_at on public.player_nominations;
create trigger player_nominations_updated_at
  before update on public.player_nominations
  for each row execute function public.handle_updated_at();

alter table public.player_nominations enable row level security;

drop policy if exists "pn_select" on public.player_nominations;
create policy "pn_select" on public.player_nominations for select
  using (submitted_by = auth.uid() or public.is_admin());

drop policy if exists "pn_insert" on public.player_nominations;
create policy "pn_insert" on public.player_nominations for insert
  with check (submitted_by = auth.uid());

drop policy if exists "pn_update_admin" on public.player_nominations;
create policy "pn_update_admin" on public.player_nominations for update
  using (public.is_admin()) with check (public.is_admin());

-- ── Benachrichtigungen ───────────────────────────────────────
create or replace function public.handle_nomination_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  who text := coalesce(nullif(trim(new.first_name || ' ' || new.last_name), ''), 'Ein Spieler');
begin
  -- Neue Nachmeldung → Ligaleitung / Super Admin
  if tg_op = 'INSERT' then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    select p.id, 'player_nomination', 'Neue Spieler-Nachmeldung',
      who || ' wurde für ' || coalesce(new.team_name, 'ein Team') || ' nachgemeldet und wartet auf Prüfung.',
      'Nachmeldung: ' || who || ' (' || coalesce(new.team_name, '') || ')',
      'player_nomination', new.id, '/admin/nachmeldungen'
    from public.profiles p where p.role in ('league_admin','super_admin');
  end if;

  -- Ergebnis → einreichender Kapitän
  if tg_op = 'UPDATE' and new.status in ('approved','rejected') and old.status is distinct from new.status then
    insert into public.notifications
      (recipient_user_id, type, title, message, short_text, related_entity_type, related_entity_id, action_url)
    values (new.submitted_by, 'player_nomination_' || new.status,
      case new.status when 'approved' then 'Nachmeldung bestätigt' else 'Nachmeldung abgelehnt' end,
      case new.status
        when 'approved' then 'Die Nachmeldung von ' || who || ' wurde bestätigt.'
        else 'Die Nachmeldung von ' || who || ' wurde abgelehnt.'
          || coalesce(chr(10) || 'Begründung: ' || nullif(trim(new.review_note), ''), '')
      end,
      case new.status when 'approved' then 'Nachmeldung bestätigt: ' || who
                      else 'Nachmeldung abgelehnt: ' || who end,
      'player_nomination', new.id, '/mein-team/kader');
  end if;

  return new;
end;
$$;

drop trigger if exists on_nomination_notification on public.player_nominations;
create trigger on_nomination_notification
  after insert or update on public.player_nominations
  for each row execute function public.handle_nomination_notification();
