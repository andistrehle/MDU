import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';

export default function NewsPage() {
  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{
          background: 'linear-gradient(180deg, #14161E 0%, #11141B 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 28px rgba(0,0,0,0.25)',
          padding: '48px 40px',
          maxWidth: 520,
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(212,0,0,0.12)',
            border: '1px solid rgba(212,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D40000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z" />
              <path d="M16 2v4" /><path d="M8 10h8" /><path d="M8 14h8" /><path d="M8 18h5" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: '#F5F6FA',
            margin: '0 0 12px',
          }}>
            Seite befindet sich noch im Aufbau
          </h1>

          <p style={{
            fontFamily: 'var(--font-manrope)', fontSize: 14, color: '#9AA4B2',
            lineHeight: 1.6, margin: '0 0 32px',
          }}>
            Diese Funktion wird aktuell vorbereitet und steht bald zur Verfügung.
          </p>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 28px',
              background: '#D40000',
              color: '#fff',
              borderRadius: 6,
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textDecoration: 'none',
              boxShadow: '0 6px 14px rgba(212,0,0,0.32)',
            }}
          >
            Zurück zur Startseite
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
