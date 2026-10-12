'use client';

// Kachel eines Spiels in der Zu-/Absagen-Übersicht: Anzeigetafel (Datum,
// Heim/Auswärts, beide Teams mit Logo, Anwurf), Zeitleiste und der Stand mit
// dem eigenen Status hervorgehoben. Die ganze Kachel führt zur Spieltag-Seite.

import Link from 'next/link';
import { findLiga27, type Begegnung27 } from '@/lib/data/saison-2027';
import type { Zusage, ZusageStatus } from '@/lib/supabase/zusagen';
import { spieltagPfad } from '@/lib/spieltag';
import { Icon } from './icon';
import { SpielKopf, Zeitleiste, StandLeiste } from './zusagen-ui';

export function SpielKachel({ b, teamId, zusagen, kaderAnzahl, ichId, treffenMin, meetTime }: {
  b: Begegnung27; teamId: string; liga?: string; zusagen: Zusage[]; kaderAnzahl: number;
  ichId: string | null; treffenMin: number; meetTime: string | null;
}) {
  const l = findLiga27(b.liga);
  const meins = ichId ? zusagen.find(z => z.player_id === ichId)?.status ?? null : undefined;
  const zahl = (s: ZusageStatus) => zusagen.filter(z => z.status === s).length;

  return (
    <Link href={spieltagPfad(teamId, b.key)} className="mdu-spiel-kachel" style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', boxShadow: '0 2px 12px var(--th-shadow)' }}>
      <SpielKopf b={b} teamId={teamId} liga={l?.name ?? ''} ligaFarbe={l?.color ?? '#D40000'}
        rechts={<Icon name="chevron" size={14} style={{ opacity: 0.7 }} />} />
      <Zeitleiste beginn={b.termin?.uhrzeit} treffenMin={treffenMin} meetTime={meetTime} />
      {b.termin?.vorlaeufig && <div style={{ padding: '6px 14px 0', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-gold)' }}>Termin wird noch geprüft</div>}
      <StandLeiste zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={Math.max(0, kaderAnzahl - zusagen.length)} meins={meins} />
      <style>{'.mdu-spiel-kachel{transition:transform 160ms ease,box-shadow 160ms ease}.mdu-spiel-kachel:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--th-shadow)!important}'}</style>
    </Link>
  );
}
