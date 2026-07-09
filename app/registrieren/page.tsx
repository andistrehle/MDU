'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AuthShell, AuthField, AuthError, AuthSuccess, AuthSubmit, AuthCheckbox } from '@/components/mdu/auth-shell';
import { notifyNewUserToAdmins } from '@/lib/supabase/notifications';

export default function RegisterPage() {
  const { user, signUp } = useAuth();
  const router = useRouter();

  // Bereits eingeloggt? Registrierung ergibt keinen Sinn → weiterleiten (REV-024).
  useEffect(() => {
    if (user) router.replace('/mein-bereich');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [intent, setIntent] = useState<'player' | 'team_captain'>('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);
  // Eindeutigkeits-Prüfung (server-seitig): Spieler bereits verknüpft / Team hat schon Kapitän.
  const [check, setCheck] = useState<{
    playerLinked?: boolean; playerName?: string | null;
    teamCaptain?: { teamName: string; captainName: string } | null;
  } | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    if (!acceptPrivacy || !acceptTerms) {
      setError('Bitte bestätige Datenschutzerklärung und Nutzungsbedingungen.');
      return;
    }
    setBusy(true);

    // Eindeutigkeit prüfen, bevor das Konto erstellt wird (Spieler/Kapitän).
    try {
      const cr = await fetch('/api/registration-checks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'account', firstName, lastName, intent }),
      });
      const cd = await cr.json();
      if (cd.playerLinked || cd.teamCaptain) { setCheck(cd); setBusy(false); return; }
    } catch { /* Prüfung best-effort — bei Fehler normal fortfahren */ }

    const res = await signUp({ firstName, lastName, email, password, intent });
    setBusy(false);
    if (res.error) {
      setError(res.error);
    } else {
      // Super-Admins über die neue Registrierung informieren (best-effort).
      void notifyNewUserToAdmins(email);
      if (res.needsEmailConfirmation) {
        // Supabase verlangt E-Mail-Bestätigung → Hinweis statt Redirect
        setConfirmEmailSent(true);
      } else {
        router.push('/mein-bereich');
      }
    }
  }

  async function requestLinkReset() {
    setBusy(true);
    try {
      await fetch('/api/registration-checks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link-reset-request',
          requesterName: `${firstName} ${lastName}`.trim(),
          requesterEmail: email,
          playerName: check?.playerName ?? '',
        }),
      });
    } catch { /* best-effort */ }
    setBusy(false);
    setResetSent(true);
  }

  // ── Spieler bereits verknüpft → Dialog (vergessen / zurücksetzen) ──
  if (check?.playerLinked) {
    return (
      <AuthShell title="Spieler bereits vorhanden" subtitle="Konto bereits verknüpft">
        {resetSent ? (
          <>
            <AuthSuccess message="Die Ligaleitung wurde benachrichtigt. Sie meldet sich, sobald die bestehende Verknüpfung gelöscht bzw. zurückgesetzt wurde." />
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginTop: 24 }}>
              <Link href="/login" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>Zur Anmeldung</Link>
            </p>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', lineHeight: 1.6, margin: 0 }}>
              Spieler existiert bereits in der Datenbank{check.playerName ? ` (${check.playerName})` : ''}. Haben Sie Ihre
              Login-Daten vergessen oder möchten Sie diese zurücksetzen?
            </p>
            <Link href={`/passwort-vergessen?email=${encodeURIComponent(email)}`} style={{
              padding: '12px 18px', borderRadius: 8, textAlign: 'center', textDecoration: 'none',
              background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
            }}>Passwort vergessen – jetzt zurücksetzen</Link>
            <button type="button" onClick={requestLinkReset} disabled={busy} style={{
              padding: '12px 18px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
              background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)',
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
            }}>{busy ? 'Sende Anfrage …' : 'Verknüpfung von der Ligaleitung zurücksetzen lassen'}</button>
            <button type="button" onClick={() => setCheck(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-muted)',
              fontFamily: 'var(--font-manrope)', fontSize: 13,
            }}>Zurück</button>
          </div>
        )}
      </AuthShell>
    );
  }

  // ── Team hat bereits einen Kapitän → Hinweis ──
  if (check?.teamCaptain) {
    return (
      <AuthShell title="Mannschaft hat schon einen Kapitän" subtitle="Nur ein Teamkapitän je Mannschaft">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', lineHeight: 1.6, margin: 0 }}>
            Die Mannschaft <strong>{check.teamCaptain.teamName}</strong> hat schon einen Kapitän
            (<strong>{check.teamCaptain.captainName}</strong>). Je Mannschaft kann es nur einen Teamkapitän geben.
          </p>
          <button type="button" onClick={() => { setIntent('player'); setCheck(null); }} style={{
            padding: '12px 18px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
          }}>Stattdessen als Spieler registrieren</button>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: 0 }}>
            Bist du der neue Kapitän? Dann wende dich bitte an die Ligaleitung unter{' '}
            <a href="mailto:kontakt@mdudarts.de" style={{ color: 'var(--th-accent)', textDecoration: 'underline' }}>kontakt@mdudarts.de</a>.
          </p>
          <button type="button" onClick={() => setCheck(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-muted)',
            fontFamily: 'var(--font-manrope)', fontSize: 13,
          }}>Zurück</button>
        </div>
      </AuthShell>
    );
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
          deinem Spielerprofil bzw. Team verknüpft.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AuthCheckbox checked={acceptPrivacy} onChange={setAcceptPrivacy}>
            Ich habe die{' '}
            <Link href="/datenschutz" target="_blank" style={{ color: 'var(--th-accent)', textDecoration: 'underline' }}>
              Datenschutzerklärung
            </Link>{' '}
            gelesen und stimme der Verarbeitung meiner Daten zu.
          </AuthCheckbox>
          <AuthCheckbox checked={acceptTerms} onChange={setAcceptTerms}>
            Ich akzeptiere die{' '}
            <Link href="/nutzungsbedingungen" target="_blank" style={{ color: 'var(--th-accent)', textDecoration: 'underline' }}>
              Nutzungsbedingungen
            </Link>.
          </AuthCheckbox>
        </div>

        <AuthSubmit busy={busy} disabled={!acceptPrivacy || !acceptTerms}>Registrieren</AuthSubmit>
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
