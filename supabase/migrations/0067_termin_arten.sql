-- ============================================================
-- 0067: Eigene Termine — Arten Training und Event (Betreiber, 30.10.2026)
-- ============================================================
-- Für die Team-Statistik (Filter Training / Event / MDU-Spiel / andere Spiele)
-- kennt team_events jetzt: spiel · training · event · sonstiges.
-- Alles außer „spiel“ braucht einen Titel. Bestehende „Sonstiges“ mit
-- „Training“ im Titel werden einmalig zu Training.
-- ============================================================

do $$
declare c record;
begin
  for c in select conname from pg_constraint
           where conrelid = 'public.team_events'::regclass and contype = 'c'
             and pg_get_constraintdef(oid) like '%sonstiges%'
  loop
    execute format('alter table public.team_events drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.team_events add constraint team_events_kind_check
  check (kind in ('spiel', 'training', 'event', 'sonstiges'));
alter table public.team_events add constraint team_events_art_felder_check
  check ((kind = 'spiel' and opponent is not null) or (kind <> 'spiel' and title is not null));

update public.team_events set kind = 'training' where kind = 'sonstiges' and title ilike '%training%';
