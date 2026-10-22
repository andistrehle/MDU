import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Pill } from '@/components/mdu/pill';
import { TeamDetailClient, type RosterEntry } from '@/components/mdu/team-detail-client';
import {
  findTeam, findLeague, findVenue,
  getTeamAssignment, getRankedRosterForTeam,
  getCurrentSeason, getStandings, getVenueFullAddress,
  getScheduledMatchesForTeam, getCompletedMatchesForTeam,
  getPlayerDisplayName, getCurrentCompetitionForTeam,
  getStatisticsForLeague, findPlayer,
} from '@/lib/data';
import { notFound } from 'next/navigation';
import { loadPublicTeamProfile, loadPublicPlayerPhotos } from '@/lib/supabase/profiles';
import { getActiveSeason, getSeasonTeam, getSeasonRoster, getDbRosterForTeam, getAnySeasonTeamView } from '@/lib/server/season-data';
import { SeasonTeamView } from '@/components/mdu/season-team-view';
import { getRowOutcome } from '@/lib/data/competition-outcomes';
import { SaisonUmschalter, VorlaeufigHinweis } from '@/components/mdu/saison-umschalter';
import { TeamSpielplan27 } from '@/components/mdu/spielplan-27';
import { ladeErgebnisse27, ladeEinzel27, tabelle27 } from '@/lib/server/ergebnisse-2027';
import { TeamHero, Mannschaftsbild } from '@/components/mdu/team-hero';
import { TeamTabs } from '@/components/mdu/team-tabs';
import { Uebersicht27, Kader27, Statistik27, type Kader27Eintrag } from '@/components/mdu/team-27';
import { team27, findLiga27, venue27, istArchivParam, NEUE_SAISON, ARCHIV_SAISON } from '@/lib/data/saison-2027';

export default async function TeamProfilePage(props: PageProps<'/teams/[id]'>) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;

  const staticTeam = findTeam(id);
  const t27 = team27(id);
  const archiv = istArchivParam(searchParams?.saison);
  const archivHref = `/teams/${id}?saison=${ARCHIV_SAISON.slug}`;

  // Saison 2026/2027 (Standard): Team + Kader live aus der DB, dazu der
  // vorläufige Spielplan. Die statische Teamseite unten ist das Archiv 2025/26
  // (?saison=2025-26, und für Teams, die 2026/27 nicht mehr melden).
  if (t27 && !archiv) {
    const st = await getSeasonTeam(NEUE_SAISON.id, id);
    if (st) {
      const [roster, { byKey: ergebnisse }, tabelle, einzel, media] = await Promise.all([
        getSeasonRoster(NEUE_SAISON.id, id), ladeErgebnisse27(), tabelle27(t27.league), ladeEinzel27(), loadPublicTeamProfile(id),
      ]);
      const fotos = await loadPublicPlayerPhotos(roster.map(p => p.playerId).filter((x): x is string => !!x));
      const liga = findLiga27(t27.league);
      const ligaName = liga?.name ?? st.leagueName ?? 'Liga folgt';
      const ligaHref = `/ligen/${t27.league}`;
      const venue = venue27(t27.venueId);
      const zeile = tabelle.find(z => z.team === id) ?? null;
      const gespielt = zeile && zeile.sp > 0 ? zeile : null;
      const captain = roster.find(p => p.isCaptain);
      const captainName = captain ? `${captain.firstName} ${captain.lastName}`.trim() : null;

      // Kader: nach der Einzelrangliste, wer noch nicht gespielt hat dahinter
      // (TC zuerst, dann nach Nachname). Bild: Profilbild mit Einwilligung,
      // sonst das aus den Stammdaten.
      const kader: Kader27Eintrag[] = roster.map(p => ({
        playerId: p.playerId,
        name: `${p.firstName} ${p.lastName}`.trim(),
        licenseNumber: p.licenseNumber,
        isCaptain: p.isCaptain,
        neu: p.status === 'pending_review',
        photoUrl: (p.playerId && (fotos.get(p.playerId) ?? findPlayer(p.playerId)?.photoUrl)) || null,
        stats: (p.playerId && einzel.byPlayer[p.playerId]) || null,
      }));
      const nachname = (k: Kader27Eintrag) => k.name.split(' ').slice(-1)[0] ?? '';
      kader.sort((a, b) => (a.stats && b.stats) ? a.stats.pos - b.stats.pos
        : a.stats ? -1 : b.stats ? 1
        : (Number(b.isCaptain) - Number(a.isCaptain)) || nachname(a).localeCompare(nachname(b), 'de'));

      return (
        <div style={{ background: 'var(--th-bg-deep)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
          <DesktopHeader activeHref="/teams" />
          <TeamHero
            name={t27.name}
            short={t27.short}
            color={t27.color}
            logoUrl={media.logoUrl ?? st.logoUrl ?? t27.logoUrl}
            umschalter={staticTeam
              ? <SaisonUmschalter archiv={false} neuHref={`/teams/${id}`} archivHref={archivHref} style={{ marginTop: -8 }} />
              : undefined}
            pills={<>
              <Pill tone="red">{ligaName}</Pill>
              {gespielt?.pos === 1 && <Pill tone="gold">Tabellenführer</Pill>}
            </>}
            infos={[
              { icon: 'pin', text: venue?.name ?? st.venueName ?? 'Spielort folgt' },
              { icon: 'trophy', text: ligaName },
              ...(gespielt ? [{ icon: 'bar' as const, text: `Platz ${gespielt.pos} · ${gespielt.pts} Pkt.` }] : []),
            ]}
            kpis={[
              { n: gespielt ? `${gespielt.pos}.` : '—', l: 'Tabellenplatz', c: gespielt?.pos === 1 ? 'var(--th-gold)' : undefined },
              { n: String(zeile?.sp ?? 0), l: 'Spiele' },
              { n: String(zeile?.s ?? 0), l: 'Siege' },
              { n: String(zeile?.u ?? 0), l: 'Unentschieden' },
              { n: String(zeile?.n ?? 0), l: 'Niederlagen' },
              { n: String(zeile?.pts ?? 0), l: 'Punkte' },
            ]}
          />
          <Mannschaftsbild url={media.teamImageUrl} name={t27.name} />
          <TeamTabs color={t27.color} tabs={[
            { label: 'Übersicht', content: (
              <Uebersicht27 teamId={id} color={t27.color} seasonName={NEUE_SAISON.name} ligaName={ligaName} ligaHref={ligaHref}
                venueName={venue?.name ?? st.venueName} venueAddress={venue?.address ?? null} captain={captainName}
                zeile={zeile} ergebnisse={ergebnisse} />
            ) },
            { label: 'Kader', content: <Kader27 kader={kader} color={t27.color} /> },
            { label: 'Spielplan', content: (
              <>
                <VorlaeufigHinweis style={{ marginBottom: 14, fontSize: 12.5 }} />
                <TeamSpielplan27 teamId={id} ergebnisse={ergebnisse} nur="offen" leer="Keine offenen Spiele mehr in dieser Saison." />
              </>
            ) },
            { label: 'Ergebnisse', content: (
              <TeamSpielplan27 teamId={id} ergebnisse={ergebnisse} nur="gespielt" leer="Noch keine Ergebnisse — sie erscheinen hier, sobald ein Spielbericht eingereicht ist." />
            ) },
            { label: 'Statistik', content: (
              <Statistik27 spieler={einzel.jeLiga[t27.league].filter(z => z.teamId === id)} color={t27.color} />
            ) },
          ]} />
          <Footer />
        </div>
      );
    }
  }

  // Kein statisches Team → evtl. ein Team der aktiven, selbstverwalteten Saison
  // (aus Supabase, ohne statische Stammdaten). Archivierte Saisons nutzen die
  // reiche statische Teamseite unten.
  if (!staticTeam) {
    // 1) Team in der aktiven (selbstverwalteten) Saison?
    const active = await getActiveSeason();
    if (active.selfManaged) {
      const st = await getSeasonTeam(active.id, id);
      if (st) {
        const roster = await getSeasonRoster(active.id, id);
        return <SeasonTeamView seasonName={active.name} team={st} roster={roster} />;
      }
    }
    // 2) Sonst: neueste freigegebene Saison dieses Teams (z. B. 2026/2027, bevor
    //    die Saison aktiv geschaltet ist) — damit neue Teams schon ein Profil haben.
    const any = await getAnySeasonTeamView(id);
    if (any) return <SeasonTeamView seasonName={any.seasonName} team={any.team} roster={any.roster} />;
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

  // Abschluss-/Playoff-Markierung des Teams (zentrale Config) für die Pills.
  const teamOutcome = teamStanding && currentLeagueId
    ? getRowOutcome(season.id, currentLeagueId, teamStanding.pos, getStandings(currentLeagueId).length, team.id)
    : null;
  const outcomePill: Record<string, { tone: 'green' | 'red' | 'gold' | 'neutral'; label: string }> = {
    promotion:          { tone: 'green',   label: 'Aufstieg' },
    playoff_promotion:  { tone: 'green',   label: 'Aufstiegs-Playoff' },
    relegation:         { tone: 'red',     label: 'Abstieg' },
    playoff_relegation: { tone: 'gold',    label: 'Abstiegs-Playoff' },
    withdrawn:          { tone: 'neutral', label: 'Zurückgezogen' },
  };
  const teamPill = teamOutcome ? outcomePill[teamOutcome.type] : undefined;

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
  // Phase 2, Stufe 1: Kader-Basis aus der DB (Migration 0032); bei fehlenden
  // DB-Daten transparenter Fallback auf die statische Basis (identische Ausgabe).
  const dbBase = await getDbRosterForTeam(season.id, team.id);
  const rankedRoster = getRankedRosterForTeam(team.id, season.id, dbBase ?? undefined);
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

      <TeamHero
        name={team.name}
        short={team.short}
        color={team.color}
        logoUrl={shownLogo}
        umschalter={<SaisonUmschalter archiv neuHref={t27 ? `/teams/${id}` : '/teams'} archivHref={archivHref} style={{ marginTop: -8 }} />}
        pills={<>
          {teamLeague && <Pill tone="red">{leagueLabel}</Pill>}
          {teamStanding?.pos === 1 && <Pill tone="gold">Tabellenführer</Pill>}
          {teamPill && <Pill tone={teamPill.tone}>{teamPill.label}</Pill>}
          {team.status === 'inactive' && <Pill tone="neutral">Zurückgezogen</Pill>}
        </>}
        infos={[
          { icon: 'pin', text: venueLabel },
          { icon: 'trophy', text: leagueLabel },
          ...(teamStanding ? [{ icon: 'bar' as const, text: `Platz ${teamStanding.pos} · ${teamStanding.pts} Pkt.` }] : []),
        ]}
        kpis={[
          { n: teamStanding ? `${teamStanding.pos}.` : '—', l: 'Tabellenplatz', c: teamStanding?.pos === 1 ? 'var(--th-gold)' : undefined },
          { n: teamStanding ? String(teamStanding.sp) : '—', l: 'Spiele' },
          { n: teamStanding ? String(teamStanding.s)  : '—', l: 'Siege' },
          { n: teamStanding ? String(teamStanding.u)  : '—', l: 'Unentschieden' },
          { n: teamStanding ? String(teamStanding.n)  : '—', l: 'Niederlagen' },
          { n: teamStanding ? String(teamStanding.pts) : '—', l: 'Punkte' },
        ]}
      />

      <Mannschaftsbild url={teamMedia.teamImageUrl} name={team.name} />

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
