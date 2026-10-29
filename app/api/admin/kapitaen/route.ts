// ============================================================
// Route Handler: Teamcaptain wechseln (nur Ligaleitung)
// ============================================================
//
// GET  /api/admin/kapitaen?seasonId=…&teamId=…
//      → { konten: { [playerId]: { userId, name, rolle } }, bisherige: [{ userId, name, playerId }] }
//      Welche Kaderspieler ein verknüpftes Konto haben (nur die sind wählbar)
//      und wer heute Kapitänsrechte für das Team hat.
// POST /api/admin/kapitaen  { seasonId, teamId, playerId, behalten }
//
// Betreiber, 29.10.2026: Den Kapitän ändert nur die Ligaleitung — ein TC kann
// es nicht selbst. Der neue Kapitän braucht ein Konto, das mit seinem
// Spielerprofil verknüpft ist. Beim Wechsel jedes Mal wählen, ob der bisherige
// die Rechte behält. Umgestellt wird an allen Stellen, an denen der Kapitän
// steht: Kader (player_assignments / season_roster_assignments.is_captain),
// Saison-Team (captain_player_id/captain_user_id — daran hängt u. a. die
// Telefonnummer für die Gegner), Ansprechpartner der Anmeldung und die Rechte
// im Konto (profiles.role/team_id). Ligaleitungs-Konten bleiben, was sie sind.
// Glocke (→ Push) an neuen und bisherigen Kapitän und ans ganze Team.
// ============================================================

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { authenticateRequest, isAdminUser } from '@/lib/server/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Profil { id: string; role: string; team_id: string | null; player_id: string | null; display_name: string | null; first_name: string | null; last_name: string | null; email: string | null }
const PROFIL = 'id, role, team_id, player_id, display_name, first_name, last_name, email';
const nameVon = (p: Profil) => [p.first_name, p.last_name].filter(Boolean).join(' ') || p.display_name || p.email || 'Unbekannt';
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });

function db() {
  if (!supabaseAdmin) throw new Error('Server-Datenbank ist nicht konfiguriert.');
  return supabaseAdmin;
}

/** Spieler-IDs im Kader des Teams (Anmeldung + Nachmeldungen). */
async function kader(seasonId: string, teamId: string): Promise<Map<string, string>> {
  const [ro, pa] = await Promise.all([
    db().from('season_roster_assignments').select('player_id, first_name, last_name').eq('season_id', seasonId).eq('team_id', teamId).not('player_id', 'is', null),
    db().from('player_assignments').select('player_id, players:player_id(first_name, last_name)').eq('season_id', seasonId).eq('team_id', teamId),
  ]);
  const m = new Map<string, string>();
  for (const r of (ro.data ?? []) as { player_id: string; first_name: string | null; last_name: string | null }[]) m.set(r.player_id, `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim());
  for (const r of (pa.data ?? []) as unknown as { player_id: string; players: { first_name: string; last_name: string } | null }[]) {
    if (!m.has(r.player_id)) m.set(r.player_id, `${r.players?.first_name ?? ''} ${r.players?.last_name ?? ''}`.trim());
  }
  return m;
}

async function bisherigeKapitaene(teamId: string): Promise<Profil[]> {
  const { data } = await db().from('profiles').select(PROFIL).eq('team_id', teamId).eq('role', 'team_captain');
  return (data ?? []) as Profil[];
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  if (!isAdminUser(auth.user)) return fehler('Nur für die Ligaleitung.', 403);
  const q = new URL(request.url).searchParams;
  const seasonId = q.get('seasonId') ?? '', teamId = q.get('teamId') ?? '';
  if (!seasonId || !teamId) return fehler('Saison oder Team fehlt.');
  try {
    const ids = [...(await kader(seasonId, teamId)).keys()];
    const { data } = ids.length ? await db().from('profiles').select(PROFIL).in('player_id', ids) : { data: [] };
    const konten: Record<string, { userId: string; name: string; rolle: string }> = {};
    for (const p of (data ?? []) as Profil[]) if (p.player_id) konten[p.player_id] = { userId: p.id, name: nameVon(p), rolle: p.role };
    const bisherige = (await bisherigeKapitaene(teamId)).map(p => ({ userId: p.id, name: nameVon(p), playerId: p.player_id }));
    return NextResponse.json({ konten, bisherige });
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return fehler(auth.message, auth.status);
  const u = auth.user;
  if (!isAdminUser(u)) return fehler('Nur für die Ligaleitung.', 403);
  const b = await request.json().catch(() => ({})) as { seasonId?: string; teamId?: string; playerId?: string; behalten?: boolean };
  const seasonId = b.seasonId ?? '', teamId = b.teamId ?? '', playerId = b.playerId ?? '';
  if (!seasonId || !teamId || !playerId) return fehler('Saison, Team oder Spieler fehlt.');
  try {
    const k = await kader(seasonId, teamId);
    if (!k.has(playerId)) return fehler('Der Spieler steht nicht im Kader dieses Teams.');
    const { data: np } = await db().from('profiles').select(PROFIL).eq('player_id', playerId);
    const neu = ((np ?? []) as Profil[])[0];
    if (!neu) return fehler('Dieser Spieler hat noch kein Konto, das mit seinem Spielerprofil verknüpft ist. Erst registrieren und unter Admin → Benutzer verknüpfen.');
    const { data: tm } = await db().from('teams').select('name').eq('id', teamId).maybeSingle();
    const teamName = (tm as { name: string } | null)?.name ?? teamId;
    const alte = (await bisherigeKapitaene(teamId)).filter(p => p.id !== neu.id);

    // 1. Kader: genau einer ist Kapitän.
    for (const t of ['player_assignments', 'season_roster_assignments'] as const) {
      const { error: e1 } = await db().from(t).update({ is_captain: false }).eq('season_id', seasonId).eq('team_id', teamId).eq('is_captain', true);
      if (e1) return fehler(e1.message, 500);
      const { error: e2 } = await db().from(t).update({ is_captain: true }).eq('season_id', seasonId).eq('team_id', teamId).eq('player_id', playerId);
      if (e2) return fehler(e2.message, 500);
    }
    // 2. Saison-Team + Ansprechpartner der Anmeldung.
    const { data: sta, error: e3 } = await db().from('season_team_assignments')
      .update({ captain_player_id: playerId, captain_user_id: neu.id }).eq('season_id', seasonId).eq('team_id', teamId)
      .select('registration_id');
    if (e3) return fehler(e3.message, 500);
    const regId = ((sta ?? []) as { registration_id: string | null }[])[0]?.registration_id ?? null;
    let telefon: string | null = null;
    if (regId) {
      const { data: pc } = await db().from('player_contacts').select('phone').eq('player_id', playerId).not('phone', 'is', null).limit(1).maybeSingle();
      telefon = (pc as { phone: string | null } | null)?.phone ?? null;
      await db().from('team_registrations').update({ contact_name: nameVon(neu), contact_email: neu.email ?? '', contact_phone: telefon }).eq('id', regId);
    }
    // 3. Rechte: neuer Kapitän (Ligaleitungs-Konten behalten ihre Rolle), bisherige je nach Wahl.
    const neueRolle = neu.role === 'league_admin' || neu.role === 'super_admin' ? neu.role : 'team_captain';
    const { error: e4 } = await db().from('profiles').update({ role: neueRolle, team_id: teamId }).eq('id', neu.id);
    if (e4) return fehler(e4.message, 500);
    if (!b.behalten && alte.length) {
      const { error: e5 } = await db().from('profiles').update({ role: 'player' }).in('id', alte.map(p => p.id));
      if (e5) return fehler(e5.message, 500);
    }

    // 4. Glocken (→ Push). Wer in mehreren Gruppen ist, bekommt nur die passendste.
    const { data: tp } = await db().from('profiles').select('id').eq('team_id', teamId);
    const zeilen = new Map<string, { titel: string; text: string; url: string }>();
    for (const p of (tp ?? []) as { id: string }[]) {
      zeilen.set(p.id, { titel: 'Neuer Teamcaptain', text: `${nameVon(neu)} ist jetzt Teamcaptain von ${teamName}.`, url: `/teams/${teamId}` });
    }
    for (const p of alte) {
      zeilen.set(p.id, { titel: 'Teamcaptain gewechselt', url: `/teams/${teamId}`,
        text: `${nameVon(neu)} ist jetzt Teamcaptain von ${teamName}.${b.behalten ? ' Du behältst deine Kapitänsrechte.' : ' Deine Kapitänsrechte sind damit beendet.'}` });
    }
    zeilen.set(neu.id, { titel: 'Du bist jetzt Teamcaptain', url: '/mein-bereich', text: `Die Ligaleitung hat dich zum Teamcaptain von ${teamName} gemacht. Du kannst jetzt Spielberichte eintragen und das Team verwalten.` });
    zeilen.delete(u.id);
    if (zeilen.size) {
      await db().from('notifications').insert([...zeilen].map(([id, n]) => ({
        recipient_user_id: id, type: 'team_captain_changed', title: n.titel, message: n.text, short_text: n.text,
        related_entity_type: 'team', action_url: n.url,
      })));
    }

    revalidatePath('/teams/[id]', 'page');
    return NextResponse.json({
      ok: true, neu: nameVon(neu), rechteEntzogen: b.behalten ? [] : alte.map(nameVon), behalten: b.behalten ? alte.map(nameVon) : [],
      benachrichtigt: zeilen.size, kontaktAktualisiert: !!regId, telefon: !!telefon,
    });
  } catch (e) {
    return fehler(e instanceof Error ? e.message : 'Fehler.', 500);
  }
}
