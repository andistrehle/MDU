'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from './icon';
import { formatWinRate, type SeasonPlayerStats } from '@/lib/data';

// ── Data shape ─────────────────────────────────────────────────

export interface PlayerCardData {
  /** null when the entry could not be resolved to a roster player (no profile link). */
  playerId: string | null;
  displayName: string;
  nickname: string | null;
  photoUrl?: string;
  teamName: string;
  /** Accent colour — the player's team colour. */
  teamColor: string;
  stats: SeasonPlayerStats;
}

// ── Helpers ────────────────────────────────────────────────────

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function CardAvatar({ name, color, photoUrl }: { name: string; color: string; photoUrl?: string }) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = photoUrl && !imgError;
  return (
    <div style={{
      width: 84, height: 84, borderRadius: '50%', flexShrink: 0,
      background: showPhoto ? 'var(--th-bg-inset)' : `${color}22`,
      border: `2px solid ${color}66`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, color,
    }}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center top', display: 'block' }} />
      ) : initialsFromName(name)}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{
      flex: 1, minWidth: 64, textAlign: 'center',
      background: 'var(--th-line-4)', border: '1px solid var(--th-line-6)',
      borderRadius: 10, padding: '10px 8px',
    }}>
      <div style={{
        fontFamily: 'var(--font-manrope)', fontSize: 9, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22,
        color: accent ?? 'var(--th-text-strong)', lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

function FormBadge({ outcome }: { outcome: 'W' | 'D' | 'L' }) {
  const color = outcome === 'W' ? '#22C55E' : outcome === 'L' ? '#EF4444' : 'var(--th-gold)';
  const label = outcome === 'W' ? 'S' : outcome === 'L' ? 'N' : 'U';
  return (
    <span style={{
      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 13,
      color, background: `${color}1A`, border: `1px solid ${color}40`,
    }}>
      {label}
    </span>
  );
}

function PlaceholderNote({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)',
      fontStyle: 'italic', padding: '10px 0',
    }}>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────

export function PlayerCard({ data, onClose }: { data: PlayerCardData; onClose: () => void }) {
  const { stats } = data;
  const accent = data.teamColor;

  // Close on Escape; lock body scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const balance = stats.hasOfficialStats
    ? `${stats.wins} S · ${stats.draws} U · ${stats.losses} N`
    : '–';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.62)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      className="mdu-player-card-overlay"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="mdu-player-card-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Spielerkarte ${data.displayName}`}
        style={{
          width: '100%', maxWidth: 440, maxHeight: '88vh', overflowY: 'auto',
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)',
          borderRadius: 18, boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          position: 'relative',
        }}
      >
        {/* Accent header band */}
        <div style={{
          background: `linear-gradient(135deg, ${accent}33, transparent 70%)`,
          borderBottom: '1px solid var(--th-line-6)',
          padding: '22px 22px 20px',
        }}>
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 34, height: 34, borderRadius: 9, cursor: 'pointer',
              background: 'var(--th-line-6)', border: '1px solid var(--th-line-8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--th-text-muted)',
            }}
          >
            <Icon name="close" size={16} stroke={2} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <CardAvatar name={data.displayName} color={accent} photoUrl={data.photoUrl} />
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26,
                color: 'var(--th-text-strong)', lineHeight: 1.05, textTransform: 'uppercase',
              }}>
                {data.displayName}
              </div>
              {data.nickname && (
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 3 }}>
                  „{data.nickname}“
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Icon name="users" size={13} stroke={2} style={{ color: accent, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-body)' }}>
                  {data.teamName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 22px 22px' }}>
          {/* KPI tiles */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <StatTile label="Rang" value={stats.rank !== null ? `#${stats.rank}` : '–'} accent={accent} />
            <StatTile label="Punkte" value={stats.points !== null ? String(stats.points) : '–'} />
            <StatTile label="Quote" value={formatWinRate(stats.winRate)} accent={stats.winRate !== null ? '#22C55E' : undefined} />
          </div>

          {/* Bilanz */}
          <SectionTitle accent={accent}>Bilanz</SectionTitle>
          {stats.hasOfficialStats ? (
            <>
              <div style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
                color: 'var(--th-text-strong)', marginBottom: 10,
              }}>
                {balance}
                <span style={{ color: 'var(--th-text-faint)', fontWeight: 400 }}>{`  ·  ${stats.matches} Spiele`}</span>
              </div>
              {stats.matches > 0 && (
                <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 18 }}>
                  <div style={{ flex: stats.wins || 0.001, background: '#22C55E' }} />
                  {stats.draws > 0 && <div style={{ flex: stats.draws, background: 'var(--th-gold)' }} />}
                  <div style={{ flex: stats.losses || 0.001, background: '#EF4444' }} />
                </div>
              )}
            </>
          ) : (
            <PlaceholderNote>Noch keine Detaildaten verfügbar.</PlaceholderNote>
          )}

          {/* Form */}
          <SectionTitle accent={accent}>Form</SectionTitle>
          {stats.form.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {stats.form.map((f, i) => <FormBadge key={i} outcome={f} />)}
            </div>
          ) : (
            <PlaceholderNote>Noch keine Formdaten verfügbar.</PlaceholderNote>
          )}

          {/* Letzte Ergebnisse */}
          <SectionTitle accent={accent}>Letzte Ergebnisse</SectionTitle>
          {stats.recentResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
              {stats.recentResults.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'var(--font-manrope)', fontSize: 13,
                }}>
                  <FormBadge outcome={r.outcome} />
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.result}</span>
                  <span style={{ color: 'var(--th-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    vs {r.opponent}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <PlaceholderNote>Noch keine Einzelergebnisse verfügbar.</PlaceholderNote>
          )}

          {/* Profile link */}
          {data.playerId ? (
            <Link
              href={`/spieler/${data.playerId}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 4, padding: '12px 18px', borderRadius: 11,
                background: accent, color: '#fff', textDecoration: 'none',
                fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
                letterSpacing: '0.02em',
              }}
            >
              Vollständiges Profil
              <Icon name="arrow-right" size={15} stroke={2.2} />
            </Link>
          ) : (
            <div style={{
              marginTop: 4, padding: '12px 18px', borderRadius: 11, textAlign: 'center',
              background: 'var(--th-line-4)', border: '1px solid var(--th-line-6)',
              fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)',
            }}>
              Profil noch nicht verfügbar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 10,
      letterSpacing: '0.16em', color: accent, textTransform: 'uppercase', marginBottom: 8,
    }}>
      {children}
    </div>
  );
}
