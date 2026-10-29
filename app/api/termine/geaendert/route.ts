// ============================================================
// POST /api/termine/geaendert — Kalender-Abo nach eigenem Termin neu bauen
// ============================================================
//
// /kalender/<team>.ics ist statisch gebaut. Legt der TC im Team Manager einen
// eigenen Termin an (oder ändert/löscht ihn), markiert diese Route NUR die
// Datei dieses Teams; neu gebaut wird beim nächsten Abruf des Abos.
// Nur TC des Teams und Ligaleitung — jeder Aufruf kostet einen Neubau.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateRequest, hatTcRechtServer } from '@/lib/server/auth';
import { zusagenFuerTeam } from '@/lib/features';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { team } = (await request.json().catch(() => ({}))) as { team?: string };
  if (!team || !zusagenFuerTeam(team)) return NextResponse.json({ error: 'Team nicht freigeschaltet.' }, { status: 400 });
  const darf = hatTcRechtServer(auth.user, team, 'team_manager');
  if (!darf) return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  revalidatePath(`/kalender/${team}.ics`);
  return NextResponse.json({ ok: true });
}
