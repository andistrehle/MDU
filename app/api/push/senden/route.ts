// ============================================================
// /api/push/senden — aufgerufen von der Datenbank (Migration 0056, pg_net),
// sobald eine neue Glocken-Benachrichtigung entsteht. Schickt sie als Push an
// alle Geräte des Empfängers. Nur mit dem gemeinsamen Geheimnis
// (PUSH_WEBHOOK_SECRET), sonst könnte jeder fremde Benachrichtigungen auslösen.
// ============================================================

import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { pushAn } from '@/lib/server/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function geheimStimmt(wert: string | null): boolean {
  const soll = process.env.PUSH_WEBHOOK_SECRET;
  if (!soll || !wert) return false;
  const a = Buffer.from(wert), b = Buffer.from(soll);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!geheimStimmt(request.headers.get('x-push-secret'))) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: 'Kennung fehlt.' }, { status: 400 });

  const { data: n } = await supabaseAdmin.from('notifications')
    .select('id, recipient_user_id, target_role, title, short_text, action_url').eq('id', id).maybeSingle();
  if (!n) return NextResponse.json({ error: 'Benachrichtigung nicht gefunden.' }, { status: 404 });

  let empfaenger: string[] = n.recipient_user_id ? [n.recipient_user_id] : [];
  if (!empfaenger.length && n.target_role) {
    const { data } = await supabaseAdmin.from('profiles').select('id').eq('role', n.target_role);
    empfaenger = ((data ?? []) as { id: string }[]).map(p => p.id);
  }
  const r = await pushAn(empfaenger, { titel: n.title, text: n.short_text, url: n.action_url, tag: n.id });
  return NextResponse.json(r);
}
