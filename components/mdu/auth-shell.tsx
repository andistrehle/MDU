'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * Shared building blocks for the auth pages
 * (/login, /registrieren, /passwort-vergessen).
 * Styled via the shared --th-* tokens → works in both themes.
 */

export function AuthShell({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--th-bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(180deg, var(--th-bg-card3) 0%, var(--th-bg-card2) 100%)',
        border: '1px solid var(--th-line-6)', borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 30px 70px var(--th-shadow)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <Image src="/mdu-logo.webp" unoptimized alt="Münchner Dart Union" height={36} width={103} style={{ height: 36, width: 'auto' }} />
          </Link>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28,
            color: 'var(--th-text-strong)', marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', marginTop: 8 }}>
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthField({ label, ...inputProps }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700,
        color: 'var(--th-text-body)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <input
        {...inputProps}
        style={{
          width: '100%', padding: '12px 16px', background: 'var(--th-bg-header)',
          border: '1px solid var(--th-line-10)', borderRadius: 8,
          color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14,
          outline: 'none',
          ...inputProps.style,
        }}
      />
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div role="alert" style={{
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)',
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A',
    }}>
      {message}
    </div>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <div role="status" style={{
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.35)',
      fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-win)',
    }}>
      {message}
    </div>
  );
}

export function AuthSubmit({ children, busy, disabled }: { children: React.ReactNode; busy?: boolean; disabled?: boolean }) {
  const off = busy || disabled;
  return (
    <button
      type="submit"
      disabled={off}
      style={{
        width: '100%', padding: 14,
        background: 'var(--th-accent)', color: '#fff',
        border: '1px solid var(--th-accent-hover)', borderRadius: 8,
        fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14,
        letterSpacing: '0.08em', cursor: busy ? 'wait' : disabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase', marginTop: 8,
        boxShadow: '0 8px 22px var(--th-accent-a40)',
        opacity: off ? 0.6 : 1,
      }}
    >
      {busy ? 'Bitte warten …' : children}
    </button>
  );
}

export function AuthCheckbox({ checked, onChange, children }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--th-accent)', flexShrink: 0, cursor: 'pointer' }}
      />
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.5 }}>
        {children}
      </span>
    </label>
  );
}
