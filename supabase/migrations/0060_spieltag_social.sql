-- ============================================================
-- 0060 — Spieltagsbericht: Facebook-Text + Daten für Reel/Story (Betreiber, 27.10.2026)
-- ============================================================
-- Beim Erzeugen schreibt Claude zusätzlich einen kurzen Facebook-Teaser; der
-- fertige Text (Teaser + „vollständiger Bericht“ + Link) und die Zahlen fürs
-- Instagram-Reel und die Story (Ergebnisse, Spieler des Spieltages, höchstes
-- Finish, Tabellenführer) liegen an der Zeile des Berichts. Admin → News holt
-- sie über /api/spieltag-bericht (service_role) — keine Policies.
-- ============================================================

alter table public.spieltag_berichte add column if not exists facebook text;
alter table public.spieltag_berichte add column if not exists social jsonb;
