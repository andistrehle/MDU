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
import { rateLimit, clientIp } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Einheitliche, nichtssagende Antwort. Diese Route ist öffentlich (der neue
// Nutzer hat bei E-Mail-Bestätigung noch keine Session). Alle Nicht-Fehler-Fälle
// antworten identisch, damit sich aus der Antwort NICHT ableiten lässt, ob eine
// E-Mail registriert/zugeordnet ist (Enumeration-Schutz, REV-013).
const accepted = () => NextResponse.json({ status: 'accepted' }, { status: 200 });

export async function POST(request: Request) {
  // Missbrauchsschutz gegen Mail-Flut/Enumeration (öffentlich aufrufbar).
  if (!rateLimit(`newuser:${clientIp(request)}`, 6, 600_000)) {
    return NextResponse.json({ status: 'accepted' }, { status: 429 });
  }
  if (!supabaseAdmin) return accepted();

  let email = '';
  try { email = String((await request.json())?.email ?? '').trim(); } catch { /* leer */ }
  if (!email) return accepted();

  // Profil zur E-Mail laden — nur ein frisch registriertes, noch nicht
  // zugeordnetes Konto löst die Admin-Mail aus (gegen Missbrauch).
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name, email, role, player_id, registration_intent, matched_player_id')
    .ilike('email', email)
    .maybeSingle();
  if (!profile) return accepted();
  if (!(profile.role === 'player' && !profile.player_id)) {
    return accepted();
  }

  // Empfänger: alle Super Admins.
  const { data: admins } = await supabaseAdmin
    .from('profiles')
    .select('email, display_name')
    .eq('role', 'super_admin');
  const recipients = (admins ?? []).map(a => a.email).filter((e): e is string => !!e);
  if (recipients.length === 0) return accepted();

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
  void sent; // Ergebnis wird bewusst NICHT nach außen gegeben (Enumeration-Schutz).

  return accepted();
}
