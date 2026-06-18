'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './icon';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageLeague, isSuperAdmin, ROLE_LABELS } from '@/lib/auth/roles';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  /** Mindestzugriff: 'league' (Ligaleitung+) oder 'super' (nur Super Admin). */
  require: 'league' | 'super';
}

const NAV_ITEMS: NavItem[] = [
  { icon: 'bar',      label: 'Dashboard',     href: '/admin',               require: 'league' },
  { icon: 'users',    label: 'Benutzer',      href: '/admin/users',         require: 'league' },
  { icon: 'edit',     label: 'Rollen',        href: '/admin/roles',         require: 'league' },
  { icon: 'trophy',   label: 'Teams',         href: '/admin/teams',         require: 'league' },
  { icon: 'user',     label: 'Spieler',       href: '/admin/players',       require: 'league' },
  { icon: 'list',     label: 'Anmeldungen',   href: '/admin/registrations',   require: 'league' },
  { icon: 'file',     label: 'Spielberichte', href: '/admin/spielberichte', require: 'league' },
  { icon: 'bell',     label: 'News',          href: '/admin/news',          require: 'league' },
  { icon: 'download', label: 'Downloads',     href: '/admin/downloads',     require: 'league' },
  { icon: 'upload',   label: 'Import',        href: '/admin/import',        require: 'league' },
  { icon: 'check',    label: 'Sicherheit',    href: '/admin/security',      require: 'league' },
  { icon: 'settings', label: 'Einstellungen', href: '/admin/settings',      require: 'super' },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const items = NAV_ITEMS.filter(item =>
    item.require === 'super' ? isSuperAdmin(user) : canManageLeague(user),
  );

  return (
    <aside style={{
      width: 260, background: '#0E1117',
      borderRight: '1px solid var(--th-line-6)',
      padding: '22px 14px', display: 'flex', flexDirection: 'column', gap: 4,
      minHeight: '100vh',
    }}>
      <div style={{ padding: '0 6px 16px', borderBottom: '1px solid var(--th-line-6)', marginBottom: 14 }}>
        <Image src="/mdu-logo.webp" unoptimized alt="Münchner Dart Union" height={32} width={91} style={{ height: 32, width: 'auto' }} />
        <div style={{ marginTop: 14, fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--th-text-faint2)', textTransform: 'uppercase' }}>
          Admin Konsole
        </div>
      </div>

      {items.map(item => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
              borderRadius: 8, textDecoration: 'none',
              background: active ? 'var(--th-accent-a12)' : 'transparent',
              color: active ? 'var(--th-text-strong)' : 'var(--th-text-dim)',
              border: active ? '1px solid var(--th-accent-a30)' : '1px solid transparent',
              fontFamily: 'var(--font-manrope)', fontWeight: active ? 700 : 500, fontSize: 14,
              transition: 'all 150ms',
            }}
          >
            <Icon name={item.icon as 'bar'} size={17} />
            <span style={{ flex: 1 }}>{item.label}</span>
          </Link>
        );
      })}

      {/* Echter eingeloggter Benutzer */}
      <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--th-line-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,var(--th-accent),var(--th-accent-deep))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, color: '#fff', fontSize: 14,
          }}>{user ? user.displayName.slice(0, 2).toUpperCase() : '–'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user ? user.displayName : 'Nicht eingeloggt'}
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-dim)' }}>
              {user ? ROLE_LABELS[user.role] : '—'}
            </div>
          </div>
          {user && (
            <button onClick={() => signOut()} aria-label="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-faint2)', flexShrink: 0, display: 'flex' }}>
              <Icon name="logout" size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
