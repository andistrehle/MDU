// ============================================================
// Server: Saison-Daten aus Supabase (selbstverwaltete Saison)
// ============================================================
//
// Ab Go-live ist die Plattform die alleinige Quelle. Die AKTIVE Saison wird aus
// Supabase gelesen (Teams + Kader aus den freigegebenen Anmeldungen, Migration
// 0008/0009). Archivierte Saisons (z. B. 2026) bleiben statisch in lib/data und
// werden hier NICHT angefasst — `selfManaged` ist false, solange die aktive
// Saison der statischen Saison entspricht.
//
// Server-only; eigener anon-Client (RLS erlaubt öffentliches Lesen).
// ============================================================

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getCurrentSeason, findLeague } from '@/lib/data';

function anon(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export interface ActiveSeasonInfo {
  id: string;
  name: string;
  /** true, wenn die aktive Saison NICHT die statische lib/data-Saison ist
   *  (→ Teams/Kader kommen aus Supabase). */
  selfManaged: boolean;
}

/** Aktive Saison: aus Supabase (`seasons.status='active'`); Fallback statisch. */
export async function getActiveSeason(): Promise<ActiveSeasonInfo> {
  const fallback = getCurrentSeason();
  const c = anon();
  if (!c) return { id: fallback.id, name: fallback.name, selfManaged: false };
  const { data } = await c.from('seasons').select('id, name, status').eq('status', 'active').maybeSingle();
  if (!data) return { id: fallback.id, name: fallback.name, selfManaged: false };
  const row = data as { id: string; name: string; status: string };
  return { id: row.id, name: row.name, selfManaged: row.id !== fallback.id };
}

export interface SeasonTeam {
  teamId: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  leagueId: string | null;
  leagueName: string | null;
  venueName: string | null;
  captainPlayerId: string | null;
}

/** Freigegebene Teams einer (selbstverwalteten) Saison, mit Liga-/Spielstätten-Namen. */
export async function getSeasonTeams(seasonId: string): Promise<SeasonTeam[]> {
  const c = anon();
  if (!c || !seasonId) return [];
  const { data } = await c
    .from('season_team_assignments')
    .select('team_id, assigned_competition_id, captain_player_id, teams:team_id(name,short_name,logo_url), venues:venue_id(name)')
    .eq('season_id', seasonId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  type Row = {
    team_id: string;
    assigned_competition_id: string | null;
    captain_player_id: string | null;
    teams: { name: string | null; short_name: string | null; logo_url: string | null } | null;
    venues: { name: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map(r => {
    const league = r.assigned_competition_id ? findLeague(r.assigned_competition_id) : undefined;
    return {
      teamId: r.team_id,
      name: r.teams?.name ?? r.team_id,
      shortName: r.teams?.short_name ?? null,
      logoUrl: r.teams?.logo_url ?? null,
      leagueId: r.assigned_competition_id ?? null,
      leagueName: league?.name ?? null,
      venueName: r.venues?.name ?? null,
      captainPlayerId: r.captain_player_id ?? null,
    } satisfies SeasonTeam;
  });
}

export interface SeasonRosterPlayer {
  firstName: string;
  lastName: string;
  licenseNumber: string | null;
  isCaptain: boolean;
  playerId: string | null;
  status: string;
}

/** Saisonkader eines Teams (aus `season_roster_assignments`). */
export async function getSeasonRoster(seasonId: string, teamId: string): Promise<SeasonRosterPlayer[]> {
  const c = anon();
  if (!c || !seasonId || !teamId) return [];
  const { data } = await c
    .from('season_roster_assignments')
    .select('first_name, last_name, license_number, is_captain, player_id, status')
    .eq('season_id', seasonId)
    .eq('team_id', teamId)
    .order('is_captain', { ascending: false });

  type Row = { first_name: string; last_name: string; license_number: string | null; is_captain: boolean; player_id: string | null; status: string };
  return ((data ?? []) as Row[]).map(r => ({
    firstName: r.first_name,
    lastName: r.last_name,
    licenseNumber: r.license_number,
    isCaptain: r.is_captain,
    playerId: r.player_id,
    status: r.status,
  }));
}

/** Eine einzelne Saison-Team-Zeile (für die Teamseite). */
export async function getSeasonTeam(seasonId: string, teamId: string): Promise<SeasonTeam | null> {
  const teams = await getSeasonTeams(seasonId);
  return teams.find(t => t.teamId === teamId) ?? null;
}
