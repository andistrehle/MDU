import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { getLeagueGroupings, getCurrentSeason } from '@/lib/data';

export default function TeamsPage() {
  const season = getCurrentSeason();
  const groups = getLeagueGroupings(season.id);

  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/teams" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8 }}>
            {season.name}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block',
          }}>
            Teams
          </h1>
        </div>

        {/* League groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {groups.map(({ league, teams }) => (
            <section key={league.id}>
              {/* League heading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: league.color, flexShrink: 0 }} />
                <h2 style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26,
                  letterSpacing: '0.06em', color: '#F5F6FA', margin: 0, textTransform: 'uppercase',
                }}>
                  {league.name}
                </h2>
                <span style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B',
                  fontWeight: 600, marginLeft: 4,
                }}>
                  {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
                </span>
              </div>

              {teams.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6A6E7B', fontStyle: 'italic' }}>
                  Keine Teams für diese Liga in {season.name} eingetragen.
                </p>
              ) : (
                <div className="mdu-league-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: 12,
                }}>
                  {teams.map(({ team, assignment, venue }) => {
                    const venueName   = venue?.name ?? null;
                    const captainName = assignment.captain ?? null;
                    const isInactive  = team.status === 'inactive';

                    return (
                      <Link
                        key={team.id}
                        href={`/teams/${team.id}`}
                        className="mdu-card-hover"
                        style={{
                          display: 'block', textDecoration: 'none',
                          background: '#121821',
                          border: `1px solid ${isInactive ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 12,
                          padding: '16px 18px',
                          opacity: isInactive ? 0.5 : 1,
                        }}
                      >
                        {/* Team header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <TeamBadge initials={team.short.slice(0, 3)} color={team.color} size={40} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                              color: '#F5F6FA', letterSpacing: '0.03em', textTransform: 'uppercase',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {team.name}
                            </div>
                            {/* League label */}
                            <div style={{
                              fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                              letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2,
                              color: isInactive ? '#D40000' : league.color,
                            }}>
                              {isInactive ? 'Zurückgezogen' : league.name}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>
                            <Icon name="pin" size={12} stroke={2} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {venueName ?? 'Noch nicht verfügbar'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>
                            <Icon name="user" size={12} stroke={2} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {captainName ? `TC: ${captainName}` : 'Noch nicht verfügbar'}
                            </span>
                          </div>
                        </div>

                        {/* Arrow hint */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          <Icon name="arrow-right" size={14} stroke={2} style={{ color: '#6A6E7B' }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
