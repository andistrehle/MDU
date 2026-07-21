// ============================================================
// Supabase-Datenzugriff: Mannschaftsanmeldungen (Sprint)
// ============================================================
//
// CRUD + Workflow für team_registrations / team_registration_players.
// RLS in der DB (migrations/0003) erzwingt die Berechtigungen — diese
// Helper sind nur die Client-Schicht. Kein service_role.
// ============================================================

import { supabase } from './client';

export type RegistrationStatus =
  | 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'changes_requested';

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  draft:             'Entwurf',
  submitted:         'Eingereicht',
  in_review:         'In Prüfung',
  approved:          'Freigegeben',
  rejected:          'Abgelehnt',
  changes_requested: 'Nachbesserung erforderlich',
};

export interface RegistrationPlayer {
  id?: string;
  registration_id?: string;
  player_id: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  license_number: string | null;
  is_captain: boolean;
  is_existing_player: boolean;
  status: string;
}

export interface TeamRegistration {
  id: string;
  season_id: string;
  source_team_id: string | null;
  is_new_team: boolean;
  team_name: string;
  short_name: string | null;
  description: string | null;
  logo_url: string | null;
  team_image_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_info: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  website_url: string | null;
  notes: string | null;
  /** Gewünschte Hauptliga (la_liga|a_liga|b_liga|c_liga) — Wahl des Teamkapitäns. */
  requested_league: string | null;
  status: RegistrationStatus;
  review_note: string | null;
  submitted_by: string;
  reviewed_by: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Übernahme-/Ergebnisfelder (Migration 0008)
  result_team_id?: string | null;
  applied_at?: string | null;
  application_status?: string | null;
  application_error?: string | null;
  requested_competition_id?: string | null;
  assigned_competition_id?: string | null;
}

/** Editierbare Felder einer Anmeldung (ohne Workflow-/Meta-Spalten). */
export type RegistrationDraft = Pick<TeamRegistration,
  'season_id' | 'source_team_id' | 'is_new_team' | 'team_name' | 'short_name' | 'description' |
  'logo_url' | 'team_image_url' | 'venue_name' | 'venue_address' | 'venue_info' |
  'contact_name' | 'contact_email' | 'contact_phone' |
  'instagram_url' | 'facebook_url' | 'website_url' | 'notes' | 'requested_league'>;

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

// ── Lesen ─────────────────────────────────────────────────────

/**
 * Eigene Anmeldungen. WICHTIG: explizit auf das eigene Konto filtern —
 * Admins dürfen per RLS ALLE lesen, „Meine Anmeldungen" soll aber nur die
 * selbst eingereichten zeigen (sonst tauchen fremde Teams auf).
 */
export async function listMyRegistrations(): Promise<TeamRegistration[]> {
  if (!supabase) return [];
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return [];
  const { data } = await supabase
    .from('team_registrations')
    .select('*')
    .eq('submitted_by', uid)
    .order('created_at', { ascending: false });
  return (data ?? []) as TeamRegistration[];
}

/** Alle Anmeldungen (nur für Admins per RLS sichtbar) — NICHT auf das eigene
 *  Konto gefiltert; RLS entscheidet über die Sichtbarkeit (Admin sieht alle). */
export async function listAllRegistrations(): Promise<TeamRegistration[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('team_registrations')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as TeamRegistration[];
}

export async function getRegistration(id: string): Promise<TeamRegistration | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('team_registrations').select('*').eq('id', id).maybeSingle();
  return (data as TeamRegistration) ?? null;
}

export async function getRegistrationPlayers(registrationId: string): Promise<RegistrationPlayer[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('team_registration_players')
    .select('*')
    .eq('registration_id', registrationId)
    .order('created_at', { ascending: true });
  return (data ?? []) as RegistrationPlayer[];
}

// ── Schreiben ─────────────────────────────────────────────────

/** Legt einen Entwurf an und gibt die neue id zurück. */
export async function createRegistration(
  draft: RegistrationDraft,
  players: RegistrationPlayer[],
): Promise<{ id: string | null; error: string | null }> {
  if (!supabase) return { id: null, error: NOT_CONFIGURED };
  const { data, error } = await supabase
    .from('team_registrations')
    .insert({ ...draft, status: 'draft' })
    .select('id')
    .maybeSingle();
  if (error || !data) return { id: null, error: error?.message ?? 'Anlegen fehlgeschlagen.' };
  const id = (data as { id: string }).id;
  const perr = await replacePlayers(id, players);
  return { id, error: perr };
}

/** Aktualisiert einen Entwurf inkl. Kader. */
export async function updateRegistration(
  id: string,
  draft: Partial<RegistrationDraft>,
  players: RegistrationPlayer[],
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('team_registrations').update(draft).eq('id', id);
  if (error) return { error: error.message };
  const perr = await replacePlayers(id, players);
  return { error: perr };
}

/**
 * Zerlegt einen angezeigten Namen in Vor-/Nachname. Neue Spieler werden im
 * Formular über EIN Feld (`display_name`) erfasst — damit die Kaderübernahme
 * (die `first_name`/`last_name` kopiert) nicht leere Namen weiterreicht, leiten
 * wir die beiden Felder hier ab: letztes Wort = Nachname, Rest = Vorname.
 */
export function splitDisplayName(display: string): { first: string; last: string } {
  const parts = (display ?? '').trim().replace(/\s+/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

/** Ersetzt den Kader einer Anmeldung (löscht + neu einfügen). */
async function replacePlayers(registrationId: string, players: RegistrationPlayer[]): Promise<string | null> {
  if (!supabase) return NOT_CONFIGURED;
  await supabase.from('team_registration_players').delete().eq('registration_id', registrationId);
  if (players.length === 0) return null;
  const rows = players.map(p => {
    let first = (p.first_name ?? '').trim();
    let last = (p.last_name ?? '').trim();
    // Neuer Spieler nur über display_name erfasst → Vor-/Nachname ableiten.
    if (!first && !last && (p.display_name ?? '').trim()) {
      const s = splitDisplayName(p.display_name);
      first = s.first; last = s.last;
    }
    return {
      registration_id: registrationId,
      player_id: p.player_id,
      first_name: first,
      last_name: last,
      display_name: (p.display_name ?? '').trim() || `${first} ${last}`.trim(),
      license_number: p.license_number,
      is_captain: p.is_captain,
      is_existing_player: p.is_existing_player,
      status: p.status,
    };
  });
  const { error } = await supabase.from('team_registration_players').insert(rows);
  return error?.message ?? null;
}

/** Ziel-Saison einer Anmeldung setzen (nur Admin per RLS). */
export async function updateRegistrationSeason(id: string, seasonId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('team_registrations').update({ season_id: seasonId }).eq('id', id);
  return { error: error?.message ?? null };
}

/** Endgültige Staffel (assigned_competition_id) setzen — Entscheidung der Ligaleitung. */
export async function updateRegistrationAssignedCompetition(id: string, code: string | null): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('team_registrations').update({ assigned_competition_id: code }).eq('id', id);
  return { error: error?.message ?? null };
}

/**
 * Automatisches Team-Kürzel aus dem Namen (3 Großbuchstaben), im Stil der
 * bestehenden Teams: Initialen der Wörter (Funny Darters Munich → FDM,
 * DC Null Bull → DNB), bei zwei Wörtern erster Buchstabe + erste zwei des
 * zweiten (Belfort Evolution → BEV), bei einem Wort die ersten drei (Spartans →
 * SPA). Nur ein Vorschlag — die Ligaleitung/der Kapitän kann ihn überschreiben.
 */
export function deriveTeamShortName(name: string): string {
  const words = (name ?? '').trim().split(/\s+/).map(w => w.replace(/[^A-Za-z0-9]/g, '')).filter(Boolean);
  if (words.length === 0) return '';
  let code: string;
  if (words.length >= 3) code = words[0][0] + words[1][0] + words[2][0];
  else if (words.length === 2) code = words[0][0] + words[1].slice(0, 2);
  else code = words[0].slice(0, 3);
  code = code.toUpperCase();
  if (code.length < 3) code = (code + words.join('').toUpperCase()).slice(0, 3);
  return code.slice(0, 3);
}

/** Locker normalisieren für Spielstätten-Abgleich: Groß/klein, ß→ss,
 *  „straße"/„strasse"→„str", alle Sonderzeichen/Leerzeichen raus.
 *  So matchen „Gleichmannstr.6" und „Gleichmannstraße 6". */
function normalizeLoose(s: string | null | undefined): string {
  return (s ?? '').toLowerCase().replace(/ß/g, 'ss').replace(/strasse/g, 'str').replace(/[^a-z0-9]/g, '');
}

/**
 * Vor der Freigabe die Spielstätte der Anmeldung mit dem Bestand abgleichen:
 * Gibt es (schreibweisen-tolerant) schon eine passende Spielstätte, wird die
 * Anmeldung auf deren kanonische Schreibweise angeglichen — dann findet die
 * Freigabe-RPC sie per exaktem Vergleich wieder und legt KEINE Dublette an.
 * Gibt es keine → bleibt alles, die RPC erstellt die neue Spielstätte.
 */
async function reconcileVenue(registrationId: string): Promise<void> {
  if (!supabase) return;
  const { data: reg } = await supabase.from('team_registrations')
    .select('venue_name, venue_address').eq('id', registrationId).single();
  const r = reg as { venue_name: string | null; venue_address: string | null } | null;
  if (!r || !(r.venue_name ?? '').trim()) return;
  const { data: venues } = await supabase.from('venues').select('id, name, address');
  const nName = normalizeLoose(r.venue_name), nAddr = normalizeLoose(r.venue_address);
  const match = ((venues ?? []) as { id: string; name: string; address: string | null }[])
    .find(v => normalizeLoose(v.name) === nName && normalizeLoose(v.address) === nAddr);
  if (match && (match.name !== r.venue_name || (match.address ?? '') !== (r.venue_address ?? ''))) {
    await supabase.from('team_registrations')
      .update({ venue_name: match.name, venue_address: match.address }).eq('id', registrationId);
  }
}

/** Für ein NEUES Team ohne Kurznamen automatisch eines setzen (idempotent). */
async function ensureShortName(registrationId: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase
    .from('team_registrations')
    .select('team_name, short_name, is_new_team').eq('id', registrationId).single();
  const r = data as { team_name: string | null; short_name: string | null; is_new_team: boolean } | null;
  if (r && r.is_new_team && !(r.short_name ?? '').trim() && (r.team_name ?? '').trim()) {
    const short = deriveTeamShortName(r.team_name!);
    if (short) await supabase.from('team_registrations').update({ short_name: short }).eq('id', registrationId);
  }
}

/** Anmeldung einreichen (draft/changes_requested → submitted). */
export async function submitRegistration(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  await ensureShortName(id);   // neues Team ohne Kürzel → automatisch vergeben
  const { error } = await supabase
    .from('team_registrations')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', id);
  return { error: error?.message ?? null };
}

/**
 * Statuswechsel durch Ligaleitung/Super Admin (RLS prüft Admin-Recht).
 *
 * Bei status === 'approved' wird NICHT nur der Status gesetzt, sondern die
 * atomare RPC apply_team_registration() ausgeführt (Team + Saisonzuordnung +
 * Kader anlegen, idempotent). Erst wenn die Übernahme vollständig erfolgreich
 * war, gilt die Anmeldung als freigegeben — kein optischer Teilerfolg.
 *
 * Für aktive Ziel-Saison verlangt die RPC eine ausdrückliche Bestätigung
 * (allowActiveSeason) — sonst wird der Fehler 'ACTIVE_SEASON' zurückgegeben.
 */
export async function reviewRegistration(
  id: string,
  status: Extract<RegistrationStatus, 'in_review' | 'approved' | 'rejected' | 'changes_requested'>,
  reviewNote?: string,
): Promise<{ error: string | null; resultTeamId?: string | null; activeSeasonWarning?: boolean }> {
  if (!supabase) return { error: NOT_CONFIGURED };

  if (status === 'approved') {
    return applyApprovedTeamRegistration(id, { reviewNote });
  }

  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('team_registrations')
    .update({
      status,
      review_note: reviewNote ?? null,
      reviewed_by: auth.user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { error: error?.message ?? null };
}

/**
 * Freigabe + automatische Übernahme über die serverseitige RPC. Idempotent,
 * atomar (Rollback bei Fehler), saisongetrennt. Setzt vorab review_note,
 * danach erledigt die RPC den Statuswechsel auf approved.
 */
export async function applyApprovedTeamRegistration(
  registrationId: string,
  opts: { reviewNote?: string; allowActiveSeason?: boolean } = {},
): Promise<{ error: string | null; resultTeamId?: string | null; activeSeasonWarning?: boolean }> {
  if (!supabase) return { error: NOT_CONFIGURED };

  // Neues Team ohne Kürzel → vor der Übernahme automatisch eines setzen, damit
  // das angelegte Team nicht ohne Kurzname bleibt (auch für früher eingereichte).
  await ensureShortName(registrationId);
  // Spielstätte schreibweisen-tolerant mit dem Bestand abgleichen (keine Dubletten).
  await reconcileVenue(registrationId);

  // Begründung/Anmerkung vorab speichern (RPC kümmert sich um den Status).
  if (opts.reviewNote !== undefined) {
    await supabase.from('team_registrations').update({ review_note: opts.reviewNote || null }).eq('id', registrationId);
  }

  const { data, error } = await supabase.rpc('apply_team_registration', {
    p_registration_id: registrationId,
    p_allow_active: opts.allowActiveSeason ?? false,
  });

  if (error) {
    // PostgREST verpackt RAISE-Meldungen in error.message
    if (error.message?.includes('ACTIVE_SEASON')) {
      return { error: null, activeSeasonWarning: true };
    }
    return { error: error.message };
  }

  const res = (data ?? {}) as { ok?: boolean; error?: string; team_id?: string | null };
  if (res.ok === false) return { error: res.error ?? 'Automatische Übernahme fehlgeschlagen.' };
  return { error: null, resultTeamId: res.team_id ?? null };
}
