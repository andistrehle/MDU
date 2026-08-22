'use client';

// Startgeld per PayPal bezahlen — aufklappbares Panel auf der Team-Startgeld-Karte.
// Zeigt Empfänger/Betrag/Verwendungszweck zum Kopieren und öffnet PayPal. Kein
// eigener Checkout (kein PayPal-Business nötig): Zahlung „Freunde & Familie" an
// die hinterlegte Adresse. Barzahlung als Alternative genannt.

import { useState } from 'react';
import { STARTGELD_PAYPAL_EMAIL, STARTGELD_PAYPAL_ME, STARTGELD_RECIPIENT } from '@/lib/payment-config';

export function StartgeldPay({ amount, reference }: { amount: number; reference: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (key: string, text: string) => {
    try {
      navigator.clipboard?.writeText(text).then(
        () => { setCopied(key); window.setTimeout(() => setCopied(null), 1600); },
        () => {},
      );
    } catch { /* Clipboard nicht verfügbar */ }
  };

  const paypalUrl = STARTGELD_PAYPAL_ME
    ? `https://www.paypal.com/paypalme/${STARTGELD_PAYPAL_ME}/${amount}EUR`
    : 'https://www.paypal.com/';

  const rows: { key: string; label: string; value: string }[] = [
    { key: 'to', label: 'PayPal-Empfänger', value: STARTGELD_PAYPAL_EMAIL },
    { key: 'amount', label: 'Betrag', value: `${amount} €` },
    { key: 'ref', label: 'Verwendungszweck', value: reference },
  ];

  return (
    <div style={{ width: '100%' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '9px 16px', borderRadius: 8, cursor: 'pointer',
          background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
          fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
          display: 'inline-flex', alignItems: 'center', gap: 8,
        }}
      >
        Per PayPal bezahlen
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', fontSize: 12 }}>⌄</span>
      </button>

      {open && (
        <div style={{
          marginTop: 12, padding: '14px 16px', borderRadius: 12,
          background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => (
              <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--th-text-muted)' }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13.5, fontWeight: 700, color: 'var(--th-text-strong)', wordBreak: 'break-word' }}>{r.value}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copy(r.key, r.value)}
                  style={{
                    flexShrink: 0, padding: '6px 11px', borderRadius: 7, cursor: 'pointer',
                    background: 'transparent', color: copied === r.key ? 'var(--th-win)' : 'var(--th-accent)',
                    border: `1px solid ${copied === r.key ? 'rgba(34,197,94,0.5)' : 'var(--th-line-10)'}`,
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                  }}
                >
                  {copied === r.key ? '✓ Kopiert' : 'Kopieren'}
                </button>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', lineHeight: 1.55, margin: '12px 0 12px' }}>
            Bitte als <strong>„Freunde &amp; Familie"</strong> senden, dann kommt der Betrag ohne Gebühren an.
            Alternativ geht auch <strong>bar an {STARTGELD_RECIPIENT}</strong>.
          </p>

          <a
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 8, textDecoration: 'none',
              background: '#0070BA', color: '#fff',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
            }}
          >
            PayPal öffnen ↗
          </a>
        </div>
      )}
    </div>
  );
}
