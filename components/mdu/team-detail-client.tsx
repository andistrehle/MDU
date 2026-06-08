'use client';

import { useState } from 'react';
import { Icon } from './icon';
import { TeamBadge } from './team-badge';
import { getExtendedTeam, formatMatchDate, formatScheduledDate, findLeague, getPlayerPhotoByName, getInitialsFromName } from '@/lib/data';
import type { StandingRow, PlayerStatEntry } from '@/lib/data';
import type { Match } from '@/lib/data/matches';

// ── Types ─────────────────────────────────────────────────────

export interface RosterEntry {
  displayName: string;
  licenseNumber: string | null;
  isCaptain: boolean;
  photoUrl?: string;
}

interface Props {
  teamId: string;
  teamColor: string;
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

function SectionLabel({ children, color = '#D40000' }: { children: React.ReactNode; color?: string }) {
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
}: Omit<Props, 'roster' | 'completedMatches' | 'leagueId' | 'stats'>) {
  const nextMatch = scheduledMatches[0] ?? null;

  return (
    <div className="mdu-team-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Next match */}
        <div style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel color={teamColor}>Nächstes Spiel</SectionLabel>
          {nextMatch ? (
            <NextMatchCard match={nextMatch} teamId={teamId} teamColor={teamColor} />
          ) : (
            <EmptyNote>
              Keine bevorstehenden Spiele — Spielplan auf{' '}
              <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
                style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
            </EmptyNote>
          )}
        </div>

        {/* Team info */}
        <div style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel color={teamColor}>Team Info</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="trophy" size={14} stroke={2} style={{ flexShrink: 0, color: '#9AA4B2' }} />
              <span>{leagueName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="pin" size={14} stroke={2} style={{ flexShrink: 0, marginTop: 1, color: '#9AA4B2' }} />
              <div>
                <div>{venueName}</div>
                {venueAddress && (
                  <div style={{ fontSize: 11, color: '#8A8F9C', marginTop: 3, lineHeight: 1.5 }}>
                    {venueAddress}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="user" size={14} stroke={2} style={{ flexShrink: 0, color: '#9AA4B2' }} />
              {captainLabel === 'Noch nicht verfügbar'
                ? <span style={{ color: '#6B7280', fontStyle: 'italic' }}>Kapitän noch nicht verfügbar</span>
                : <span><span style={{ color: '#8A8F9C', marginRight: 4 }}>TC:</span>{captainLabel}</span>
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
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
        }}>
          <SectionLabel color={teamColor}>Saison {seasonName}</SectionLabel>
          {standing ? (
            <>
              {/* ── KPI summary chips ─────────────────────── */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {([
                  { label: 'Platz',    value: `#${standing.pos}`, accent: teamColor },
                  { label: 'Punkte',   value: String(standing.pts), accent: '#F5F6FA' },
                  { label: 'Gespielt', value: String(standing.sp),  accent: '#F5F6FA' },
                ] as { label: string; value: string; accent: string }[]).map(chip => (
                  <div key={chip.label} style={{
                    flex: 1, minWidth: 56, textAlign: 'center',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, padding: '8px 6px',
                  }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6A6E7B', marginBottom: 4 }}>
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
                    {standing.u > 0 && <div style={{ flex: standing.u, background: '#E8B84A' }} />}
                    <div style={{ flex: standing.n || 0.001, background: '#EF4444' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontFamily: 'var(--font-manrope)', fontSize: 10, flexWrap: 'wrap' }}>
                    <span style={{ color: '#22C55E' }}>● {standing.s}  S</span>
                    {standing.u > 0 && <span style={{ color: '#E8B84A' }}>● {standing.u}  U</span>}
                    <span style={{ color: '#EF4444' }}>● {standing.n}  N</span>
                    <span style={{ color: '#6A6E7B', marginLeft: 'auto' }}>von {standing.sp} Spielen</span>
                  </div>
                </div>
              )}

              {/* ── Stats rows — label + number, no bars ────── */}
              {([
                { l: 'Punkte',        v: `${standing.pts} Pkt.`, c: '#F5F6FA' },
                { l: 'Legs-Bilanz',   v: standing.legs,          c: '#9AA4B2', mono: true },
                ...(standing.spiele ? [{ l: 'Spiele-Bilanz', v: standing.spiele, c: '#9AA4B2', mono: true }] : []),
                { l: 'Diff.',         v: standing.diff,          c: standing.diff.startsWith('+') ? '#22C55E' : standing.diff === '0' ? '#9AA4B2' : '#EF4444', mono: true },
              ] as { l: string; v: string; c: string; mono?: boolean }[]).map(row => (
                <div key={row.l} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>{row.l}</span>
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
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#8A8F9C' }}>
          {formatScheduledDate(match.date)}{match.time ? ` · ${match.time} Uhr` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: isHome ? '#22C55E' : '#E8B84A',
          background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,74,0.1)',
          border: isHome ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(232,184,74,0.25)',
          borderRadius: 4, padding: '2px 6px', flexShrink: 0,
        }}>
          {isHome ? 'Heim' : 'Auswärts'}
        </span>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#9AA4B2' }}>vs</span>
        <TeamBadge initials={opponent.short.slice(0, 3)} color={opponent.color} logoUrl={opponent.logoUrl} size={26} />
        <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {oppName}
        </span>
      </div>
    </div>
  );
}

// ── Kader Tab ──────────────────────────────────────────────────

function KaderTab({ roster, captainLabel, teamColor }: { roster: RosterEntry[]; captainLabel: string; teamColor: string }) {

  // Prioritise captains on top, then alphabetical
  const sorted = [...roster].sort((a, b) => {
    if (a.isCaptain && !b.isCaptain) return -1;
    if (!a.isCaptain && b.isCaptain) return 1;
    return a.displayName.localeCompare(b.displayName, 'de');
  });

  // ── Empty state (no full roster) ──────────────────────────────
  if (sorted.length === 0) {
    return (
      <div style={{
        background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '22px 24px',
      }}>
        {captainLabel !== 'Noch nicht verfügbar' ? (
          <>
            {/* Desktop: single captain table row */}
            <div className="mdu-desktop-only">
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 180px 80px',
                padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
                letterSpacing: '0.14em', color: '#8A8F9C', textTransform: 'uppercase', gap: 12,
              }}>
                <span>#</span><span>Name</span><span>Passnr.</span><span>Rolle</span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 180px 80px',
                padding: '12px 0', alignItems: 'center', gap: 12,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#5A5F6C', fontSize: 12 }}>01</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={captainLabel.slice(0, 2)} color={teamColor} />
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA' }}>{captainLabel}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6B7280' }}>—</span>
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#E8B84A' }}>TC</span>
              </div>
            </div>

            {/* Mobile: captain card */}
            <div className="mdu-mobile-only" style={{
              borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#5A5F6C', fontSize: 11, width: 20, textAlign: 'right', flexShrink: 0 }}>01</span>
                <Avatar initials={captainLabel.slice(0, 2)} color={teamColor} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: '#F5F6FA', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {captainLabel}
                    </span>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, color: '#E8B84A', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
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

  // ── Full roster ───────────────────────────────────────────────
  return (
    <div style={{
      background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, overflow: 'hidden',
    }}>

      {/* ── Desktop table ───────────────────────────────── */}
      <div className="mdu-desktop-only">
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 1fr 180px 80px',
          padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
          letterSpacing: '0.14em', color: '#8A8F9C', textTransform: 'uppercase', gap: 12,
        }}>
          <span>#</span>
          <span>Name</span>
          <span>Passnr.</span>
          <span>Rolle</span>
        </div>

        {sorted.map((p, i) => (
          <div key={i} className="mdu-row-hover" style={{
            display: 'grid', gridTemplateColumns: '40px 1fr 180px 80px',
            padding: '12px 18px',
            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#5A5F6C', fontSize: 12 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Avatar initials={p.displayName.slice(0, 2)} color={teamColor} photoUrl={p.photoUrl} />
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.displayName || 'Name nicht verfügbar'}
              </span>
            </div>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2' }}>
              {p.licenseNumber ?? '—'}
            </span>
            <span style={{
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
              color: p.isCaptain ? '#E8B84A' : 'transparent',
            }}>
              {p.isCaptain ? 'TC' : ''}
            </span>
          </div>
        ))}
      </div>

      {/* ── Mobile card list ────────────────────────────── */}
      {/* Each player gets a flex row: number | avatar | name+passnr */}
      <div className="mdu-mobile-only">
        {sorted.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}>
            {/* Row number */}
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: '#5A5F6C', fontSize: 11, width: 20, textAlign: 'right', flexShrink: 0 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {/* Player avatar */}
            <Avatar initials={p.displayName.slice(0, 2)} color={teamColor} photoUrl={p.photoUrl} />
            {/* Name + license number */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: '#F5F6FA',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                }}>
                  {p.displayName || 'Name nicht verfügbar'}
                </span>
                {p.isCaptain && (
                  <span style={{
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, color: '#E8B84A',
                    background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)',
                    borderRadius: 3, padding: '1px 5px', flexShrink: 0,
                  }}>
                    TC
                  </span>
                )}
              </div>
              {/* License number row */}
              {p.licenseNumber && (
                <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#6B7280', marginTop: 3 }}>
                  Passnr.: {p.licenseNumber}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

function Avatar({ initials, color, photoUrl }: { initials: string; color: string; photoUrl?: string }) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = photoUrl && !imgError;
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: showPhoto ? 'transparent' : `${color}22`,
      border: `1px solid ${showPhoto ? color + '66' : color + '44'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 11, color,
    }}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={initials} onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
        background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '28px 24px',
      }}>
        <EmptyNote>Keine bevorstehenden Spiele — vollständiger Spielplan auf{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
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
            background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
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
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#8A8F9C' }}>
                {formatScheduledDate(m.date)}{m.time ? ` · ${m.time} Uhr` : ''}
              </span>
            </div>
            {/* Match row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
                letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                color: isHome ? '#22C55E' : '#E8B84A',
                background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,74,0.1)',
                border: isHome ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(232,184,74,0.25)',
                borderRadius: 4, padding: '2px 7px',
              }}>
                {isHome ? 'Heim' : 'Auswärts'}
              </span>
              <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B' }}>vs</span>
              <TeamBadge initials={opp.short.slice(0, 3)} color={opp.color} logoUrl={opp.logoUrl} size={28} />
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {oppName}
              </span>
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
        background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '28px 24px',
      }}>
        <EmptyNote>Noch keine Ergebnisse — aktuelle Ergebnisse auf{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
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

        const outcomeColor  = outcome === 'win' ? '#22C55E' : outcome === 'loss' ? '#EF4444' : '#E8B84A';
        const outcomeLetter = outcome === 'win' ? 'S' : outcome === 'loss' ? 'N' : 'U';
        const outcomeLabel  = outcome === 'win' ? 'Sieg' : outcome === 'loss' ? 'Niederlage' : 'Unentschieden';

        return (
          <div key={m.id} className="mdu-spielplan-card" style={{
            background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
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
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#8A8F9C' }}>
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
                  color: isHome ? '#22C55E' : '#E8B84A',
                  background: isHome ? 'rgba(34,197,94,0.1)' : 'rgba(232,184,74,0.1)',
                  border: isHome ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(232,184,74,0.25)',
                  borderRadius: 4, padding: '2px 7px',
                }}>
                  {isHome ? 'H' : 'A'}
                </span>
                <TeamBadge initials={opp.short.slice(0, 3)} color={opp.color} logoUrl={opp.logoUrl} size={24} />
                <span style={{
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: '#F5F6FA',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {oppName}
                </span>
              </div>
              {/* Score */}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                {m.result ? (
                  <span style={{
                    fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: '#F5F6FA',
                    background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 10px', display: 'inline-block',
                  }}>
                    {isHome ? m.result.home : m.result.away}:{isHome ? m.result.away : m.result.home}
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: '#6A6E7B' }}>—</span>
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
}: {
  stats: PlayerStatEntry[];
  teamId: string;
  teamColor: string;
  leagueName: string;
}) {
  if (stats.length === 0) {
    return (
      <div style={{
        background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '36px 24px',
        fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Icon name="bar" size={16} stroke={2} style={{ color: '#6B7280', flexShrink: 0 }} />
          <span style={{ fontWeight: 700, color: '#9AA4B2' }}>Statistiken noch nicht verfügbar</span>
        </div>
        <div>
          Einzelrangliste folgt auf{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop: rich 5-column scrollable table ── */}
      <div className="mdu-desktop-only mdu-table-scroll" style={{ maxWidth: 800 }}>
        <div className="mdu-standings-inner" style={{
          background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '22px 24px',
          minWidth: 560,
        }}>
          <div style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20,
            letterSpacing: '0.06em', color: '#F5F6FA', margin: '0 0 6px',
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
            padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11,
            letterSpacing: '0.1em', color: '#9AA4B2', textTransform: 'uppercase',
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
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 1fr 60px 80px',
                padding: '11px 8px',
                borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                fontFamily: 'var(--font-manrope)', fontSize: 13, alignItems: 'center',
                gap: 6,
                background: isOwnTeam ? `${teamColor}12` : i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
                borderLeft: isOwnTeam ? `3px solid ${teamColor}` : '3px solid transparent',
              }}>
                <span style={{
                  fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16,
                  color: p.rank <= 3 ? '#E8B84A' : '#9AA4B2',
                }}>
                  {p.rank}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Avatar
                    initials={getInitialsFromName(p.name)}
                    color={teamColor}
                    photoUrl={getPlayerPhotoByName(p.name)}
                  />
                  <span style={{
                    fontWeight: isOwnTeam ? 800 : 700,
                    color: '#F5F6FA',
                    fontSize: 13,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.name}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <span style={{
                    color: isOwnTeam ? teamColor : '#9AA4B2', fontSize: 12,
                    fontWeight: isOwnTeam ? 700 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
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
              fontFamily: 'var(--font-manrope)', fontSize: 10, color: '#6B7280',
              fontStyle: 'italic', marginBottom: 10,
            }}>
              {leagueName} · Quelle: dartunion.de
            </div>
          </div>

          {/* 2-row card rows: name+badge / stats line */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {stats.map((p, i) => {
              const td = getExtendedTeam(p.teamId);
              const isOwnTeam = p.teamId === teamId;
              const games = p.wins + p.losses;
              return (
                <div key={i} style={{
                  padding: '9px 14px',
                  borderBottom: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  background: isOwnTeam ? `${teamColor}12` : i === 0 ? 'rgba(232,184,74,0.05)' : undefined,
                  borderLeft: isOwnTeam ? `3px solid ${teamColor}` : '3px solid transparent',
                }}>
                  {/* Row 1: rank · name · badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14,
                      color: p.rank <= 3 ? '#E8B84A' : '#9AA4B2', flexShrink: 0, width: 22,
                    }}>
                      {p.rank}
                    </span>
                    <Avatar
                      initials={getInitialsFromName(p.name)}
                      color={teamColor}
                      photoUrl={getPlayerPhotoByName(p.name)}
                    />
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: isOwnTeam ? 800 : 700,
                      color: '#F5F6FA', fontSize: 12,
                      flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </span>
                    <div title={p.teamName} style={{ flexShrink: 0 }}>
                      <TeamBadge initials={td.short.slice(0, 3)} color={td.color} logoUrl={td.logoUrl} size={22} />
                    </div>
                  </div>
                  {/* Row 2: stats meta line — indent aligns with name (rank 22 + gap 8 + avatar 30 + gap 8) */}
                  <div style={{
                    paddingLeft: 68,
                    fontFamily: 'var(--font-jetbrains-mono)', fontSize: 10, color: '#6A6E7B',
                    letterSpacing: '0.02em',
                  }}>
                    <span style={{
                      color: isOwnTeam ? teamColor : '#9AA4B2',
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
                </div>
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
      background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14, padding: '36px 24px',
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6B7280',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon name={icon as 'bar'} size={16} stroke={2} style={{ color: '#6B7280', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: '#9AA4B2' }}>{label} folgt</span>
      </div>
      <div>
        Daten werden auf{' '}
        <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
          style={{ color: '#9AA4B2', textDecoration: 'underline' }}>dartunion.de</a>{' '}
        veröffentlicht.
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────

export function TeamDetailClient({
  teamId,
  teamColor,
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

  return (
    <>
      {/* Tab bar */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,11,15,0.8)',
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
                color: i === activeTab ? '#F5F6FA' : '#8A8F9C',
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
          <KaderTab roster={roster} captainLabel={captainLabel} teamColor={teamColor} />
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
          />
        )}
        {activeTab === 5 && <PlaceholderTab label="Galerie" icon="users" />}
      </div>
    </>
  );
}
