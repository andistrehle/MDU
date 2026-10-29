// ============================================================
// Route Handler: Nachrichten des TC an sein Team (Glocke + Push)
// ============================================================
//
// POST /api/team/nachricht  (Authorization: Bearer <access token>)
//   { teamId, art: 'termin_neu',      terminId }       — eigener Termin angelegt
//   { teamId, art: 'termine_neu',     anzahl }         — mehrere importiert
//   { teamId, art: 'termin_geaendert', terminId }      — Datum/Zeit/Ort geändert
//   { teamId, art: 'termin_abgesagt', text }           — gelöscht (Zeile ist weg → Beschreibung vom Browser)
//   { teamId, art: 'erinnern', matchKey, text, pfad }  — nur an die, die noch offen sind
//   { teamId, art: 'nachricht', text }                 — Freitext ans ganze Team
//
// Betreiber, 27.10.2026: Der TC soll sein Team per Push erreichen. Jede Zeile
// in `notifications` geht über den Trigger aus Migration 0056 als Push raus —
// hier wird nur in die Glocken der Teammitglieder geschrieben (service_role,
// weil RLS nur die eigene Glocke kennt). Nur TC des Teams und Ligaleitung.
// Der Absender bekommt nichts. Spieler ohne Konto erreicht keine Glocke.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, hatTcRechtServer } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NEUE_SAISON, datumKurz27 } from '@/lib/data/saison-2027';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NACHRICHT_MAX = 200; // wie TEAM_NACHRICHT_MAX in lib/supabase/team-nachricht.ts
const kurz = (s: unknown, max: number) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

interface Termin { id: string; team_id: string; kind: string; title: string | null; opponent: string | null; is_home: boolean | null; event_date: string; start_time: string | null; venue: string | null }

function terminTitel(t: Termin): string {
  if (t.kind === 'spiel') return t.opponent ? `${t.is_home === false ? 'bei' : 'gegen'} ${t.opponent}` : (t.title ?? 'Spiel');
  return t.title ?? 'Termin';
}
const wann = (t: Termin) => `${datumKurz27(t.event_date)}${t.start_time ? ` ${t.start_time.slice(0, 5)} Uhr` : ''}`;

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
  const u = auth.user;
  const b = await request.json().catch(() => ({})) as { teamId?: string; art?: string; terminId?: string; anzahl?: number; text?: string; matchKey?: string; pfad?: string };
  const teamId = b.teamId ?? '';
  if (!teamId) return NextResponse.json({ error: 'Team fehlt.' }, { status: 400 });
  if (!hatTcRechtServer(u, teamId, 'team_manager')) return NextResponse.json({ error: 'Nur für den Teamcaptain.' }, { status: 403 });

  let titel = '', text = '', url = '/mein-team/termine', typ = 'team_termin';
  let nurOffenFuer: string | null = null;

  if (b.art === 'termin_neu' || b.art === 'termin_geaendert') {
    const { data } = await db.from('team_events').select('id, team_id, kind, title, opponent, is_home, event_date, start_time, venue').eq('id', b.terminId ?? '').maybeSingle();
    const t = data as Termin | null;
    if (!t || t.team_id !== teamId) return NextResponse.json({ error: 'Termin nicht gefunden.' }, { status: 404 });
    url = `/termin/${t.id}`;
    if (b.art === 'termin_neu') { titel = 'Neuer Termin'; text = `${terminTitel(t)} · ${wann(t)} – bitte zu- oder absagen.`; }
    else { titel = 'Termin geändert'; text = `${terminTitel(t)} · jetzt ${wann(t)}${t.venue ? `, ${t.venue}` : ''}.`; }
  } else if (b.art === 'termine_neu') {
    const n = Math.max(1, Math.min(200, Number(b.anzahl) || 1));
    titel = 'Neue Termine'; text = `${n} ${n === 1 ? 'neuer Termin' : 'neue Termine'} eingetragen – bitte zu- oder absagen.`;
  } else if (b.art === 'termin_abgesagt') {
    titel = 'Termin abgesagt'; text = `${kurz(b.text, 140)} findet nicht statt.`;
  } else if (b.art === 'erinnern') {
    const key = kurz(b.matchKey, 200);
    if (!key) return NextResponse.json({ error: 'Spiel fehlt.' }, { status: 400 });
    titel = 'Bitte zu- oder absagen'; text = `${kurz(b.text, 140)} – du hast noch nicht geantwortet.`; typ = 'team_erinnerung';
    url = kurz(b.pfad, 200).startsWith('/') ? kurz(b.pfad, 200) : '/mein-team/termine';
    nurOffenFuer = key;
  } else if (b.art === 'nachricht') {
    const t = kurz(b.text, NACHRICHT_MAX);
    if (t.length < 3) return NextResponse.json({ error: 'Bitte eine Nachricht eingeben.' }, { status: 400 });
    titel = 'Nachricht vom Teamcaptain'; text = t; typ = 'team_nachricht'; url = '/mein-team/zusagen';
  } else {
    return NextResponse.json({ error: 'Unbekannte Art.' }, { status: 400 });
  }

  const { data: mitglieder } = await db.from('profiles').select('id, player_id').eq('team_id', teamId);
  let empfaenger = ((mitglieder ?? []) as { id: string; player_id: string | null }[]).filter(p => p.id !== u.id);
  if (nurOffenFuer) {
    const { data: geantwortet } = await db.from('match_availability').select('player_id')
      .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).eq('match_key', nurOffenFuer);
    const hat = new Set(((geantwortet ?? []) as { player_id: string }[]).map(r => r.player_id));
    empfaenger = empfaenger.filter(p => p.player_id && !hat.has(p.player_id));
  }
  if (!empfaenger.length) return NextResponse.json({ ok: true, empfaenger: 0 });

  const { error } = await db.from('notifications').insert(empfaenger.map(p => ({
    recipient_user_id: p.id, type: typ, title: titel, message: text, short_text: text, related_entity_type: 'team', action_url: url,
  })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, empfaenger: empfaenger.length });
}
