// ============================================================
// Spieler-Nachmeldungen — Datenzugriff
// ============================================================
//
// Kapitän meldet Spieler nach (pending) → Ligaleitung bestätigt/lehnt ab.
// Benachrichtigungen laufen über DB-Trigger (Migration 0019). RLS aktiv.
// ============================================================

import { supabase } from './client';
import { generateNextPassNumber, nominationPlayerSlug, parseLicenseNumber, staticTeamBlock, nextFreeBlock } from '@/lib/data/pass-numbers';
import { getCurrentSeason } from '@/lib/data';
import { getRegistrationSeason } from './seasons';
import { normalizePersonName } from '@/lib/auth/player-match';

export type NominationStatus = 'pending' | 'approved' | 'rejected';

export const NOMINATION_STATUS_LABELS: Record<NominationStatus, string> = {
  pending: 'In Prüfung', approved: 'Bestätigt', rejected: 'Abgelehnt',
};

export type LastLeague = 'la_liga' | 'a_liga' | 'b_liga' | 'c_liga' | 'none';

export const LAST_LEAGUE_OPTIONS: { value: LastLeague; label: string }[] = [
  { value: 'none', label: 'Keine' },
  { value: 'la_liga', label: 'La Liga' },
  { value: 'a_liga', label: 'A-Liga' },
  { value: 'b_liga', label: 'B-Liga' },
  { value: 'c_liga', label: 'C-Liga' },
];

export const LAST_LEAGUE_LABELS: Record<LastLeague, string> = {
  none: 'Keine', la_liga: 'La Liga', a_liga: 'A-Liga', b_liga: 'B-Liga', c_liga: 'C-Liga',
};

export interface PlayerNomination {
  id: string;
  team_id: string;
  team_name: string;
  first_name: string;
  last_name: string;
  submitted_by: string;
  status: NominationStatus;
  review_note: string | null;
  reviewed_at: string | null;
  last_league: LastLeague | null;
  created_at: string;
  /** Generierter Spieler-Slug (bei Freigabe gesetzt). */
  player_id: string | null;
  /** Vorläufige/offizielle Passnummer. */
  license_number: string | null;
  /** true = automatisch generiert (vorläufig), false = manuell/offiziell gesetzt. */
  license_provisional: boolean | null;
  /** Konto, dem der Spieler zugeordnet wurde (nach Registrierung). */
  assigned_profile_id: string | null;
}

const NOT_CONFIGURED = 'Supabase ist nicht konfiguriert.';

export async function createNomination(teamId: string, teamName: string, firstName: string, lastName: string, lastLeague: LastLeague): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  if (!firstName.trim() || !lastName.trim()) return { error: 'Bitte Vor- und Nachname angeben.' };
  const { error } = await supabase.from('player_nominations').insert({
    team_id: teamId, team_name: teamName, first_name: firstName.trim(), last_name: lastName.trim(), last_league: lastLeague, status: 'pending',
  });
  return { error: error?.message ?? null };
}

export async function listMyNominations(): Promise<PlayerNomination[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('player_nominations').select('*').order('created_at', { ascending: false });
  return (data ?? []) as PlayerNomination[];
}

export async function listAllNominations(): Promise<PlayerNomination[]> {
  return listMyNominations(); // RLS: Admin sieht alle
}

export async function reviewNomination(id: string, status: Extract<NominationStatus, 'approved' | 'rejected'>, note?: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data: auth } = await supabase.auth.getUser();
  const patch: Record<string, unknown> = {
    status, review_note: note ?? null, reviewed_by: auth.user?.id ?? null, reviewed_at: new Date().toISOString(),
  };

  // Bei Freigabe: zuordenbaren Spieler + vorläufige Passnummer erzeugen
  // (Regel: höchste Passnummer der Teamkollegen + 1, nächste global freie).
  if (status === 'approved') {
    const { data: nom } = await supabase.from('player_nominations')
      .select('team_id, first_name, last_name, player_id, license_number').eq('id', id).single();
    const n = nom as { team_id: string; first_name: string; last_name: string; player_id: string | null; license_number: string | null } | null;
    if (n && !n.license_number) {
      // Prüfen, ob es den Spieler schon gibt (Teamwechsel/Wiederholung) → bestehendes
      // Profil + permanente Nummer WIEDERVERWENDEN, statt eine neue Nummer zu vergeben.
      // Nur bei eindeutigem Namenstreffer; sonst wird regulär eine Nummer erzeugt.
      let slug = n.player_id ?? '';
      let license = '';
      let provisional = true;
      if (!slug) {
        const { data: allP } = await supabase.from('players')
          .select('id, first_name, last_name, display_name, license_number');
        const target = normalizePersonName(`${n.first_name} ${n.last_name}`);
        const hits = ((allP ?? []) as { id: string; first_name: string | null; last_name: string | null; display_name: string | null; license_number: string | null }[])
          .filter(p => normalizePersonName(`${p.first_name ?? ''} ${p.last_name ?? ''}`) === target
                    || (p.display_name ? normalizePersonName(p.display_name) === target : false));
        if (hits.length === 1 && hits[0].license_number) { slug = hits[0].id; license = hits[0].license_number!; provisional = false; }
      }
      // Saison der Nachmeldung = offene Anmelde-Saison (z. B. 2026/2027), NICHT
      // die noch aktive (25/26) — sonst falsches Präfix („MDU 26") und der Spieler
      // landet in der falschen Saison (fehlt im 26/27-Kader).
      const regSeason = await getRegistrationSeason().catch(() => null);
      const seasonId = regSeason?.id ?? getCurrentSeason().id;
      const seasonYears = [...String(seasonId).matchAll(/\d{4}/g)].map(m => parseInt(m[0], 10)).filter(y => y >= 2000);
      const seasonYear = seasonYears.length ? Math.max(...seasonYears) : undefined;

      if (!license) {
        // Neuer Spieler (oder ohne Nummer) → Nummer im Team-Block der Saison
        // vergeben. Alle bereits vergebenen Nummern (Spieler, Kader, andere
        // Nachmeldungen) als belegt berücksichtigen, damit keine Dublette entsteht.
        const extraUsed: number[] = [];
        const collect = (rows: { license_number: string | null }[] | null) => {
          for (const r of rows ?? []) { const x = parseLicenseNumber(r.license_number); if (x != null) extraUsed.push(x); }
        };
        const { data: dbP } = await supabase.from('players').select('license_number').not('license_number', 'is', null);
        collect(dbP as { license_number: string | null }[] | null);
        const { data: dbR } = await supabase.from('season_roster_assignments').select('license_number').not('license_number', 'is', null);
        collect(dbR as { license_number: string | null }[] | null);
        const { data: dbN } = await supabase.from('player_nominations').select('license_number').eq('status', 'approved').not('license_number', 'is', null);
        collect(dbN as { license_number: string | null }[] | null);
        // Team-Block aus den vorhandenen Saison-Nummern des Teams bestimmen (sonst
        // statischer Block bzw. nächster freier Block).
        const { data: teamRows } = await supabase.from('season_roster_assignments')
          .select('license_number').eq('season_id', seasonId).eq('team_id', n.team_id).not('license_number', 'is', null);
        const teamNums = ((teamRows ?? []) as { license_number: string | null }[])
          .map(r => parseLicenseNumber(r.license_number)).filter((x): x is number => x != null && x >= 1000 && x < 10000);
        let blockBase: number | undefined;
        if (teamNums.length) {
          const cnt = new Map<number, number>();
          for (const x of teamNums) { const b = Math.floor(x / 100) * 100; cnt.set(b, (cnt.get(b) ?? 0) + 1); }
          blockBase = [...cnt.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
        } else {
          blockBase = staticTeamBlock(n.team_id) ?? nextFreeBlock(extraUsed.map(x => Math.floor(x / 100) * 100));
        }
        const gen = generateNextPassNumber(n.team_id, { extraUsed, seasonId, seasonYear, blockBase });
        license = gen.license;
        if (!slug) slug = nominationPlayerSlug(n.first_name, n.last_name, gen.number);
        provisional = true;
      }

      // Atomar über die RPC aus Migration 0033: Spieler + Kaderzuordnung +
      // Nominierungsstatus in EINER Transaktion — entweder alles oder nichts,
      // kein „approved" ohne Spieler/Kader mehr (REV-047).
      const { error: rpcError } = await supabase.rpc('approve_nomination', {
        p_id: id,
        p_license: license,
        p_player_id: slug,
        p_season_id: seasonId,
        p_team_id: n.team_id,
        p_first_name: n.first_name,
        p_last_name: n.last_name,
        p_provisional: provisional,
      });
      if (!rpcError) return { error: null };

      // Fallback NUR, solange Migration 0033 noch nicht eingespielt ist (Funktion
      // fehlt) — dann der bisherige, nicht-atomare Pfad, damit nichts blockiert.
      const rpcMissing = /PGRST202|could not find the function|does not exist/i.test(rpcError.message);
      if (!rpcMissing) return { error: rpcError.message };

      patch.license_number = license;
      patch.license_provisional = provisional;
      patch.player_id = slug;
      const { error: pe } = await supabase.from('players').upsert({
        id: slug, first_name: n.first_name, last_name: n.last_name,
        license_number: license, status: 'active', source: 'nomination',
      }, { onConflict: 'id' });
      if (pe) console.warn('players upsert (Migration 0032/0033 nötig?):', pe.message);
      const { error: ae } = await supabase.from('player_assignments').upsert({
        id: `pa-nom-${id}`, season_id: seasonId, team_id: n.team_id, player_id: slug,
        status: 'active', is_captain: false, source: 'nomination',
      }, { onConflict: 'id' });
      if (ae) console.warn('player_assignments upsert (Migration 0032/0033 nötig?):', ae.message);
    }
  }

  const { error } = await supabase.from('player_nominations').update(patch).eq('id', id);
  return { error: error?.message ?? null };
}

/** Passnummer manuell setzen/überschreiben (z. B. offizielle dartunion-Nummer). */
export async function updateNominationLicense(id: string, license: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED };
  const { error } = await supabase.from('player_nominations')
    .update({ license_number: license.trim() || null, license_provisional: false })
    .eq('id', id);
  return { error: error?.message ?? null };
}

export interface NominatedPlayerOption {
  /** Spieler-Slug (= profiles.player_id-Wert). */
  id: string;
  nominationId: string;
  name: string;
  license: string | null;
  teamId: string;
  assignedProfileId: string | null;
}

/** Freigegebene, per Nachmeldung angelegte Spieler — für die Konto-Zuordnung. */
export async function listApprovedNominatedPlayers(): Promise<NominatedPlayerOption[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('player_nominations')
    .select('id, player_id, first_name, last_name, license_number, team_id, assigned_profile_id')
    .eq('status', 'approved').not('player_id', 'is', null);
  return ((data ?? []) as { id: string; player_id: string; first_name: string; last_name: string; license_number: string | null; team_id: string; assigned_profile_id: string | null }[])
    .map(r => ({
      id: r.player_id, nominationId: r.id, name: `${r.first_name} ${r.last_name}`.trim(),
      license: r.license_number ?? null, teamId: r.team_id, assignedProfileId: r.assigned_profile_id ?? null,
    }));
}

export async function countPendingNominations(): Promise<number> {
  if (!supabase) return 0;
  const { count } = await supabase.from('player_nominations').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  return count ?? 0;
}
