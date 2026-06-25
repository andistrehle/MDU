import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';
import { TeamDetailClient, type RosterEntry } from '@/components/mdu/team-detail-client';
import {
  findTeam, findLeague, findVenue,
  getTeamAssignment, getRankedRosterForTeam,
  getCurrentSeason, getStandings, getVenueFullAddress,
  getScheduledMatchesForTeam, getCompletedMatchesForTeam,
  getPlayerDisplayName, getCurrentCompetitionForTeam,
  getStatisticsForLeague,
} from '@/lib/data';
import { notFound } from 'next/navigation';
import { shade } from '@/lib/utils';
import { loadPublicTeamProfile } from '@/lib/supabase/profiles';
import { getActiveSeason, getSeasonTeam, getSeasonRoster } from '@/lib/server/season-data';
import { SeasonTeamView } from '@/components/mdu/season-team-view';

export default async function TeamProfilePage(props: PageProps<'/teams/[id]'>) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const staticTeam = findTeam(id);
  // Kein statisches Team → evtl. ein Team der aktiven, selbstverwalteten Saison
  // (aus Supabase, ohne statische Stammdaten). Archivierte Saisons nutzen die
  // reiche statische Teamseite unten.
  if (!staticTeam) {
    const active = await getActiveSeason();
    if (active.selfManaged) {
      const st = await getSeasonTeam(active.id, id);
      if (st) {
        const roster = await getSeasonRoster(active.id, id);
        return <SeasonTeamView seasonName={active.name} team={st} roster={roster} />;
      }
    }
    notFound();
  }
  const team = staticTeam;

  // Hochgeladene Team-Medien (Logo/Mannschaftsbild) — Fallback auf Stammdaten.
  const teamMedia = await loadPublicTeamProfile(team.id);
  const shownLogo = teamMedia.logoUrl ?? team.logoUrl ?? null;

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

  // ── Roster — ranked by performance, enriched with season stats ─
  const rankedRoster = getRankedRosterForTeam(team.id, season.id);
  const roster: RosterEntry[] = rankedRoster.map(({ player, isCaptain, teamName, stats: playerStats }) => ({
    playerId:      player.id,
    displayName:   getPlayerDisplayName(player),
    nickname:      player.nickname ?? null,
    licenseNumber: player.licenseNumber ?? null,
    isCaptain,
    photoUrl:      player.photoUrl,
    teamName,
    stats:         playerStats,
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
    <div style={{ background: 'var(--th-bg-deep)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/teams" />

      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, ${shade(team.color, -0.55)}22 0%, var(--th-bg-deep) 100%), var(--th-bg-deep)`,
        borderBottom: '1px solid var(--th-line-6)',
      }}>
        <div aria-hidden className="mdu-banner-dartboard" style={{
          position: 'absolute', right: -220, top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 680, pointerEvents: 'none', opacity: 0.5,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        }}>
          <Image src="/mdu-hero-dartboard-2.webp"
            unoptimized alt="" width={680} height={680}
            style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 20% 50%, ${team.color}20, transparent 50%)`,
        }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, var(--th-bg-deep) 35%, var(--th-veil-40) 65%, var(--th-veil-70))',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 32px 30px', position: 'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-dim)', marginBottom: 24 }}>
            <Link href="/" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/teams" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Teams</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: 'var(--th-text-strong)' }}>{team.name}</span>
          </div>

          {/* Team identity */}
          <div className="mdu-team-hero-flex" style={{ display: 'flex', alignItems: 'flex-end', gap: 30 }}>
            <div className="mdu-team-logo" style={{
              width: 144, height: 144, borderRadius: '24%', flexShrink: 0,
              background: shownLogo ? 'var(--th-text-strong)' : `linear-gradient(135deg, ${team.color}, ${shade(team.color, -0.5)})`,
              border: '2px solid var(--th-gold)',
              boxShadow: `0 24px 60px ${team.color}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, color: 'var(--th-text-strong)',
            }}>
              {shownLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownLogo} alt={team.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              ) : (
                team.short
              )}
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
                lineHeight: 0.9, letterSpacing: '-0.005em', color: 'var(--th-text-strong)',
                margin: 0, textTransform: 'uppercase',
              }}>
                {team.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)' }}>
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
            background: 'var(--th-line-6)', border: '1px solid var(--th-line-6)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { n: teamStanding ? `${teamStanding.pos}.` : '—', l: 'Tabellenplatz', c: teamStanding?.pos === 1 ? 'var(--th-gold)' : undefined },
              { n: teamStanding ? String(teamStanding.sp) : '—', l: 'Spiele' },
              { n: teamStanding ? String(teamStanding.s)  : '—', l: 'Siege' },
              { n: teamStanding ? String(teamStanding.u)  : '—', l: 'Unentschieden' },
              { n: teamStanding ? String(teamStanding.n)  : '—', l: 'Niederlagen' },
              { n: teamStanding ? String(teamStanding.pts) : '—', l: 'Punkte' },
            ].map((s, i) => (
              <div key={i} className="mdu-kpi-cell" style={{ background: 'var(--th-bg-card3)', padding: '18px 18px' }}>
                <div style={{
                  fontFamily: 'var(--font-saira-condensed)',
                  fontWeight: 900, fontSize: 32,
                  color: s.c ?? 'var(--th-text-strong)', lineHeight: 1,
                }}>
                  {s.n}
                </div>
                <div style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.16em', color: 'var(--th-text-dim)', textTransform: 'uppercase', marginTop: 8,
                }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mannschaftsbild (nur wenn hochgeladen) */}
      {teamMedia.teamImageUrl && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={teamMedia.teamImageUrl} alt={`Mannschaftsbild ${team.name}`}
            style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 16, border: '1px solid var(--th-line-6)', display: 'block' }} />
        </div>
      )}

      {/* Interactive tabs + content */}
      <TeamDetailClient
        teamId={team.id}
        teamColor={team.color}
        seasonId={season.id}
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
