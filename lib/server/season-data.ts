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
import type { Player, PlayerStatus } from '@/lib/data/players';
import {
  TEAM_PLAYER_ASSIGNMENTS,
  type TeamPlayerAssignment,
  type PlayerWithAssignment,
} from '@/lib/data/assignments';

function anon(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Aktuelle Passnummern für eine Liste von Spieler-Ids (players.license_number).
 *  Für die Kader-Anzeige, da season_roster_assignments.player_id keinen FK hat. */
async function currentLicenses(c: SupabaseClient, playerIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(playerIds.filter((x): x is string => !!x))];
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data } = await c.from('players').select('id, license_number').in('id', ids);
  for (const p of (data ?? []) as { id: string; license_number: string | null }[]) {
    if (p.license_number) map.set(p.id, p.license_number);
  }
  return map;
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
  const rows = (data ?? []) as unknown as Row[];

  // Über „Team bearbeiten" gepflegte Logos liegen in team_profiles (Overlay) —
  // die haben Vorrang vor dem bei der Anmeldung gesetzten teams.logo_url.
  const logoByTeam = new Map<string, string>();
  if (rows.length) {
    const { data: profs } = await c
      .from('team_profiles').select('team_id, logo_url').in('team_id', rows.map(r => r.team_id));
    for (const p of (profs ?? []) as { team_id: string; logo_url: string | null }[]) {
      if (p.logo_url) logoByTeam.set(p.team_id, p.logo_url);
    }
  }

  return rows.map(r => {
    const league = r.assigned_competition_id ? findLeague(r.assigned_competition_id) : undefined;
    return {
      teamId: r.team_id,
      name: r.teams?.name ?? r.team_id,
      shortName: r.teams?.short_name ?? null,
      logoUrl: logoByTeam.get(r.team_id) ?? r.teams?.logo_url ?? null,
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
  const rows = (data ?? []) as Row[];
  // Aktuelle Passnummern der verknüpften Spieler separat holen (season_roster_
  // assignments.player_id hat keinen FK auf players → kein PostgREST-Embed möglich).
  const licById = await currentLicenses(c, rows.map(r => r.player_id));
  return rows.map(r => ({
    firstName: r.first_name,
    lastName: r.last_name,
    licenseNumber: (r.player_id && licById.get(r.player_id)) || r.license_number,
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

/**
 * Team in seiner NEUESTEN freigegebenen Saison finden (für die öffentliche
 * Teamseite) — auch wenn diese Saison noch nicht aktiv geschaltet ist (z. B.
 * ein für 2026/2027 angemeldetes Team, während aktiv noch 2025/2026 läuft).
 */
export async function getAnySeasonTeamView(
  teamId: string,
): Promise<{ seasonName: string; team: SeasonTeam; roster: SeasonRosterPlayer[] } | null> {
  const c = anon();
  if (!c || !teamId) return null;
  const { data } = await c
    .from('season_team_assignments')
    .select('season_id, seasons:season_id(name)')
    .eq('team_id', teamId).eq('status', 'approved')
    .order('season_id', { ascending: false }).limit(1);
  const row = ((data ?? [])[0]) as unknown as { season_id: string; seasons: { name: string } | { name: string }[] | null } | undefined;
  if (!row) return null;
  const seasonName = Array.isArray(row.seasons) ? (row.seasons[0]?.name ?? null) : (row.seasons?.name ?? null);
  const team = await getSeasonTeam(row.season_id, teamId);
  if (!team) return null;
  const roster = await getSeasonRoster(row.season_id, teamId);
  return { seasonName: seasonName ?? row.season_id, team, roster };
}

// ── Phase 2, Stufe 1: Kader aus der DB (Tabellen `players` + ────
//    `player_assignments`, Migration 0032) ──────────────────────
//
// Liefert die Team-Kader-Basis (PlayerWithAssignment[]) aus der DB — Format
// identisch zur statischen Basis (lib/data/assignments), damit getRankedRoster-
// ForTeam exakt dieselbe Ausgabe erzeugt. Reihenfolge folgt der statischen
// Basis (No-Stat-Spieler behalten ihre Reihenfolge); nachgemeldete Spieler
// (nicht in der statischen Liste) werden hinten deterministisch angehängt.
//
// Rückgabe `null` = keine DB-Daten / Fehler → Aufrufer nutzt statischen Fallback,
// damit garantiert nie etwas kaputtgeht.
export async function getDbRosterForTeam(
  seasonId: string,
  teamId: string,
): Promise<PlayerWithAssignment[] | null> {
  const c = anon();
  if (!c || !seasonId || !teamId) return null;

  const { data, error } = await c
    .from('player_assignments')
    .select('id, player_id, status, is_captain, players:player_id(id, first_name, last_name, display_name, nickname, license_number, status, photo_url)')
    .eq('season_id', seasonId)
    .eq('team_id', teamId);

  if (error || !data || data.length === 0) return null;

  type PlayerRow = {
    id: string; first_name: string; last_name: string;
    display_name: string | null; nickname: string | null;
    license_number: string | null; status: string; photo_url: string | null;
  };
  type Row = { id: string; player_id: string; status: string; is_captain: boolean; players: PlayerRow | null };

  const mapped: PlayerWithAssignment[] = (data as unknown as Row[]).flatMap(r => {
    const p = r.players;
    if (!p) return [];
    const player: Player = {
      id: p.id,
      firstName: p.first_name,
      lastName: p.last_name,
      displayName: p.display_name ?? undefined,
      nickname: p.nickname ?? undefined,
      licenseNumber: p.license_number ?? undefined,
      status: (p.status as PlayerStatus) ?? 'active',
      photoUrl: p.photo_url ?? undefined,
    };
    const assignment: TeamPlayerAssignment = {
      id: r.id,
      seasonId,
      teamId,
      playerId: r.player_id,
      status: (r.status as TeamPlayerAssignment['status']) ?? 'active',
      isCaptain: r.is_captain,
    };
    return [{ player, assignment }];
  });

  if (mapped.length === 0) return null;

  // Reihenfolge exakt wie in der statischen Basis; Unbekannte (Nachmeldungen)
  // hinten, stabil nach ID sortiert.
  const order = new Map<string, number>();
  TEAM_PLAYER_ASSIGNMENTS.forEach((a, i) => order.set(a.id, i));
  const known = mapped.filter(m => order.has(m.assignment.id))
    .sort((a, b) => order.get(a.assignment.id)! - order.get(b.assignment.id)!);
  const extra = mapped.filter(m => !order.has(m.assignment.id))
    .sort((a, b) => a.assignment.id.localeCompare(b.assignment.id));

  return [...known, ...extra];
}

// ── Phase 2, Stufe 2: Spielerprofil aus der DB ─────────────────
//
// Liefert einen Spieler samt seiner Kaderzuordnungen (alle Saisons) aus den
// DB-Tabellen. Wird als Fallback genutzt, wenn der Spieler NICHT im statischen
// Stamm (lib/data/players) liegt — also für per Nachmeldung angelegte Spieler.
// Bestehende (statische) Spieler laufen unverändert über die statische Seite.
export interface DbPlayerProfile {
  player: Player;
  assignments: { seasonId: string; teamId: string; isCaptain: boolean }[];
}

export async function getDbPlayer(playerId: string): Promise<DbPlayerProfile | null> {
  const c = anon();
  if (!c || !playerId) return null;

  const { data: prow, error } = await c
    .from('players')
    .select('id, first_name, last_name, display_name, nickname, license_number, status, photo_url')
    .eq('id', playerId)
    .maybeSingle();
  if (error || !prow) return null;

  const p = prow as {
    id: string; first_name: string; last_name: string;
    display_name: string | null; nickname: string | null;
    license_number: string | null; status: string; photo_url: string | null;
  };
  const player: Player = {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    displayName: p.display_name ?? undefined,
    nickname: p.nickname ?? undefined,
    licenseNumber: p.license_number ?? undefined,
    status: (p.status as PlayerStatus) ?? 'active',
    photoUrl: p.photo_url ?? undefined,
  };

  const { data: arows } = await c
    .from('player_assignments')
    .select('season_id, team_id, is_captain')
    .eq('player_id', playerId);

  const assignments = ((arows ?? []) as { season_id: string; team_id: string; is_captain: boolean }[])
    .map(a => ({ seasonId: a.season_id, teamId: a.team_id, isCaptain: a.is_captain }));

  return { player, assignments };
}
