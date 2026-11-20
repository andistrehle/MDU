import { NextResponse } from 'next/server';
import { baueSuchIndex } from '@/lib/server/suche';

// Suchindex für die Lupe in der Kopfzeile. Wird erst geholt, wenn jemand die Suche öffnet;
// eine Stunde am CDN (neue Spieler/Teams erscheinen also spätestens nach einer Stunde).
export const dynamic = 'force-dynamic';

export async function GET() {
  const index = await baueSuchIndex();
  return NextResponse.json({ index }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
}
