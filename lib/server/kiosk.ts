// ============================================================
// Tablet im Lokal (Kiosk) — Server (Migration 0072, Betreiber 19.11.2026)
// ============================================================
// Das Tablet hat kein Konto und redet nie direkt mit der Datenbank. Es kennt
// nur einen Geräte-Schlüssel; hier wird bei JEDEM Aufruf geprüft:
//   1. Schlüssel (nur sein SHA-256 liegt in `kiosk_geraete`) → Team. Das Gerät
//      schickt nie eine Team- oder Begegnungs-Kennung.
//   2. Team hat den Team Manager und ist für das Tablet freigegeben.
//   3. Die Begegnung bestimmt der Server: das Heimspiel dieses Teams am
//      heutigen Spieltag (`spieltagDatum`, Tag endet um 4 Uhr).
//   4. Geschrieben wird nur der ENTWURF genau dieser Begegnung.
// Das Tablet kann absenden (wie eine Spielbericht-Vertretung), aber nichts
// bestätigen, keinen Protest, keine Korrektur, keine Wertung, keine anderen
// Spiele. Die Tabelle hat keine Policy — nur service_role kommt heran.
// ============================================================

import 'server-only';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { nominatedRosterRows } from '@/lib/supabase/season-teams';
import { computeTotals, bestOfFuerLiga, type BestOf, type HighlightEntry, type ReportGame } from '@/lib/supabase/match-reports';
import { alleBegegnungen27, findLiga27, team27, venue27, NEUE_SAISON, type Begegnung27 } from '@/lib/data/saison-2027';
import { spieltagDatum } from '@/lib/live-ticker';
import { teamManagerAktiv } from '@/lib/server/premium';
import { ergebnisSeitenMarkieren } from '@/lib/server/ergebnis-neubau';
import { liveStartPush } from '@/lib/server/live-start';
import { absendeFehler, CODE_LAENGE, heimspielAm, kioskErlaubt, leereSpiele, naechstesHeimspiel, pruefeStand, type KioskStand } from '@/lib/kiosk';

export const KIOSK_COOKIE = 'mdu-kiosk';
export const KIOSK_KOPF = 'x-kiosk-token';
/** So lange gilt ein Kopplungscode. */
export const CODE_MINUTEN = 15;

export interface Geraet { id: string; team_id: string; name: string; erstellt_von: string | null; last_seen_at: string | null; test_bis?: string | null; test_fertig?: boolean | null }

// ── Testspiel (Migration 0073) ─────────────────────────────────
// Zum Ausprobieren vor dem ersten echten Heimspiel: Der Kapitän schaltet ein
// gekoppeltes Gerät für TEST_STUNDEN in den Testmodus. Das Tablet zeigt dann
// „eigenes Team – Testgegner“ und speichert über denselben Weg wie im
// Echtbetrieb — aber in einen Bericht OHNE Saison (season_id null, Kennzeichen
// `league_label = TEST_LABEL`, kein Gastteam). Alles Öffentliche (Live-Ticker,
// Tabellen, Ergebnisse, Statistik) liest nur Berichte der Saison und sieht ihn
// nicht. „Absenden“ reicht im Test NICHT wirklich ein (sonst Glocke + Push an
// die ganze Ligaleitung), es merkt sich nur `test_fertig`. Kein Start-Push,
// kein Neubau. Beenden löscht den Testbericht.
export const TEST_STUNDEN = 3;
export const TEST_LABEL = 'Tablet-Test';
const TEST_GAST = 'Testgegner';
const TEST_KADER = ['Test Gast 1', 'Test Gast 2', 'Test Gast 3', 'Test Gast 4', 'Test Gast 5', 'Test Gast 6'];
export const testLaeuft = (g: Pick<Geraet, 'test_bis'>) => !!g.test_bis && new Date(g.test_bis).getTime() > Date.now();

const testBerichte = (team: string) => db().from('match_reports').delete().is('season_id', null).eq('home_team_id', team).eq('league_label', TEST_LABEL);
export async function testStarten(team: string, id: string): Promise<string | null> {
  await testBerichte(team);
  const { data, error } = await db().from('kiosk_geraete')
    .update({ test_bis: new Date(Date.now() + TEST_STUNDEN * 3600_000).toISOString(), test_fertig: false })
    .eq('id', id).eq('team_id', team).not('token_hash', 'is', null).select('id');
  if (error) return /test_bis|test_fertig/.test(error.message) ? 'Die Datenbank kennt das Testspiel noch nicht — Migration 0073 fehlt.' : 'Das hat nicht geklappt.';
  return data?.length ? null : 'Das Gerät ist noch nicht eingerichtet – erst den Code am Tablet eintippen.';
}
export async function testBeenden(team: string): Promise<void> {
  await testBerichte(team);
  await db().from('kiosk_geraete').update({ test_bis: null, test_fertig: false }).eq('team_id', team).not('test_bis', 'is', null);
}

export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export const neuerCode = () => String(randomInt(0, 10 ** CODE_LAENGE)).padStart(CODE_LAENGE, '0');
export const neuerSchluessel = () => randomBytes(32).toString('base64url');
export const migrationFehlt = (m: string | undefined) => /kiosk_geraete/.test(m ?? '');

function db() {
  if (!supabaseAdmin) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  return supabaseAdmin;
}

/** Schlüssel aus Kopfzeile oder Cookie → Gerät (oder null). */
export async function geraetVon(request: Request): Promise<Geraet | null> {
  if (!supabaseAdmin) return null;
  const cookie = (request.headers.get('cookie') ?? '').split(/;\s*/).find(c => c.startsWith(`${KIOSK_COOKIE}=`))?.slice(KIOSK_COOKIE.length + 1);
  const token = (request.headers.get(KIOSK_KOPF) ?? '').trim() || cookie || '';
  if (token.length < 30 || token.length > 100) return null;
  const sp = 'id, team_id, name, erstellt_von, last_seen_at';
  let { data, error } = await supabaseAdmin.from('kiosk_geraete').select(`${sp}, test_bis, test_fertig`)
    .eq('token_hash', hash(token)).is('gesperrt_am', null).maybeSingle();
  // Ohne Migration 0073 gibt es die Test-Spalten nicht — dann eben ohne Testmodus.
  if (error) ({ data, error } = await supabaseAdmin.from('kiosk_geraete').select(sp).eq('token_hash', hash(token)).is('gesperrt_am', null).maybeSingle() as never);
  const g = data as Geraet | null;
  if (!g) return null;
  // „Zuletzt aktiv“ höchstens alle 5 Minuten schreiben.
  if (!g.last_seen_at || Date.now() - new Date(g.last_seen_at).getTime() > 5 * 60_000) {
    void supabaseAdmin.from('kiosk_geraete').update({ last_seen_at: new Date().toISOString() }).eq('id', g.id).then(() => {});
  }
  return g;
}

/** Code gegen Schlüssel tauschen — einmalig; der Code ist danach verbraucht. */
export async function koppeln(code: string): Promise<{ token: string; team: string } | { fehler: string }> {
  const { data, error } = await db().from('kiosk_geraete').select('id, team_id')
    .eq('code_hash', hash(code)).gt('code_bis', new Date().toISOString()).is('gesperrt_am', null).limit(1).maybeSingle();
  if (error) return { fehler: migrationFehlt(error.message) ? 'Die Tablet-Eingabe ist noch nicht eingerichtet.' : 'Das hat nicht geklappt – bitte noch einmal versuchen.' };
  const g = data as { id: string; team_id: string } | null;
  if (!g) return { fehler: 'Der Code stimmt nicht oder ist abgelaufen. Lass dir vom Kapitän einen neuen geben.' };
  const token = neuerSchluessel();
  const { data: ok } = await db().from('kiosk_geraete')
    .update({ token_hash: hash(token), code_hash: null, code_bis: null, gekoppelt_am: new Date().toISOString(), last_seen_at: new Date().toISOString() })
    .eq('id', g.id).eq('code_hash', hash(code)).select('id');
  if (!ok?.length) return { fehler: 'Der Code wurde gerade schon benutzt.' };
  return { token, team: g.team_id };
}

// ── Kader (Namen fürs Antippen; Passnummern bleiben auf dem Server) ──
interface KaderZeile { id: string | null; name: string; passNo: string | null; kapitaen: boolean }
async function kader(team: string): Promise<KaderZeile[]> {
  const { data } = await db().from('season_roster_assignments')
    .select('first_name, last_name, license_number, is_captain, player_id').eq('season_id', NEUE_SAISON.id).eq('team_id', team);
  const rows = ((data ?? []) as { first_name: string | null; last_name: string | null; license_number: string | null; is_captain: boolean; player_id: string | null }[])
    .map(r => ({ id: r.player_id, name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(), passNo: r.license_number, kapitaen: !!r.is_captain }))
    .filter(r => r.name);
  const noms = await nominatedRosterRows(db(), NEUE_SAISON.id, rows.map(r => r.id), team);
  const alle: KaderZeile[] = [...rows, ...noms.map(n => ({ id: n.player_id, name: `${n.first_name} ${n.last_name}`.trim(), passNo: n.license_number, kapitaen: n.is_captain }))];
  const ids = alle.map(a => a.id).filter((x): x is string => !!x);
  if (ids.length) {
    const { data: lic } = await db().from('players').select('id, license_number').in('id', ids);
    const m = new Map(((lic ?? []) as { id: string; license_number: string | null }[]).map(p => [p.id, p.license_number]));
    for (const a of alle) if (a.id && m.get(a.id)) a.passNo = m.get(a.id)!;
  }
  const gesehen = new Set<string>();
  return alle.filter(a => !gesehen.has(a.name) && gesehen.add(a.name)).sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

interface Bericht { id: string; status: string; forfeit: string | null; updated_at: string; highlights: HighlightEntry[] | null }
async function berichtZu(b: Begegnung27, test = false): Promise<Bericht | null> {
  const q = db().from('match_reports').select('id, status, forfeit, updated_at, highlights').eq('home_team_id', b.home);
  const { data } = await (test
    ? q.is('season_id', null).eq('league_label', TEST_LABEL)
    : q.eq('season_id', NEUE_SAISON.id).eq('guest_team_id', b.away)).limit(1).maybeSingle();
  return data as Bericht | null;
}

async function standVon(r: Bericht): Promise<KioskStand> {
  const [{ data: ps }, { data: gs }] = await Promise.all([
    db().from('match_report_players').select('side, slot, name').eq('report_id', r.id),
    db().from('match_report_games').select('game_no, game_type, home_slot, guest_slot, home_slot2, guest_slot2, legs_home, legs_guest').eq('report_id', r.id),
  ]);
  const spieler = (ps ?? []) as { side: 'home' | 'guest'; slot: number; name: string }[];
  const seite = (s: 'home' | 'guest') => spieler.filter(p => p.side === s).map(p => ({ slot: p.slot, name: p.name })).sort((a, b) => a.slot - b.slot);
  const da = (gs ?? []) as ReportGame[];
  // Fehlt ein Spiel (z. B. halb gespeicherter Stand), kommt die leere Zeile des Bogens.
  const games = leereSpiele().map(l => da.find(g => g.game_no === l.game_no) ?? l);
  return { heim: seite('home'), gast: seite('guest'), games, highlights: r.highlights ?? [] };
}

/** Aufstellung aus dem Team Manager (match_team_details) als Vorbelegung, solange es noch keinen Bericht gibt. */
async function vorbelegung(b: Begegnung27, kh: KaderZeile[], kg: KaderZeile[]): Promise<Pick<KioskStand, 'heim' | 'gast'>> {
  const { data } = await db().from('match_team_details').select('team_id, lineup')
    .eq('season_id', NEUE_SAISON.id).eq('match_key', b.key).in('team_id', [b.home, b.away]);
  const von = (team: string, k: KaderZeile[]) => {
    const l = ((data ?? []) as { team_id: string; lineup: string[] | null }[]).find(r => r.team_id === team)?.lineup ?? [];
    return l.map((id, i) => ({ slot: i + 1, name: !id ? '' : k.find(x => x.id === id)?.name ?? (id.startsWith('name:') ? id.slice(5) : '') }))
      .filter(p => p.name && p.slot <= 8);
  };
  return { heim: von(b.home, kh), gast: von(b.away, kg) };
}

export type KioskLage =
  | { art: 'aus' | 'kein_premium'; team: string }
  | { art: 'kein_spiel'; team: string; naechstes: { gegner: string; datum: string; uhrzeit: string | null } | null }
  | {
    art: 'spiel'; team: string; key: string; heimId: string; gastId: string | null; test: boolean; heimName: string; gastName: string; liga: string; datum: string; ort: string; bestOf: BestOf;
    kaderHeim: string[]; kaderGast: string[];
    /** offen = Entwurf (oder noch nichts), abgesendet = eingereicht/bestätigt, gesperrt = Wertung der Ligaleitung */
    status: 'offen' | 'abgesendet' | 'gesperrt';
    stand: KioskStand; basis: string | null;
  };

interface Rahmen { b: Begegnung27; datum: string; bestOf: BestOf; test: boolean }
async function rahmen(g: Geraet): Promise<Rahmen | { lage: KioskLage }> {
  const teamName = team27(g.team_id)?.name ?? g.team_id;
  if (!kioskErlaubt(g.team_id)) return { lage: { art: 'aus', team: teamName } };
  if (!(await teamManagerAktiv(g.team_id))) return { lage: { art: 'kein_premium', team: teamName } };
  const datum = spieltagDatum(new Date());
  if (testLaeuft(g)) {
    const liga = team27(g.team_id)?.league ?? 'c';
    const b: Begegnung27 = { key: `test|${g.team_id}`, liga, spieltag: 0, half: 'hin', fri: datum, sun: datum, home: g.team_id, away: '', derby: false, termin: null };
    return { b, datum, bestOf: bestOfFuerLiga(liga), test: true };
  }
  // Abgelaufenes Testspiel: Testbericht wegräumen.
  if (g.test_bis) await testBeenden(g.team_id).catch(() => {});
  const plan = alleBegegnungen27();
  const b = heimspielAm(plan, g.team_id, datum);
  if (!b) {
    const n = naechstesHeimspiel(plan, g.team_id, datum);
    return { lage: { art: 'kein_spiel', team: teamName, naechstes: n ? { gegner: team27(n.away)?.name ?? n.away, datum: n.termin!.datum, uhrzeit: n.termin!.uhrzeit ?? null } : null } };
  }
  return { b, datum, bestOf: bestOfFuerLiga(b.liga), test: false };
}

export async function lage(g: Geraet): Promise<KioskLage> {
  const r = await rahmen(g);
  if ('lage' in r) return r.lage;
  const { b, datum, bestOf, test } = r;
  const [kh, kg, bericht] = await Promise.all([kader(b.home), test ? gastKaderTest() : kader(b.away), berichtZu(b, test)]);
  const stand: KioskStand = bericht ? await standVon(bericht)
    : { ...(test ? { heim: [], gast: [] } : await vorbelegung(b, kh, kg)), games: leereSpiele(), highlights: [] };
  return {
    art: 'spiel', team: team27(b.home)?.name ?? b.home, key: b.key, heimId: b.home, gastId: test ? null : b.away, test,
    heimName: team27(b.home)?.name ?? b.home, gastName: test ? TEST_GAST : team27(b.away)?.name ?? b.away,
    liga: findLiga27(b.liga)?.name ?? b.liga, datum, ort: venue27(team27(b.home)?.venueId)?.name ?? '', bestOf,
    kaderHeim: kh.map(k => k.name), kaderGast: kg.map(k => k.name),
    status: test ? (g.test_fertig ? 'abgesendet' : 'offen') : !bericht ? 'offen' : bericht.forfeit ? 'gesperrt' : bericht.status === 'draft' ? 'offen' : 'abgesendet',
    stand, basis: bericht?.updated_at ?? null,
  };
}

const gastKaderTest = async (): Promise<KaderZeile[]> => TEST_KADER.map(name => ({ id: null, name, passNo: null, kapitaen: false }));

/** Konto, unter dem der Bericht läuft (Pflichtfeld): Kapitän des Teams, sonst wer das Gerät eingerichtet hat. */
async function kapitaenKonto(g: Geraet): Promise<string | null> {
  const { data } = await db().from('profiles').select('id').eq('team_id', g.team_id).eq('role', 'team_captain').limit(1);
  return (data as { id: string }[] | null)?.[0]?.id ?? g.erstellt_von;
}

export type SpeicherErgebnis =
  | { ok: true; basis: string; abgesendet: boolean }
  | { ok: false; status: number; fehler: string; konflikt?: boolean };

/**
 * Speichert den Stand des Tablets in den Entwurf der heutigen Begegnung und
 * sendet ihn auf Wunsch ab. `basis` = `updated_at`, das das Tablet zuletzt
 * gesehen hat: Hat inzwischen jemand anderes gespeichert (Kapitän am Handy),
 * wird NICHT überschrieben — das Tablet holt sich den neuen Stand.
 */
export async function speichern(g: Geraet, roh: unknown, basis: string | null, absenden: boolean): Promise<SpeicherErgebnis> {
  const r = await rahmen(g);
  if ('lage' in r) return { ok: false, status: 409, fehler: r.lage.art === 'kein_spiel' ? 'Heute ist kein Heimspiel.' : 'Die Tablet-Eingabe ist für dieses Team nicht aktiv.' };
  const { b, datum, bestOf, test } = r;
  if (test && g.test_fertig) return { ok: false, status: 409, konflikt: true, fehler: 'Das Testspiel ist schon abgesendet.' };
  const p = pruefeStand(roh, bestOf);
  if (!p.stand) return { ok: false, status: 400, fehler: p.fehler };
  const stand = p.stand;
  if (absenden) { const f = absendeFehler(stand); if (f) return { ok: false, status: 400, fehler: f }; }

  let bericht = await berichtZu(b, test);
  if (bericht && (bericht.status !== 'draft' || bericht.forfeit)) return { ok: false, status: 409, konflikt: true, fehler: 'Der Spielbericht ist schon abgesendet.' };
  if (bericht && bericht.updated_at !== basis) return { ok: false, status: 409, konflikt: true, fehler: 'Auf einem anderen Gerät wurde inzwischen gespeichert.' };

  const [kh, kg] = await Promise.all([kader(b.home), test ? gastKaderTest() : kader(b.away)]);
  const totals = computeTotals(stand.games);
  const summen = {
    highlights: stand.highlights,
    spiele_home: totals.spieleHome, spiele_guest: totals.spieleGuest,
    legs_home: totals.legsHome, legs_guest: totals.legsGuest,
    points_home: totals.pointsHome, points_guest: totals.pointsGuest,
  };

  if (!bericht) {
    const konto = await kapitaenKonto(g);
    if (!konto) return { ok: false, status: 409, fehler: 'Für das Team ist kein Kapitäns-Konto hinterlegt.' };
    const { data, error } = await db().from('match_reports').insert({
      // Testspiel: OHNE Saison und ohne Gastteam — nichts Öffentliches liest so einen Bericht.
      season_id: test ? null : NEUE_SAISON.id, league_label: test ? TEST_LABEL : findLiga27(b.liga)?.name ?? b.liga,
      matchday: test ? null : b.spieltag, match_date: datum,
      venue: venue27(team27(b.home)?.venueId)?.name ?? '',
      home_team_id: b.home, guest_team_id: test ? null : b.away,
      home_team_name: team27(b.home)?.name ?? b.home, guest_team_name: test ? `${TEST_GAST} (Tablet-Test)` : team27(b.away)?.name ?? b.away,
      tc_home: kh.find(k => k.kapitaen)?.name ?? '', tc_guest: kg.find(k => k.kapitaen)?.name ?? '',
      protest: false, protest_note: '', confirm_team_id: test ? null : b.away, home_captain_user_id: konto, status: 'draft', ...summen,
    }).select('id, status, forfeit, updated_at, highlights').maybeSingle();
    if (error || !data) {
      // Zwei Geräte legen gleichzeitig an (Unique-Index je Begegnung) → das Tablet holt den Stand neu.
      if (/duplicate key|match_reports_fixture_uq/i.test(error?.message ?? '')) return { ok: false, status: 409, konflikt: true, fehler: 'Der Spielbericht wurde gerade auf einem anderen Gerät angelegt.' };
      return { ok: false, status: 500, fehler: 'Speichern hat nicht geklappt.' };
    }
    bericht = data as Bericht;
    await db().from('match_report_history').insert({ report_id: bericht.id, action: 'kiosk_angelegt', actor_user_id: null, note: `Tablet „${g.name}“` });
  } else {
    // Nur solange der Bericht Entwurf ist UND noch dem Stand entspricht, den das Tablet kennt.
    const { data, error } = await db().from('match_reports').update(summen)
      .eq('id', bericht.id).eq('status', 'draft').eq('updated_at', bericht.updated_at).select('id');
    if (error) return { ok: false, status: 500, fehler: 'Speichern hat nicht geklappt.' };
    if (!data?.length) return { ok: false, status: 409, konflikt: true, fehler: 'Auf einem anderen Gerät wurde inzwischen gespeichert.' };
  }
  const id = bericht.id;

  const zeile = (side: 'home' | 'guest', k: KaderZeile[]) => (side === 'home' ? stand.heim : stand.gast).map(s => {
    const treffer = k.find(x => x.name === s.name);
    return {
      report_id: id, side, slot: s.slot, name: s.name, pass_no: treffer?.passNo ?? null, player_id: treffer?.id ?? null,
      points: (side === 'home' ? totals.homePlayerPoints[s.slot] : totals.guestPlayerPoints[s.slot]) ?? 0,
    };
  });
  await db().from('match_report_players').delete().eq('report_id', id);
  await db().from('match_report_games').delete().eq('report_id', id);
  const spieler = [...zeile('home', kh), ...zeile('guest', kg)];
  const e1 = spieler.length ? (await db().from('match_report_players').insert(spieler)).error : null;
  const e2 = (await db().from('match_report_games').insert(stand.games.map(s => ({ report_id: id, ...s })))).error;
  if (e1 || e2) return { ok: false, status: 500, fehler: 'Speichern hat nicht geklappt.' };

  // Erfassungs-Statistik (Migration 0055) — schlägt sie fehl, merkt niemand etwas.
  const gefuellt = stand.games.filter(s => s.legs_home != null).length;
  if (!test) await db().from('match_report_saves').insert({ report_id: id, games_filled: gefuellt, live_mode: true }).then(() => {}, () => {});

  if (absenden && test) {
    // Im Test wird NICHT eingereicht (keine Glocke, kein Push, kein Neubau) — das Gerät merkt sich nur „fertig“.
    await db().from('kiosk_geraete').update({ test_fertig: true }).eq('id', g.id);
  } else if (absenden) {
    // Der Trigger schreibt Verlauf + Glocke an den Gast, wie beim Absenden aus dem Formular.
    const { data, error } = await db().from('match_reports').update({ status: 'submitted' }).eq('id', id).eq('status', 'draft').select('id');
    if (error || !data?.length) return { ok: false, status: 500, fehler: 'Absenden hat nicht geklappt – bitte noch einmal.' };
    await db().from('match_report_history').insert({ report_id: id, action: 'kiosk_abgesendet', actor_user_id: null, note: `Tablet „${g.name}“` });
    ergebnisSeitenMarkieren();
  } else if (gefuellt && !test) {
    void liveStartPush(id).catch(() => {});
  }
  const { data: neu } = await db().from('match_reports').select('updated_at').eq('id', id).maybeSingle();
  return { ok: true, basis: (neu as { updated_at: string } | null)?.updated_at ?? '', abgesendet: absenden };
}
