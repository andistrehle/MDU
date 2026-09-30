import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { LeagueDetailClient } from '@/components/mdu/league-detail-client';
import { type TeamInfo } from '@/components/mdu/league-standings-panel';
import { Icon } from '@/components/mdu/icon';
import { notFound } from 'next/navigation';
import { Liga27Client } from '@/components/mdu/liga-27-client';
import { SaisonUmschalter } from '@/components/mdu/saison-umschalter';
import { findLiga27, istArchivParam, ARCHIV_SAISON, NEUE_SAISON, TABS_27 } from '@/lib/data/saison-2027';
import {
  findLeague, getStandings,
  getCurrentSeason, getTeamAssignment, findVenue, getVenueFullAddress,
  getStatisticsForLeague, getMatchesForLeague,
} from '@/lib/data';

const TAB_NAMES = ['übersicht', 'tabelle', 'spielplan', 'ergebnisse', 'statistiken', 'teams'] as const;

function resolveInitialTab(tabParam: string | string[] | undefined): number {
  if (!tabParam || typeof tabParam !== 'string') return 0;
  const idx = TAB_NAMES.indexOf(tabParam.toLowerCase() as typeof TAB_NAMES[number]);
  return idx >= 0 ? idx : 0;
}

// Saison 2026/2027 ist Standard (Liga27Client). Die Saison 2025/26 bleibt als
// ARCHIV erreichbar: ?saison=2025-26 — und automatisch für Codes, die es 26/27
// nicht mehr gibt (a1, a2, Playoffs).
export default async function LeagueDetailPage(props: PageProps<'/ligen/[code]'>) {
  const { code } = await props.params;
  const sp = await props.searchParams;
  const liga27 = findLiga27(code);
  const league    = findLeague(code);
  const archiv = !liga27 || istArchivParam(sp?.saison);
  if (!archiv && liga27) {
    const t = typeof sp?.tab === 'string' ? TABS_27.findIndex(x => x.toLowerCase() === sp.tab!.toString().toLowerCase()) : -1;
    return (
      <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
        <DesktopHeader activeHref="/ligen" />
        <LeagueBanner name={liga27.name} color={liga27.color} ligenHref="/ligen" eyebrow={NEUE_SAISON.name}>
          <SaisonUmschalter archiv={false} neuHref={`/ligen/${code}`} archivHref={league ? `/ligen/${code}?saison=${ARCHIV_SAISON.slug}` : '/ligen/2025-26'} style={{ marginTop: 18, marginBottom: 0 }} />
        </LeagueBanner>
        <Liga27Client code={liga27.code} initialTab={t >= 0 ? t : 0} />
        <Footer />
      </div>
    );
  }
  const initialTab = resolveInitialTab(sp?.tab);
  // Unbekannter Liga-/Playoff-Code → 404 statt leerer „XYZ Liga"-Seite.
  if (!league) notFound();
  const leagueName = league.name;
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
    color:  league?.color  ?? 'var(--th-accent)',
    season: league?.season ?? '2025/2026',
    type:   league?.type,
  } as const;

  // Player statistics for this league
  const stats = getStatisticsForLeague(code);

  // All matches for this league (scheduled + completed) from matches.ts
  const matches = getMatchesForLeague(code);

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/ligen" />

      <LeagueBanner name={leagueName} color={league?.color ?? 'var(--th-accent)'} ligenHref="/ligen/2025-26" eyebrow={`${ARCHIV_SAISON.name} · Archiv`}>
        <SaisonUmschalter archiv neuHref={liga27 ? `/ligen/${code}` : '/ligen'} archivHref={`/ligen/${code}?saison=${ARCHIV_SAISON.slug}`} style={{ marginTop: 18, marginBottom: 0 }} />
      </LeagueBanner>

      {/* Interactive tabs + tab content */}
      <LeagueDetailClient
        rows={standings}
        league={leagueShape}
        teamInfoMap={teamInfoMap}
        stats={stats}
        matches={matches}
        initialTab={initialTab}
      />

      <Footer />
    </div>
  );
}

/** Kopf der Liga-Seite (Breadcrumb, Titel, Saison-Umschalter) — für beide Saisons. */
function LeagueBanner({ name, color, ligenHref, eyebrow, children }: { name: string; color: string; ligenHref: string; eyebrow: string; children?: React.ReactNode }) {
  return (
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, var(--th-bg-header) 0%, var(--th-bg-page) 100%)',
        borderBottom: '1px solid var(--th-line-4)',
      }}>
        <div aria-hidden className="mdu-banner-dartboard" style={{
          position: 'absolute', right: -260, top: '50%', transform: 'translateY(-50%)',
          width: 680, height: 680, pointerEvents: 'none', opacity: 0.7,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
          maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        }}>
          <Image src="/mdu-hero-dartboard-2.webp"
            unoptimized alt="" width={680} height={680}
            style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, var(--th-bg-page) 30%, var(--th-veil-40) 65%, var(--th-veil-70))',
        }} />

        <div className="mdu-section-pad" style={{
          maxWidth: 1280, margin: '0 auto', padding: '34px 28px 24px', position: 'relative', zIndex: 2,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginBottom: 16,
          }}>
            <Link href="/" style={{ color: 'var(--th-text-muted)', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href={ligenHref} style={{ color: 'var(--th-text-muted)', textDecoration: 'none' }}>Ligen</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: 'var(--th-text-strong)' }}>{name}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--th-text-muted)', marginBottom: 8 }}>{eyebrow}</div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, lineHeight: 0.92,
            letterSpacing: '-0.005em', color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase',
            paddingBottom: 14, borderBottom: `3px solid ${color}`, display: 'inline-block',
          }}>
            {name}
          </h1>
          {children}
        </div>
      </div>
  );
}
