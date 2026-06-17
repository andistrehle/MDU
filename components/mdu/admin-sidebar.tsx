'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';

const NAV_ITEMS = [
  { icon: 'bar',      label: 'Dashboard',    href: '/admin' },
  { icon: 'user',     label: 'Benutzer',     href: '/admin/users' },
  { icon: 'trophy',   label: 'Ligen',        href: '/admin/ligen' },
  { icon: 'calendar', label: 'Spiele',       href: '/admin/spiele', badge: '3' },
  { icon: 'users',    label: 'Teams',        href: '/admin/teams' },
  { icon: 'list',     label: 'Anmeldungen',  href: '/admin/anmeldungen' },
  { icon: 'file',     label: 'Spielberichte', href: '/admin/spielberichte' },
  { icon: 'user',     label: 'Mitglieder',   href: '/admin/mitglieder' },
  { icon: 'pin',      label: 'Spielstätten', href: '/admin/spielstaetten' },
  { icon: 'file',     label: 'News',         href: '/admin/news' },
  { icon: 'upload',   label: 'Medien',       href: '/admin/medien' },
  { icon: 'bar',      label: 'Statistik',    href: '/admin/statistik' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 260, background: '#0E1117',
      borderRight: '1px solid var(--th-line-6)',
      padding: '22px 14px', display: 'flex', flexDirection: 'column', gap: 6,
      minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '0 6px 16px', borderBottom: '1px solid var(--th-line-6)', marginBottom: 14 }}>
        <Image src="/mdu-logo.webp" unoptimized alt="Münchner Dart Union" height={32} width={91} style={{ height: 32, width: 'auto' }} />
        <div style={{ marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--th-text-faint2)', textTransform: 'uppercase' }}>
          Admin Konsole
        </div>
      </div>

      {NAV_ITEMS.map(item => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 8, textDecoration: 'none',
              background: active ? 'var(--th-accent-a12)' : 'transparent',
              color: active ? 'var(--th-text-strong)' : 'var(--th-text-dim)',
              border: active ? '1px solid var(--th-accent-a30)' : '1px solid transparent',
              fontFamily: 'var(--font-manrope)', fontWeight: active ? 700 : 500, fontSize: 14,
              transition: 'all 150ms',
            }}
          >
            <Icon name={item.icon} size={17} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                minWidth: 20, height: 20, borderRadius: 10, padding: '0 6px',
                background: 'var(--th-accent)', color: '#fff',
                fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, fontSize: 11,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}

      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--th-line-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--th-accent),var(--th-accent-deep))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, color: '#fff', fontSize: 14,
            flexShrink: 0,
          }}>SA</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>Stefan Achatz</div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-dim)' }}>Vorstand · Admin</div>
          </div>
          <Icon name="logout" size={16} style={{ color: 'var(--th-text-faint2)', flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}
