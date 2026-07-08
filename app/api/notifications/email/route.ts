// ============================================================
// Route Handler: E-Mail-Benachrichtigungen — Sprint Benachrichtigungen
// ============================================================
//
// POST /api/notifications/email
// Serverseitiger Versand von Registrierungs-E-Mails. Secrets bleiben hier
// (server-only ENV), niemals im Client. Aufruf nur mit gültigem Supabase-
// Access-Token (Authorization: Bearer …).
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { sendRegistrationEmail, type EmailType } from '@/lib/server/email/send-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TYPES: EmailType[] = [
  'registration_submitted',
  'registration_approved',
  'registration_rejected',
  'registration_changes_requested',
  'account_activated',
];

const REASON_REQUIRED: EmailType[] = ['registration_rejected', 'registration_changes_requested'];

// Offizielle Entscheidungs-/Freischalt-Mails dürfen NUR Ligaleitung/Super-Admin
// auslösen. `registration_submitted` (Eingangsbestätigung an den Antragsteller)
// bleibt für eingeloggte Teamkapitäne erlaubt.
const ADMIN_ONLY_TYPES: EmailType[] = [
  'registration_approved',
  'registration_rejected',
  'registration_changes_requested',
  'account_activated',
];

export async function POST(request: Request) {
  // ── Auth: gültiges Token + Rolle laden ──────────────────────
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  // ── Eingabe prüfen ──────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 });
  }

  const type = body.type as EmailType;
  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const name = typeof body.name === 'string' ? body.name : '';
  const teamName = typeof body.teamName === 'string' ? body.teamName : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const registrationId = typeof body.registrationId === 'string' ? body.registrationId : null;
  const role = typeof body.role === 'string' ? body.role : undefined;
  const playerName = typeof body.playerName === 'string' ? body.playerName : undefined;
  const assignedLeague = typeof body.assignedLeague === 'string' ? body.assignedLeague : null;
  const requestedLeague = typeof body.requestedLeague === 'string' ? body.requestedLeague : null;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Unbekannter E-Mail-Typ.' }, { status: 400 });
  }
  // Offizielle Mails (Freigabe/Ablehnung/Nachbesserung/Freischaltung) nur für Admins.
  if (ADMIN_ONLY_TYPES.includes(type) && !isAdminUser(auth.user)) {
    return NextResponse.json({ error: 'Keine Berechtigung für diesen E-Mail-Typ.' }, { status: 403 });
  }
  if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: 'Ungültige Empfängeradresse.' }, { status: 400 });
  }
  if (REASON_REQUIRED.includes(type) && !reason) {
    return NextResponse.json({ error: 'Bitte gib eine Begründung an.' }, { status: 400 });
  }

  // ── Versand (ehrlicher Status) ──────────────────────────────
  const result = await sendRegistrationEmail({
    type, to, name, teamName, reason: reason || null, role, playerName, relatedEntityId: registrationId,
    assignedLeague, requestedLeague,
  });

  return NextResponse.json(result, { status: 200 });
}
