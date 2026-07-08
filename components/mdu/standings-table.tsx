'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TeamBadge } from './team-badge';
import { TeamLink } from './team-link';
import { FormDots } from './form-dots';
import { Icon } from './icon';
import { statusColor, diffColor, GOLD_TOP_RANKS } from '@/lib/utils';
import { getExtendedTeam, getCurrentSeason } from '@/lib/data';
import { getRowOutcome, outcomeColor, getLegendForRows } from '@/lib/data/competition-outcomes';
import { getTeamUrl } from '@/lib/links';

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
  /** Optional competition context carried into team-profile links. */
  competitionId?: string;
  /** Saison-Kontext für die Abschlussregeln (Default: aktuelle Saison). */
  seasonId?: string;
}

const LEGEND_FALLBACK = [
  { c: '#22C55E', t: 'Aufstiegsplatz' },
  { c: '#3B82F6', t: 'Playoff Platz' },
  { c: '#D40000', t: 'Abstiegsplatz' },
];

/** Kompaktes Status-Label (Mobile) — „Verbleib" wird bewusst nicht beschriftet. */
const SHORT_OUTCOME_LABEL: Record<string, string> = {
  promotion: 'Aufstieg',
  playoff_promotion: 'Aufstiegs-Playoff',
  playoff_relegation: 'Abstiegs-Playoff',
  relegation: 'Abstieg',
  withdrawn: 'Zurückgezogen',
};

export function StandingsTable({
  rows,
  title = 'Tabelle',
  showForm = false,
  showU = true,
  onRowClick,
  activeTeamId,
  competitionId,
  seasonId,
}: StandingsTableProps) {
  const router = useRouter();
  const [expandedPos, setExpandedPos] = useState<number | null>(null);

  const season = seasonId ?? getCurrentSeason().id;
  const total = rows.length;
  // Outcome je Zeile aus der zentralen Config (positionsbasiert); null → Fallback.
  const outcomeOf = (r: { pos: number; team: string }) =>
    getRowOutcome(season, competitionId, r.pos, total, r.team);
  // Legende passend zur konkreten Tabelle; leer → Fallback-Legende.
  const legendItems = (() => {
    const dyn = getLegendForRows(season, competitionId, rows);
    return dyn.length ? dyn.map(l => ({ c: l.color, t: l.label })) : LEGEND_FALLBACK;
  })();

  // Einzelspiel-Bilanz (z. B. „214:74") gibt es nur für Playoffs, nicht für die
  // A/B-Ligen → Spalte nur zeigen, wenn wenigstens eine Zeile Daten hat (REV-098).
  const showSpiele = rows.some(r => r.spiele != null && r.spiele !== '');

  // Grid columns: Pl. | Team | Sp. | Pkt. | S | [U] | N | [Spiele] | Legs | Diff. | [Form]
  const colTemplate = [
    '32px',                    // Pl.
    '1fr',                     // Team
    '36px',                    // Sp.
    '40px',                    // Pkt.
    '28px',                    // S
    showU ? '28px' : null,     // U
    '28px',                    // N
    showSpiele ? '64px' : null, // Spiele
    '50px',                    // Legs
    '64px',                    // Diff.
    showForm ? '90px' : null,  // Form
  ].filter(Boolean).join(' ');

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
            background: 'var(--th-bg-card)',
            border: '1px solid var(--th-line-6)',
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
                color: 'var(--th-text-strong)',
                margin: '0 0 18px',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </h2>
          )}

          {/* Header */}
          <div
            className="mdu-standings-row mdu-st-head"
            style={{
              display: 'grid',
              gridTemplateColumns: colTemplate,
              padding: '10px 8px',
              borderBottom: '1px solid var(--th-line-8)',
              fontFamily: 'var(--font-manrope)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.1em',
              color: 'var(--th-text-muted)',
              textTransform: 'uppercase',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <span title="Platzierung">Pl.</span>
            <span>Team</span>
            <span title="Spiele (absolvierte Begegnungen)" style={{ textAlign: 'center', cursor: 'help' }}>Sp.</span>
            <span title="Punkte" style={{ textAlign: 'center', cursor: 'help' }}>Pkt.</span>
            <span title="Siege" style={{ textAlign: 'center', cursor: 'help' }}>S</span>
            {showU && <span title="Unentschieden" style={{ textAlign: 'center', cursor: 'help' }}>U</span>}
            <span title="Niederlagen" style={{ textAlign: 'center', cursor: 'help' }}>N</span>
            {showSpiele && <span title="Gewonnene:verlorene Einzelspiele" style={{ textAlign: 'center', cursor: 'help' }}>Spiele</span>}
            <span title="Gewonnene:verlorene Legs" style={{ textAlign: 'center', cursor: 'help' }}>Legs</span>
            <span title="Legdifferenz" style={{ textAlign: 'center', cursor: 'help' }}>Diff.</span>
            {showForm && <span title="Letzte Ergebnisse" style={{ textAlign: 'center', cursor: 'help' }}>Form</span>}
          </div>

          {rows.map(r => {
            const _ext    = getExtendedTeam(r.team);
            const teamData = r.name
              ? { name: r.name, short: r.name.split(' ').map((x: string) => x[0]).join('').slice(0, 3), color: _ext.color, logoUrl: _ext.logoUrl }
              : _ext;
            const sp    = r.sp ?? r.p ?? 0;
            const wins  = r.s ?? r.w ?? 0;
            const losses = r.n ?? r.l ?? 0;
            const outcome = outcomeOf(r);
            const barColor = outcome ? outcomeColor(outcome.type) : statusColor(r.status);
            return (
              <div
                key={r.pos}
                className="mdu-row-hover mdu-standings-row mdu-st-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: colTemplate,
                  padding: '12px 8px',
                  borderBottom: '1px solid var(--th-line-4)',
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 13,
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                  cursor: 'pointer',
                  background:
                    activeTeamId && r.team === activeTeamId
                      ? 'var(--th-line-6)'
                      : undefined,
                }}
                onClick={() => handleDesktopRowClick(r.team)}
              >
                {/* Status colour bar */}
                <span
                  title={outcome?.label}
                  style={{
                    position: 'absolute',
                    left: -8,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    // Outcome-Farbe immer zeigen (auch für das ausgewählte Team –
                    // die Auswahl wird bereits über den Zeilen-Hintergrund markiert).
                    background: barColor,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-saira-condensed)',
                    fontWeight: 800,
                    fontSize: 16,
                    color: r.pos <= GOLD_TOP_RANKS ? 'var(--th-gold)' : 'var(--th-text-strong)',
                  }}
                >
                  {r.pos}
                </span>
                <TeamLink
                  teamId={r.team}
                  teamName={r.name ?? teamData.name}
                  competitionId={competitionId}
                  stopPropagation
                  style={{ display: 'flex', gap: 10, minWidth: 0 }}
                >
                  <TeamBadge
                    initials={teamData.short.slice(0, 3)}
                    color={teamData.color}
                    logoUrl={teamData.logoUrl}
                    size={26}
                  />
                  <span
                    className="mdu-link-name"
                    style={{
                      fontWeight: 700,
                      color: 'var(--th-text-strong)',
                      fontSize: 13,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.name ?? teamData.name}
                  </span>
                </TeamLink>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: 'var(--th-text-body)',
                  }}
                >
                  {sp}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-saira-condensed)',
                    fontWeight: 900,
                    fontSize: 18,
                    color: 'var(--th-text-strong)',
                  }}
                >
                  {r.pts}
                </span>
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: 'var(--th-win)',
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
                      color: 'var(--th-text-muted)',
                    }}
                  >
                    {r.u ?? 0}
                  </span>
                )}
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: 'var(--th-loss)',
                  }}
                >
                  {losses}
                </span>
                {showSpiele && (
                  <span
                    style={{
                      textAlign: 'center',
                      fontFamily: 'var(--font-jetbrains-mono)',
                      color: 'var(--th-text-body)',
                      fontSize: 11,
                    }}
                  >
                    {r.spiele ?? '—'}
                  </span>
                )}
                <span
                  style={{
                    textAlign: 'center',
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: 'var(--th-text-body)',
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
              borderTop: '1px solid var(--th-line-6)',
              display: 'flex',
              gap: 22,
              flexWrap: 'wrap',
            }}
          >
            {legendItems.map(x => (
              <div
                key={x.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 12,
                  color: 'var(--th-text-body)',
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
            background: 'var(--th-bg-card)',
            border: '1px solid var(--th-line-6)',
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
                  color: 'var(--th-text-strong)',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </h2>
            </div>
          )}

          {/* Rows */}
          <div style={{ borderTop: '1px solid var(--th-line-6)' }}>
            {rows.map(r => {
              const _mExt   = getExtendedTeam(r.team);
              const teamData = r.name
                ? { name: r.name, short: r.name.split(' ').map((x: string) => x[0]).join('').slice(0, 3), color: _mExt.color, logoUrl: _mExt.logoUrl }
                : _mExt;
              const sp     = r.sp ?? r.p ?? 0;
              const wins   = r.s ?? r.w ?? 0;
              const draws  = r.u ?? 0;
              const losses = r.n ?? r.l ?? 0;
              const isExpanded = expandedPos === r.pos;
              const displayName = (r.name ?? teamData.name).replace(' *', '');
              const mOutcome = outcomeOf(r);
              const barColor = mOutcome ? outcomeColor(mOutcome.type) : statusColor(r.status);
              const shortLabel = mOutcome ? SHORT_OUTCOME_LABEL[mOutcome.type] : undefined;

              return (
                <div
                  key={r.pos}
                  className="mdu-st-row-m"
                  style={{
                    borderBottom: '1px solid var(--th-line-4)',
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
                        color: r.pos <= GOLD_TOP_RANKS ? 'var(--th-gold)' : 'var(--th-text-muted)',
                        flexShrink: 0,
                        width: 20,
                        textAlign: 'center',
                      }}
                    >
                      {r.pos}
                    </span>

                    {/* Badge + name → navigates to team profile */}
                    <TeamLink
                      teamId={r.team}
                      teamName={displayName}
                      competitionId={competitionId}
                      style={{ flex: 1, minWidth: 0, gap: 8 }}
                    >
                      <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                        <TeamBadge
                          initials={teamData.short.slice(0, 3)}
                          color={teamData.color}
                          size={22}
                          logoUrl={teamData.logoUrl}
                        />
                      </span>
                      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 1 }}>
                        <span
                          className="mdu-link-name"
                          style={{
                            fontFamily: 'var(--font-manrope)',
                            fontWeight: 700,
                            fontSize: 12,
                            color: 'var(--th-text-strong)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            minWidth: 0,
                          }}
                        >
                          {displayName}
                        </span>
                        {shortLabel && (
                          <span style={{
                            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 8.5,
                            letterSpacing: '0.04em', textTransform: 'uppercase', color: barColor,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {shortLabel}
                          </span>
                        )}
                      </span>
                    </TeamLink>

                    {/* Pts + Sp */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div
                        style={{
                          fontFamily: 'var(--font-saira-condensed)',
                          fontWeight: 900,
                          fontSize: 15,
                          color: 'var(--th-text-strong)',
                          lineHeight: 1.1,
                        }}
                      >
                        {r.pts}{' '}
                        <span
                          style={{
                            fontFamily: 'var(--font-manrope)',
                            fontWeight: 700,
                            fontSize: 9,
                            color: 'var(--th-text-muted)',
                          }}
                        >
                          Pkt.
                        </span>
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-jetbrains-mono)',
                          fontSize: 10,
                          color: 'var(--th-text-faint)',
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
                        color: isExpanded ? 'var(--th-accent)' : 'var(--th-text-faint)',
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
                          { label: 'Siege',   value: wins,            color: 'var(--th-win)' },
                          ...(showU
                            ? [{ label: 'Unent.',  value: draws,           color: 'var(--th-text-muted)' }]
                            : []),
                          { label: 'Niedl.',  value: losses,          color: 'var(--th-loss)' },
                          ...(showSpiele
                            ? [{ label: 'Spiele', value: r.spiele ?? '—', color: 'var(--th-text-body)' }]
                            : []),
                          { label: 'Legs',    value: r.legs,          color: 'var(--th-text-body)' },
                          { label: 'Diff.',   value: r.diff,          color: diffColor(r.diff) },
                        ].map(item => (
                          <div
                            key={item.label}
                            style={{
                              background: 'var(--th-line-3)',
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
                                color: 'var(--th-text-faint)',
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
                        href={getTeamUrl(r.team, competitionId)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'var(--font-manrope)',
                          fontWeight: 700,
                          fontSize: 11,
                          color: 'var(--th-accent)',
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
              borderTop: '1px solid var(--th-line-6)',
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            {legendItems.map(x => (
              <div
                key={x.t}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-manrope)',
                  fontSize: 10,
                  color: 'var(--th-text-muted)',
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
