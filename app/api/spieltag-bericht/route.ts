// ============================================================
// Route Handler: Spieltagsbericht (Ligaleitung) — Migration 0058
// ============================================================
//
// POST /api/spieltag-bericht  (Authorization: Bearer <access token>)
//   { aktion: 'erzeugen', fri? }  — Entwurf (neu) erzeugen, Standard: letztes
//       begonnene Spielwochenende. Nur solange er Entwurf ist.
//   { aktion: 'push', id }        — nach dem Veröffentlichen unter Admin → News:
//       Push an ALLE Geräte (Betreiber, 25.10.2026), je Bericht nur einmal.
//       Markiert /news und die Startseite zum Neubau, damit der Beitrag beim
//       Antippen auch schon da ist.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { erzeugen, letztesWochenende } from '@/lib/server/spieltag-bericht';
import { pushAlle } from '@/lib/server/push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
  const body = await request.json().catch(() => ({})) as { aktion?: string; fri?: string; id?: string };

  if (body.aktion === 'erzeugen') {
    const fri = body.fri ?? letztesWochenende()?.fri;
    if (!fri) return NextResponse.json({ error: 'Noch kein Spielwochenende begonnen.' }, { status: 400 });
    const r = await erzeugen(fri);
    return r.ok ? NextResponse.json(r) : NextResponse.json({ error: r.grund }, { status: 400 });
  }

  if (body.aktion === 'push') {
    if (!body.id) return NextResponse.json({ error: 'Beitrag fehlt.' }, { status: 400 });
    const { data: n } = await db.from('news').select('id, title, teaser, status').eq('id', body.id).maybeSingle();
    if (!n) return NextResponse.json({ error: 'Beitrag nicht gefunden.' }, { status: 404 });
    if (n.status !== 'published') return NextResponse.json({ error: 'Erst veröffentlichen, dann pushen.' }, { status: 400 });
    // Erst den Push „belegen“, dann senden — zwei schnelle Klicks schicken nicht doppelt.
    const { data: belegt, error } = await db.from('spieltag_berichte').update({ push_at: new Date().toISOString() })
      .eq('news_id', n.id).is('push_at', null).select('wochenende');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath('/news');
    revalidatePath('/');
    if (!belegt?.length) return NextResponse.json({ ok: true, schonGesendet: true });
    const r = await pushAlle({ titel: n.title, text: n.teaser, url: `/news#${n.id}`, tag: n.id });
    if (r.status === 'nicht_eingerichtet') {
      await db.from('spieltag_berichte').update({ push_at: null }).eq('news_id', n.id);
      return NextResponse.json({ error: 'Push ist auf dem Server nicht eingerichtet (VAPID-Schlüssel fehlen).' }, { status: 500 });
    }
    await db.from('spieltag_berichte').update({ push_geraete: r.gesendet }).eq('news_id', n.id);
    return NextResponse.json({ ok: true, gesendet: r.gesendet, geraete: r.geraete });
  }

  return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
}
