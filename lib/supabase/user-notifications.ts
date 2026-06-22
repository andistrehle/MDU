// ============================================================
// Einheitliches Notification-Center — Sprint Notification-Center
// ============================================================
//
// Liest/quittiert public.notifications (Migration 0007). Lesestatus pro
// User (read_at). Inserts passieren ausschließlich serverseitig per
// DB-Trigger — hier wird nur gelesen und read_at gesetzt (RLS erlaubt
// beides nur für eigene Notifications). Kein service_role im Client.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from './client';
import { useAuth } from '@/lib/auth/auth-context';

export interface AppNotification {
  id: string;
  recipient_user_id: string | null;
  type: string;
  title: string;
  message: string;
  short_text: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

/** Bereich für Kachel-Badges aus der Ziel-URL ableiten (robust). */
export type NotificationArea = 'users' | 'registrations' | 'anmeldungen' | 'spielberichte' | 'profile' | 'team' | 'other';

export function areaFromNotification(n: AppNotification): NotificationArea {
  const url = n.action_url ?? '';
  if (url.startsWith('/admin/users')) return 'users';
  if (url.startsWith('/admin/registrations')) return 'registrations';
  if (url.startsWith('/mein-bereich/spielberichte') || n.related_entity_type === 'match_report') return 'spielberichte';
  if (url.startsWith('/mein-bereich/anmeldungen')) return 'anmeldungen';
  if (url.startsWith('/mein-profil')) return 'profile';
  if (url.startsWith('/mein-bereich') || n.type === 'team_linked' || n.type === 'role_changed') return 'team';
  return 'other';
}

/** „gerade eben", „vor 2 Std.", „vor 3 Tagen" … */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'gerade eben';
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  const d = Math.floor(h / 24);
  if (d < 7) return `vor ${d} ${d === 1 ? 'Tag' : 'Tagen'}`;
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export async function listNotifications(limit = 30): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as AppNotification[];
}

export async function countUnreadNotifications(): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);
  return { error: error?.message ?? null };
}

export async function markAllNotificationsRead(): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: 'Keine aktive Sitzung.' };
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_user_id', auth.user.id)
    .is('read_at', null);
  return { error: error?.message ?? null };
}

export type AreaCounts = Record<NotificationArea, number>;

const ZERO_AREAS: AreaCounts = { users: 0, registrations: 0, anmeldungen: 0, spielberichte: 0, profile: 0, team: 0, other: 0 };

export interface UseNotificationsResult {
  items: AppNotification[];
  unread: number;
  byArea: AreaCounts;
  loading: boolean;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

/**
 * Zentraler Hook für die Glocke + Kachel-Badges. Lädt einmal nach Login und
 * bei Seitenwechsel. Für Gäste passiert nichts.
 */
export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth();
  const pathname = usePathname();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) { setItems([]); return; }
    setLoading(true);
    const rows = await listNotifications(30);
    setItems(rows);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load, pathname]);

  const markRead = useCallback(async (id: string) => {
    setItems(prev => prev.map(n => n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n));
    await markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems(prev => prev.map(n => n.read_at ? n : { ...n, read_at: now }));
    await markAllNotificationsRead();
  }, []);

  const unread = items.reduce((acc, n) => acc + (n.read_at ? 0 : 1), 0);
  const byArea = items.reduce<AreaCounts>((acc, n) => {
    if (!n.read_at) acc[areaFromNotification(n)] += 1;
    return acc;
  }, { ...ZERO_AREAS });

  return { items, unread, byArea, loading, refresh: load, markRead, markAllRead };
}
