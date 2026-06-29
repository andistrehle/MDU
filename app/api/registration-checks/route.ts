// ============================================================
// Route Handler: Registrierungs-/Anmelde-Prüfungen (service-role)
// ============================================================
//
// POST /api/registration-checks
// Serverseitige Eindeutigkeits-Prüfungen, die der Client wegen RLS nicht
// selbst durchführen kann (fremde profiles/registrations sind nicht lesbar):
//   action 'account'             → Spieler bereits verknüpft? Team hat schon Kapitän?
//   action 'team-registration'   → Team für die Saison bereits (freigegeben) gemeldet?
//   action 'link-reset-request'  → Mail an Ligaleitung (Verknüpfung löschen/zurücksetzen)
//
// Nutzt supabaseAdmin (umgeht RLS) und gibt nur minimale Infos zurück.
// ============================================================

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRegistrationMatchSuggestion } from '@/lib/auth/player-match';
import { findTeam, findPlayer, getPlayerDisplayName } from '@/lib/data';
import { sendRegistrationEmail } from '@/lib/server/email/send-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KONTAKT_EMAIL = 'kontakt@mdudarts.de';

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'not_configured' }, { status: 200 });

  let body: Record<string, unknown>;
  try { body = (await request.json()) as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }); }

  const action = String(body.action ?? '');

  // ── Account-Registrierung: Spieler-/Kapitän-Eindeutigkeit ──
  if (action === 'account') {
    const firstName = String(body.firstName ?? '').trim();
    const lastName  = String(body.lastName ?? '').trim();
    const intent    = String(body.intent ?? 'player');
    if (!firstName || !lastName) return NextResponse.json({ playerLinked: false, teamCaptain: null });

    const match = getRegistrationMatchSuggestion(firstName, lastName);

    let playerLinked = false;
    let playerName: string | null = null;
    if (match.matchedPlayerId) {
      const { data } = await supabaseAdmin
        .from('profiles').select('id').eq('player_id', match.matchedPlayerId).limit(1);
      if (data && data.length > 0) {
        playerLinked = true;
        const p = findPlayer(match.matchedPlayerId);
        playerName = p ? getPlayerDisplayName(p) : `${firstName} ${lastName}`;
      }
    }

    let teamCaptain: { teamName: string; captainName: string } | null = null;
    if (intent === 'team_captain' && match.matchedTeamId) {
      const { data } = await supabaseAdmin
        .from('profiles').select('first_name,last_name,display_name')
        .eq('role', 'team_captain').eq('team_id', match.matchedTeamId).limit(1);
      if (data && data.length > 0) {
        const c = data[0] as { first_name?: string; last_name?: string; display_name?: string };
        const name = (c.display_name || `${c.first_name ?? ''} ${c.last_name ?? ''}`).trim() || 'unbekannt';
        teamCaptain = { teamName: findTeam(match.matchedTeamId)?.name ?? match.matchedTeamId, captainName: name };
      }
    }
    return NextResponse.json({ playerLinked, playerName, teamCaptain });
  }

  // ── Mannschaftsanmeldung: Team bereits (freigegeben) gemeldet? ──
  if (action === 'team-registration') {
    const teamId   = String(body.teamId ?? '').trim();
    const seasonId = String(body.seasonId ?? '').trim();
    if (!teamId || !seasonId) return NextResponse.json({ teamAlreadyRegistered: false });

    const { data: sta } = await supabaseAdmin
      .from('season_team_assignments').select('id').eq('season_id', seasonId).eq('team_id', teamId).limit(1);
    const { data: reg } = await supabaseAdmin
      .from('team_registrations').select('id')
      .eq('season_id', seasonId).eq('source_team_id', teamId).not('applied_at', 'is', null).limit(1);

    return NextResponse.json({
      teamAlreadyRegistered: (sta?.length ?? 0) > 0 || (reg?.length ?? 0) > 0,
    });
  }

  // ── Anfrage „Verknüpfung löschen/zurücksetzen" → Ligaleitung ──
  if (action === 'link-reset-request') {
    const requesterName  = String(body.requesterName ?? '').trim();
    const requesterEmail = String(body.requesterEmail ?? '').trim();
    const playerName     = String(body.playerName ?? '').trim();

    const { data: admins } = await supabaseAdmin
      .from('profiles').select('email').in('role', ['league_admin', 'super_admin']);
    const recipients = Array.from(new Set(
      [KONTAKT_EMAIL, ...((admins ?? []) as { email?: string }[]).map(a => a.email ?? '')]
        .map(e => e.trim()).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)),
    ));

    for (const to of recipients) {
      await sendRegistrationEmail({
        type: 'link_reset_request', to, name: 'Ligaleitung',
        requesterName, requesterEmail, playerName,
      });
    }
    return NextResponse.json({ ok: true, sent: recipients.length });
  }

  // ── Anfrage „E-Mail-Adresse vergessen" → Ligaleitung ──
  if (action === 'login-help-request') {
    const requesterName = String(body.requesterName ?? '').trim();
    const note          = String(body.note ?? '').trim();
    if (!requesterName) return NextResponse.json({ error: 'name_required' }, { status: 400 });

    const { data: admins } = await supabaseAdmin
      .from('profiles').select('email').in('role', ['league_admin', 'super_admin']);
    const recipients = Array.from(new Set(
      [KONTAKT_EMAIL, ...((admins ?? []) as { email?: string }[]).map(a => a.email ?? '')]
        .map(e => e.trim()).filter(e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)),
    ));

    for (const to of recipients) {
      await sendRegistrationEmail({
        type: 'login_help_request', to, name: 'Ligaleitung', requesterName, note,
      });
    }
    return NextResponse.json({ ok: true, sent: recipients.length });
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 });
}
