// ============================================================
// GET /api/team-statistik/detail?team=<id> — Team Manager → Statistiken
// ============================================================
// Betreiber, 30.10.2026 (Vorbild SpielerPlus „Die Tabelle lügt nicht“): je
// Spiel des Teams mit Spielbericht, wer gespielt hat und wie — Einzel/Doppel,
// Legs, 180er/171er/High Finishes/Short Legs. Die Aufstellung ist per RLS nur
// für den Heim-TC lesbar, deshalb hier über service_role, aber nur fürs eigene
// Team (bzw. Ligaleitung) und nur Team-Manager-Teams. Gerechnet und gefiltert
// (Zeitraum, Heim/Auswärts) wird im Browser.
// Spieler-Kennung wie im Kader: players.id, sonst „name:Vorname Nachname“.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { teamManagerAktiv } from '@/lib/server/premium';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ladeErgebnisse27 } from '@/lib/server/ergebnisse-2027';
import type { SpielStat, SpielerImSpiel } from '@/lib/team-statistik';

export const dynamic = 'force-dynamic';

type P = { report_id: string; side: 'home' | 'guest'; slot: number; name: string; player_id: string | null };
type G = { report_id: string; game_type: string; home_slot: number | null; guest_slot: number | null; home_slot2: number | null; guest_slot2: number | null; legs_home: number | null; legs_guest: number | null };
type H = { side: 'home' | 'guest'; slot: number; type: string; value: number | null };

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const team = new URL(request.url).searchParams.get('team') ?? '';
  if (!(await teamManagerAktiv(team))) return NextResponse.json({ error: 'Nur mit Team Manager.' }, { status: 403 });
  if (auth.user.teamId !== team && !isAdminUser(auth.user)) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ spiele: {} });

  const { byKey } = await ladeErgebnisse27();
  const eigene = Object.values(byKey).filter(e => !e.wertung && (e.home === team || e.away === team));
  if (!eigene.length) return NextResponse.json({ spiele: {} }, { headers: { 'Cache-Control': 'no-store' } });
  const ids = eigene.map(e => e.reportId);

  const [rep, pl, gm] = await Promise.all([
    db.from('match_reports').select('id, highlights').in('id', ids),
    db.from('match_report_players').select('report_id, side, slot, name, player_id').in('report_id', ids),
    db.from('match_report_games').select('report_id, game_type, home_slot, guest_slot, home_slot2, guest_slot2, legs_home, legs_guest').in('report_id', ids),
  ]);
  if (pl.error || gm.error) return NextResponse.json({ error: 'Statistik nicht verfügbar.' }, { status: 503 });
  const hl = new Map(((rep.data ?? []) as { id: string; highlights: H[] | null }[]).map(r => [r.id, r.highlights ?? []]));

  const spiele: Record<string, SpielStat> = {};
  for (const e of eigene) {
    const seite: 'home' | 'guest' = e.home === team ? 'home' : 'guest';
    const leute = ((pl.data ?? []) as P[]).filter(p => p.report_id === e.reportId && p.side === seite && p.name?.trim());
    const spieler: Record<string, SpielerImSpiel> = {};
    const wer = (slot: number | null) => {
      if (slot == null) return null;
      const p = leute.find(x => x.slot === slot);
      if (!p) return null;
      const key = p.player_id || `name:${p.name.trim()}`;
      return spieler[key] ??= { name: p.name.trim(), eS: 0, eN: 0, dS: 0, dN: 0, lp: 0, lm: 0, b180: 0, b171: 0, hf: [], sl: [] };
    };
    for (const p of leute) wer(p.slot);   // aufgestellt = dabei, auch ohne eigenes Spiel
    for (const g of (gm.data ?? []) as G[]) {
      if (g.report_id !== e.reportId || g.legs_home == null || g.legs_guest == null) continue;
      const f = seite === 'home' ? g.legs_home : g.legs_guest, a = seite === 'home' ? g.legs_guest : g.legs_home;
      const slots = seite === 'home' ? [g.home_slot, g.home_slot2] : [g.guest_slot, g.guest_slot2];
      const doppel = g.game_type === 'double';
      for (const s of doppel ? slots : [slots[0]]) {
        const z = wer(s);
        if (!z) continue;
        if (doppel) { if (f > a) z.dS += 1; else z.dN += 1; }
        else { if (f > a) z.eS += 1; else z.eN += 1; z.lp += f; z.lm += a; }
      }
    }
    for (const h of hl.get(e.reportId) ?? []) {
      if (h.side !== seite || h.value == null) continue;
      const z = wer(h.slot);
      if (!z) continue;
      if (h.type === '180') z.b180 += h.value;
      else if (h.type === '171') z.b171 += h.value;
      else if (h.type === 'high_finish') z.hf.push(h.value);
      else if (h.type === 'short_leg') z.sl.push(h.value);
    }
    spiele[e.key] = { datum: e.datum, heim: seite === 'home', bestaetigt: e.bestaetigt, spieler };
  }
  return NextResponse.json({ spiele }, { headers: { 'Cache-Control': 'no-store' } });
}
