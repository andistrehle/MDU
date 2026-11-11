// ============================================================
// Co-Captain eines Teams für die öffentliche Teamseite (Betreiber, 11.11.2026)
// ============================================================
// Nur Name und Spieler-Kennung — die Rechte bleiben intern (Betreiber: „nur die
// Markierung“). service_role, weil `team_co_captains` per RLS nur fürs Team lesbar ist.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function ladeCoCaptain(teamId: string): Promise<{ playerId: string | null; name: string } | null> {
  const db = supabaseAdmin;
  if (!db) return null;
  const { data: co } = await db.from('team_co_captains').select('user_id').eq('team_id', teamId).maybeSingle();
  if (!co) return null;
  const { data: p } = await db.from('profiles').select('player_id, first_name, last_name, display_name').eq('id', (co as { user_id: string }).user_id).maybeSingle();
  if (!p) return null;
  const r = p as { player_id: string | null; first_name: string | null; last_name: string | null; display_name: string | null };
  const name = `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || (r.display_name ?? '').trim();
  return name ? { playerId: r.player_id, name } : null;
}
