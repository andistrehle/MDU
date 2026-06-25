// ============================================================
// Route Handler: Admin-Benachrichtigung bei neuer Registrierung
// ============================================================
//
// POST /api/notifications/new-user  { email }
// Mailt die Super-Admin(s), dass sich ein neuer Benutzer registriert hat und
// eine Rollen-/Spieler-Zuordnung braucht. Öffentlich aufrufbar (der neue Nutzer
// hat bei E-Mail-Bestätigung noch keine Session) — aber serverseitig wird
// geprüft, dass für die E-Mail ein frisch angelegtes, noch nicht zugeordnetes
// Profil existiert. Versand best effort; blockiert die Registrierung nicht.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendRegistrationEmail } from '@/lib/server/email/send-email';
import { findPlayer, getPlayerDisplayName } from '@/lib/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ status: 'skipped', reason: 'no_admin' }, { status: 200 });

  let email = '';
  try { email = String((await request.json())?.email ?? '').trim(); } catch { /* leer */ }
  if (!email) return NextResponse.json({ error: 'E-Mail fehlt.' }, { status: 400 });

  // Profil zur E-Mail laden — nur ein frisch registriertes, noch nicht
  // zugeordnetes Konto löst die Admin-Mail aus (gegen Missbrauch).
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name, email, role, player_id, registration_intent, matched_player_id')
    .ilike('email', email)
    .maybeSingle();
  if (!profile) return NextResponse.json({ status: 'skipped', reason: 'no_profile' }, { status: 200 });
  if (!(profile.role === 'player' && !profile.player_id)) {
    return NextResponse.json({ status: 'skipped', reason: 'already_assigned' }, { status: 200 });
  }

  // Empfänger: alle Super Admins.
  const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name')
    .eq('role', 'super_admin');
  const recipients = (admins ?? []).map(a => a.email).filter((e): e is string => !!e);
  if (recipients.length === 0) return NextResponse.json({ status: 'skipped', reason: 'no_super_admin' }, { status: 200 });

  const matchedName = profile.matched_player_id
    ? (() => { const p = findPlayer(profile.matched_player_id as string); return p ? getPlayerDisplayName(p) : undefined; })()
    : undefined;

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mdudarts.de';
  let sent = 0;
  for (const to of recipients) {
    const r = await sendRegistrationEmail({
      type: 'new_user_admin',
      to,
      name: 'Ligaleitung',
      newUserName: profile.display_name ?? undefined,
      newUserEmail: profile.email ?? email,
      intent: profile.registration_intent ?? undefined,
      playerName: matchedName,
      actionUrl: `${base}/admin/users`,
    });
    if (r.status === 'sent') sent++;
  }

  return NextResponse.json({ status: 'ok', recipients: recipients.length, sent }, { status: 200 });
}
