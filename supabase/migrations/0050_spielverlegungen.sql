-- ============================================================
-- 0050 — Spielverlegungen durch die Teamcaptains (Saison 2026/27)
-- ============================================================
--
-- Vom Betreiber festgelegt (16.10.2026):
--   • Jeder TC (beider Teams) kann für ein Spiel einen neuen Termin vorschlagen.
--   • Der TC des Gegners bestätigt oder lehnt ab.
--   • Die Ligaleitung wird informiert; FREIGEBEN muss sie nur, wenn der neue
--     Termin vor dem Saisonstart oder nach dem letzten Spielwochenende liegt.
--   • Bis zur Bestätigung bleibt öffentlich der alte Termin stehen, mit dem
--     Hinweis „Verlegung angefragt“.
--   • Für alle TCs, nicht nur Team-Manager-Teams.
--
-- Die Termine selbst stehen im Code (lib/data/termine-2027.ts). Eine
-- übernommene Verlegung schreibt die Seite als Commit nach
-- lib/data/verlegungen-2027.json (wie die MDC ihre Ergebnisse) — damit sind
-- Spielplan, Teamseiten, Kalender-Abo und Spielbericht nach dem Neubau
-- einheitlich. Diese Tabelle hält nur die ANFRAGEN und ihren Stand.
--
-- Geschrieben wird ausschließlich über die Server-Routen (/api/verlegung …,
-- service_role), die alle Regeln prüfen. Lesen: beide Teams + Ligaleitung.
-- Bestehendes bleibt unverändert; nichts wird gelöscht.
-- ============================================================

create table if not exists public.match_reschedules (
  id              uuid primary key default gen_random_uuid(),
  season_id       text not null,
  match_key       text not null,                      -- Heim|Gast (begegnungKey)
  home_team_id    text not null,
  away_team_id    text not null,
  old_date        date,                                -- bisheriger Termin (null = nur Wochenende)
  old_time        text,
  new_date        date not null,
  new_time        text check (new_time is null or new_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  reason          text check (reason is null or char_length(reason) <= 200),
  requested_team  text not null,                       -- Team des Antragstellers (Heim ODER Gast)
  requested_by    uuid references auth.users (id) on delete set null,
  status          text not null default 'offen'
                  check (status in ('offen', 'freigabe', 'bestaetigt', 'uebernommen', 'abgelehnt', 'zurueckgezogen')),
  needs_admin     boolean not null default false,      -- außerhalb der Saison → Ligaleitung gibt frei
  decided_by      uuid references auth.users (id) on delete set null,   -- Gegner-TC
  decided_at      timestamptz,
  admin_by        uuid references auth.users (id) on delete set null,
  admin_at        timestamptz,
  applied_at      timestamptz,                         -- in verlegungen-2027.json übernommen
  applied_commit  text,
  note            text,                                -- Grund einer Ablehnung / Hinweis
  created_at      timestamptz not null default now()
);

create index if not exists match_reschedules_key_idx on public.match_reschedules (season_id, match_key, created_at desc);
-- Je Spiel höchstens EINE laufende Anfrage.
create unique index if not exists match_reschedules_eine_offene
  on public.match_reschedules (season_id, match_key) where status in ('offen', 'freigabe');

alter table public.match_reschedules enable row level security;

drop policy if exists "match_reschedules_select" on public.match_reschedules;
create policy "match_reschedules_select" on public.match_reschedules for select
  using (public.in_team(home_team_id) or public.in_team(away_team_id) or public.is_admin());
-- Keine Schreib-Policy: nur die Server-Routen (service_role) schreiben.
