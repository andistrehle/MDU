import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';
import { TeamDetailClient, type RosterEntry } from '@/components/mdu/team-detail-client';
import {
  TEAMS, findTeam, findLeague, findVenue,
  getTeamAssignment, getPlayersForTeamInSeason,
  getCurrentSeason, getStandings, getVenueFullAddress,
  getScheduledMatchesForTeam, getCompletedMatchesForTeam,
  getPlayerDisplayName, getCurrentCompetitionForTeam,
  getStatisticsForLeague,
} from '@/lib/data';
import { shade } from '@/lib/utils';

export default async function TeamProfilePage(props: PageProps<'/teams/[id]'>) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const team = findTeam(id) ?? TEAMS[0];

  // ── Season ───────────────────────────────────────────────────
  const season = getCurrentSeason();

  // ── Current competition: playoff > regular, or URL override ──
  // Allows navigating from /ligen/playoffs-b-aufstieg with ?competition=playoffs-b-aufstieg
  // so the profile reflects the competition the user just came from.
  const competitionParam = typeof searchParams?.competition === 'string'
    ? searchParams.competition
    : null;

  let competition = getCurrentCompetitionForTeam(team.id, season.id);

  // Apply URL override only if that competition actually contains this team
  if (competitionParam) {
    const overrideRows    = getStandings(competitionParam);
    const overrideRow     = overrideRows.find(r => r.team === team.id) ?? null;
    if (overrideRow) {
      const overrideLeague = findLeague(competitionParam);
      competition = {
        leagueId:  competitionParam,
        league:    overrideLeague,
        standing:  overrideRow,
        isPlayoff: competitionParam.startsWith('playoffs-'),
      };
    }
  }

  const { leagueId: currentLeagueId, league: teamLeague, standing: teamStanding } = competition;

  // ── Regular-season assignment (for venue + captain data) ─────
  const assignment   = getTeamAssignment(team.id, season.id);
  const venue        = assignment?.venueId ? findVenue(assignment.venueId) : undefined;

  const leagueLabel  = teamLeague?.name ?? 'Noch nicht verfügbar';
  const venueLabel   = venue?.name ?? 'Noch nicht verfügbar';
  const venueAddress = venue ? getVenueFullAddress(venue) : '';
  const captainLabel = assignment?.captain ?? 'Noch nicht verfügbar';

  // ── Statistics for current competition ───────────────────────
  const stats = getStatisticsForLeague(currentLeagueId);

  // ── Roster ───────────────────────────────────────────────────
  const playersWithAssignments = getPlayersForTeamInSeason(team.id, season.id);
  const roster: RosterEntry[] = playersWithAssignments.map(({ player, assignment: pa }) => ({
    displayName:   getPlayerDisplayName(player),
    licenseNumber: player.licenseNumber ?? null,
    isCaptain:     pa.isCaptain ?? false,
  }));

  // ── Team-specific matches, filtered to current competition ───
  const allScheduled = getScheduledMatchesForTeam(team.id);
  const allCompleted = getCompletedMatchesForTeam(team.id);

  // Filter to current competition; fall back to all matches if none found
  const filteredScheduled = currentLeagueId
    ? allScheduled.filter(m => m.leagueId === currentLeagueId)
    : allScheduled;
  const filteredCompleted = currentLeagueId
    ? allCompleted.filter(m => m.leagueId === currentLeagueId)
    : allCompleted;

  const scheduledMatches = filteredScheduled.length > 0 ? filteredScheduled : allScheduled;
  const completedMatches = filteredCompleted.length > 0 ? filteredCompleted : allCompleted;

  return (
    <div style={{ background: '#0A0B0F', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/teams" />

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, ${shade(team.color, -0.55)}22 0%, #0A0B0F 100%), #0A0B0F`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -220, top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 680, pointerEvents: 'none', opacity: 0.5,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        }}>
          <Image src="/mdu-hero-dartboard-2.png" alt="" width={680} height={680}
            style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 20% 50%, ${team.color}20, transparent 50%)`,
        }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, #0A0B0F 35%, rgba(10,11,15,0.4) 65%, rgba(10,11,15,0.75))',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 32px 30px', position: 'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C', marginBottom: 24 }}>
            <Link href="/" style={{ color: '#8A8F9C', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/teams" style={{ color: '#8A8F9C', textDecoration: 'none' }}>Teams</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: '#F5F6FA' }}>{team.name}</span>
          </div>

          {/* Team identity */}
          <div className="mdu-team-hero-flex" style={{ display: 'flex', alignItems: 'flex-end', gap: 30 }}>
            <div className="mdu-team-logo" style={{
              width: 144, height: 144, borderRadius: '24%', flexShrink: 0,
              background: `linear-gradient(135deg, ${team.color}, ${shade(team.color, -0.5)})`,
              border: '2px solid #E8B84A',
              boxShadow: `0 24px 60px ${team.color}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, color: '#F5F6FA',
            }}>
              {team.short}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {teamLeague && <Pill tone="red">{leagueLabel}</Pill>}
                {teamStanding?.pos === 1 && <Pill tone="gold">Tabellenführer</Pill>}
                {teamStanding && teamStanding.status === 'promo' && teamStanding.pos > 1 && <Pill tone="blue">Aufstiegsplatz</Pill>}
                {teamStanding?.status === 'releg' && <Pill tone="neutral">Abstiegsplatz</Pill>}
                {team.status === 'inactive' && <Pill tone="neutral">Zurückgezogen</Pill>}
              </div>
              <h1 className="mdu-team-name" style={{
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 72,
                lineHeight: 0.9, letterSpacing: '-0.005em', color: '#F5F6FA',
                margin: 0, textTransform: 'uppercase',
              }}>
                {team.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: '#C9CCD6' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="pin" size={14} stroke={2} /> {venueLabel}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="trophy" size={14} stroke={2} /> {leagueLabel}
                </span>
                {teamStanding && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="bar" size={14} stroke={2} /> Platz {teamStanding.pos} · {teamStanding.pts} Pkt.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mdu-kpi-strip" style={{
            marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { n: teamStanding ? `${teamStanding.pos}.` : '—', l: 'Tabellenplatz', c: teamStanding?.pos === 1 ? '#E8B84A' : undefined },
              { n: teamStanding ? String(teamStanding.sp) : '—', l: 'Spiele' },
              { n: teamStanding ? String(teamStanding.s)  : '—', l: 'Siege' },
              { n: teamStanding ? String(teamStanding.n)  : '—', l: 'Niederlagen' },
              { n: teamStanding?.legs ?? '—',                     l: 'Legs', mono: true },
              { n: teamStanding ? String(teamStanding.pts) : '—', l: 'Punkte' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#14161E', padding: '18px 18px' }}>
                <div style={{
                  fontFamily: s.mono ? 'var(--font-jetbrains-mono)' : 'var(--font-saira-condensed)',
                  fontWeight: 900, fontSize: s.mono ? 22 : 32,
                  color: s.c ?? '#F5F6FA', lineHeight: 1,
                }}>
                  {s.n}
                </div>
                <div style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.2em', color: '#8A8F9C', textTransform: 'uppercase', marginTop: 8,
                }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive tabs + content */}
      <TeamDetailClient
        teamId={team.id}
        teamColor={team.color}
        seasonName={season.name}
        leagueName={leagueLabel}
        leagueId={currentLeagueId}
        captainLabel={captainLabel}
        venueName={venueLabel}
        venueAddress={venueAddress}
        standing={teamStanding}
        roster={roster}
        scheduledMatches={scheduledMatches}
        completedMatches={completedMatches}
        stats={stats}
      />

      <Footer />
    </div>
  );
}
