// ============================================================
// Route Handler: Ersatz-Kassenwart benachrichtigen (Glocke + Push, Migration 0066)
// ============================================================
// POST { abendId } — nach „Strafen-Abend anlegen“ bzw. Ersatz ändern. Der
// Browser darf nicht in fremde Glocken schreiben, deshalb hier per service_role.
// Nur wer die Kasse des Teams führen darf (Kapitän/Co-Captain mit Recht
// „Teamkasse“, Kassenwart, Ligaleitung). Je Abend und Person nur EINE Glocke
// (Push über den Trigger aus Migration 0056).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, hatTcRechtServer, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const datumText = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
  const u = auth.user;
  const b = await request.json().catch(() => ({})) as { abendId?: string };
  if (!b.abendId || !UUID.test(b.abendId)) return NextResponse.json({ error: 'Abend fehlt.' }, { status: 400 });

  const { data: a } = await db.from('team_strafen_abende').select('id, team_id, titel, datum, ersatz_player_id, status').eq('id', b.abendId).maybeSingle();
  const abend = a as { id: string; team_id: string; titel: string; datum: string; ersatz_player_id: string | null; status: string } | null;
  if (!abend) return NextResponse.json({ error: 'Abend nicht gefunden.' }, { status: 404 });

  // Darf die Kasse führen? Kapitän/Co-Captain (kasse), Ligaleitung oder Kassenwart.
  let darf = isAdminUser(u) || hatTcRechtServer(u, abend.team_id, 'kasse');
  if (!darf && u.teamId === abend.team_id) {
    const [{ data: me }, { data: s }] = await Promise.all([
      db.from('profiles').select('player_id').eq('id', u.id).maybeSingle(),
      db.from('team_cash_settings').select('treasurer_player_id').eq('team_id', abend.team_id).maybeSingle(),
    ]);
    const pid = (me as { player_id: string | null } | null)?.player_id;
    darf = !!pid && pid === (s as { treasurer_player_id: string | null } | null)?.treasurer_player_id;
  }
  if (!darf) return NextResponse.json({ error: 'Nur für Kapitän und Kassenwart.' }, { status: 403 });
  if (!abend.ersatz_player_id || abend.status !== 'offen') return NextResponse.json({ ok: true, gesendet: false });

  const { data: p } = await db.from('profiles').select('id').eq('player_id', abend.ersatz_player_id).eq('team_id', abend.team_id);
  const empfaenger = ((p ?? []) as { id: string }[]).map(x => x.id).filter(id => id !== u.id);
  if (!empfaenger.length) return NextResponse.json({ ok: true, gesendet: false, grund: 'Der Ersatz hat kein Konto auf der Seite.' });

  // Schon benachrichtigt (z. B. Ersatz hin und her geschaltet)? Dann nicht noch einmal.
  const { data: schon } = await db.from('notifications').select('recipient_user_id')
    .eq('type', 'strafen_ersatz').eq('related_entity_id', abend.id).in('recipient_user_id', empfaenger);
  const neu = empfaenger.filter(id => !((schon ?? []) as { recipient_user_id: string }[]).some(s => s.recipient_user_id === id));
  if (!neu.length) return NextResponse.json({ ok: true, gesendet: false });

  const text = `Du bist Ersatz-Kassenwart für ${abend.titel || 'den Strafen-Abend'} am ${datumText(abend.datum)} – du darfst die Strafen mitzählen und abschließen.`;
  const { error } = await db.from('notifications').insert(neu.map(id => ({
    recipient_user_id: id, type: 'strafen_ersatz', title: 'Ersatz-Kassenwart', message: text, short_text: text,
    related_entity_type: 'team_strafen_abende', related_entity_id: abend.id, action_url: `/mein-team/strafen/${abend.id}`,
  })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, gesendet: true });
}
