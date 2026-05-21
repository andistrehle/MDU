import Image from 'next/image';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Card } from '@/components/mdu/card';
import { TeamBadge } from '@/components/mdu/team-badge';
import { Pill } from '@/components/mdu/pill';
import { Btn } from '@/components/mdu/button';
import { Icon } from '@/components/mdu/icon';
import {
  TEAMS, findTeam, findLeague, findVenue,
  getTeamAssignment, getPlayerAssignmentsForTeam,
  getCurrentSeason, getStandings,
} from '@/lib/data';
import { shade } from '@/lib/utils';

const TEAM_TABS = ['Übersicht', 'Kader', 'Spielplan', 'Ergebnisse', 'Statistik', 'Galerie'];
// Individual match results not publicly available — shown when data is released on dartunion.de
const RECENT_MATCHES: never[] = [];

export default async function TeamProfilePage(props: PageProps<'/teams/[id]'>) {
  const { id } = await props.params;
  const team = findTeam(id) ?? TEAMS[0];

  // ── Season-based assignment ──────────────────────────────────
  // The team's league, venue, and captain for the current season
  // are stored in SeasonTeamAssignment — NOT on the team entity itself.
  const season = getCurrentSeason();
  const assignment = getTeamAssignment(team.id, season.id);

  // League for this season
  const teamLeague = assignment ? findLeague(assignment.leagueId) : undefined;
  const leagueLabel = teamLeague?.name ?? 'Noch nicht verfügbar';

  // Venue for this season
  const venue = assignment?.venueId ? findVenue(assignment.venueId) : undefined;
  const venueLabel = venue?.name ?? 'Noch nicht verfügbar';

  // Captain for this season
  const captainLabel = assignment?.captain ?? 'Noch nicht verfügbar';

  // Standings for this season's league
  const teamStandings = assignment ? getStandings(assignment.leagueId) : [];
  const teamStanding = teamStandings.find(r => r.team === team.id);

  // Player assignments for this season
  const playerAssignments = getPlayerAssignmentsForTeam(team.id, season.id);
  const hasPlayers = playerAssignments.length > 0;

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
          <Image src="/hero-dartboard.png" alt="" width={680} height={680} style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 20% 50%, ${team.color}20, transparent 50%)` }} />
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(90deg, #0A0B0F 35%, rgba(10,11,15,0.4) 65%, rgba(10,11,15,0.75))' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 32px 30px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C', marginBottom: 24 }}>
            <Link href="/" style={{ color: '#8A8F9C', textDecoration: 'none' }}>Startseite</Link>
            <Icon name="chevron" size={12} />
            <Link href="/teams" style={{ color: '#8A8F9C', textDecoration: 'none' }}>Teams</Link>
            <Icon name="chevron" size={12} />
            <span style={{ color: '#F5F6FA' }}>{team.name}</span>
          </div>

          <div className="mdu-team-hero-flex" style={{ display: 'flex', alignItems: 'flex-end', gap: 30 }}>
            <div className="mdu-team-logo" style={{
              width: 144, height: 144, borderRadius: '24%', flexShrink: 0,
              background: `linear-gradient(135deg, ${team.color}, ${shade(team.color, -0.5)})`,
              border: '2px solid #E8B84A', boxShadow: `0 24px 60px ${team.color}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, color: '#F5F6FA',
            }}>
              {team.short}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                {teamLeague && <Pill tone="red">{leagueLabel}</Pill>}
                {teamStanding && teamStanding.pos === 1 && <Pill tone="gold">Tabellenführer</Pill>}
                {teamStanding && teamStanding.status === 'promo' && teamStanding.pos > 1 && <Pill tone="blue">Aufstiegsplatz</Pill>}
                {teamStanding && teamStanding.status === 'releg' && <Pill tone="neutral">Abstiegsplatz</Pill>}
                {team.status === 'inactive' && <Pill tone="neutral">Zurückgezogen</Pill>}
              </div>
              <h1 className="mdu-team-name" style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 72, lineHeight: 0.9, letterSpacing: '-0.005em', color: '#F5F6FA', margin: 0, textTransform: 'uppercase' }}>
                {team.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: '#C9CCD6' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="pin" size={14} stroke={2} /> {venueLabel}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="trophy" size={14} stroke={2} /> {leagueLabel}</span>
                {teamStanding && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="bar" size={14} stroke={2} /> Platz {teamStanding.pos} · {teamStanding.pts} Pkt.</span>}
              </div>
            </div>

            <div className="mdu-team-hero-actions" style={{ display: 'flex', gap: 8 }}>
              <Btn kind="outline" icon="star-o">Favorit</Btn>
              <Btn kind="outline" icon="mail">Kontakt</Btn>
              <Btn kind="primary" icon="users">Team folgen</Btn>
            </div>
          </div>

          {/* KPIs — real data from standings */}
          <div className="mdu-kpi-strip" style={{
            marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {[
              { n: teamStanding ? `${teamStanding.pos}.` : '—', l: 'Tabellenplatz', c: teamStanding?.pos === 1 ? '#E8B84A' : undefined },
              { n: teamStanding ? String(teamStanding.sp) : '—', l: 'Spiele' },
              { n: teamStanding ? String(teamStanding.s) : '—',  l: 'Siege' },
              { n: teamStanding ? String(teamStanding.n) : '—',  l: 'Niederlagen' },
              { n: teamStanding?.legs ?? '—', l: 'Legs', mono: true },
              { n: teamStanding ? String(teamStanding.pts) : '—', l: 'Punkte' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#14161E', padding: '18px 18px' }}>
                <div style={{
                  fontFamily: s.mono ? 'var(--font-jetbrains-mono)' : 'var(--font-saira-condensed)',
                  fontWeight: 900, fontSize: s.mono ? 22 : 32,
                  color: s.c ?? '#F5F6FA', lineHeight: 1,
                }}>{s.n}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#8A8F9C', textTransform: 'uppercase', marginTop: 8 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="mdu-tabs-row" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32 }}>
          {TEAM_TABS.map((tab, i) => (
            <div key={tab} style={{
              padding: '18px 0', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
              color: i === 0 ? '#F5F6FA' : '#8A8F9C',
              borderBottom: i === 0 ? '2px solid #D40000' : '2px solid transparent',
              marginBottom: -1, cursor: 'pointer',
            }}>{tab}</div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="mdu-team-body-grid mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Roster */}
          <Card padding={0}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F5F6FA' }}>Kader</span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C' }}>{season.name} · Daten folgen</span>
            </div>
            {hasPlayers ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#8A8F9C', textTransform: 'uppercase' }}>
                  <span>#</span><span>Name</span><span>Status</span>
                </div>
                {playerAssignments.map((pa, i) => (
                  <div key={pa.id} className="mdu-row-hover" style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px', padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', fontFamily: 'var(--font-manrope)', fontSize: 14 }}>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#5A5F6C', fontSize: 12 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2C313F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 11, color: '#C9CCD6' }}>
                        {pa.playerId.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: '#F5F6FA' }}>{pa.playerId}</span>
                    </div>
                    <span style={{ color: '#9AA4B2', fontSize: 13 }}>{pa.status}</span>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ padding: '28px 18px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                Noch keine Spielerdaten verfügbar.{' '}
                <span style={{ color: '#9AA4B2' }}>Kader folgt auf dartunion.de.</span>
              </div>
            )}
          </Card>

          {/* Recent matches */}
          <Card padding={0}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F5F6FA' }}>Letzte Spiele</span>
            </div>
            {RECENT_MATCHES.length === 0 && (
              <div style={{ padding: '24px 18px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280', fontStyle: 'italic' }}>
                Einzelergebnisse sind auf <span style={{ color: '#9AA4B2' }}>dartunion.de</span> verfügbar.
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Season stats */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{season.name}</span>
            </div>
            {teamStanding ? [
              { l: 'Gespielt',     v: String(teamStanding.sp),   frac: Math.min(teamStanding.sp / 18, 1),                                        c: '#D40000' },
              { l: 'Siege',        v: String(teamStanding.s),    frac: Math.min(teamStanding.s / Math.max(teamStanding.sp, 1), 1),               c: '#22C55E' },
              { l: 'Unentschieden',v: String(teamStanding.u),    frac: Math.min(teamStanding.u / Math.max(teamStanding.sp, 1), 1),               c: '#E8B84A' },
              { l: 'Niederlagen',  v: String(teamStanding.n),    frac: Math.min(teamStanding.n / Math.max(teamStanding.sp, 1), 1),               c: '#EF4444' },
              { l: 'Punkte',       v: `${teamStanding.pts} Pkt.`,frac: Math.min(teamStanding.pts / (teamStanding.sp * 3 || 1), 1),              c: '#3B82F6' },
            ].map(s => (
              <div key={s.l} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#C9CCD6' }}>
                  <span>{s.l}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: '#F5F6FA' }}>{s.v}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{ width: `${s.frac * 100}%`, height: '100%', background: `linear-gradient(90deg, ${s.c}, ${shade(s.c, -0.3)})`, borderRadius: 3 }} />
                </div>
              </div>
            )) : (
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280', fontStyle: 'italic', margin: 0 }}>
                Keine Saison-Daten verfügbar.
              </p>
            )}
          </Card>

          {/* Next match */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Nächstes Spiel</span>
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280', fontStyle: 'italic', paddingBottom: 14 }}>
              Spielplan auf <span style={{ color: '#9AA4B2' }}>dartunion.de</span> verfügbar.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#8A8F9C', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Icon name="pin" size={13} stroke={2} /> {venueLabel}
            </div>
          </Card>

          {/* Contact / Team info */}
          <Card>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Team Info</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="trophy" size={14} stroke={2} />
                <span>{leagueLabel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="user" size={14} stroke={2} />
                <span>{captainLabel === 'Noch nicht verfügbar' ? <span style={{ color: '#6B7280', fontStyle: 'italic' }}>Kapitän noch nicht verfügbar</span> : captainLabel}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280' }}>
                <Icon name="globe" size={14} stroke={2} /> dartunion.de
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <Footer />
    </div>
  );
}
