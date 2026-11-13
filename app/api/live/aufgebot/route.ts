// ============================================================
// Route Handler: Aufgebot fürs heutige Spiel — NUR für den Bazis-Live-Bot
// ============================================================
// Startnachricht des WhatsApp-Live-Tickers (Betreiber, 13.11.2026):
// „Heute live aus dem <Lokal> …, Anwurf ist um …, Heute an der Scheibe: <Zusagen>“.
// Zusagen mit Namen sind sonst nur fürs eigene Team lesbar (RLS) — deshalb
// darf hier nur der Workflow bazis-live.yml auf main fragen (GitHub-OIDC,
// lib/server/github-oidc.ts), und nur für die Bazis.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NEUE_SAISON, alleBegegnungen27, team27, venue27 } from '@/lib/data/saison-2027';
import { pruefeWorkflowToken } from '@/lib/server/github-oidc';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TEAMS = ['freibad-bazis'];

export async function GET(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token || !(await pruefeWorkflowToken(token, 'bazis-live.yml'))) {
    return NextResponse.json({ error: 'nicht erlaubt' }, { status: 401 });
  }
  const url = new URL(req.url);
  const team = url.searchParams.get('team') ?? '';
  const spiel = url.searchParams.get('spiel') ?? '';
  const b = alleBegegnungen27().find(x => x.key === spiel);
  if (!BOT_TEAMS.includes(team) || !b || (b.home !== team && b.away !== team)) {
    return NextResponse.json({ error: 'unbekanntes Spiel' }, { status: 404 });
  }
  let zugesagt: string[] = [];
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin.from('match_availability').select('player_id, player_name')
      .eq('season_id', NEUE_SAISON.id).eq('team_id', team).eq('match_key', b.key).eq('status', 'yes');
    const zeilen = (data ?? []) as { player_id: string; player_name: string }[];
    // Name aus dem Kader (players), nicht der Kontoname — der kann z. B. „Andreas Super Admin“ heißen (13.11.2026).
    const { data: sp } = zeilen.length
      ? await supabaseAdmin.from('players').select('id, first_name, last_name').in('id', zeilen.map(z => z.player_id))
      : { data: [] };
    const kader = new Map(((sp ?? []) as { id: string; first_name: string | null; last_name: string | null }[])
      .map(p => [p.id, [p.first_name, p.last_name].filter(Boolean).join(' ').trim()]));
    zugesagt = zeilen.map(z => (kader.get(z.player_id) || z.player_name || '').trim()).filter(Boolean)
      .sort((x, y) => x.localeCompare(y, 'de'));
  }
  return NextResponse.json({
    key: b.key,
    team: team27(team)?.name ?? team,
    gegner: team27(b.home === team ? b.away : b.home)?.name ?? '',
    heim: b.home === team,
    lokal: venue27(team27(b.home)?.venueId)?.name ?? null,
    datum: b.termin?.datum ?? null,
    uhrzeit: b.termin?.uhrzeit ?? null,
    zugesagt,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
