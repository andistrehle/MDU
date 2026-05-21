'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeagueStandingsPanel, type TeamInfo } from './league-standings-panel';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { getExtendedTeam } from '@/lib/data';
import type { StandingRow, Match, PlayerStatEntry } from '@/lib/data';

// ── Types ────────────────────────────────────────────────────

interface LeagueShape {
  id: string;
  name: string;
  color: string;
  season: string;
  type?: 'regular' | 'playoff';
}

interface Props {
  rows:        StandingRow[];
  league:      LeagueShape;
  teamInfoMap: Record<string, TeamInfo>;
  upcoming:    Match[];
  stats:       PlayerStatEntry[];
}

const TABS = ['Übersicht', 'Tabelle', 'Spielplan', 'Ergebnisse', 'Statistiken', 'Teams'];

// ── Helpers ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
      letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div style={{
      background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '36px 24px',
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6A6E7B',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon name={icon as 'calendar'} size={16} stroke={2} style={{ color: '#6A6E7B', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: '#9AA4B2', fontStyle: 'normal' }}>{text}</span>
      </div>
      {sub && (
        <div>
          {sub}{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: '#9AA4B2', textDecoration: 'underline' }}>
            dartunion.de
          </a>.
        </div>
      )}
    </div>
  );
}

// ── Übersicht Tab ────────────────────────────────────────────

function ÜbersichtTab({ rows, league, upcoming, stats, teamInfoMap }: Props) {
  const top3        = rows.slice(0, 3);
  const leagueStats = rows.length > 0 ? {
    totalGames:  rows.reduce((acc, r) => acc + r.sp, 0),
    totalLeader: rows[0],
  } : null;
  const leagueUpcoming = upcoming.filter(m => m.leagueId === league.id || m.league.toLowerCase().includes(league.name.toLowerCase().split(' ')[0].toLowerCase()));
  const topScorer = stats[0] ?? null;

  return (
    <div className="mdu-liga-body-grid mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* League Summary card */}
        <div style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel>Liga Übersicht</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { k: 'Saison',  v: league.season },
              { k: 'Teams',   v: String(rows.length) },
              { k: 'Spiele',  v: leagueStats ? `${leagueStats.totalGames} gespielt` : '—' },
              { k: 'Status',  v: league.type === 'playoff' ? 'Playoffs · laufend' : 'Reguläre Saison · abgeschlossen' },
            ].map(item => (
              <div key={item.k} style={{ borderLeft: `3px solid ${league.color}`, paddingLeft: 10 }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', marginBottom: 2 }}>
                  {item.k}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 */}
        {top3.length > 0 && (
          <div style={{
            background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <SectionLabel>Tabellenkopf</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top3.map(r => {
                const td = getExtendedTeam(r.team);
                return (
                  <div key={r.team} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
                      color: r.pos <= 2 ? '#E8B84A' : '#F5F6FA', width: 28, flexShrink: 0,
                    }}>
                      {r.pos}.
                    </span>
                    <TeamBadge initials={td.short.slice(0, 3)} color={td.color} size={28} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                        color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.name.replace(' *', '')}
                      </div>
                      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginTop: 2 }}>
                        {r.sp} Sp · {r.s}W {r.u}U {r.n}N
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20,
                      color: '#F5F6FA', flexShrink: 0,
                    }}>
                      {r.pts} <span style={{ fontSize: 12, color: '#9AA4B2', fontFamily: 'var(--font-manrope)', fontWeight: 600 }}>Pkt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Next matches */}
        <div style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel>Nächste Spiele</SectionLabel>
          {leagueUpcoming.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {leagueUpcoming.map((m, i) => {
                const homeTeam = getExtendedTeam(m.home);
                const awayTeam = getExtendedTeam(m.away);
                return (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Icon name="calendar" size={12} stroke={2} style={{ color: '#9AA4B2', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2' }}>
                        {m.date} · {m.time}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} size={22} />
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#F5F6FA', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {homeTeam.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', flexShrink: 0 }}>vs</span>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#F5F6FA', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {awayTeam.name}
                      </span>
                      <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} size={22} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B', fontStyle: 'italic' }}>
              Spielplan wird auf{' '}
              <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer" style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>
              {' '}veröffentlicht.
            </div>
          )}
        </div>

        {/* Top scorer */}
        {topScorer && (
          <div style={{
            background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <SectionLabel>Bester Spieler</SectionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${league.color}, ${league.color}66)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 16, color: '#fff' }}>
                  #{topScorer.rank}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: '#F5F6FA', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  {topScorer.name}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2', marginTop: 2 }}>
                  {topScorer.teamName}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, color: '#E8B84A' }}>
                  {topScorer.pts}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2' }}>Punkte</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B' }}>
              {topScorer.wins}W · {topScorer.losses}N — Einzelrangliste · dartunion.de
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Spielplan Tab ─────────────────────────────────────────────

function SpielplanTab({ upcoming, league }: { upcoming: Match[]; league: LeagueShape }) {
  const leagueUpcoming = upcoming.filter(
    m => m.leagueId === league.id || m.league.toLowerCase().includes(league.name.toLowerCase().split(' ')[0].toLowerCase())
  );

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
      {leagueUpcoming.length === 0 ? (
        <EmptyState icon="calendar" text="Kein Spielplan verfügbar" sub="Vollständiger Spielplan folgt auf" />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leagueUpcoming.map((m, i) => {
              const homeTeam = getExtendedTeam(m.home);
              const awayTeam = getExtendedTeam(m.away);
              return (
                <div key={i} style={{
                  background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  {/* Date/time row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name="calendar" size={12} stroke={2} style={{ color: '#9AA4B2', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2' }}>
                      {m.date} · {m.time} Uhr
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', padding: '2px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                      {m.venue !== 'Noch nicht verfügbar' ? m.venue : 'Ort folgt'}
                    </span>
                  </div>
                  {/* Teams row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', minWidth: 0 }}>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {homeTeam.name}
                      </span>
                      <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} size={28} />
                    </div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B', textAlign: 'center' }}>vs</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} size={28} />
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {awayTeam.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', fontStyle: 'italic' }}>
            Vollständiger Spielplan auf{' '}
            <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer" style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
          </div>
        </>
      )}
    </div>
  );
}

// ── Ergebnisse Tab ────────────────────────────────────────────

function ErgebnisseTab({ league }: { league: LeagueShape }) {
  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
      <EmptyState
        icon="check"
        text="Ergebnisse werden aktualisiert"
        sub="Alle Spiele und Ergebnisse folgen auf"
      />
    </div>
  );
}

// ── Statistiken Tab ───────────────────────────────────────────

function StatistikTab({ stats, league }: { stats: PlayerStatEntry[]; league: LeagueShape }) {
  if (stats.length === 0) {
    return (
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
        <EmptyState icon="bar" text="Statistiken folgen" sub="Einzelrangliste folgt auf" />
      </div>
    );
  }

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
      <div className="mdu-table-scroll">
        <div className="mdu-standings-inner" style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <div style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
            letterSpacing: '0.08em', color: '#F5F6FA', margin: '0 0 18px',
            textTransform: 'uppercase',
          }}>
            Einzelrangliste
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B',
            marginBottom: 16, fontStyle: 'italic',
          }}>
            Quelle: dartunion.de · Saison 2026 · Top-Spieler der {league.name}
          </div>

          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 80px',
            padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase',
            gap: 6, alignItems: 'center',
          }}>
            <span>#</span>
            <span>Spieler</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>W · N</span>
            <span style={{ textAlign: 'right' }}>Pkt.</span>
          </div>

          {stats.map((p, i) => {
            const td = getExtendedTeam(p.teamId);
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 80px',
                padding: '11px 8px',
                borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
                gap: 6,
                background: i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
              }}>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
                  color: p.rank <= 3 ? '#E8B84A' : '#9AA4B2',
                }}>
                  {p.rank}
                </span>
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    fontWeight: 700, color: '#F5F6FA', fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {p.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <TeamBadge initials={td.short.slice(0, 3)} color={td.color} size={20} />
                  <span style={{
                    color: '#9AA4B2', fontSize: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.teamName}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2',
                  textAlign: 'center',
                }}>
                  {p.wins}·{p.losses}
                </span>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                  color: '#F5F6FA', textAlign: 'right',
                }}>
                  {p.pts}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Teams Tab ─────────────────────────────────────────────────

function TeamsTab({ rows, league, teamInfoMap }: Pick<Props, 'rows' | 'league' | 'teamInfoMap'>) {
  if (rows.length === 0) {
    return (
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
        <EmptyState icon="users" text="Teams werden bekannt gegeben" sub="Teilnehmerliste folgt auf" />
      </div>
    );
  }

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
      <div className="mdu-league-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14,
      }}>
        {rows.map(r => {
          const td   = getExtendedTeam(r.team);
          const info = teamInfoMap[r.team] ?? { captain: 'Noch nicht verfügbar', venueName: 'Noch nicht verfügbar', venueAddress: '' };
          return (
            <Link
              key={r.team}
              href={`/teams/${r.team}`}
              style={{ textDecoration: 'none' }}
              className="mdu-card-hover"
            >
              <div style={{
                background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                  background: td.color, borderRadius: '12px 0 0 12px',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: 6 }}>
                  <TeamBadge initials={td.short.slice(0, 3)} color={td.color} size={32} />
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                      color: '#F5F6FA', textTransform: 'uppercase', letterSpacing: '0.02em',
                    }}>
                      {r.name.replace(' *', '')}
                    </div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: league.color, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>
                      Platz {r.pos} · {r.pts} Pkt.
                    </div>
                  </div>
                </div>
                <div style={{ paddingLeft: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[
                    { k: 'TC',         v: info.captain },
                    { k: 'Spielstätte',v: info.venueName },
                  ].map(item => (
                    <div key={item.k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', flexShrink: 0, width: 80 }}>{item.k}</span>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 600, color: '#C9CCD6' }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────

export function LeagueDetailClient({ rows, league, teamInfoMap, upcoming, stats }: Props) {
  const [activeTab, setActiveTab] = useState(0); // Default: Übersicht

  return (
    <>
      {/* Tab bar — visually merges with the banner above */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(13,17,23,0.6)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div
          className="mdu-tabs-row"
          style={{
            maxWidth: 1280, margin: '0 auto', padding: '0 28px',
            display: 'flex', alignItems: 'center', gap: 36, overflowX: 'auto',
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '16px 0',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                color: i === activeTab ? '#D40000' : '#9AA4B2',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: i === activeTab ? '2px solid #D40000' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
                letterSpacing: '0.04em', textTransform: 'uppercase',
                background: 'none',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 0 && (
        <ÜbersichtTab rows={rows} league={league} teamInfoMap={teamInfoMap} upcoming={upcoming} stats={stats} />
      )}
      {activeTab === 1 && (
        <LeagueStandingsPanel rows={rows} league={league} teamInfoMap={teamInfoMap} />
      )}
      {activeTab === 2 && (
        <SpielplanTab upcoming={upcoming} league={league} />
      )}
      {activeTab === 3 && (
        <ErgebnisseTab league={league} />
      )}
      {activeTab === 4 && (
        <StatistikTab stats={stats} league={league} />
      )}
      {activeTab === 5 && (
        <TeamsTab rows={rows} league={league} teamInfoMap={teamInfoMap} />
      )}
    </>
  );
}
