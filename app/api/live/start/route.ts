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
import { liveStartPush } from '@/lib/server/live-start';
import { LIVE_TICKER_AN } from '@/lib/live-ticker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!LIVE_TICKER_AN || !supabaseAdmin) return NextResponse.json({ ok: true, push: false });
  const b = await request.json().catch(() => ({})) as { reportId?: string };
  if (!b.reportId) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json({ ok: true, push: await liveStartPush(b.reportId) });
}
