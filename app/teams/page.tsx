import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { PageBanner } from '@/components/mdu/page-banner';
import { Footer } from '@/components/mdu/footer';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Icon } from '@/components/mdu/icon';
import { getPlayoffAwareLeagueGroupings, getCurrentSeason, findLeague, findPlayer, getPlayerDisplayName } from '@/lib/data';
import { getActiveSeason, getSeasonTeams, type SeasonTeam } from '@/lib/server/season-data';
import { CaptainContact } from '@/components/mdu/captain-contact';

// Aktive Saison wird zur Laufzeit aus Supabase gelesen → nicht statisch
// vorrendern, damit der Admin-Saison-Switch ohne Redeploy greift.
export const dynamic = 'force-dynamic';

/** Kapitänsname aus einem Spieler-Slug (für die selbstverwaltete Saison). */
function captainNameFor(playerId: string | null): string | null {
  if (!playerId) return null;
  const p = findPlayer(playerId);
  return p ? getPlayerDisplayName(p) : null;
}

export default async function TeamsPage() {
  const active = await getActiveSeason();

  // Aktive Saison ist selbstverwaltet (aus Supabase) → Teams aus den
  // freigegebenen Anmeldungen. Archivierte/statische Saison → unten wie bisher.
  if (active.selfManaged) {
    const teams = await getSeasonTeams(active.id);
    return <SelfManagedTeams seasonName={active.name} teams={teams} />;
  }

  const season = getCurrentSeason();
  const groups = getPlayoffAwareLeagueGroupings(season.id);

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/teams" />

      <PageBanner eyebrow={season.name} title="Teams" />

      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 80px' }}>
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
                        href={`/teams/${team.id}`}
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

/** Teams-Übersicht für die selbstverwaltete (aktive) Saison aus Supabase. */
function SelfManagedTeams({ seasonName, teams }: { seasonName: string; teams: SeasonTeam[] }) {
  // Nach Liga gruppieren, nach Liga-Reihenfolge sortieren.
  const byLeague = new Map<string, SeasonTeam[]>();
  for (const t of teams) {
    const k = t.leagueId ?? '__none';
    if (!byLeague.has(k)) byLeague.set(k, []);
    byLeague.get(k)!.push(t);
  }
  const sections = [...byLeague.entries()]
    .map(([lid, ts]) => ({ league: lid === '__none' ? undefined : findLeague(lid), name: ts[0].leagueName ?? 'Noch keine Liga', teams: ts }))
    .sort((a, b) => (a.league?.sortOrder ?? 99) - (b.league?.sortOrder ?? 99));

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', position: 'relative', isolation: 'isolate' }}>
      <DesktopHeader activeHref="/teams" />
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 28px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8 }}>
            {seasonName}
          </div>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0, paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block' }}>
            Teams
          </h1>
        </div>

        {teams.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
            Für {seasonName} sind noch keine Mannschaften freigegeben.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {sections.map(({ league, name, teams: ts }) => {
              const color = league?.color ?? 'var(--th-accent)';
              return (
                <section key={name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <h2 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26, letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase' }}>{name}</h2>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontWeight: 600, marginLeft: 4 }}>{ts.length} {ts.length === 1 ? 'Team' : 'Teams'}</span>
                  </div>
                  <div className="mdu-league-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {ts.map(t => (
                      <Link key={t.teamId} href={`/teams/${t.teamId}`} className="mdu-card-hover" style={{ display: 'block', textDecoration: 'none', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                          <TeamBadge initials={(t.shortName ?? t.name).slice(0, 3)} color={typeof color === 'string' ? color : '#9AA4B2'} size={40} logoUrl={t.logoUrl ?? undefined} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-text-strong)', letterSpacing: '0.03em', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2, color: typeof color === 'string' ? color : 'var(--th-accent)' }}>{name}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>
                            <Icon name="pin" size={12} stroke={2} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.venueName ?? 'Noch nicht verfügbar'}</span>
                          </div>
                          <CaptainContact teamId={t.teamId} captainName={captainNameFor(t.captainPlayerId)} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                          <Icon name="arrow-right" size={14} stroke={2} style={{ color: 'var(--th-text-faint)' }} />
                        </div>
                      </Link>
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
