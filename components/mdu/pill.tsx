import { ReactNode } from 'react';

type PillTone = 'neutral' | 'red' | 'green' | 'blue' | 'gold' | 'live';

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  dot?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const tones: Record<PillTone, { bg: string; fg: string; dot: string }> = {
  neutral: { bg: 'var(--th-line-6)', fg: 'var(--th-text-body)', dot: 'var(--th-text-dim)' },
  red:     { bg: 'rgba(212,0,0,0.16)',     fg: 'var(--th-loss)', dot: '#FF1F1F' },
  green:   { bg: 'rgba(34,197,94,0.14)',   fg: 'var(--th-win)', dot: '#22C55E' },
  blue:    { bg: 'rgba(59,130,246,0.14)',  fg: '#6FA3FF', dot: '#3B82F6' },
  gold:    { bg: 'rgba(232,184,74,0.16)',  fg: '#F0CB6E', dot: 'var(--th-gold)' },
  live:    { bg: 'rgba(212,0,0,0.18)',     fg: 'var(--th-loss)', dot: '#FF1F1F' },
};

export function Pill({ tone = 'neutral', children, dot = true, style, className }: PillProps) {
  const t = tones[tone];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px',
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        fontFamily: 'var(--font-manrope)',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: t.dot,
            flexShrink: 0,
            animation: tone === 'live' ? 'mdu-pulse 1.6s infinite' : undefined,
          }}
        />
      )}
      {children}
    </span>
  );
}
