// ============================================================
// Team einladen (Betreiber, 05.11.2026) — wer aus dem Kader hat schon ein Konto?
// GET /api/team/einladen?team=… → { gesamt, mitKonto, ohneKonto: [{ name }] }
// Nur Teammitglieder und Ligaleitung; nur Namen (stehen ohnehin öffentlich im Kader).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { nominatedRosterRows } from '@/lib/supabase/season-teams';
import { NEUE_SAISON } from '@/lib/data/saison-2027';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const team = new URL(request.url).searchParams.get('team') ?? '';
  if (!team || (auth.user.teamId !== team && !isAdminUser(auth.user))) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });

  const { data } = await db.from('season_roster_assignments').select('first_name, last_name, player_id')
    .eq('season_id', NEUE_SAISON.id).eq('team_id', team);
  const rows = ((data ?? []) as { first_name: string | null; last_name: string | null; player_id: string | null }[])
    .map(r => ({ name: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim(), player_id: r.player_id }))
    .filter(r => r.name);
  const noms = await nominatedRosterRows(db, NEUE_SAISON.id, rows.map(r => r.player_id), team);
  const alle = [...rows, ...noms.map(n => ({ name: `${n.first_name} ${n.last_name}`.trim(), player_id: n.player_id }))];
  const seen = new Set<string>();
  const kader = alle.filter(r => { const k = r.player_id ?? `n:${r.name}`; if (seen.has(k)) return false; seen.add(k); return true; });

  const ids = kader.map(r => r.player_id).filter(Boolean) as string[];
  const { data: profs } = ids.length ? await db.from('profiles').select('player_id').in('player_id', ids) : { data: [] };
  const mit = new Set(((profs ?? []) as { player_id: string | null }[]).map(p => p.player_id));
  const ohne = kader.filter(r => !r.player_id || !mit.has(r.player_id)).map(r => ({ name: r.name })).sort((a, b) => a.name.localeCompare(b.name, 'de'));
  return NextResponse.json({ gesamt: kader.length, mitKonto: kader.length - ohne.length, ohneKonto: ohne });
}
