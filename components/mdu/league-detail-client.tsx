'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LeagueStandingsPanel, type TeamInfo } from './league-standings-panel';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { PlayerCard, type PlayerCardData } from './player-card';
import {
  getExtendedTeam, formatMatchDate, formatScheduledDate, findLeague, getVenueForTeamInSeason,
  getPlayerPhotoByName, getInitialsFromName,
  getPlayerSeasonStatsFromEntry, getPlayerDisplayName, getCurrentSeason,
} from '@/lib/data';
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
  /** Optional initial tab index (0=Übersicht, 1=Tabelle, …). Defaults to 0. */
  initialTab?: number;
}

const TABS = ['Übersicht', 'Tabelle', 'Spielplan', 'Ergebnisse', 'Statistiken', 'Teams'];

// ── Helpers ──────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
      letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function EmptyState({ icon, text, sub }: { icon: string; text: string; sub?: string }) {
  return (
    <div style={{
      background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
      borderRadius: 14, padding: '36px 24px',
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon name={icon as 'calendar'} size={16} stroke={2} style={{ color: 'var(--th-text-faint)', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: 'var(--th-text-muted)', fontStyle: 'normal' }}>{text}</span>
      </div>
      {sub && (
        <div>
          {sub}{' '}
          <span style={{ color: 'var(--th-text-muted)' }}>
            dartunion.de
          </span>.
        </div>
      )}
    </div>
  );
}

// ── Übersicht Tab ────────────────────────────────────────────

function ÜbersichtTab({ rows, league, matches, stats, onSelectPlayer }: Props & { onSelectPlayer: (entry: PlayerStatEntry) => void }) {
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
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel>Liga Übersicht</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { k: 'Saison',  v: league.season },
              { k: 'Teams',   v: String(rows.length) },
              { k: 'Spiele',  v: leagueStats ? `${leagueStats.totalGames} gespielt` : '—' },
              { k: 'Status',  v: league.type === 'playoff' ? 'Playoffs · abgeschlossen' : 'Reguläre Saison · abgeschlossen' },
            ].map(item => (
              <div key={item.k} style={{ borderLeft: `3px solid ${league.color}`, paddingLeft: 10 }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', marginBottom: 2 }}>
                  {item.k}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>
                  {item.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 */}
        {top3.length > 0 && (
          <div style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <SectionLabel>Tabellenkopf</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top3.map(r => {
                const td = getExtendedTeam(r.team);
                return (
                  <TeamLink key={r.team} teamId={r.team} competitionId={league.id} teamName={r.name.replace(' *', '')} style={{
                    display: 'flex', width: '100%', gap: 12,
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--th-line-3)', border: '1px solid var(--th-line-6)',
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
                      color: r.pos <= 2 ? 'var(--th-gold)' : 'var(--th-text-strong)', width: 28, flexShrink: 0,
                    }}>
                      {r.pos}.
                    </span>
                    <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={28} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="mdu-link-name" style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                        color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.name.replace(' *', '')}
                      </div>
                      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)', marginTop: 2 }}>
                        {r.sp} Sp · {r.s}W {r.u}U {r.n}N
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20,
                      color: 'var(--th-text-strong)', flexShrink: 0,
                    }}>
                      {r.pts} <span style={{ fontSize: 12, color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 600 }}>Pkt</span>
                    </div>
                  </TeamLink>
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
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
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
                    background: 'var(--th-line-3)', border: '1px solid var(--th-line-6)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Icon name="calendar" size={12} stroke={2} style={{ color: 'var(--th-text-muted)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)' }}>
                        {formatScheduledDate(m.date)}{m.time ? ` · ${m.time}` : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TeamLink teamId={m.homeTeamId} competitionId={league.id} teamName={homeTeam.name} style={{ flex: 1, gap: 8, minWidth: 0 }}>
                        <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} logoUrl={homeTeam.logoUrl} size={22} />
                        <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                          {homeTeam.name}
                        </span>
                      </TeamLink>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', flexShrink: 0 }}>vs</span>
                      <TeamLink teamId={m.awayTeamId} competitionId={league.id} teamName={awayTeam.name} style={{ flex: 1, gap: 8, minWidth: 0, justifyContent: 'flex-end' }}>
                        <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, textAlign: 'right' }}>
                          {awayTeam.name}
                        </span>
                        <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} logoUrl={awayTeam.logoUrl} size={22} />
                      </TeamLink>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontStyle: 'italic' }}>
              Spielplan wird auf{' '}
              <span style={{ color: 'var(--th-text-muted)' }}>dartunion.de</span>
              {' '}veröffentlicht.
            </div>
          )}
        </div>

        {/* Top scorer */}
        {topScorer && (
          <div style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 14, padding: '22px 24px',
          }}>
            <SectionLabel>Bester Spieler</SectionLabel>
            <button
              type="button"
              onClick={() => onSelectPlayer(topScorer)}
              aria-label={`Spielerprofil von ${topScorer.name} öffnen`}
              className="mdu-entity-link"
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 14, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
            >
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
                <div className="mdu-link-name" style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: 'var(--th-text-strong)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                  {topScorer.name}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                  {topScorer.teamName}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, color: 'var(--th-gold)' }}>
                  {topScorer.pts}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)' }}>Punkte</div>
              </div>
            </button>
            <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)' }}>
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

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>
      {scheduled.length === 0 ? (
        <div style={{
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 10, padding: '18px 22px',
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <Icon name="check" size={16} stroke={2} style={{ color: '#10B981', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>
              {isPlayoff ? 'Playoffs abgeschlossen' : 'Reguläre Saison abgeschlossen'}
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)', marginTop: 2 }}>
              {league.name} · Saison {league.season} · alle Spiele gespielt
            </div>
          </div>
          <span style={{
            fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
            color: 'var(--th-text-muted)', flexShrink: 0,
          }}>
            Spielplan auf dartunion.de
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scheduled.map((m) => {
              const homeTeam = getExtendedTeam(m.homeTeamId);
              const awayTeam = getExtendedTeam(m.awayTeamId);
              return (
                <div key={m.id} className="mdu-spielplan-card" style={{
                  background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  {/* Date/time row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Icon name="calendar" size={12} stroke={2} style={{ color: 'var(--th-text-muted)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)' }}>
                      {formatScheduledDate(m.date)}{m.time ? ` · ${m.time} Uhr` : ''}
                    </span>
                    <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', padding: '2px 8px', background: 'var(--th-line-4)', borderRadius: 4 }}>
                      {getVenueForTeamInSeason(m.homeTeamId, 'season-2026')?.name ?? 'Ort folgt'}
                    </span>
                  </div>
                  {/* Teams row — 3-col grid, no overflow */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'center', gap: 8 }}>
                    <TeamLink teamId={m.homeTeamId} competitionId={league.id} teamName={homeTeam.name} style={{ display: 'flex', width: '100%', gap: 10, justifyContent: 'flex-end', minWidth: 0 }}>
                      <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {homeTeam.name}
                      </span>
                      <TeamBadge initials={homeTeam.short.slice(0, 3)} color={homeTeam.color} logoUrl={homeTeam.logoUrl} size={28} />
                    </TeamLink>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', textAlign: 'center' }}>vs</div>
                    <TeamLink teamId={m.awayTeamId} competitionId={league.id} teamName={awayTeam.name} style={{ display: 'flex', width: '100%', gap: 10, minWidth: 0 }}>
                      <TeamBadge initials={awayTeam.short.slice(0, 3)} color={awayTeam.color} logoUrl={awayTeam.logoUrl} size={28} />
                      <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {awayTeam.name}
                      </span>
                    </TeamLink>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontStyle: 'italic' }}>
            Vollständiger Spielplan auf{' '}
            <span style={{ color: 'var(--th-text-muted)' }}>dartunion.de</span>.
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

  return (
    <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '30px 28px 60px' }}>

      {/* Status banner — Saison 2025/2026 ist abgeschlossen (auch die Playoffs) */}
      <div style={{
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <Icon
          name="check"
          size={16} stroke={2}
          style={{ color: '#10B981', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>
            {isPlayoff ? 'Playoffs · abgeschlossen' : 'Reguläre Saison · abgeschlossen'}
          </div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)', marginTop: 2 }}>
            {league.name} · Saison {league.season}
          </div>
        </div>
        <span style={{
          fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
          color: 'var(--th-text-muted)', flexShrink: 0,
        }}>
          Alle Ergebnisse auf dartunion.de
        </span>
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
                  letterSpacing: '0.14em', color: 'var(--th-text-faint)', textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  {matchday}. Spieltag
                </div>
              )}
              <div style={{
                background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
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
                        background: 'var(--th-line-3)',
                        border: '1px solid var(--th-line-6)',
                      }}>
                        {/* Date row */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                          fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)',
                        }}>
                          <Icon name="calendar" size={12} stroke={2} style={{ color: 'var(--th-text-muted)', flexShrink: 0 }} />
                          <span>{formatMatchDate(m.date)}</span>
                        </div>
                        {/* Teams + Score — 3-col, mobile-safe */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr', alignItems: 'center', gap: 8 }}>
                          <TeamLink teamId={m.homeTeamId} competitionId={league.id} teamName={home.name} style={{ display: 'flex', width: '100%', gap: 8, justifyContent: 'flex-end', minWidth: 0 }}>
                            <span className="mdu-link-name" style={{
                              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                              color: homeWon ? 'var(--th-text-strong)' : 'var(--th-text-muted)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {home.name}
                            </span>
                            <TeamBadge initials={home.short.slice(0, 3)} color={home.color} logoUrl={home.logoUrl} size={26} />
                          </TeamLink>
                          <div style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20,
                            color: 'var(--th-text-strong)',
                            background: 'var(--th-line-6)', borderRadius: 6, padding: '3px 0',
                          }}>
                            {m.result ? `${m.result.home}:${m.result.away}` : '—'}
                          </div>
                          <TeamLink teamId={m.awayTeamId} competitionId={league.id} teamName={away.name} style={{ display: 'flex', width: '100%', gap: 8, minWidth: 0 }}>
                            <TeamBadge initials={away.short.slice(0, 3)} color={away.color} logoUrl={away.logoUrl} size={26} />
                            <span className="mdu-link-name" style={{
                              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                              color: awayWon ? 'var(--th-text-strong)' : 'var(--th-text-muted)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {away.name}
                            </span>
                          </TeamLink>
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
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel>Saisonbilanz · {league.name}</SectionLabel>
          <div className="mdu-table-scroll">
            <div className="mdu-standings-inner">
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 90px 90px 60px',
                padding: '8px 4px', borderBottom: '1px solid var(--th-line-8)',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.1em', color: 'var(--th-text-muted)', textTransform: 'uppercase',
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
                    borderBottom: i < rows.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                    fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
                      color: 'var(--th-text-muted)',
                    }}>
                      {r.pos}
                    </span>
                    <TeamLink teamId={r.team} competitionId={league.id} teamName={r.name.replace(' *', '')} style={{ display: 'flex', gap: 8, minWidth: 0 }}>
                      <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={22} />
                      <span className="mdu-link-name" style={{
                        fontWeight: 700, color: 'var(--th-text-strong)', fontSize: 13,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {r.name.replace(' *', '')}
                      </span>
                    </TeamLink>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)',
                      textAlign: 'center',
                    }}>
                      {r.s}·{r.u}·{r.n}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)',
                      textAlign: 'center',
                    }}>
                      {r.legs}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                      color: 'var(--th-text-strong)', textAlign: 'right',
                    }}>
                      {r.pts}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 12, fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', fontStyle: 'italic' }}>
            Quelle: dartunion.de · Einzelergebnisse (Spieltag-Details) unter{' '}
            <span style={{ color: 'var(--th-text-muted)' }}>dartunion.de</span>
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

// ── Player Avatar (shared within this file) ──────────────────

function PlayerAvatar({ name, size = 30 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = getPlayerPhotoByName(name);
  const initials = getInitialsFromName(name);
  const showPhoto = photoUrl && !imgError;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: showPhoto ? 'var(--th-bg-inset)' : 'var(--th-line-8)',
      border: `1px solid ${showPhoto ? 'var(--th-line-18)' : 'rgba(255,255,255,0.12)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900,
      fontSize: Math.max(9, Math.round(size * 0.37)), color: 'var(--th-text-muted)',
    }}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={initials} onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center top', display: 'block' }} />
      ) : (
        initials
      )}
    </div>
  );
}

// ── Statistiken Tab ───────────────────────────────────────────

function StatistikTab({ stats, league, onSelectPlayer }: { stats: PlayerStatEntry[]; league: LeagueShape; onSelectPlayer: (entry: PlayerStatEntry) => void }) {
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
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <div style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
            letterSpacing: '0.08em', color: 'var(--th-text-strong)', margin: '0 0 18px',
            textTransform: 'uppercase',
          }}>
            Einzelrangliste
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)',
            marginBottom: 16, fontStyle: 'italic',
          }}>
            Quelle: dartunion.de · Saison 2026 · Top-Spieler der {league.name}
          </div>

          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 72px 80px',
            padding: '10px 8px', borderBottom: '1px solid var(--th-line-8)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.1em', color: 'var(--th-text-muted)', textTransform: 'uppercase',
            gap: 6, alignItems: 'center',
          }}>
            <span>#</span>
            <span>Spieler</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>W · N</span>
            <span style={{ textAlign: 'center' }}>Legs</span>
            <span style={{ textAlign: 'right' }}>Pkt.</span>
          </div>

          {stats.map((p, i) => {
            const td = getExtendedTeam(p.teamId);
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 72px 80px',
                padding: '11px 8px',
                borderBottom: i < stats.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
                gap: 6,
                background: i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
              }}>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
                  color: p.rank <= 3 ? 'var(--th-gold)' : 'var(--th-text-muted)',
                }}>
                  {p.rank}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectPlayer(p)}
                  aria-label={`Spielerprofil von ${p.name} öffnen`}
                  className="mdu-entity-link"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                >
                  <PlayerAvatar name={p.name} size={36} />
                  <span className="mdu-link-name" style={{
                    fontWeight: 700, color: 'var(--th-text-strong)', fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.name}
                  </span>
                </button>
                <TeamLink teamId={p.teamId} competitionId={league.id} teamName={p.teamName} style={{ display: 'flex', gap: 8, minWidth: 0 }}>
                  <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={20} />
                  <span className="mdu-link-name" style={{
                    color: 'var(--th-text-muted)', fontSize: 12,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.teamName}
                  </span>
                </TeamLink>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)',
                  textAlign: 'center',
                }}>
                  {p.wins}·{p.losses}
                </span>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)',
                  textAlign: 'center',
                }}>
                  {p.legsWon != null && p.legsLost != null ? `${p.legsWon}:${p.legsLost}` : '–'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                  color: 'var(--th-text-strong)', textAlign: 'right',
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
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {/* Heading */}
          <div style={{ padding: '14px 14px 0' }}>
            <div style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
              letterSpacing: '0.06em', color: 'var(--th-text-strong)', textTransform: 'uppercase', marginBottom: 4,
            }}>
              Einzelrangliste
            </div>
            <div style={{
              fontFamily: 'var(--font-manrope)', fontSize: 10, color: 'var(--th-text-faint)',
              fontStyle: 'italic', marginBottom: 10,
            }}>
              Quelle: dartunion.de · {league.name}
            </div>
          </div>

          {/* 2-row card rows: name+badge / stats line */}
          <div style={{ borderTop: '1px solid var(--th-line-6)' }}>
            {stats.map((p, i) => {
              const td = getExtendedTeam(p.teamId);
              const games = p.wins + p.losses;
              return (
                <button key={i} type="button" onClick={() => onSelectPlayer(p)}
                  aria-label={`Spielerprofil von ${p.name} öffnen`}
                  className="mdu-kader-row" style={{
                  display: 'block', width: '100%', textAlign: 'left', border: 'none',
                  padding: '9px 14px',
                  borderBottom: i < stats.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  background: i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
                }}>
                  {/* Row 1: rank · avatar · name · badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14,
                      color: p.rank <= 3 ? 'var(--th-gold)' : 'var(--th-text-muted)', flexShrink: 0, width: 22,
                    }}>
                      {p.rank}
                    </span>
                    <PlayerAvatar name={p.name} size={28} />
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, color: 'var(--th-text-strong)', fontSize: 12,
                      flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </span>
                    <div title={p.teamName} style={{ flexShrink: 0 }}>
                      <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={22} />
                    </div>
                  </div>
                  {/* Row 2: stats — indent: rank(22) + gap(8) + avatar(28) + gap(8) = 66 */}
                  <div style={{
                    paddingLeft: 66,
                    fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--th-text-faint)',
                    letterSpacing: '0.02em',
                  }}>
                    <span style={{ color: 'var(--th-text-muted)', fontWeight: 700, fontFamily: 'var(--font-saira-condensed)', fontSize: 13 }}>
                      {p.pts} Pkt.
                    </span>
                    <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                    {games} Sp.
                    <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                    {p.wins} G
                    <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                    {p.losses} V
                    {p.legsWon != null && p.legsLost != null && (
                      <>
                        <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                        {p.legsWon}:{p.legsLost} Legs
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* UT-10: Die Einzelrangliste bleibt als EINE Statistik erhalten; weitere
          (Team-)Statistiken folgen — hier als klarer Coming-Soon-Platzhalter. */}
      <div style={{
        marginTop: 16,
        background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-8)',
        borderRadius: 14, padding: '26px 24px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
        }}>
          <Icon name="bar" size={22} stroke={2} style={{ color: 'var(--th-accent)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
              letterSpacing: '0.04em', color: 'var(--th-text-strong)', textTransform: 'uppercase',
            }}>
              Weitere Statistiken
            </span>
            <span style={{
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 10,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--th-accent)', background: 'var(--th-accent-a12)',
              border: '1px solid var(--th-accent-a25)', borderRadius: 999, padding: '3px 9px',
            }}>
              Coming Soon
            </span>
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.5,
          }}>
            Aktuell zeigen wir die Einzelrangliste. Weitere Auswertungen (z. B. Team- und
            Leg-Statistiken) sind in Arbeit.
          </div>
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
              href={`/teams/${r.team}?competition=${league.id}`}
              aria-label={`Teamprofil von ${r.name.replace(' *', '')} öffnen`}
              style={{ textDecoration: 'none' }}
              className="mdu-card-hover"
            >
              <div style={{
                background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
                borderRadius: 12, padding: '16px 18px', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: 3, height: '100%',
                  background: td.color, borderRadius: '12px 0 0 12px',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: 6 }}>
                  <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={32} />
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                      color: 'var(--th-text-strong)', textTransform: 'uppercase', letterSpacing: '0.02em',
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
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', flexShrink: 0, width: 80 }}>{item.k}</span>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 600, color: 'var(--th-text-body)' }}>{item.v}</span>
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

export function LeagueDetailClient({ rows, league, teamInfoMap, stats, matches, initialTab = 0 }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab); // initialTab from ?tab= query param, else 0 (Übersicht)
  const [card, setCard] = useState<PlayerCardData | null>(null);

  // Open the player card from an Einzelrangliste entry (resolve player by name).
  const openPlayer = (entry: PlayerStatEntry) => {
    const seasonId = getCurrentSeason().id;
    const { stats: builtStats, player } = getPlayerSeasonStatsFromEntry(entry, seasonId);
    const td = getExtendedTeam(entry.teamId);
    setCard({
      playerId: player?.id ?? null,
      displayName: player ? getPlayerDisplayName(player) : entry.name,
      nickname: player?.nickname ?? null,
      photoUrl: player?.photoUrl ?? getPlayerPhotoByName(entry.name),
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamColor: td.color,
      stats: builtStats,
    });
  };

  return (
    <>
      {/* Tab bar — visually merges with the banner above.
          UT-09 B: klebt unterhalb des 70px hohen Site-Headers (sticky, z-index 50);
          top:0 ließ die Leiste beim Scrollen unter den Header rutschen → dort
          nicht mehr klickbar. */}
      <div style={{
        borderTop: '1px solid var(--th-line-6)',
        background: 'var(--th-bg-tabbar1)',
        position: 'sticky', top: 70, zIndex: 10,
      }}>
        <div
          className="mdu-tabs-row"
          style={{
            maxWidth: 1280, margin: '0 auto', padding: '0 28px',
            display: 'flex', alignItems: 'center', gap: 36, overflowX: 'auto', overflowY: 'hidden',
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '16px 0',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                color: i === activeTab ? 'var(--th-accent)' : 'var(--th-text-muted)',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: i === activeTab ? '2px solid var(--th-accent)' : '2px solid transparent',
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
        <ÜbersichtTab rows={rows} league={league} teamInfoMap={teamInfoMap} matches={matches} stats={stats} onSelectPlayer={openPlayer} />
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
        <StatistikTab stats={stats} league={league} onSelectPlayer={openPlayer} />
      )}
      {activeTab === 5 && (
        <TeamsTab rows={rows} league={league} teamInfoMap={teamInfoMap} />
      )}

      {card && <PlayerCard data={card} onClose={() => setCard(null)} />}
    </>
  );
}
