// ============================================================
// /api/kiosk — Tablet im Lokal (Migration 0072, Betreiber 19.11.2026)
// ============================================================
// GET  → Lage des Geräts: nicht gekoppelt (401) · kein Spiel heute · Spiel mit
//        Kader (nur Namen), Stand und `basis` (Zeitstempel für den Konfliktschutz)
// POST { stand, basis, absenden? } → Entwurf des heutigen Heimspiels speichern,
//        mit `absenden` einreichen. Team und Begegnung bestimmt IMMER der Server
//        aus dem Geräte-Schlüssel (lib/server/kiosk.ts) — das Gerät nennt keine.
// Kein Konto, kein Supabase-Token: Ausweis ist nur der Geräte-Schlüssel
// (Kopfzeile x-kiosk-token oder HttpOnly-Cookie).
// ============================================================

import { NextResponse } from 'next/server';
import { geraetVon, KIOSK_COOKIE, KIOSK_COOKIE_TAGE, kioskToken, lage, speichern } from '@/lib/server/kiosk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const nichtGekoppelt = () => NextResponse.json({ error: 'Dieses Gerät ist nicht eingerichtet.' }, { status: 401 });
const kopf = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const g = await geraetVon(request);
  if (!g) return nichtGekoppelt();
  try {
    const res = NextResponse.json(await lage(g, new URL(request.url).searchParams.get('seit')), { headers: kopf });
    // Kopplung hält, solange das Gerät benutzt wird: Cookie bei jedem Aufruf um 400 Tage verlängern
    // (und wieder setzen, falls nur noch der Schlüssel im localStorage übrig war).
    res.cookies.set(KIOSK_COOKIE, kioskToken(request), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: KIOSK_COOKIE_TAGE * 24 * 3600 });
    return res;
  }
  catch { return NextResponse.json({ error: 'Laden hat nicht geklappt.' }, { status: 500 }); }
}

export async function POST(request: Request) {
  const g = await geraetVon(request);
  if (!g) return nichtGekoppelt();
  const b = await request.json().catch(() => null) as { stand?: unknown; basis?: unknown; absenden?: unknown } | null;
  if (!b) return NextResponse.json({ error: 'Eingabe fehlt.' }, { status: 400 });
  try {
    const r = await speichern(g, b.stand, typeof b.basis === 'string' ? b.basis : null, b.absenden === true);
    if (r.ok) return NextResponse.json(r, { headers: kopf });
    return NextResponse.json({ error: r.fehler, konflikt: !!r.konflikt }, { status: r.status });
  } catch { return NextResponse.json({ error: 'Speichern hat nicht geklappt.' }, { status: 500 }); }
}
