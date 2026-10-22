// ============================================================
// /api/admin/erfassung — wie die Spielberichte erfasst werden (nur Ligaleitung)
// lib/server/erfassung.ts, Migration 0055
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { ladeErfassung } from '@/lib/server/erfassung';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  try {
    return NextResponse.json(await ladeErfassung(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
