'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
import { ThemeToggle } from './theme-toggle';
import { NotificationBadge } from './notification-badge';
import { LEAGUES } from '@/lib/data';
import { useAuth } from '@/lib/auth/auth-context';
import { useAdminNotificationCounts } from '@/lib/supabase/admin-counts';

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

// Sorted league lists for the dropdown — computed once at module level
const SORTED = [...LEAGUES].sort((a, b) => a.sortOrder - b.sortOrder);
const DROPDOWN_PLAYOFFS = SORTED.filter(l => l.type === 'playoff');
const DROPDOWN_REGULAR  = SORTED.filter(l => l.type !== 'playoff');

interface DesktopHeaderProps {
  activeHref?: string;
}

// Shared link style for dropdown items
const dropdownItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 16px',
  fontFamily: 'var(--font-manrope)', fontWeight: 500, fontSize: 13,
  color: 'var(--th-text-body)', textDecoration: 'none',
  whiteSpace: 'nowrap',
};

export function DesktopHeader({ activeHref }: DesktopHeaderProps) {
  const pathname = usePathname();

  // Login-Zustand: Gast → „Login" (/login), eingeloggt → „Mein Bereich"
  const { user } = useAuth();
  const accountHref  = user ? '/mein-bereich' : '/login';
  const accountLabel = user ? 'Mein Bereich' : 'Login';

  // Gesamt-Badge für offene Admin-Aufgaben (nur für Admins > 0).
  const { counts } = useAdminNotificationCounts();
  const adminTotal = counts.total;

  // Ligen dropdown — hover-intent timer so cursor can travel from link to panel
  const [ligaOpen, setLigaOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openLiga  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setLigaOpen(true); };
  const closeLiga = () => { closeTimer.current = setTimeout(() => setLigaOpen(false), 120); };

  return (
    <header className="mdu-site-header" style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--th-bg-glass)',
      backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
      borderBottom: '1px solid var(--th-line-6)',
    }}>
      <div className="mdu-header-inner" style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>
        <Link href="/" style={{ display: 'block', flexShrink: 0 }}>
          <Image src="/mdu-logo.webp" unoptimized alt="Münchner Dart Union" height={36} width={103} style={{ height: 36, width: 'auto' }} priority />
        </Link>

        {/* Desktop nav — hidden on mobile via .mdu-header-nav */}
        <nav className="mdu-header-nav" style={{ display: 'flex', alignItems: 'center', gap: 26, flex: 1, justifyContent: 'center' }}>
          {NAV_ITEMS.map(item => {
            const active = activeHref ? item.href === activeHref : pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            // Ligen: wrap in hover-sensitive div that hosts the dropdown
            if (item.dropdown) {
              return (
                <div
                  key={item.label}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 70 }}
                  onMouseEnter={openLiga}
                  onMouseLeave={closeLiga}
                >
                  <Link
                    href={item.href}
                    className="mdu-nav-link"
                    style={{
                      fontFamily: 'var(--font-manrope)',
                      fontWeight: active ? 700 : 500,
                      fontSize: 14,
                      color: active || ligaOpen ? 'var(--th-accent)' : 'var(--th-text-body)',
                      textDecoration: 'none',
                      padding: '24px 0',
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'color 120ms',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                    <Icon
                      name="chevron-down"
                      size={13}
                      stroke={2}
                      style={{
                        transform: ligaOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 150ms ease',
                      }}
                    />
                    {active && (
                      <span style={{
                        position: 'absolute', left: 0, right: 0, bottom: 0,
                        height: 2, background: 'var(--th-accent)', borderRadius: 1,
                      }} />
                    )}
                  </Link>

                  {/* Dropdown panel */}
                  {ligaOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 200,
                        paddingTop: 6, // invisible bridge so cursor can reach the panel
                      }}
                      onMouseEnter={openLiga}
                      onMouseLeave={closeLiga}
                    >
                      <div style={{
                        background: 'var(--th-bg-header)',
                        border: '1px solid var(--th-line-8)',
                        borderRadius: 10,
                        padding: '8px 0',
                        minWidth: 250,
                        boxShadow: '0 20px 56px rgba(0,0,0,0.7)',
                      }}>
                        {/* Group: Playoffs */}
                        <div style={{
                          fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.16em', color: 'var(--th-text-faint2)', textTransform: 'uppercase',
                          padding: '4px 16px 6px',
                        }}>
                          Playoffs
                        </div>
                        {DROPDOWN_PLAYOFFS.map(league => (
                          <Link
                            key={league.id}
                            href={`/ligen/${league.id}`}
                            style={dropdownItemStyle}
                            className="mdu-nav-dropdown-item"
                            onClick={() => setLigaOpen(false)}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: league.color, flexShrink: 0 }} />
                            {league.name}
                          </Link>
                        ))}

                        {/* Divider */}
                        <div style={{ height: 1, background: 'var(--th-line-6)', margin: '6px 0' }} />

                        {/* Group: Ligen */}
                        <div style={{
                          fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.16em', color: 'var(--th-text-faint2)', textTransform: 'uppercase',
                          padding: '4px 16px 6px',
                        }}>
                          Ligen
                        </div>
                        {DROPDOWN_REGULAR.map(league => (
                          <Link
                            key={league.id}
                            href={`/ligen/${league.id}`}
                            style={dropdownItemStyle}
                            className="mdu-nav-dropdown-item"
                            onClick={() => setLigaOpen(false)}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: league.color, flexShrink: 0 }} />
                            {league.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // All other nav items — unchanged
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  fontFamily: 'var(--font-manrope)',
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                  color: active ? 'var(--th-accent)' : 'var(--th-text-body)',
                  textDecoration: 'none',
                  padding: '24px 0',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 120ms',
                  whiteSpace: 'nowrap',
                }}
                className={active ? 'mdu-nav-link mdu-nav-active' : 'mdu-nav-link'}
              >
                {item.label}
                {active && (
                  <span style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    height: 2, background: 'var(--th-accent)', borderRadius: 1,
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Old School / New Design switch — desktop top right, next to Login */}
        <span className="mdu-header-login" style={{ display: 'inline-flex', flexShrink: 0 }}>
          <ThemeToggle compact />
        </span>

        {/* Desktop account button — Login (Gast) / Mein Bereich (eingeloggt) */}
        <Link
          href={accountHref}
          className="mdu-header-login"
          style={{
            padding: '9px 22px', borderRadius: 6,
            background: 'transparent', color: 'var(--th-accent)',
            border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            letterSpacing: '0.02em', transition: 'all 150ms', flexShrink: 0,
            display: 'inline-block', whiteSpace: 'nowrap', position: 'relative',
          }}
        >
          {accountLabel}
          <NotificationBadge count={adminTotal} absolute ringColor="var(--th-bg-glass)" title={`${adminTotal} offene Admin-Aufgaben`} />
        </Link>

        {/* Mobile actions — compact theme toggle + account button (mobile only) */}
        <span className="mdu-mobile-actions" style={{ alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <ThemeToggle mini />
          <Link
            href={accountHref}
            className="mdu-mobile-login"
            aria-label={accountLabel}
            style={{
              padding: '8px 14px', borderRadius: 6,
              background: 'transparent', color: 'var(--th-accent)',
              border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)',
              fontWeight: 700, fontSize: 13, textDecoration: 'none',
              letterSpacing: '0.04em', flexShrink: 0, whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6, position: 'relative',
            }}
          >
            {user ? <Icon name="user" size={16} stroke={2.2} /> : 'Login'}
            <NotificationBadge count={adminTotal} absolute ringColor="var(--th-bg-glass)" title={`${adminTotal} offene Admin-Aufgaben`} />
          </Link>
        </span>
      </div>
    </header>
  );
}
