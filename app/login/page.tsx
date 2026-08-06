'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSubmit } from '@/components/mdu/auth-shell';

export default function LoginPage() {
  const { user, signIn, resendConfirmation } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Bereits eingeloggt? Dann hat die Login-Seite keinen Zweck → weiterleiten (REV-024).
  useEffect(() => {
    if (user) router.replace(safeNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirm(false);
    setResendState('idle');
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      if (res.needsEmailConfirmation) setNeedsConfirm(true);
    } else {
      router.push(safeNext());
    }
  }

  async function onResend() {
    if (!email) return;
    setResendState('sending');
    const { error: e } = await resendConfirmation(email);
    setResendState(e ? 'idle' : 'sent');
    if (e) setError(e);
  }

  // Ziel nach Login: ?next= (nur interne, relative Pfade — kein Open Redirect).
  function safeNext(): string {
    try {
      const n = new URLSearchParams(window.location.search).get('next');
      if (n && n.startsWith('/') && !n.startsWith('//')) return n;
    } catch { /* ignore */ }
    return '/mein-bereich';
  }

  const linkStyle: React.CSSProperties = { color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 };

  return (
    <AuthShell title="Anmelden" subtitle="Zum MDU Mitgliederbereich">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <AuthError message={error} />}
        {needsConfirm && (
          <div style={{ padding: '11px 14px', borderRadius: 10, background: 'rgba(232,184,74,0.10)', border: '1px solid rgba(232,184,74,0.4)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.55 }}>
            {resendState === 'sent' ? (
              <>✅ Wir haben dir eine neue Bestätigungsmail an <strong>{email}</strong> geschickt. Bitte klick auf den Link darin (auch im Spam-Ordner nachsehen) – danach kannst du dich anmelden.</>
            ) : (
              <>
                Deine E-Mail-Adresse ist noch nicht bestätigt. Klick auf den Link in der Bestätigungsmail – oder fordere sie hier neu an:
                <button type="button" onClick={onResend} disabled={resendState === 'sending' || !email}
                  style={{ display: 'block', marginTop: 8, padding: '8px 14px', borderRadius: 8, cursor: resendState === 'sending' ? 'wait' : 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>
                  {resendState === 'sending' ? 'Sende …' : 'Bestätigungsmail erneut senden'}
                </button>
              </>
            )}
          </div>
        )}
        <AuthField
          label="E-Mail"
          type="email"
          placeholder="name@dartunion.de"
          autoComplete="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <AuthField
          label="Passwort"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <AuthSubmit busy={busy}>Anmelden</AuthSubmit>
      </form>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        marginTop: 24, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)',
      }}>
        <span>
          Noch kein Konto?{' '}
          <Link href="/registrieren" style={linkStyle}>Jetzt registrieren</Link>
        </span>
        <Link href="/passwort-vergessen" style={{ ...linkStyle, fontWeight: 600, color: 'var(--th-text-muted)', textDecoration: 'underline' }}>
          Passwort vergessen?
        </Link>
      </div>
    </AuthShell>
  );
}
