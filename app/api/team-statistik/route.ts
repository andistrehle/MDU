// ============================================================
// GET /api/team-statistik?team=<id>  — Team Manager: wer hat wie oft GESPIELT
// ============================================================
//
// Für die Statistik im Team-Manager-Dashboard (Betreiber, 16.10.2026: „wer wie
// oft gekommen ist“, gezählt aus Zusagen UND aus den Spielberichten). Die
// Zusagen liest der Browser selbst (RLS); die Aufstellung aus den Berichten ist
// per RLS nur für den Heim-TC lesbar — deshalb hier über service_role, aber
// nur für Mitglieder des Teams (bzw. die Ligaleitung) und nur Team-Manager-Teams.
// Zurück kommen nur Zählungen: je Spieler die Zahl der Berichte, in denen er
// für dieses Team auf H1–H8/G1–G8 steht, dazu die Zahl der Berichte.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { zusagenFuerTeam } from '@/lib/features';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { ladeErgebnisse27 } from '@/lib/server/ergebnisse-2027';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const team = new URL(request.url).searchParams.get('team') ?? '';
  if (!zusagenFuerTeam(team)) return NextResponse.json({ error: 'Nur mit Team Manager.' }, { status: 403 });
  if (auth.user.teamId !== team && !isAdminUser(auth.user)) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  if (!supabaseAdmin) return NextResponse.json({ berichte: 0, gespielt: {} });

  const { byKey } = await ladeErgebnisse27();
  // Nur echte Spiele (keine Wertung am grünen Tisch) dieses Teams.
  const eigene = Object.values(byKey).filter(e => !e.wertung && (e.home === team || e.away === team));
  if (!eigene.length) return NextResponse.json({ berichte: 0, gespielt: {} }, { headers: { 'Cache-Control': 'no-store' } });
  const seite = new Map(eigene.map(e => [e.reportId, e.home === team ? 'home' : 'guest']));

  const { data, error } = await supabaseAdmin.from('match_report_players')
    .select('report_id, side, name, player_id').in('report_id', [...seite.keys()]);
  if (error) return NextResponse.json({ error: 'Statistik nicht verfügbar.' }, { status: 503 });

  // Kennung wie im Kader: players.id, sonst „name:Vorname Nachname“.
  const gespielt: Record<string, number> = {};
  const gezaehlt = new Set<string>();
  for (const r of (data ?? []) as { report_id: string; side: string; name: string; player_id: string | null }[]) {
    if (seite.get(r.report_id) !== r.side || !r.name?.trim()) continue;
    const key = r.player_id || `name:${r.name.trim()}`;
    if (gezaehlt.has(`${r.report_id}|${key}`)) continue;   // Ein- und Auswechslungen nur einmal je Spiel
    gezaehlt.add(`${r.report_id}|${key}`);
    gespielt[key] = (gespielt[key] ?? 0) + 1;
  }
  return NextResponse.json({ berichte: eigene.length, gespielt }, { headers: { 'Cache-Control': 'no-store' } });
}
