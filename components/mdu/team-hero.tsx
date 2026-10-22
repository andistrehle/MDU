// ============================================================
// TeamHero — Kopf der Teamseite (Logo, Name, Pills, Kennzahlen)
// ============================================================
//
// Gemeinsam für die Saison 2026/27 und das Archiv 2025/26, damit beide
// Teamseiten gleich aussehen (Betreiber, 22.10.2026: „so wie letzte Saison").
// ============================================================

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from './icon';
import { shade } from '@/lib/utils';

export interface TeamHeroKpi { n: string; l: string; c?: string }

export function TeamHero({ name, short, color, logoUrl, umschalter, pills, infos, kpis }: {
  name: string;
  short: string;
  color: string;
  logoUrl: string | null;
  umschalter?: React.ReactNode;
  pills?: React.ReactNode;
  infos: { icon: 'pin' | 'trophy' | 'bar' | 'user'; text: string }[];
  kpis: TeamHeroKpi[];
}) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `linear-gradient(180deg, ${shade(color, -0.55)}22 0%, var(--th-bg-deep) 100%), var(--th-bg-deep)`,
      borderBottom: '1px solid var(--th-line-6)',
    }}>
      <div aria-hidden className="mdu-banner-dartboard" style={{
        position: 'absolute', right: -220, top: '50%', transform: 'translateY(-50%)',
        width: 680, height: 680, pointerEvents: 'none', opacity: 0.5,
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
        maskImage: 'radial-gradient(circle at 50% 50%, #000 0%, #000 65%, transparent 92%)',
      }}>
        <Image src="/mdu-hero-dartboard-2.webp"
          unoptimized alt="" width={680} height={680}
          style={{ width: 680, height: 680, objectFit: 'cover', objectPosition: 'center' }} />
      </div>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(circle at 20% 50%, ${color}20, transparent 50%)`,
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, var(--th-bg-deep) 35%, var(--th-veil-40) 65%, var(--th-veil-70))',
      }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '34px 32px 30px', position: 'relative' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-dim)', marginBottom: 24 }}>
          <Link href="/" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Startseite</Link>
          <Icon name="chevron" size={12} />
          <Link href="/teams" style={{ color: 'var(--th-text-dim)', textDecoration: 'none' }}>Teams</Link>
          <Icon name="chevron" size={12} />
          <span style={{ color: 'var(--th-text-strong)' }}>{name}</span>
        </div>
        {umschalter}

        {/* Team identity */}
        <div className="mdu-team-hero-flex" style={{ display: 'flex', alignItems: 'flex-end', gap: 30 }}>
          <div className="mdu-team-logo" style={{
            width: 144, height: 144, borderRadius: '24%', flexShrink: 0,
            background: logoUrl ? 'var(--th-text-strong)' : `linear-gradient(135deg, ${color}, ${shade(color, -0.5)})`,
            border: '2px solid var(--th-gold)',
            boxShadow: `0 24px 60px ${color}50, inset 0 2px 0 rgba(255,255,255,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 64, color: 'var(--th-text-strong)',
          }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            ) : (
              short
            )}
          </div>

          <div style={{ flex: 1 }}>
            {pills && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                {pills}
              </div>
            )}
            <h1 className="mdu-team-name" style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 72,
              lineHeight: 0.9, letterSpacing: '-0.005em', color: 'var(--th-text-strong)',
              margin: 0, textTransform: 'uppercase',
            }}>
              {name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px 22px', marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', flexWrap: 'wrap' }}>
              {infos.map(i => (
                <span key={i.icon + i.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={i.icon} size={14} stroke={2} /> {i.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mdu-kpi-strip" style={{
          marginTop: 34, display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 1,
          background: 'var(--th-line-6)', border: '1px solid var(--th-line-6)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {kpis.map((s, i) => (
            <div key={i} className="mdu-kpi-cell" style={{ background: 'var(--th-bg-card3)', padding: '18px 18px' }}>
              <div style={{
                fontFamily: 'var(--font-saira-condensed)',
                fontWeight: 900, fontSize: 32,
                color: s.c ?? 'var(--th-text-strong)', lineHeight: 1,
              }}>
                {s.n}
              </div>
              <div style={{
                fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.16em', color: 'var(--th-text-dim)', textTransform: 'uppercase', marginTop: 8,
              }}>
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mannschaftsbild unter dem Kopf (nur wenn hochgeladen). */
export function Mannschaftsbild({ url, name }: { url: string | null | undefined; name: string }) {
  if (!url) return null;
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 32px 0' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Mannschaftsbild ${name}`}
        style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 16, border: '1px solid var(--th-line-6)', display: 'block' }} />
    </div>
  );
}
