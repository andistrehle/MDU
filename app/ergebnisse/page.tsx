import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { getCompletedMatchesByLeague, formatMatchDate } from '@/lib/data/matches';
import { getExtendedTeam, findLeague } from '@/lib/data';

/** Canonical league display order */
const LEAGUE_ORDER = [
  'playoffs-a-aufstieg', 'playoffs-a-abstieg',
  'playoffs-b-aufstieg', 'playoffs-b-abstieg',
  'la', 'a1', 'a2', 'b1', 'b2', 'c',
  'pokal-2026',
];

export default function ErgebnissePage() {
  const rawGroups = getCompletedMatchesByLeague();

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
      <DesktopHeader activeHref="/ergebnisse" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Letzte Spieltage
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block',
          }}>
            Ergebnisse
          </h1>
        </div>

        {totalCount === 0 ? (
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6A6E7B',
            fontStyle: 'italic', padding: '24px 0',
          }}>
            Noch keine Ergebnisse eingetragen — aktuelle Ergebnisse auf{' '}
            <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
              style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {groups.map(({ leagueId, matches }) => {
              const league = findLeague(leagueId);
              const leagueName  = league?.name  ?? leagueId.toUpperCase();
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
                      {matches.length} {matches.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
                    </span>
                  </div>

                  {/* Desktop table */}
                  <div className="mdu-desktop-only mdu-table-scroll" style={{ maxWidth: 900 }}>
                    <div style={{
                      background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 14,
                    }}>
                      {/* Header */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '90px 1fr 100px 1fr',
                        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                        letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase', gap: 12,
                      }}>
                        <span>Datum</span>
                        <span style={{ textAlign: 'right' }}>Heim</span>
                        <span style={{ textAlign: 'center' }}>Ergebnis</span>
                        <span>Auswärts</span>
                      </div>

                      {matches.map((m, i) => {
                        const home = getExtendedTeam(m.homeTeamId);
                        const away = getExtendedTeam(m.awayTeamId);
                        return (
                          <div key={m.id} className="mdu-row-hover" style={{
                            display: 'grid', gridTemplateColumns: '90px 1fr 100px 1fr',
                            padding: '14px 20px',
                            borderBottom: i < matches.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                            alignItems: 'center', gap: 12,
                          }}>
                            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: '#9AA4B2' }}>
                              {formatMatchDate(m.date)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{home.name}</span>
                              <TeamBadge initials={home.short.slice(0, 3)} color={home.color} size={28} />
                            </div>
                            <div style={{
                              textAlign: 'center',
                              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
                              color: '#F5F6FA', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 0',
                            }}>
                              {m.result ? `${m.result.home}:${m.result.away}` : '—'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <TeamBadge initials={away.short.slice(0, 3)} color={away.color} size={28} />
                              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{away.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile stacked cards */}
                  <div className="mdu-mobile-only">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {matches.map(m => {
                        const home = getExtendedTeam(m.homeTeamId);
                        const away = getExtendedTeam(m.awayTeamId);
                        return (
                          <div key={m.id} style={{
                            background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12, padding: '14px 16px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', color: leagueColor, textTransform: 'uppercase' }}>{leagueName}</span>
                              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>{formatMatchDate(m.date)}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', alignItems: 'center', gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <TeamBadge initials={home.short.slice(0, 3)} color={home.color} size={28} />
                                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{home.name}</span>
                              </div>
                              <div style={{ textAlign: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: '#F5F6FA', background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 0' }}>
                                {m.result ? `${m.result.home}:${m.result.away}` : '—'}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
                                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, textAlign: 'right' }}>{away.name}</span>
                                <TeamBadge initials={away.short.slice(0, 3)} color={away.color} size={28} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
