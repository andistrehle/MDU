import { TeamBadge } from './team-badge';
import { FormDots } from './form-dots';
import { statusColor, diffColor } from '@/lib/utils';
import { getExtendedTeam } from '@/lib/data';

interface StandingRow {
  pos: number;
  team: string;
  name?: string;
  sp?: number;
  p?: number;
  s?: number;
  w?: number;
  u?: number;
  n?: number;
  l?: number;
  legs: string;
  diff: string;
  pts: number;
  form?: ('W' | 'L')[];
  status: 'promo' | 'playoff' | 'releg' | null;
}

interface StandingsTableProps {
  rows: StandingRow[];
  title?: string;
  showForm?: boolean;
  showU?: boolean;
}

export function StandingsTable({ rows, title = 'Tabelle', showForm = false, showU = true }: StandingsTableProps) {
  const colTemplate = showForm
    ? '32px 1fr 36px 28px 28px 28px 56px 56px 40px 90px'
    : showU
      ? '32px 1fr 36px 28px 28px 28px 56px 56px 40px'
      : '32px 1fr 36px 28px 28px 56px 56px 40px';

  return (
    <div className="mdu-table-scroll">
    <div className="mdu-standings-inner" style={{ background: '#121821', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px 24px' }}>
      {title && (
        <h2 style={{
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
          letterSpacing: '0.08em', color: '#F5F6FA', margin: '0 0 18px',
          textTransform: 'uppercase',
        }}>{title}</h2>
      )}

      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: colTemplate, padding: '10px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
        letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase',
        gap: 6, alignItems: 'center',
      }}>
        <span>Pl.</span>
        <span>Team</span>
        <span style={{ textAlign: 'center' }}>Sp.</span>
        <span style={{ textAlign: 'center' }}>S</span>
        {showU && <span style={{ textAlign: 'center' }}>U</span>}
        <span style={{ textAlign: 'center' }}>N</span>
        <span style={{ textAlign: 'center' }}>Legs</span>
        <span style={{ textAlign: 'center' }}>Diff.</span>
        <span style={{ textAlign: 'right' }}>Pkt.</span>
        {showForm && <span style={{ textAlign: 'center' }}>Form</span>}
      </div>

      {rows.map(r => {
        const teamData = r.name ? { name: r.name, short: r.name.split(' ').map(x => x[0]).join('').slice(0, 3), color: getExtendedTeam(r.team).color } : getExtendedTeam(r.team);
        const sp = r.sp ?? r.p ?? 0;
        const wins = r.s ?? r.w ?? 0;
        const losses = r.n ?? r.l ?? 0;
        return (
          <div
            key={r.pos}
            className="mdu-row-hover"
            style={{
              display: 'grid', gridTemplateColumns: colTemplate,
              padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
              gap: 6, position: 'relative', cursor: 'pointer',
            }}
          >
            <span style={{
              position: 'absolute', left: -8, top: 8, bottom: 8, width: 3, borderRadius: 2,
              background: statusColor(r.status),
            }} />
            <span style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
              color: r.pos <= 2 ? '#E8B84A' : '#F5F6FA',
            }}>{r.pos}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <TeamBadge initials={teamData.short.slice(0, 3)} color={teamData.color} size={26} />
              <span style={{ fontWeight: 700, color: '#F5F6FA', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.name ?? teamData.name}
              </span>
            </div>
            <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', color: '#C9CCD6' }}>{sp}</span>
            <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', color: '#5BE08C', fontWeight: 600 }}>{wins}</span>
            {showU && <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', color: '#9AA4B2' }}>{r.u ?? 0}</span>}
            <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', color: '#FF6B6B' }}>{losses}</span>
            <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', color: '#C9CCD6', fontSize: 11 }}>{r.legs}</span>
            <span style={{ textAlign: 'center', fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 600, color: diffColor(r.diff) }}>{r.diff}</span>
            <span style={{ textAlign: 'right', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: '#F5F6FA' }}>{r.pts}</span>
            {showForm && r.form && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <FormDots form={r.form} />
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 22, flexWrap: 'wrap' }}>
        {[
          { c: '#22C55E', t: 'Aufstiegsplatz' },
          { c: '#3B82F6', t: 'Playoff Platz' },
          { c: '#D40000', t: 'Abstiegsplatz' },
        ].map(x => (
          <div key={x.t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#C9CCD6' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: x.c, flexShrink: 0 }} />
            {x.t}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
