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
  'instagram_url' | 'facebook_url' | 'website_url' | 'notes'>;

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

// ── Lesen ─────────────────────────────────────────────────────

/** Eigene Anmeldungen (RLS filtert automatisch auf submitted_by). */
export async function listMyRegistrations(): Promise<TeamRegistration[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('team_registrations')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as TeamRegistration[];
}

/** Alle Anmeldungen (nur für Admins per RLS sichtbar). */
export async function listAllRegistrations(): Promise<TeamRegistration[]> {
  return listMyRegistrations(); // gleiche Query — RLS entscheidet über Sichtbarkeit
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

/** Ersetzt den Kader einer Anmeldung (löscht + neu einfügen). */
async function replacePlayers(registrationId: string, players: RegistrationPlayer[]): Promise<string | null> {
  if (!supabase) return NOT_CONFIGURED;
  await supabase.from('team_registration_players').delete().eq('registration_id', registrationId);
  if (players.length === 0) return null;
  const rows = players.map(p => ({
    registration_id: registrationId,
    player_id: p.player_id,
    first_name: p.first_name,
    last_name: p.last_name,
    display_name: p.display_name,
    license_number: p.license_number,
    is_captain: p.is_captain,
    is_existing_player: p.is_existing_player,
    status: p.status,
  }));
  const { error } = await supabase.from('team_registration_players').insert(rows);
  return error?.message ?? null;
}

/** Anmeldung einreichen (draft/changes_requested → submitted). */
export async function submitRegistration(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
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
