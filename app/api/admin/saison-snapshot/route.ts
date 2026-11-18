// ============================================================
// /api/admin/saison-snapshot — öffentliche Seiten mit der Verwaltung abgleichen
// ============================================================
// GET  vergleicht: Was steht in der Datenbank anders als auf den öffentlichen Seiten
//      (Lokal, Name, Kürzel, Logo eines Teams)?
// POST übernimmt die Unterschiede als Commit (→ Neubau, ein paar Minuten).
// Nur Ligaleitung. Rechnung: lib/saison-snapshot.ts, Server: lib/server/saison-snapshot.ts.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { snapshotUebernehmen, snapshotVergleich } from '@/lib/server/saison-snapshot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function darf(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user)) return NextResponse.json({ error: 'Nur für die Ligaleitung.' }, { status: 403 });
  return null;
}

export async function GET(request: Request) {
  const nein = await darf(request);
  if (nein) return nein;
  try {
    return NextResponse.json(await snapshotVergleich(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Vergleich fehlgeschlagen.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const nein = await darf(request);
  if (nein) return nein;
  const r = await snapshotUebernehmen();
  if (r.error) return NextResponse.json({ error: r.error, unterschiede: r.unterschiede }, { status: 502 });
  return NextResponse.json({ ok: true, geaendert: r.geaendert, unterschiede: r.unterschiede });
}
