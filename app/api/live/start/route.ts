// ============================================================
// Route Handler: Start-Push „Der Live-Ticker läuft“ (Betreiber, 11.11.2026)
// ============================================================
// Das Formular meldet sich nach jedem erfolgreichen Autospeichern (je Bericht und
// Sitzung einmal). Gepusht wird an ALLE Geräte, aber nur EINMAL je Spieltag:
// Die Tabelle `live_ticker_push` (Migration 0069) hat das Datum als Schlüssel —
// nur wer die Zeile anlegen kann, schickt. Fehlt die Tabelle, passiert nichts.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { pushAlle } from '@/lib/server/push';
import { LIVE_TICKER_AN, spieltagDatum } from '@/lib/live-ticker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!LIVE_TICKER_AN || !supabaseAdmin) return NextResponse.json({ ok: true, push: false });
  const b = await request.json().catch(() => ({})) as { reportId?: string };
  if (!b.reportId) return NextResponse.json({ ok: false }, { status: 400 });
  const datum = spieltagDatum(new Date());
  // Nur ein echter Live-Stand des heutigen Spieltags löst aus: Entwurf, Spieldatum heute, mindestens ein Ergebnis.
  const { data: r } = await supabaseAdmin.from('match_reports').select('id, status, match_date').eq('id', b.reportId).maybeSingle();
  if (!r || (r as { status: string }).status !== 'draft' || (r as { match_date: string | null }).match_date !== datum) return NextResponse.json({ ok: true, push: false });
  const { count } = await supabaseAdmin.from('match_report_games').select('game_no', { count: 'exact', head: true })
    .eq('report_id', b.reportId).not('legs_home', 'is', null);
  if (!count) return NextResponse.json({ ok: true, push: false });
  const { error } = await supabaseAdmin.from('live_ticker_push').insert({ datum });
  if (error) return NextResponse.json({ ok: true, push: false }); // schon gepusht oder Migration fehlt
  await pushAlle({ titel: '🔴 Der Live-Ticker läuft', text: 'Die ersten Ergebnisse des Abends sind da – jetzt live mitverfolgen.', url: '/live', tag: `live-${datum}` });
  return NextResponse.json({ ok: true, push: true });
}
