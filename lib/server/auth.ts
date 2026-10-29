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
import { hasMinRole, hasRole, TC_RECHTE, type TcRecht, type UserRole } from '@/lib/auth/roles';

export interface ServerUser {
  id: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  /** Co-Captain-Rechte im eigenen Team (Migration 0062). */
  coRechte: TcRecht[];
  /** Laufende Spielbericht-Vertretungen im eigenen Team (Kennungen Heim|Gast). */
  vertretungen: string[];
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

  const teamId = (profile?.team_id as string | null) ?? null;
  // Co-Captain + Vertretungen (Migration 0062). Fehlt etwas → nur die Rechte der Rolle.
  let coRechte: TcRecht[] = [], vertretungen: string[] = [];
  if (teamId) {
    const [co, ve] = await Promise.all([
      client.from('team_co_captains').select('rechte').eq('team_id', teamId).eq('user_id', userData.user.id).maybeSingle(),
      client.from('spielbericht_vertretungen').select('match_key').eq('team_id', teamId).eq('user_id', userData.user.id)
        .is('ended_at', null).gt('gueltig_bis', new Date().toISOString()),
    ]);
    coRechte = ((co.data as { rechte: string[] } | null)?.rechte ?? []).filter((r): r is TcRecht => (TC_RECHTE as readonly string[]).includes(r));
    vertretungen = ((ve.data ?? []) as { match_key: string }[]).map(v => v.match_key);
  }

  return {
    ok: true,
    user: {
      id: userData.user.id,
      email: userData.user.email ?? '',
      role: (profile?.role ?? 'player') as UserRole,
      teamId, coRechte, vertretungen,
    },
  };
}

/**
 * Kapitänsrecht im Team (Server): Ligaleitung, Kapitän des Teams, oder
 * Co-Captain mit diesem Recht (Migration 0062).
 */
export function hatTcRechtServer(user: ServerUser, teamId: string | null | undefined, recht: TcRecht): boolean {
  if (isAdminUser(user)) return true;
  if (!teamId || user.teamId !== teamId) return false;
  return user.role === 'team_captain' || user.coRechte.includes(recht);
}

/**
 * Darf dieser Server-User für das Team Spielberichte hochladen/prüfen?
 * Mit `key` (Heim|Gast) zählt auch die Vertretung für genau diese Begegnung.
 */
export function canUploadForTeam(user: ServerUser, teamId: string, key?: string): boolean {
  if (hatTcRechtServer(user, teamId, 'spielberichte')) return true;
  return !!key && user.teamId === teamId && user.vertretungen.includes(key);
}

/** Darf das Startgeld/den Zahlungsstand des Teams sehen? (Kapitän des Teams oder Ligaleitung) */
export function canSeeTeamFee(user: ServerUser, teamId: string): boolean {
  if (hasMinRole(toProfile(user), 'league_admin')) return true;
  return hasRole(toProfile(user), 'team_captain') && user.teamId === teamId;
}

/** Ligaleitung/Super-Admin? */
export function isAdminUser(user: ServerUser): boolean {
  return hasMinRole(toProfile(user), 'league_admin');
}

/** Minimaler UserProfile-Shim für die roles-Helper. */
function toProfile(user: ServerUser) {
  return { id: user.id, email: user.email, displayName: '', role: user.role, teamId: user.teamId ?? undefined, createdAt: '', updatedAt: '' };
}
