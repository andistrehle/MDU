import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100vh', background: '#05070A', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'linear-gradient(180deg, #14161E 0%, #11141B 100%)',
        border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: 40,
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <Image src="/mdu-logo.png" alt="Münchner Dart Union" height={36} width={103} style={{ height: 36, width: 'auto' }} />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 28, color: '#F5F6FA', marginTop: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Anmelden
          </h1>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: '#9AA4B2', marginTop: 8 }}>
            Zum MDU Mitgliederbereich
          </p>
        </div>

        <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: '#C9CCD6', marginBottom: 8, letterSpacing: '0.06em' }}>
              E-MAIL
            </label>
            <input
              type="email"
              placeholder="name@dartunion.de"
              style={{
                width: '100%', padding: '12px 16px', background: '#0D1117',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
                color: '#F5F6FA', fontFamily: 'var(--font-manrope)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: '#C9CCD6', marginBottom: 8, letterSpacing: '0.06em' }}>
              PASSWORT
            </label>
            <input
              type="password"
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px', background: '#0D1117',
                border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
                color: '#F5F6FA', fontFamily: 'var(--font-manrope)', fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%', padding: '14px', background: '#D40000', color: '#fff',
              border: '1px solid #FF1F1F', borderRadius: 8, fontFamily: 'var(--font-manrope)',
              fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', cursor: 'pointer',
              textTransform: 'uppercase', marginTop: 8,
              boxShadow: '0 8px 22px rgba(212,0,0,0.4)',
            }}
          >
            Anmelden
          </button>
        </form>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#9AA4B2', marginTop: 24 }}>
          Kein Zugang?{' '}
          <Link href="/kontakt" style={{ color: '#D40000', textDecoration: 'none' }}>Kontakt aufnehmen</Link>
        </p>
      </div>
    </div>
  );
}
