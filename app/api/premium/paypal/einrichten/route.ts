// ============================================================
// Route Handler: PayPal einrichten (nur Super-Admin = Betreiber)
// ============================================================
// GET  → Stand: Produkt, Monatsplan, Webhook vorhanden? (liest nur)
// POST → legt bei PayPal an, was fehlt (Produkt „MDU Team Manager“, Plan
//        „Team Manager monatlich“ 8,99 €/Monat, Webhook auf diese Seite).
//        Mehrfach aufrufbar, legt nichts doppelt an.
// Die Schlüssel kennt nur der Server (Vercel); hier wird nichts davon ausgegeben.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { findeEinrichtung, einrichten, paypalEingerichtet } from '@/lib/server/paypal';
import { PREISE } from '@/lib/premium';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function pruefen(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ error: 'Nur für den Betreiber.' }, { status: 403 });
  if (!paypalEingerichtet()) return NextResponse.json({ error: 'Client-ID oder Secret fehlen in Vercel (oder der Neubau danach lief noch nicht).' }, { status: 503 });
  return null;
}

export async function GET(request: Request) {
  const nein = await pruefen(request);
  if (nein) return nein;
  try { return NextResponse.json(await findeEinrichtung(true)); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 502 }); }
}

export async function POST(request: Request) {
  const nein = await pruefen(request);
  if (nein) return nein;
  try { return NextResponse.json(await einrichten(PREISE.monat.cents)); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 502 }); }
}
