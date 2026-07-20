// ============================================================
// Route Handler: Benutzer löschen (Super Admin / Ligaleitung)
// ============================================================
//
// DELETE /api/admin/users/[userId]
// Löscht den Auth-Benutzer (und per ON DELETE CASCADE das Profil + die
// Benachrichtigungen). Erfordert Admin-Rechte; Schutzregeln: kein Selbst-Löschen,
// Ligaleitung darf keine (Super-)Admin-Konten löschen. Nur serverseitig
// (service_role). Hat der Benutzer noch verknüpfte Pflichtdaten (z. B. eingereichte
// Spielberichte), verhindert die Datenbank das Löschen — dann klare Meldung.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import {
  canDeleteUserAccount, canEditUserAccount, canAssignRole, hasMinRole,
  type UserProfile, type UserRole,
} from '@/lib/auth/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ROLES: UserRole[] = ['guest', 'player', 'team_captain', 'league_admin', 'super_admin'];

// ------------------------------------------------------------
// GET /api/admin/users/[userId] — Registrierungs-Kommentar lesen
// ------------------------------------------------------------
// Der bei der Registrierung eingegebene Freitext (Team/Lokal/Liga bei nicht
// erkanntem Spieler) liegt in den Auth-User-Metadaten (raw_user_meta_data),
// nicht in profiles. Nur per service_role lesbar → dieser Admin-Endpoint gibt
// ihn für den Benutzer-Dialog zurück. Erfordert mindestens Ligaleitung.
export async function GET(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;

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

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (error || !data?.user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 });
  }
  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const registrationComment = typeof meta.registration_comment === 'string'
    ? meta.registration_comment.trim() : '';
  return NextResponse.json({ registrationComment: registrationComment || null }, { status: 200 });
}

// ------------------------------------------------------------
// PATCH /api/admin/users/[userId] — Konto bearbeiten (REV-016)
// ------------------------------------------------------------
// Kritische Konto-/Rollenänderungen laufen serverseitig (service_role) mit
// vollständiger Rechteprüfung, statt sich allein auf RLS + Client-Gate zu
// verlassen. Ligaleitung darf nur Spieler/Teamkapitäne bearbeiten und diesen
// Rollen zuweisen; (Super-)Admin-Konten bleiben dem Super Admin vorbehalten.
export async function PATCH(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;

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

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Ungültiger Request-Body.' }, { status: 400 }); }

  const newRole = body.role as UserRole | undefined;
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    return NextResponse.json({ error: 'Ungültige Rolle.' }, { status: 400 });
  }

  // Zielkonto + aktuelle Rolle laden (Schutzregeln).
  const { data: target } = await supabaseAdmin
    .from('profiles').select('id, role').eq('id', userId).maybeSingle();
  if (!target) return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 });

  // Selbst-Aussperren verhindern: die eigene Rolle nicht per PATCH ändern (analog
  // zum Selbst-Löschschutz im DELETE). Sonst könnte sich z. B. der letzte Super
  // Admin versehentlich zum Spieler degradieren und den Adminzugang verlieren.
  if (userId === auth.user.id && newRole !== target.role) {
    return NextResponse.json({ error: 'Du kannst deine eigene Rolle hier nicht ändern.' }, { status: 400 });
  }

  // Darf der Akteur DIESES Konto bearbeiten? (Ligaleitung nur Spieler/Kapitäne.)
  if (!canEditUserAccount(actor, target.role as UserRole)) {
    return NextResponse.json({ error: 'Dieses Konto darfst du nicht bearbeiten.' }, { status: 403 });
  }
  // Bei Rollenwechsel: darf der Akteur diese Rolle vergeben? (keine Eskalation)
  if (newRole !== target.role && !canAssignRole(actor, newRole)) {
    return NextResponse.json({ error: 'Diese Rolle darfst du nicht vergeben.' }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    role: newRole,
    player_id: (body.player_id as string) || null,
    team_id: (body.team_id as string) || null,
  };
  if (typeof body.display_name === 'string' && body.display_name.trim()) {
    patch.display_name = body.display_name.trim();
  }
  if (typeof body.match_status === 'string') patch.match_status = body.match_status;

  const { data, error } = await supabaseAdmin
    .from('profiles').update(patch).eq('id', userId).select('*').maybeSingle();
  if (error || !data) {
    // Eindeutigkeit (Migration 0034): ein Spieler-Slug darf nur mit EINEM Konto
    // verknüpft sein. Bei Verstoß eine verständliche Meldung statt des rohen
    // „duplicate key"-Fehlers.
    const dupPlayer = error?.code === '23505'
      && /profiles_player_id_uniq|player_id/i.test(`${error.message} ${error.details ?? ''}`);
    if (dupPlayer) {
      return NextResponse.json({
        error: 'Dieses Spielerprofil ist bereits mit einem anderen Konto verknüpft. Ein Spielerprofil kann nur einem einzigen Konto zugeordnet sein.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? 'Speichern fehlgeschlagen.' }, { status: 400 });
  }
  return NextResponse.json({ status: 'updated', profile: data }, { status: 200 });
}

export async function DELETE(request: Request, ctx: { params: Promise<{ userId: string }> }) {
  const { userId } = await ctx.params;

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
  if (userId === auth.user.id) {
    return NextResponse.json({ error: 'Du kannst dein eigenes Konto hier nicht löschen.' }, { status: 400 });
  }

  // Zielkonto + Rolle laden, um die Schutzregeln anzuwenden.
  const { data: target } = await supabaseAdmin
    .from('profiles').select('id, role, display_name').eq('id', userId).maybeSingle();
  if (!target) return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 });

  if (!canDeleteUserAccount(actor, target.role as UserRole)) {
    return NextResponse.json({ error: 'Dieses Konto darfst du nicht löschen (Admin-/Super-Admin-Konto).' }, { status: 403 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    // Fremdschlüssel-Verletzung: Benutzer hat noch Pflicht-Daten (Spielberichte,
    // Anmeldungen, Uploads …), die ihn referenzieren.
    const fk = /foreign key|violates|constraint/i.test(error.message);
    const msg = fk
      ? 'Benutzer kann nicht gelöscht werden, da noch verknüpfte Daten bestehen (z. B. eingereichte Spielberichte, Mannschaftsanmeldungen oder Uploads). Diese müssten zuerst entfernt oder übertragen werden.'
      : `Löschen fehlgeschlagen: ${error.message}`;
    return NextResponse.json({ error: msg }, { status: 409 });
  }

  return NextResponse.json({ status: 'deleted', id: userId }, { status: 200 });
}
