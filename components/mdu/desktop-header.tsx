'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

const NAV_ITEMS = [
  { label: 'Startseite', href: '/' },
  { label: 'Ligen',      href: '/ligen', dropdown: true },
  { label: 'Spielplan',  href: '/spielplan' },
  { label: 'Ergebnisse', href: '/ergebnisse' },
  { label: 'Teams',      href: '/teams' },
  { label: 'Spielstätten', href: '/spielstaetten' },
  { label: 'Downloads',  href: '/downloads' },
  { label: 'Kontakt',    href: '/kontakt' },
];

interface DesktopHeaderProps {
  activeHref?: string;
}

export function DesktopHeader({ activeHref }: DesktopHeaderProps) {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(5,7,10,0.92)',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>
        <Link href="/" style={{ display: 'block', flexShrink: 0 }}>
          <Image src="/mdu-logo.png" alt="Münchner Dart Union" height={36} width={103} style={{ height: 36, width: 'auto' }} priority />
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 26, flex: 1, justifyContent: 'center' }}>
          {NAV_ITEMS.map(item => {
            const active = activeHref ? item.href === activeHref : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-manrope)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  color: active ? '#D40000' : '#C9CCD6',
                  textDecoration: 'none',
                  padding: '24px 0',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 120ms',
                  whiteSpace: 'nowrap',
                }}
                className={active ? 'mdu-nav-active' : ''}
              >
                {item.label}
                {item.dropdown && <Icon name="chevron-down" size={13} stroke={2} />}
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    height: 2, background: '#D40000', borderRadius: 1,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/login"
          style={{
            padding: '9px 22px', borderRadius: 6,
            background: 'transparent', color: '#D40000',
            border: '1.5px solid #D40000', fontFamily: 'var(--font-manrope)',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            letterSpacing: '0.02em', transition: 'all 150ms', flexShrink: 0,
            display: 'inline-block',
          }}
        >
          Login
        </Link>
      </div>
    </header>
  );
}
