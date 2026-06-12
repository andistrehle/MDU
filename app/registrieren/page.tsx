'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSubmit } from '@/components/mdu/auth-shell';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
    const res = await signUp(name, email, password);
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.push('/mein-bereich');
    }
  }

  return (
    <AuthShell title="Registrieren" subtitle="MDU-Konto erstellen">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <AuthError message={error} />}
        <AuthField
          label="Name"
          type="text"
          placeholder="Vor- und Nachname"
          autoComplete="name"
          required
          value={name}
          onChange={e => setName(e.target.value)}
        />
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

        <p style={{
          fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)',
          lineHeight: 1.55, margin: 0,
        }}>
          Hinweis: Dein Konto wird ggf. später durch die Ligaleitung freigegeben und
          mit deinem Spielerprofil bzw. Team verknüpft.
        </p>

        <AuthSubmit busy={busy}>Registrieren</AuthSubmit>
      </form>

      <p style={{
        textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13,
        color: 'var(--th-text-muted)', marginTop: 24,
      }}>
        Bereits ein Konto?{' '}
        <Link href="/login" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>
          Anmelden
        </Link>
      </p>
    </AuthShell>
  );
}
