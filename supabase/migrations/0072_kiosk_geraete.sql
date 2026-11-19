-- 0072: Tablet im Lokal (Kiosk) — Geräte je Team (Betreiber, 19.11.2026)
--
-- Ein Tablet trägt am Spieltag das Heimspiel seines Teams live ein, OHNE Konto.
-- Es weist sich mit einem Geräte-Schlüssel aus; hier liegt nur dessen SHA-256.
-- Gekoppelt wird einmalig über einen achtstelligen Code (15 Minuten gültig),
-- den der Kapitän im Team Manager erzeugt — auch davon nur der Hash.
--
-- KEINE Policy: Die Tabelle erreicht nur der Server (service_role,
-- lib/server/kiosk.ts). An den Regeln der Spielberichte (RLS) ändert sich nichts.

create table if not exists public.kiosk_geraete (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null,
  name          text not null,
  token_hash    text unique,
  code_hash     text,
  code_bis      timestamptz,
  erstellt_von  uuid references auth.users (id) on delete set null,
  erstellt_am   timestamptz not null default now(),
  gekoppelt_am  timestamptz,
  last_seen_at  timestamptz,
  gesperrt_am   timestamptz
);
create index if not exists kiosk_geraete_team_idx on public.kiosk_geraete (team_id);
create index if not exists kiosk_geraete_code_idx on public.kiosk_geraete (code_hash) where code_hash is not null;

alter table public.kiosk_geraete enable row level security;
revoke all on public.kiosk_geraete from anon, authenticated;
