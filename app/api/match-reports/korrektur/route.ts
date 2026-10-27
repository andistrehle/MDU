// ============================================================
// Route Handler: Korrektur eines bestätigten Spielberichts (Migration 0061)
// ============================================================
//
// GET  /api/match-reports/korrektur?id=<bericht>   → { korrektur, frist }
// POST /api/match-reports/korrektur  (Authorization: Bearer <access token>)
//   { id, aktion: 'anfragen', grund, stand }        — TC von Heim ODER Gast,
//        nur bestätigte Berichte, bis 7 Tage nach dem Spiel, mit Begründung
//   { korrekturId, aktion: 'bestaetigen', notiz? }  — TC des anderen Teams
//        oder Ligaleitung → neuer Stand wird geschrieben, Seiten neu gebaut
//   { korrekturId, aktion: 'ablehnen', notiz? }     — dito, alter Stand bleibt
//   { korrekturId, aktion: 'zurueckziehen' }        — wer angefragt hat
//
// Betreiber, 27.10.2026. Ablauf wie die Spielverlegung: der andere TC
// bestätigt, die Ligaleitung ist informiert (Glocke → Push) und entscheidet,
// wenn niemand antwortet. Bis zur Bestätigung bleibt der alte Stand
// öffentlich mit „Korrektur angefragt“. Jeder Schritt steht im Verlauf des
// Berichts (match_report_history). Alles über service_role.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateRequest, isAdminUser, type ServerUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { computeTotals, type HighlightEntry, type ReportGame } from '@/lib/supabase/match-reports';
import {
  KORREKTUR_MIN, fristEnde, fristVorbei, datumDe, pruefeStand, gleicherStand, vereinheitliche, unterschiede,
  type Korrektur, type KorrekturStand,
} from '@/lib/spielbericht-korrektur';
import { team27, begegnungKey } from '@/lib/data/saison-2027';
import { berichtPfad } from '@/lib/spieltag';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TC_ROLLEN = ['team_captain', 'league_admin', 'super_admin'];
const SPALTEN = 'id, report_id, requested_by, requested_team_id, confirm_team_id, reason, changes, base, status, decided_by, decided_at, decision_note, created_at';

interface Bericht {
  id: string; status: string; forfeit: string | null; match_date: string | null; league_label: string | null;
  home_team_id: string | null; guest_team_id: string | null; home_team_name: string; guest_team_name: string;
  highlights: HighlightEntry[] | null;
}
type Zeile = Korrektur & { report_id: string; requested_by: string | null };

function db() {
  if (!supabaseAdmin) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  return supabaseAdmin;
}
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const migrationFehlt = (m: string) => /match_report_corrections/.test(m) ? 'Die Datenbank kennt die Korrektur noch nicht — Migration 0061 fehlt.' : m;

const teamName = (r: Bericht, id: string | null) => (id === r.home_team_id ? r.home_team_name : id === r.guest_team_id ? r.guest_team_name : team27(id ?? '')?.name ?? 'Team');
const paarung = (r: Bericht) => `${r.home_team_name} – ${r.guest_team_name}`;
/** TC eines der beiden Teams (auch eine Ligaleitung mit eigenem Team im Kapitänsmodus). */
const tcVon = (u: ServerUser, teamId: string | null) => !!teamId && u.teamId === teamId && TC_ROLLEN.includes(u.role);

async function ladeBericht(id: string): Promise<Bericht | null> {
  const { data } = await db().from('match_reports')
    .select('id, status, forfeit, match_date, league_label, home_team_id, guest_team_id, home_team_name, guest_team_name, highlights')
    .eq('id', id).maybeSingle();
  return data as Bericht | null;
}

/** Aktueller Stand des Berichts aus der DB. */
async function aktuellerStand(r: Bericht): Promise<KorrekturStand> {
  const [pl, gm] = await Promise.all([
    db().from('match_report_players').select('side, slot, name, pass_no, player_id').eq('report_id', r.id),
    db().from('match_report_games').select('game_no, game_type, home_slot, guest_slot, home_slot2, guest_slot2, legs_home, legs_guest').eq('report_id', r.id),
  ]);
  return vereinheitliche({
    players: (pl.data ?? []) as KorrekturStand['players'],
    games: (gm.data ?? []) as ReportGame[],
    highlights: r.highlights ?? [],
  });
}

async function wer(u: ServerUser, r: Bericht): Promise<string> {
  const { data } = await db().from('profiles').select('display_name, first_name, last_name').eq('id', u.id).maybeSingle();
  const p = data as { display_name: string | null; first_name: string | null; last_name: string | null } | null;
  const name = [p?.first_name, p?.last_name].filter(Boolean).join(' ') || p?.display_name || '';
  const rolle = tcVon(u, r.home_team_id) || tcVon(u, r.guest_team_id) ? teamName(r, u.teamId) : 'Ligaleitung';
  return name ? `${name} (${rolle})` : rolle;
}

async function tcsVon(teamId: string | null): Promise<string[]> {
  if (!teamId) return [];
  const { data } = await db().from('profiles').select('id').eq('team_id', teamId).in('role', TC_ROLLEN);
  return ((data ?? []) as { id: string }[]).map(p => p.id);
}
async function ligaleitung(): Promise<string[]> {
  const { data } = await db().from('profiles').select('id').in('role', ['league_admin', 'super_admin']);
  return ((data ?? []) as { id: string }[]).map(p => p.id);
}
/** Glocke (→ Push über Migration 0056). TCs landen im Bericht, die Ligaleitung im Admin-Modus. */
async function melde(r: Bericht, tcs: string[], liga: string[], ohne: string, titel: string, text: string) {
  const zeilen = [
    ...tcs.map(id => ({ id, url: `/mein-bereich/spielberichte?id=${r.id}` })),
    ...liga.map(id => ({ id, url: `/mein-bereich/spielberichte?id=${r.id}&from=admin` })),
  ].filter((z, i, a) => z.id !== ohne && a.findIndex(x => x.id === z.id) === i);
  if (!zeilen.length) return;
  await db().from('notifications').insert(zeilen.map(z => ({
    recipient_user_id: z.id, type: 'match_report_correction', title: titel, message: text, short_text: text,
    related_entity_type: 'match_reports', related_entity_id: r.id, action_url: z.url,
  })));
}

async function verlauf(r: Bericht, u: ServerUser, action: string, note: string) {
  await db().from('match_report_history').insert({ report_id: r.id, action, actor_user_id: u.id, note: note.slice(0, 2000) });
}

const berichtSeite = (r: Bericht) => { if (r.home_team_id && r.guest_team_id) revalidatePath(berichtPfad(begegnungKey(r.home_team_id, r.guest_team_id))); };
function ergebnisSeiten() {
  // wie /api/match-reports/published
  revalidatePath('/');
  revalidatePath('/tabellen');
  revalidatePath('/ergebnisse');
  revalidatePath('/spielplan');
  revalidatePath('/ligen/[code]', 'page');
  revalidatePath('/teams/[id]', 'page');
  revalidatePath('/spieler/[playerId]', 'page');
  revalidatePath('/spielbericht/[spiel]', 'page');
}

function fuerAufrufer(k: Zeile, u: ServerUser): Korrektur {
  const offen = k.status === 'offen';
  return {
    id: k.id, status: k.status, reason: k.reason, requested_team_id: k.requested_team_id, confirm_team_id: k.confirm_team_id,
    changes: k.changes, base: k.base, decision_note: k.decision_note, created_at: k.created_at, decided_at: k.decided_at,
    darfEntscheiden: offen && (isAdminUser(u) || (tcVon(u, k.confirm_team_id) && k.requested_by !== u.id)),
    darfZurueckziehen: offen && (k.requested_by === u.id || tcVon(u, k.requested_team_id) || isAdminUser(u)),
  };
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  const id = new URL(request.url).searchParams.get('id') ?? '';
  try {
    const r = await ladeBericht(id);
    if (!r) return fehler('Bericht nicht gefunden.', 404);
    if (!isAdminUser(u) && !tcVon(u, r.home_team_id) && !tcVon(u, r.guest_team_id)) return fehler('Kein Zugriff.', 403);
    const { data, error } = await db().from('match_report_corrections').select(SPALTEN).eq('report_id', r.id).eq('status', 'offen').maybeSingle();
    if (error) return fehler(migrationFehlt(error.message), 500);
    return NextResponse.json({ korrektur: data ? fuerAufrufer(data as Zeile, u) : null, frist: r.match_date ? fristEnde(r.match_date) : null });
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  const b = await request.json().catch(() => ({})) as { id?: string; korrekturId?: string; aktion?: string; grund?: string; notiz?: string; stand?: KorrekturStand };
  try {
    if (b.aktion === 'anfragen') return await anfragen(u, b.id ?? '', b.grund ?? '', b.stand);

    const { data, error } = await db().from('match_report_corrections').select(SPALTEN).eq('id', b.korrekturId ?? '').maybeSingle();
    if (error) return fehler(migrationFehlt(error.message), 500);
    const k = data as Zeile | null;
    if (!k) return fehler('Anfrage nicht gefunden.', 404);
    if (k.status !== 'offen') return fehler('Über diese Korrektur ist schon entschieden.', 409);
    const r = await ladeBericht(k.report_id);
    if (!r) return fehler('Bericht nicht gefunden.', 404);
    const recht = fuerAufrufer(k, u);
    const notiz = (b.notiz ?? '').replace(/\s+/g, ' ').trim().slice(0, 300);

    if (b.aktion === 'zurueckziehen') {
      if (!recht.darfZurueckziehen) return fehler('Zurückziehen kann nur, wer angefragt hat.', 403);
      await db().from('match_report_corrections').update({ status: 'zurueckgezogen', decided_by: u.id, decided_at: new Date().toISOString() }).eq('id', k.id).eq('status', 'offen');
      const w = await wer(u, r);
      await verlauf(r, u, 'korrektur_zurueckgezogen', w);
      await melde(r, await tcsVon(k.confirm_team_id), [], u.id, `Korrektur zurückgezogen: ${paarung(r)}`, `${w} hat die Korrektur-Anfrage zurückgezogen. Der Bericht bleibt, wie er ist.`);
      berichtSeite(r);
      return NextResponse.json({ ok: true });
    }

    if (b.aktion !== 'bestaetigen' && b.aktion !== 'ablehnen') return fehler('Unbekannte Aktion.');
    if (!recht.darfEntscheiden) return fehler('Bestätigen oder ablehnen kann nur der Teamcaptain des anderen Teams oder die Ligaleitung.', 403);
    const w = await wer(u, r);

    if (b.aktion === 'ablehnen') {
      await db().from('match_report_corrections').update({ status: 'abgelehnt', decided_by: u.id, decided_at: new Date().toISOString(), decision_note: notiz || null }).eq('id', k.id).eq('status', 'offen');
      await verlauf(r, u, 'korrektur_abgelehnt', `${w}${notiz ? `: ${notiz}` : ''}`);
      await melde(r, await tcsVon(k.requested_team_id), await ligaleitung(), u.id, `Korrektur abgelehnt: ${paarung(r)}`,
        `${w} hat die Korrektur abgelehnt${notiz ? ` („${notiz}“)` : ''}. Der Bericht bleibt, wie er ist.`);
      berichtSeite(r);
      return NextResponse.json({ ok: true });
    }

    // Bestätigen: nur, wenn der Bericht noch so ist wie beim Anfragen.
    const jetzt = await aktuellerStand(r);
    if (!gleicherStand(jetzt, k.base)) {
      return fehler('Der Bericht wurde seit der Anfrage geändert (z. B. von der Ligaleitung). Bitte die Korrektur ablehnen und bei Bedarf neu anfragen.', 409);
    }
    const neu = vereinheitliche(k.changes);
    const fehlerText = await schreibeStand(r, neu);
    if (fehlerText) return fehler(fehlerText, 500);
    await db().from('match_report_corrections').update({ status: 'bestaetigt', decided_by: u.id, decided_at: new Date().toISOString(), decision_note: notiz || null }).eq('id', k.id);
    await verlauf(r, u, 'korrektur_bestaetigt', `${w}${notiz ? `: ${notiz}` : ''}`);
    await melde(r, await tcsVon(k.requested_team_id), await ligaleitung(), u.id, `Korrektur übernommen: ${paarung(r)}`,
      `${w} hat die Korrektur bestätigt — der Spielbericht ist geändert, Tabellen und Ranglisten rechnen neu.`);
    ergebnisSeiten();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}

async function anfragen(u: ServerUser, id: string, grundRoh: string, stand: KorrekturStand | undefined) {
  const r = await ladeBericht(id);
  if (!r) return fehler('Bericht nicht gefunden.', 404);
  const heim = tcVon(u, r.home_team_id), gast = tcVon(u, r.guest_team_id);
  if (!heim && !gast) return fehler('Eine Korrektur anfragen können nur die Teamcaptains der beiden Teams.', 403);
  if (r.status !== 'confirmed') return fehler('Eine Korrektur gibt es nur für bestätigte Berichte — vorher ändert ihr den Bericht direkt.');
  if (r.forfeit) return fehler('Eine Wertung der Ligaleitung lässt sich nicht korrigieren.');
  if (fristVorbei(r.match_date)) return fehler(`Die Frist ist abgelaufen (bis ${r.match_date ? datumDe(fristEnde(r.match_date)) : '–'}, 7 Tage nach dem Spiel). Bitte wende dich an die Ligaleitung.`);
  const grund = grundRoh.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (grund.length < KORREKTUR_MIN) return fehler(`Bitte begründe die Korrektur (mindestens ${KORREKTUR_MIN} Zeichen).`);
  if (!stand) return fehler('Der korrigierte Bericht fehlt.');
  const pf = pruefeStand(stand, r.league_label);
  if (pf) return fehler(pf);
  const neu = vereinheitliche(stand);
  const alt = await aktuellerStand(r);
  if (gleicherStand(alt, neu)) return fehler('Du hast am Bericht nichts geändert.');

  const team = heim ? r.home_team_id : r.guest_team_id;
  const anderes = heim ? r.guest_team_id : r.home_team_id;
  const { error } = await db().from('match_report_corrections').insert({
    report_id: r.id, requested_by: u.id, requested_team_id: team, confirm_team_id: anderes,
    reason: grund, changes: neu, base: alt,
  });
  if (error) return fehler(/eine_offene|duplicate key/i.test(error.message) ? 'Für diesen Bericht ist schon eine Korrektur angefragt.' : migrationFehlt(error.message), 409);

  const w = await wer(u, r);
  const liste = unterschiede(alt, neu);
  await verlauf(r, u, 'korrektur_angefragt', `${w} – Grund: „${grund}“ · ${liste.join(' · ')}`);
  await melde(r, await tcsVon(anderes), await ligaleitung(), u.id, `Korrektur angefragt: ${paarung(r)}`,
    `${w} möchte den bestätigten Spielbericht korrigieren (${liste.length} ${liste.length === 1 ? 'Änderung' : 'Änderungen'}). Grund: „${grund.slice(0, 200)}“ — bitte bestätigen oder ablehnen.`);
  berichtSeite(r);
  return NextResponse.json({ ok: true });
}

/** Neuen Stand schreiben: Aufstellung, Spiele, Highlights + Summen und Einzelpunkte neu. */
async function schreibeStand(r: Bericht, s: KorrekturStand): Promise<string | null> {
  const t = computeTotals(s.games);
  const { error: e1 } = await db().from('match_reports').update({
    highlights: s.highlights,
    spiele_home: t.spieleHome, spiele_guest: t.spieleGuest, legs_home: t.legsHome, legs_guest: t.legsGuest,
    points_home: t.pointsHome, points_guest: t.pointsGuest,
  }).eq('id', r.id);
  if (e1) return e1.message;
  await db().from('match_report_players').delete().eq('report_id', r.id);
  await db().from('match_report_games').delete().eq('report_id', r.id);
  if (s.players.length) {
    const { error } = await db().from('match_report_players').insert(s.players.map(p => ({
      report_id: r.id, side: p.side, slot: p.slot, pass_no: p.pass_no, name: p.name, player_id: p.player_id,
      points: (p.side === 'home' ? t.homePlayerPoints[p.slot] : t.guestPlayerPoints[p.slot]) ?? 0,
    })));
    if (error) return error.message;
  }
  const { error: e2 } = await db().from('match_report_games').insert(s.games.map(g => ({ report_id: r.id, ...g })));
  return e2?.message ?? null;
}
