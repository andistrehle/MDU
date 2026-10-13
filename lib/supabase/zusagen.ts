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
  /** TC/Ligaleitung setzt für einen anderen Spieler: Begründung freiwillig (Migration 0046). */
  ohneGrund?: boolean;
}): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const key = { season_id: NEUE_SAISON.id, match_key: p.matchKey, team_id: p.teamId, player_id: p.playerId };
  if (p.status === null) {
    const { error } = await supabase.from('match_availability').delete().match(key);
    return { error: error ? 'Konnte nicht zurücksetzen: ' + error.message : null };
  }
  const note = (p.note ?? '').trim().slice(0, NOTIZ_MAX) || null;
  if (braucheGrund(p.status) && !p.ohneGrund && (note ?? '').length < GRUND_MIN) {
    return { error: `Bitte gib eine Begründung an (mindestens ${GRUND_MIN} Zeichen).` };
  }
  const { error } = await supabase.from('match_availability').upsert({
    ...key, player_name: p.playerName, status: p.status, note, label: p.label,
    updated_by: p.userId, updated_at: new Date().toISOString(),
  });
  return { error: error ? 'Konnte nicht speichern: ' + error.message : null };
}

export interface TeamEinstellungen { reminder_days: number; meet_minutes: number }
export const TREFFEN_VORGABE = 30;

/** Erinnerung (Tage vor dem Spiel, 0 = aus) und Treffen-Vorgabe (Minuten vor Beginn, 0 = keins). */
export async function ladeEinstellungen(teamId: string): Promise<TeamEinstellungen> {
  const vorgabe = { reminder_days: ERINNERUNG_VORGABE, meet_minutes: TREFFEN_VORGABE };
  if (!supabase) return vorgabe;
  const voll = await supabase.from('team_availability_settings').select('reminder_days, meet_minutes').eq('team_id', teamId).maybeSingle();
  // meet_minutes erst ab Migration 0045
  const { data } = voll.error ? await supabase.from('team_availability_settings').select('reminder_days').eq('team_id', teamId).maybeSingle() : voll;
  const r = data as Partial<TeamEinstellungen> | null;
  return { reminder_days: r?.reminder_days ?? vorgabe.reminder_days, meet_minutes: r?.meet_minutes ?? vorgabe.meet_minutes };
}

export async function setzeEinstellung(teamId: string, werte: Partial<TeamEinstellungen>, userId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase.from('team_availability_settings')
    .upsert({ team_id: teamId, ...werte, updated_by: userId, updated_at: new Date().toISOString() });
  return { error: error ? 'Konnte nicht speichern: ' + error.message : null };
}

// ── Treffzeit + Aufstellung je Spiel (Migration 0045) ─────────
export interface SpielDetails { match_key: string; meet_time: string | null; lineup: string[]; note?: string | null }
export const SPIEL_NOTIZ_MAX = 500;

export async function ladeDetails(teamId: string): Promise<Record<string, SpielDetails>> {
  if (!supabase) return {};
  const q = (felder: string) => supabase!.from('match_team_details').select(felder).eq('season_id', NEUE_SAISON.id).eq('team_id', teamId);
  let { data, error } = await q('match_key, meet_time, lineup, note');
  // note erst ab Migration 0047
  if (error) ({ data, error } = await q('match_key, meet_time, lineup'));
  if (error) return {};
  return Object.fromEntries(((data ?? []) as unknown as SpielDetails[]).map(r => [r.match_key, r]));
}

export async function setzeDetails(p: { matchKey: string; teamId: string; userId: string; meetTime?: string | null; lineup?: string[]; note?: string | null }): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const werte: Record<string, unknown> = { season_id: NEUE_SAISON.id, match_key: p.matchKey, team_id: p.teamId, updated_by: p.userId, updated_at: new Date().toISOString() };
  if (p.meetTime !== undefined) werte.meet_time = p.meetTime;
  if (p.lineup !== undefined) werte.lineup = p.lineup;
  if (p.note !== undefined) werte.note = (p.note ?? '').trim().slice(0, SPIEL_NOTIZ_MAX) || null;
  const { error } = await supabase.from('match_team_details').upsert(werte);
  return { error: error ? 'Konnte nicht speichern: ' + error.message : null };
}

// ── Aufgaben je Spiel (Migration 0047) ────────────────────────
// Anlegen/Löschen nur TC + Ligaleitung; abhaken darf auch die zugewiesene Person.
export interface Aufgabe {
  id: string; match_key: string; title: string;
  assignee_id: string | null; assignee_name: string | null;
  done: boolean; done_at: string | null; created_at: string;
}
export const AUFGABE_MAX = 120;

export async function ladeAufgaben(teamId: string, matchKey?: string): Promise<Aufgabe[]> {
  if (!supabase) return [];
  let q = supabase.from('match_tasks').select('id, match_key, title, assignee_id, assignee_name, done, done_at, created_at')
    .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId);
  if (matchKey) q = q.eq('match_key', matchKey);
  const { data, error } = await q.order('created_at');
  return error ? [] : (data ?? []) as Aufgabe[];
}

export async function neueAufgabe(p: { matchKey: string; teamId: string; title: string; assignee: { id: string; name: string } | null; label: string; userId: string }): Promise<{ data: Aufgabe | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase ist nicht konfiguriert.' };
  const title = p.title.trim().slice(0, AUFGABE_MAX);
  if (!title) return { data: null, error: 'Bitte gib eine Aufgabe ein.' };
  const { data, error } = await supabase.from('match_tasks').insert({
    season_id: NEUE_SAISON.id, match_key: p.matchKey, team_id: p.teamId, title,
    assignee_id: p.assignee?.id ?? null, assignee_name: p.assignee?.name ?? null, label: p.label, created_by: p.userId,
  }).select('id, match_key, title, assignee_id, assignee_name, done, done_at, created_at').single();
  if (error) return { data: null, error: /match_tasks/.test(error.message) ? 'Aufgaben sind noch nicht eingerichtet (Migration 0047).' : 'Konnte nicht speichern: ' + error.message };
  return { data: data as Aufgabe, error: null };
}

export async function setzeErledigt(id: string, done: boolean, userId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase.from('match_tasks')
    .update({ done, done_by: done ? userId : null, done_at: done ? new Date().toISOString() : null }).eq('id', id);
  return { error: error ? 'Konnte nicht speichern: ' + error.message : null };
}

export async function loescheAufgabe(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase.from('match_tasks').delete().eq('id', id);
  return { error: error ? 'Konnte nicht löschen: ' + error.message : null };
}
