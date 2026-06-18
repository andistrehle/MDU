'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AdminSidebar } from './admin-sidebar';
import { Icon } from './icon';

/**
 * Responsive Rahmen der Admin-Konsole.
 * Desktop: feste Sidebar links + Topbar. Mobile: volle Breite, Sidebar als
 * Drawer über einen Menü-Button (kompakte Topbar oben).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Body-Scroll sperren, solange der Drawer offen ist
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [drawerOpen]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--th-bg-page)' }}>
      {/* Desktop-Sidebar */}
      <div className="mdu-admin-sidebar-desktop" style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', overflowY: 'auto' }}>
        <AdminSidebar />
      </div>

      {/* Mobile-Drawer */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, maxWidth: '85vw', overflowY: 'auto', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Menü schließen"
              style={{
                position: 'absolute', top: 16, right: 12, zIndex: 1,
                width: 34, height: 34, borderRadius: 8, cursor: 'pointer',
                background: 'var(--th-line-6)', border: '1px solid var(--th-line-8)',
                color: 'var(--th-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="close" size={16} stroke={2} />
            </button>
            <AdminSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Inhalt */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile-Topbar */}
        <div className="mdu-admin-topbar-mobile" style={{
          height: 60, padding: '0 16px', background: 'var(--th-bg-header)',
          borderBottom: '1px solid var(--th-line-6)',
          alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 40,
        }}>
          <Image src="/mdu-logo.webp" unoptimized alt="MDU" height={26} width={74} style={{ height: 26, width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.18em', color: 'var(--th-text-faint2)', textTransform: 'uppercase' }}>Admin</span>
          <Link
            href="/mein-bereich"
            aria-label="Zu Mein Bereich"
            style={{
              marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8, textDecoration: 'none',
              background: 'transparent', border: '1px solid var(--th-line-8)',
              color: 'var(--th-text-body)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
            }}
          >
            <Icon name="home" size={15} stroke={2} /> Mein Bereich
          </Link>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Admin-Menü öffnen"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
              color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
            }}
          >
            <Icon name="menu" size={16} stroke={2} /> Menü
          </button>
        </div>

        {/* Desktop-Topbar */}
        <div className="mdu-admin-topbar-desktop" style={{
          height: 70, padding: '0 30px', background: 'var(--th-bg-header)',
          borderBottom: '1px solid var(--th-line-6)',
          alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--th-bg-page)', border: '1px solid var(--th-line-8)',
            borderRadius: 8, padding: '10px 14px', flex: 1, maxWidth: 360,
          }}>
            <Icon name="search" size={15} style={{ color: 'var(--th-text-faint2)' }} />
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint2)' }}>Suchen… </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-faint2)', background: 'var(--th-line-4)', padding: '2px 6px', borderRadius: 4 }}>⌘K</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/mein-bereich"
              aria-label="Zu Mein Bereich"
              className="mdu-bell-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px',
                borderRadius: 8, textDecoration: 'none',
                background: 'var(--th-bg-page)', border: '1px solid var(--th-line-8)',
                color: 'var(--th-text-body)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              }}
            >
              <Icon name="home" size={16} stroke={2} /> Mein Bereich
            </Link>
          </div>
        </div>

        <main style={{ flex: 1, minWidth: 0, padding: '24px clamp(16px, 4vw, 30px)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
