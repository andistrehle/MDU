'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeagueStandingsPanel, type TeamInfo } from './league-standings-panel';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { getExtendedTeam, formatMatchDate, formatScheduledDate, findLeague, getVenueForTeamInSeason } from '@/lib/data';
import type { StandingRow, PlayerStatEntry } from '@/lib/data';
import type { Match as GameMatch } from '@/lib/data/matches';
import { groupMatchesByMatchday } from '@/lib/data/matches';

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
  stats:       PlayerStatEntry[];
  /** All matches for this league (scheduled + completed) from lib/data/matches.ts */
  matches:     GameMatch[];
}

const TABS = ['Übersicht', 'Tabelle', 'Spielplan', 'Ergebnisse', 'Statistiken', 'Teams'];

/** Maps internal league id → dartunion.de LigaId query param */
const LIGA_ID_MAP: Record<string, string> = {
  'la':                  '88',
  'a1':                  '86',
  'a2':                  '87',
  'b1':                  '84',
  'b2':                  '85',
  'c':                   '94',
  'playoffs-a-aufstieg': '89',
  'playoffs-a-abstieg':  '91',
  'playoffs-b-aufstieg': '90',
  'playoffs-b-abstieg':  '92',
};

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

function ÜbersichtTab({ rows, league, matches, stats, teamInfoMap }: Props) {
  const top3        = rows.slice(0, 3);
  const leagueStats = rows.length > 0 ? {
    totalGames:  rows.reduce((acc, r) => acc + r.sp, 0),
    totalLeader: rows[0],
  } : null;
  const today      = new Date().toISOString().slice(0, 10);
  const scheduled  = matches
    .filter(m => m.status === 'scheduled' && (!m.date || m.date >= today))
    .slice(0, 3);
  const recent     = matches
    .filter(m => m.status === 'completed' && m.result != null && (!m.date || m.date <= today))
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 3);
  const topScorer  = stats[0] ?? null;

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
          {scheduled.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scheduled.map((m) => {
                const homeTeam = getExtendedTeam(m.homeTeamId);
                const awayTeam = getExtendedTeam(m.awayTeamId);
                return (
                  <div key={m.id} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Icon name="calendar" size={12} stroke={2} style={{ color: '#9AA4B2', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2' }}>
                        {formatScheduledDate(m.date)}{m.time ? ` · ${m.time}` : ''}
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

function SpielplanTab({ matches, league }: { matches: GameMatch[]; league: LeagueShape }) {
  const today      = new Date().toISOString().slice(0, 10);
  const scheduled  = matches.filter(m => m.status === 'scheduled' && (!m.date || m.date >= today));
  const isPlayoff  = league.type === 'playoff';
  const ligaId     = LIGA_ID_MAP[league.id] ?? '';
  const dartUrl    = ligaId ? `https://dartunion.de/ranking01.php?LigaId=${ligaId}` : 'https://dartunion.de';

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
      {scheduled.length === 0 ? (
        !isPlayoff ? (
          <div style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 10, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <Icon name="check" size={16} stroke={2} style={{ color: '#10B981', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>
                Reguläre Saison abgeschlossen
              </div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginTop: 2 }}>
                {league.name} · Saison {league.season} · alle Spieltage gespielt
              </div>
            </div>
            <a href={dartUrl} target="_blank" rel="noopener noreferrer" style={{
              fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
              color: '#9AA4B2', textDecoration: 'underline', flexShrink: 0,
            }}>
              Spielplan auf dartunion.de →
            </a>
          </div>
        ) : (
          <EmptyState icon="calendar" text="Spielplan folgt" sub="Upcoming Playoff-Spiele folgen auf" />
        )
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scheduled.map((m) => {
              const homeTeam = getExtendedTeam(m.homeTeamId);
              const awayTeam = getExtendedTeam(m.awayTeamId);
              return (
                <div key={m.id} className="mdu-spielplan-card" style={{
                  background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  {/* Date/time row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name="calendar" size={12} stroke={2} style={{ color: '#9AA4B2', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2' }}>
                      {formatScheduledDate(m.date)}{m.time ? ` · ${m.time} Uhr` : ''}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', padding: '2px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                      {getVenueForTeamInSeason(m.homeTeamId, 'season-2026')?.name ?? 'Ort folgt'}
                    </span>
                  </div>
                  {/* Teams row — 3-col grid, no overflow */}
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
            <a href={dartUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
          </div>
        </>
      )}
    </div>
  );
}

// ── Ergebnisse Tab ────────────────────────────────────────────

function ErgebnisseTab({ rows, league, matches }: { rows: StandingRow[]; league: LeagueShape; matches: GameMatch[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const completed = matches
    .filter(m => m.status === 'completed' && m.result != null && (!m.date || m.date <= today))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
  const isPlayoff = league.type === 'playoff';
  const ligaId    = LIGA_ID_MAP[league.id] ?? '';
  const dartUrl   = ligaId
    ? `https://dartunion.de/ranking01.php?LigaId=${ligaId}`
    : 'https://dartunion.de';

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>

      {/* Status banner */}
      <div style={{
        background: isPlayoff ? 'rgba(212,0,0,0.08)' : 'rgba(16,185,129,0.08)',
        border: `1px solid ${isPlayoff ? 'rgba(212,0,0,0.25)' : 'rgba(16,185,129,0.25)'}`,
        borderRadius: 10, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Icon
          name={isPlayoff ? 'lightning' : 'check'}
          size={16} stroke={2}
          style={{ color: isPlayoff ? '#D40000' : '#10B981', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>
            {isPlayoff ? 'Playoffs · laufend' : 'Reguläre Saison · abgeschlossen'}
          </div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginTop: 2 }}>
            {league.name} · Saison {league.season}
          </div>
        </div>
        <a href={dartUrl} target="_blank" rel="noopener noreferrer" style={{
          fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
          color: '#9AA4B2', textDecoration: 'underline', flexShrink: 0,
        }}>
          Alle Ergebnisse auf dartunion.de →
        </a>
      </div>

      {/* Individual match results — grouped by matchday */}
      {completed.length > 0 && (
        <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Spielergebnisse</SectionLabel>
          {groupMatchesByMatchday(completed).map(({ matchday, matches: mdMatches }) => (
            <div key={matchday ?? 'null'}>
              {/* Matchday sub-heading */}
              {matchday !== null && (
                <div style={{
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                  letterSpacing: '0.14em', color: '#6A6E7B', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {matchday}. Spieltag
                </div>
              )}
              <div style={{
                background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {mdMatches.map((m) => {
                    const home    = getExtendedTeam(m.homeTeamId);
                    const away    = getExtendedTeam(m.awayTeamId);
                    const homeWon = (m.result?.home ?? 0) > (m.result?.away ?? 0);
                    const awayWon = (m.result?.away ?? 0) > (m.result?.home ?? 0);
                    return (
                      <div key={m.id} className="mdu-ergebnis-inner" style={{
                        padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        {/* Date row */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                          fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2',
                        }}>
                          <Icon name="calendar" size={12} stroke={2} style={{ color: '#9AA4B2', flexShrink: 0 }} />
                          <span>{formatMatchDate(m.date)}</span>
                        </div>
                        {/* Teams + Score — 3-col, mobile-safe */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
                            <span style={{
                              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                              color: homeWon ? '#F5F6FA' : '#9AA4B2',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {home.name}
                            </span>
                            <TeamBadge initials={home.short.slice(0, 3)} color={home.color} size={26} />
                          </div>
                          <div style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20,
                            color: '#F5F6FA',
                            background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 0',
                          }}>
                            {m.result ? `${m.result.home}:${m.result.away}` : '—'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <TeamBadge initials={away.short.slice(0, 3)} color={away.color} size={26} />
                            <span style={{
                              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                              color: awayWon ? '#F5F6FA' : '#9AA4B2',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {away.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Season records table */}
      {rows.length > 0 ? (
        <div style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel>Saisonbilanz · {league.name}</SectionLabel>
          <div className="mdu-table-scroll">
            <div className="mdu-standings-inner">
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 90px 90px 60px',
                padding: '8px 4px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase',
                gap: 8, alignItems: 'center',
              }}>
                <span>#</span>
                <span>Team</span>
                <span style={{ textAlign: 'center' }}>S · U · N</span>
                <span style={{ textAlign: 'center' }}>Legs</span>
                <span style={{ textAlign: 'right' }}>Pkt.</span>
              </div>

              {rows.map((r, i) => {
                const td = getExtendedTeam(r.team);
                return (
                  <div key={r.team} style={{
                    display: 'grid', gridTemplateColumns: '28px 1fr 90px 90px 60px',
                    padding: '11px 4px',
                    borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
                      color: '#9AA4B2',
                    }}>
                      {r.pos}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <TeamBadge initials={td.short.slice(0, 3)} color={td.color} size={22} />
                      <span style={{
                        fontWeight: 700, color: '#F5F6FA', fontSize: 13,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.name.replace(' *', '')}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2',
                      textAlign: 'center',
                    }}>
                      {r.s}·{r.u}·{r.n}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2',
                      textAlign: 'center',
                    }}>
                      {r.legs}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                      color: '#F5F6FA', textAlign: 'right',
                    }}>
                      {r.pts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6A6E7B', fontStyle: 'italic' }}>
            Quelle: dartunion.de · Einzelergebnisse (Spieltag-Details) unter{' '}
            <a href={dartUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: '#9AA4B2', textDecoration: 'underline' }}>
              dartunion.de
            </a>
          </div>
        </div>
      ) : (
        <EmptyState
          icon="check"
          text="Ergebnisse folgen"
          sub="Alle Spiele und Ergebnisse folgen auf"
        />
      )}
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

      {/* ── Desktop: rich 5-column scrollable table ── */}
      <div className="mdu-desktop-only mdu-table-scroll">
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

      {/* ── Mobile: compact 4-column no-scroll table ── */}
      <div className="mdu-mobile-only">
        <div style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {/* Heading */}
          <div style={{ padding: '14px 14px 0' }}>
            <div style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
              letterSpacing: '0.06em', color: '#F5F6FA', textTransform: 'uppercase', marginBottom: 4,
            }}>
              Einzelrangliste
            </div>
            <div style={{
              fontFamily: 'var(--font-manrope)', fontSize: 10, color: '#6A6E7B',
              fontStyle: 'italic', marginBottom: 10,
            }}>
              Quelle: dartunion.de · {league.name}
            </div>
          </div>

          {/* Column header: # | Spieler | T | Pkt. */}
          <div style={{
            display: 'grid', gridTemplateColumns: '26px 1fr 28px 40px',
            padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
            letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase',
            gap: 6, alignItems: 'center',
          }}>
            <span>#</span>
            <span>Spieler</span>
            <span style={{ textAlign: 'center' }}>T</span>
            <span style={{ textAlign: 'right' }}>Pkt.</span>
          </div>

          {/* Data rows */}
          {stats.map((p, i) => {
            const td = getExtendedTeam(p.teamId);
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '26px 1fr 28px 40px',
                padding: '9px 14px',
                borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center', gap: 6,
                background: i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
              }}>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14,
                  color: p.rank <= 3 ? '#E8B84A' : '#9AA4B2',
                }}>
                  {p.rank}
                </span>
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, color: '#F5F6FA', fontSize: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {p.name}
                  </span>
                </div>
                <div title={p.teamName} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TeamBadge initials={td.short.slice(0, 3)} color={td.color} size={22} />
                </div>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 15,
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

export function LeagueDetailClient({ rows, league, teamInfoMap, stats, matches }: Props) {
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
        <ÜbersichtTab rows={rows} league={league} teamInfoMap={teamInfoMap} matches={matches} stats={stats} />
      )}
      {activeTab === 1 && (
        <LeagueStandingsPanel rows={rows} league={league} teamInfoMap={teamInfoMap} />
      )}
      {activeTab === 2 && (
        <SpielplanTab matches={matches} league={league} />
      )}
      {activeTab === 3 && (
        <ErgebnisseTab rows={rows} league={league} matches={matches} />
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
