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
  // „E-Mail-Adresse vergessen?" → Hilfe-Anfrage an die Ligaleitung
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpName, setHelpName] = useState('');
  const [helpNote, setHelpNote] = useState('');
  const [helpBusy, setHelpBusy] = useState(false);
  const [helpSent, setHelpSent] = useState(false);

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

  async function onHelpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!helpName.trim()) return;
    setHelpBusy(true);
    try {
      await fetch('/api/registration-checks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login-help-request', requesterName: helpName.trim(), note: helpNote.trim() }),
      });
    } catch { /* best-effort */ }
    setHelpBusy(false);
    setHelpSent(true);
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

      {/* E-Mail-Adresse vergessen? → Hilfe durch die Ligaleitung */}
      <div style={{ marginTop: 20, borderTop: '1px solid var(--th-line-6)', paddingTop: 16 }}>
        {helpSent ? (
          <AuthSuccess message="Danke! Die Ligaleitung wurde benachrichtigt und meldet sich bei dir bzw. teilt dir die hinterlegte E-Mail-Adresse mit." />
        ) : !helpOpen ? (
          <button type="button" onClick={() => setHelpOpen(true)} style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-accent)', fontWeight: 700, textAlign: 'center',
          }}>
            E-Mail-Adresse vergessen?
          </button>
        ) : (
          <form onSubmit={onHelpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: 0 }}>
              Kein Problem — gib deinen Namen ein, dann hilft dir die Ligaleitung, dein Konto zu finden.
            </p>
            <AuthField label="Vor- und Nachname" type="text" placeholder="Max Mustermann" required
              value={helpName} onChange={e => setHelpName(e.target.value)} />
            <AuthField label="Nachricht (optional)" type="text" placeholder="z. B. Team / weitere Hinweise"
              value={helpNote} onChange={e => setHelpNote(e.target.value)} />
            <AuthSubmit busy={helpBusy} disabled={!helpName.trim()}>Ligaleitung kontaktieren</AuthSubmit>
          </form>
        )}
      </div>

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
