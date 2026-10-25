// ============================================================
// Cron: Spieltagsbericht als News-Entwurf (Migration 0058)
// ============================================================
//
// GET /api/cron/spieltag-bericht  (sonntags via Vercel-Cron, siehe vercel.json)
//
// Läuft nur, wenn heute (München) der Sonntag eines Plan-Wochenendes ist.
// Gibt es für das Wochenende schon einen Bericht, bleibt er unangetastet —
// die Ligaleitung hat ihn evtl. schon bearbeitet. Neu erzeugen geht von Hand
// unter Admin → News. Die Ligaleitung bekommt eine Glocke (und damit Push).
//
// Schutz: „Authorization: Bearer <CRON_SECRET>" wie bei den anderen Crons.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { erzeugen, wochenendeMitSonntag } from '@/lib/server/spieltag-bericht';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET nicht gesetzt' }, { status: 500 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Service-Rolle nicht konfiguriert' }, { status: 503 });

  const w = wochenendeMitSonntag();
  if (!w) return NextResponse.json({ ok: true, uebersprungen: 'kein Spielsonntag' });
  const { data, error } = await supabaseAdmin.from('spieltag_berichte').select('news_id').eq('wochenende', w.fri).maybeSingle();
  if (error) return NextResponse.json({ error: /spieltag_berichte/.test(error.message) ? 'Migration 0058 fehlt noch.' : error.message }, { status: 500 });
  if (data) return NextResponse.json({ ok: true, uebersprungen: 'Bericht gibt es schon', newsId: data.news_id });

  const r = await erzeugen(w.fri, { benachrichtigen: true });
  return NextResponse.json(r, { status: r.ok ? 200 : 500 });
}
