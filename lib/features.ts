// ============================================================
// Freischaltungen für Funktionen in Erprobung
// ============================================================
//
// Zu- und Absagen je Spieltag (/mein-team/zusagen): vom Betreiber am
// 12.10.2026 zunächst NUR für sein eigenes Team und die Ligaleitung
// freigegeben — wird überarbeitet, evtl. später als Premium-Funktion.
// Für alle anderen gibt es weder Kachel noch Hinweis, die Seite sagt
// „noch nicht freigeschaltet“ und die Glocke bleibt still.
// Freischalten = Team-ID hier ergänzen.
// ============================================================

import { hasMinRole, type UserProfile } from '@/lib/auth/roles';

export const ZUSAGEN_TEAMS: readonly string[] = ['freibad-bazis'];

export const zusagenFuerTeam = (teamId: string | null | undefined) => !!teamId && ZUSAGEN_TEAMS.includes(teamId);

export function zusagenFreigeschaltet(user: Pick<UserProfile, 'role' | 'teamId'> | null | undefined): boolean {
  if (!user) return false;
  return zusagenFuerTeam(user.teamId) || hasMinRole(user as UserProfile, 'league_admin');
}
