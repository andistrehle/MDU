// ============================================================
// Wer bekommt Glocken „an den Kapitän“? (Migration 0062)
// ============================================================
// Kapitän (Rolle team_captain im Team) plus Co-Captain, wenn er das passende
// Recht hat. Fehlt die Tabelle noch, bleibt es bei den Kapitänen. Ligaleitungs-
// Konten mit eigenem Team zählen wie bisher mit (`mitLigaleitung`).
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { TcRecht } from '@/lib/auth/roles';

export async function tcEmpfaenger(teamId: string | null | undefined, recht: TcRecht, mitLigaleitung = true): Promise<string[]> {
  if (!supabaseAdmin || !teamId) return [];
  const rollen = mitLigaleitung ? ['team_captain', 'league_admin', 'super_admin'] : ['team_captain'];
  const [tc, co] = await Promise.all([
    supabaseAdmin.from('profiles').select('id').eq('team_id', teamId).in('role', rollen),
    supabaseAdmin.from('team_co_captains').select('user_id, rechte').eq('team_id', teamId),
  ]);
  const ids = ((tc.data ?? []) as { id: string }[]).map(p => p.id);
  for (const c of (co.error ? [] : (co.data ?? [])) as { user_id: string; rechte: string[] }[]) {
    if (c.rechte?.includes(recht)) ids.push(c.user_id);
  }
  return [...new Set(ids)];
}
