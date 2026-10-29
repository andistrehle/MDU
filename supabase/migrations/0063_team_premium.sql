-- ============================================================
-- 0063 — Team Manager als Premium: Freischaltung + Zahlungen (Betreiber, 29.10.2026)
-- ============================================================
-- Ersetzt den nie ausgeführten Entwurf 0052 (gleiche Tabellen, dazu PayPal).
--
-- Je Team eine Zeile in team_premium: Test (14 Tage, einmal), Saisonpass,
-- Monat oder dauerhaft; „gültig bis“. Freigeschaltet ist ein Team, solange es
-- in availability_enabled_teams steht (Migration 0043) — das setzt und nimmt
-- nur der Server (lib/server/premium.ts), der tägliche Cron nimmt Abgelaufene
-- wieder heraus. Zahlungswege:
--   • PayPal / Kreditkarte über PayPal: automatisch (Bestellung bzw. Abo,
--     Rückmeldung per Webhook) → sofort frei.
--   • Überweisung: der TC meldet „überwiesen“ (status 'angefragt'), der
--     Betreiber schaltet nach Zahlungseingang unter Admin → Premium frei.
-- team_premium_payments ist der Nachweis je Zahlung; external_id (PayPal-
-- Zahlungskennung) ist eindeutig, damit eine doppelt gemeldete Zahlung nicht
-- doppelt verlängert.
-- Lesen: eigenes Team + Ligaleitung. Schreiben: nur service_role.
-- ============================================================

create table if not exists public.team_premium (
  team_id          text primary key,
  modell           text check (modell is null or modell in ('test', 'saison', 'monat', 'dauerhaft')),
  status           text not null default 'angefragt' check (status in ('angefragt', 'test', 'aktiv', 'abgelaufen', 'beendet')),
  valid_until      date,
  trial_used       boolean not null default false,
  requested_model  text check (requested_model is null or requested_model in ('saison', 'monat')),
  requested_by     uuid references auth.users (id) on delete set null,
  requested_at     timestamptz,
  payment_method   text check (payment_method is null or payment_method in ('paypal', 'ueberweisung', 'bar', 'kostenlos')),
  note             text check (note is null or char_length(note) <= 300),
  activated_by     uuid references auth.users (id) on delete set null,
  activated_at     timestamptz,
  paypal_subscription_id text,
  abo_status       text,                       -- PayPal-Abo: ACTIVE / CANCELLED / SUSPENDED / EXPIRED
  erinnert_am      date,                       -- letzte Ablauf-Erinnerung (einmal je Ablauf)
  updated_at       timestamptz not null default now()
);
create unique index if not exists team_premium_paypal_abo_uq on public.team_premium (paypal_subscription_id) where paypal_subscription_id is not null;

create table if not exists public.team_premium_payments (
  id           uuid primary key default gen_random_uuid(),
  team_id      text not null,
  modell       text not null check (modell in ('saison', 'monat')),
  amount_cents integer not null check (amount_cents > 0),
  method       text not null check (method in ('paypal', 'ueberweisung', 'bar')),
  valid_from   date not null,
  valid_until  date not null,
  external_id  text unique,                    -- PayPal-Zahlungskennung (Capture/Sale)
  booked_by    uuid references auth.users (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists team_premium_payments_team_idx on public.team_premium_payments (team_id, created_at desc);

alter table public.team_premium enable row level security;
alter table public.team_premium_payments enable row level security;

drop policy if exists "team_premium_select" on public.team_premium;
create policy "team_premium_select" on public.team_premium for select
  using (public.in_team(team_id) or public.is_admin());
drop policy if exists "team_premium_payments_select" on public.team_premium_payments;
create policy "team_premium_payments_select" on public.team_premium_payments for select
  using (public.is_admin());
-- Keine Schreib-Policies: nur service_role (Server-Routen) schreibt.

-- Bestehende Freischaltungen (z. B. Freibad Bazis) bleiben dauerhaft.
insert into public.team_premium (team_id, modell, status, payment_method, note, activated_at)
select team_id, 'dauerhaft', 'aktiv', 'kostenlos', 'Bestand vor dem Premium-Start', now()
from public.availability_enabled_teams
on conflict (team_id) do nothing;
