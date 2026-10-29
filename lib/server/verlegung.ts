// ============================================================
// Spielverlegungen 2026/27 — Server-Logik (Migration 0050)
// ============================================================
//
// Ablauf (vom Betreiber festgelegt, 16.10.2026):
//   1. Ein TC (Heim ODER Gast) schlägt einen neuen Termin vor   → 'offen'
//   2. Der TC des Gegners bestätigt                              → übernehmen
//      … oder lehnt ab                                           → 'abgelehnt'
//      Der Antragsteller kann eine offene Anfrage zurückziehen.
//   3. Liegt der neue Termin vor Saisonstart / nach dem letzten
//      Spielwochenende, muss die Ligaleitung freigeben           → 'freigabe'
//   4. Übernehmen = Commit in lib/data/verlegungen-2027.json      → 'uebernommen'
//      Klappt der Commit nicht (z. B. Token fehlt), bleibt es bei
//      'bestaetigt' und die Ligaleitung sieht es unter Admin → Verlegungen.
// Die Ligaleitung bekommt bei jeder Bestätigung einen Hinweis in die Glocke.
// Alles über service_role; die Regeln stehen hier, nicht in RLS.
//
// HEIMRECHTTAUSCH (Migration 0053, Betreiber 20.10.2026): gleiche Tabelle,
// kind = 'heimrecht', match_key = Hinspiel. Gegner-TC bestätigt, Ligaleitung
// nur informiert, nur solange es für keines der beiden Spiele einen
// Spielbericht gibt. Übernehmen = (1) Verlegungs-Schlüssel der Paarung in
// verlegungen-2027.json umschreiben (falls vorhanden), (2) Eintrag in
// heimrecht-2027.json, (3) Zusagen/Details/Aufgaben in der DB auf die neue
// Kennung umhängen — sonst stünden die Zusagen des Hinspiels beim Rückspiel.
// ============================================================

import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { alleBegegnungen27, team27, NEUE_SAISON, SAISON_START, SAISON_ENDE, VERLEGUNGEN_2027, type Begegnung27 } from '@/lib/data/saison-2027';
import { aendereJsonDatei } from './github-mdu';
import type { ServerUser } from './auth';
import { isAdminUser, hatTcRechtServer } from './auth';
import { tcEmpfaenger } from './tc-empfaenger';

export type VerlegungStatus = 'offen' | 'freigabe' | 'bestaetigt' | 'uebernommen' | 'abgelehnt' | 'zurueckgezogen';
export type AnfrageArt = 'verlegung' | 'heimrecht';
export interface Verlegung {
  id: string; kind: AnfrageArt; match_key: string; home_team_id: string; away_team_id: string;
  old_date: string | null; old_time: string | null; new_date: string | null; new_time: string | null;
  reason: string | null; requested_team: string; status: VerlegungStatus; needs_admin: boolean;
  note: string | null; created_at: string; decided_at: string | null; applied_at: string | null;
}

const SPALTEN = 'id, kind, match_key, home_team_id, away_team_id, old_date, old_time, new_date, new_time, reason, requested_team, status, needs_admin, note, created_at, decided_at, applied_at';
const DATEI = 'lib/data/verlegungen-2027.json';
const DATEI_HR = 'lib/data/heimrecht-2027.json';

const heute = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date());
const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const tag = (iso: string) => { const d = new Date(iso + 'T12:00:00Z'); return `${WT[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`; };
const termin = (d: string | null, t: string | null) => (d ? `${tag(d)}${t ? ` ${t}` : ''}` : 'Spielwochenende');
const paarung = (v: Pick<Verlegung, 'home_team_id' | 'away_team_id'>) => `${team27(v.home_team_id)?.name ?? v.home_team_id} – ${team27(v.away_team_id)?.name ?? v.away_team_id}`;
export const verlegungText = (v: Verlegung) => v.kind === 'heimrecht'
  ? `${paarung(v)} und Rückspiel: Heimrecht tauschen (Termine bleiben)`
  : `${paarung(v)}: ${termin(v.old_date, v.old_time)} → ${termin(v.new_date, v.new_time)}`;

/** Außerhalb der Saison → Ligaleitung muss freigeben. */
export const brauchtFreigabe = (datum: string) => datum < SAISON_START || datum > SAISON_ENDE;

function db() {
  if (!supabaseAdmin) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  return supabaseAdmin;
}

// Kapitän + Co-Captain mit Recht 'verlegung' (Migration 0062).
const tcsVon = (teamId: string) => tcEmpfaenger(teamId, 'verlegung');
async function ligaleitung(): Promise<string[]> {
  const { data } = await db().from('profiles').select('id').in('role', ['league_admin', 'super_admin']);
  return ((data ?? []) as { id: string }[]).map(p => p.id);
}
async function melde(an: string[], ohne: string, n: { titel: string; text: string; url: string }) {
  const ids = [...new Set(an)].filter(id => id !== ohne);
  if (!ids.length) return;
  await db().from('notifications').insert(ids.map(id => ({
    recipient_user_id: id, type: 'match_reschedule', title: n.titel, message: n.text, short_text: n.text,
    related_entity_type: 'match_reschedules', action_url: n.url,
  })));
}

const darfFuerTeam = (u: ServerUser, b: Begegnung27) =>
  hatTcRechtServer(u, b.home, 'verlegung') || hatTcRechtServer(u, b.away, 'verlegung');
/** Kapitän/Co-Captain (Verlegung) GENAU dieses Teams — ohne Ligaleitungs-Sonderrecht. */
const tcDes = (u: ServerUser, teamId: string) => u.teamId === teamId && (u.role === 'team_captain' || u.coRechte.includes('verlegung'));

export async function ladeVerlegungen(u: ServerUser): Promise<Verlegung[]> {
  let q = db().from('match_reschedules').select(SPALTEN).eq('season_id', NEUE_SAISON.id).order('created_at', { ascending: false }).limit(200);
  if (!isAdminUser(u)) {
    if (!u.teamId) return [];
    q = q.or(`home_team_id.eq.${u.teamId},away_team_id.eq.${u.teamId}`);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Verlegung[];
}

/** Öffentlich: Begegnungen mit laufender Anfrage (nur die Kennung, für den Hinweis im Spielplan). */
export async function offeneVerlegungsKeys(): Promise<string[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.from('match_reschedules').select('match_key').eq('season_id', NEUE_SAISON.id).eq('kind', 'verlegung').in('status', ['offen', 'freigabe']);
  return ((data ?? []) as { match_key: string }[]).map(r => r.match_key);
}

export async function frageVerlegungAn(u: ServerUser, e: { key: string; datum: string; uhrzeit?: string | null; grund?: string | null }): Promise<Verlegung> {
  const b = alleBegegnungen27().find(x => x.key === e.key);
  if (!b) throw new Error('Unbekannte Begegnung.');
  if (!darfFuerTeam(u, b)) throw new Error('Verlegen dürfen nur die Teamcaptains der beiden Teams.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e.datum)) throw new Error('Bitte ein Datum wählen.');
  if (e.datum < heute()) throw new Error('Der neue Termin liegt in der Vergangenheit.');
  const zeit = e.uhrzeit && /^[0-2]\d:[0-5]\d$/.test(e.uhrzeit) ? e.uhrzeit : null;
  if (b.termin && b.termin.datum === e.datum && (b.termin.uhrzeit ?? null) === zeit) throw new Error('Das ist schon der aktuelle Termin.');
  const team = isAdminUser(u) && u.teamId !== b.home && u.teamId !== b.away ? b.home : u.teamId!;
  const { data, error } = await db().from('match_reschedules').insert({
    season_id: NEUE_SAISON.id, match_key: b.key, home_team_id: b.home, away_team_id: b.away,
    old_date: b.termin?.datum ?? null, old_time: b.termin?.uhrzeit ?? null,
    new_date: e.datum, new_time: zeit, reason: (e.grund ?? '').trim().slice(0, 200) || null,
    requested_team: team, requested_by: u.id, needs_admin: brauchtFreigabe(e.datum),
  }).select(SPALTEN).single();
  if (error) throw new Error(/eine_offene/.test(error.message) ? 'Für dieses Spiel läuft schon eine Anfrage.' : error.message);
  const v = data as Verlegung;
  const gegner = team === b.home ? b.away : b.home;
  await melde(await tcsVon(gegner), u.id, {
    titel: 'Verlegung angefragt',
    text: `${team27(team)?.name} möchte verlegen – ${verlegungText(v)}${v.reason ? ` („${v.reason}“)` : ''}. Bitte bestätigen oder ablehnen.`,
    url: '/mein-team/spielplan',
  });
  return v;
}

// ── Heimrechttausch ──────────────────────────────────────────

/** Beide Spiele einer Paarung (aktueller Plan), Hinspiel zuerst. */
export function paarSpiele(key: string): [Begegnung27, Begegnung27] | null {
  const b = alleBegegnungen27().find(x => x.key === key);
  if (!b) return null;
  const beide = alleBegegnungen27().filter(x => (x.home === b.home && x.away === b.away) || (x.home === b.away && x.away === b.home));
  if (beide.length !== 2) return null;
  const d = (x: Begegnung27) => x.termin?.datum ?? x.fri;
  beide.sort((x, y) => d(x).localeCompare(d(y)));
  return [beide[0], beide[1]];
}

async function hatSpielbericht(a: string, b: string): Promise<boolean> {
  const { data } = await db().from('match_reports').select('id')
    .eq('season_id', NEUE_SAISON.id)
    .or(`and(home_team_id.eq.${a},guest_team_id.eq.${b}),and(home_team_id.eq.${b},guest_team_id.eq.${a})`).limit(1);
  return (data ?? []).length > 0;
}

export async function frageHeimrechtAn(u: ServerUser, e: { key: string; grund?: string | null }): Promise<Verlegung> {
  const paar = paarSpiele(e.key);
  if (!paar) throw new Error('Zu dieser Begegnung gibt es kein Hin- und Rückspiel.');
  const [hin, rueck] = paar;
  if (!darfFuerTeam(u, hin)) throw new Error('Das Heimrecht tauschen dürfen nur die Teamcaptains der beiden Teams.');
  if (await hatSpielbericht(hin.home, hin.away)) throw new Error('Für diese Paarung gibt es schon einen Spielbericht – Heimrecht tauschen geht nicht mehr.');
  const { data: laufend } = await db().from('match_reschedules').select('id').eq('season_id', NEUE_SAISON.id)
    .in('match_key', [hin.key, rueck.key]).in('status', ['offen', 'freigabe', 'bestaetigt']).limit(1);
  if ((laufend ?? []).length) throw new Error('Für eines der beiden Spiele läuft schon eine Anfrage (Verlegung oder Tausch).');
  const team = isAdminUser(u) && u.teamId !== hin.home && u.teamId !== hin.away ? hin.home : u.teamId!;
  const { data, error } = await db().from('match_reschedules').insert({
    season_id: NEUE_SAISON.id, kind: 'heimrecht', match_key: hin.key, home_team_id: hin.home, away_team_id: hin.away,
    old_date: hin.termin?.datum ?? null, old_time: hin.termin?.uhrzeit ?? null, new_date: null, new_time: null,
    reason: (e.grund ?? '').trim().slice(0, 200) || null, requested_team: team, requested_by: u.id, needs_admin: false,
  }).select(SPALTEN).single();
  if (error) throw new Error(/eine_offene/.test(error.message) ? 'Für diese Paarung läuft schon eine Anfrage.' : error.message);
  const v = data as Verlegung;
  const gegner = team === hin.home ? hin.away : hin.home;
  await melde(await tcsVon(gegner), u.id, {
    titel: 'Heimrechttausch angefragt',
    text: `${team27(team)?.name} möchte das Heimrecht tauschen – ${verlegungText(v)}${v.reason ? ` („${v.reason}“)` : ''}. Bitte bestätigen oder ablehnen.`,
    url: '/mein-team/spielplan',
  });
  return v;
}

/** Zusagen, Details (Aufstellung/Treffzeit/Notiz) und Aufgaben beider Teams auf die neue Kennung umhängen. */
async function kennungenTauschen(k1: string, k2: string, teams: string[]) {
  const tmp = `${k1}#tausch`;
  for (const t of ['match_availability', 'match_team_details', 'match_tasks']) {
    const tausch = async (von: string, nach: string) => {
      const r = await db().from(t).update({ match_key: nach }).eq('season_id', NEUE_SAISON.id).in('team_id', teams).eq('match_key', von);
      if (r.error && !/does not exist|schema cache/.test(r.error.message)) throw new Error(`${t}: ${r.error.message}`);
    };
    await tausch(k1, tmp); await tausch(k2, k1); await tausch(tmp, k2);
  }
}

async function uebernehmeHeimrecht(v: Verlegung, wer: string): Promise<Verlegung> {
  try {
    const paar = paarSpiele(v.match_key);
    if (!paar) throw new Error('Paarung nicht gefunden – evtl. schon getauscht.');
    const [hin, rueck] = paar;
    if (await hatSpielbericht(hin.home, hin.away)) throw new Error('Inzwischen gibt es einen Spielbericht – Tausch nicht mehr möglich.');
    const a = hin.home, b = hin.away;
    // (1) Verlegte Termine der beiden Spiele wandern mit (Schlüssel tauschen)
    const k1 = `${a}|${b}`, k2 = `${b}|${a}`;
    if (VERLEGUNGEN_2027[k1] || VERLEGUNGEN_2027[k2]) {
      await aendereJsonDatei<Record<string, unknown>>(DATEI, alt => {
        const neu = { ...alt }; const x = alt[k1], y = alt[k2];
        delete neu[k1]; delete neu[k2];
        if (x) neu[k2] = x; if (y) neu[k1] = y;
        return neu;
      }, `Heimrechttausch ${paarung(v)}: verlegte Termine wandern mit\n\nAnfrage ${v.id}.`);
    }
    // (2) Tausch eintragen → Neubau
    const sha = await aendereJsonDatei<{ a: string; b: string; am?: string }[]>(DATEI_HR, alt => [...(Array.isArray(alt) ? alt : []), { a, b, am: heute() }],
      `Heimrecht getauscht: ${paarung(v)} (Hin- und Rückspiel, Termine bleiben)\n\nBestätigt über die Seite (${wer}), Anfrage ${v.id}.`);
    // (3) Zusagen & Co. umhängen
    await kennungenTauschen(hin.key, rueck.key, [a, b]);
    return await setze(v.id, { status: 'uebernommen', applied_at: new Date().toISOString(), applied_commit: sha }, ['bestaetigt']);
  } catch (e) {
    return await setze(v.id, { note: `Noch nicht übernommen: ${(e as Error).message}` }, ['bestaetigt']);
  }
}

async function lade(id: string): Promise<Verlegung> {
  const { data, error } = await db().from('match_reschedules').select(SPALTEN).eq('id', id).maybeSingle();
  if (error || !data) throw new Error('Anfrage nicht gefunden.');
  return data as Verlegung;
}
async function setze(id: string, werte: Record<string, unknown>, nurWenn: VerlegungStatus[]): Promise<Verlegung> {
  const { data, error } = await db().from('match_reschedules').update(werte).eq('id', id).in('status', nurWenn).select(SPALTEN).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Die Anfrage wurde inzwischen schon bearbeitet.');
  return data as Verlegung;
}

/** Neuen Termin in verlegungen-2027.json schreiben (ein Commit → Neubau). */
async function uebernehmen(v: Verlegung, wer: string): Promise<Verlegung> {
  try {
    const sha = await aendereJsonDatei<Record<string, unknown>>(DATEI, alt => ({
      ...alt, [v.match_key]: { datum: v.new_date, ...(v.new_time ? { uhrzeit: v.new_time } : {}), am: heute() },
    }), `Spiel verlegt: ${paarung(v)} auf ${termin(v.new_date, v.new_time)}\n\nBestätigt über die Seite (${wer}), Anfrage ${v.id}.`);
    return await setze(v.id, { status: 'uebernommen', applied_at: new Date().toISOString(), applied_commit: sha }, ['bestaetigt']);
  } catch (e) {
    return await setze(v.id, { note: `Noch nicht übernommen: ${(e as Error).message}` }, ['bestaetigt']);
  }
}

export async function beantworteVerlegung(u: ServerUser, id: string, aktion: 'bestaetigen' | 'ablehnen' | 'zurueckziehen', grund?: string | null): Promise<Verlegung> {
  const v = await lade(id);
  const gegner = v.requested_team === v.home_team_id ? v.away_team_id : v.home_team_id;
  const istAntragsteller = tcDes(u, v.requested_team);
  const istGegner = tcDes(u, gegner);
  const admin = isAdminUser(u);
  const jetzt = new Date().toISOString();

  if (aktion === 'zurueckziehen') {
    if (!istAntragsteller && !admin) throw new Error('Zurückziehen kann nur, wer angefragt hat.');
    const n = await setze(id, { status: 'zurueckgezogen', decided_at: jetzt, decided_by: u.id }, ['offen', 'freigabe']);
    await melde(await tcsVon(gegner), u.id, { titel: n.kind === 'heimrecht' ? 'Heimrechttausch zurückgezogen' : 'Verlegung zurückgezogen', text: `Anfrage zurückgezogen – ${verlegungText(n)}. Es bleibt, wie es war.`, url: '/mein-team/spielplan' });
    return n;
  }
  if (!istGegner && !admin) throw new Error('Bestätigen oder ablehnen kann nur der Teamcaptain des Gegners.');
  if (aktion === 'ablehnen') {
    const n = await setze(id, { status: 'abgelehnt', decided_at: jetzt, decided_by: u.id, note: (grund ?? '').trim().slice(0, 200) || null }, ['offen']);
    await melde(await tcsVon(v.requested_team), u.id, { titel: n.kind === 'heimrecht' ? 'Heimrechttausch abgelehnt' : 'Verlegung abgelehnt', text: `${team27(gegner)?.name} hat abgelehnt – ${verlegungText(n)}${n.note ? ` („${n.note}“)` : ''}. Es bleibt, wie es war.`, url: '/mein-team/spielplan' });
    return n;
  }
  // bestaetigen
  if (v.kind === 'heimrecht') {
    let n = await setze(id, { status: 'bestaetigt', decided_at: jetzt, decided_by: u.id }, ['offen']);
    n = await uebernehmeHeimrecht(n, `${team27(gegner)?.name ?? gegner} bestätigt`);
    const ok = n.status === 'uebernommen';
    await melde(await tcsVon(v.requested_team), u.id, { titel: 'Heimrechttausch bestätigt', text: `${team27(gegner)?.name} ist einverstanden – ${verlegungText(n)}.${ok ? ' Der Spielplan ist in wenigen Minuten angepasst.' : ''}`, url: '/mein-team/spielplan' });
    await melde(await ligaleitung(), u.id, { titel: 'Heimrecht getauscht', text: `Zur Info – ${verlegungText(n)} (beide Teams einverstanden)${ok ? '' : ' · noch nicht übernommen, siehe Admin → Verlegungen'}.`, url: '/admin/verlegungen' });
    return n;
  }
  if (v.needs_admin) {
    const n = await setze(id, { status: 'freigabe', decided_at: jetzt, decided_by: u.id }, ['offen']);
    await melde(await ligaleitung(), u.id, { titel: 'Verlegung: Freigabe nötig', text: `Beide Teams einverstanden, Termin liegt außerhalb der Saison – ${verlegungText(n)}.`, url: '/admin/verlegungen' });
    await melde(await tcsVon(v.requested_team), u.id, { titel: 'Verlegung bestätigt', text: `${team27(gegner)?.name} ist einverstanden – ${verlegungText(n)}. Weil der Termin außerhalb der Saison liegt, muss noch die Ligaleitung freigeben.`, url: '/mein-team/spielplan' });
    return n;
  }
  let n = await setze(id, { status: 'bestaetigt', decided_at: jetzt, decided_by: u.id }, ['offen']);
  n = await uebernehmen(n, `${team27(gegner)?.name ?? gegner} bestätigt`);
  await melde(await tcsVon(v.requested_team), u.id, { titel: 'Verlegung bestätigt', text: `${team27(gegner)?.name} ist einverstanden – ${verlegungText(n)}. Der neue Termin steht in wenigen Minuten im Spielplan.`, url: '/mein-team/spielplan' });
  await melde(await ligaleitung(), u.id, { titel: 'Spiel verlegt', text: `Zur Info – ${verlegungText(n)} (beide Teams einverstanden)${n.status === 'uebernommen' ? '' : ' · noch nicht übernommen, siehe Admin → Verlegungen'}.`, url: '/admin/verlegungen' });
  return n;
}

export async function gibVerlegungFrei(u: ServerUser, id: string, aktion: 'freigeben' | 'ablehnen' | 'uebernehmen', grund?: string | null): Promise<Verlegung> {
  if (!isAdminUser(u)) throw new Error('Nur für die Ligaleitung.');
  const v = await lade(id);
  const beide = [...await tcsVon(v.home_team_id), ...await tcsVon(v.away_team_id)];
  const jetzt = new Date().toISOString();
  if (aktion === 'ablehnen') {
    const n = await setze(id, { status: 'abgelehnt', admin_at: jetzt, admin_by: u.id, note: (grund ?? '').trim().slice(0, 200) || 'Von der Ligaleitung nicht freigegeben.' }, ['offen', 'freigabe']);
    await melde(beide, u.id, { titel: 'Verlegung nicht freigegeben', text: `Die Ligaleitung hat nicht freigegeben – ${verlegungText(n)}${n.note ? ` („${n.note}“)` : ''}. Es bleibt beim bisherigen Termin.`, url: '/mein-team/spielplan' });
    return n;
  }
  let n = aktion === 'freigeben'
    ? await setze(id, { status: 'bestaetigt', admin_at: jetzt, admin_by: u.id }, ['freigabe'])
    : v.status === 'bestaetigt' ? v : (() => { throw new Error('Nur bestätigte, noch nicht übernommene Anfragen.'); })();
  n = n.kind === 'heimrecht' ? await uebernehmeHeimrecht(n, 'Ligaleitung') : await uebernehmen(n, 'Ligaleitung');
  if (aktion === 'freigeben') await melde(beide, u.id, { titel: 'Verlegung freigegeben', text: `Die Ligaleitung hat freigegeben – ${verlegungText(n)}. Der neue Termin steht in wenigen Minuten im Spielplan.`, url: '/mein-team/spielplan' });
  return n;
}
