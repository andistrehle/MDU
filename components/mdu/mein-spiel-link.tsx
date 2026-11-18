'use client';

// ============================================================
// „Mein Spiel“ im öffentlichen Spielplan (Betreiber, 13.11.2026)
// ============================================================
// Angemeldete Teammitglieder, deren Team den Team Manager hat, sehen an
// JEDEM Spiel ihres Teams (auch gespielten) einen kleinen Knopf mit ihrem
// eigenen Stand — „✓ Du bist dabei“ usw., bei vergangenen Spielen in der
// Vergangenheit („✓ Du warst dabei“) — und kommen damit direkt auf die Spielseite im Team Manager
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
import { NEUE_SAISON, termin27 } from '@/lib/data/saison-2027';
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

// Texte klar PERSÖNLICH (Betreiber 13.11.2026: „Abgesagt“ las sich wie „Spiel fällt aus“).
type Art = { text: string; bg: string; fg: string; titel: string };
const GRAU = { bg: 'rgba(120,120,120,0.14)', fg: 'var(--th-text-muted)' };
const ART: Record<ZusageStatus | 'offen', Art> = {
  yes: { text: '✓ Du bist dabei', bg: 'rgba(46,140,87,0.14)', fg: '#23774A', titel: 'Du hast zugesagt – zur Spielseite im Team Manager' },
  no: { text: '✗ Du bist nicht dabei', bg: 'rgba(196,60,60,0.12)', fg: '#B23A3A', titel: 'Du hast abgesagt – das Spiel findet trotzdem statt. Zur Spielseite im Team Manager' },
  maybe: { text: '? Du bist unsicher', ...GRAU, titel: 'Du bist unsicher – zur Spielseite im Team Manager' },
  offen: { text: 'Deine Rückmeldung fehlt', bg: '#F2C230', fg: '#1A1A1A', titel: 'Du hast noch nicht geantwortet – jetzt zu- oder absagen' },
};
// Vergangene Spiele in der Vergangenheit (Betreiber 18.11.2026); ohne Antwort dann unauffällig statt gelb.
const ART_VORBEI: Record<ZusageStatus | 'offen', Art> = {
  yes: { ...ART.yes, text: '✓ Du warst dabei', titel: 'Du hattest zugesagt – zur Spielseite im Team Manager' },
  no: { ...ART.no, text: '✗ Du warst nicht dabei', titel: 'Du hattest abgesagt – zur Spielseite im Team Manager' },
  maybe: { ...ART.maybe, text: '? Du warst unsicher', titel: 'Du warst unsicher – zur Spielseite im Team Manager' },
  offen: { text: 'Keine Rückmeldung', ...GRAU, titel: 'Du hattest nicht geantwortet – zur Spielseite im Team Manager' },
};
const heuteBerlin = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });

/** Knopf an einem Spiel: nur für Mitglieder von Heim oder Gast mit Team Manager.
 *  `gespielt` = es gibt schon ein Ergebnis; sonst entscheidet der Termin (vor heute = vorbei). */
export function MeinSpielLink({ heim, gast, k, gespielt = false }: { heim: string; gast: string; k: string; gespielt?: boolean }) {
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
  const datum = termin27(heim, gast)?.datum;
  const vorbei = gespielt || (!!datum && datum < heuteBerlin());
  const arten = vorbei ? ART_VORBEI : ART;
  const a = playerId ? (stand ? arten[stand[k] ?? 'offen'] : null) : { ...ART.offen, text: 'Team Manager', titel: 'Zur Spielseite im Team Manager' };
  return (
    <Link href={spieltagPfad(teamId, k)} title={a?.titel ?? 'Zur Spielseite im Team Manager'} style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap',
      fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 800, letterSpacing: '0.02em',
      background: a?.bg ?? 'var(--th-line-6)', color: a?.fg ?? 'var(--th-text-muted)',
    }}>{a ? a.text : 'Team Manager'} ›</Link>
  );
}
