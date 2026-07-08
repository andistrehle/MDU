'use client';

// Globale Error-Boundary (App Router). Fängt Render-/Datenfehler ab und zeigt
// statt eines nackten Absturzes eine gebrandete Seite mit „Erneut versuchen".

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Für Diagnose in der Konsole (keine PII loggen).
    console.error('Unerwarteter Fehler:', error?.message, error?.digest);
  }, [error]);

  return (
    <div style={{
      background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px',
    }}>
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 72,
          lineHeight: 1, color: 'var(--th-accent)', letterSpacing: '0.02em',
        }}>
          Ups.
        </div>
        <h1 style={{
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28,
          textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--th-text-strong)',
          margin: '10px 0 12px',
        }}>
          Da ist etwas schiefgelaufen
        </h1>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, color: 'var(--th-text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
          Die Seite konnte gerade nicht geladen werden. Versuch es bitte erneut — wenn es weiterhin nicht klappt, schau später noch einmal vorbei.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={reset} style={{
            padding: '12px 24px', background: 'var(--th-accent)', color: '#fff', borderRadius: 6,
            border: '1px solid var(--th-accent-hover)', cursor: 'pointer',
            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Erneut versuchen
          </button>
          <Link href="/" style={{
            padding: '12px 24px', background: 'transparent', color: 'var(--th-text-strong)', borderRadius: 6,
            border: '1.5px solid var(--th-line-18, var(--th-line-10))', textDecoration: 'none',
            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  );
}
