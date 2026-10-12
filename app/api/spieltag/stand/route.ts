// Öffentlicher Stand eines Spiels für die teilbare Spieltag-Seite
// (/spieltag/[team]/[spiel]): nur ZAHLEN (zugesagt/unsicher/abgesagt) und die
// Treffzeit — keine Namen, keine Begründungen. Vom Betreiber so festgelegt:
// „Jeder mit Link sieht die Übersicht“; Namen nur für eingeloggte Teammitglieder
// (die lesen direkt über RLS). Nur für freigeschaltete Teams (lib/features.ts).
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { zusagenFuerTeam } from '@/lib/features';
import { alleBegegnungen27, NEUE_SAISON } from '@/lib/data/saison-2027';
import { passtSlug } from '@/lib/spieltag';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const team = u.searchParams.get('team') ?? '';
  const slug = u.searchParams.get('spiel') ?? '';
  const b = alleBegegnungen27().find(x => passtSlug(x.key, slug));
  if (!zusagenFuerTeam(team) || !b || (b.home !== team && b.away !== team)) {
    return NextResponse.json({ error: 'Unbekanntes Spiel' }, { status: 404 });
  }
  const key = b.key;
  if (!supabaseAdmin) return NextResponse.json({ error: 'nicht konfiguriert' }, { status: 503 });

  const [z, d, e] = await Promise.all([
    supabaseAdmin.from('match_availability').select('status').eq('season_id', NEUE_SAISON.id).eq('team_id', team).eq('match_key', key),
    supabaseAdmin.from('match_team_details').select('meet_time').eq('season_id', NEUE_SAISON.id).eq('team_id', team).eq('match_key', key).maybeSingle(),
    supabaseAdmin.from('team_availability_settings').select('meet_minutes').eq('team_id', team).maybeSingle(),
  ]);
  if (z.error) return NextResponse.json({ error: 'Stand nicht verfügbar' }, { status: 503 });
  const zahl = { yes: 0, maybe: 0, no: 0 } as Record<string, number>;
  for (const r of (z.data ?? []) as { status: string }[]) zahl[r.status] = (zahl[r.status] ?? 0) + 1;
  // 0045 evtl. noch nicht eingespielt → Fehler hier still ignorieren (Vorgabe greift).
  const meetTime = d.error ? null : (d.data as { meet_time: string | null } | null)?.meet_time ?? null;
  const meetMinutes = e.error ? null : (e.data as { meet_minutes?: number } | null)?.meet_minutes ?? null;
  return NextResponse.json({ ...zahl, meetTime, meetMinutes }, { headers: { 'Cache-Control': 'no-store' } });
}
