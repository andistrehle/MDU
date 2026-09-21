// ============================================================
// BeDV-Demo — kleine Bausteine
// ============================================================
//
// Alles, was auf mehr als zwei Seiten vorkommt, steht hier: Karte,
// Abschnittskopf, Abzeichen, Kennzahl, Leerzustand. Die Gestaltung selbst
// liegt in `app/bedv/bedv.css` — hier stehen nur die Formen.
// ============================================================

import Link from 'next/link';
import type { ReactNode } from 'react';

export function Card({
  children, className = '', padding = 18, href, style,
}: {
  children: ReactNode; className?: string; padding?: number | string;
  href?: string; style?: React.CSSProperties;
}) {
  const klasse = `bedv-card ${href ? 'bedv-card--link' : ''} ${className}`.trim();
  const stil = { padding, ...style };
  if (href) return <Link href={href} className={klasse} style={stil}>{children}</Link>;
  return <div className={klasse} style={stil}>{children}</div>;
}

export function SectionHead({
  eyebrow, titel, text, aktion,
}: {
  eyebrow?: string; titel: string; text?: string;
  aktion?: { label: string; href: string };
}) {
  return (
    <div className="bedv-sectionhead">
      <div>
        {eyebrow && <div className="bedv-eyebrow">{eyebrow}</div>}
        <h2>{titel}</h2>
        {text && (
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 6, maxWidth: '58ch', fontSize: '0.95rem' }}>
            {text}
          </p>
        )}
      </div>
      {aktion && (
        <Link href={aktion.href} className="bedv-btn bedv-btn--ghost bedv-btn--sm">
          {aktion.label}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}

type BadgeTon = 'blau' | 'accent' | 'gruen' | 'rot' | 'leise' | 'dunkel' | 'demo';

const BADGE_KLASSE: Record<BadgeTon, string> = {
  blau: '', accent: ' bedv-badge--accent', gruen: ' bedv-badge--green',
  rot: ' bedv-badge--red', leise: ' bedv-badge--quiet', dunkel: ' bedv-badge--dark',
  demo: ' bedv-badge--demo',
};

export function Badge({
  children, ton = 'blau', style,
}: {
  children: ReactNode; ton?: BadgeTon; style?: React.CSSProperties;
}) {
  return <span className={`bedv-badge${BADGE_KLASSE[ton]}`} style={style}>{children}</span>;
}

/** Eine große Zahl mit Beschriftung — Kennzahlen, Statistikkacheln. */
export function Stat({
  wert, label, ton = 'normal', hinweis,
}: {
  wert: ReactNode; label: string; ton?: 'normal' | 'accent' | 'dunkel'; hinweis?: string;
}) {
  const farbe = ton === 'accent' ? 'var(--bedv-accent-deep)'
    : ton === 'dunkel' ? '#fff' : 'var(--bedv-navy-900)';
  const labelFarbe = ton === 'dunkel' ? 'var(--bedv-on-dark-dim)' : 'var(--bedv-ink-dim)';
  return (
    <div>
      <div
        className="bedv-score"
        style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: farbe, lineHeight: 1.05 }}
      >
        {wert}
      </div>
      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: labelFarbe, marginTop: 4, letterSpacing: '0.02em' }}>
        {label}
      </div>
      {hinweis && (
        <div style={{ fontSize: '0.68rem', color: 'var(--bedv-ink-faint)', marginTop: 2 }}>{hinweis}</div>
      )}
    </div>
  );
}

/** Wenn nichts da ist — mit einem Satz, der erklärt, warum. */
export function LeerZustand({
  titel, text, aktion,
}: {
  titel: string; text: string; aktion?: { label: string; href: string };
}) {
  return (
    <div
      className="bedv-card"
      style={{ padding: '34px 22px', textAlign: 'center', background: 'var(--bedv-tint)' }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 44, height: 44, borderRadius: '50%', margin: '0 auto 12px',
          display: 'grid', placeItems: 'center',
          background: 'var(--bedv-blue-mist)', color: 'var(--bedv-blue)',
          fontSize: '1.2rem',
        }}
      >
        ○
      </div>
      <div style={{ fontFamily: 'var(--bedv-font-display)', fontWeight: 700, fontSize: '1.02rem' }}>{titel}</div>
      <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 6, fontSize: '0.9rem', maxWidth: '44ch', marginInline: 'auto' }}>
        {text}
      </p>
      {aktion && (
        <Link href={aktion.href} className="bedv-btn bedv-btn--ghost bedv-btn--sm" style={{ marginTop: 14 }}>
          {aktion.label}
        </Link>
      )}
    </div>
  );
}

/**
 * Der Hinweis, dass an dieser Stelle etwas simuliert ist.
 *
 * Er steht überall dort, wo eine Funktion in der echten Plattform mit einem
 * Server sprechen würde — Meldung absenden, Bericht einreichen, Foto
 * auswerten. Das ist keine Formsache: Wer die Demo vorführt, muss an genau
 * diesen Stellen sagen können „das ist heute simuliert", ohne dass es wie
 * ein Eingeständnis klingt.
 */
export function DemoHinweis({ children, ton = 'blau' }: { children: ReactNode; ton?: 'blau' | 'accent' }) {
  const accent = ton === 'accent';
  return (
    <div
      style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        background: accent ? 'var(--bedv-accent-soft)' : 'var(--bedv-blue-mist)',
        border: `1px solid ${accent ? '#F2DCAE' : 'var(--bedv-blue-soft)'}`,
        color: accent ? 'var(--bedv-accent-deep)' : 'var(--bedv-blue-deep)',
        borderRadius: 10, padding: '10px 13px', fontSize: '0.85rem', lineHeight: 1.5,
      }}
    >
      <span aria-hidden="true" style={{ fontWeight: 800, flex: 'none' }}>i</span>
      <span>{children}</span>
    </div>
  );
}

/** Beschriftete Zeile für Datenblöcke (Spielstätte, Verbandsangaben …). */
export function Feld({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '7px 0', borderBottom: '1px solid var(--bedv-line-soft)' }}>
      <span style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontSize: '0.9rem' }}>{children}</span>
    </div>
  );
}

/** Formkurve der letzten fünf Begegnungen. */
export function FormKurve({ form }: { form: ('S' | 'U' | 'N')[] }) {
  if (form.length === 0) return <span style={{ color: 'var(--bedv-ink-faint)' }}>–</span>;
  return (
    <span className="bedv-form" aria-label={`Form: ${form.join(', ')}`}>
      {form.map((f, i) => (
        <span key={i} className={f.toLowerCase()} aria-hidden="true">{f}</span>
      ))}
    </span>
  );
}
