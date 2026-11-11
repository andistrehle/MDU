// ============================================================
// Route Handler: Live-Ticker (lib/server/live-ticker.ts) — öffentlich
// ============================================================
// Kurz am CDN zwischengespeichert: Alle Zuschauer teilen sich eine Antwort
// (20 s), statt dass jedes Handy die Datenbank abfragt.
// ============================================================

import { NextResponse } from 'next/server';
import { ladeLiveTicker } from '@/lib/server/live-ticker';
import { LIVE_TICKER_AN, spieltagDatum } from '@/lib/live-ticker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const daten = LIVE_TICKER_AN ? await ladeLiveTicker().catch(() => null) : null;
  return NextResponse.json(daten ?? { datum: spieltagDatum(new Date()), aktiv: false, spiele: [] },
    { headers: { 'Cache-Control': 'public, s-maxage=20, stale-while-revalidate=20' } });
}
