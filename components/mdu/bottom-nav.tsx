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

// Anker für die Demo-Tour (gleiche Werte wie im Desktop-Header).
const NAV_TOUR: Record<string, string> = {
  '/ligen':      'nav-ligen',
  '/spielplan':  'nav-spielplan',
  '/ergebnisse': 'nav-ergebnisse',
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="mdu-bottom-nav" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: 'var(--th-bg-header)', borderTop: '1px solid var(--th-line-6)',
      padding: '10px 6px 26px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {ITEMS.map(item => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            data-tour={NAV_TOUR[item.href]}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              position: 'relative', color: active ? 'var(--th-accent)' : 'var(--th-text-muted)',
              textDecoration: 'none', minWidth: 48,
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: -10, width: 5, height: 5, borderRadius: '50%',
                background: 'var(--th-accent)', boxShadow: '0 0 8px var(--th-accent)',
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
