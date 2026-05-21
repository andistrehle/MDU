import { TeamBadge } from './team-badge';
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
      className="mdu-card-hover"
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: '#121821',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
        letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase',
        marginBottom: compact ? 10 : 12,
      }}>
        {league}
      </div>

      {compact ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#F5F6FA', fontWeight: 600 }}>
              {date} <span style={{ color: '#9AA4B2' }}>· {time}</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} size={26} />
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#F5F6FA' }}>{homeTeam.name}</span>
            </div>
            <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 13, color: '#9AA4B2' }}>VS</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#F5F6FA' }}>{awayTeam.name}</span>
              <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} size={26} />
            </div>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--font-manrope)', fontSize: 10, color: '#9AA4B2', textAlign: 'right' }}>{venue}</div>
        </div>
      ) : (
        <div className="mdu-match-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr auto 1.4fr auto', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} size={38} />
            <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{homeTeam.name}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: '#9AA4B2', letterSpacing: '0.06em', flexShrink: 0 }}>VS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{awayTeam.name}</span>
            <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} size={38} />
          </div>
          <div className="mdu-match-grid-date" style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#F5F6FA', fontWeight: 600 }}>{date}</div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#F5F6FA' }}>{time}</div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginTop: 2 }}>{venue}</div>
          </div>
        </div>
      )}
    </div>
  );
}
