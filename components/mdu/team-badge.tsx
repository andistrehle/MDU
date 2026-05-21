import { shade } from '@/lib/utils';

interface TeamBadgeProps {
  initials: string;
  color?: string;
  size?: number;
  ring?: string;
  className?: string;
}

export function TeamBadge({ initials, color = '#D40000', size = 36, ring = '#E8B84A', className }: TeamBadgeProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: `linear-gradient(135deg, ${color}, ${shade(color, -0.35)})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F5F6FA',
        fontFamily: 'var(--font-saira-condensed)',
        fontWeight: 900,
        fontSize: size * 0.42,
        letterSpacing: '0.04em',
        border: `1.5px solid ${ring}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.4)',
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
}
