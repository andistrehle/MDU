import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { getExtendedTeam } from '@/lib/data';

interface MatchCardProps {
  league: string;
  home: string;
  away: string;
  date: string;
  time: string;
  venue: string;
  compact?: boolean;
}

export function MatchCard({ league, home, away, date, time, venue, compact = false }: MatchCardProps) {
  const homeTeam = getExtendedTeam(home);
  const awayTeam = getExtendedTeam(away);

  return (
    <div
      className="mdu-card-hover mdu-match-card"
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: 'var(--th-bg-card)',
        border: '1px solid var(--th-line-6)',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
        letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase',
        marginBottom: compact ? 10 : 12,
      }}>
        {league}
      </div>

      {compact ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-strong)', fontWeight: 600 }}>
              {date} <span style={{ color: 'var(--th-text-muted)' }}>· {time}</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
            <TeamLink teamId={home} teamName={homeTeam.name} style={{ display: 'flex', width: '100%', gap: 8 }}>
              <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} logoUrl={homeTeam.logoUrl} size={26} />
              <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam.name}</span>
            </TeamLink>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 13, color: 'var(--th-text-muted)' }}>VS</span>
            <TeamLink teamId={away} teamName={awayTeam.name} style={{ display: 'flex', width: '100%', gap: 8, justifyContent: 'flex-end' }}>
              <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayTeam.name}</span>
              <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} logoUrl={awayTeam.logoUrl} size={26} />
            </TeamLink>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-manrope)', fontSize: 10, color: 'var(--th-text-muted)', textAlign: 'right' }}>{venue}</div>
        </div>
      ) : (
        <>
          {/* Desktop layout */}
          <div className="mdu-desktop-only" style={{ display: 'grid', gridTemplateColumns: '1.4fr auto 1.4fr auto', alignItems: 'center', gap: 16 }}>
            <TeamLink teamId={home} teamName={homeTeam.name} style={{ display: 'flex', width: '100%', gap: 12, minWidth: 0 }}>
              <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} logoUrl={homeTeam.logoUrl} size={38} />
              <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam.name}</span>
            </TeamLink>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-text-muted)', letterSpacing: '0.06em', flexShrink: 0 }}>VS</span>
            <TeamLink teamId={away} teamName={awayTeam.name} style={{ display: 'flex', width: '100%', gap: 12, minWidth: 0 }}>
              <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayTeam.name}</span>
              <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} logoUrl={awayTeam.logoUrl} size={38} />
            </TeamLink>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-strong)', fontWeight: 600 }}>{date}</div>
              <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-strong)' }}>{time}</div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)', marginTop: 2 }}>{venue}</div>
            </div>
          </div>

          {/* Mobile layout — compact 2-row */}
          <div className="mdu-mobile-only">
            {/* Teams row: Home vs Away side-by-side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <TeamLink teamId={home} teamName={homeTeam.name} style={{ display: 'flex', width: '100%', gap: 6, minWidth: 0 }}>
                <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} logoUrl={homeTeam.logoUrl} size={24} />
                <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam.name}</span>
              </TeamLink>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 11, color: 'var(--th-text-faint)', padding: '0 2px', flexShrink: 0 }}>vs</span>
              <TeamLink teamId={away} teamName={awayTeam.name} style={{ display: 'flex', width: '100%', gap: 6, justifyContent: 'flex-end', minWidth: 0 }}>
                <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayTeam.name}</span>
                <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} logoUrl={awayTeam.logoUrl} size={24} />
              </TeamLink>
            </div>
            {/* Meta row: date · time · venue */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--th-text-muted)', fontWeight: 600 }}>{date}</span>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--th-text-faint)' }}>· {time}</span>
              {venue && <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, color: 'var(--th-text-faint)' }}>· {venue}</span>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
