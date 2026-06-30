'use client';

import { useState } from 'react';
import Link from 'next/link';

type Status = 'idle' | 'sending' | 'sent' | 'error';

/** Öffentliches Kontaktformular – zweiter unmittelbarer Kontaktweg (§ 5 DDG). */
export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // Honeypot
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorText, setErrorText] = useState<string | null>(null);

  const canSubmit = !!name.trim()
    && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
    && message.trim().length >= 10
    && accepted
    && status !== 'sending';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setErrorText(null);
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setStatus('sent');
      } else {
        setStatus('error');
        setErrorText(
          data.error === 'email' ? 'Bitte gib eine gültige E-Mail-Adresse an.'
          : data.error === 'message' ? 'Bitte gib eine Nachricht mit mindestens 10 Zeichen ein.'
          : null,
        );
      }
    } catch {
      setStatus('error');
      setErrorText(null);
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" style={{ ...noticeBox, background: 'rgba(34,197,94,0.10)', borderColor: 'rgba(34,197,94,0.35)' }}>
        <strong>Danke für deine Nachricht!</strong><br />
        Wir haben deine Anfrage erhalten und melden uns so bald wie möglich bei dir.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-strong)' }}>
        Nachricht schreiben
      </div>

      {status === 'error' && (
        <div role="alert" style={{ ...noticeBox, background: 'rgba(212,0,0,0.10)', borderColor: 'rgba(212,0,0,0.35)', color: '#E24B4A' }}>
          {errorText ?? (
            <>Das Senden hat leider nicht geklappt. Bitte versuche es später erneut oder schreib uns
            direkt an <a href="mailto:kontakt@mdudarts.de" style={linkStyle}>kontakt@mdudarts.de</a>.</>
          )}
        </div>
      )}

      <Field label="Name" required>
        <input value={name} onChange={e => setName(e.target.value)} required maxLength={120} autoComplete="name" style={inputStyle} />
      </Field>
      <Field label="E-Mail" required>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={200} autoComplete="email" style={inputStyle} />
      </Field>
      <Field label="Betreff">
        <input value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} style={inputStyle} />
      </Field>
      <Field label="Nachricht" required>
        <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} maxLength={5000} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      {/* Honeypot – für echte Nutzer unsichtbar */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
        </label>
      </div>

      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.55, cursor: 'pointer' }}>
        <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} required style={{ marginTop: 2 }} />
        <span>
          Ich habe die <Link href="/datenschutz" target="_blank" style={linkStyle}>Datenschutzerklärung</Link>{' '}
          gelesen und bin damit einverstanden, dass meine Angaben zur Bearbeitung der Anfrage
          verarbeitet werden.
        </span>
      </label>

      <button type="submit" disabled={!canSubmit} style={{
        alignSelf: 'flex-start', padding: '12px 28px', borderRadius: 8,
        cursor: canSubmit ? 'pointer' : 'not-allowed',
        background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
        fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
        textTransform: 'uppercase', opacity: canSubmit ? 1 : 0.55,
      }}>
        {status === 'sending' ? 'Senden …' : 'Nachricht senden'}
      </button>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, color: 'var(--th-text-strong)', letterSpacing: '0.02em' }}>
        {label}{required && <span style={{ color: 'var(--th-accent)' }}> *</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 8,
  background: 'var(--th-bg-inset)', border: '1px solid var(--th-line-12)',
  color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14,
};
const linkStyle: React.CSSProperties = { color: 'var(--th-accent)', textDecoration: 'underline' };
const noticeBox: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 10, border: '1px solid',
  fontFamily: 'var(--font-manrope)', fontSize: 13.5, color: 'var(--th-text-body)', lineHeight: 1.6,
};
