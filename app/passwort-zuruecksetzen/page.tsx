'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSubmit } from '@/components/mdu/auth-shell';

/**
 * Ziel des Supabase-Reset-Links (resetPasswordForEmail → redirectTo).
 * Supabase meldet den Nutzer über den Link automatisch an
 * (Recovery-Session); hier wird nur das neue Passwort gesetzt.
 */
export default function ResetPasswordPage() {
  const { user, loading, updatePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.push('/mein-bereich');
    }
  }

  return (
    <AuthShell title="Neues Passwort" subtitle="Passwort zurücksetzen">
      {/* Das Formular nur zeigen, wenn eine gültige Recovery-Session besteht
          (über den Link aus der E-Mail). Sonst „Link abgelaufen" (REV-023). */}
      {loading ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: 0 }}>
          Einen Moment …
        </p>
      ) : !user ? (
        <p style={{
          fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)',
          lineHeight: 1.6, margin: 0,
        }}>
          Dieser Link ist ungültig oder abgelaufen. Diese Seite funktioniert nur
          über den frischen Link aus der „Passwort vergessen“-E-Mail.{' '}
          <Link href="/passwort-vergessen" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>
            Fordere einen neuen an
          </Link>.
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <AuthError message={error} />}
          <AuthField
            label="Neues Passwort"
            type="password"
            placeholder="Mindestens 6 Zeichen"
            autoComplete="new-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <AuthField
            label="Passwort bestätigen"
            type="password"
            placeholder="Passwort wiederholen"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          <AuthSubmit busy={busy}>Passwort speichern</AuthSubmit>
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
