'use client';

// Kachel eines Spiels in der Zu-/Absagen-Übersicht: Anzeigetafel (Datum,
// Heim/Auswärts, beide Teams mit Logo, Anwurf), Zeitleiste und der Stand mit
// dem eigenen Status hervorgehoben. Die ganze Kachel führt zur Spieltag-Seite.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { findLiga27, type Begegnung27 } from '@/lib/data/saison-2027';
import type { Zusage, ZusageStatus, Aufgabe } from '@/lib/supabase/zusagen';
import { spieltagPfad } from '@/lib/spieltag';
import { Icon } from './icon';
import { SpielKopf, Zeitleiste, StandLeiste, KachelFuss, namenJeGruppe, gruppenAnker } from './zusagen-ui';

export function SpielKachel({ b, teamId, zusagen, kaderAnzahl, ichId, treffenMin, meetTime, notiz = null, aufgaben = [], personen, onAntwort }: {
  b: Begegnung27; teamId: string; liga?: string; zusagen: Zusage[]; kaderAnzahl: number;
  ichId: string | null; treffenMin: number; meetTime: string | null;
  notiz?: string | null; aufgaben?: Aufgabe[];
  /** Kader (+ ich) — macht die Zahlen interaktiv (Namen, Sprung zur Teilnehmerliste). */
  personen?: { id: string; name: string }[];
  /** Eigene Antwort direkt in der Kachel (Terminliste). */
  onAntwort?: (status: ZusageStatus, note: string | null) => Promise<string | null>;
}) {
  const router = useRouter();
  const pfad = spieltagPfad(teamId, b.key);
  const l = findLiga27(b.liga);
  const meins = ichId ? zusagen.find(z => z.player_id === ichId)?.status ?? null : undefined;
  const zahl = (s: ZusageStatus) => zusagen.filter(z => z.status === s).length;

  return (
    <div className="mdu-spiel-kachel" style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', boxShadow: '0 2px 12px var(--th-shadow)' }}>
    <Link href={pfad} style={{ display: 'block', textDecoration: 'none' }}>
      <SpielKopf b={b} teamId={teamId} liga={l?.name ?? ''} ligaFarbe={l?.color ?? '#D40000'}
        rechts={<Icon name="chevron" size={14} style={{ opacity: 0.7 }} />} />
      <Zeitleiste beginn={b.termin?.uhrzeit} treffenMin={treffenMin} meetTime={meetTime} />
      {b.termin?.vorlaeufig && <div style={{ padding: '6px 14px 0', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-gold)' }}>Termin wird noch geprüft</div>}
      <NotizAufgabenHinweis notiz={notiz} aufgaben={aufgaben} ichId={ichId} />
    </Link>
      {/* Außerhalb des Links: eigene Antwort + Stand (aufklappbar: Namen, Sprung zur Teilnehmerliste). */}
      <KachelFuss zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={Math.max(0, kaderAnzahl - zusagen.length)} meins={meins}
        meineNotiz={ichId ? zusagen.find(z => z.player_id === ichId)?.note ?? null : null} onAntwort={ichId ? onAntwort : undefined}>
        <StandLeiste zahl={{ yes: zahl('yes'), maybe: zahl('maybe'), no: zahl('no') }} offen={Math.max(0, kaderAnzahl - zusagen.length)} meins={meins}
          namen={personen ? namenJeGruppe(personen, id => zusagen.find(z => z.player_id === id)) : undefined}
          zurListe={g => router.push(`${pfad}#${gruppenAnker(g)}`)} />
      </KachelFuss>
      <style>{'.mdu-spiel-kachel{transition:transform 160ms ease,box-shadow 160ms ease}.mdu-spiel-kachel:hover{transform:translateY(-2px);box-shadow:0 8px 24px var(--th-shadow)!important}'}</style>
    </div>
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
