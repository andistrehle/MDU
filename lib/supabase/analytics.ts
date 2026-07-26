// ============================================================
// Nutzungsstatistik — Aggregat-Abruf (nur Super-Admin, via RPC)
// ============================================================

import { supabase } from './client';

export interface DailyRow { day: string; views: number; sessions: number }
export interface PathRow { path: string; views: number; sessions: number }
export interface ThemeRow { theme: string; views: number }
export interface LoginRow { logged_in: boolean; views: number; sessions: number }

export interface AnalyticsData {
  daily: DailyRow[];
  topPaths: PathRow[];
  theme: ThemeRow[];
  logins: LoginRow[];
}

export async function loadAnalytics(days: number): Promise<{ data: AnalyticsData | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase ist nicht konfiguriert.' };
  const [d, p, t, l] = await Promise.all([
    supabase.rpc('analytics_daily', { p_days: days }),
    supabase.rpc('analytics_top_paths', { p_days: days, p_limit: 25 }),
    supabase.rpc('analytics_theme', { p_days: days }),
    supabase.rpc('analytics_logins', { p_days: days }),
  ]);
  const err = d.error || p.error || t.error || l.error;
  if (err) return { data: null, error: err.message };
  return {
    data: {
      daily: (d.data ?? []) as DailyRow[],
      topPaths: (p.data ?? []) as PathRow[],
      theme: (t.data ?? []) as ThemeRow[],
      logins: (l.data ?? []) as LoginRow[],
    },
    error: null,
  };
}
