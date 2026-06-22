// ============================================================
// Spieler-Nachmeldungen — Datenzugriff
// ============================================================
//
// Kapitän meldet Spieler nach (pending) → Ligaleitung bestätigt/lehnt ab.
// Benachrichtigungen laufen über DB-Trigger (Migration 0019). RLS aktiv.
// ============================================================

import { supabase } from './client';

export type NominationStatus = 'pending' | 'approved' | 'rejected';

export const NOMINATION_STATUS_LABELS: Record<NominationStatus, string> = {
  pending: 'In Prüfung', approved: 'Bestätigt', rejected: 'Abgelehnt',
};

export interface PlayerNomination {
  id: string;
  team_id: string;
  team_name: string;
  first_name: string;
  last_name: string;
  submitted_by: string;
  status: NominationStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

export async function createNomination(teamId: string, teamName: string, firstName: string, lastName: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  if (!firstName.trim() || !lastName.trim()) return { error: 'Bitte Vor- und Nachname angeben.' };
  const { error } = await supabase.from('player_nominations').insert({
    team_id: teamId, team_name: teamName, first_name: firstName.trim(), last_name: lastName.trim(), status: 'pending',
  });
  return { error: error?.message ?? null };
}

export async function listMyNominations(): Promise<PlayerNomination[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('player_nominations').select('*').order('created_at', { ascending: false });
  return (data ?? []) as PlayerNomination[];
}

export async function listAllNominations(): Promise<PlayerNomination[]> {
  return listMyNominations(); // RLS: Admin sieht alle
}

export async function reviewNomination(id: string, status: Extract<NominationStatus, 'approved' | 'rejected'>, note?: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('player_nominations').update({
    status, review_note: note ?? null, reviewed_by: auth.user?.id ?? null, reviewed_at: new Date().toISOString(),
  }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function countPendingNominations(): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase.from('player_nominations').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  return count ?? 0;
}
