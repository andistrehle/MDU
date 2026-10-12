'use client';

// Kachel eines Spiels in der Zu-/Absagen-Übersicht (Vorbild SpielerPlus):
// Kopf mit Datum + Heim/Auswärts + Gegner, darunter Treffen/Beginn/Ende, die
// Liga-Zeile und unten der Stand mit dem eigenen Status hervorgehoben.
// Die ganze Kachel führt zur Spieltag-Seite.

import Link from 'next/link';
import { team27, wochenendeText, type Begegnung27 } from '@/lib/data/saison-2027';
import type { Zusage } from '@/lib/supabase/zusagen';
import { spieltagPfad, endeZeit, treffZeit, wochentag, tagMonat } from '@/lib/spieltag';
import { STATUS, REIHE } from './zusagen-ui';

export function SpielKachel({ b, teamId, liga, zusagen, kaderAnzahl, ichId, treffenMin, meetTime }: {
  b: Begegnung27; teamId: string; liga: string; zusagen: Zusage[]; kaderAnzahl: number;
  ichId: string | null; treffenMin: number; meetTime: string | null;
}) {
  const heim = b.home === teamId;
  const gegner = team27(heim ? b.away : b.home)?.name ?? '';
  const t = b.termin;
  const meins = ichId ? zusagen.find(z => z.player_id === ichId)?.status : undefined;
  const zahl = (s: string) => zusagen.filter(z => z.status === s).length;
  const offen = Math.max(0, kaderAnzahl - zusagen.length);
  const zeiten: [string, string | null][] = [
    ['Treffen', treffZeit(t?.uhrzeit, treffenMin, meetTime)],
    ['Beginn', t?.uhrzeit ?? null],
    ['Ende', endeZeit(t?.uhrzeit)],
  ];

  return (
    <Link href={spieltagPfad(teamId, b.key)} style={{ display: 'block', textDecoration: 'none', borderRadius: 14, overflow: 'hidden', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', boxShadow: '0 2px 10px rgba(15,23,42,0.06)' }}>
      {/* Kopf */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: heim ? 'var(--th-accent)' : '#2B5F55', color: '#fff' }}>
        <div style={{ flexShrink: 0, minWidth: 46, fontFamily: 'var(--font-manrope)' }}>
          <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.1 }}>{t ? `${wochentag(t.datum)}.` : 'WE'}</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{t ? tagMonat(t.datum) : wochenendeText(b.fri, b.sun, false)}</div>
        </div>
        <div style={{ width: 2, alignSelf: 'stretch', background: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
        <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)' }}>
          <div style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.15 }}>{heim ? 'Heimspiel' : 'Auswärtsspiel'}</div>
          <div style={{ fontSize: 14, opacity: 0.92, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gegner}</div>
        </div>
        <span aria-hidden style={{ fontSize: 22, opacity: 0.85 }}>›</span>
      </div>

      {/* Zeiten */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '12px 8px 8px' }}>
        {zeiten.map(([lab, wert], i) => (
          <div key={lab} style={{ textAlign: 'center', borderLeft: i ? '1px solid var(--th-line-8)' : 'none', fontFamily: 'var(--font-manrope)' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: wert ? 'var(--th-text-strong)' : 'var(--th-text-faint)' }}>{wert ?? '–'}</div>
            <div style={{ fontSize: 12, color: 'var(--th-text-muted)' }}>{lab}</div>
          </div>
        ))}
      </div>
      <div style={{ margin: '4px 16px 0', padding: '8px 0 10px', borderTop: '1px solid var(--th-line-6)', fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)' }}>
        {[liga, `${b.spieltag}. Spieltag`, b.derby ? 'Derby' : null, t?.vorlaeufig ? 'Termin wird geprüft' : null].filter(Boolean).join(' | ')}
      </div>

      {/* Stand + eigener Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid var(--th-line-6)', padding: 6, gap: 4 }}>
        {REIHE.map(s => {
          const an = meins === s;
          return (
            <div key={s} title={STATUS[s].text} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 4px', borderRadius: 8, background: an ? (s === 'yes' ? 'rgba(34,197,94,0.25)' : s === 'no' ? 'rgba(192,57,43,0.18)' : 'rgba(232,184,74,0.25)') : 'transparent', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 16, color: 'var(--th-text-strong)' }}>
              <span aria-hidden style={{ fontSize: 17 }}>{STATUS[s].zeichen}</span>{zahl(s)}
            </div>
          );
        })}
        <div title="noch offen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 4px', borderRadius: 8, background: !meins && ichId ? 'var(--th-line-6)' : 'transparent', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-muted)' }}>
          <span aria-hidden style={{ fontSize: 16 }}>👥</span>{offen} offen
        </div>
      </div>
    </Link>
  );
}
