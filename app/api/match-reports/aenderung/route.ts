// ============================================================
// /api/match-reports/aenderung — festhalten, WAS an einem Spielbericht geändert wurde
// ============================================================
// Betreiber, 19.11.2026: Wird ein schon eingereichter Bericht geändert (z. B. nach
// „Änderung angefordert“ neu eingereicht), kam nur die Glocke „Neuer Spielbericht“ —
// nachvollziehen ließ sich nichts. Das Formular ruft diese Route DIREKT VOR dem
// Speichern mit dem neuen Stand auf; hier wird er mit dem Stand in der Datenbank
// verglichen (lib/spielbericht-korrektur.ts → Unterschiede in Worten) und als
// Verlaufseintrag `geaendert` abgelegt. Dazu eine Glocke an die Ligaleitung und das
// bestätigende Team mit den Änderungen. Entwürfe (noch nie eingereicht) zählen nicht.
// Alles über service_role; ändern am Bericht selbst tut diese Route nichts.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { tcEmpfaenger } from '@/lib/server/tc-empfaenger';
import { unterschiede, type KorrekturStand } from '@/lib/spielbericht-korrektur';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });

  const body = (await request.json().catch(() => ({}))) as { id?: string; stand?: Partial<KorrekturStand> };
  const id = String(body.id ?? '');
  if (!id || !body.stand || !Array.isArray(body.stand.players) || !Array.isArray(body.stand.games)) return NextResponse.json({ error: 'Angaben fehlen.' }, { status: 400 });

  const { data: r } = await db.from('match_reports')
    .select('id, status, home_team_id, guest_team_id, confirm_team_id, home_team_name, guest_team_name, highlights').eq('id', id).maybeSingle();
  if (!r) return NextResponse.json({ error: 'Spielbericht nicht gefunden.' }, { status: 404 });
  const bericht = r as { id: string; status: string; home_team_id: string | null; guest_team_id: string | null; confirm_team_id: string | null; home_team_name: string | null; guest_team_name: string | null; highlights: KorrekturStand['highlights'] | null };
  const beteiligt = !!auth.user.teamId && (auth.user.teamId === bericht.home_team_id || auth.user.teamId === bericht.guest_team_id);
  if (!isAdminUser(auth.user) && !beteiligt) return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  // Noch nie eingereicht → es gibt nichts nachzuvollziehen.
  if (bericht.status === 'draft') return NextResponse.json({ ok: true, unterschiede: [] });

  const [{ data: spieler }, { data: spiele }] = await Promise.all([
    db.from('match_report_players').select('side, slot, name, pass_no, player_id').eq('report_id', id),
    db.from('match_report_games').select('game_no, game_type, home_slot, guest_slot, home_slot2, guest_slot2, legs_home, legs_guest').eq('report_id', id),
  ]);
  const alt = { players: spieler ?? [], games: spiele ?? [], highlights: bericht.highlights ?? [] } as unknown as KorrekturStand;
  // Kamen keine Highlights mit, bleiben sie, wie sie sind.
  const neu = { players: body.stand.players, games: body.stand.games, highlights: Array.isArray(body.stand.highlights) ? body.stand.highlights : alt.highlights } as KorrekturStand;

  let liste: string[];
  try { liste = unterschiede(alt, neu); } catch { return NextResponse.json({ ok: true, unterschiede: [] }); }
  if (!liste.length) return NextResponse.json({ ok: true, unterschiede: [] });

  const text = liste.join('\n').slice(0, 2000);
  await db.from('match_report_history').insert({ report_id: id, action: 'geaendert', actor_user_id: auth.user.id, note: text });

  // Glocke: Ligaleitung + das Team, das bestätigen muss — ohne den, der gerade geändert hat.
  const label = `${bericht.home_team_name ?? 'Heim'} – ${bericht.guest_team_name ?? 'Gast'}`;
  const { data: ll } = await db.from('profiles').select('id').in('role', ['league_admin', 'super_admin']);
  const tcs = await tcEmpfaenger(bericht.confirm_team_id ?? bericht.guest_team_id, 'spielberichte', false);
  const leitung = new Set(((ll ?? []) as { id: string }[]).map(p => p.id));
  const kurz = `${liste.slice(0, 3).join(' · ')}${liste.length > 3 ? ` · und ${liste.length - 3} weitere` : ''}`.slice(0, 240);
  const an = [...new Set([...leitung, ...tcs])].filter(x => x !== auth.user.id);
  if (an.length) {
    await db.from('notifications').insert(an.map(uid => ({
      recipient_user_id: uid, type: 'match_report_geaendert', title: `Spielbericht geändert: ${label}`.slice(0, 120),
      message: text, short_text: kurz, related_entity_type: 'match_report', related_entity_id: id,
      action_url: leitung.has(uid) ? '/admin/spielberichte' : '/mein-bereich/spielberichte/uebersicht',
    })));
  }
  return NextResponse.json({ ok: true, unterschiede: liste });
}
