// ============================================================
// fetch an die eigenen API-Routen MIT Anmeldung (Bearer-Token)
// ============================================================
//
// getSession() liefert den GESPEICHERTEN Token, ohne ihn beim Server zu
// prüfen. Ist er dort nicht mehr gültig (Handy lange im Hintergrund, falsche
// Geräteuhr, Sitzung woanders erneuert), lehnt die Route mit 401 „Ungültige
// Sitzung.“ ab — so am 16.10.2026 beim Speichern unter Admin → Benutzer.
// Deshalb: bei 401 die Sitzung einmal erneuern (refreshSession) und genau
// einmal wiederholen. Klappt auch das nicht, ist die Anmeldung wirklich weg.
// ============================================================

import { supabase } from '@/lib/supabase/client';

export const ANMELDUNG_ABGELAUFEN = 'Deine Anmeldung ist abgelaufen. Bitte lade die Seite neu oder melde dich noch einmal an.';

export async function mitAnmeldung(url: string, init: RequestInit = {}): Promise<Response> {
  const mit = (token: string | undefined) => fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string> | undefined), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!supabase) return mit(undefined);
  const { data } = await supabase.auth.getSession();
  const res = await mit(data.session?.access_token);
  if (res.status !== 401) return res;
  const { data: neu, error } = await supabase.auth.refreshSession();
  const token = neu.session?.access_token;
  if (error || !token || token === data.session?.access_token) return res;
  return mit(token);
}
