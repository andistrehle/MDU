import type { Metadata } from 'next';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';
import { ContactForm } from '@/components/mdu/contact-form';

export const metadata: Metadata = {
  title: 'Kontakt · Münchner Dart Union',
  description: 'Kontakt und Ansprechpartner der Münchner Dart Union.',
};

export default function KontaktPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/kontakt" />

      <div className="mdu-section-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Münchner Dart Union
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
          }}>
            Kontakt
          </h1>
        </div>

        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', lineHeight: 1.65, margin: '0 0 24px' }}>
          Fragen zur Liga, zur Plattform oder zu deinem Konto? Schreib uns einfach – wir helfen
          gerne weiter.
        </p>

        {/* Kontaktkarte */}
        <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <ContactRow icon="mail" label="E-Mail">
            <a href="mailto:kontakt@mdudarts.de" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>
              kontakt@mdudarts.de
            </a>
          </ContactRow>

          <ContactRow icon="pin" label="Anschrift">
            Münchner Dart Union<br />
            Zenettistraße 30<br />
            80337 München
          </ContactRow>

          <ContactRow icon="user" label="Ansprechpartner">
            Andreas Strehle<br />
            Anton Bauer
          </ContactRow>
        </div>

        {/* Weitere Infos */}
        <div style={{
          marginTop: 20, padding: '14px 16px',
          background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 10,
          fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', lineHeight: 1.6,
        }}>
          Rechtliche Angaben findest du im{' '}
          <Link href="/impressum" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Impressum</Link>
          {' '}und in der{' '}
          <Link href="/datenschutz" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Datenschutzerklärung</Link>.
        </div>

        {/* Kontaktformular – zweiter unmittelbarer Kontaktweg (§ 5 DDG) */}
        <ContactForm />
      </div>

      <Footer />
    </div>
  );
}

function ContactRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-accent)',
      }}>
        <Icon name={icon} size={18} stroke={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 4 }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-strong)', lineHeight: 1.55 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
