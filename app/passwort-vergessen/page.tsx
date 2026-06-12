'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSuccess, AuthSubmit } from '@/components/mdu/auth-shell';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await resetPassword(email);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSent(true);
    }
  }

  return (
    <AuthShell
      title="Passwort vergessen"
      subtitle="Wir senden dir einen Link zum Zurücksetzen"
    >
      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AuthSuccess message={`Wenn ein Konto für ${email} existiert, wurde eine E-Mail mit weiteren Schritten versendet.`} />
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.55, margin: 0 }}>
            Hinweis: Der E-Mail-Versand wird mit der Backend-Anbindung aktiviert.
          </p>
        </div>
      ) : (
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
          <AuthSubmit busy={busy}>Link anfordern</AuthSubmit>
        </form>
      )}

      <p style={{
        textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13,
        color: 'var(--th-text-muted)', marginTop: 24,
      }}>
        <Link href="/login" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>
          Zurück zur Anmeldung
        </Link>
      </p>
    </AuthShell>
  );
}
