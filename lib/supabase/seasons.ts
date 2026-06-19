// ============================================================
// Saison-Datenzugriff (Supabase) — Sprint Mannschaftsanmeldung abschließen
// ============================================================
//
// Liest die persistente seasons-Tabelle (Migration 0008). Die laufende Saison
// wird DYNAMISCH bestimmt (status = 'active') — keine fest codierte Saison.
// Archivierte/abgeschlossene Saisons sind read-only (isSeasonEditable=false).
// ============================================================

import { supabase } from './client';

export type SeasonStatus = 'upcoming' | 'registration_open' | 'active' | 'completed' | 'archived';

export interface DbSeason {
  id: string;
  name: string;
  year: number | null;
  status: SeasonStatus;
  archived_at: string | null;
}

export const SEASON_STATUS_LABELS: Record<SeasonStatus, string> = {
  upcoming:          'Geplant',
  registration_open: 'Anmeldung geöffnet',
  active:            'Aktiv',
  completed:         'Abgeschlossen',
  archived:          'Archiviert',
};

export async function listSeasons(): Promise<DbSeason[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('seasons').select('*').order('year', { ascending: false });
  return (data ?? []) as DbSeason[];
}

export async function getSeason(id: string): Promise<DbSeason | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('seasons').select('*').eq('id', id).maybeSingle();
  return (data as DbSeason) ?? null;
}

/** Die aktuell laufende Saison (status = active). */
export async function getActiveSeason(): Promise<DbSeason | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('seasons').select('*').eq('status', 'active').maybeSingle();
  return (data as DbSeason) ?? null;
}

/** Saison, für die aktuell angemeldet werden soll (registration_open, sonst upcoming). */
export async function getRegistrationSeason(): Promise<DbSeason | null> {
  if (!supabase) return null;
  const { data: open } = await supabase
    .from('seasons').select('*').eq('status', 'registration_open')
    .order('year', { ascending: true }).limit(1).maybeSingle();
  if (open) return open as DbSeason;
  const { data: up } = await supabase
    .from('seasons').select('*').eq('status', 'upcoming')
    .order('year', { ascending: true }).limit(1).maybeSingle();
  return (up as DbSeason) ?? null;
}

export async function getUpcomingSeasons(): Promise<DbSeason[]> {
  return (await listSeasons()).filter(s => s.status === 'upcoming' || s.status === 'registration_open');
}

export async function getArchivedSeasons(): Promise<DbSeason[]> {
  return (await listSeasons()).filter(s => s.status === 'archived');
}

// ── Reine Status-Helfer (ohne Query) ─────────────────────────

export function isSeasonArchived(s: DbSeason | null): boolean {
  return s?.status === 'archived';
}

/** Bearbeitbar = nicht abgeschlossen und nicht archiviert. */
export function isSeasonEditable(s: DbSeason | null): boolean {
  return !!s && s.status !== 'archived' && s.status !== 'completed';
}

/** Dürfen Mannschaften für diese Saison angemeldet/freigegeben werden? */
export function canRegisterTeamsForSeason(s: DbSeason | null): boolean {
  return !!s && (s.status === 'registration_open' || s.status === 'upcoming' || s.status === 'active');
}
