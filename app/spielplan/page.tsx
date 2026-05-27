import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { MatchCard } from '@/components/mdu/match-card';
import { getScheduledMatchesByLeague, formatScheduledDate } from '@/lib/data/matches';
import { findLeague, LEAGUES, getVenueForTeamInSeason } from '@/lib/data';

/** Canonical league display order for the Spielplan grouping */
const LEAGUE_ORDER = [
  'playoffs-a-aufstieg', 'playoffs-a-abstieg',
  'playoffs-b-aufstieg', 'playoffs-b-abstieg',
  'la', 'a1', 'a2', 'b1', 'b2', 'c',
  'pokal-2026',
];

export default function SpielplanPage() {
  const rawGroups = getScheduledMatchesByLeague();

  // Sort groups by canonical league order; unknown leagues go last
  const groups = [...rawGroups].sort((a, b) => {
    const ia = LEAGUE_ORDER.indexOf(a.leagueId);
    const ib = LEAGUE_ORDER.indexOf(b.leagueId);
    if (ia === -1 && ib === -1) return a.leagueId.localeCompare(b.leagueId);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const totalCount = groups.reduce((s, g) => s + g.matches.length, 0);

  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/spielplan" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Liga-Kalender
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block',
          }}>
            Spielplan
          </h1>
        </div>

        {totalCount === 0 ? (
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6A6E7B',
            fontStyle: 'italic', padding: '24px 0',
          }}>
            Keine bevorstehenden Spiele — vollständiger Spielplan auf{' '}
            <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
              style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {groups.map(({ leagueId, matches }) => {
              const league = findLeague(leagueId);
              const leagueName = league?.name ?? leagueId.toUpperCase();
              const leagueColor = league?.color ?? '#D40000';

              return (
                <section key={leagueId}>
                  {/* League heading */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 24, borderRadius: 2, background: leagueColor, flexShrink: 0 }} />
                    <h2 style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
                      letterSpacing: '0.06em', color: '#F5F6FA', margin: 0, textTransform: 'uppercase',
                    }}>
                      {leagueName}
                    </h2>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', fontWeight: 600 }}>
                      {matches.length} {matches.length === 1 ? 'Spiel' : 'Spiele'}
                    </span>
                  </div>

                  {/* Match cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800 }}>
                    {matches.map(m => (
                      <MatchCard
                        key={m.id}
                        league={leagueName + (m.matchday ? ` · Spieltag ${m.matchday}` : '')}
                        home={m.homeTeamId}
                        away={m.awayTeamId}
                        date={formatScheduledDate(m.date)}
                        time={m.time ?? '—'}
                        venue={getVenueForTeamInSeason(m.homeTeamId, 'season-2026')?.name ?? 'Noch nicht verfügbar'}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
