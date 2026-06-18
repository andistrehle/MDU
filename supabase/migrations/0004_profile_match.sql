-- ============================================================
-- MDU Platform — Migration 0004: Registrierung + Spieler-Erkennung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0003).
--
-- Erweitert profiles um Vorname/Nachname, Registrierungs-Wunsch und
-- automatische Match-Vorschläge. WICHTIG: matched_* sind nur Vorschläge —
-- die finale Verknüpfung (player_id/team_id) und Rolle setzt der Admin.
-- ============================================================

alter table public.profiles add column if not exists first_name          text;
alter table public.profiles add column if not exists last_name           text;
alter table public.profiles add column if not exists registration_intent text
  check (registration_intent in ('player','team_captain'));
alter table public.profiles add column if not exists matched_player_id   text;
alter table public.profiles add column if not exists matched_team_id     text;
alter table public.profiles add column if not exists match_confidence    text
  check (match_confidence in ('exact','likely','ambiguous','none'));
alter table public.profiles add column if not exists match_status        text default 'pending'
  check (match_status in ('pending','confirmed','rejected','manual'));


-- ── handle_new_user erweitern ────────────────────────────────
-- Übernimmt die bei signUp mitgegebenen Metadaten in profiles.
-- role bleibt IMMER 'player' (keine Selbst-Eskalation über Registrierung).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (
    id, email, display_name, role,
    first_name, last_name, registration_intent,
    matched_player_id, matched_team_id, match_confidence, match_status
  )
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(meta ->> 'display_name'), ''), split_part(new.email, '@', 1)),
    'player',
    nullif(trim(meta ->> 'first_name'), ''),
    nullif(trim(meta ->> 'last_name'), ''),
    nullif(meta ->> 'registration_intent', ''),
    nullif(meta ->> 'matched_player_id', ''),
    nullif(meta ->> 'matched_team_id', ''),
    nullif(meta ->> 'match_confidence', ''),
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Hinweis: Die RLS-Policy "profiles_update_own" verhindert weiterhin, dass
-- Nutzer ihre Rolle/Verknüpfungen selbst ändern. matched_* sind reine
-- Vorschlagsfelder; nur Admins (is_admin()) setzen player_id/team_id/role.
