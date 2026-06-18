-- ============================================================
-- MDU Platform — Migration 0006: Hinweis bei neuer Registrierung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0005).
--
-- Erzeugt beim Anlegen eines neuen Profils automatisch einen internen
-- Hinweis (admin_notifications) für Super Admin / Ligaleitung. Damit
-- erscheint die neue Registrierung im Dashboard-Panel „Offene Aufgaben".
--
-- Hinweis: Die Badge-ZÄHLER kommen direkt aus profiles.match_status
-- (siehe lib/supabase/admin-counts.ts) — dieser Trigger liefert nur den
-- zusätzlichen erklärenden Hinweis im Panel. Läuft als security definer,
-- damit der Insert trotz RLS funktioniert. Kein service_role nötig.
-- ============================================================

create or replace function public.handle_new_profile_notification()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.admin_notifications (type, title, message, target_roles, related_entity_type, related_entity_id)
  values (
    'user_registered',
    'Neuer Benutzer registriert',
    coalesce(nullif(trim(new.display_name), ''), 'Ein Benutzer') || ' hat sich registriert und wartet auf Prüfung.',
    array['super_admin','league_admin'],
    'profile',
    new.id
  );
  return new;
end;
$$;

drop trigger if exists on_profile_created_notification on public.profiles;
create trigger on_profile_created_notification
  after insert on public.profiles
  for each row execute function public.handle_new_profile_notification();
