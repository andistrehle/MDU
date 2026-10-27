-- ============================================================
-- 0059 — Push-Geheimnis vom Server aus setzen (Betreiber, 27.10.2026)
-- ============================================================
-- Das Geheimnis aus 0056 (private.push_config) musste von Hand nach Vercel
-- kopiert werden (PUSH_WEBHOOK_SECRET) — das ging zweimal schief, die Datenbank
-- bekam von /api/push/senden nur 401 zurück, kein Push kam an.
-- Jetzt setzt der Server (service_role) einen neuen Wert über diese Funktion
-- und trägt denselben Wert per Vercel-API ein; er taucht nirgends sichtbar auf.
-- Ausführen darf sie NUR service_role (nicht anon/angemeldete Nutzer).
-- ============================================================

create or replace function public.push_geheimnis_setzen(neu text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if neu is null or neu !~ '^[0-9a-f]{48}$' then
    raise exception 'Geheimnis muss aus 48 Hex-Zeichen bestehen';
  end if;
  update private.push_config set secret = neu where id = 1;
  if not found then raise exception 'private.push_config fehlt (Migration 0056)'; end if;
end;
$$;

revoke all on function public.push_geheimnis_setzen(text) from public, anon, authenticated;
grant execute on function public.push_geheimnis_setzen(text) to service_role;

notify pgrst, 'reload schema';
