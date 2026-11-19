// ============================================================
// POST /api/kiosk/koppeln { code } — Tablet einmalig an ein Team binden
// ============================================================
// Tauscht den achtstelligen Code aus dem Team Manager (15 Minuten gültig,
// einmal verwendbar) gegen den Geräte-Schlüssel. Der Schlüssel kommt als
// HttpOnly-Cookie (hält auch dort, wo der Browser Skript-Speicher abräumt)
// UND in der Antwort (localStorage, falls Cookies gelöscht werden).
// Bremse gegen Durchprobieren: 8 Fehlversuche je Absender in 10 Minuten —
// im Arbeitsspeicher und damit je Server-Instanz, wie bei der MDC-Abfrage.
// ============================================================

import { NextResponse } from 'next/server';
import { codeNormal } from '@/lib/kiosk';
import { KIOSK_COOKIE, koppeln } from '@/lib/server/kiosk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FENSTER = 10 * 60_000, MAX = 8;
const versuche = new Map<string, number[]>();

export async function POST(request: Request) {
  const wer = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unbekannt';
  const jetzt = Date.now();
  const bisher = (versuche.get(wer) ?? []).filter(t => jetzt - t < FENSTER);
  if (bisher.length >= MAX) return NextResponse.json({ error: 'Zu viele Versuche. Bitte in 10 Minuten noch einmal.' }, { status: 429 });
  const b = await request.json().catch(() => ({})) as { code?: string };
  const code = codeNormal(String(b.code ?? ''));
  const fehl = (text: string) => {
    versuche.set(wer, [...bisher, jetzt]);
    if (versuche.size > 5000) versuche.clear();
    return NextResponse.json({ error: text }, { status: 400 });
  };
  if (!code) return fehl('Der Code hat acht Ziffern.');
  let r: Awaited<ReturnType<typeof koppeln>>;
  try { r = await koppeln(code); } catch { return NextResponse.json({ error: 'Das hat nicht geklappt – bitte noch einmal versuchen.' }, { status: 500 }); }
  if ('fehler' in r) return fehl(r.fehler);
  const res = NextResponse.json({ ok: true, token: r.token }, { headers: { 'Cache-Control': 'no-store' } });
  res.cookies.set(KIOSK_COOKIE, r.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 400 * 24 * 3600 });
  return res;
}
