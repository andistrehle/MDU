// ============================================================
// /api/push/abo — Push-Abo eines Geräts (Migration 0056, lib/server/push.ts)
//   POST   (angemeldet) { endpoint, keys: { p256dh, auth } } → Abo dem Nutzer zuordnen
//          Meldet sich auf dem Gerät jemand anderes an, wandert das Abo zu ihm.
//   DELETE { endpoint } → Abo löschen (Ausschalten, Abmelden). Ohne Anmeldung,
//          weil beim Abmelden die Sitzung schon weg ist — den Endpunkt kennt
//          nur das Gerät selbst.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const gueltig = (e: unknown): e is string => typeof e === 'string' && /^https:\/\/[^\s]{10,1000}$/.test(e);

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
  const b = (await request.json().catch(() => ({}))) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const p256dh = b.keys?.p256dh, key = b.keys?.auth;
  if (!gueltig(b.endpoint) || typeof p256dh !== 'string' || typeof key !== 'string' || p256dh.length > 200 || key.length > 100) {
    return NextResponse.json({ error: 'Ungültiges Abo.' }, { status: 400 });
  }
  const { error } = await supabaseAdmin.from('push_subscriptions').upsert({
    endpoint: b.endpoint, p256dh, auth: key, user_id: auth.user.id,
    user_agent: (request.headers.get('user-agent') ?? '').slice(0, 300),
  }, { onConflict: 'endpoint' });
  if (error) return NextResponse.json({ error: /push_subscriptions/.test(error.message) ? 'Push ist noch nicht eingerichtet.' : error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ ok: true });
  const b = (await request.json().catch(() => ({}))) as { endpoint?: unknown };
  if (!gueltig(b.endpoint)) return NextResponse.json({ error: 'Ungültiges Abo.' }, { status: 400 });
  await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', b.endpoint);
  return NextResponse.json({ ok: true });
}
