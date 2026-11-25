// GET /api/wm-tipp — Spielplan, Ergebnisse und Ranglisten des WM-Tipps (nur mit Konto; solange nicht live nur Ligaleitung).
import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { ladeWmStand } from '@/lib/server/wm-tipp';
import { WM_TIPP_LIVE } from '@/lib/wm-tipp';
import { team27 } from '@/lib/data/saison-2027';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!WM_TIPP_LIVE && !isAdminUser(auth.user)) return NextResponse.json({ error: 'Der WM-Tipp startet bald.' }, { status: 403 });
  try {
    const stand = await ladeWmStand();
    if (!stand) return NextResponse.json({ error: 'Server-Datenbank ist nicht konfiguriert.' }, { status: 500 });
    const teamId = auth.user.teamId;
    return NextResponse.json({ ...stand, ich: { id: auth.user.id, teamId, liga: teamId ? team27(teamId)?.league ?? null : null } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: /wm_spiele/.test(msg) ? 'Migration 0075 fehlt noch.' : msg }, { status: 500 });
  }
}
