import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { getLeagueVenueGroupings, getCurrentSeason, getVenueFullAddress } from '@/lib/data';

export default function SpielstaettenPage() {
  const season  = getCurrentSeason();
  const groups  = getLeagueVenueGroupings(season.id);

  // Count venues that have real data (used to decide whether to show warning)
  const venueCount = groups
    .flatMap(g => g.venues)
    .filter(v => v.venue !== null).length;

  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/spielstaetten" />

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
            Spielstätten
          </h1>
        </div>

        {/* Warning — only shown when no venue data is available at all */}
        {venueCount === 0 && (
          <div style={{
            background: 'rgba(232,184,74,0.07)', border: '1px solid rgba(232,184,74,0.2)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 36,
            display: 'flex', alignItems: 'flex-start', gap: 12,
          }}>
            <Icon name="pin" size={16} stroke={2} style={{ color: '#E8B84A', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#E8B84A' }}>
                Spielstättendaten noch nicht verfügbar
              </div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2', marginTop: 4, lineHeight: 1.5 }}>
                Für {season.name} wurden noch keine Spielstätten veröffentlicht.
                Vollständige Informationen auf{' '}
                <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer" style={{ color: '#C9CCD6', textDecoration: 'underline' }}>
                  dartunion.de
                </a>.
              </div>
            </div>
          </div>
        )}

        {/* League sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {groups.map(({ league, venues }) => (
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
                  {venues.filter(v => v.venue !== null).length}{' '}
                  {venues.filter(v => v.venue !== null).length === 1 ? 'Spielstätte' : 'Spielstätten'}
                </span>
              </div>

              {venues.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6A6E7B', fontStyle: 'italic' }}>
                  Keine Teams für diese Liga in {season.name} eingetragen.
                </p>
              ) : (
                <div className="mdu-league-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: 12,
                }}>
                  {venues.map(({ venue, teams }) => {
                    const venueName    = venue?.name    ?? null;
                    const fullAddress  = venue ? getVenueFullAddress(venue) : null;

                    return (
                      <div
                        key={venue?.id ?? '__no-venue__'}
                        style={{
                          background: '#121821',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 12,
                          padding: '16px 18px',
                        }}
                      >
                        {/* Venue info */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                          <Icon
                            name="pin"
                            size={14}
                            stroke={2}
                            style={{ color: league.color, flexShrink: 0, marginTop: 3 }}
                          />
                          <div>
                            <div style={{
                              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
                              color: venueName ? '#F5F6FA' : '#6A6E7B',
                              fontStyle: venueName ? 'normal' : 'italic',
                            }}>
                              {venueName ?? 'Spielstätte noch nicht verfügbar'}
                            </div>
                            {fullAddress && (
                              <div style={{
                                fontFamily: 'var(--font-manrope)', fontSize: 12,
                                color: '#9AA4B2', marginTop: 3, lineHeight: 1.5,
                              }}>
                                {fullAddress}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 12 }} />

                        {/* Teams at this venue */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {teams.map(({ team, assignment }) => {
                            const isInactive = team.status === 'inactive';
                            return (
                              <Link
                                key={team.id}
                                href={`/teams/${team.id}`}
                                style={{
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 10,
                                  opacity: isInactive ? 0.5 : 1,
                                }}
                              >
                                <TeamBadge initials={team.short.slice(0, 3)} color={team.color} size={28} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                                    color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {team.name}
                                  </div>
                                  {isInactive && (
                                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, color: '#D40000', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                      Zurückgezogen
                                    </div>
                                  )}
                                  {assignment.captain && !isInactive && (
                                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', marginTop: 1 }}>
                                      TC: {assignment.captain}
                                    </div>
                                  )}
                                </div>
                                <Icon name="arrow-right" size={13} stroke={2} style={{ color: '#6A6E7B', flexShrink: 0 }} />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
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
