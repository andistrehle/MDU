-- ============================================================
-- 0036 · Kurzname eines Teams ändern (spaltengenau, sicher)
-- ============================================================
--
-- Die Tabelle public.teams darf per RLS nur die Ligaleitung schreiben
-- (teams_admin_write). Damit ein Team-Kapitän den KURZNAMEN seines eigenen
-- Teams anpassen kann (und die Ligaleitung den jedes Teams), gibt es diese
-- SECURITY-DEFINER-RPC. Sie ändert ausschließlich die Spalte short_name —
-- kein anderer Team-Datensatz wird berührt (spaltengenau statt row-level).
--
-- Recht: is_admin() ODER Kapitän genau dieses Teams (current_team_id()).
-- ============================================================

create or replace function public.set_team_short_name(p_team_id text, p_short_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin() or p_team_id = public.current_team_id()) then
    raise exception 'Kein Recht, den Kurznamen dieses Teams zu ändern.'
      using errcode = '42501';
  end if;

  update public.teams
     set short_name = nullif(btrim(p_short_name), ''),
         updated_at = now()
   where id = p_team_id;
end;
$$;

grant execute on function public.set_team_short_name(text, text) to authenticated;
