import Link from 'next/link';
import { TeamBadge } from './team-badge';
import { team27 } from '@/lib/data/saison-2027';
import type { EinzelZeile } from '@/lib/einzelrangliste-2027';

// Einzelrangliste 2026/27 einer Liga (Server-tauglich, keine Hooks).
// Gerechnet in lib/einzelrangliste-2027.ts aus den Einzelpartien der Spielberichte.
// Am Handy fallen Legs, 180er und High Finish weg.

const mono: React.CSSProperties = { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, textAlign: 'right', color: 'var(--th-text-muted)' };

export function Einzelrangliste27({ zeilen }: { zeilen: EinzelZeile[] }) {
  if (!zeilen.length) {
    return <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-muted)', margin: 0, padding: '14px 16px' }}>Noch keine Einzel gespielt. Die Rangliste füllt sich mit dem ersten eingereichten Spielbericht.</p>;
  }
  const offen = zeilen.some(z => z.offen > 0);
  const cols = '34px minmax(0,1.6fr) var(--e27-team, minmax(0,1fr)) 34px 50px var(--e27-x, 54px) var(--e27-x, 40px) var(--e27-x, 40px) 40px';
  return (
    <div className="e27">
      <style>{`@media (max-width:640px){.e27{--e27-x:0px;--e27-team:22px}.e27 .e27-x{display:none}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>
        <span>#</span><span>Spieler</span><span className="e27-x">Team</span>
        <span style={{ textAlign: 'right' }} title="Einzel gespielt">E</span>
        <span style={{ textAlign: 'right' }} title="Siege – Niederlagen">S-N</span>
        <span className="e27-x" style={{ textAlign: 'right' }}>Legs</span>
        <span className="e27-x" style={{ textAlign: 'right' }}>180</span>
        <span className="e27-x" style={{ textAlign: 'right' }} title="Höchstes Finish">HF</span>
        <span style={{ textAlign: 'right' }}>Pkt.</span>
      </div>
      {zeilen.map((z, i) => {
        const t = team27(z.teamId);
        const name = <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {z.name}{z.offen > 0 && <span title="Enthält Ergebnisse, die der Gegner noch nicht bestätigt hat" style={{ color: '#9A6B00', fontWeight: 800 }}> *</span>}
        </span>;
        return (
          <div key={z.key} style={{ display: 'grid', gridTemplateColumns: cols, gap: 6, alignItems: 'center', padding: '8px 14px', borderBottom: i < zeilen.length - 1 ? '1px solid var(--th-line-3)' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: z.pos <= 3 ? 'var(--th-gold, #B8860B)' : 'var(--th-text-faint)' }}>{z.pos}.</span>
            {z.playerId ? <Link href={`/spieler/${z.playerId}`} style={{ minWidth: 0, textDecoration: 'none', overflow: 'hidden' }}>{name}</Link> : <span style={{ minWidth: 0, overflow: 'hidden' }}>{name}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <TeamBadge initials={(t?.short ?? z.teamId).slice(0, 3)} color={t?.color} logoUrl={t?.logoUrl ?? undefined} size={18} ring="transparent" />
              <span className="e27-x" style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t?.short ?? t?.name ?? z.teamId}</span>
            </span>
            <span style={mono}>{z.singles}</span>
            <span style={mono}>{z.wins}-{z.losses}</span>
            <span className="e27-x" style={mono} title={`${z.legsWon}:${z.legsLost}`}>{z.legsWon}:{z.legsLost}</span>
            <span className="e27-x" style={mono}>{z.b180 || ''}</span>
            <span className="e27-x" style={mono}>{z.highFinish ?? ''}</span>
            <span style={{ ...mono, fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>{z.points}</span>
          </div>
        );
      })}
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', lineHeight: 1.5 }}>
        Nur Einzel: 2:0 = 3 · 2:1 = 2 · 1:2 = 1 · 0:2 = 0 Punkte. Reihenfolge: Punkte, dann Legdifferenz, dann Siege.
        {offen && <div><span style={{ color: '#9A6B00', fontWeight: 800 }}>*</span> enthält Ergebnisse, die der Gegner noch nicht bestätigt hat.</div>}
      </div>
    </div>
  );
}
