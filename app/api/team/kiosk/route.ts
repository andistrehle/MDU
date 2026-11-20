// ============================================================
// /api/team/kiosk — Tablets des Teams verwalten (Migration 0072)
// ============================================================
// GET  ?team=…                          → { geraete, erlaubt }
// POST { team, aktion: 'neu', name }    → neues Gerät + Kopplungscode (einmal sichtbar)
// POST { team, aktion: 'code', id }     → neuer Code für ein Gerät (koppelt es neu, alter Schlüssel erlischt)
// POST { team, aktion: 'entfernen', id }→ Gerät löschen (Schlüssel sofort ungültig)
// POST { team, aktion: 'test_start', id } → Testspiel auf diesem Gerät (Migration 0073, lib/server/kiosk.ts)
// POST { team, aktion: 'test_ende' }      → Testspiel beenden, Testbericht löschen
// POST { team, aktion: 'auswaerts', id, an } → NUR Ligaleitung: Gerät darf auch Auswärtsspiele des Teams führen (Migration 0074)
// Darf: Kapitän, Co-Captain mit Recht „Spielberichte“, Ligaleitung — und nur
// mit Team Manager und solange das Team für das Tablet freigegeben ist.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, hatTcRechtServer, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { teamManagerAktiv } from '@/lib/server/premium';
import { kioskErlaubt } from '@/lib/kiosk';
import { CODE_MINUTEN, hash, migrationFehlt, neuerCode, testBeenden, testStarten } from '@/lib/server/kiosk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_GERAETE = 3;
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const SPALTEN = 'id, name, erstellt_am, gekoppelt_am, last_seen_at, code_bis';
const dbFehler = (m: string) => fehler(migrationFehlt(m) ? 'Die Datenbank kennt die Tablets noch nicht — Migration 0072 fehlt.' : 'Das hat nicht geklappt.', 500);

async function pruefe(request: Request, team: string) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return { antwort: fehler(auth.message, auth.status) };
  if (!team || !hatTcRechtServer(auth.user, team, 'spielberichte')) return { antwort: fehler('Kein Zugriff.', 403) };
  if (!supabaseAdmin) return { antwort: fehler('Server-Datenbank ist nicht konfiguriert.', 503) };
  return { user: auth.user, db: supabaseAdmin };
}

export async function GET(request: Request) {
  const team = new URL(request.url).searchParams.get('team') ?? '';
  const p = await pruefe(request, team);
  if ('antwort' in p) return p.antwort;
  const erlaubt = kioskErlaubt(team) && await teamManagerAktiv(team);
  if (!erlaubt) return NextResponse.json({ geraete: [], erlaubt: false });
  let { data, error } = await p.db.from('kiosk_geraete').select(`${SPALTEN}, test_bis, test_fertig, auswaerts_von`).eq('team_id', team).order('erstellt_am');
  if (error && /auswaerts_von/.test(error.message)) ({ data, error } = await p.db.from('kiosk_geraete').select(`${SPALTEN}, test_bis, test_fertig`).eq('team_id', team).order('erstellt_am') as never);
  // Ohne Migration 0073 fehlen die Test-Spalten — die Karte bleibt trotzdem benutzbar.
  if (error && /test_bis|test_fertig/.test(error.message)) ({ data, error } = await p.db.from('kiosk_geraete').select(SPALTEN).eq('team_id', team).order('erstellt_am') as never);
  if (error) return dbFehler(error.message);
  return NextResponse.json({ geraete: data ?? [], erlaubt: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({})) as { team?: string; aktion?: string; name?: string; id?: string; an?: boolean };
  const team = b.team ?? '';
  const p = await pruefe(request, team);
  if ('antwort' in p) return p.antwort;
  if (!kioskErlaubt(team) || !(await teamManagerAktiv(team))) return fehler('Die Tablet-Eingabe ist für dieses Team nicht freigeschaltet.', 403);
  if (b.aktion === 'auswaerts') {
    if (!isAdminUser(p.user)) return fehler('Das darf nur die Ligaleitung.', 403);
    if (!b.id) return fehler('Gerät fehlt.');
    const { data, error } = await p.db.from('kiosk_geraete').update({ auswaerts_von: b.an ? p.user.id : null }).eq('id', b.id).eq('team_id', team).select('id');
    if (error) return fehler(/auswaerts_von/.test(error.message) ? 'Die Datenbank kennt das noch nicht — Migration 0074 fehlt.' : 'Das hat nicht geklappt.', 500);
    if (!data?.length) return fehler('Gerät nicht gefunden.', 404);
    return NextResponse.json({ ok: true });
  }
  if (b.aktion === 'test_ende') {
    try { await testBeenden(team); } catch { return fehler('Das hat nicht geklappt.', 500); }
    return NextResponse.json({ ok: true });
  }
  if (b.aktion === 'test_start') {
    if (!b.id) return fehler('Gerät fehlt.');
    let f: string | null;
    try { f = await testStarten(team, b.id); } catch { f = 'Das hat nicht geklappt.'; }
    return f ? fehler(f) : NextResponse.json({ ok: true });
  }
  const code = neuerCode();
  const frisch = { code_hash: hash(code), code_bis: new Date(Date.now() + CODE_MINUTEN * 60_000).toISOString() };

  if (b.aktion === 'neu') {
    const name = (b.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 40) || 'Tablet';
    const { count, error: ce } = await p.db.from('kiosk_geraete').select('id', { count: 'exact', head: true }).eq('team_id', team);
    if (ce) return dbFehler(ce.message);
    if ((count ?? 0) >= MAX_GERAETE) return fehler(`Höchstens ${MAX_GERAETE} Geräte je Team. Entferne erst ein altes.`);
    const { error } = await p.db.from('kiosk_geraete').insert({ team_id: team, name, erstellt_von: p.user.id, ...frisch });
    if (error) return dbFehler(error.message);
    return NextResponse.json({ ok: true, code, minuten: CODE_MINUTEN });
  }
  if (!b.id) return fehler('Gerät fehlt.');
  if (b.aktion === 'code') {
    // Neuer Code = neu koppeln: der bisherige Schlüssel erlischt sofort.
    const { data, error } = await p.db.from('kiosk_geraete').update({ ...frisch, token_hash: null, gekoppelt_am: null }).eq('id', b.id).eq('team_id', team).select('id');
    if (error) return dbFehler(error.message);
    if (!data?.length) return fehler('Gerät nicht gefunden.', 404);
    return NextResponse.json({ ok: true, code, minuten: CODE_MINUTEN });
  }
  if (b.aktion === 'entfernen') {
    const { error } = await p.db.from('kiosk_geraete').delete().eq('id', b.id).eq('team_id', team);
    if (error) return dbFehler(error.message);
    return NextResponse.json({ ok: true });
  }
  return fehler('Unbekannte Aktion.');
}
