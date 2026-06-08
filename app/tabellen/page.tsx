'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { LEAGUES } from '@/lib/data';
import { STANDINGS_BY_LEAGUE } from '@/lib/data';

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
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/tabellen" />

      <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* ── Page heading ─────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Saison 2026
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block',
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
                background: filter === f.value ? '#D40000' : 'rgba(255,255,255,0.06)',
                color:      filter === f.value ? '#fff'    : '#9AA4B2',
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
                  background: '#121821',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  borderLeft: `3px solid ${league.color}`,
                }}
              >
                {/* Card header */}
                <div style={{
                  padding: '13px 18px 11px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17,
                      letterSpacing: '0.04em', textTransform: 'uppercase', color: '#F5F6FA',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {league.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, color: '#5A5F6C', marginTop: 2 }}>
                      Saison {league.season}
                    </div>
                  </div>
                  {league.type === 'playoff' && (
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9,
                      letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0,
                      color: '#D40000', background: 'rgba(212,0,0,0.12)',
                      border: '1px solid rgba(212,0,0,0.25)',
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
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {['#', 'Team', 'Sp.', 'Pkt.'].map((h, i) => (
                    <span key={h} style={{
                      fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                      color: '#3A3E4A', letterSpacing: '0.08em', textTransform: 'uppercase',
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
                      borderBottom: i < preview.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14,
                      color: row.pos <= 3 ? '#E8B84A' : '#6A6E7B',
                      lineHeight: '1.3',
                    }}>
                      {row.pos}
                    </span>
                    <Link
                      href={`/teams/${row.team}`}
                      style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: row.pos === 1 ? 700 : 500,
                        fontSize: 13, color: '#F5F6FA', textDecoration: 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        minWidth: 0,
                      }}
                    >
                      {row.name}
                    </Link>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12,
                      color: '#9AA4B2', textAlign: 'right', lineHeight: '1.3',
                    }}>
                      {row.sp}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 13,
                      color: '#F5F6FA', textAlign: 'right', lineHeight: '1.3',
                    }}>
                      {row.pts}
                    </span>
                  </div>
                ))}

                {/* Footer: overflow hint + full-table link */}
                <div style={{
                  padding: '9px 18px',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: '#3A3E4A' }}>
                    {rows.length > PREVIEW_ROWS ? `+${rows.length - PREVIEW_ROWS} weitere` : ''}
                  </span>
                  <Link
                    href={`/ligen/${league.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                      color: '#D40000', textDecoration: 'none',
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
