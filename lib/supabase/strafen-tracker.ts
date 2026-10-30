// ============================================================
// Team Manager: Strafen-Tracker am Spielabend (Migration 0066)
// ============================================================
// Ein Abend hängt an einem Spiel (match_key = 'Heim|Gast') oder ist frei.
// Gezählt wird live in der DB über strafe_zaehlen() (atomar, mehrere Geräte),
// abgeschlossen über strafen_abschliessen() — das bucht „U26 × 3“ in die Kasse.
// Lesen: ganzes Team (RLS). Zählen: Kasse-Berechtigte + Ersatz-Kassenwart des Abends.
// ============================================================

import { supabase } from './client';
import { dienstagsEnde } from '@/lib/dienstags-ende';

export interface StrafenAbend {
  id: string; team_id: string; match_key: string | null; titel: string; datum: string;
  ersatz_player_id: string | null; ersatz_name: string | null; gueltig_bis: string;
  status: 'offen' | 'abgeschlossen'; abgeschlossen_at: string | null;
}
export interface Strich {
  player_key: string; player_name: string; art_key: string; title: string; amount_cents: number; anzahl: number;
}
const ABEND = 'id, team_id, match_key, titel, datum, ersatz_player_id, ersatz_name, gueltig_bis, status, abgeschlossen_at';

function fehler(e: { message?: string } | null): string | null {
  if (!e) return null;
  if (/team_strafen|strafe_zaehlen|strafen_abschliessen/.test(e.message ?? '')) return 'Der Strafen-Tracker ist noch nicht eingerichtet (Migration 0066 fehlt).';
  if (/row-level security|Berechtigung/i.test(e.message ?? '')) return 'Dafür fehlt dir die Berechtigung – oder der Abend ist schon abgeschlossen.';
  return e.message ?? 'Unbekannter Fehler.';
}

/** Offene Abende + die letzten abgeschlossenen. */
export async function ladeAbende(teamId: string): Promise<{ data: StrafenAbend[]; error: string | null }> {
  if (!supabase) return { data: [], error: 'Keine Verbindung.' };
  const { data, error } = await supabase.from('team_strafen_abende').select(ABEND).eq('team_id', teamId).order('datum', { ascending: false }).limit(30);
  return { data: (data ?? []) as StrafenAbend[], error: fehler(error) };
}

export async function ladeAbend(id: string): Promise<{ abend: StrafenAbend | null; striche: Strich[]; error: string | null }> {
  if (!supabase) return { abend: null, striche: [], error: 'Keine Verbindung.' };
  const [a, s] = await Promise.all([
    supabase.from('team_strafen_abende').select(ABEND).eq('id', id).maybeSingle(),
    supabase.from('team_strafen_striche').select('player_key, player_name, art_key, title, amount_cents, anzahl').eq('abend_id', id),
  ]);
  return { abend: (a.data ?? null) as StrafenAbend | null, striche: (s.data ?? []) as Strich[], error: fehler(a.error ?? s.error) };
}

export async function abendAnlegen(p: {
  teamId: string; userId: string; matchKey: string | null; titel: string; datum: string;
  ersatz: { key: string; name: string } | null;
}): Promise<{ data: StrafenAbend | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'Keine Verbindung.' };
  const { data, error } = await supabase.from('team_strafen_abende').insert({
    team_id: p.teamId, match_key: p.matchKey, titel: p.titel.trim().slice(0, 80), datum: p.datum,
    ersatz_player_id: p.ersatz?.key ?? null, ersatz_name: p.ersatz?.name ?? null,
    gueltig_bis: dienstagsEnde(p.datum), created_by: p.userId,
  }).select(ABEND).single();
  if (error && /duplicate key|strafen_abend_spiel_idx/.test(error.message)) return { data: null, error: 'Für dieses Spiel gibt es schon einen Strafen-Abend.' };
  return { data: (data ?? null) as StrafenAbend | null, error: fehler(error) };
}

export async function ersatzSetzen(id: string, ersatz: { key: string; name: string } | null): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Keine Verbindung.' };
  const { error } = await supabase.from('team_strafen_abende').update({ ersatz_player_id: ersatz?.key ?? null, ersatz_name: ersatz?.name ?? null }).eq('id', id);
  return { error: fehler(error) };
}

export async function abendLoeschen(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Keine Verbindung.' };
  const { error } = await supabase.from('team_strafen_abende').delete().eq('id', id);
  return { error: fehler(error) };
}

export async function zaehlen(p: { abend: string; spieler: { key: string; name: string }; art: { key: string; title: string; cents: number }; delta: 1 | -1 }): Promise<{ anzahl: number | null; error: string | null }> {
  if (!supabase) return { anzahl: null, error: 'Keine Verbindung.' };
  const { data, error } = await supabase.rpc('strafe_zaehlen', {
    p_abend: p.abend, p_player_key: p.spieler.key, p_player_name: p.spieler.name,
    p_art_key: p.art.key, p_title: p.art.title, p_cents: p.art.cents, p_delta: p.delta,
  });
  return { anzahl: error ? null : Number(data), error: fehler(error) };
}

export async function abschliessen(id: string): Promise<{ gebucht: number; error: string | null }> {
  if (!supabase) return { gebucht: 0, error: 'Keine Verbindung.' };
  const { data, error } = await supabase.rpc('strafen_abschliessen', { p_abend: id });
  return { gebucht: Number(data ?? 0), error: fehler(error) };
}

/** Darf dieser Nutzer am Abend zählen? (Die DB prüft es ohnehin — hier nur für die Oberfläche.) */
export const darfZaehlen = (a: StrafenAbend, kasseDarf: boolean, playerId: string | null | undefined) =>
  a.status === 'offen' && (kasseDarf || (!!playerId && a.ersatz_player_id === playerId && Date.now() <= new Date(a.gueltig_bis).getTime()));

/** Glocke + Push an den Ersatz-Kassenwart (Server, je Abend und Person einmal). Fehler stören das Zählen nicht. */
export async function ersatzBenachrichtigen(abendId: string): Promise<void> {
  try {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) return;
    await fetch('/api/team/strafen-ersatz', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ abendId }) });
  } catch { /* egal */ }
}
