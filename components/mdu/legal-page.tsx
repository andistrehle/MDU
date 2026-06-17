import { DesktopHeader } from './desktop-header';
import { Footer } from './footer';

/** Gemeinsames Layout für Rechtstexte (Impressum, Datenschutz). */
export function LegalPage({ title, updated, children }: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader />
      <main className="mdu-section-pad" style={{ flex: 1, maxWidth: 820, width: '100%', margin: '0 auto', padding: '48px 24px 72px' }}>
        <h1 style={{
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40,
          letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
          margin: '0 0 8px',
        }}>
          {title}
        </h1>
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: '0 0 8px' }}>
          Stand: {updated}
        </p>
        <div style={{
          background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 10,
          padding: '12px 16px', margin: '0 0 28px',
          fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.6,
        }}>
          Hinweis: Diese Seite ist eine <strong>Vorlage</strong>. Mit <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>[…]</code>
          {' '}markierte Felder müssen von den MDU-Verantwortlichen ausgefüllt und der Text vor dem
          offiziellen Livegang rechtlich geprüft werden.
        </div>
        <div className="mdu-legal-body">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{
        fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 20,
        letterSpacing: '0.03em', color: 'var(--th-text-strong)', textTransform: 'uppercase', margin: '0 0 10px',
      }}>
        {title}
      </h2>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', lineHeight: 1.7 }}>
        {children}
      </div>
    </section>
  );
}
