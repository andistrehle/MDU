import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Pill } from '@/components/mdu/pill';
import { Icon } from '@/components/mdu/icon';
import {
  SEASONS, getCurrentSeason,
  findPlayer, getPlayerDisplayName, getPlayerInitials,
  getPlayerSeasonStats, getTeamAssignmentsForPlayer,
  findTeam, findLeague, getTeamAssignment, getCurrentCompetitionForTeam,
  formatWinRate,
} from '@/lib/data';
import { shade } from '@/lib/utils';
import { loadPublicPlayerProfile } from '@/lib/supabase/profiles';
import { getDbPlayer } from '@/lib/server/season-data';

export default async function PlayerProfilePage(
  props: { params: Promise<{ playerId: string }> },
) {
  const { playerId } = await props.params;
  const season = getCurrentSeason();

  // Bestehende Spieler laufen unverändert über den statischen Stamm. Spieler,
  // die es dort nicht gibt (per Nachmeldung angelegt), werden aus der DB geholt
  // (Phase 2, Stufe 2) — sonst 404 wie bisher.
  const staticPlayer = findPlayer(playerId);
  const dbProfile = staticPlayer ? null : await getDbPlayer(playerId);
  const player = staticPlayer ?? dbProfile?.player;
  if (!player) notFound();

  const displayName = getPlayerDisplayName(player);
  const stats = getPlayerSeasonStats(player.id, season.id);

  // Vom Spieler selbst gepflegte Angaben — nur mit erteilter Einwilligung
  // öffentlich zeigen; sonst Fallback auf die (kuratierten) Stammdaten.
  const publicExtras = await loadPublicPlayerProfile(player.id);
  const shownNickname = publicExtras.nickname ?? player.nickname ?? null;
  const shownPhotoUrl = publicExtras.photoUrl ?? player.photoUrl;

  // Current team / competition context. Für DB-Spieler kommt das aktuelle Team
  // aus den DB-Zuordnungen (der Spieler hat keine offiziellen Stats).
  const dbCurrentTeamId = dbProfile
    ? (dbProfile.assignments.find(a => a.seasonId === season.id)?.teamId
        ?? dbProfile.assignments[0]?.teamId ?? null)
    : null;
  const team        = stats?.teamId ? findTeam(stats.teamId)
                    : dbCurrentTeamId ? findTeam(dbCurrentTeamId) : undefined;
  const teamColor   = team?.color ?? '#9AA4B2';
  const competition = team ? getCurrentCompetitionForTeam(team.id, season.id) : null;
  const leagueName  = competition?.league?.name ?? 'Noch nicht verfügbar';

  // Team history (all seasons this player has an assignment). Statisch aus den
  // Stamm-Zuordnungen, für DB-Spieler aus den DB-Zuordnungen.
  const rawHistory: { seasonId: string; teamId: string; isCaptain?: boolean }[] =
    dbProfile ? dbProfile.assignments : getTeamAssignmentsForPlayer(player.id);
  const history = rawHistory
    .map(a => {
      const histTeam   = findTeam(a.teamId);
      const seasonName = SEASONS.find(s => s.id === a.seasonId)?.name ?? a.seasonId;
      const histLeague = findLeague(getTeamAssignment(a.teamId, a.seasonId)?.leagueId ?? '');
      return {
        seasonId: a.seasonId,
        seasonName,
        teamId: a.teamId,
        teamName: histTeam?.name ?? a.teamId,
        teamColor: histTeam?.color ?? '#9AA4B2',
        leagueName: histLeague?.name ?? '',
        isCaptain: a.isCaptain ?? false,
      };
    })
    // Newest season first
    .sort((a, b) => b.seasonName.localeCompare(a.seasonName, 'de'));

  const hasOfficial = stats?.hasOfficialStats ?? false;

  return (
    <div style={{ background: 'var(--th-bg-deep)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/teams" />

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, ${shade(teamColor, -0.55)}22 0%, var(--th-bg-deep) 100%), var(--th-bg-deep)`,
        borderBottom: '1px solid var(--th-line-6)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `radial-gradient(circle at 18% 40%, ${teamColor}22, transparent 55%)`,
        }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '34px 32px 30px', position: 'relative' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-dim)', marginBottom: 24, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/teams" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Teams</Link>
            {team && (
              <>
                <Icon name="chevron" size={12} />
                <Link href={`/teams/${team.id}`} style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>{team.name}</Link>
              </>
            )}
            <Icon name="chevron" size={12} />
            <span style={{ color: 'var(--th-text-strong)' }}>{displayName}</span>
          </div>

          {/* Identity */}
          <div className="mdu-team-hero-flex" style={{ display: 'flex', alignItems: 'flex-end', gap: 28 }}>
            <PlayerPhoto name={displayName} initials={getPlayerInitials(player)} color={teamColor} photoUrl={shownPhotoUrl} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                {team && <Pill tone="red">{leagueName}</Pill>}
                {stats?.rank === 1 && <Pill tone="gold">Ranglisten-Erster</Pill>}
                {history.some(h => h.seasonId === season.id && h.isCaptain) && <Pill tone="blue">Teamkapitän</Pill>}
              </div>
              <h1 className="mdu-team-name" style={{
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64,
                lineHeight: 0.92, letterSpacing: '-0.005em', color: 'var(--th-text-strong)',
                margin: 0, textTransform: 'uppercase',
              }}>
                {displayName}
              </h1>
              {shownNickname && (
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, color: 'var(--th-text-muted)', marginTop: 8 }}>
                  „{shownNickname}“
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', flexWrap: 'wrap' }}>
                {team && (
                  <Link href={`/teams/${team.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--th-text-body)', textDecoration: 'none' }}>
                    <Icon name="users" size={14} stroke={2} /> {team.name}
                  </Link>
                )}
                {stats?.rank !== null && stats?.rank !== undefined && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="bar" size={14} stroke={2} /> Rang {stats.rank}{stats.points !== null ? ` · ${stats.points} Pkt.` : ''}
                  </span>
                )}
                {player.licenseNumber && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-dim)' }}>
                    {player.licenseNumber}
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
              { n: stats?.rank != null ? `${stats.rank}.` : '—', l: 'Rang', c: stats?.rank === 1 ? 'var(--th-gold)' : undefined },
              { n: hasOfficial ? String(stats!.singlesPlayed) : '—', l: 'Einzelspiele' },
              { n: hasOfficial ? String(stats!.singlesWon) : '—', l: 'Gewonnen' },
              { n: hasOfficial ? String(stats!.singlesLost) : '—', l: 'Verloren' },
              { n: stats ? formatWinRate(stats.winRate) : '—', l: 'Siegquote' },
              { n: stats?.points != null ? String(stats.points) : '—', l: 'Punkte' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--th-bg-card3)', padding: '18px 16px' }}>
                <div style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28,
                  color: s.c ?? 'var(--th-text-strong)', lineHeight: 1,
                }}>
                  {s.n}
                </div>
                <div style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.18em', color: 'var(--th-text-dim)', textTransform: 'uppercase', marginTop: 8,
                }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="mdu-section-pad" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 32px 64px' }}>
        <div className="mdu-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Saisonstatistik */}
          <Card accent={teamColor} title={`Saisonstatistik · ${season.name}`}>
            {stats ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <StatRow label="Ranglistenplatz" value={stats.rank != null ? `#${stats.rank}` : '–'} />
                <StatRow label="Punkte" value={stats.points != null ? String(stats.points) : '–'} />
                <StatRow label="Einzelspiele" value={hasOfficial ? String(stats.singlesPlayed) : '–'} />
                <StatRow label="Gewonnen" value={hasOfficial ? String(stats.singlesWon) : '–'} valueColor="#22C55E" />
                <StatRow label="Verloren" value={hasOfficial ? String(stats.singlesLost) : '–'} valueColor="#EF4444" />
                <StatRow label="Siegquote" value={formatWinRate(stats.winRate)} />
                <StatRow label="Leg-Bilanz" value={stats.legBalance ?? '–'} last />
              </div>
            ) : (
              <Empty>Noch keine Saisonstatistik verfügbar.</Empty>
            )}
            {!hasOfficial && stats && (
              <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontStyle: 'italic' }}>
                Dieser Spieler ist (noch) nicht in der offiziellen Einzelrangliste gelistet.
              </div>
            )}
          </Card>

          {/* Formkurve */}
          <Card accent={teamColor} title="Formkurve">
            {stats && stats.form.length > 0 ? (
              <div style={{ display: 'flex', gap: 6 }}>
                {stats.form.map((f, i) => (
                  <FormBadge key={i} outcome={f} />
                ))}
              </div>
            ) : (
              <Empty>Noch keine Formdaten verfügbar.</Empty>
            )}

            {/* Letzte Ergebnisse */}
            <div style={{ marginTop: 20 }}>
              <SubLabel>Letzte Ergebnisse</SubLabel>
              {stats && stats.recentResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.recentResults.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
                      <FormBadge outcome={r.outcome} />
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.result}</span>
                      <span style={{ color: 'var(--th-text-muted)' }}>vs {r.opponent}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>Noch keine Einzelergebnisse verfügbar.</Empty>
              )}
            </div>
          </Card>

          {/* Darts-Spezialwerte */}
          <Card accent={teamColor} title="Darts-Spezialwerte">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <SpecialTile label="180er" value={stats?.oneEighties} />
              <SpecialTile label="171er" value={stats?.oneSeventyOnes} />
              <SpecialTile label="High Finishes" value={stats?.highFinishes} />
              <SpecialTile label="Short Legs" value={stats?.shortLegs} />
            </div>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontStyle: 'italic' }}>
              Spezialwerte werden noch nicht erfasst — vorbereitet für kommende Saisons.
            </div>
          </Card>

          {/* Mannschaftshistorie */}
          <Card accent={teamColor} title="Mannschaftshistorie">
            {history.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {history.map((h, i) => (
                  <Link key={i} href={`/teams/${h.teamId}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--th-line-4)', border: '1px solid var(--th-line-6)',
                  }}>
                    <span style={{
                      width: 6, height: 34, borderRadius: 3, flexShrink: 0, background: h.teamColor,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>
                        {h.teamName}
                        {h.isCaptain && (
                          <span title="Teamkapitän" style={{ marginLeft: 8, fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 3, padding: '1px 5px' }}>Kapitän</span>
                        )}
                      </div>
                      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)', marginTop: 2 }}>
                        {h.seasonName}{h.leagueName ? ` · ${h.leagueName}` : ''}
                      </div>
                    </div>
                    <Icon name="chevron" size={14} stroke={2} style={{ color: 'var(--th-text-faint2)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            ) : (
              <Empty>Noch keine Mannschaftshistorie verfügbar.</Empty>
            )}
          </Card>

          {/* Historische Statistiken — prepared empty section */}
          <div style={{ gridColumn: '1 / -1' }}>
            <Card accent={teamColor} title="Historische Statistiken">
              <Empty>
                Saisonübergreifende Statistiken werden vorbereitet — sobald frühere Saisons
                erfasst sind, erscheinen sie hier.
              </Empty>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Server-rendered building blocks ───────────────────────────

function Card({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{
        fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
        letterSpacing: '0.16em', color: accent, textTransform: 'uppercase', marginBottom: 16,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatRow({ label, value, valueColor, last }: { label: string; value: string; valueColor?: string; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: last ? 'none' : '1px solid var(--th-line-4)',
    }}>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 17, color: valueColor ?? 'var(--th-text-strong)' }}>{value}</span>
    </div>
  );
}

function SpecialTile({ label, value }: { label: string; value: number | null | undefined }) {
  const shown = value != null ? String(value) : '–';
  return (
    <div style={{
      textAlign: 'center', background: 'var(--th-line-4)', border: '1px solid var(--th-line-6)',
      borderRadius: 10, padding: '14px 8px',
    }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26, color: value != null ? 'var(--th-text-strong)' : 'var(--th-text-faint2)', lineHeight: 1 }}>
        {shown}
      </div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

function FormBadge({ outcome }: { outcome: 'W' | 'L' }) {
  // W = gewonnenes Einzelspiel, L = verlorenes — kein Unentschieden bei Spielern
  const color = outcome === 'W' ? '#22C55E' : '#EF4444';
  const label = outcome === 'W' ? 'W' : 'L';
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 7,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 15,
      color, background: `${color}1A`, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
      letterSpacing: '0.14em', color: 'var(--th-text-dim)', textTransform: 'uppercase', marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)', fontStyle: 'italic', padding: '6px 0' }}>
      {children}
    </div>
  );
}

function PlayerPhoto({ name, initials, color, photoUrl }: { name: string; initials: string; color: string; photoUrl?: string }) {
  return (
    <div className="mdu-team-logo" style={{
      width: 132, height: 132, borderRadius: '24%', flexShrink: 0,
      background: photoUrl ? 'var(--th-bg-inset)' : `linear-gradient(135deg, ${color}, ${shade(color, -0.5)})`,
      border: '2px solid var(--th-gold)',
      boxShadow: `0 24px 60px ${color}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 52, color: '#F5F6FA',
    }}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
      ) : initials}
    </div>
  );
}
