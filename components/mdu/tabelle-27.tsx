import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { ZONE } from './auf-abstieg-27';
import { AUF_AB_2027, team27, type Liga27 } from '@/lib/data/saison-2027';
import type { TabellenZeile } from '@/lib/tabelle-2027';

// Tabelle 2026/27 aus den Spielberichten (Server-tauglich, keine Hooks).
// Vor dem ersten Ergebnis: Platz „–", alphabetisch, alles 0 (wie bisher).
// Auf schmalen Bildschirmen fallen S/U/N und Legs weg.

const mono: React.CSSProperties = { fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, textAlign: 'right', color: 'var(--th-text-muted)' };
const diff = (a: number, b: number) => { const d = a - b; return d > 0 ? `+${d}` : String(d); };

export function Tabelle27({ liga, zeilen }: { liga: Liga27; zeilen: TabellenZeile[] }) {
  const gespielt = zeilen.some(z => z.sp > 0);
  const rows = gespielt ? zeilen : [...zeilen].sort((a, b) => (team27(a.team)?.name ?? '').localeCompare(team27(b.team)?.name ?? '', 'de'));
  const offen = zeilen.some(z => z.offen > 0);
  const abzug = zeilen.some(z => z.abzug < 0);
  const cols = '30px minmax(0,1fr) 30px var(--t27-sun, 72px) 64px var(--t27-legs, 64px) 40px';
  return (
    <div className="t27">
      <style>{`.t27{--t27-sun:72px;--t27-legs:64px}@media (max-width:600px){.t27{--t27-sun:0px;--t27-legs:0px}.t27 .t27-x{display:none}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>
        <span>#</span><span>Team</span><span style={{ textAlign: 'right' }}>Sp.</span>
        <span className="t27-x" style={{ textAlign: 'right' }}>S-U-N</span>
        <span style={{ textAlign: 'right' }}>Spiele</span>
        <span className="t27-x" style={{ textAlign: 'right' }}>Legs</span>
        <span style={{ textAlign: 'right' }}>Pkt.</span>
      </div>
      {rows.map((z, i) => {
        const t = team27(z.team);
        const zone = gespielt ? AUF_AB_2027[liga.code]?.[z.pos - 1]?.zone : undefined;
        const zs = zone && zone !== 'bleibt' ? ZONE[zone] : null;
        return (
          <div key={z.team} style={{ display: 'grid', gridTemplateColumns: cols, gap: 6, alignItems: 'center', padding: '8px 14px', borderBottom: i < rows.length - 1 ? '1px solid var(--th-line-3)' : 'none', background: zs?.bg }}>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: zs?.fg ?? 'var(--th-text-faint)' }}>
              {gespielt ? `${z.pos}.` : '–'}
            </span>
            <TeamLink teamId={z.team} teamName={t?.name ?? z.team} style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, textDecoration: 'none' }}>
              <TeamBadge initials={(t?.short ?? z.team).slice(0, 3)} color={t?.color} logoUrl={t?.logoUrl ?? undefined} size={20} ring="transparent" />
              <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t?.name ?? z.team}{z.offen > 0 && <span title="Ergebnis noch nicht vom Gegner bestätigt" style={{ color: '#9A6B00', fontWeight: 800 }}> *</span>}
              </span>
            </TeamLink>
            <span style={mono}>{z.sp}</span>
            <span className="t27-x" style={mono}>{z.s}-{z.u}-{z.n}</span>
            <span style={mono} title={`${z.spieleFor}:${z.spieleAgainst}`}>{gespielt ? diff(z.spieleFor, z.spieleAgainst) : '0'}</span>
            <span className="t27-x" style={mono} title={`${z.legsFor}:${z.legsAgainst}`}>{gespielt ? diff(z.legsFor, z.legsAgainst) : '0'}</span>
            <span style={{ ...mono, fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>{z.pts}{z.abzug < 0 && <sup style={{ color: '#C0392B', fontSize: 9 }}>({z.abzug})</sup>}</span>
          </div>
        );
      })}
      {(offen || abzug) && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', lineHeight: 1.5 }}>
          {offen && <div><span style={{ color: '#9A6B00', fontWeight: 800 }}>*</span> Ergebnis eingereicht, vom Gegner noch nicht bestätigt — kann sich noch ändern.</div>}
          {abzug && <div><span style={{ color: '#C0392B', fontWeight: 800 }}>(−3)</span> Punktabzug für Nichtantritt.</div>}
        </div>
      )}
    </div>
  );
}
