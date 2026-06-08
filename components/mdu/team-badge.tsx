'use client';

import { useState } from 'react';
import { shade } from '@/lib/utils';

interface TeamBadgeProps {
  initials: string;
  color?: string;
  size?: number;
  ring?: string;
  className?: string;
  /** Path to team logo in /public, e.g. '/team-logos/freibad-bazis.png'.
   *  If provided the real logo is shown; falls back to the initials badge on
   *  load error or when undefined. */
  logoUrl?: string;
}

export function TeamBadge({
  initials,
  color = '#D40000',
  size = 36,
  ring = '#E8B84A',
  className,
  logoUrl,
}: TeamBadgeProps) {
  // If the img fails to load we fall back to the initials badge
  const [imgFailed, setImgFailed] = useState(false);

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    border: `1.5px solid ${ring}`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.4)',
    userSelect: 'none',
    overflow: 'hidden',
  };

  if (logoUrl && !imgFailed) {
    return (
      <div
        className={className}
        style={{ ...baseStyle, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Plain <img> avoids Next.js image-optimization pipeline edge cases */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={initials}
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        background: `linear-gradient(135deg, ${color}, ${shade(color, -0.35)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5F6FA',
        fontFamily: 'var(--font-saira-condensed)',
        fontWeight: 900,
        fontSize: size * 0.42,
        letterSpacing: '0.04em',
      }}
    >
      {initials}
    </div>
  );
}
