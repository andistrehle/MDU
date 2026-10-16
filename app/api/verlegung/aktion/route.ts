// POST /api/verlegung/aktion — { id, aktion, grund? }
//   Gegner-TC: bestaetigen | ablehnen · Antragsteller: zurueckziehen
//   Ligaleitung: freigeben | ablehnen | uebernehmen (erneut versuchen)
import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { beantworteVerlegung, gibVerlegungFrei } from '@/lib/server/verlegung';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { id, aktion, grund, alsLigaleitung } = (await request.json().catch(() => ({}))) as { id?: string; aktion?: string; grund?: string | null; alsLigaleitung?: boolean };
  if (!id || !aktion) return NextResponse.json({ error: 'Unvollständig.' }, { status: 400 });
  try {
    const v = alsLigaleitung && isAdminUser(auth.user) && ['freigeben', 'ablehnen', 'uebernehmen'].includes(aktion)
      ? await gibVerlegungFrei(auth.user, id, aktion as 'freigeben' | 'ablehnen' | 'uebernehmen', grund)
      : ['bestaetigen', 'ablehnen', 'zurueckziehen'].includes(aktion)
        ? await beantworteVerlegung(auth.user, id, aktion as 'bestaetigen' | 'ablehnen' | 'zurueckziehen', grund)
        : null;
    if (!v) return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
    return NextResponse.json({ verlegung: v });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
