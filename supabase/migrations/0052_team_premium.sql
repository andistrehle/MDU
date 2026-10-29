-- ============================================================
-- 0052 — Team Manager als Premium (manuell, später Stripe)
-- ============================================================
--
-- NICHT AUSFÜHREN — ersetzt durch 0063_team_premium.sql (gleiche Tabellen + PayPal).
-- Ursprünglich vorbereitet am 17.10.2026.
-- Je Team eine Zeile: Test (14 Tage, einmal), Saisonpass oder Monat,
-- „gültig bis“. Premium gilt, solange valid_until in der Zukunft liegt.
-- Anfragen der TCs (Upgrade-Seite) landen als status 'angefragt'; der
-- Betreiber schaltet nach Zahlungseingang frei. Stripe schreibt später
-- dieselbe Tabelle (stripe_* Spalten).
-- Lesen: das eigene Team + Ligaleitung. Schreiben: nur Server-Routen
-- (service_role) — keine Schreib-Policy.
-- ============================================================

create table if not exists public.team_premium (
  team_id          text primary key,
  modell           text check (modell is null or modell in ('test', 'saison', 'monat')),
  status           text not null default 'angefragt' check (status in ('angefragt', 'test', 'aktiv', 'abgelaufen', 'beendet')),
  valid_until      date,
  trial_used       boolean not null default false,
  requested_model  text check (requested_model is null or requested_model in ('saison', 'monat')),
  requested_by     uuid references auth.users (id) on delete set null,
  requested_at     timestamptz,
  payment_method   text check (payment_method is null or payment_method in ('paypal', 'ueberweisung', 'bar', 'stripe')),
  note             text check (note is null or char_length(note) <= 300),
  activated_by     uuid references auth.users (id) on delete set null,
  activated_at     timestamptz,
  stripe_customer_id     text,
  stripe_subscription_id text,
  updated_at       timestamptz not null default now()
);

-- Verlauf der Zahlungen/Freischaltungen (Nachweis, wer wann was bezahlt hat).
create table if not exists public.team_premium_payments (
  id          uuid primary key default gen_random_uuid(),
  team_id     text not null,
  modell      text not null check (modell in ('saison', 'monat')),
  amount_cents integer not null check (amount_cents > 0),
  method      text not null check (method in ('paypal', 'ueberweisung', 'bar', 'stripe')),
  valid_from  date not null,
  valid_until date not null,
  booked_by   uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
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
