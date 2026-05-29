'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TeamBadge } from './team-badge';
import { FormDots } from './form-dots';
import { Icon } from './icon';
import { statusColor, diffColor } from '@/lib/utils';
import { getExtendedTeam } from '@/lib/data';

interface StandingRow {
  pos: number;
  team: string;
  name?: string;
  sp?: number;
  p?: number;
  s?: number;
  w?: number;
  u?: number;
  n?: number;
  l?: number;
  /** Individual game wins:losses across all matchdays (e.g. "214:74") */
  spiele?: string;
  legs: string;
  diff: string;
  pts: number;
  form?: ('W' | 'L')[];
  status: 'promo' | 'playoff' | 'releg' | null;
}

interface StandingsTableProps {
  rows: StandingRow[];
  title?: string;
  showForm?: boolean;
  showU?: boolean;
  /** Called with the team id when a row is clicked */
  onRowClick?: (teamId: string) => void;
  /** Id of the currently selected/highlighted team row */
  activeTeamId?: string;
}

const LEGEND = [
  { c: '#22C55E', t: 'Aufstiegsplatz' },
  { c: '#3B82F6', t: 'Playoff Platz' },
  { c: '#D40000', t: 'Abstiegsplatz' },
];

export function StandingsTable({
  rows,
  title = 'Tabelle',
  showForm = false,
  showU = true,
  onRowClick,
  activeTeamId,
}: StandingsTableProps) {
  const router = useRouter();
  const [expandedPos, setExpandedPos] = useState<number | null>(null);

  // Grid columns: Pl. | Team | Sp. | S | [U] | N | Spiele | Legs | Diff. | Pkt. | [Form]
  const colTemplate = showForm
    ? '32px 1fr 36px 28px 28px 28px 64px 50px 64px 40px 90px'
    : showU
      ? '32px 1fr 36px 28px 28px 28px 64px 50px 64px 40px'
      : '32px 1fr 36px 28px 28px 64px 50px 64px 40px';

  function handleDesktopRowClick(teamId: string) {
    // Desktop only: update the standings-panel team card
    onRowClick?.(teamId);
  }

  function toggleExpand(pos: number) {
    setExpandedPos(prev => (prev === pos ? null : pos));
  }

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          DESKTOP — full scrollable table (hidden on mobile)
          ══════════════════════════════════════════════════════ */}
      <div className="mdu-desktop-only mdu-table-scroll">
        <div
          className="mdu-standings-inner"
          style={{
            background: '#121821',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '22px 24px',
          }}
        >
          {title && (
            <h2
              style={{
                fontFamily: 'var(--font-saira-condensed)',
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: '0.08em',
                color: '#F5F6FA',
                margin: '0 0 18px',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </h2>
          )}

          {/* Header */}
          <div
            className="mdu-standings-row"
            style={{
              display: 'grid',
              gridTemplateColumns: colTemplate,
              padding: '10px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              fontFamily: 'var(--font-manrope)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#9AA4B2',
              textTransform: 'uppercase',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span>Pl.</span>
            <span>Team</span>
            <span style={{ textAlign: 'center' }}>Sp.</span>
            <span style={{ textAlign: 'center' }}>S</span>
            {showU && <span style={{ textAlign: 'center' }}>U</span>}
            <span style={{ textAlign: 'center' }}>N</span>
            <span style={{ textAlign: 'center' }}>Spiele</span>
            <span style={{ textAlign: 'center' }}>Legs</span>
            <span style={{ textAlign: 'center' }}>Diff.</span>
            <span style={{ textAlign: 'right' }}>Pkt.</span>
            {showForm && <span style={{ textAlign: 'center' }}>Form</span>}
          </div>

          {rows.map(r => {
            const teamData = r.name
              ? {
                  name: r.name,
                  short: r.name.split(' ').map((x: string) => x[0]).join('').slice(0, 3),
                  color: getExtendedTeam(r.team).color,
                }
              : getExtendedTeam(r.team);
            const sp    = r.sp ?? r.p ?? 0;
            const wins  = r.s ?? r.w ?? 0;
            const losses = r.n ?? r.l ?? 0;
            return (
              <div
                key={r.pos}
                className="mdu-row-hover mdu-standings-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: colTemplate,
                  padding: '12px 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 13,
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                  cursor: 'pointer',
                  background:
                    activeTeamId && r.team === activeTeamId
                      ? 'rgba(255,255,255,0.06)'
                      : undefined,
                }}
                onClick={() => handleDesktopRowClick(r.team)}
              >
                {/* Status colour bar */}
                <span
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    background:
                      activeTeamId && r.team === activeTeamId
                        ? '#F5F6FA'
                        : statusColor(r.status),
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-saira-condensed)',
                    fontWeight: 800,
                    fontSize: 16,
                    color: r.pos <= 2 ? '#E8B84A' : '#F5F6FA',
                  }}
                >
                  {r.pos}
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    minWidth: 0,
                  }}
                >
                  <TeamBadge
                    initials={teamData.short.slice(0, 3)}
                    color={teamData.color}
                    size={26}
                  />
                  <span
                    style={{
                      fontWeight: 700,
                      color: '#F5F6FA',
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.name ?? teamData.name}
                  </span>
                </div>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: '#C9CCD6',
                  }}
                >
                  {sp}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: '#5BE08C',
                    fontWeight: 600,
                  }}
                >
                  {wins}
                </span>
                {showU && (
                  <span
                    style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-jetbrains-mono)',
                      color: '#9AA4B2',
                    }}
                  >
                    {r.u ?? 0}
                  </span>
                )}
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: '#FF6B6B',
                  }}
                >
                  {losses}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: '#C9CCD6',
                    fontSize: 11,
                  }}
                >
                  {r.spiele ?? '—'}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: '#C9CCD6',
                    fontSize: 11,
                  }}
                >
                  {r.legs}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    fontWeight: 600,
                    color: diffColor(r.diff),
                  }}
                >
                  {r.diff}
                </span>
                <span
                  style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-saira-condensed)',
                    fontWeight: 900,
                    fontSize: 18,
                    color: '#F5F6FA',
                  }}
                >
                  {r.pts}
                </span>
                {showForm && r.form && (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <FormDots form={r.form} />
                  </div>
                )}
              </div>
            );
          })}

          <div
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 22,
              flexWrap: 'wrap',
            }}
          >
            {LEGEND.map(x => (
              <div
                key={x.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 12,
                  color: '#C9CCD6',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: x.c,
                    flexShrink: 0,
                  }}
                />
                {x.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MOBILE — compact expandable card list (hidden on desktop)
          ══════════════════════════════════════════════════════ */}
      <div className="mdu-mobile-only">
        <div
          style={{
            background: '#121821',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          {title && (
            <div style={{ padding: '12px 14px 10px' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-saira-condensed)',
                  fontWeight: 900,
                  fontSize: 18,
                  letterSpacing: '0.06em',
                  color: '#F5F6FA',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </h2>
            </div>
          )}

          {/* Rows */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {rows.map(r => {
              const teamData = r.name
                ? {
                    name: r.name,
                    short: r.name.split(' ').map((x: string) => x[0]).join('').slice(0, 3),
                    color: getExtendedTeam(r.team).color,
                  }
                : getExtendedTeam(r.team);
              const sp     = r.sp ?? r.p ?? 0;
              const wins   = r.s ?? r.w ?? 0;
              const draws  = r.u ?? 0;
              const losses = r.n ?? r.l ?? 0;
              const isExpanded = expandedPos === r.pos;
              const displayName = (r.name ?? teamData.name).replace(' *', '');
              const barColor = statusColor(r.status);

              return (
                <div
                  key={r.pos}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: barColor !== 'transparent'
                      ? `3px solid ${barColor}`
                      : '3px solid transparent',
                  }}
                >
                  {/* ── Collapsed row ── */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 10px',
                      gap: 8,
                    }}
                  >
                    {/* Rank */}
                    <span
                      style={{
                        fontFamily: 'var(--font-saira-condensed)',
                        fontWeight: 800,
                        fontSize: 15,
                        color: r.pos <= 2 ? '#E8B84A' : '#9AA4B2',
                        flexShrink: 0,
                        width: 20,
                        textAlign: 'center',
                      }}
                    >
                      {r.pos}
                    </span>

                    {/* Badge */}
                    <div style={{ flexShrink: 0 }}>
                      <TeamBadge
                        initials={teamData.short.slice(0, 3)}
                        color={teamData.color}
                        size={22}
                      />
                    </div>

                    {/* Team name → navigates to team profile */}
                    <Link
                      href={`/teams/${r.team}`}
                      style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-manrope)',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#F5F6FA',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {displayName}
                      </span>
                    </Link>

                    {/* Pts + Sp */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-saira-condensed)',
                          fontWeight: 900,
                          fontSize: 15,
                          color: '#F5F6FA',
                          lineHeight: 1.1,
                        }}
                      >
                        {r.pts}{' '}
                        <span
                          style={{
                            fontFamily: 'var(--font-manrope)',
                            fontWeight: 700,
                            fontSize: 9,
                            color: '#9AA4B2',
                          }}
                        >
                          Pkt.
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono)',
                          fontSize: 10,
                          color: '#6A6E7B',
                          marginTop: 1,
                        }}
                      >
                        {sp} Sp.
                      </div>
                    </div>

                    {/* Expand / collapse chevron */}
                    <button
                      onClick={() => toggleExpand(r.pos)}
                      aria-label={
                        isExpanded ? 'Details einklappen' : 'Details ausklappen'
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px 2px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: isExpanded ? '#D40000' : '#6A6E7B',
                      }}
                    >
                      <Icon
                        name="chevron-down"
                        size={16}
                        stroke={2.5}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.15s ease',
                        }}
                      />
                    </button>
                  </div>

                  {/* ── Expanded details ── */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '0 10px 12px 52px',
                        background: 'rgba(255,255,255,0.015)',
                      }}
                    >
                      {/* Stat grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        {[
                          { label: 'Siege',   value: wins,            color: '#5BE08C' },
                          ...(showU
                            ? [{ label: 'Unent.',  value: draws,           color: '#9AA4B2' }]
                            : []),
                          { label: 'Niedl.',  value: losses,          color: '#FF6B6B' },
                          { label: 'Spiele',  value: r.spiele ?? '—', color: '#C9CCD6' },
                          { label: 'Legs',    value: r.legs,          color: '#C9CCD6' },
                          { label: 'Diff.',   value: r.diff,          color: diffColor(r.diff) },
                        ].map(item => (
                          <div
                            key={item.label}
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: 6,
                              padding: '5px 7px',
                            }}
                          >
                            <div
                              style={{
                                fontFamily: 'var(--font-manrope)',
                                fontWeight: 700,
                                fontSize: 9,
                                letterSpacing: '0.1em',
                                color: '#6A6E7B',
                                textTransform: 'uppercase',
                                marginBottom: 2,
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontFamily: 'var(--font-jetbrains-mono)',
                                fontWeight: 600,
                                fontSize: 12,
                                color: item.color,
                              }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Link to full team profile */}
                      <Link
                        href={`/teams/${r.team}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'var(--font-manrope)',
                          fontWeight: 700,
                          fontSize: 11,
                          color: '#D40000',
                          textDecoration: 'none',
                        }}
                      >
                        Teamprofil ansehen
                        <Icon name="arrow-right" size={12} stroke={2.5} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            {LEGEND.map(x => (
              <div
                key={x.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 10,
                  color: '#9AA4B2',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: x.c,
                    flexShrink: 0,
                  }}
                />
                {x.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
