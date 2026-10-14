'use client';

// Kachel eines Spiels in der Zu-/Absagen-Übersicht: Anzeigetafel (Datum,
// Heim/Auswärts, beide Teams mit Logo, Anwurf), Zeitleiste und der Stand mit
// dem eigenen Status hervorgehoben. Die ganze Kachel führt zur Spieltag-Seite.

import Link from 'next/link';
import { findLiga27, type Begegnung27 } from '@/lib/data/saison-2027';
import type { Zusage, ZusageStatus, Aufgabe } from '@/lib/supabase/zusagen';
import { spieltagPfad } from '@/lib/spieltag';
import { Icon } from './icon';
import { SpielKopf, Zeitleiste, StandLeiste } from './zusagen-ui';

export function SpielKachel({ b, teamId, zusagen, kaderAnzahl, ichId, treffenMin, meetTime, notiz = null, aufgaben = [] }: {
  b: Begegnung27; teamId: string; liga?: string; zusagen: Zusage[]; kaderAnzahl: number;
  ichId: string | null; treffenMin: number; meetTime: string | null;
  notiz?: string | null; aufgaben?: Aufgabe[];
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
      <NotizAufgabenHinweis notiz={notiz} aufgaben={aufgaben} ichId={ichId} />
      <StandLeiste zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={Math.max(0, kaderAnzahl - zusagen.length)} meins={meins} />
      <style>{'.mdu-spiel-kachel{transition:transform 160ms ease,box-shadow 160ms ease}.mdu-spiel-kachel:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--th-shadow)!important}'}</style>
    </Link>
  );
}

/** Hinweiszeile in der Kachel: Notiz (gekürzt) und offene Aufgaben, eigene hervorgehoben. */
export function NotizAufgabenHinweis({ notiz, aufgaben, ichId }: { notiz: string | null; aufgaben: Aufgabe[]; ichId: string | null }) {
  const offeneAufgaben = aufgaben.filter(a => !a.done);
  const fuerMich = ichId ? offeneAufgaben.filter(a => a.assignee_id === ichId).length : 0;
  if (!notiz && !aufgaben.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '8px 12px 0', padding: '8px 10px', borderRadius: 10, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, color: 'var(--th-text-body)' }}>
          {notiz && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0, flex: '1 1 160px' }}><Icon name="edit" size={14} style={{ color: 'var(--th-accent)', flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notiz}</span></span>}
          {aufgaben.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: notiz ? 'auto' : 0 }}>
              <Icon name="check" size={14} stroke={2.4} style={{ color: offeneAufgaben.length ? 'var(--th-gold)' : 'var(--th-win)' }} />
              {offeneAufgaben.length ? `${offeneAufgaben.length} ${offeneAufgaben.length === 1 ? 'Aufgabe' : 'Aufgaben'} offen` : 'Aufgaben erledigt'}
              {fuerMich > 0 && <span style={{ padding: '1px 7px', borderRadius: 999, background: 'var(--th-accent)', color: '#fff', fontSize: 11 }}>{fuerMich} für dich</span>}
            </span>
          )}
        </div>
  );
}
