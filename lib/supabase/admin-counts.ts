// ============================================================
// Admin-Benachrichtigungszähler — Sprint Notification Badges
// ============================================================
//
// Zentrale, rollenbasierte Zähler für offene Admin-Aufgaben.
// Quelle sind die echten Tabellen (team_registrations, profiles) — keine
// Dummy-Zahlen. RLS sorgt dafür, dass nur Admins überhaupt Daten sehen;
// zusätzlich prüfen die Helper die Rolle, damit für Spieler/Gäste gar
// keine Queries laufen (Performance + Datenschutz).
//
// Counts:
//   registrations — Mannschaftsanmeldungen, die auf Prüfung warten
//   users         — neue/ungeprüfte Benutzerprofile
//   matchReports  — Platzhalter (noch keine Spielbericht-Tabelle)
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from './client';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations, canViewUsers, canManageLeague, type UserProfile } from '@/lib/auth/roles';
import { countPendingNominations } from './nominations';

export interface AdminNotificationCounts {
  /** team_registrations mit Status submitted / in_review */
  registrations: number;
  /** neue / ungeprüfte Benutzer (match_status = pending) */
  users: number;
  /** noch keine Datenquelle — bleibt 0 */
  matchReports: number;
  /** offene Spieler-Nachmeldungen (pending) */
  nominations: number;
  /** Summe aller offenen Admin-Aufgaben */
  total: number;
}

export const ZERO_COUNTS: AdminNotificationCounts = { registrations: 0, users: 0, matchReports: 0, nominations: 0, total: 0 };

/** Offene Mannschaftsanmeldungen (warten auf Prüfung). */
export async function getPendingRegistrationCount(user: UserProfile | null): Promise<number> {
  if (!supabase || !canApproveRegistrations(user)) return 0;
  const { count } = await supabase
    .from('team_registrations')
    .select('id', { count: 'exact', head: true })
    .in('status', ['submitted', 'in_review']);
  return count ?? 0;
}

/**
 * Neue/ungeprüfte Benutzer. Ein Profil gilt als offen, solange es noch nicht
 * von einem Admin bestätigt wurde (match_status = 'pending'). Bestätigte,
 * manuell verknüpfte oder abgelehnte Profile zählen nicht mehr.
 *
 * Ausgenommen sind unbestätigte Konten (E-Mail nie bestätigt UND nie
 * eingeloggt) — diese Registrierungen sind gar nicht abgeschlossen und tauchen
 * in der Benutzerverwaltung auch nicht unter „Zuzuweisen" auf. Sonst würde die
 * rote Zahl an der Kachel „Benutzer verwalten" (z. B. 1) nicht zur Liste (0)
 * passen. Die Ids der unbestätigten Konten kommen serverseitig aus
 * /api/admin/users (nur per service_role lesbar).
 */
export async function getNewUserCount(user: UserProfile | null): Promise<number> {
  if (!supabase || !canViewUsers(user)) return 0;
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'player')
    .eq('match_status', 'pending');
  const pendingIds = (data ?? []).map(r => r.id as string);
  if (pendingIds.length === 0) return 0;

  // Unbestätigte Konten herausrechnen (konsistent mit der Benutzerverwaltung).
  const unconfirmed = await getUnconfirmedUserIds();
  return pendingIds.filter(id => !unconfirmed.has(id)).length;
}

/** Ids der Auth-Konten, deren Registrierung nicht abgeschlossen ist (nie
 *  bestätigt UND nie eingeloggt). Fehlerfälle → leeres Set (dann zählt es wie
 *  bisher, statt die Kachel ganz auszublenden). */
async function getUnconfirmedUserIds(): Promise<Set<string>> {
  try {
    if (!supabase) return new Set();
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) return new Set();
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return new Set();
    const json = await res.json();
    return new Set((json.unconfirmed ?? []) as string[]);
  } catch {
    return new Set();
  }
}

/** Alle Admin-Zähler in einem Rutsch (parallele Count-Queries). */
export async function getAdminNotificationCounts(user: UserProfile | null): Promise<AdminNotificationCounts> {
  if (!canManageLeague(user)) return ZERO_COUNTS;
  const [registrations, users, nominations] = await Promise.all([
    getPendingRegistrationCount(user),
    getNewUserCount(user),
    countPendingNominations(),
  ]);
  // Spielberichte werden nicht von der Ligaleitung freigegeben → keine Admin-Aufgabe.
  const matchReports = 0;
  return { registrations, users, matchReports, nominations, total: registrations + users + matchReports + nominations };
}

export function getTotalAdminNotificationCount(counts: AdminNotificationCounts): number {
  return counts.total;
}

/**
 * Zentraler Hook — lädt die Zähler einmalig nach Login und erneut bei
 * Seitenwechsel. Für Nicht-Admins werden gar keine Queries ausgeführt.
 * `refresh()` erlaubt manuelles Neuladen nach Aktionen.
 */
export function useAdminNotificationCounts(): {
  counts: AdminNotificationCounts;
  loading: boolean;
  refresh: () => void;
} {
  const { user } = useAuth();
  const pathname = usePathname();
  const [counts, setCounts] = useState<AdminNotificationCounts>(ZERO_COUNTS);
  const [loading, setLoading] = useState(false);
  const isAdmin = canManageLeague(user);

  const load = useCallback(async () => {
    if (!isAdmin) { queueMicrotask(() => setCounts(ZERO_COUNTS)); return; }
    setLoading(true);
    const c = await getAdminNotificationCounts(user);
    setCounts(c);
    setLoading(false);
  }, [isAdmin, user]);

  useEffect(() => { load(); }, [load, pathname]);

  return { counts, loading, refresh: load };
}
