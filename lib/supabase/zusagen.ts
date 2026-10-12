// ============================================================
// Zu- und Absagen je Spieltag (Migration 0043) — Browser-Seite
// ============================================================
//
// Keine Zeile = „offen“. Rechte prüft die DB (RLS): Spieler nur sich selbst,
// Kapitän das ganze Team, Ligaleitung alles. Keine harte Frist.
// ============================================================

import { supabase } from './client';
import { NEUE_SAISON } from '@/lib/data/saison-2027';

export type ZusageStatus = 'yes' | 'no' | 'maybe';

/** Mindestlänge der Begründung bei Absage und „unsicher“ (DB-Check, Migration 0044). */
export const GRUND_MIN = 5;
export const braucheGrund = (s: ZusageStatus | null) => s === 'no' || s === 'maybe';

export interface Zusage {
  match_key: string;
  team_id: string;
  player_id: string;
  player_name: string;
  status: ZusageStatus;
  note: string | null;
  updated_by: string | null;
  updated_at: string;
}

export const NOTIZ_MAX = 140;
export const ERINNERUNG_VORGABE = 7;

const fehlt = (e: { message?: string; code?: string } | null) =>
  !!e && (e.code === '42P01' || /match_availability|team_availability_settings/.test(e.message ?? ''));

/** Alle Zu-/Absagen eines Teams in der laufenden Saison. `bereit: false` = Migration 0043 fehlt. */
export async function ladeZusagen(teamId: string): Promise<{ rows: Zusage[]; bereit: boolean; error: string | null }> {
  if (!supabase) return { rows: [], bereit: false, error: 'Supabase ist nicht konfiguriert.' };
  const { data, error } = await supabase.from('match_availability')
    .select('match_key, team_id, player_id, player_name, status, note, updated_by, updated_at')
    .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId);
  if (fehlt(error)) return { rows: [], bereit: false, error: null };
  return { rows: (data ?? []) as Zusage[], bereit: true, error: error?.message ?? null };
}

/** Zu- oder Absage setzen (status) bzw. zurück auf „offen“ (status null). */
export async function setzeZusage(p: {
  matchKey: string; teamId: string; playerId: string; playerName: string;
  status: ZusageStatus | null; note?: string | null; label: string; userId: string;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const key = { season_id: NEUE_SAISON.id, match_key: p.matchKey, team_id: p.teamId, player_id: p.playerId };
  if (p.status === null) {
    const { error } = await supabase.from('match_availability').delete().match(key);
    return { error: error ? 'Konnte nicht zurücksetzen: ' + error.message : null };
  }
  const note = (p.note ?? '').trim().slice(0, NOTIZ_MAX) || null;
  if (braucheGrund(p.status) && (note ?? '').length < GRUND_MIN) {
    return { error: `Bitte gib eine Begründung an (mindestens ${GRUND_MIN} Zeichen).` };
  }
  const { error } = await supabase.from('match_availability').upsert({
    ...key, player_name: p.playerName, status: p.status, note, label: p.label,
    updated_by: p.userId, updated_at: new Date().toISOString(),
  });
  return { error: error ? 'Konnte nicht speichern: ' + error.message : null };
}

/** Ab wie vielen Tagen vor dem Spiel die Erinnerung kommt (0 = aus). */
export async function ladeErinnerung(teamId: string): Promise<number> {
  if (!supabase) return ERINNERUNG_VORGABE;
  const { data } = await supabase.from('team_availability_settings').select('reminder_days').eq('team_id', teamId).maybeSingle();
  return (data as { reminder_days?: number } | null)?.reminder_days ?? ERINNERUNG_VORGABE;
}

export async function setzeErinnerung(teamId: string, tage: number, userId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase.from('team_availability_settings')
    .upsert({ team_id: teamId, reminder_days: tage, updated_by: userId, updated_at: new Date().toISOString() });
  return { error: error ? 'Konnte nicht speichern: ' + error.message : null };
}
