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

export type TerminArt = 'spiel' | 'training' | 'event' | 'sonstiges';
/** Arten zur Auswahl (Migration 0067: training/event). Alles außer „spiel“ braucht einen Titel. */
export const TERMIN_ARTEN: { art: TerminArt; name: string }[] = [
  { art: 'spiel', name: 'Spiel (andere Liga/Pokal)' }, { art: 'training', name: 'Training' },
  { art: 'event', name: 'Event' }, { art: 'sonstiges', name: 'Sonstiges' },
];

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
  /** Farbe des Termins (Hex aus TERMIN_FARBEN, Migration 0049); null = Standard. */
  color?: string | null;
}

/** Wählbare Farben eigener Termine — bewusst KEIN Grün/Blau (Heim/Auswärts der MDU-Spiele). */
export const TERMIN_FARBEN: { hex: string; name: string }[] = [
  { hex: '#7C5CD6', name: 'Violett' },
  { hex: '#E07A1F', name: 'Orange' },
  { hex: '#0F9A9A', name: 'Türkis' },
  { hex: '#D6457E', name: 'Pink' },
  { hex: '#B8860B', name: 'Gold' },
  { hex: '#5C6470', name: 'Grau' },
];
export const terminFarbe = (t: Pick<TeamTermin, 'color'>) =>
  TERMIN_FARBEN.find(f => f.hex.toLowerCase() === (t.color ?? '').toLowerCase())?.hex ?? TERMIN_FARBEN[0].hex;

export type TerminEingabe = Omit<TeamTermin, 'id' | 'team_id'>;

export const TERMIN_PREFIX = 'ext:';
export const terminKey = (id: string) => TERMIN_PREFIX + id;
export const istTerminKey = (key: string) => key.startsWith(TERMIN_PREFIX);
export const terminPfad = (id: string) => `/termin/${id}`;

const SPALTEN_ALT = 'id, team_id, kind, title, league, opponent, is_home, event_date, start_time, end_time, venue, address';
// color erst ab Migration 0049 — fehlt die Spalte, wird ohne gelesen/geschrieben.
const SPALTEN = SPALTEN_ALT + ', color';
const ohneFarbe = (e: { message?: string } | null) => !!e && /color/.test(e.message ?? '');

/** Überschrift eines Termins: „Training“ bzw. „gegen DC Beispiel“ / „bei DC Beispiel“. */
export function terminTitel(t: Pick<TeamTermin, 'kind' | 'title' | 'opponent' | 'is_home'>): string {
  if (t.kind !== 'spiel') return t.title ?? (t.kind === 'training' ? 'Training' : 'Termin');
  return `${t.is_home === false ? 'bei' : 'gegen'} ${t.opponent ?? '?'}`;
}

const fehlt = (e: { message?: string; code?: string } | null) => !!e && (e.code === '42P01' || /team_events/.test(e.message ?? ''));

/** Alle eigenen Termine eines Teams (laufende Saison). `bereit: false` = Migration 0048 fehlt. */
export async function ladeTermine(teamId: string): Promise<{ rows: TeamTermin[]; bereit: boolean }> {
  if (!supabase) return { rows: [], bereit: false };
  const q = (sp: string) => supabase!.from('team_events').select(sp)
    .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).order('event_date').order('start_time');
  let { data, error } = await q(SPALTEN);
  if (ohneFarbe(error)) ({ data, error } = await q(SPALTEN_ALT));
  if (error) return { rows: [], bereit: !fehlt(error) };
  return { rows: (data ?? []) as unknown as TeamTermin[], bereit: true };
}

export async function ladeTermin(id: string): Promise<TeamTermin | null> {
  if (!supabase) return null;
  let { data, error } = await supabase.from('team_events').select(SPALTEN).eq('id', id).maybeSingle();
  if (ohneFarbe(error)) ({ data, error } = await supabase.from('team_events').select(SPALTEN_ALT).eq('id', id).maybeSingle());
  return (data as unknown as TeamTermin | null) ?? null;
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
    color: TERMIN_FARBEN.some(f => f.hex === e.color) ? e.color : null,
  };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(werte.event_date)) return { werte: null, fehler: 'Bitte ein Datum wählen.' };
  if (werte.kind === 'spiel' && !werte.opponent) return { werte: null, fehler: 'Bitte den Gegner eintragen.' };
  if (werte.kind !== 'spiel' && !werte.title) return { werte: null, fehler: 'Bitte einen Titel eintragen (z. B. Training).' };
  if (werte.start_time && werte.end_time && werte.end_time <= werte.start_time) return { werte: null, fehler: 'Das Ende muss nach dem Beginn liegen.' };
  return { werte, fehler: null };
}

export async function speichereTermin(teamId: string, eingabe: TerminEingabe, userId: string, id?: string): Promise<{ data: TeamTermin | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Supabase ist nicht konfiguriert.' };
  const { werte, fehler } = pruefeTermin(eingabe);
  if (!werte) return { data: null, error: fehler };
  const schreib = (w: Partial<TerminEingabe>, sp: string) => (id
    ? supabase!.from('team_events').update({ ...w, updated_at: new Date().toISOString() }).eq('id', id)
    : supabase!.from('team_events').insert({ ...w, season_id: NEUE_SAISON.id, team_id: teamId, created_by: userId })
  ).select(sp).single();
  let { data, error } = await schreib(werte, SPALTEN);
  if (ohneFarbe(error)) {
    const { color: _farbe, ...rest } = werte;
    void _farbe;
    ({ data, error } = await schreib(rest, SPALTEN_ALT));
  }
  if (error) return { data: null, error: fehlt(error) ? 'Eigene Termine sind noch nicht eingerichtet (Migration 0048).' : 'Konnte nicht speichern: ' + error.message };
  void kalenderNeu(teamId);
  return { data: data as unknown as TeamTermin, error: null };
}

/** Mehrere Termine auf einmal anlegen (Import) — ein Aufruf, ein Kalender-Neubau. */
export async function importiereTermine(teamId: string, liste: TerminEingabe[], userId: string): Promise<{ data: TeamTermin[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Supabase ist nicht konfiguriert.' };
  const zeilen = liste.map(e => pruefeTermin(e).werte).filter((w): w is TerminEingabe => !!w)
    .map(w => ({ ...w, season_id: NEUE_SAISON.id, team_id: teamId, created_by: userId, source: 'import' }));
  if (!zeilen.length) return { data: [], error: 'Keine gültigen Termine.' };
  let { data, error } = await supabase.from('team_events').insert(zeilen).select(SPALTEN);
  if (ohneFarbe(error)) ({ data, error } = await supabase.from('team_events').insert(zeilen.map(({ color: _f, ...r }) => { void _f; return r; })).select(SPALTEN_ALT));
  if (error) return { data: [], error: fehlt(error) ? 'Eigene Termine sind noch nicht eingerichtet (Migration 0048).' : 'Konnte nicht importieren: ' + error.message };
  void kalenderNeu(teamId);
  return { data: (data ?? []) as unknown as TeamTermin[], error: null };
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
