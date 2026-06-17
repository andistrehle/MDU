'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageLeague } from '@/lib/auth/roles';

/**
 * Schützt Ligaleitungs-Verwaltungsseiten unter /admin.
 * Zeigt Heading + Inhalt nur für league_admin / super_admin.
 */
export function AdminGuard({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

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
          Dieser Verwaltungsbereich ist nur für Ligaleitung und Super Admins.{' '}
          <Link href="/login" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zur Anmeldung →</Link>
        </AdminNotice>
      ) : !canManageLeague(user) ? (
        <AdminNotice title="Keine Berechtigung">
          Dieser Bereich ist nur für Ligaleitung und Super Admins.
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
