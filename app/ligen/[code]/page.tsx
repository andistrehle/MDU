import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { LeagueDetailClient } from '@/components/mdu/league-detail-client';
import { type TeamInfo } from '@/components/mdu/league-standings-panel';
import { Icon } from '@/components/mdu/icon';
import {
  findLeague, getStandings,
  getCurrentSeason, getTeamAssignment, findVenue, getVenueFullAddress,
  getStatisticsForLeague, getMatchesForLeague,
} from '@/lib/data';

export default async function LeagueDetailPage(props: PageProps<'/ligen/[code]'>) {
  const { code } = await props.params;
  const league    = findLeague(code);
  const leagueName = league?.name ?? `${code.toUpperCase()} Liga`;
  const standings  = getStandings(code);

  // Pre-compute team info (captain + venue) for every team in this competition.
  const season = getCurrentSeason();
  const teamInfoMap: Record<string, TeamInfo> = {};
  for (const row of standings) {
    const assignment  = getTeamAssignment(row.team, season.id);
    const venue       = assignment?.venueId ? findVenue(assignment.venueId) : undefined;
    teamInfoMap[row.team] = {
      captain:      assignment?.captain      ?? 'Noch nicht verfügbar',
      venueName:    venue?.name              ?? 'Noch nicht verfügbar',
      venueAddress: venue ? getVenueFullAddress(venue) : '',
    };
  }

  // Serialisable league shape passed to client components
  const leagueShape = {
    id:     league?.id     ?? code,
    name:   leagueName,
    color:  league?.color  ?? '#D40000',
    season: league?.season ?? '2026',
    type:   league?.type,
  } as const;

  // Player statistics for this league
  const stats = getStatisticsForLeague(code);

  // All matches for this league (scheduled + completed) from matches.ts
  const matches = getMatchesForLeague(code);

  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/ligen" />

      {/* Banner — title + breadcrumb only (tab bar lives in LeagueDetailClient) */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #0D1117 0%, #05070A 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -260, top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 680, pointerEvents: 'none', opacity: 0.7,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        }}>
          <Image src="/mdu-hero-dartboard-2.png" alt="" width={680} height={680}
            style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, #05070A 30%, rgba(5,7,10,0.4) 65%, rgba(5,7,10,0.7))',
        }} />

        <div className="mdu-section-pad" style={{
          maxWidth: 1280, margin: '0 auto', padding: '34px 28px 24px', position: 'relative', zIndex: 2,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2', marginBottom: 16,
          }}>
            <Link href="/" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/ligen" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Ligen</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: '#F5F6FA' }}>{leagueName}</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, lineHeight: 0.92,
            letterSpacing: '-0.005em', color: '#FFFFFF', margin: 0, textTransform: 'uppercase',
            paddingBottom: 14, borderBottom: `3px solid ${league?.color ?? '#D40000'}`, display: 'inline-block',
          }}>
            {leagueName}
          </h1>
        </div>
      </div>

      {/* Interactive tabs + tab content */}
      <LeagueDetailClient
        rows={standings}
        league={leagueShape}
        teamInfoMap={teamInfoMap}
        stats={stats}
        matches={matches}
      />

      <Footer />
    </div>
  );
}
