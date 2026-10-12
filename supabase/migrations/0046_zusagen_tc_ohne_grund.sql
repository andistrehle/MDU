-- ============================================================
-- 0046 — Zu-/Absagen: Teamcaptain setzt für andere ohne Begründung
-- ============================================================
--
-- Vom Betreiber festgelegt (13.10.2026): Setzt der TC (oder die Ligaleitung)
-- den Status für einen ANDEREN Spieler, ist die Begründung freiwillig.
-- Wer für sich selbst ab- oder unsicher meldet, muss weiter mindestens
-- 5 Zeichen angeben (wie 0044). Die Regel braucht den Absender
-- (auth.uid()), das kann ein CHECK nicht — deshalb ein Trigger.
-- ============================================================

alter table public.match_availability drop constraint if exists match_availability_grund_check;

create or replace function public.check_availability_grund()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  eigener_spieler text;
begin
  if new.status = 'yes' or char_length(btrim(coalesce(new.note, ''))) >= 5 then
    return new;
  end if;
  -- Systemaufrufe (service_role, kein Login) nicht blockieren
  if auth.uid() is null then
    return new;
  end if;
  select player_id into eigener_spieler from public.profiles where id = auth.uid();
  if (public.is_captain_of(new.team_id) or public.is_admin())
     and new.player_id is distinct from eigener_spieler then
    return new;
  end if;
  raise exception 'Bitte gib eine Begründung an (mindestens 5 Zeichen).' using errcode = '23514';
end;
$$;

drop trigger if exists match_availability_grund on public.match_availability;
create trigger match_availability_grund
  before insert or update on public.match_availability
  for each row execute function public.check_availability_grund();
