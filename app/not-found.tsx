import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { MDC_STANDALONE } from '@/lib/mdc/site';
import './mdc/mdc.css';

/**
 * 404 der MDU. Läuft der Build als eigenständige MDC-Seite, gibt es die
 * MDU-Oberfläche dort gar nicht — dann steht hier eine schlichte MDC-Fassung.
 * (Für Pfade unterhalb von `/mdc` greift ohnehin `app/mdc/not-found.tsx` mit
 * Kopf- und Fußzeile; diese hier ist der letzte Rückfall.)
 */
export default function NotFound() {
  if (MDC_STANDALONE) {
    return (
      <main className="mdc-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', background: 'var(--mdc-bg)' }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          <div className="mdc-display" style={{ fontSize: 96, lineHeight: 1, color: 'var(--mdc-red)' }}>404</div>
          <h1 className="mdc-display mdc-h2" style={{ margin: '8px 0 12px' }}>Seite nicht gefunden</h1>
          <p style={{ color: 'var(--mdc-ink-soft)', lineHeight: 1.7, marginBottom: 26 }}>
            Die aufgerufene Adresse gibt es nicht (mehr). Vielleicht hat sich ein
            Tippfehler eingeschlichen, oder der Verweis ist veraltet.
          </p>
          <Link href="/" className="mdc-btn mdc-btn-primary">Zur Startseite</Link>
        </div>
      </main>
    );
  }

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 96,
            lineHeight: 1, color: 'var(--th-accent)', letterSpacing: '0.02em',
          }}>
            404
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30,
            textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--th-text-strong)',
            margin: '8px 0 12px',
          }}>
            Seite nicht gefunden
          </h1>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 15, color: 'var(--th-text-muted)', lineHeight: 1.6, margin: '0 0 28px' }}>
            Die aufgerufene Seite gibt es nicht (mehr). Vielleicht hat sich ein Tippfehler eingeschlichen oder der Link ist veraltet.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{
              padding: '12px 24px', background: 'var(--th-accent)', color: '#fff', borderRadius: 6,
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
              textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--th-accent-hover)',
            }}>
              Zur Startseite
            </Link>
            <Link href="/ligen" style={{
              padding: '12px 24px', background: 'transparent', color: 'var(--th-text-strong)', borderRadius: 6,
              border: '1.5px solid var(--th-line-18, var(--th-line-10))',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
              textTransform: 'uppercase', textDecoration: 'none',
            }}>
              Ligen ansehen
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
