-- ============================================================
-- 0057 — Protest im Spielbericht: melden und erledigen (Betreiber, 25.10.2026)
-- ============================================================
-- Wird ein Bericht mit Protest eingereicht, bekommt die Ligaleitung (Glocke +
-- E-Mail) und der Gegner-TC (Glocke) Bescheid — einmal je Protest
-- (protest_notified_at). Der Protest bleibt „zu tun“, bis die Ligaleitung ihn
-- als erledigt markiert (protest_handled_*). Geschrieben wird beides nur vom
-- Server (/api/match-reports/protest, service_role).
-- ============================================================

alter table public.match_reports
  add column if not exists protest_notified_at  timestamptz,
  add column if not exists protest_handled_at   timestamptz,
  add column if not exists protest_handled_by   uuid references auth.users (id) on delete set null,
  add column if not exists protest_handled_note text;
