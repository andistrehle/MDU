import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { getPlayoffAwareLeagueGroupings, getCurrentSeason, } from '@/lib/data';
import { SaisonUmschalter, ArchivHinweis } from '@/components/mdu/saison-umschalter';
import { CaptainContact } from '@/components/mdu/captain-contact';

// ARCHIV Saison 2025/2026 (statische Daten, bis 30.09.2026 unter /teams).
export default function TeamsArchivPage() {
  const season = getCurrentSeason();
  const groups = getPlayoffAwareLeagueGroupings(season.id);

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/teams" />

      <PageBanner eyebrow={`${season.name} · Archiv`} title="Teams" boardRight="max(28px, calc(50vw - 612px))" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
        <SaisonUmschalter archiv neuHref="/teams" archivHref="/teams/2025-26" />
        <ArchivHinweis />

        {/* League groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {groups.map(({ league, teams }) => (
            <section key={league.id}>
              {/* League heading */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: league.color, flexShrink: 0 }} />
                <h2 style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26,
                  letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase',
                }}>
                  {league.name}
                </h2>
                <span style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)',
                  fontWeight: 600, marginLeft: 4,
                }}>
                  {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
                </span>
              </div>

              {teams.length === 0 ? (
                <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)', fontStyle: 'italic' }}>
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
                        href={`/teams/${team.id}?saison=2025-26`}
                        className="mdu-card-hover"
                        style={{
                          display: 'block', textDecoration: 'none',
                          background: 'var(--th-bg-card)',
                          border: `1px solid ${isInactive ? 'var(--th-line-3)' : 'var(--th-line-6)'}`,
                          borderRadius: 12,
                          padding: '16px 18px',
                          opacity: isInactive ? 0.5 : 1,
                        }}
                      >
                        {/* Team header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <TeamBadge initials={team.short.slice(0, 3)} color={team.color} size={40} logoUrl={team.logoUrl} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                              color: 'var(--th-text-strong)', letterSpacing: '0.03em', textTransform: 'uppercase',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {team.name}
                            </div>
                            {/* League label */}
                            <div style={{
                              fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                              letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2,
                              color: isInactive ? 'var(--th-accent)' : league.color,
                            }}>
                              {isInactive ? 'Zurückgezogen' : league.name}
                            </div>
                          </div>
                        </div>

                        {/* Details */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                            <Icon name="pin" size={12} stroke={2} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {venueName ?? 'Noch nicht verfügbar'}
                            </span>
                          </div>
                          <CaptainContact teamId={team.id} captainName={captainName} />
                        </div>

                        {/* Arrow hint */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          <Icon name="arrow-right" size={14} stroke={2} style={{ color: 'var(--th-text-faint)' }} />
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
