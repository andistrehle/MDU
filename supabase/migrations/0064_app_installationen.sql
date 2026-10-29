-- ============================================================
-- 0064 — Web-App-Installationen zählen (Betreiber, 29.10.2026)
-- ============================================================
-- Öffnet jemand die Seite als installierte Web-App (Startbildschirm), meldet
-- der Browser höchstens einmal am Tag: zufällige Geräte-Kennung (nur im
-- Gerät gespeichert, nicht mit dem Konto verknüpft), Plattform, Zeitpunkt.
-- Keine Konto-, Namens- oder IP-Daten. Lesen/Schreiben nur der Server
-- (service_role) — RLS an, keine Policy.
-- ============================================================

create table if not exists public.app_installationen (
  geraet_id   uuid primary key,
  plattform   text not null check (plattform in ('ios', 'android', 'desktop', 'sonst')),
  erst_am     timestamptz not null default now(),
  zuletzt_am  timestamptz not null default now(),
  tage        integer not null default 1
);
create index if not exists app_installationen_zuletzt_idx on public.app_installationen (zuletzt_am desc);

alter table public.app_installationen enable row level security;
