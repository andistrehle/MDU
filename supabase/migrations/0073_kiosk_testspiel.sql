-- 0073: Tablet im Lokal — Testspiel (Betreiber, 19.11.2026)
-- Der Kapitän schaltet ein gekoppeltes Gerät für ein paar Stunden in den
-- Testmodus (lib/server/kiosk.ts). `test_bis` = Ende, `test_fertig` = im Test
-- „abgesendet“ (ohne den Testbericht wirklich einzureichen).
alter table public.kiosk_geraete add column if not exists test_bis    timestamptz;
alter table public.kiosk_geraete add column if not exists test_fertig boolean not null default false;
