// ============================================================
// Route Handler: Ergebnis-Seiten nach einem Spielbericht neu bauen
// ============================================================
//
// POST /api/match-reports/published  (Authorization: Bearer <access token>)
//
// Tabellen und Ergebnisse 2026/27 rechnen aus den Spielberichten
// (lib/server/ergebnisse-2027.ts) und sind statisch gebaut. Nach Einreichen,
// Ändern, Bestätigen oder Löschen ruft die Oberfläche diese Route auf; sie
// markiert die betroffenen Seiten. Neu gebaut wird erst beim nächsten Aufruf
// der jeweiligen Seite — kein Schwall an ISR-Schreibvorgängen.
//
// Nur für Kapitäne und Ligaleitung: Jeder Aufruf kostet beim nächsten Besuch
// einen Neubau, das soll niemand von außen auslösen können.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!isAdminUser(auth.user) && auth.user.role !== 'team_captain') {
    return NextResponse.json({ error: 'Kein Zugriff.' }, { status: 403 });
  }
  revalidatePath('/');
  revalidatePath('/tabellen');
  revalidatePath('/ergebnisse');
  revalidatePath('/spielplan');
  revalidatePath('/ligen/[code]', 'page');
  revalidatePath('/teams/[id]', 'page');
  revalidatePath('/spieler/[playerId]', 'page');
  return NextResponse.json({ ok: true });
}
