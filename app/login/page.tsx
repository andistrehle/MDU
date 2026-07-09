'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSubmit } from '@/components/mdu/auth-shell';

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Bereits eingeloggt? Dann hat die Login-Seite keinen Zweck → weiterleiten (REV-024).
  useEffect(() => {
    if (user) router.replace(safeNext());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.push(safeNext());
    }
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
