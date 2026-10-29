// ============================================================
// Route Handler: installierte Web-App melden (Migration 0064)
// ============================================================
// POST { id, plattform } — vom Browser höchstens einmal am Tag, NUR wenn die
// Seite als installierte Web-App läuft (components/mdu/app-zaehler.tsx).
// Gespeichert werden Geräte-Kennung (Zufall), Plattform, erster/letzter Tag.
// Keine Anmeldung nötig, kein Konto, keine IP.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLATTFORMEN = ['ios', 'android', 'desktop', 'sonst'];

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({})) as { id?: string; plattform?: string };
  if (!b.id || !UUID.test(b.id)) return NextResponse.json({ ok: false }, { status: 400 });
  const plattform = PLATTFORMEN.includes(b.plattform ?? '') ? b.plattform! : 'sonst';
  if (!supabaseAdmin) return NextResponse.json({ ok: false }, { status: 503 });
  const { data } = await supabaseAdmin.from('app_installationen').select('tage, zuletzt_am').eq('geraet_id', b.id).maybeSingle();
  const alt = data as { tage: number; zuletzt_am: string } | null;
  const jetzt = new Date();
  if (!alt) {
    await supabaseAdmin.from('app_installationen').insert({ geraet_id: b.id, plattform });
  } else if (alt.zuletzt_am.slice(0, 10) !== jetzt.toISOString().slice(0, 10)) {
    await supabaseAdmin.from('app_installationen').update({ zuletzt_am: jetzt.toISOString(), tage: alt.tage + 1, plattform }).eq('geraet_id', b.id);
  }
  return NextResponse.json({ ok: true });
}
