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
import { createClient } from '@supabase/supabase-js';
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

export async function POST(request: Request) {
  // ── Auth: gültiges Supabase-Token verlangen ─────────────────
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert.' }, { status: 503 });
  }
  if (!token) {
    return NextResponse.json({ error: 'Nicht authentifiziert.' }, { status: 401 });
  }

  const authClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: userData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userData.user) {
    return NextResponse.json({ error: 'Ungültige Sitzung.' }, { status: 401 });
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

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Unbekannter E-Mail-Typ.' }, { status: 400 });
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
  });

  return NextResponse.json(result, { status: 200 });
}
