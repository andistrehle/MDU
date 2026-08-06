// ============================================================
// Route Handler: unbestätigte Konten ermitteln (Ligaleitung+)
// ============================================================
//
// GET /api/admin/users
// Liefert die Ids der Auth-Benutzer, deren E-Mail noch NICHT bestätigt ist
// (email_confirmed_at is null). Diese Registrierungen sind nicht abgeschlossen
// und sollen in der Benutzerverwaltung nicht als offene Aufgabe zählen.
// Nur serverseitig (service_role) lesbar; erfordert mindestens Ligaleitung.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { hasMinRole, type UserProfile } from '@/lib/auth/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server-Service ist nicht konfiguriert.' }, { status: 503 });

  const actor: UserProfile = {
    id: auth.user.id, email: auth.user.email, displayName: '',
    role: auth.user.role, teamId: auth.user.teamId ?? undefined, createdAt: '', updatedAt: '',
  };
  if (!hasMinRole(actor, 'league_admin')) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
  }

  // „Nicht abgeschlossen" = E-Mail NIE bestätigt UND NIE eingeloggt. Nur das trifft
  // echte Karteileichen (z. B. Anmeldung mit falscher/nicht existierender Adresse).
  // Bloßes email_confirmed_at=null ist zu grob — viele legitime (admin-/importierte)
  // Konten haben nie eine Bestätigung durchlaufen.
  const unconfirmed: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const u of data.users) if (!u.email_confirmed_at && !u.last_sign_in_at) unconfirmed.push(u.id);
    if (data.users.length < 200) break;
  }
  return NextResponse.json({ unconfirmed }, { status: 200 });
}
