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
import { normalizePersonName } from '@/lib/auth/player-match';

/** display_name → Vor-/Nachname (letztes Wort = Nachname). Lokal, um einen
 *  Zyklus mit lib/supabase/registrations (importiert finalize von hier) zu meiden. */
function splitName(display: string): { first: string; last: string } {
  const parts = (display ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

/** Aktuelle Passnummern (players.license_number) für Spieler-Ids — separat, weil
 *  season_roster_assignments.player_id keinen FK auf players hat (kein Embed). */
async function currentLicensesClient(playerIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(playerIds.filter((x): x is string => !!x))];
  const map = new Map<string, string>();
  if (!supabase || !ids.length) return map;
  const { data } = await supabase.from('players').select('id, license_number').in('id', ids);
  for (const p of (data ?? []) as { id: string; license_number: string | null }[]) {
    if (p.license_number) map.set(p.id, p.license_number);
  }
  return map;
}

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
  /** Vom Kapitän gewünschte Hauptliga aus der Anmeldung (Fallback für die Gruppierung). */
  requested_league: string | null;
  /** Kontaktdaten des Ansprechpartners aus der Anmeldung (Kapitän). */
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
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
  const rows = (data ?? []) as unknown as SeasonTeamRow[];

  // Gewünschte Liga separat nachladen (kein Embed-Join, da season_roster/-team
  // teils keine FK auf team_registrations haben) und je Team einmischen.
  const regIds = Array.from(new Set(rows.map(r => r.registration_id).filter(Boolean))) as string[];
  const setContact = (row: SeasonTeamRow, reg: { requested_league: string | null; contact_name: string | null; contact_phone: string | null; contact_email: string | null } | undefined) => {
    row.requested_league = reg?.requested_league ?? null;
    row.contact_name = reg?.contact_name ?? null;
    row.contact_phone = reg?.contact_phone ?? null;
    row.contact_email = reg?.contact_email ?? null;
  };
  if (regIds.length) {
    const { data: regs } = await supabase
      .from('team_registrations')
      .select('id, requested_league, contact_name, contact_phone, contact_email')
      .in('id', regIds);
    const byId = new Map(((regs ?? []) as { id: string; requested_league: string | null; contact_name: string | null; contact_phone: string | null; contact_email: string | null }[])
      .map(r => [r.id, r]));
    for (const row of rows) setContact(row, row.registration_id ? byId.get(row.registration_id) : undefined);
  } else {
    for (const row of rows) setContact(row, undefined);
  }
  return rows;
}

/** Namen einer Kaderzeile setzen/korrigieren (z. B. Altbestand ohne Vor-/Nachname
 *  oder Tippfehler). Aktualisiert bei verknüpftem Spieler auch das Spielerprofil
 *  (players), damit der Name überall konsistent ist. */
export async function setRosterPlayerName(rowId: string, first: string, last: string, playerId?: string | null): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const f = first.trim(), l = last.trim();
  // Nachmeldungs-Zeilen (pa-…-Ids) sind KEINE echten Kaderzeilen — deren id ist
  // keine UUID; die season_roster-Aktualisierung würde mit „invalid uuid" scheitern.
  // Für sie zählt nur das Spielerprofil (players) unten.
  if (!rowId.startsWith('pa-')) {
    const { error } = await supabase.from('season_roster_assignments')
      .update({ first_name: f, last_name: l }).eq('id', rowId);
    if (error) return { error: error.message };
  }
  if (playerId) {
    // Profil mitziehen; display_name nur überschreiben, wenn es kein Spitzname ist
    // (also leer war oder exakt dem bisherigen Vor-/Nachnamen entsprach).
    const { data: p } = await supabase.from('players').select('first_name, last_name, display_name').eq('id', playerId).maybeSingle();
    const patch: { first_name: string; last_name: string; display_name?: string } = { first_name: f, last_name: l };
    if (p) {
      const oldFull = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
      const dn = (p.display_name ?? '').trim();
      if (!dn || dn === oldFull) patch.display_name = `${f} ${l}`.trim();
    }
    await supabase.from('players').update(patch).eq('id', playerId);
    // Falls der Spieler aus einer Nachmeldung stammt, auch dort den Namen ziehen.
    await supabase.from('player_nominations').update({ first_name: f, last_name: l }).eq('player_id', playerId);
  }
  return { error: null };
}

/**
 * Einen Spieler aus dem Kader entfernen (z. B. Dublette). Löscht die Kaderzeile
 * und die Saison-Zuordnung; das Spielerprofil (players) wird nur gelöscht, wenn
 * es nirgends sonst verwendet wird (kein Konto verknüpft, keine weitere
 * Zuordnung/Kaderzeile, keine andere Nachmeldung) — sonst bleibt es erhalten.
 */
export async function deleteRosterPlayer(seasonId: string, teamId: string, rowId: string, playerId: string | null): Promise<{ error: string | null; warning?: string }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  // Kaderzeile (echte season_roster-Zeile; Nachmeldungs-Zeilen haben pa-…-Ids).
  if (!rowId.startsWith('pa-')) {
    const { error } = await supabase.from('season_roster_assignments').delete().eq('id', rowId);
    if (error) return { error: error.message };
  }
  if (playerId) {
    await supabase.from('player_assignments').delete().eq('season_id', seasonId).eq('team_id', teamId).eq('player_id', playerId);
    const [{ data: prof }, { data: otherRoster }, { data: otherAssign }] = await Promise.all([
      supabase.from('profiles').select('id').eq('player_id', playerId).limit(1),
      supabase.from('season_roster_assignments').select('id').eq('player_id', playerId).limit(1),
      supabase.from('player_assignments').select('id').eq('player_id', playerId).limit(1),
    ]);
    const stillUsed = (prof?.length ?? 0) > 0 || (otherRoster?.length ?? 0) > 0 || (otherAssign?.length ?? 0) > 0;
    if (!stillUsed) {
      await supabase.from('player_nominations').delete().eq('player_id', playerId);
      await supabase.from('players').delete().eq('id', playerId);
    } else if ((prof?.length ?? 0) > 0) {
      return { error: null, warning: 'Aus dem Kader entfernt. Das Spielerprofil bleibt erhalten (ein Konto ist damit verknüpft).' };
    }
  }
  return { error: null };
}

/** Spielstätte eines Saison-Teams ändern. Sucht eine passende Venue (Name +
 *  Adresse, tolerant) und verwendet sie wieder – sonst wird eine neue angelegt.
 *  Danach zeigt das Team auf diese Venue (kein Umbenennen der alten). */
export async function setSeasonTeamVenue(seasonId: string, teamId: string, name: string, address: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const nm = name.trim(), addr = address.trim();
  if (!nm) return { error: 'Bitte einen Namen für die Spielstätte angeben.' };
  const norm = (s: string | null) => (s ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  const { data: venues } = await supabase.from('venues').select('id, name, address');
  let venueId = ((venues ?? []) as { id: string; name: string; address: string | null }[])
    .find(v => norm(v.name) === norm(nm) && norm(v.address) === norm(addr))?.id ?? null;
  if (!venueId) {
    const rnd = (globalThis.crypto?.randomUUID?.() ?? `${Math.random()}${Math.random()}`).replace(/[^a-z0-9]/gi, '').slice(0, 10);
    venueId = `venue-${rnd}`;
    const { error: ve } = await supabase.from('venues').insert({ id: venueId, name: nm, address: addr || null });
    if (ve) return { error: ve.message };
  }
  const { error } = await supabase.from('season_team_assignments')
    .update({ venue_id: venueId }).eq('season_id', seasonId).eq('team_id', teamId);
  return { error: error?.message ?? null };
}

/** Neuen Spieler zum Kader eines freigegebenen Teams hinzufügen (Status
 *  pending_review → bekommt beim nächsten Freigeben Profil + Passnummer). */
export async function addRosterPlayer(seasonId: string, teamId: string, first: string, last: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  if (!first.trim() && !last.trim()) return { error: 'Bitte einen Namen angeben.' };
  const { error } = await supabase.from('season_roster_assignments').insert({
    season_id: seasonId, team_id: teamId,
    first_name: first.trim(), last_name: last.trim(),
    is_captain: false, status: 'pending_review',
  });
  return { error: error?.message ?? null };
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
): Promise<{ finalized: number; created?: number; linked?: number; ambiguous?: string[]; nameless?: number; error: string | null }> {
  if (!supabase || !seasonId || !teamId) return { finalized: 0, error: 'Supabase ist nicht konfiguriert.' };

  const { data: rows, error: loadErr } = await supabase
    .from('season_roster_assignments')
    .select('id, first_name, last_name, player_id, is_captain, license_number, registration_player_id')
    .eq('season_id', seasonId).eq('team_id', teamId).eq('status', 'pending_review');
  if (loadErr) return { finalized: 0, error: loadErr.message };
  const todo = ((rows ?? []) as { id: string; first_name: string; last_name: string; player_id: string | null; is_captain: boolean; license_number: string | null; registration_player_id: string | null }[])
    .filter(r => !r.license_number);   // schon vergebene nicht doppelt behandeln
  if (todo.length === 0) return { finalized: 0, error: null };

  // Fehlt Vor- UND Nachname (Altbestand: in der Anmeldung war nur ein display_name
  // gesetzt, der nie in Vor-/Nachname aufgeteilt wurde), den Namen aus dem
  // display_name der Anmeldung ableiten und in der Kaderzeile nachtragen — statt
  // die ganze Vergabe abzubrechen.
  const missing = todo.filter(r => !`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() && r.registration_player_id);
  if (missing.length) {
    const regIds = missing.map(r => r.registration_player_id!) as string[];
    const { data: rp } = await supabase.from('team_registration_players').select('id, display_name').in('id', regIds);
    const dn = new Map(((rp ?? []) as { id: string; display_name: string | null }[]).map(r => [r.id, r.display_name ?? '']));
    for (const r of missing) {
      const s = splitName(dn.get(r.registration_player_id!) ?? '');
      if (s.first || s.last) {
        r.first_name = s.first; r.last_name = s.last;
        await supabase.from('season_roster_assignments').update({ first_name: s.first, last_name: s.last }).eq('id', r.id);
      }
    }
  }

  // Schutz: niemals namenlose Profile anlegen. Namenlose Zeilen werden hier NUR
  // übersprungen (nicht mehr die ganze Vergabe blockiert!) — sonst hätte eine
  // einzige leere Zeile früher verhindert, dass ALLE anderen Spieler bei der
  // Freigabe automatisch ihre Passnummer bekommen. Die benannten Spieler werden
  // verarbeitet; die namenlosen bleiben „in Prüfung" und werden am Ende gemeldet.
  const nameless = todo.filter(r => !`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim());
  const work = todo.filter(r => `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim());
  if (work.length === 0) {
    return { finalized: 0, nameless: nameless.length || undefined,
      error: nameless.length ? `${nameless.length} Kaderzeile(n) ohne Namen — bitte zuerst die Namen ergänzen, dann erneut freigeben.` : null };
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

  // Bestehende Spieler nach Namen indexieren, damit Teamwechsler WIEDERVERWENDET
  // werden (statt eine Dublette anzulegen) — Passnummer + Historie bleiben am
  // bestehenden Profil. Zusätzlich license je Id, um die permanente Nummer zu ziehen.
  const { data: allP } = await supabase.from('players')
    .select('id, first_name, last_name, display_name, license_number');
  const byName = new Map<string, string[]>();       // normalisierter Name → [playerId]
  const licById = new Map<string, string | null>(); // playerId → Passnummer
  const indexName = (name: string, id: string) => {
    const key = normalizePersonName(name); if (!key) return;
    const arr = byName.get(key) ?? []; if (!arr.includes(id)) arr.push(id); byName.set(key, arr);
  };
  for (const p of (allP ?? []) as { id: string; first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null }[]) {
    licById.set(p.id, p.license_number ?? null);
    indexName(`${p.first_name ?? ''} ${p.last_name ?? ''}`, p.id);
    if (p.display_name) indexName(p.display_name, p.id);
  }

  // Kapitäns-Konto (captain_user_id) für die Auto-Verknüpfung Konto ↔ TC-Profil.
  const { data: staRow } = await supabase.from('season_team_assignments')
    .select('captain_user_id').eq('season_id', seasonId).eq('team_id', teamId).maybeSingle();
  const captainUserId = (staRow as { captain_user_id: string | null } | null)?.captain_user_id ?? null;
  // Verknüpft das Kapitäns-Konto mit dem TC-Spielerprofil — nur, wenn das Konto
  // noch keinen Spieler hat (nichts überschreiben). Best effort, blockiert die
  // Freigabe nicht. RLS: profiles_update_admin erlaubt das dem Admin.
  const linkCaptain = async (playerId: string) => {
    if (!captainUserId) return;
    await supabase!.from('profiles')
      .update({ player_id: playerId, team_id: teamId, match_status: 'confirmed' })
      .eq('id', captainUserId).is('player_id', null);
  };

  let created = 0, linked = 0;
  const ambiguous: string[] = [];
  for (const row of work) {
    const fullName = `${row.first_name} ${row.last_name}`.trim();

    // Bestehenden Spieler bestimmen: explizit verknüpft ODER eindeutiger Namenstreffer.
    let existingId: string | null = row.player_id ?? null;
    if (!existingId) {
      const matches = byName.get(normalizePersonName(fullName)) ?? [];
      if (matches.length === 1) existingId = matches[0];
      else if (matches.length > 1) { ambiguous.push(fullName); continue; } // mehrdeutig → manuell
    }

    if (existingId) {
      // Wiederverwenden: nur neue Saison-/Team-Zuordnung + Kaderzeile, KEINE neue
      // Passnummer (permanente Nummer + Historie am bestehenden Profil bleiben).
      const lic = licById.get(existingId) ?? null;
      const { error: ae } = await supabase.from('player_assignments').upsert(
        { id: `pa-reg-${row.id}`, season_id: seasonId, team_id: teamId, player_id: existingId, status: 'active', is_captain: row.is_captain, source: 'registration' },
        { onConflict: 'id' });
      if (ae) return { finalized: created + linked, error: `Zuordnung ${fullName}: ${ae.message}` };
      const { error: ue } = await supabase.from('season_roster_assignments')
        .update({ player_id: existingId, license_number: lic, status: 'active' }).eq('id', row.id);
      if (ue) return { finalized: created + linked, error: `Kader ${fullName}: ${ue.message}` };
      if (row.is_captain) {
        await supabase.from('season_team_assignments')
          .update({ captain_player_id: existingId }).eq('season_id', seasonId).eq('team_id', teamId);
        await linkCaptain(existingId);
      }
      linked++;
      continue;
    }

    // Wirklich neuer Spieler → Profil + Passnummer anlegen.
    const gen  = generateNextPassNumber(teamId, { seasonId, seasonYear, extraUsed, isCaptain: row.is_captain, blockBase });
    const slug = nominationPlayerSlug(row.first_name, row.last_name, gen.number);

    const { error: pe } = await supabase.from('players').upsert(
      { id: slug, first_name: row.first_name, last_name: row.last_name, license_number: gen.license, status: 'active', source: 'registration' },
      { onConflict: 'id' });
    if (pe) return { finalized: created + linked, error: `Spieler ${fullName}: ${pe.message}` };

    const { error: ae } = await supabase.from('player_assignments').upsert(
      { id: `pa-reg-${row.id}`, season_id: seasonId, team_id: teamId, player_id: slug, status: 'active', is_captain: row.is_captain, source: 'registration' },
      { onConflict: 'id' });
    if (ae) return { finalized: created + linked, error: `Zuordnung ${fullName}: ${ae.message}` };

    const { error: ue } = await supabase.from('season_roster_assignments')
      .update({ player_id: slug, license_number: gen.license, status: 'active' }).eq('id', row.id);
    if (ue) return { finalized: created + linked, error: `Kader ${fullName}: ${ue.message}` };

    if (row.is_captain) {
      await supabase.from('season_team_assignments')
        .update({ captain_player_id: slug }).eq('season_id', seasonId).eq('team_id', teamId);
      await linkCaptain(slug);
    }

    // Neu angelegten Spieler indexieren (falls zwei gleiche Namen im selben Kader).
    indexName(fullName, slug); licById.set(slug, gen.license);
    extraUsed.push(gen.number);
    created++;
  }
  return { finalized: created + linked, created, linked, ambiguous: ambiguous.length ? ambiguous : undefined, nameless: nameless.length || undefined, error: null };
}

/** Ergebnis des Namensabgleichs eines Anmelde-Kadereintrags gegen den Bestand. */
export type RosterNameMatch = {
  status: 'known' | 'ambiguous' | 'new';
  playerId?: string;
  licenseNumber?: string | null;
};

/**
 * Gleicht eingetippte Anmelde-Kadernamen gegen den echten Spieler-Bestand (DB
 * `players`) ab — mit EXAKT derselben Namenslogik wie finalizeNewRosterPlayers.
 * So lässt sich schon VOR der Freigabe ehrlich anzeigen, wer bereits bekannt ist
 * (→ wird wiederverwendet), wer mehrdeutig ist und wer wirklich neu.
 *
 * Rückgabe ist index-gleich zur Eingabe. Nur DB-Zugriff, kein Schreiben.
 */
export async function matchRegistrationRosterToDbPlayers(
  rows: { first_name?: string | null; last_name?: string | null; display_name?: string | null }[],
): Promise<RosterNameMatch[]> {
  if (!supabase || rows.length === 0) return rows.map(() => ({ status: 'new' as const }));

  const { data: allP } = await supabase.from('players')
    .select('id, first_name, last_name, display_name, license_number');
  const byName = new Map<string, string[]>();
  const licById = new Map<string, string | null>();
  const indexName = (name: string, id: string) => {
    const key = normalizePersonName(name); if (!key) return;
    const arr = byName.get(key) ?? []; if (!arr.includes(id)) arr.push(id); byName.set(key, arr);
  };
  for (const p of (allP ?? []) as { id: string; first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null }[]) {
    licById.set(p.id, p.license_number ?? null);
    indexName(`${p.first_name ?? ''} ${p.last_name ?? ''}`, p.id);
    if (p.display_name) indexName(p.display_name, p.id);
  }

  return rows.map(r => {
    // Wie finalize: primär Vor-/Nachname, ersatzweise der Anzeigename.
    const candidates = [`${r.first_name ?? ''} ${r.last_name ?? ''}`, r.display_name ?? '']
      .map(normalizePersonName).filter(Boolean);
    let ids: string[] = [];
    for (const key of candidates) { const m = byName.get(key); if (m && m.length) { ids = m; break; } }
    if (ids.length === 1) return { status: 'known', playerId: ids[0], licenseNumber: licById.get(ids[0]) ?? null };
    if (ids.length > 1) return { status: 'ambiguous' };
    return { status: 'new' };
  });
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

/**
 * Team-/Kader-Kontext für den eingeloggten Kapitän: die NEUESTE Saison-
 * Zuordnung seines Teams (z. B. eine neu angemeldete 2026/2027-Mannschaft, auch
 * wenn die aktive Saison noch 2025/2026 ist) inkl. DB-Teamname, Kürzel, Liga und
 * Kader. Liefert null, wenn das Team keine DB-Saisonzuordnung hat (dann greift
 * der statische Pfad wie bisher).
 */
/** Saisons, für die dieses Team einen DB-Kader hat (neueste zuerst). */
export async function listCaptainTeamSeasons(teamId: string): Promise<{ seasonId: string; seasonName: string | null }[]> {
  if (!supabase || !teamId) return [];
  const { data } = await supabase
    .from('season_team_assignments')
    .select('season_id, seasons:season_id(name)')
    .eq('team_id', teamId).order('season_id', { ascending: false });
  const seen = new Set<string>();
  const out: { seasonId: string; seasonName: string | null }[] = [];
  for (const r of (data ?? []) as unknown as { season_id: string; seasons: { name: string } | null }[]) {
    if (seen.has(r.season_id)) continue;
    seen.add(r.season_id);
    out.push({ seasonId: r.season_id, seasonName: r.seasons?.name ?? null });
  }
  return out;
}

export async function getCaptainTeamView(teamId: string, seasonId?: string): Promise<{
  seasonId: string; seasonName: string | null; teamName: string; shortName: string | null; leagueId: string | null;
  roster: { name: string; license: string | null; isCaptain: boolean; playerId: string | null; status: string }[];
} | null> {
  if (!supabase || !teamId) return null;
  const base = supabase
    .from('season_team_assignments')
    .select('season_id, assigned_competition_id, teams:team_id(name, short_name), seasons:season_id(name)')
    .eq('team_id', teamId);
  // Bestimmte Saison, sonst die neueste.
  const { data: sta } = seasonId
    ? await base.eq('season_id', seasonId).limit(1)
    : await base.order('season_id', { ascending: false }).limit(1);
  const top = (sta ?? [])[0] as unknown as {
    season_id: string; assigned_competition_id: string | null;
    teams: { name: string; short_name: string | null } | null; seasons: { name: string } | null;
  } | undefined;
  if (!top) return null;
  const { data: roster } = await supabase
    .from('season_roster_assignments')
    .select('first_name, last_name, license_number, is_captain, player_id, status')
    .eq('season_id', top.season_id).eq('team_id', teamId).order('is_captain', { ascending: false });
  const rrows = (roster ?? []) as { first_name: string | null; last_name: string | null; license_number: string | null; is_captain: boolean; player_id: string | null; status: string }[];
  const licById = await currentLicensesClient(rrows.map(r => r.player_id));
  return {
    seasonId: top.season_id,
    seasonName: top.seasons?.name ?? null,
    teamName: top.teams?.name ?? teamId,
    shortName: top.teams?.short_name ?? null,
    leagueId: top.assigned_competition_id ?? null,
    roster: rrows.map(r => ({
      name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(),
      license: (r.player_id && licById.get(r.player_id)) || r.license_number,
      isCaptain: r.is_captain, playerId: r.player_id, status: r.status,
    })),
  };
}

/** Einzelner DB-Teamname (Fallback, wenn nicht im statischen Stamm). */
export async function getDbTeamName(teamId: string): Promise<{ name: string; shortName: string | null } | null> {
  if (!supabase || !teamId) return null;
  const { data } = await supabase.from('teams').select('name, short_name').eq('id', teamId).maybeSingle();
  const t = data as { name: string | null; short_name: string | null } | null;
  return t ? { name: (t.name ?? '').trim() || teamId, shortName: t.short_name ?? null } : null;
}

/** Einzelner DB-Spielername (Fallback, wenn nicht im statischen Stamm). */
export async function getDbPlayerName(playerId: string): Promise<{ name: string; license: string | null } | null> {
  if (!supabase || !playerId) return null;
  const { data } = await supabase.from('players').select('first_name, last_name, display_name, license_number').eq('id', playerId).maybeSingle();
  const p = data as { first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null } | null;
  if (!p) return null;
  return { name: (p.display_name ?? `${p.first_name ?? ''} ${p.last_name ?? ''}`).trim() || playerId, license: p.license_number ?? null };
}

/** Gesamter Saisonkader einer Saison (zum Gruppieren je Team). */
export async function listSeasonRoster(seasonId: string): Promise<SeasonRosterRow[]> {
  if (!supabase || !seasonId) return [];
  const { data } = await supabase
    .from('season_roster_assignments')
    .select('id, season_id, team_id, player_id, first_name, last_name, license_number, is_captain, status, registration_id')
    .eq('season_id', seasonId)
    .order('is_captain', { ascending: false });
  const rows = (data ?? []) as SeasonRosterRow[];

  // Bestätigte Nachmeldungen stehen in player_assignments (source 'nomination'),
  // NICHT in season_roster_assignments — sonst fehlen sie im Kader. Ergänzen wir
  // hier, dedupliziert nach player_id (Freigabe-Spieler stehen schon oben).
  const existing = new Set(rows.map(r => r.player_id).filter(Boolean) as string[]);
  const { data: nomAssign } = await supabase
    .from('player_assignments')
    .select('id, team_id, player_id, is_captain')
    .eq('season_id', seasonId).eq('source', 'nomination').eq('status', 'active');
  const nomNew = ((nomAssign ?? []) as { id: string; team_id: string; player_id: string | null; is_captain: boolean | null }[])
    .filter(a => a.player_id && !existing.has(a.player_id));
  if (nomNew.length) {
    const ids = [...new Set(nomNew.map(a => a.player_id as string))];
    const { data: pl } = await supabase.from('players').select('id, first_name, last_name, license_number').in('id', ids);
    const pmap = new Map(((pl ?? []) as { id: string; first_name: string | null; last_name: string | null; license_number: string | null }[]).map(p => [p.id, p]));
    for (const a of nomNew) {
      const p = pmap.get(a.player_id as string);
      rows.push({
        id: a.id, season_id: seasonId, team_id: a.team_id, player_id: a.player_id,
        first_name: p?.first_name ?? '', last_name: p?.last_name ?? '',
        license_number: p?.license_number ?? null, is_captain: !!a.is_captain,
        status: 'active', registration_id: null,
      });
    }
  }

  // Aktuelle Passnummer des verknüpften Spielers hat Vorrang vor der (ggf.
  // veralteten) Vorlagen-Nummer — separat, da player_id keinen FK auf players hat.
  const licById = await currentLicensesClient(rows.map(r => r.player_id));
  return rows.map(r => ({ ...r, license_number: (r.player_id && licById.get(r.player_id)) || r.license_number }));
}
