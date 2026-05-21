import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './icon';

type BtnKind = 'primary' | 'outline' | 'ghost' | 'dark' | 'gold';
type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind;
  size?: BtnSize;
  icon?: string;
  iconR?: string;
  children?: ReactNode;
}

const variants: Record<BtnKind, React.CSSProperties> = {
  primary: { background: '#D40000', color: '#fff', border: '1px solid #FF1F1F', boxShadow: '0 6px 18px rgba(212,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)' },
  ghost:   { background: 'rgba(255,255,255,0.04)', color: '#F5F6FA', border: '1px solid rgba(255,255,255,0.10)' },
  outline: { background: 'transparent', color: '#F5F6FA', border: '1px solid rgba(255,255,255,0.18)' },
  dark:    { background: '#14161E', color: '#F5F6FA', border: '1px solid rgba(255,255,255,0.10)' },
  gold:    { background: '#E8B84A', color: '#0A0B0F', border: '1px solid #F0CB6E', boxShadow: '0 6px 14px rgba(232,184,74,0.25)' },
};

const sizes: Record<BtnSize, React.CSSProperties> = {
  sm: { padding: '8px 14px', fontSize: 13, borderRadius: 8 },
  md: { padding: '11px 18px', fontSize: 14, borderRadius: 10 },
  lg: { padding: '14px 22px', fontSize: 15, borderRadius: 10 },
};

export function Btn({ kind = 'primary', size = 'md', icon, iconR, children, style, ...rest }: BtnProps) {
  const iconSize = size === 'sm' ? 14 : 16;
  return (
    <button
      {...rest}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontFamily: 'var(--font-manrope)',
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        transition: 'all 150ms ease',
        ...sizes[size],
        ...variants[kind],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={iconSize} stroke={2} />}
      {children}
      {iconR && <Icon name={iconR} size={iconSize} stroke={2} />}
    </button>
  );
}
