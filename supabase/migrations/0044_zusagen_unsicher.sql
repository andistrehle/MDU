-- ============================================================
-- 0044 — Zu-/Absagen: „unsicher“ + Pflicht-Begründung
-- ============================================================
--
-- Vom Betreiber festgelegt (12.10.2026): Bei „Absage“ und „unsicher“ muss
-- eine Begründung angegeben werden (mindestens 5 Zeichen) — auch wenn der
-- Kapitän den Status für einen Spieler setzt. Zusage weiter ohne Pflicht.
-- Der Check gilt für alle Zeilen: Falls beim Testen schon Absagen ohne
-- ausreichende Begründung gespeichert wurden, bekommen sie vorher
-- „(keine Angabe)“ — sonst ließe sich die Regel nicht anlegen.
-- ============================================================

update public.match_availability
   set note = '(keine Angabe)'
 where status <> 'yes' and char_length(btrim(coalesce(note, ''))) < 5;

alter table public.match_availability drop constraint if exists match_availability_status_check;
alter table public.match_availability
  add constraint match_availability_status_check check (status in ('yes', 'no', 'maybe'));

alter table public.match_availability drop constraint if exists match_availability_grund_check;
alter table public.match_availability
  add constraint match_availability_grund_check
  check (status = 'yes' or char_length(btrim(coalesce(note, ''))) >= 5);

-- Glocke für Kapitäne: auch „unsicher“ melden.
create or replace function public.notify_availability_change()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  actor_role text;
  msg text;
begin
  if tg_op = 'UPDATE' and new.status = old.status and coalesce(new.note, '') = coalesce(old.note, '') then
    return new;
  end if;
  select role into actor_role from public.profiles where id = new.updated_by;
  if actor_role in ('team_captain', 'league_admin', 'super_admin') then
    return new;
  end if;
  msg := new.player_name
         || (case new.status when 'yes' then ' hat zugesagt' when 'no' then ' hat abgesagt' else ' ist unsicher' end)
         || coalesce(' · ' || new.label, '')
         || coalesce(' – „' || nullif(trim(new.note), '') || '“', '');
  insert into public.notifications
    (recipient_user_id, type, title, message, short_text, related_entity_type, action_url)
  select p.id, 'availability_change',
         case new.status when 'yes' then 'Zusage' when 'no' then 'Absage' else 'Unsicher' end,
         msg, msg, 'match_availability', '/mein-team/zusagen'
  from public.profiles p
  where p.team_id = new.team_id and p.role = 'team_captain' and p.id is distinct from new.updated_by;
  return new;
end;
$$;
