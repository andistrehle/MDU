-- ============================================================
-- MDU Platform — Migration 0011: Benutzerverwaltung für Ligaleitung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0010).
--
-- Ligaleitung (league_admin) darf Benutzer verwalten — ABER:
--   • keine Super-Admin-Konten bearbeiten
--   • niemanden zum 'super_admin' befördern
-- Super Admin bleibt uneingeschränkt über allem.
--
-- Durchsetzung serverseitig per RLS (nicht nur in der UI).
-- ============================================================

-- Helper: ist der aktuelle Benutzer Super Admin?
create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- Update-Policy verschärfen:
--   using       → welche Zeilen darf ich ändern (Ligaleitung: keine Super-Admin-Zeilen)
--   with check  → welcher Zielzustand ist erlaubt (Ligaleitung: Rolle != super_admin)
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (
    public.is_admin()
    and (public.is_super_admin() or role <> 'super_admin')
  )
  with check (
    public.is_admin()
    and (public.is_super_admin() or role <> 'super_admin')
  );
