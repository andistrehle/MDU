-- 0069: Live-Ticker — Start-Push höchstens einmal je Spieltag (Betreiber, 11.11.2026)
-- Nur der Server (service_role) schreibt; der Primärschlüssel verhindert einen zweiten Push.
create table if not exists public.live_ticker_push (
  datum      date primary key,
  created_at timestamptz not null default now()
);
alter table public.live_ticker_push enable row level security;
