// ============================================================
// TC → Team: Glocke + Push (Betreiber, 27.10.2026, /api/team/nachricht)
// ============================================================
// Neuer/geänderter/abgesagter eigener Termin (mit Häkchen „Team
// benachrichtigen“, vorausgewählt), „Offene erinnern“ je Spiel/Termin und
// „Nachricht ans Team“ (Freitext). Der Server schreibt in die Glocken der
// Teammitglieder; jede Glocke geht über Migration 0056 auch als Push raus.
// ============================================================

import { supabase } from './client';

export const TEAM_NACHRICHT_MAX = 200;

export type TeamNachricht =
  | { art: 'termin_neu' | 'termin_geaendert'; terminId: string }
  | { art: 'termine_neu'; anzahl: number }
  | { art: 'termin_abgesagt'; text: string }
  | { art: 'erinnern'; matchKey: string; text: string; pfad: string }
  | { art: 'nachricht'; text: string };

/** Schickt die Nachricht; `empfaenger` = wie viele im Team sie in die Glocke bekommen haben. */
export async function sendeTeamNachricht(teamId: string, n: TeamNachricht): Promise<{ empfaenger: number; error: string | null }> {
  if (!supabase) return { empfaenger: 0, error: 'Supabase ist nicht konfiguriert.' };
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  if (!t) return { empfaenger: 0, error: 'Bitte neu einloggen.' };
  try {
    const r = await fetch('/api/team/nachricht', { method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId, ...n }) });
    const j = await r.json() as { empfaenger?: number; error?: string };
    return r.ok ? { empfaenger: j.empfaenger ?? 0, error: null } : { empfaenger: 0, error: j.error ?? 'Hat nicht geklappt.' };
  } catch { return { empfaenger: 0, error: 'Keine Verbindung – bitte noch einmal versuchen.' }; }
}

/** „An 7 im Team geschickt.“ — ehrlich auch bei 0. */
export const empfaengerText = (n: number, wer = 'im Team') =>
  n === 0 ? `Niemand ${wer} zu benachrichtigen (keiner hat ein Konto bzw. alle haben schon geantwortet).` : `An ${n} ${wer} geschickt.`;
