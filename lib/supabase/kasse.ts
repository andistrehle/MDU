// ============================================================
// Team Manager: Teamkasse (Migration 0051)
// ============================================================
//
// Strafenkatalog, Strafen und Beiträge je Spieler, Kassenbuch (Einnahmen/
// Ausgaben) und Kassenstand. Buchen dürfen TC, Kassenwart und Ligaleitung,
// lesen das ganze Team — die Rechte prüft die DB (RLS, kasse_darf).
// Bewusst KEINE Erinnerung in der Glocke (Betreiber, 16.10.2026).
// Spieler-Kennung = KaderOption.id (players.id bzw. „name:…“ ohne Profil).
// ============================================================

import { supabase } from './client';

export type BuchungsArt = 'strafe' | 'beitrag' | 'einnahme' | 'ausgabe';

export interface Buchung {
  id: string;
  team_id: string;
  kind: BuchungsArt;
  player_key: string | null;
  player_name: string | null;
  title: string;
  amount_cents: number;
  entry_date: string;          // YYYY-MM-DD
  paid_at: string | null;
  created_at: string;
}

export interface Strafart { id: string; title: string; amount_cents: number; sort: number }
export interface KassenEinstellung { treasurer_player_id: string | null; opening_cents: number }

const fehlt = (e: { message?: string; code?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /team_cash|team_fine/.test(e.message ?? ''));

const SPALTEN = 'id, team_id, kind, player_key, player_name, title, amount_cents, entry_date, paid_at, created_at';

/** Alles für die Kassenseite. `bereit: false` = Migration 0051 fehlt. */
export async function ladeKasse(teamId: string): Promise<{
  buchungen: Buchung[]; strafarten: Strafart[]; einst: KassenEinstellung; bereit: boolean; error: string | null;
}> {
  const leer = { buchungen: [], strafarten: [], einst: { treasurer_player_id: null, opening_cents: 0 } };
  if (!supabase) return { ...leer, bereit: false, error: null };
  const [b, s, e] = await Promise.all([
    supabase.from('team_cash_entries').select(SPALTEN).eq('team_id', teamId).order('entry_date', { ascending: false }).order('created_at', { ascending: false }),
    supabase.from('team_fine_types').select('id, title, amount_cents, sort').eq('team_id', teamId).order('sort').order('title'),
    supabase.from('team_cash_settings').select('treasurer_player_id, opening_cents').eq('team_id', teamId).maybeSingle(),
  ]);
  const err = b.error ?? s.error ?? e.error;
  if (err) return { ...leer, bereit: !fehlt(err), error: fehlt(err) ? null : err.message };
  return {
    buchungen: (b.data ?? []) as Buchung[],
    strafarten: (s.data ?? []) as Strafart[],
    einst: (e.data as KassenEinstellung | null) ?? leer.einst,
    bereit: true, error: null,
  };
}

const fehlerText = (e: { message?: string } | null) =>
  !e ? null : /row-level security|permission/i.test(e.message ?? '') ? 'Dazu fehlt dir die Berechtigung.' : (e.message ?? 'Unbekannter Fehler.');

/** Strafe/Beitrag für mehrere Spieler auf einmal — oder eine Einnahme/Ausgabe (spieler leer). */
export async function bucheMehrere(p: {
  teamId: string; userId: string; kind: BuchungsArt; title: string; cents: number; datum: string;
  spieler: { key: string; name: string }[];
}): Promise<{ data: Buchung[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Keine Verbindung.' };
  const basis = { team_id: p.teamId, kind: p.kind, title: p.title.trim(), amount_cents: p.cents, entry_date: p.datum, created_by: p.userId };
  const zeilen = p.kind === 'strafe' || p.kind === 'beitrag'
    ? p.spieler.map(s => ({ ...basis, player_key: s.key, player_name: s.name }))
    : [basis];
  const { data, error } = await supabase.from('team_cash_entries').insert(zeilen).select(SPALTEN);
  return { data: (data ?? []) as Buchung[], error: fehlerText(error) };
}

/** Strafen mit Anzahl: je Spieler und Strafart ein Posten („U26 × 3“, Betrag × Anzahl). */
export async function bucheStrafen(p: {
  teamId: string; userId: string; datum: string;
  zeilen: { key: string; name: string; title: string; cents: number }[];
}): Promise<{ data: Buchung[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Keine Verbindung.' };
  const { data, error } = await supabase.from('team_cash_entries').insert(p.zeilen.map(z => ({
    team_id: p.teamId, kind: 'strafe', title: z.title.trim(), amount_cents: z.cents, entry_date: p.datum,
    created_by: p.userId, player_key: z.key, player_name: z.name,
  }))).select(SPALTEN);
  return { data: (data ?? []) as Buchung[], error: fehlerText(error) };
}

export async function setzeBezahlt(ids: string[], bezahlt: boolean, userId: string): Promise<{ error: string | null }> {
  if (!supabase || ids.length === 0) return { error: null };
  const { error } = await supabase.from('team_cash_entries')
    .update(bezahlt ? { paid_at: new Date().toISOString(), paid_by: userId } : { paid_at: null, paid_by: null })
    .in('id', ids);
  return { error: fehlerText(error) };
}

export async function loescheBuchung(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Keine Verbindung.' };
  const { error } = await supabase.from('team_cash_entries').delete().eq('id', id);
  return { error: fehlerText(error) };
}

export async function speichereStrafart(teamId: string, userId: string, s: { id?: string; title: string; cents: number; sort: number }): Promise<{ data: Strafart | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Keine Verbindung.' };
  const werte = { title: s.title.trim(), amount_cents: s.cents, sort: s.sort };
  const q = s.id
    ? supabase.from('team_fine_types').update(werte).eq('id', s.id)
    : supabase.from('team_fine_types').insert({ ...werte, team_id: teamId, created_by: userId });
  const { data, error } = await q.select('id, title, amount_cents, sort').single();
  return { data: (data as Strafart | null) ?? null, error: fehlerText(error) };
}

export async function loescheStrafart(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Keine Verbindung.' };
  const { error } = await supabase.from('team_fine_types').delete().eq('id', id);
  return { error: fehlerText(error) };
}

export async function speichereKassenEinstellung(teamId: string, userId: string, werte: Partial<KassenEinstellung>): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Keine Verbindung.' };
  const { error } = await supabase.from('team_cash_settings')
    .upsert({ team_id: teamId, ...werte, updated_by: userId, updated_at: new Date().toISOString() });
  return { error: fehlerText(error) };
}

// ── Rechnen ────────────────────────────────────────────────

export const istForderung = (b: Pick<Buchung, 'kind'>) => b.kind === 'strafe' || b.kind === 'beitrag';

/** Kassenstand = Anfangsbestand + Einnahmen − Ausgaben + bezahlte Strafen/Beiträge. */
export function kassenstand(buchungen: Buchung[], openingCents: number): number {
  return buchungen.reduce((s, b) =>
    b.kind === 'einnahme' ? s + b.amount_cents
    : b.kind === 'ausgabe' ? s - b.amount_cents
    : b.paid_at ? s + b.amount_cents : s, openingCents);
}

export const offenSumme = (buchungen: Buchung[]) =>
  buchungen.reduce((s, b) => (istForderung(b) && !b.paid_at ? s + b.amount_cents : s), 0);

/** „2,50“, „2.50“, „2“, „2,5 €“ → Cent; ungültig → null. */
export function centAus(text: string): number | null {
  const t = text.replace(/€/g, '').replace(/\s/g, '').replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return null;
  const c = Math.round(parseFloat(t) * 100);
  return c > 0 ? c : null;
}

export const euro = (cents: number) =>
  (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
