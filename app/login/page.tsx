import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--th-bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(180deg, var(--th-bg-card3) 0%, var(--th-bg-card2) 100%)',
        border: '1px solid var(--th-line-6)', borderRadius: 20, padding: 40,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <Image src="/mdu-logo.webp" unoptimized alt="Münchner Dart Union" height={36} width={103} style={{ height: 36, width: 'auto' }} />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, color: 'var(--th-text-strong)', marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Anmelden
          </h1>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', marginTop: 8 }}>
            Zum MDU Mitgliederbereich
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-body)', marginBottom: 8, letterSpacing: '0.06em' }}>
              E-MAIL
            </label>
            <input
              type="email"
              placeholder="name@dartunion.de"
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--th-bg-header)',
                border: '1px solid var(--th-line-10)', borderRadius: 8,
                color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-body)', marginBottom: 8, letterSpacing: '0.06em' }}>
              PASSWORT
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px', background: 'var(--th-bg-header)',
                border: '1px solid var(--th-line-10)', borderRadius: 8,
                color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', background: 'var(--th-accent)', color: '#fff',
              border: '1px solid var(--th-accent-hover)', borderRadius: 8, fontFamily: 'var(--font-manrope)',
              fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', cursor: 'pointer',
              textTransform: 'uppercase', marginTop: 8,
              boxShadow: '0 8px 22px var(--th-accent-a40)',
            }}
          >
            Anmelden
          </button>
        </form>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginTop: 24 }}>
          Kein Zugang?{' '}
          <Link href="/kontakt" style={{ color: 'var(--th-accent)', textDecoration: 'none' }}>Kontakt aufnehmen</Link>
        </p>
      </div>
    </div>
  );
}
