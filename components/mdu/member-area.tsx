'use client';

import Link from 'next/link';
import { DesktopHeader } from './desktop-header';
import { Icon } from './icon';

/** Member-area page shell (breadcrumb „Mein Bereich → …" + heading). */
export function MemberShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mein-bereich" />
      <div className="mdu-section-pad" style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 80px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
          fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)',
        }}>
          <Link href="/mein-bereich" style={{ color: 'var(--th-text-muted)', textDecoration: 'none' }}>Mein Bereich</Link>
          <Icon name="chevron" size={11} />
          <span style={{ color: 'var(--th-text-strong)' }}>{title}</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 36,
          letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
          margin: '0 0 24px', paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
        }}>
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

export function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '28px 24px', maxWidth: 540 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)', marginBottom: 8 }}>{title}</div>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.6, margin: 0 }}>{children}</p>
    </div>
  );
}

export function Muted({ children }: { children: React.ReactNode }) {
  return <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>{children}</p>;
}

export function LoginLink() {
  return <Link href="/login" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Zur Anmeldung →</Link>;
}
