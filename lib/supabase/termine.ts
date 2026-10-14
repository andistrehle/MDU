// ============================================================
// Team Manager: eigene Termine außerhalb der MDU (Migration 0048)
// ============================================================
//
// Der TC trägt Spiele anderer Ligen/Pokale und Sonstiges (Training,
// Teamabend …) fürs ganze Team ein; alle sagen zu/ab wie bei MDU-Spielen.
// Kennung für Zu-/Absagen, Notiz, Treffzeit und Aufgaben: 'ext:<id>'
// (dieselben Tabellen wie bei den MDU-Spielen). Rechte prüft die DB (RLS):
// lesen das Team, schreiben nur TC + Ligaleitung, nur freigeschaltete Teams.
// ============================================================

import { supabase } from './client';
import { NEUE_SAISON } from '@/lib/data/saison-2027';

export type TerminArt = 'spiel' | 'sonstiges';

export interface TeamTermin {
  id: string;
  team_id: string;
  kind: TerminArt;
  title: string | null;
  league: string | null;
  opponent: string | null;
  is_home: boolean | null;
  event_date: string;          // YYYY-MM-DD
  start_time: string | null;   // HH:MM
  end_time: string | null;     // HH:MM
  venue: string | null;
  address: string | null;
}

export type TerminEingabe = Omit<TeamTermin, 'id' | 'team_id'>;

export const TERMIN_PREFIX = 'ext:';
export const terminKey = (id: string) => TERMIN_PREFIX + id;
export const istTerminKey = (key: string) => key.startsWith(TERMIN_PREFIX);
export const terminPfad = (id: string) => `/termin/${id}`;

const SPALTEN = 'id, team_id, kind, title, league, opponent, is_home, event_date, start_time, end_time, venue, address';

/** Überschrift eines Termins: „Training“ bzw. „gegen DC Beispiel“ / „bei DC Beispiel“. */
export function terminTitel(t: Pick<TeamTermin, 'kind' | 'title' | 'opponent' | 'is_home'>): string {
  if (t.kind === 'sonstiges') return t.title ?? 'Termin';
  return `${t.is_home === false ? 'bei' : 'gegen'} ${t.opponent ?? '?'}`;
}

const fehlt = (e: { message?: string; code?: string } | null) => !!e && (e.code === '42P01' || /team_events/.test(e.message ?? ''));

/** Alle eigenen Termine eines Teams (laufende Saison). `bereit: false` = Migration 0048 fehlt. */
export async function ladeTermine(teamId: string): Promise<{ rows: TeamTermin[]; bereit: boolean }> {
  if (!supabase) return { rows: [], bereit: false };
  const { data, error } = await supabase.from('team_events').select(SPALTEN)
    .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).order('event_date').order('start_time');
  if (error) return { rows: [], bereit: !fehlt(error) };
  return { rows: (data ?? []) as TeamTermin[], bereit: true };
}

export async function ladeTermin(id: string): Promise<TeamTermin | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('team_events').select(SPALTEN).eq('id', id).maybeSingle();
  return (data as TeamTermin | null) ?? null;
}

/** Leere Felder → null, Texte gekürzt; prüft, was die DB sonst ablehnen würde. */
export function pruefeTermin(e: TerminEingabe): { werte: TerminEingabe | null; fehler: string | null } {
  const txt = (s: string | null, max: number) => (s ?? '').trim().slice(0, max) || null;
  const werte: TerminEingabe = {
    kind: e.kind,
    title: txt(e.title, 80),
    league: e.kind === 'spiel' ? txt(e.league, 60) : null,
    opponent: e.kind === 'spiel' ? txt(e.opponent, 80) : null,
    is_home: e.kind === 'spiel' ? e.is_home ?? true : null,
    event_date: e.event_date,
    start_time: e.start_time || null,
    end_time: e.end_time || null,
    venue: txt(e.venue, 80),
    address: txt(e.address, 120),
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(werte.event_date)) return { werte: null, fehler: 'Bitte ein Datum wählen.' };
  if (werte.kind === 'spiel' && !werte.opponent) return { werte: null, fehler: 'Bitte den Gegner eintragen.' };
  if (werte.kind === 'sonstiges' && !werte.title) return { werte: null, fehler: 'Bitte einen Titel eintragen (z. B. Training).' };
  if (werte.start_time && werte.end_time && werte.end_time <= werte.start_time) return { werte: null, fehler: 'Das Ende muss nach dem Beginn liegen.' };
  return { werte, fehler: null };
}

export async function speichereTermin(teamId: string, eingabe: TerminEingabe, userId: string, id?: string): Promise<{ data: TeamTermin | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase ist nicht konfiguriert.' };
  const { werte, fehler } = pruefeTermin(eingabe);
  if (!werte) return { data: null, error: fehler };
  const q = id
    ? supabase.from('team_events').update({ ...werte, updated_at: new Date().toISOString() }).eq('id', id)
    : supabase.from('team_events').insert({ ...werte, season_id: NEUE_SAISON.id, team_id: teamId, created_by: userId });
  const { data, error } = await q.select(SPALTEN).single();
  if (error) return { data: null, error: fehlt(error) ? 'Eigene Termine sind noch nicht eingerichtet (Migration 0048).' : 'Konnte nicht speichern: ' + error.message };
  void kalenderNeu(teamId);
  return { data: data as TeamTermin, error: null };
}

export async function loescheTermin(t: Pick<TeamTermin, 'id' | 'team_id'>): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase ist nicht konfiguriert.' };
  const { error } = await supabase.from('team_events').delete().eq('id', t.id);
  if (!error) void kalenderNeu(t.team_id);
  return { error: error ? 'Konnte nicht löschen: ' + error.message : null };
}

/** Kalender-Abo des Teams neu bauen lassen (/kalender/<team>.ics). */
async function kalenderNeu(teamId: string) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch('/api/termine/geaendert', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ team: teamId }) }).catch(() => {});
}
