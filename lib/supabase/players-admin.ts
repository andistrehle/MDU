// ============================================================
// Spieler-Verwaltung (Admin) — globale DB-Spieler bearbeiten/löschen
// ============================================================
//
// Liest die in der Plattform angelegten Spieler (players) und erlaubt
// Namenskorrektur + Löschen. Schreibrechte erzwingt die DB per RLS (Admin).
// ============================================================

import { supabase } from './client';

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

export interface AdminPlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  license: string | null;
  status: string;
  teams: string[];
}

/** Alle in der DB angelegten Spieler (mit Teamnamen aus dem Kader). */
export async function listAllDbPlayers(): Promise<AdminPlayerRow[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('players')
    .select('id, first_name, last_name, display_name, license_number, status');
  const players = (data ?? []) as { id: string; first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null; status: string }[];

  // Teamnamen je Spieler aus dem Kader (team_id hat FK auf teams → Embed geht).
  const { data: roster } = await supabase
    .from('season_roster_assignments')
    .select('player_id, teams:team_id(name)');
  const teamsById = new Map<string, Set<string>>();
  for (const r of (roster ?? []) as unknown as { player_id: string | null; teams: { name: string } | null }[]) {
    if (!r.player_id || !r.teams?.name) continue;
    const set = teamsById.get(r.player_id) ?? new Set<string>();
    set.add(r.teams.name);
    teamsById.set(r.player_id, set);
  }

  return players
    .map(p => ({
      id: p.id,
      firstName: p.first_name ?? '',
      lastName: p.last_name ?? '',
      displayName: p.display_name,
      license: p.license_number,
      status: p.status,
      teams: [...(teamsById.get(p.id) ?? [])],
    }))
    .sort((a, b) =>
      (a.lastName || a.firstName).localeCompare(b.lastName || b.firstName, 'de') ||
      a.firstName.localeCompare(b.firstName, 'de'));
}

/** Namen eines Spielers korrigieren — Profil + alle Kaderzeilen konsistent. */
export async function setPlayerName(playerId: string, first: string, last: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const f = first.trim(), l = last.trim();
  if (!f && !l) return { error: 'Bitte einen Namen angeben.' };
  const { data: p } = await supabase.from('players').select('first_name, last_name, display_name').eq('id', playerId).maybeSingle();
  const patch: { first_name: string; last_name: string; display_name?: string } = { first_name: f, last_name: l };
  if (p) {
    const oldFull = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
    const dn = (p.display_name ?? '').trim();
    if (!dn || dn === oldFull) patch.display_name = `${f} ${l}`.trim();
  }
  const { error } = await supabase.from('players').update(patch).eq('id', playerId);
  if (error) return { error: error.message };
  await supabase.from('season_roster_assignments').update({ first_name: f, last_name: l }).eq('player_id', playerId);
  await supabase.from('player_nominations').update({ first_name: f, last_name: l }).eq('player_id', playerId);
  return { error: null };
}

/** Spieler vollständig löschen (Kader, Zuordnungen, Nachmeldungen, Profil).
 *  Verweigert, wenn ein Benutzerkonto mit dem Spieler verknüpft ist. */
export async function deleteDbPlayer(playerId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: prof } = await supabase.from('profiles').select('id').eq('player_id', playerId).limit(1);
  if ((prof?.length ?? 0) > 0) {
    return { error: 'Mit diesem Spieler ist ein Benutzerkonto verknüpft. Bitte zuerst in der Benutzerverwaltung die Verknüpfung lösen.' };
  }
  await supabase.from('season_roster_assignments').delete().eq('player_id', playerId);
  await supabase.from('player_assignments').delete().eq('player_id', playerId);
  await supabase.from('player_nominations').delete().eq('player_id', playerId);
  const { error } = await supabase.from('players').delete().eq('id', playerId);
  return { error: error?.message ?? null };
}
