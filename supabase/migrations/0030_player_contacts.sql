-- ============================================================
-- MDU Platform — Migration 0030: Telefonnummern (zugriffsgeschützt)
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0029).
--
-- Telefonnummern sind sensibel und dürfen NICHT öffentlich lesbar sein
-- (player_profiles ist public-read → daher EIGENE Tabelle mit enger RLS).
-- Sichtbarkeit für andere (eingeloggte Teamkapitäne) läuft ausschließlich
-- über eine server-seitige Route mit service_role — niemals per Client-Select.
--
-- Pro Spieler-Slug: Telefonnummer + Veröffentlichungs-Einwilligung.
-- ============================================================

create table if not exists public.player_contacts (
  player_id    text primary key,                 -- Slug aus lib/data/players.ts
  phone        text,
  phone_public boolean not null default false,   -- vom Nutzer freigegeben?
  updated_by   uuid references auth.users (id),
  updated_at   timestamptz not null default now()
);

comment on table public.player_contacts is
  'Telefonnummer je Spieler + Freigabe. NICHT public-read — nur Eigentümer/Admin direkt; '
  'Sichtbarkeit für eingeloggte Kapitäne nur via server-seitige Route (service_role).';

drop trigger if exists player_contacts_updated_at on public.player_contacts;
create trigger player_contacts_updated_at
  before update on public.player_contacts
  for each row execute function public.handle_updated_at();

alter table public.player_contacts enable row level security;

-- Lesen: NUR der/die Eigentümer:in (verknüpfter Spieler) bzw. Admin.
drop policy if exists "player_contacts_read_own" on public.player_contacts;
create policy "player_contacts_read_own"
  on public.player_contacts for select
  using (player_id = public.current_player_id() or public.is_admin());

drop policy if exists "player_contacts_write_own" on public.player_contacts;
create policy "player_contacts_write_own"
  on public.player_contacts for insert
  with check (player_id = public.current_player_id() or public.is_admin());

drop policy if exists "player_contacts_update_own" on public.player_contacts;
create policy "player_contacts_update_own"
  on public.player_contacts for update
  using (player_id = public.current_player_id() or public.is_admin())
  with check (player_id = public.current_player_id() or public.is_admin());
