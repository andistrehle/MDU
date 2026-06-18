'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSuccess, AuthSubmit } from '@/components/mdu/auth-shell';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [intent, setIntent] = useState<'player' | 'team_captain'>('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setBusy(true);
    const res = await signUp({ firstName, lastName, email, password, intent });
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else if (res.needsEmailConfirmation) {
      // Supabase verlangt E-Mail-Bestätigung → Hinweis statt Redirect
      setConfirmEmailSent(true);
    } else {
      router.push('/mein-bereich');
    }
  }

  if (confirmEmailSent) {
    return (
      <AuthShell title="Fast geschafft" subtitle="Nur noch ein Schritt">
        <AuthSuccess message={`Bitte bestätige deine E-Mail-Adresse. Wir haben dir einen Link an ${email} geschickt.`} />
        <p style={{
          textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13,
          color: 'var(--th-text-muted)', marginTop: 24,
        }}>
          Danach kannst du dich{' '}
          <Link href="/login" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>
            anmelden
          </Link>.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Registrieren" subtitle="MDU-Konto erstellen">
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <AuthError message={error} />}
        <AuthField
          label="Vorname"
          type="text"
          placeholder="Vorname"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
        />
        <AuthField
          label="Nachname"
          type="text"
          placeholder="Nachname"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={e => setLastName(e.target.value)}
        />
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-body)', marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Ich registriere mich als
          </label>
          <select
            value={intent}
            onChange={e => setIntent(e.target.value as 'player' | 'team_captain')}
            style={{
              width: '100%', padding: '12px 16px', background: 'var(--th-bg-header)',
              border: '1px solid var(--th-line-10)', borderRadius: 8,
              color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
            }}
          >
            <option value="player">Spieler</option>
            <option value="team_captain">Teamkapitän / TC</option>
          </select>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', lineHeight: 1.5, margin: '8px 0 0' }}>
            Die Auswahl hilft der Ligaleitung bei der Freigabe. Rollen und Teamrechte werden erst nach Prüfung vergeben.
          </p>
        </div>
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
          Das Konto wird erstellt, um interne Funktionen (eigenes Profil, Team-Bereich)
          nutzen zu können. Dein Konto wird ggf. durch die Ligaleitung freigegeben und mit
          deinem Spielerprofil bzw. Team verknüpft. Mit der Registrierung bestätigst du,
          die{' '}
          <Link href="/datenschutz" style={{ color: 'var(--th-accent)', textDecoration: 'underline' }}>
            Datenschutzerklärung
          </Link>{' '}
          zur Kenntnis genommen zu haben.
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
