'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  return (
    <>
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

          {/* Desktop nav — hidden on mobile via .mdu-header-nav */}
          <nav className="mdu-header-nav" style={{ display: 'flex', alignItems: 'center', gap: 26, flex: 1, justifyContent: 'center' }}>
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

          {/* Desktop login — hidden on mobile */}
          <Link
            href="/login"
            className="mdu-header-login"
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

          {/* Hamburger — hidden on desktop, shown on mobile via .mdu-hamburger */}
          <button
            className="mdu-hamburger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menü öffnen"
            style={{
              alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 8, flexShrink: 0,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#F5F6FA', cursor: 'pointer',
            }}
          >
            <Icon name="menu" size={20} stroke={2} />
          </button>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={`mdu-mobile-overlay${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />

      {/* Slide-in drawer */}
      <nav className={`mdu-mobile-drawer${drawerOpen ? ' open' : ''}`} aria-label="Mobile Navigation">
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <Image src="/mdu-logo.png" alt="Münchner Dart Union" height={28} width={80} style={{ height: 28, width: 'auto' }} />
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Menü schließen"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#9AA4B2', cursor: 'pointer',
            }}
          >
            <Icon name="close" size={18} stroke={2} />
          </button>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
          {NAV_ITEMS.map(item => {
            const active = activeHref ? item.href === activeHref : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '15px 20px',
                  fontFamily: 'var(--font-manrope)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 16,
                  color: active ? '#D40000' : '#C9CCD6',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: active ? 'rgba(212,0,0,0.06)' : 'transparent',
                  transition: 'background 120ms',
                }}
              >
                <span>{item.label}</span>
                {active && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#D40000', flexShrink: 0 }} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Login at bottom */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <Link
            href="/login"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'block', textAlign: 'center',
              padding: '13px', borderRadius: 8,
              background: 'transparent', color: '#D40000',
              border: '1.5px solid #D40000',
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 15,
              textDecoration: 'none', letterSpacing: '0.04em',
            }}
          >
            Login
          </Link>
        </div>
      </nav>
    </>
  );
}
