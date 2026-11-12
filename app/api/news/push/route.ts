// ============================================================
// Route Handler: News an alle per Glocke + Push (Betreiber, 12.11.2026)
// ============================================================
// Admin → News, Knopf „Glocke + Push an alle“ bei veröffentlichten Beiträgen
// (Spieltagsberichte haben ihren eigenen Push). Schreibt jedem Konto eine
// Glocken-Zeile; den Push aufs Handy macht der Trigger aus Migration 0056 je
// Zeile (mit Zahl am App-Symbol). Einmal je Beitrag: Gibt es schon eine
// Glocke mit diesem Link, wird nichts noch einmal geschickt.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ error: 'Server-Datenbank fehlt.' }, { status: 500 });

  const b = await request.json().catch(() => ({})) as { id?: string };
  if (!b.id) return NextResponse.json({ error: 'Beitrag fehlt.' }, { status: 400 });
  const { data: news } = await db.from('news').select('id, title, teaser, status').eq('id', b.id).maybeSingle();
  const n = news as { id: string; title: string; teaser: string | null; status: string } | null;
  if (!n) return NextResponse.json({ error: 'Beitrag nicht gefunden.' }, { status: 404 });
  if (n.status !== 'published') return NextResponse.json({ error: 'Erst veröffentlichen, dann pushen.' }, { status: 409 });

  const url = `/news#${n.id}`;
  const { count } = await db.from('notifications').select('id', { count: 'exact', head: true }).eq('type', 'news').eq('action_url', url);
  if (count) return NextResponse.json({ ok: true, schonGesendet: true });

  // /news und Startseite sind statisch (revalidate 600) — sofort neu bauen, sonst landet der Tipp auf den Push
  // bis zu 10 Minuten lang auf einer Seite ohne den Beitrag.
  revalidatePath('/news'); revalidatePath('/');

  const ids: string[] = [];
  for (let von = 0; ; von += 1000) {
    const { data } = await db.from('profiles').select('id').range(von, von + 999);
    ids.push(...((data ?? []) as { id: string }[]).map(p => p.id));
    if (!data || data.length < 1000) break;
  }
  const text = (n.teaser?.trim() || 'Neuer Beitrag in den News.').slice(0, 300);
  for (let i = 0; i < ids.length; i += 500) {
    const { error } = await db.from('notifications').insert(ids.slice(i, i + 500).map(id => ({
      recipient_user_id: id, type: 'news', title: n.title, message: text, short_text: text, related_entity_type: 'news', action_url: url,
    })));
    if (error) return NextResponse.json({ error: `Nur teilweise gesendet (${i} von ${ids.length}): ${error.message}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, konten: ids.length });
}
