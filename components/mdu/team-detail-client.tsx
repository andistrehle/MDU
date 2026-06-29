'use client';

import { useState } from 'react';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { PlayerCard, type PlayerCardData } from './player-card';
import {
  getExtendedTeam, formatMatchDate, formatScheduledDate, findLeague,
  getPlayerPhotoByName, getInitialsFromName, formatWinRate,
  getPlayerSeasonStatsFromEntry, getPlayerDisplayName,
} from '@/lib/data';
import type { StandingRow, PlayerStatEntry, SeasonPlayerStats } from '@/lib/data';
import type { Match } from '@/lib/data/matches';

// ── Types ─────────────────────────────────────────────────────

export interface RosterEntry {
  playerId: string;
  displayName: string;
  nickname: string | null;
  licenseNumber: string | null;
  isCaptain: boolean;
  photoUrl?: string;
  teamName: string;
  /** Season stats for the player. Zeroed (hasOfficialStats=false) when unmatched. */
  stats: SeasonPlayerStats;
}

interface Props {
  teamId: string;
  teamColor: string;
  seasonId: string;
  seasonName: string;
  leagueName: string;
  leagueId: string;
  captainLabel: string;
  venueName: string;
  venueAddress: string;
  standing: StandingRow | null;
  roster: RosterEntry[];
  scheduledMatches: Match[];
  completedMatches: Match[];
  /** Player statistics for the current competition. Empty array = no data yet. */
  stats: PlayerStatEntry[];
}

const TABS = ['Übersicht', 'Kader', 'Spielplan', 'Ergebnisse', 'Statistik', 'Galerie'];

// ── Shared helpers ─────────────────────────────────────────────

function SectionLabel({ children, color = 'var(--th-accent)' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
      letterSpacing: '0.16em', color, textTransform: 'uppercase', marginBottom: 14,
    }}>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280',
      fontStyle: 'italic', padding: '16px 0',
    }}>
      {children}
    </div>
  );
}

// ── Übersicht Tab ──────────────────────────────────────────────

function ÜbersichtTab({
  teamId, teamColor, seasonName, leagueName, captainLabel, venueName, venueAddress, standing, scheduledMatches,
}: Omit<Props, 'roster' | 'completedMatches' | 'leagueId' | 'stats' | 'seasonId'>) {
  const nextMatch = scheduledMatches[0] ?? null;

  return (
    <div className="mdu-team-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Next match */}
        <div style={{
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel color={teamColor}>Nächstes Spiel</SectionLabel>
          {nextMatch ? (
            <NextMatchCard match={nextMatch} teamId={teamId} teamColor={teamColor} />
          ) : (
            <EmptyNote>
              Keine bevorstehenden Spiele — Spielplan auf{' '}
              <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>dartunion.de</a>.
            </EmptyNote>
          )}
        </div>

        {/* Team info */}
        <div style={{
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel color={teamColor}>Team Info</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="trophy" size={14} stroke={2} style={{ flexShrink: 0, color: 'var(--th-text-muted)' }} />
              <span>{leagueName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="pin" size={14} stroke={2} style={{ flexShrink: 0, marginTop: 1, color: 'var(--th-text-muted)' }} />
              <div>
                <div>{venueName}</div>
                {venueAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venueName}, ${venueAddress}`)}`}
                    target="_blank" rel="noopener noreferrer" title="In Google Maps öffnen"
                    style={{ display: 'inline-block', fontSize: 11, color: 'var(--th-accent)', marginTop: 3, lineHeight: 1.5, textDecoration: 'none' }}
                  >
                    {venueAddress}
                  </a>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="user" size={14} stroke={2} style={{ flexShrink: 0, color: 'var(--th-text-muted)' }} />
              {captainLabel === 'Noch nicht verfügbar'
                ? <span style={{ color: '#6B7280', fontStyle: 'italic' }}>Kapitän noch nicht verfügbar</span>
                : <span><span style={{ color: 'var(--th-text-dim)', marginRight: 4 }}>TC:</span>{captainLabel}</span>
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280' }}>
              <Icon name="globe" size={14} stroke={2} style={{ flexShrink: 0 }} />
              <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
                style={{ color: '#6B7280', textDecoration: 'none' }}>dartunion.de</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right column — season stats */}
      <div>
        <div style={{
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel color={teamColor}>{seasonName}</SectionLabel>
          {standing ? (
            <>
              {/* ── KPI summary chips ─────────────────────── */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {([
                  { label: 'Platz',    value: `#${standing.pos}`, accent: teamColor },
                  { label: 'Punkte',   value: String(standing.pts), accent: 'var(--th-text-strong)' },
                  { label: 'Gespielt', value: String(standing.sp),  accent: 'var(--th-text-strong)' },
                ] as { label: string; value: string; accent: string }[]).map(chip => (
                  <div key={chip.label} style={{
                    flex: 1, minWidth: 56, textAlign: 'center',
                    background: 'var(--th-line-4)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, padding: '8px 6px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 4 }}>
                      {chip.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: chip.accent, lineHeight: 1 }}>
                      {chip.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Win/draw/loss distribution bar (shared scale = sp) ── */}
              {standing.sp > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
                    <div style={{ flex: standing.s || 0.001, background: '#22C55E' }} />
                    {standing.u > 0 && <div style={{ flex: standing.u, background: 'var(--th-gold)' }} />}
                    <div style={{ flex: standing.n || 0.001, background: '#EF4444' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontFamily: 'var(--font-manrope)', fontSize: 10, flexWrap: 'wrap' }}>
                    <span style={{ color: '#22C55E' }}>● {standing.s}  S</span>
                    {standing.u > 0 && <span style={{ color: 'var(--th-gold)' }}>● {standing.u}  U</span>}
                    <span style={{ color: '#EF4444' }}>● {standing.n}  N</span>
                    <span style={{ color: 'var(--th-text-faint)', marginLeft: 'auto' }}>von {standing.sp} Spielen</span>
                  </div>
                </div>
              )}

              {/* ── Stats rows — label + number, no bars ────── */}
              {(() => {
                // Diff = "for" − "against", parsed from a "X:Y" balance string.
                // Returns null when the balance isn't available (no fake values).
                const diffFromBalance = (balance?: string): string | null => {
                  if (!balance) return null;
                  const [f, a] = balance.split(':').map(n => parseInt(n, 10));
                  if (Number.isNaN(f) || Number.isNaN(a)) return null;
                  const d = f - a;
                  return d > 0 ? `+${d}` : String(d);
                };
                const diffColor = (d: string | null): string =>
                  d == null ? 'var(--th-text-faint)'
                    : d.startsWith('+') ? '#22C55E'
                    : d === '0' ? 'var(--th-text-muted)'
                    : '#EF4444';
                const spieleDiff = diffFromBalance(standing.spiele);
                const legDiff    = diffFromBalance(standing.legs);
                return ([
                  { l: 'Punkte',        v: `${standing.pts} Pkt.`,    c: 'var(--th-text-strong)' },
                  { l: 'Spiele-Bilanz', v: standing.spiele ?? '—',    c: 'var(--th-text-muted)', mono: true },
                  { l: 'Legs-Bilanz',   v: standing.legs,             c: 'var(--th-text-muted)', mono: true },
                  { l: 'Spiele-Diff.',  v: spieleDiff ?? '—',         c: diffColor(spieleDiff),  mono: true },
                  { l: 'Leg-Diff.',     v: legDiff ?? '—',            c: diffColor(legDiff),     mono: true },
                ] as { l: string; v: string; c: string; mono?: boolean }[]);
              })().map(row => (
                <div key={row.l} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid var(--th-line-4)',
                }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>{row.l}</span>
                  <span style={{
                    fontFamily: row.mono ? 'var(--font-jetbrains-mono)' : 'var(--font-manrope)',
                    fontWeight: 700, fontSize: row.mono ? 11 : 13, color: row.c,
                  }}>{row.v}</span>
                </div>
              ))}
            </>
          ) : (
            <EmptyNote>Keine Saison-Daten verfügbar.</EmptyNote>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Next Match mini-card ───────────────────────────────────────

function NextMatchCard({ match, teamId, teamColor }: { match: Match; teamId: string; teamColor: string }) {
  const isHome   = match.homeTeamId === teamId;
  const oppId    = isHome ? match.awayTeamId    : match.homeTeamId;
  const oppName  = isHome ? match.awayTeamName  : match.homeTeamName;
  const opponent = getExtendedTeam(oppId);
  const league   = findLeague(match.leagueId)?.name ?? match.leagueId;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: teamColor, textTransform: 'uppercase' }}>
          {league}{match.matchday ? ` · Spieltag ${match.matchday}` : ''}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-dim)' }}>
          {formatScheduledDate(match.date)}{match.time ? ` · ${match.time} Uhr` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: isHome ? '#22C55E' : 'var(--th-gold)',
          background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,74,0.1)',
          border: isHome ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(232,184,74,0.25)',
          borderRadius: 4, padding: '2px 6px', flexShrink: 0,
        }}>
          {isHome ? 'Heim' : 'Auswärts'}
        </span>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>vs</span>
        <TeamLink teamId={oppId} teamName={oppName} style={{ gap: 10, minWidth: 0 }}>
          <TeamBadge initials={opponent.short.slice(0, 3)} color={opponent.color} logoUrl={opponent.logoUrl} size={26} />
          <span className="mdu-link-name" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {oppName}
          </span>
        </TeamLink>
      </div>
    </div>
  );
}

// ── Kader Tab ──────────────────────────────────────────────────

function KaderTab({
  roster, captainLabel, teamColor, onSelect,
}: {
  roster: RosterEntry[];
  captainLabel: string;
  teamColor: string;
  onSelect: (entry: RosterEntry) => void;
}) {
  // Roster arrives already ranked by performance from the server.
  const sorted = roster;

  // ── Empty state (no full roster) ──────────────────────────────
  if (sorted.length === 0) {
    return (
      <div style={{
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
        borderRadius: 14, padding: '22px 24px',
      }}>
        {captainLabel !== 'Noch nicht verfügbar' ? (
          <>
            {/* Desktop: single captain table row */}
            <div className="mdu-desktop-only">
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 180px 80px',
                padding: '10px 0', borderBottom: '1px solid var(--th-line-6)',
                fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', color: 'var(--th-text-dim)', textTransform: 'uppercase', gap: 12,
              }}>
                <span>#</span><span>Name</span><span>Passnr.</span><span>Rolle</span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 180px 80px',
                padding: '12px 0', alignItems: 'center', gap: 12,
                borderBottom: '1px solid var(--th-line-4)',
              }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--th-text-faint2)', fontSize: 12 }}>01</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={captainLabel.slice(0, 2)} color={teamColor} />
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>{captainLabel}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6B7280' }}>—</span>
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-gold)' }}>TC</span>
              </div>
            </div>

            {/* Mobile: captain card */}
            <div className="mdu-mobile-only" style={{
              borderBottom: '1px solid var(--th-line-4)', paddingBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--th-text-faint2)', fontSize: 11, width: 20, textAlign: 'right', flexShrink: 0 }}>01</span>
                <Avatar initials={captainLabel.slice(0, 2)} color={teamColor} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {captainLabel}
                    </span>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                      TC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
              Vollständiger Kader folgt auf dartunion.de.
            </div>
          </>
        ) : (
          <EmptyNote>Noch keine Spielerdaten verfügbar.</EmptyNote>
        )}
      </div>
    );
  }

  const anyStats = sorted.some(p => p.stats.hasOfficialStats);

  // ── Full roster ───────────────────────────────────────────────
  return (
    <div>
      {anyStats && (
        <div style={{
          fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)',
          fontStyle: 'italic', margin: '0 0 12px 2px',
        }}>
          Sortiert nach Leistung · Statistik aus der Einzelrangliste · Quelle: dartunion.de
        </div>
      )}

      <div style={{
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* ── Desktop table ───────────────────────────────── */}
        <div className="mdu-desktop-only mdu-table-scroll">
          <div style={{ minWidth: 660 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '34px 1fr 92px 48px 128px 60px 48px',
              padding: '12px 18px', borderBottom: '1px solid var(--th-line-8)',
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
              letterSpacing: '0.12em', color: 'var(--th-text-dim)', textTransform: 'uppercase', gap: 10,
              alignItems: 'center',
            }}>
              <span>#</span>
              <span>Spieler</span>
              <span>Passnr.</span>
              <span style={{ textAlign: 'center' }}>Rang</span>
              <span style={{ textAlign: 'center' }}>Bilanz</span>
              <span style={{ textAlign: 'center' }}>Quote</span>
              <span style={{ textAlign: 'right' }}>Pkt.</span>
            </div>

            {sorted.map((p, i) => {
              const s = p.stats;
              const has = s.hasOfficialStats;
              return (
                <button
                  key={p.playerId || i}
                  type="button"
                  onClick={() => onSelect(p)}
                  className="mdu-kader-row"
                  style={{
                    display: 'grid', gridTemplateColumns: '34px 1fr 92px 48px 128px 60px 48px',
                    width: '100%', padding: '11px 18px', border: 'none', background: 'none',
                    borderBottom: i < sorted.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                    alignItems: 'center', gap: 10,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--th-text-faint2)', fontSize: 12 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar initials={p.displayName.slice(0, 2)} color={teamColor} photoUrl={p.photoUrl} />
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.displayName || 'Name nicht verfügbar'}
                    </span>
                    {p.isCaptain && (
                      <span style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9, color: 'var(--th-gold)',
                        background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)',
                        borderRadius: 3, padding: '1px 4px', flexShrink: 0,
                      }}>
                        TC
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)' }}>
                    {p.licenseNumber ?? '—'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 15, textAlign: 'center',
                    color: s.rank !== null && s.rank <= 3 ? 'var(--th-gold)' : 'var(--th-text-muted)',
                  }}>
                    {s.rank !== null ? `#${s.rank}` : '–'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, textAlign: 'center',
                    color: has ? 'var(--th-text-body)' : 'var(--th-text-faint2)',
                  }}>
                    {has ? s.singlesBalance : '–'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, textAlign: 'center',
                    color: s.winRate !== null ? '#22C55E' : 'var(--th-text-faint2)',
                  }}>
                    {formatWinRate(s.winRate)}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, textAlign: 'right',
                    color: has ? 'var(--th-text-strong)' : 'var(--th-text-faint2)',
                  }}>
                    {s.points !== null ? s.points : '–'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Mobile card list ────────────────────────────── */}
        <div className="mdu-mobile-only">
          {sorted.map((p, i) => {
            const s = p.stats;
            const has = s.hasOfficialStats;
            return (
              <button
                key={p.playerId || i}
                type="button"
                onClick={() => onSelect(p)}
                className="mdu-kader-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 16px', border: 'none', background: 'none',
                  borderBottom: i < sorted.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                }}
              >
                <Avatar initials={p.displayName.slice(0, 2)} color={teamColor} photoUrl={p.photoUrl} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + rank */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {p.displayName || 'Name nicht verfügbar'}
                    </span>
                    {p.isCaptain && (
                      <span style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, color: 'var(--th-gold)',
                        background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)',
                        borderRadius: 3, padding: '1px 5px', flexShrink: 0,
                      }}>
                        TC
                      </span>
                    )}
                    {s.rank !== null && (
                      <span style={{
                        fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 14, flexShrink: 0,
                        color: s.rank <= 3 ? 'var(--th-gold)' : 'var(--th-text-muted)',
                      }}>
                        #{s.rank}
                      </span>
                    )}
                  </div>
                  {/* Stats line / placeholder */}
                  {has ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)' }}>
                        {s.singlesBalance} Einzelspiele · {formatWinRate(s.winRate)}
                        {s.legBalance ? ` · Legs ${s.legBalance}` : ''}
                      </span>
                      <span style={{
                        marginLeft: 'auto', fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 13,
                        color: 'var(--th-text-body)', flexShrink: 0,
                      }}>
                        {s.points} Pkt.
                      </span>
                    </div>
                  ) : (
                    <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-faint)', marginTop: 3 }}>
                      {p.licenseNumber ? `Passnr.: ${p.licenseNumber}` : 'Noch keine Statistik'}
                    </div>
                  )}
                </div>
                <Icon name="chevron" size={15} stroke={2} style={{ color: 'var(--th-text-faint2)', flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}

function Avatar({
  initials, color, photoUrl, size = 30,
}: {
  initials: string; color: string; photoUrl?: string; size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = photoUrl && !imgError;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: showPhoto ? 'var(--th-bg-inset)' : `${color}22`,
      border: `1px solid ${showPhoto ? color + '55' : color + '44'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900,
      fontSize: Math.max(9, Math.round(size * 0.37)), color,
    }}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={initials}
          onError={() => setImgError(true)}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      ) : (
        initials.toUpperCase()
      )}
    </div>
  );
}

// ── Spielplan Tab ──────────────────────────────────────────────

function SpielplanTab({ teamId, scheduledMatches, teamColor }: { teamId: string; scheduledMatches: Match[]; teamColor: string }) {
  if (scheduledMatches.length === 0) {
    return (
      <div style={{
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
        borderRadius: 14, padding: '28px 24px',
      }}>
        <EmptyNote>Keine bevorstehenden Spiele — vollständiger Spielplan auf{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>dartunion.de</a>.
        </EmptyNote>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800 }}>
      {scheduledMatches.map(m => {
        const isHome  = m.homeTeamId === teamId;
        const oppId   = isHome ? m.awayTeamId   : m.homeTeamId;
        const oppName = isHome ? m.awayTeamName : m.homeTeamName;
        const opp     = getExtendedTeam(oppId);
        const league  = findLeague(m.leagueId)?.name ?? m.leagueId;

        return (
          <div key={m.id} className="mdu-spielplan-card" style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.1em', color: teamColor, textTransform: 'uppercase',
              }}>
                {league}{m.matchday ? ` · Spieltag ${m.matchday}` : ''}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-dim)' }}>
                {formatScheduledDate(m.date)}{m.time ? ` · ${m.time} Uhr` : ''}
              </span>
            </div>
            {/* Match row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                color: isHome ? '#22C55E' : 'var(--th-gold)',
                background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,74,0.1)',
                border: isHome ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(232,184,74,0.25)',
                borderRadius: 4, padding: '2px 7px',
              }}>
                {isHome ? 'Heim' : 'Auswärts'}
              </span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>vs</span>
              <TeamLink teamId={oppId} teamName={oppName} style={{ gap: 10, minWidth: 0 }}>
                <TeamBadge initials={opp.short.slice(0, 3)} color={opp.color} logoUrl={opp.logoUrl} size={28} />
                <span className="mdu-link-name" style={{
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {oppName}
                </span>
              </TeamLink>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Ergebnisse Tab ─────────────────────────────────────────────

function ErgebnisseTab({ teamId, completedMatches, teamColor }: { teamId: string; completedMatches: Match[]; teamColor: string }) {
  if (completedMatches.length === 0) {
    return (
      <div style={{
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
        borderRadius: 14, padding: '28px 24px',
      }}>
        <EmptyNote>Noch keine Ergebnisse — aktuelle Ergebnisse auf{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>dartunion.de</a>.
        </EmptyNote>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 800 }}>
      {completedMatches.map(m => {
        const isHome   = m.homeTeamId === teamId;
        const oppId    = isHome ? m.awayTeamId   : m.homeTeamId;
        const oppName  = isHome ? m.awayTeamName : m.homeTeamName;
        const opp      = getExtendedTeam(oppId);
        const league   = findLeague(m.leagueId)?.name ?? m.leagueId;
        const myScore  = m.result ? (isHome ? m.result.home : m.result.away) : null;
        const oppScore = m.result ? (isHome ? m.result.away : m.result.home) : null;
        const outcome  = myScore === null ? null
          : myScore > oppScore! ? 'win'
          : myScore < oppScore! ? 'loss'
          : 'draw';

        const outcomeColor  = outcome === 'win' ? '#22C55E' : outcome === 'loss' ? '#EF4444' : 'var(--th-gold)';
        const outcomeLetter = outcome === 'win' ? 'S' : outcome === 'loss' ? 'N' : 'U';
        const outcomeLabel  = outcome === 'win' ? 'Sieg' : outcome === 'loss' ? 'Niederlage' : 'Unentschieden';

        return (
          <div key={m.id} className="mdu-spielplan-card" style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 12, padding: '14px 16px',
          }}>
            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.1em', color: teamColor, textTransform: 'uppercase',
              }}>
                {league}{m.matchday ? ` · Spieltag ${m.matchday}` : ''}
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-dim)' }}>
                {formatMatchDate(m.date)}
              </span>
            </div>
            {/* Match row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 10 }}>
              {/* Home/Away indicator + Opponent */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
                  letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                  color: isHome ? '#22C55E' : 'var(--th-gold)',
                  background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,74,0.1)',
                  border: isHome ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(232,184,74,0.25)',
                  borderRadius: 4, padding: '2px 7px',
                }}>
                  {isHome ? 'H' : 'A'}
                </span>
                <TeamLink teamId={oppId} teamName={oppName} style={{ gap: 8, minWidth: 0 }}>
                  <TeamBadge initials={opp.short.slice(0, 3)} color={opp.color} logoUrl={opp.logoUrl} size={24} />
                  <span className="mdu-link-name" style={{
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {oppName}
                  </span>
                </TeamLink>
              </div>
              {/* Score */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                {m.result ? (
                  <span style={{
                    fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: 'var(--th-text-strong)',
                    background: 'var(--th-line-6)', borderRadius: 6, padding: '3px 10px', display: 'inline-block',
                  }}>
                    {isHome ? m.result.home : m.result.away}:{isHome ? m.result.away : m.result.home}
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: 'var(--th-text-faint)' }}>—</span>
                )}
              </div>
              {/* Outcome badge */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {outcome !== null && (
                  <span style={{
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
                    color: outcomeColor,
                    background: `${outcomeColor}15`,
                    border: `1px solid ${outcomeColor}40`,
                    borderRadius: 4, padding: '2px 8px',
                  }}>
                    {outcomeLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Statistik Tab ──────────────────────────────────────────────

function StatistikTab({
  stats,
  teamId,
  teamColor,
  leagueName,
  onSelectEntry,
}: {
  stats: PlayerStatEntry[];
  teamId: string;
  teamColor: string;
  leagueName: string;
  onSelectEntry: (entry: PlayerStatEntry) => void;
}) {
  if (stats.length === 0) {
    return (
      <div style={{
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
        borderRadius: 14, padding: '36px 24px',
        fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Icon name="bar" size={16} stroke={2} style={{ color: '#6B7280', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: 'var(--th-text-muted)' }}>Statistiken noch nicht verfügbar</span>
        </div>
        <div>
          Einzelrangliste folgt auf{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>dartunion.de</a>.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop: rich 5-column scrollable table ── */}
      <div className="mdu-desktop-only mdu-table-scroll" style={{ maxWidth: 800 }}>
        <div className="mdu-standings-inner" style={{
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, padding: '22px 24px',
          minWidth: 560,
        }}>
          <div style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20,
            letterSpacing: '0.06em', color: 'var(--th-text-strong)', margin: '0 0 6px',
            textTransform: 'uppercase',
          }}>
            Einzelrangliste
          </div>
          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#6B7280', marginBottom: 18, fontStyle: 'italic' }}>
            {leagueName} · Saison 2026 · Quelle: dartunion.de
          </div>

          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 80px',
            padding: '10px 8px', borderBottom: '1px solid var(--th-line-8)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.1em', color: 'var(--th-text-muted)', textTransform: 'uppercase',
            gap: 6, alignItems: 'center',
          }}>
            <span>#</span>
            <span>Spieler</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>S · N</span>
            <span style={{ textAlign: 'right' }}>Pkt.</span>
          </div>

          {stats.map((p, i) => {
            const isOwnTeam = p.teamId === teamId;
            return (
              <button key={i} type="button" onClick={() => onSelectEntry(p)} className="mdu-kader-row" style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 80px',
                width: '100%', padding: '11px 8px', border: 'none',
                borderBottom: i < stats.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
                gap: 6,
                background: isOwnTeam ? `${teamColor}12` : i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
                borderLeft: isOwnTeam ? `3px solid ${teamColor}` : '3px solid transparent',
              }}>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
                  color: p.rank <= 3 ? 'var(--th-gold)' : 'var(--th-text-muted)',
                }}>
                  {p.rank}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar
                    initials={getInitialsFromName(p.name)}
                    color={teamColor}
                    photoUrl={getPlayerPhotoByName(p.name)}
                    size={36}
                  />
                  <span style={{
                    fontWeight: isOwnTeam ? 800 : 700,
                    color: 'var(--th-text-strong)',
                    fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.name}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    color: isOwnTeam ? teamColor : 'var(--th-text-muted)', fontSize: 12,
                    fontWeight: isOwnTeam ? 700 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {p.teamName}
                  </span>
                </div>
                <span style={{
                  fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)',
                  textAlign: 'center',
                }}>
                  {p.wins}·{p.losses}
                </span>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                  color: 'var(--th-text-strong)', textAlign: 'right',
                }}>
                  {p.pts}
                </span>
              </button>
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
              fontFamily: 'var(--font-manrope)', fontSize: 10, color: '#6B7280',
              fontStyle: 'italic', marginBottom: 10,
            }}>
              {leagueName} · Quelle: dartunion.de
            </div>
          </div>

          {/* 2-row card rows: name+badge / stats line */}
          <div style={{ borderTop: '1px solid var(--th-line-6)' }}>
            {stats.map((p, i) => {
              const td = getExtendedTeam(p.teamId);
              const isOwnTeam = p.teamId === teamId;
              const games = p.wins + p.losses;
              return (
                <button key={i} type="button" onClick={() => onSelectEntry(p)} className="mdu-kader-row" style={{
                  display: 'block', width: '100%', textAlign: 'left', border: 'none',
                  padding: '9px 14px',
                  borderBottom: i < stats.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  background: isOwnTeam ? `${teamColor}12` : i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
                  borderLeft: isOwnTeam ? `3px solid ${teamColor}` : '3px solid transparent',
                }}>
                  {/* Row 1: rank · name · badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14,
                      color: p.rank <= 3 ? 'var(--th-gold)' : 'var(--th-text-muted)', flexShrink: 0, width: 22,
                    }}>
                      {p.rank}
                    </span>
                    <Avatar
                      initials={getInitialsFromName(p.name)}
                      color={teamColor}
                      photoUrl={getPlayerPhotoByName(p.name)}
                      size={28}
                    />
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: isOwnTeam ? 800 : 700,
                      color: 'var(--th-text-strong)', fontSize: 12,
                      flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </span>
                    <div title={p.teamName} style={{ flexShrink: 0 }}>
                      <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={22} />
                    </div>
                  </div>
                  {/* Row 2: stats meta line — indent: rank(22) + gap(8) + avatar(28) + gap(8) = 66 */}
                  <div style={{
                    paddingLeft: 66,
                    fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: 'var(--th-text-faint)',
                    letterSpacing: '0.02em',
                  }}>
                    <span style={{
                      color: isOwnTeam ? teamColor : 'var(--th-text-muted)',
                      fontWeight: 700, fontFamily: 'var(--font-saira-condensed)', fontSize: 13,
                    }}>
                      {p.pts} Pkt.
                    </span>
                    <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                    {games} Sp.
                    <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                    {p.wins} G
                    <span style={{ margin: '0 5px', color: '#3A3E4A' }}>·</span>
                    {p.losses} V
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Placeholder tabs ───────────────────────────────────────────

function PlaceholderTab({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{
      background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
      borderRadius: 14, padding: '36px 24px',
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon name={icon as 'bar'} size={16} stroke={2} style={{ color: '#6B7280', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: 'var(--th-text-muted)' }}>{label} folgt</span>
      </div>
      <div>
        Daten werden auf{' '}
        <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>dartunion.de</a>{' '}
        veröffentlicht.
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────

export function TeamDetailClient({
  teamId,
  teamColor,
  seasonId,
  seasonName,
  leagueName,
  leagueId,
  captainLabel,
  venueName,
  venueAddress,
  standing,
  roster,
  scheduledMatches,
  completedMatches,
  stats,
}: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [card, setCard] = useState<PlayerCardData | null>(null);

  // Open the card for a roster player (playerId + stats already resolved).
  const openFromRoster = (entry: RosterEntry) => {
    setCard({
      playerId: entry.playerId,
      displayName: entry.displayName,
      nickname: entry.nickname,
      photoUrl: entry.photoUrl,
      teamId: entry.stats.teamId || teamId,
      teamName: entry.teamName,
      teamColor,
      stats: entry.stats,
    });
  };

  // Open the card from an Einzelrangliste entry (resolve player by name).
  const openFromEntry = (entry: PlayerStatEntry) => {
    const { stats: builtStats, player } = getPlayerSeasonStatsFromEntry(entry, seasonId);
    const td = getExtendedTeam(entry.teamId);
    setCard({
      playerId: player?.id ?? null,
      displayName: player ? getPlayerDisplayName(player) : entry.name,
      nickname: player?.nickname ?? null,
      photoUrl: player?.photoUrl ?? getPlayerPhotoByName(entry.name),
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamColor: entry.teamId === teamId ? teamColor : td.color,
      stats: builtStats,
    });
  };

  return (
    <>
      {/* Tab bar */}
      <div style={{
        borderTop: '1px solid var(--th-line-6)',
        background: 'var(--th-bg-tabbar2)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div
          className="mdu-tabs-row"
          style={{
            maxWidth: 1280, margin: '0 auto', padding: '0 32px',
            display: 'flex', alignItems: 'center', gap: 36, overflowX: 'auto',
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '18px 0',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                color: i === activeTab ? 'var(--th-text-strong)' : 'var(--th-text-dim)',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                borderBottom: i === activeTab ? `2px solid ${teamColor}` : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
                background: 'none', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="mdu-section-pad" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 64px' }}>
        {activeTab === 0 && (
          <ÜbersichtTab
            teamId={teamId}
            teamColor={teamColor}
            seasonName={seasonName}
            leagueName={leagueName}
            captainLabel={captainLabel}
            venueName={venueName}
            venueAddress={venueAddress}
            standing={standing}
            scheduledMatches={scheduledMatches}
          />
        )}
        {activeTab === 1 && (
          <KaderTab roster={roster} captainLabel={captainLabel} teamColor={teamColor} onSelect={openFromRoster} />
        )}
        {activeTab === 2 && (
          <SpielplanTab teamId={teamId} scheduledMatches={scheduledMatches} teamColor={teamColor} />
        )}
        {activeTab === 3 && (
          <ErgebnisseTab teamId={teamId} completedMatches={completedMatches} teamColor={teamColor} />
        )}
        {activeTab === 4 && (
          <StatistikTab
            stats={stats}
            teamId={teamId}
            teamColor={teamColor}
            leagueName={leagueName}
            onSelectEntry={openFromEntry}
          />
        )}
        {activeTab === 5 && <PlaceholderTab label="Galerie" icon="users" />}
      </div>

      {card && <PlayerCard data={card} onClose={() => setCard(null)} />}
    </>
  );
}
