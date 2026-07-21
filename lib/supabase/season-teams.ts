// ============================================================
// Admin-Datenzugriff: freigegebene Saison-Teams (Supabase)
// ============================================================
//
// Liest season_team_assignments + season_roster_assignments (Migration 0008/0009)
// inkl. Team-/Spielstättennamen. Nur Lesen; RLS lässt Admins alles, Kapitäne
// ihre eigenen Zuordnungen sehen.
// ============================================================

import { supabase } from './client';
import { generateNextPassNumber, parseLicenseNumber, nominationPlayerSlug, nextFreeBlock, staticTeamBlock } from '@/lib/data/pass-numbers';

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

/** Schaltet die aktive Saison um (Admin-only RPC). Ziel → active, bisher aktive → archived. */
export async function setActiveSeason(seasonId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase.rpc('set_active_season', { p_season_id: seasonId });
  return { error: error?.message ?? null };
}

/**
 * Neue Spieler eines freigegebenen Teams „scharf schalten": Für jede Kader-Zeile
 * im Status `pending_review` (Spieler aus der Mannschaftsanmeldung, die es noch
 * nicht als Profil gab) wird ein echtes Spielerprofil + Passnummer erzeugt und
 * die Kader-Zeile auf `active` gesetzt. Nutzt dieselbe Regel wie die Nachmeldung
 * (höchste Teamkollegen-Nummer + 1, nächste global freie). Idempotent: bereits
 * finalisierte Zeilen (mit Passnummer) werden übersprungen; erneutes Ausführen
 * ist gefahrlos (Upserts). Schreibt ECHTE Passnummern → nur Admin (RLS).
 */
export async function finalizeNewRosterPlayers(
  seasonId: string,
  teamId: string,
): Promise<{ finalized: number; error: string | null }> {
  if (!supabase || !seasonId || !teamId) return { finalized: 0, error: 'Supabase ist nicht konfiguriert.' };

  const { data: rows, error: loadErr } = await supabase
    .from('season_roster_assignments')
    .select('id, first_name, last_name, player_id, is_captain, license_number')
    .eq('season_id', seasonId).eq('team_id', teamId).eq('status', 'pending_review');
  if (loadErr) return { finalized: 0, error: loadErr.message };
  const todo = ((rows ?? []) as { id: string; first_name: string; last_name: string; player_id: string | null; is_captain: boolean; license_number: string | null }[])
    .filter(r => !r.license_number);   // schon vergebene nicht doppelt behandeln
  if (todo.length === 0) return { finalized: 0, error: null };

  // Schutz: niemals namenlose Profile anlegen. Fehlt bei einer Kaderzeile Vor-
  // UND Nachname (z. B. Altbestand, bei dem nur display_name gesetzt war), lieber
  // abbrechen und die Namen zuerst ergänzen lassen, statt Leer-Spieler zu erzeugen.
  const nameless = todo.filter(r => !`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim());
  if (nameless.length) {
    return { finalized: 0, error: `${nameless.length} Kaderzeile(n) ohne Namen — bitte zuerst die Namen ergänzen, dann erneut freigeben.` };
  }

  // Bereits vergebene Passnummern aus der DB einsammeln (players + Kader), damit
  // es keine Doppelvergabe gibt. Der statische Stamm steckt schon in generateNextPassNumber.
  const extraUsed: number[] = [];
  const push = (rowsL: { license_number: string | null }[] | null) => {
    for (const r of rowsL ?? []) { const n = parseLicenseNumber(r.license_number); if (n != null) extraUsed.push(n); }
  };
  const { data: dbP } = await supabase.from('players').select('license_number').not('license_number', 'is', null);
  push(dbP as { license_number: string | null }[] | null);
  const { data: dbR } = await supabase.from('season_roster_assignments').select('license_number').not('license_number', 'is', null);
  push(dbR as { license_number: string | null }[] | null);

  // Block dieses Teams EINMAL bestimmen (Betreiber-Systematik: 1 Team = 1 100er-Block):
  //   1) aus bereits vergebenen Nummern DIESES Teams in der Saison (DB),
  //   2) sonst der historische statische Block (25/26),
  //   3) sonst der nächste global freie Block (inkl. schon belegter DB-Blöcke).
  const { data: teamRows } = await supabase
    .from('season_roster_assignments').select('license_number')
    .eq('season_id', seasonId).eq('team_id', teamId).not('license_number', 'is', null);
  const teamNums = ((teamRows ?? []) as { license_number: string | null }[])
    .map(r => parseLicenseNumber(r.license_number)).filter((n): n is number => n != null && n >= 1000 && n < 10000);
  let blockBase: number | undefined;
  if (teamNums.length) {
    const cnt = new Map<number, number>();
    for (const n of teamNums) { const b = Math.floor(n / 100) * 100; cnt.set(b, (cnt.get(b) ?? 0) + 1); }
    blockBase = [...cnt.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  } else {
    blockBase = staticTeamBlock(teamId) ?? nextFreeBlock(extraUsed.map(n => Math.floor(n / 100) * 100));
  }
  // Saison-Präfix (z. B. „…2027" → 27); sonst Default aus generateNextPassNumber.
  const years = [...String(seasonId).matchAll(/\d{4}/g)].map(m => parseInt(m[0], 10)).filter(y => y >= 2000);
  const seasonYear = years.length ? Math.max(...years) : undefined;

  let finalized = 0;
  for (const row of todo) {
    const gen  = generateNextPassNumber(teamId, { seasonId, seasonYear, extraUsed, isCaptain: row.is_captain, blockBase });
    const slug = row.player_id ?? nominationPlayerSlug(row.first_name, row.last_name, gen.number);

    const { error: pe } = await supabase.from('players').upsert(
      { id: slug, first_name: row.first_name, last_name: row.last_name, license_number: gen.license, status: 'active', source: 'registration' },
      { onConflict: 'id' });
    if (pe) return { finalized, error: `Spieler ${row.first_name} ${row.last_name}: ${pe.message}` };

    const { error: ae } = await supabase.from('player_assignments').upsert(
      { id: `pa-reg-${row.id}`, season_id: seasonId, team_id: teamId, player_id: slug, status: 'active', is_captain: row.is_captain, source: 'registration' },
      { onConflict: 'id' });
    if (ae) return { finalized, error: `Zuordnung ${row.first_name} ${row.last_name}: ${ae.message}` };

    const { error: ue } = await supabase.from('season_roster_assignments')
      .update({ player_id: slug, license_number: gen.license, status: 'active' }).eq('id', row.id);
    if (ue) return { finalized, error: `Kader ${row.first_name} ${row.last_name}: ${ue.message}` };

    // War der neue Spieler der Kapitän, die Team-Zuordnung nachziehen.
    if (row.is_captain) {
      await supabase.from('season_team_assignments')
        .update({ captain_player_id: slug }).eq('season_id', seasonId).eq('team_id', teamId);
    }

    extraUsed.push(gen.number);
    finalized++;
  }
  return { finalized, error: null };
}

/**
 * Alle aktiven Spieler aus der DB-Tabelle `players` als Zuordnungs-Optionen
 * (id, Anzeigename, Passnummer) — inkl. der per Team-Freigabe/Nachmeldung neu
 * angelegten, die es im statischen Stamm noch nicht gibt. Für das „Verknüpfter
 * Spieler"-Dropdown im Admin, damit auch frisch angelegte Spieler auswählbar sind.
 */
export async function listDbPlayerOptions(): Promise<{ id: string; name: string; license: string | null }[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('players')
    .select('id, first_name, last_name, display_name, license_number, status')
    .eq('status', 'active');
  return ((data ?? []) as { id: string; first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null }[])
    .map(p => ({
      id: p.id,
      name: (p.display_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`).trim() || p.id,
      license: p.license_number ?? null,
    }));
}

/**
 * Alle aktiven Teams aus der DB-Tabelle `teams` als Zuordnungs-Optionen
 * (id, Name) — inkl. der bei einer Mannschaftsanmeldung neu angelegten Teams,
 * die es im statischen Stamm noch nicht gibt. Für das „Verknüpftes Team"-Dropdown.
 */
export async function listDbTeamOptions(): Promise<{ id: string; name: string }[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('teams')
    .select('id, name, status')
    .eq('status', 'active');
  return ((data ?? []) as { id: string; name: string | null }[])
    .map(t => ({ id: t.id, name: (t.name ?? '').trim() || t.id }));
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
