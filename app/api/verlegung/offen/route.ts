// GET /api/verlegung/offen — öffentlich: Begegnungen mit laufender Verlegungs-
// anfrage (nur die Kennung Heim|Gast), für den Hinweis „Verlegung angefragt“
// im Spielplan. Zwei Minuten am CDN zwischengespeichert — kein ISR.
import { NextResponse } from 'next/server';
import { offeneVerlegungsKeys } from '@/lib/server/verlegung';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = await offeneVerlegungsKeys().catch(() => []);
  return NextResponse.json({ keys }, { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } });
}
