// ============================================================
// MDC — Bausteine für die Rechtstexte
// ============================================================
//
// Impressum und Datenschutz sind lange Texte zum Nachschlagen, keine
// Marketingseiten: ruhige Abschnitte, großzügige Zeilenhöhe, begrenzte
// Zeilenlänge. Deshalb eigene Bausteine statt der Karten des restlichen
// Auftritts.
// ============================================================

import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2
        className="mdc-display mdc-h3"
        style={{ color: 'var(--mdc-ink)', fontSize: '1.15rem', marginBottom: 8 }}
      >
        {title}
      </h2>
      <div style={{ color: 'var(--mdc-ink-soft)', lineHeight: 1.8, fontSize: '0.95rem' }}>
        {children}
      </div>
    </section>
  );
}

/**
 * Hinweis auf fehlende Pflichtangaben. Steht nur da, solange in
 * `data/mdc-legal.ts` etwas fehlt — und verschwindet von selbst, sobald die
 * Angaben gepflegt sind.
 */
export function LegalGapNotice({ children }: { children: ReactNode }) {
  return (
    <div
      className="mdc-card"
      style={{
        display: 'flex', gap: 12, padding: '14px 16px',
        borderColor: 'var(--mdc-red-a35)', background: 'var(--mdc-red-a08)',
        fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)',
      }}
    >
      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
      <p>{children}</p>
    </div>
  );
}

export function LegalPage({ children }: { children: ReactNode }) {
  return (
    <section className="mdc-section">
      <div
        className="mdc-shell"
        style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 28 }}
      >
        {children}
      </div>
    </section>
  );
}
