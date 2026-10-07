-- ============================================================
-- 0041 — Startgeld: bezahlten Betrag mitspeichern (Restbetrag)
-- ============================================================
--
-- Bisher hielt season_team_payments nur „bezahlt ja/nein". Kam nach der
-- Zahlung eine Nachmeldung dazu, stieg der fällige Betrag, der Status blieb
-- aber „bezahlt". Jetzt merkt sich die Zeile, wie viel beim „bezahlt"-Setzen
-- fällig war; die App zeigt die Differenz als Restbetrag (lib/startgeld.ts).
--
-- Bestehende „bezahlt"-Zeilen werden mit dem Betrag befüllt, der am
-- 07.10.2026 fällig war (keines dieser Teams hatte zu dem Zeitpunkt
-- Nachmeldungen — der Wert ist also genau das, was bezahlt wurde).
-- ============================================================

alter table public.season_team_payments
  add column if not exists paid_amount integer;

update public.season_team_payments set paid_amount = 200 where season_id = 'season-2027' and team_id = 'game-over' and paid and paid_amount is null;  -- Game Over
update public.season_team_payments set paid_amount = 220 where season_id = 'season-2027' and team_id = 'team-wakan-tanka-fff298' and paid and paid_amount is null;  -- Wakan Tanka
update public.season_team_payments set paid_amount = 280 where season_id = 'season-2027' and team_id = 'ohne-jackie' and paid and paid_amount is null;  -- Ohne Jackie
update public.season_team_payments set paid_amount = 200 where season_id = 'season-2027' and team_id = 'funny-darters' and paid and paid_amount is null;  -- Funny Darters Munich
update public.season_team_payments set paid_amount = 160 where season_id = 'season-2027' and team_id = 'team-dart-s-vaders-48de8a' and paid and paid_amount is null;  -- Dart's Vaders
