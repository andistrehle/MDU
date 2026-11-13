'use client';

// ============================================================
// „Mein Spiel“ im öffentlichen Spielplan (Betreiber, 13.11.2026)
// ============================================================
// Angemeldete Teammitglieder, deren Team den Team Manager hat, sehen an
// JEDEM Spiel ihres Teams (auch gespielten) einen kleinen Knopf mit ihrem
// eigenen Stand — „✓ Zugesagt“, „✗ Abgesagt“, „? Unsicher“ oder gelb
// „Zusagen“ — und kommen damit direkt auf die Spielseite im Team Manager
// (/spieltag/<team>/<heim>--<gast>). Alle anderen sehen nichts; die Seite
// bleibt statisch, entschieden wird erst im Browser.
//
// Der Spielplan zeigt bis zu ~240 Spiele auf einmal: die eigenen Zusagen
// werden deshalb EINMAL je Team und Spieler geholt (gemeinsamer Merker), nicht
// je Karte.
// ============================================================

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCurrentUser } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { NEUE_SAISON } from '@/lib/data/saison-2027';
import { zusagenFuerTeam } from '@/lib/features';
import { spieltagPfad } from '@/lib/spieltag';
import type { ZusageStatus } from '@/lib/supabase/zusagen';

type Stand = Record<string, ZusageStatus>;
// Kurz gültig: wer auf der Spielseite zusagt und zurückgeht, sieht den neuen Stand.
const GUELTIG_MS = 10_000;
const merker = new Map<string, { p: Promise<Stand>; t: number }>();

function meineZusagen(teamId: string, playerId: string): Promise<Stand> {
  const k = `${teamId}|${playerId}`;
  const alt = merker.get(k);
  if (alt && Date.now() - alt.t < GUELTIG_MS) return alt.p;
  const p = (async () => {
    if (!supabase) return {};
    const { data } = await supabase.from('match_availability').select('match_key, status')
      .eq('season_id', NEUE_SAISON.id).eq('team_id', teamId).eq('player_id', playerId);
    const s: Stand = {};
    for (const r of (data ?? []) as { match_key: string; status: ZusageStatus }[]) s[r.match_key] = r.status;
    return s;
  })().catch((): Stand => ({}));
  merker.set(k, { p, t: Date.now() });
  return p;
}

const ART: Record<ZusageStatus | 'offen', { text: string; bg: string; fg: string; titel: string }> = {
  yes: { text: '✓ Zugesagt', bg: 'rgba(46,140,87,0.14)', fg: '#23774A', titel: 'Du hast zugesagt – zur Spielseite im Team Manager' },
  no: { text: '✗ Abgesagt', bg: 'rgba(196,60,60,0.12)', fg: '#B23A3A', titel: 'Du hast abgesagt – zur Spielseite im Team Manager' },
  maybe: { text: '? Unsicher', bg: 'rgba(120,120,120,0.14)', fg: 'var(--th-text-muted)', titel: 'Du bist unsicher – zur Spielseite im Team Manager' },
  offen: { text: 'Zusagen', bg: '#F2C230', fg: '#1A1A1A', titel: 'Du hast noch nicht geantwortet – jetzt zu- oder absagen' },
};

/** Knopf an einem Spiel: nur für Mitglieder von Heim oder Gast mit Team Manager. */
export function MeinSpielLink({ heim, gast, k }: { heim: string; gast: string; k: string }) {
  const user = useCurrentUser();
  const teamId = user?.teamId;
  const meins = !!teamId && (teamId === heim || teamId === gast) && (!!user?.teamManager || zusagenFuerTeam(teamId));
  const playerId = meins ? user?.playerId ?? null : null;
  const [stand, setStand] = useState<Stand | null>(null);

  useEffect(() => {
    if (!meins || !teamId || !playerId) return;
    let weg = false;
    void meineZusagen(teamId, playerId).then(s => { if (!weg) setStand(s); });
    return () => { weg = true; };
  }, [meins, teamId, playerId]);

  if (!meins || !teamId) return null;
  // Ohne verknüpftes Spielerprofil gibt es keinen eigenen Stand – dann nur der Weg hin.
  const a = playerId ? (stand ? ART[stand[k] ?? 'offen'] : null) : { ...ART.offen, text: 'Team Manager', titel: 'Zur Spielseite im Team Manager' };
  return (
    <Link href={spieltagPfad(teamId, k)} title={a?.titel ?? 'Zur Spielseite im Team Manager'} style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.02em',
      background: a?.bg ?? 'var(--th-line-6)', color: a?.fg ?? 'var(--th-text-muted)',
    }}>{a ? a.text : 'Team Manager'} ›</Link>
  );
}
