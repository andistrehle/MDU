// Offene Zu-/Absagen für die Glocke — bewusst eigene Datei OHNE den Spielplan
// (lib/data/saison-2027), damit er nicht ins Browser-Paket jeder Seite wandert.
// Gerechnet wird auf dem Server: app/api/zusagen/offen/route.ts.

import { supabase } from './client';

export interface OffeneZusage { key: string; text: string; dringend: boolean }

/** Offene Zu-/Absagen im Erinnerungsfenster (/api/zusagen/offen); leer ohne Team/Konto. */
export async function ladeOffeneZusagen(): Promise<OffeneZusage[]> {
  if (!supabase) return [];
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return [];
  try {
    const res = await fetch('/api/zusagen/offen', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!res.ok) return [];
    return ((await res.json()) as { offen?: OffeneZusage[] }).offen ?? [];
  } catch { return []; }
}
