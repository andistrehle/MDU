// ============================================================
// Server-Auth für Route Handler (Bearer-Token → Profil)
// ============================================================
//
// Verlangt ein gültiges Supabase-Access-Token (Authorization: Bearer …) und
// lädt Rolle + Team aus der profiles-Tabelle (RLS: eigenes Profil lesbar).
// Server-only; Rechte werden in den Routen über lib/auth/roles geprüft.
// ============================================================

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { hasMinRole, hasRole, type UserRole } from '@/lib/auth/roles';

export interface ServerUser {
  id: string;
  email: string;
  role: UserRole;
  teamId: string | null;
}

export type AuthResult =
  | { ok: true; user: ServerUser }
  | { ok: false; status: number; message: string };

export async function authenticateRequest(request: Request): Promise<AuthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return { ok: false, status: 503, message: 'Supabase ist nicht konfiguriert.' };

  const header = request.headers.get('authorization') ?? '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return { ok: false, status: 401, message: 'Nicht authentifiziert.' };

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error } = await client.auth.getUser(token);
  if (error || !userData.user) return { ok: false, status: 401, message: 'Ungültige Sitzung.' };

  const { data: profile } = await client
    .from('profiles')
    .select('role, team_id')
    .eq('id', userData.user.id)
    .maybeSingle();

  return {
    ok: true,
    user: {
      id: userData.user.id,
      email: userData.user.email ?? '',
      role: (profile?.role ?? 'player') as UserRole,
      teamId: (profile?.team_id as string | null) ?? null,
    },
  };
}

/** Darf dieser Server-User für das Team Spielberichte hochladen/prüfen? */
export function canUploadForTeam(user: ServerUser, teamId: string): boolean {
  if (hasMinRole(toProfile(user), 'league_admin')) return true;
  return hasRole(toProfile(user), 'team_captain') && user.teamId === teamId;
}

/** Minimaler UserProfile-Shim für die roles-Helper. */
function toProfile(user: ServerUser) {
  return { id: user.id, email: user.email, displayName: '', role: user.role, teamId: user.teamId ?? undefined, createdAt: '', updatedAt: '' };
}
