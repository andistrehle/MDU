-- ============================================================
-- MDU Platform — Migration 0024: Passnummer & Spieler aus Nachmeldung
-- ============================================================
--
-- Im Supabase SQL Editor ausführen (nach 0023).
--
-- Bei der Freigabe einer Nachmeldung erzeugt die Plattform einen zuordenbaren
-- Spieler-Slug und eine VORLÄUFIGE Passnummer (Regel: höchste Passnummer der
-- Teamkollegen + 1, nächste global freie Nummer). Die Ligaleitung kann die
-- Nummer überschreiben, sobald die offizielle dartunion-Nummer vorliegt.
-- Nach der Registrierung lässt sich der Spieler einem Konto zuordnen.
-- ============================================================

alter table public.player_nominations
  add column if not exists player_id            text,
  add column if not exists license_number       text,
  add column if not exists license_provisional  boolean not null default true,
  add column if not exists assigned_profile_id  uuid references public.profiles (id);

-- Schnelle Suche nach freigegebenen, noch nicht zugeordneten Spielern.
create index if not exists player_nominations_approved_idx
  on public.player_nominations (status)
  where status = 'approved';
