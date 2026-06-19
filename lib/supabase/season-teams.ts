// ============================================================
// Admin-Datenzugriff: freigegebene Saison-Teams (Supabase)
// ============================================================
//
// Liest season_team_assignments + season_roster_assignments (Migration 0008/0009)
// inkl. Team-/Spielstättennamen. Nur Lesen; RLS lässt Admins alles, Kapitäne
// ihre eigenen Zuordnungen sehen.
// ============================================================

import { supabase } from './client';

export interface SeasonTeamRow {
  id: string;
  season_id: string;
  team_id: string;
  status: string;
  captain_user_id: string | null;
  captain_player_id: string | null;
  venue_id: string | null;
  assigned_competition_id: string | null;
  registration_id: string | null;
  created_at: string;
  teams: { name: string; short_name: string | null } | null;
  venues: { name: string; address: string | null } | null;
}

export interface SeasonRosterRow {
  id: string;
  season_id: string;
  team_id: string;
  player_id: string | null;
  first_name: string;
  last_name: string;
  license_number: string | null;
  is_captain: boolean;
  status: string;
  registration_id: string | null;
}

/** Alle freigegebenen Teams einer Saison (mit Team-/Spielstättennamen). */
export async function listSeasonTeams(seasonId: string): Promise<SeasonTeamRow[]> {
  if (!supabase || !seasonId) return [];
  const { data } = await supabase
    .from('season_team_assignments')
    .select('id, season_id, team_id, status, captain_user_id, captain_player_id, venue_id, assigned_competition_id, registration_id, created_at, teams:team_id(name,short_name), venues:venue_id(name,address)')
    .eq('season_id', seasonId)
    .order('created_at', { ascending: true });
  return (data ?? []) as unknown as SeasonTeamRow[];
}

/** Gesamter Saisonkader einer Saison (zum Gruppieren je Team). */
export async function listSeasonRoster(seasonId: string): Promise<SeasonRosterRow[]> {
  if (!supabase || !seasonId) return [];
  const { data } = await supabase
    .from('season_roster_assignments')
    .select('id, season_id, team_id, player_id, first_name, last_name, license_number, is_captain, status, registration_id')
    .eq('season_id', seasonId)
    .order('is_captain', { ascending: false });
  return (data ?? []) as SeasonRosterRow[];
}
