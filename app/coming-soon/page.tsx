import type { Metadata } from 'next';

// Holding-/Coming-Soon-Seite. Wird von der Middleware (proxy.ts) unter der
// jeweils aufgerufenen URL angezeigt, solange COMING_SOON in lib/site-config.ts
// aktiv ist. Bewusst voll selbsttragend (kein Header/Footer/Bottom-Nav) und als
// fixer Vollbild-Layer über allem – so bleibt keine Seiten-Navigation sichtbar.
// Feste Farben (kein Theme), damit die Splash-Seite überall gleich aussieht.

export const metadata: Metadata = {
  title: 'Münchner Dart Union – Coming soon',
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background: 'radial-gradient(1200px 600px at 50% -10%, #171a24 0%, #0b0d12 60%, #07080c 100%)',
        color: '#F4F5F7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        overflow: 'auto',
      }}
    >
      {/* dezenter Akzent-Schein */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)',
          width: 520, height: 520, maxWidth: '90vw', maxHeight: '90vw',
          background: 'radial-gradient(circle, rgba(212,0,0,0.16) 0%, rgba(212,0,0,0) 68%)',
          pointerEvents: 'none', filter: 'blur(4px)',
        }}
      />

      <div style={{ position: 'relative', maxWidth: 560, width: '100%' }}>
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mdu-logo.webp"
          alt="Münchner Dart Union"
          width={168}
          style={{ width: 168, maxWidth: '60vw', height: 'auto', margin: '0 auto 30px', display: 'block' }}
        />

        <div
          style={{
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            fontWeight: 800, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#9AA1AD', marginBottom: 14,
          }}
        >
          Neue MDU-Plattform
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-saira-condensed), system-ui, sans-serif',
            fontWeight: 900, fontSize: 'clamp(48px, 14vw, 92px)', lineHeight: 0.95,
            letterSpacing: '0.01em', textTransform: 'uppercase', margin: '0 0 22px',
            color: '#FFFFFF',
          }}
        >
          Coming<span style={{ color: '#D40000' }}> soon</span>
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-manrope), system-ui, sans-serif',
            fontSize: 16, lineHeight: 1.6, color: '#C2C7D0', margin: '0 auto', maxWidth: 460,
          }}
        >
          Wir bauen gerade an der neuen Online-Plattform der Münchner Dart Union.
          Schau bald wieder vorbei – wir sind in Kürze für dich da.
        </p>

        <div
          style={{
            marginTop: 34, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.10)',
            fontFamily: 'var(--font-manrope), system-ui, sans-serif', fontSize: 13, color: '#8B929E',
          }}
        >
          Fragen?{' '}
          <a href="mailto:kontakt@mdudarts.de" style={{ color: '#F4F5F7', textDecoration: 'none', fontWeight: 700 }}>
            kontakt@mdudarts.de
          </a>
        </div>
      </div>
    </div>
  );
}
