'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

const ITEMS = [
  { label: 'Start',      href: '/',           icon: 'home' },
  { label: 'Ligen',      href: '/ligen',      icon: 'trophy' },
  { label: 'Spielplan',  href: '/spielplan',  icon: 'calendar' },
  { label: 'Ergebnisse', href: '/ergebnisse', icon: 'flag' },
  { label: 'Mehr',       href: '/mehr',       icon: 'menu' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="mdu-bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#0D1117', borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 6px 26px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {ITEMS.map(item => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              position: 'relative', color: active ? '#D40000' : '#9AA4B2',
              textDecoration: 'none', minWidth: 48,
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: -10, width: 5, height: 5, borderRadius: '50%',
                background: '#D40000', boxShadow: '0 0 8px #D40000',
              }} />
            )}
            <Icon name={item.icon} size={20} stroke={active ? 2.2 : 1.8} />
            <span style={{
              fontFamily: 'var(--font-manrope)', fontWeight: active ? 700 : 500, fontSize: 10,
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
