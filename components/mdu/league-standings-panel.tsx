'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StandingsTable } from './standings-table';
import { Icon } from './icon';
import { getExtendedTeam } from '@/lib/data';

// ── Types passed from the Server Component ────────────────────

interface StandingRow {
  pos: number;
  team: string;
  name: string;
  sp: number;
  s: number;
  u: number;
  n: number;
  legs: string;
  diff: string;
  pts: number;
  status: 'promo' | 'playoff' | 'releg' | null;
}

export interface TeamInfo {
  captain: string;
  venueName: string;
  venueAddress: string;
}

interface LeagueShape {
  id: string;
  name: string;
  color: string;
  season: string;
  type?: 'regular' | 'playoff';
}

interface Props {
  rows: StandingRow[];
  league: LeagueShape;
  teamInfoMap: Record<string, TeamInfo>;
}

// ── Helpers ───────────────────────────────────────────────────

const TEAM_TABS = ['Übersicht', 'Kader', 'Spielplan', 'Ergebnisse', 'Statistik'];

function HexBadge({ short, color }: { short: string; color: string }) {
  return (
    <div style={{
      width: 62, height: 72, flexShrink: 0, position: 'relative',
      background: 'linear-gradient(180deg, #2C313F, #14161E)',
      clipPath: 'polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 46, height: 54, position: 'absolute',
        background: `linear-gradient(180deg, ${color}, ${color}99)`,
        clipPath: 'polygon(50% 0, 100% 18%, 100% 70%, 50% 100%, 0 70%, 0 18%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, color: '#fff', fontSize: 13 }}>
          {short}
        </span>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

export function LeagueStandingsPanel({ rows, league, teamInfoMap }: Props) {
  // Default: first team in standings (league leader)
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.team ?? '');

  const selectedRow = rows.find(r => r.team === selectedId) ?? rows[0] ?? null;
  const teamData    = selectedId ? getExtendedTeam(selectedId) : null;
  const info        = teamInfoMap[selectedId] ?? { captain: 'Noch nicht verfügbar', venueName: 'Noch nicht verfügbar', venueAddress: '' };

  // Display name — strip withdrawal marker if present
  const displayName = (selectedRow?.name ?? teamData?.name ?? '').replace(' *', '');
  const shortCode   = displayName
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .join('')
    .slice(0, 3)
    .toUpperCase();
  const teamColor = teamData?.color ?? league.color;

  // Kurzinfo text
  const kurzinfo = selectedRow
    ? selectedRow.sp > 0
      ? `${displayName} belegt Platz ${selectedRow.pos} in der ${league.name} nach ${selectedRow.sp} Spielen mit ${selectedRow.pts} Punkten (${selectedRow.s}S / ${selectedRow.u}U / ${selectedRow.n}N).`
      : `${displayName} ist für die ${league.name} qualifiziert. Spielplan und Ergebnisse folgen auf dartunion.de.`
    : 'Teamdaten werden aktualisiert.';

  const isPlayoff = league.type === 'playoff';
  const noData    = rows.length === 0;

  return (
    <div
      className="mdu-liga-body-grid mdu-section-pad"
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '30px 28px 60px',
        display: 'grid',
        gridTemplateColumns: '1.05fr 1fr',
        gap: 22,
      }}
    >
      {/* ── Left: Standings table ─────────────────────────── */}
      <div style={{ minWidth: 0 }}>
        {noData ? (
          /* Empty state for Abstieg groups (no data yet) */
          <div style={{
            background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '36px 24px',
            fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#6A6E7B',
            fontStyle: 'italic',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Icon name="calendar" size={16} stroke={2} style={{ color: '#6A6E7B', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: '#9AA4B2', fontStyle: 'normal' }}>
                Spielstände noch nicht verfügbar
              </span>
            </div>
            <div>
              Teilnehmer und Spielplan folgen auf{' '}
              <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer" style={{ color: '#9AA4B2', textDecoration: 'underline' }}>
                dartunion.de
              </a>.
            </div>
          </div>
        ) : (
          <>
            <StandingsTable
              rows={rows}
              showU={true}
              onRowClick={setSelectedId}
              activeTeamId={selectedId}
            />
            {/* Playoff notice: games not yet played */}
            {isPlayoff && rows.every(r => r.sp === 0) && (
              <div style={{
                marginTop: 10,
                background: 'rgba(232,184,74,0.07)', border: '1px solid rgba(232,184,74,0.15)',
                borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#E8B84A',
              }}>
                <Icon name="calendar" size={14} stroke={2} style={{ flexShrink: 0 }} />
                Spielplan noch nicht verfügbar — erste Spiele am 28.05.2026.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right: Team card ──────────────────────────────── */}
      <div style={{
        minWidth: 0,
        background: '#121821', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '22px 24px',
      }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#9AA4B2', marginBottom: 16,
        }}>
          <Link href="/" style={{ color: '#9AA4B2', textDecoration: 'none' }}>Startseite</Link>
          <Icon name="chevron" size={10} />
          <span>Teams</span>
          <Icon name="chevron" size={10} />
          <span style={{ color: '#F5F6FA' }}>{displayName || '—'}</span>
        </div>

        {/* Badge + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
          <HexBadge short={shortCode || '—'} color={teamColor} />
          <div>
            <h2 style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30,
              letterSpacing: '0.03em', color: '#FFFFFF', margin: 0,
              textTransform: 'uppercase', lineHeight: 1,
            }}>
              {displayName || '—'}
            </h2>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#9AA4B2', marginTop: 6 }}>
              {league.name}
            </div>
          </div>
        </div>

        {/* Tab bar (decorative) */}
        <div
          className="mdu-tabs-row"
          style={{ display: 'flex', gap: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 18 }}
        >
          {TEAM_TABS.map((tab, i) => (
            <div
              key={tab}
              style={{
                padding: '10px 0',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                color: i === 0 ? '#D40000' : '#9AA4B2',
                borderBottom: i === 0 ? '2px solid #D40000' : '2px solid transparent',
                marginBottom: -1, cursor: 'pointer',
                letterSpacing: '0.04em', textTransform: 'uppercase',
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Left col — Team info */}
          <div>
            <div style={{
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
              letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12,
            }}>
              Team Info
            </div>
            {[
              { k: 'Liga',          v: league.name },
              { k: 'Saison',        v: league.season },
              { k: 'Tabellenplatz', v: selectedRow ? `Platz ${selectedRow.pos}` : '—' },
              { k: 'Punkte',        v: selectedRow ? `${selectedRow.pts} Pkt.` : '—' },
              { k: 'Spielstätte',   v: info.venueName },
              { k: 'Kapitän',       v: info.captain },
            ].map(row => (
              <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, alignItems: 'start', marginBottom: 10 }}>
                <span style={{ color: '#9AA4B2', fontSize: 12, fontFamily: 'var(--font-manrope)' }}>{row.k}</span>
                <span style={{ color: '#F5F6FA', fontWeight: 600, fontSize: 12, fontFamily: 'var(--font-manrope)' }}>{row.v}</span>
              </div>
            ))}
          </div>

          {/* Right col — Kurzinfo */}
          <div>
            <div style={{
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
              letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12,
            }}>
              Kurzinfo
            </div>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#C9CCD6', lineHeight: 1.55, margin: 0 }}>
              {kurzinfo}
            </p>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B', lineHeight: 1.55, margin: '10px 0 0' }}>
              Vollständige Informationen auf{' '}
              <span style={{ color: '#9AA4B2' }}>dartunion.de</span>
            </p>
          </div>
        </div>

        {/* Top 3 */}
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
            letterSpacing: '0.16em', color: '#D40000', textTransform: 'uppercase', marginBottom: 12,
          }}>
            Top 3
          </div>
          {rows.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {rows.slice(0, 3).map(r => (
                <div
                  key={r.pos}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8, padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedId(r.team)}
                >
                  <div style={{
                    fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                    color: r.pos <= 2 ? '#E8B84A' : '#F5F6FA',
                  }}>
                    {r.pos}.
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: '#F5F6FA',
                    marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {r.name.replace(' *', '')}
                  </div>
                  <div style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: '#9AA4B2', marginTop: 2 }}>
                    {r.pts} Pkt.
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#6A6E7B', fontStyle: 'italic' }}>
              Noch keine Spielstände verfügbar.
            </div>
          )}
        </div>

        {/* CTA button — navigates to the selected team profile */}
        {selectedId ? (
          <Link
            href={`/teams/${selectedId}`}
            style={{
              display: 'block', marginTop: 18, width: '100%', padding: '13px',
              background: '#D40000', color: '#fff', borderRadius: 6,
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textDecoration: 'none', textAlign: 'center',
              boxShadow: '0 6px 14px rgba(212,0,0,0.32)',
            }}
          >
            Team-Profil ansehen
          </Link>
        ) : (
          <div style={{
            marginTop: 18, width: '100%', padding: '13px',
            background: '#1E2330', color: '#6A6E7B', borderRadius: 6,
            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12,
            letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center',
          }}>
            Team-Profil ansehen
          </div>
        )}
      </div>
    </div>
  );
}
