// ============================================================
// /api/verlegung — Spielverlegungen (Migration 0050, lib/server/verlegung.ts)
//   GET  → Anfragen des eigenen Teams (Ligaleitung: alle)
//   POST → neue Anfrage { key, datum, uhrzeit?, grund? } (nur TCs der beiden Teams)
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { ladeVerlegungen, frageVerlegungAn } from '@/lib/server/verlegung';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  try {
    return NextResponse.json({ verlegungen: await ladeVerlegungen(auth.user) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    const m = (e as Error).message;
    return NextResponse.json({ verlegungen: [], fehlt: /match_reschedules/.test(m) }, { status: /match_reschedules/.test(m) ? 200 : 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const body = (await request.json().catch(() => ({}))) as { key?: string; datum?: string; uhrzeit?: string | null; grund?: string | null };
  try {
    const v = await frageVerlegungAn(auth.user, { key: body.key ?? '', datum: body.datum ?? '', uhrzeit: body.uhrzeit, grund: body.grund });
    return NextResponse.json({ verlegung: v });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
