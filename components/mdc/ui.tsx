// ============================================================
// MDC — wiederkehrende Bausteine
// ============================================================

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Archive, ArrowRight, Info, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { Trend } from '@/data/types';
import { Dartboard } from './dartboard';

// ------------------------------------------------------------
// Abschnittsüberschrift
// ------------------------------------------------------------

interface SectionHeadingProps {
  kicker: string;
  title: string;
  description?: string;
  /** Verweis rechts neben der Überschrift („Alle ansehen"). */
  action?: { label: string; href: string };
}

export function SectionHeading({ kicker, title, description, action }: SectionHeadingProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 20,
        marginBottom: 30,
      }}
    >
      <div style={{ maxWidth: 640 }}>
        <span className="mdc-kicker">{kicker}</span>
        <h2 className="mdc-display mdc-h2" style={{ marginTop: 12 }}>{title}</h2>
        {description && <p className="mdc-lead" style={{ marginTop: 12 }}>{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
          {action.label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Kopfbereich der Unterseiten
// ------------------------------------------------------------

interface PageHeroProps {
  kicker: string;
  title: string;
  description?: string;
  children?: ReactNode;
}

export function PageHero({ kicker, title, description, children }: PageHeroProps) {
  return (
    <section className="mdc-hero">
      <Dartboard className="mdc-hero-board mdc-spin-slow" showNumbers={false} tone="brand" />
      <div className="mdc-shell" style={{ position: 'relative', zIndex: 2, paddingBlock: '56px 44px' }}>
        <span className="mdc-kicker mdc-rise">{kicker}</span>
        <h1 className="mdc-display mdc-h2 mdc-rise mdc-rise-1" style={{ marginTop: 14 }}>{title}</h1>
        {description && (
          <p className="mdc-lead mdc-rise mdc-rise-2" style={{ marginTop: 14, maxWidth: 680 }}>
            {description}
          </p>
        )}
        {children && <div className="mdc-rise mdc-rise-3" style={{ marginTop: 24 }}>{children}</div>}
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Kennzahl-Karte
// ------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  href?: string;
}

export function StatCard({ label, value, sub, icon, href }: StatCardProps) {
  const content = (
    <div className="mdc-card mdc-card-hover mdc-card-accent" style={{ padding: '22px 20px', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--mdc-red)' }}>
        {icon}
        <span
          style={{
            fontFamily: 'var(--mdc-font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--mdc-ink-dim)',
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="mdc-display"
        style={{ fontSize: 'clamp(1.7rem, 3.4vw, 2.4rem)', marginTop: 12, wordBreak: 'break-word' }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: '0.84rem', color: 'var(--mdc-ink-soft)' }}>{sub}</div>
      )}
    </div>
  );

  return href ? <Link href={href} style={{ display: 'block', height: '100%' }}>{content}</Link> : content;
}

// ------------------------------------------------------------
// Trendpfeil
// ------------------------------------------------------------

const TREND_LABEL: Record<Trend, string> = {
  up: 'Platz verbessert',
  down: 'Platz verschlechtert',
  same: 'Platz unverändert',
  new: 'neu in der Wertung',
};

export function TrendIcon({ trend, size = 15 }: { trend: Trend; size?: number }) {
  const label = TREND_LABEL[trend];

  if (trend === 'up') {
    return <TrendingUp size={size} className="mdc-trend-up" aria-label={label} role="img" />;
  }
  if (trend === 'down') {
    return <TrendingDown size={size} className="mdc-trend-down" aria-label={label} role="img" />;
  }
  if (trend === 'new') {
    return (
      <span className="mdc-chip mdc-chip-red" style={{ padding: '2px 7px', fontSize: '0.65rem' }}>
        neu
      </span>
    );
  }
  return <Minus size={size} className="mdc-trend-same" aria-label={label} role="img" />;
}

// ------------------------------------------------------------
// Hinweis auf Demo-Daten
// ------------------------------------------------------------

/**
 * Ehrlicher Hinweis, wo echte Zahlen aufhören und Demo-Material anfängt.
 * Steht überall dort, wo Turnierergebnisse gezeigt werden.
 */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div
      className="mdc-card"
      style={{
        display: 'flex',
        gap: 12,
        padding: '14px 16px',
        borderColor: 'var(--mdc-red-a35)',
        background: 'var(--mdc-red-a08)',
        fontSize: '0.86rem',
        lineHeight: 1.6,
        color: 'var(--mdc-ink-soft)',
      }}
    >
      <Info size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
      <p>{children}</p>
    </div>
  );
}

// ------------------------------------------------------------
// Wertung ohne Ergebnisse
// ------------------------------------------------------------

/**
 * Steht dort, wo eine Rangliste hingehört, für die es noch keine Ergebnisse
 * gibt. Bewusst kein Skelett und keine grauen Platzhalterzeilen: Die sehen
 * aus wie Daten, die gerade laden, und hier lädt nichts — es gibt sie noch
 * nicht. Der Kasten sagt stattdessen, woran es liegt und wo etwas steht.
 */
export function EmptyRanking({
  title, children, action,
}: {
  title: string;
  children: ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <div
      className="mdc-card"
      style={{ padding: 'clamp(22px, 4vw, 34px)', display: 'grid', gap: 12, justifyItems: 'start' }}
    >
      <span
        className="mdc-display"
        style={{ fontSize: '1.25rem', color: 'var(--mdc-navy-deep)' }}
      >
        {title}
      </span>
      <p style={{ color: 'var(--mdc-ink-soft)', fontSize: '0.94rem', lineHeight: 1.65, maxWidth: 620 }}>
        {children}
      </p>
      {action && (
        <Link href={action.href} className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 4 }}>
          <Archive size={16} />
          {action.label}
        </Link>
      )}
    </div>
  );
}
