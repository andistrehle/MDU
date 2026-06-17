'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageLeague, isSuperAdmin } from '@/lib/auth/roles';

/**
 * Schützt Verwaltungsseiten unter /admin.
 * `require`: 'league' (Ligaleitung+) oder 'super' (nur Super Admin).
 */
export function AdminGuard({ title, subtitle, require = 'league', children }: {
  title: string;
  subtitle?: string;
  require?: 'league' | 'super';
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const allowed = require === 'super' ? isSuperAdmin(user) : canManageLeague(user);
  const roleHint = require === 'super' ? 'Super Admins' : 'Ligaleitung und Super Admins';

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, color: 'var(--th-text-strong)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: '0 0 22px' }}>{subtitle}</p>}

      {loading ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : !user ? (
        <AdminNotice title="Bitte einloggen">
          Dieser Verwaltungsbereich ist nur für {roleHint}.{' '}
          <Link href="/login" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zur Anmeldung →</Link>
        </AdminNotice>
      ) : !allowed ? (
        <AdminNotice title="Keine Berechtigung">
          Dieser Bereich ist nur für {roleHint}. Eigene Daten findest du im{' '}
          <Link href="/mein-bereich" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Mein Bereich</Link>.
        </AdminNotice>
      ) : (
        children
      )}
    </div>
  );
}

export function AdminNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '28px 24px', maxWidth: 540 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)', marginBottom: 8 }}>{title}</div>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}

/** Strukturierter Empty State für noch nicht datengestützte Verwaltungsbereiche. */
export function AdminEmpty({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14,
      padding: '36px 28px', textAlign: 'center', maxWidth: 620,
      fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', lineHeight: 1.6,
    }}>
      {icon}
      {children}
    </div>
  );
}
