import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { Icon } from '@/components/mdu/icon';

const SECTIONS = [
  {
    href: '/teams',
    icon: 'users',
    label: 'Teams',
    description: 'Alle Teams der aktuellen Saison mit Kader, Spielplan und Statistiken.',
    ready: true,
  },
  {
    href: '/spielstaetten',
    icon: 'pin',
    label: 'Spielstätten',
    description: 'Spiellokale und Adressen aller Heimstätten in der Saison.',
    ready: true,
  },
  {
    href: '/downloads',
    icon: 'download',
    label: 'Downloads',
    description: 'Offizieller MDU-Spielbericht und weitere Dokumente zum Herunterladen.',
    ready: true,
  },
  {
    href: '/kontakt',
    icon: 'globe',
    label: 'Kontakt',
    description: 'Kontakt und Informationen zur Münchner Dart Union.',
    ready: false,
  },
  {
    href: '/impressum',
    icon: 'file',
    label: 'Impressum',
    description: 'Angaben gemäß § 5 TMG und rechtliche Hinweise.',
    ready: false,
  },
  {
    href: '/datenschutz',
    icon: 'list',
    label: 'Datenschutz',
    description: 'Datenschutzerklärung und Informationen zur Datenverarbeitung.',
    ready: false,
  },
] as const;

export default function MehrPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mehr" />

      <div className="mdu-section-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
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
            Mehr
          </h1>
        </div>

        {/* Section link cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', display: 'block' }}
              className="mdu-card-hover"
            >
              <div style={{
                background: 'var(--th-bg-card)',
                border: '1px solid var(--th-line-6)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: item.ready ? 'var(--th-accent-a12)' : 'var(--th-line-4)',
                  border: item.ready ? '1px solid var(--th-accent-a25)' : '1px solid var(--th-line-8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.ready ? 'var(--th-loss)' : 'var(--th-text-faint2)',
                }}>
                  <Icon name={item.icon} size={20} stroke={2} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15,
                      color: item.ready ? 'var(--th-text-strong)' : 'var(--th-text-faint)',
                    }}>
                      {item.label}
                    </span>
                    {!item.ready && (
                      <span style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--th-text-faint2)', background: 'var(--th-line-4)',
                        border: '1px solid var(--th-line-8)',
                        borderRadius: 4, padding: '1px 6px',
                      }}>
                        Folgt
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-manrope)', fontSize: 12,
                    color: item.ready ? 'var(--th-text-muted)' : '#4A4E5A',
                    lineHeight: 1.4,
                  }}>
                    {item.description}
                  </div>
                </div>

                {/* Arrow */}
                <Icon
                  name="arrow-right"
                  size={16}
                  stroke={2}
                  style={{ color: item.ready ? 'var(--th-text-faint)' : '#3A3E4A', flexShrink: 0 }}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Login — secondary entry point */}
        <Link
          href="/login"
          style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}
          className="mdu-card-hover"
        >
          <div style={{
            background: 'rgba(212,0,0,0.06)',
            border: '1px solid rgba(212,0,0,0.2)',
            borderRadius: 12,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: 'rgba(212,0,0,0.14)',
              border: '1px solid var(--th-accent-a30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--th-accent)',
            }}>
              <Icon name="user" size={20} stroke={2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)', marginBottom: 3 }}>
                Login
              </div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', lineHeight: 1.4 }}>
                Anmelden zum MDU Mitgliederbereich
              </div>
            </div>
            <Icon name="arrow-right" size={16} stroke={2} style={{ color: 'var(--th-accent)', flexShrink: 0 }} />
          </div>
        </Link>

        {/* Footer note */}
        <div style={{
          marginTop: 24, padding: '14px 16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--th-line-5)',
          borderRadius: 10,
          fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint2)', lineHeight: 1.6,
        }}>
          Weitere Informationen unter{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--th-text-muted)', textDecoration: 'underline' }}>
            dartunion.de
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
