-- ============================================================
-- 0068: Website-Umfrage (Betreiber, 09.11.2026)
-- ============================================================
-- Anonym: keine Konto-, Namens- oder IP-Daten. Je Umfrage und Gerät eine
-- Zeile (Geräte-Kennung = Zufallszahl aus dem Browser, nur gegen doppeltes
-- Abstimmen). Lesen und Schreiben nur über den Server (service_role):
-- RLS an, keine Policy.
-- ============================================================

create table if not exists public.umfrage_antworten (
  id          uuid primary key default gen_random_uuid(),
  umfrage     text not null,
  geraet_id   uuid not null,
  antworten   jsonb not null,
  created_at  timestamptz not null default now(),
  unique (umfrage, geraet_id)
);

alter table public.umfrage_antworten enable row level security;
