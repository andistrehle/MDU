-- ============================================================
-- 0058 — Spieltagsbericht als News (Betreiber, 25.10.2026)
-- ============================================================
-- Sonntagabend erzeugt der Cron /api/cron/spieltag-bericht je Spielwochenende
-- einen News-Entwurf (Claude formuliert aus den gerechneten Zahlen). Die
-- Ligaleitung prüft und veröffentlicht unter Admin → News; erst dann geht der
-- Push an alle Geräte raus.
--
--   spieltag_berichte — je Spielwochenende (Freitag des Plan-Wochenendes) eine
--     Zeile: welcher News-Beitrag, welche Begegnungen er enthält (damit später
--     eingereichte Berichte im nächsten Beitrag als „nachgereicht“ auftauchen
--     und nichts doppelt kommt), wann der Push rausging (nur einmal).
--   Geschrieben und gelesen NUR vom Server (service_role) — keine Policies.
-- ============================================================

create table if not exists public.spieltag_berichte (
  wochenende   date primary key,
  news_id      text not null references public.news (id) on delete cascade,
  keys         text[] not null default '{}',
  quelle       text not null default 'claude' check (quelle in ('claude', 'vorlage')),
  erstellt_at  timestamptz not null default now(),
  push_at      timestamptz,
  push_geraete integer
);
alter table public.spieltag_berichte enable row level security;
