// ============================================================
// Spielverlegungen — Browser-Seite (Server: lib/server/verlegung.ts)
// ============================================================
// Alles läuft über /api/verlegung (service_role prüft die Regeln). Der
// öffentliche Hinweis „Verlegung angefragt“ holt die Kennungen einmal je
// Seitenaufruf (/api/verlegung/offen, am CDN zwischengespeichert).
// ============================================================

import { supabase } from './client';

export type VerlegungStatus = 'offen' | 'freigabe' | 'bestaetigt' | 'uebernommen' | 'abgelehnt' | 'zurueckgezogen';
export interface Verlegung {
  id: string; match_key: string; home_team_id: string; away_team_id: string;
  old_date: string | null; old_time: string | null; new_date: string; new_time: string | null;
  reason: string | null; requested_team: string; status: VerlegungStatus; needs_admin: boolean;
  note: string | null; created_at: string; decided_at: string | null; applied_at: string | null;
}

async function token(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function ladeVerlegungen(): Promise<{ rows: Verlegung[]; bereit: boolean }> {
  const t = await token();
  if (!t) return { rows: [], bereit: false };
  try {
    const r = await fetch('/api/verlegung', { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' });
    const j = await r.json() as { verlegungen?: Verlegung[]; fehlt?: boolean };
    return { rows: j.verlegungen ?? [], bereit: r.ok && !j.fehlt };
  } catch { return { rows: [], bereit: false }; }
}

async function post<T>(pfad: string, body: unknown): Promise<{ data: T | null; error: string | null }> {
  const t = await token();
  if (!t) return { data: null, error: 'Bitte neu einloggen.' };
  try {
    const r = await fetch(pfad, { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json() as { verlegung?: T; error?: string };
    return r.ok ? { data: j.verlegung ?? null, error: null } : { data: null, error: j.error ?? 'Hat nicht geklappt.' };
  } catch { return { data: null, error: 'Keine Verbindung – bitte noch einmal versuchen.' }; }
}

export const frageVerlegungAn = (e: { key: string; datum: string; uhrzeit: string | null; grund: string | null }) => post<Verlegung>('/api/verlegung', e);
export const verlegungAktion = (id: string, aktion: string, grund?: string | null, alsLigaleitung = false) =>
  post<Verlegung>('/api/verlegung/aktion', { id, aktion, grund, alsLigaleitung });

// Öffentliche Kennungen mit laufender Anfrage — einmal je Seitenaufruf geladen.
let offen: Promise<Set<string>> | null = null;
export function offeneVerlegungen(): Promise<Set<string>> {
  if (!offen) offen = fetch('/api/verlegung/offen').then(r => r.json()).then((j: { keys?: string[] }) => new Set(j.keys ?? [])).catch(() => new Set<string>());
  return offen;
}
