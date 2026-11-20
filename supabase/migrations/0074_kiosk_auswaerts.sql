-- 0074: Tablet im Lokal — Auswärtsspiele für die Ligaleitung (Betreiber, 20.11.2026)
-- Gibt die Ligaleitung ein gekoppeltes Gerät dafür frei, zeigt es am Spieltag auch das
-- AUSWÄRTSspiel seines Teams (ein Heimspiel geht vor). `auswaerts_von` = wer freigegeben
-- hat; ist das Konto nicht mehr Ligaleitung, erlischt die Freigabe (lib/server/kiosk.ts).
alter table public.kiosk_geraete add column if not exists auswaerts_von uuid references auth.users (id) on delete set null;
