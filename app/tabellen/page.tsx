'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { LEAGUES, STANDINGS_BY_LEAGUE, getExtendedTeam, getCurrentSeason } from '@/lib/data';
import { TeamBadge } from '@/components/mdu/team-badge';
import { GOLD_TOP_RANKS } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────
type Filter = 'alle' | 'playoffs' | 'ligen';

// Competitions in canonical display order (sortOrder ascending)
const COMPETITION_ORDER = [...LEAGUES].sort((a, b) => a.sortOrder - b.sortOrder);

const PREVIEW_ROWS = 5; // Max rows shown per league preview

// ── Page ──────────────────────────────────────────────────────
export default function TabellenPage() {
  const [filter, setFilter] = useState<Filter>('alle');

  const visible = COMPETITION_ORDER.filter(l => {
    if (filter === 'playoffs') return l.type === 'playoff';
    if (filter === 'ligen')   return l.type !== 'playoff';
    return true;
  });

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/tabellen" />

      <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── Page heading ─────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            {getCurrentSeason().name}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
          }}>
            Tabellenübersicht
          </h1>
        </div>

        {/* ── Filter tabs ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {([
            { value: 'alle',     label: 'Alle'     },
            { value: 'playoffs', label: 'Playoffs' },
            { value: 'ligen',    label: 'Ligen'    },
          ] as { value: Filter; label: string }[]).map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '7px 18px', borderRadius: 6, cursor: 'pointer', border: 'none',
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: filter === f.value ? 'var(--th-accent)' : 'var(--th-line-6)',
                color:      filter === f.value ? '#fff'    : 'var(--th-text-muted)',
                transition: 'background 120ms, color 120ms',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Table cards ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {visible.map(league => {
            const rows  = STANDINGS_BY_LEAGUE[league.id] ?? [];
            const preview = rows.slice(0, PREVIEW_ROWS);
            if (rows.length === 0) return null;

            return (
              <div
                key={league.id}
                style={{
                  background: 'var(--th-bg-card)',
                  border: '1px solid var(--th-line-6)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderLeft: `3px solid ${league.color}`,
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: '13px 18px 11px',
                  borderBottom: '1px solid var(--th-line-6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17,
                      letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {league.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, color: 'var(--th-text-faint2)', marginTop: 2 }}>
                      Saison {league.season}
                    </div>
                  </div>
                  {league.type === 'playoff' && (
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9,
                      letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
                      color: 'var(--th-accent)', background: 'var(--th-accent-a12)',
                      border: '1px solid var(--th-accent-a25)',
                      borderRadius: 4, padding: '3px 8px',
                    }}>
                      Playoffs
                    </span>
                  )}
                </div>

                {/* Column headers */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '28px 1fr 40px 48px',
                  padding: '6px 18px', gap: 6,
                  borderBottom: '1px solid var(--th-line-4)',
                }}>
                  {['#', 'Team', 'Sp.', 'Pkt.'].map((h, i) => (
                    <span key={h} style={{
                      fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                      color: 'var(--th-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase',
                      textAlign: i >= 2 ? 'right' : 'left',
                    }}>{h}</span>
                  ))}
                </div>

                {/* Data rows */}
                {preview.map((row, i) => (
                  <div
                    key={row.pos}
                    style={{
                      display: 'grid', gridTemplateColumns: '28px 1fr 40px 48px',
                      padding: '8px 18px', gap: 6,
                      borderBottom: i < preview.length - 1 ? '1px solid var(--th-line-3)' : 'none',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14,
                      color: row.pos <= GOLD_TOP_RANKS ? 'var(--th-gold)' : 'var(--th-text-faint)',
                      lineHeight: '1.3',
                    }}>
                      {row.pos}
                    </span>
                    <Link
                      href={`/teams/${row.team}`}
                      aria-label={`Teamprofil von ${row.name} öffnen`}
                      className="mdu-entity-link"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        textDecoration: 'none', minWidth: 0, overflow: 'hidden',
                      }}
                    >
                      {(() => { const t = getExtendedTeam(row.team); return (
                        <TeamBadge initials={t.short.slice(0, 3)} color={t.color} logoUrl={t.logoUrl} size={20} ring="transparent" />
                      ); })()}
                      <span className="mdu-link-name" style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: row.pos === 1 ? 700 : 500,
                        fontSize: 13, color: 'var(--th-text-strong)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {row.name}
                      </span>
                    </Link>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12,
                      color: 'var(--th-text-muted)', textAlign: 'right', lineHeight: '1.3',
                    }}>
                      {row.sp}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13,
                      color: 'var(--th-text-strong)', textAlign: 'right', lineHeight: '1.3',
                    }}>
                      {row.pts}
                    </span>
                  </div>
                ))}

                {/* Footer: overflow hint + full-table link */}
                <div style={{
                  padding: '9px 18px',
                  borderTop: '1px solid var(--th-line-4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-muted)' }}>
                    {rows.length > PREVIEW_ROWS ? `+${rows.length - PREVIEW_ROWS} weitere` : ''}
                  </span>
                  <Link
                    href={`/ligen/${league.id}?tab=tabelle`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                      color: 'var(--th-accent)', textDecoration: 'none',
                    }}
                  >
                    Vollständige Tabelle ansehen
                    <Icon name="arrow-right" size={13} stroke={2.5} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <Footer />
    </div>
  );
}
