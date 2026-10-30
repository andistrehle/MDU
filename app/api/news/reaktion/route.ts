// ============================================================
// Route Handler: News gelesen / Gefällt mir (Migration 0065)
// ============================================================
// GET  ?ids=a,b,c                         → { zahlen: { [id]: { gelesen, gefaellt } } }
// POST { id, geraet, aktion: 'gelesen' | 'gefaellt' | 'nicht' }
//   gelesen  = Beitrag geöffnet (je Gerät einmal, weitere Aufrufe ändern nichts)
//   gefaellt / nicht = Daumen setzen / zurücknehmen
// Öffentlich, ohne Konto: Geräte-Kennung ist eine Zufallszahl aus dem Browser.
// Nur veröffentlichte Beiträge zählen.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID = /^[a-z0-9-]{1,200}$/i;
type Zahlen = Record<string, { gelesen: number; gefaellt: number }>;

async function zahlen(ids: string[]): Promise<Zahlen> {
  const z: Zahlen = Object.fromEntries(ids.map(id => [id, { gelesen: 0, gefaellt: 0 }]));
  const { data, error } = await supabaseAdmin!.rpc('news_zahlen', { ids });
  if (error) throw new Error(error.message);
  for (const r of (data ?? []) as { news_id: string; gelesen: number; gefaellt: number }[]) z[r.news_id] = { gelesen: Number(r.gelesen), gefaellt: Number(r.gefaellt) };
  return z;
}

export async function GET(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ zahlen: {} });
  const ids = [...new Set((new URL(request.url).searchParams.get('ids') ?? '').split(',').filter(i => ID.test(i)))].slice(0, 100);
  if (!ids.length) return NextResponse.json({ zahlen: {} });
  try {
    return NextResponse.json({ zahlen: await zahlen(ids) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    // Migration fehlt o. Ä.: keine Zahlen, die Seite zeigt dann einfach nichts.
    return NextResponse.json({ zahlen: {} });
  }
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({})) as { id?: string; geraet?: string; aktion?: string };
  if (!b.id || !ID.test(b.id) || !b.geraet || !UUID.test(b.geraet) || !['gelesen', 'gefaellt', 'nicht'].includes(b.aktion ?? '')) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const db = supabaseAdmin;
  if (!db) return NextResponse.json({ ok: false }, { status: 503 });
  const { data: n } = await db.from('news').select('id').eq('id', b.id).eq('status', 'published').maybeSingle();
  if (!n) return NextResponse.json({ ok: false }, { status: 404 });

  const zeile = { news_id: b.id, geraet_id: b.geraet };
  const { error } = b.aktion === 'gelesen'
    ? await db.from('news_reaktionen').upsert(zeile, { onConflict: 'news_id,geraet_id', ignoreDuplicates: true })
    : await db.from('news_reaktionen').upsert(
        { ...zeile, gefaellt: b.aktion === 'gefaellt', gefaellt_am: b.aktion === 'gefaellt' ? new Date().toISOString() : null },
        { onConflict: 'news_id,geraet_id' });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, zahlen: (await zahlen([b.id]))[b.id] });
}
