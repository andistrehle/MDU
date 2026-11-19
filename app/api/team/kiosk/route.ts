// ============================================================
// /api/team/kiosk — Tablets des Teams verwalten (Migration 0072)
// ============================================================
// GET  ?team=…                          → { geraete, erlaubt }
// POST { team, aktion: 'neu', name }    → neues Gerät + Kopplungscode (einmal sichtbar)
// POST { team, aktion: 'code', id }     → neuer Code für ein Gerät (koppelt es neu, alter Schlüssel erlischt)
// POST { team, aktion: 'entfernen', id }→ Gerät löschen (Schlüssel sofort ungültig)
// Darf: Kapitän, Co-Captain mit Recht „Spielberichte“, Ligaleitung — und nur
// mit Team Manager und solange das Team für das Tablet freigegeben ist.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, hatTcRechtServer } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { teamManagerAktiv } from '@/lib/server/premium';
import { kioskErlaubt } from '@/lib/kiosk';
import { CODE_MINUTEN, hash, migrationFehlt, neuerCode } from '@/lib/server/kiosk';

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
  const { data, error } = await p.db.from('kiosk_geraete').select(SPALTEN).eq('team_id', team).order('erstellt_am');
  if (error) return dbFehler(error.message);
  return NextResponse.json({ geraete: data ?? [], erlaubt: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({})) as { team?: string; aktion?: string; name?: string; id?: string };
  const team = b.team ?? '';
  const p = await pruefe(request, team);
  if ('antwort' in p) return p.antwort;
  if (!kioskErlaubt(team) || !(await teamManagerAktiv(team))) return fehler('Die Tablet-Eingabe ist für dieses Team nicht freigeschaltet.', 403);
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
