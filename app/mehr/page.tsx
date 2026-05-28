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
    description: 'Regelwerk, Formulare und Dokumente zum Herunterladen.',
    ready: false,
  },
  {
    href: '/kontakt',
    icon: 'globe',
    label: 'Kontakt',
    description: 'Kontakt und Informationen zur Münchner Dart Union.',
    ready: false,
  },
] as const;

export default function MehrPage() {
  return (
    <div style={{ background: '#05070A', color: '#F5F6FA', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mehr" />

      <div className="mdu-section-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: '#D40000', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Münchner Dart Union
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: '#F5F6FA',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid #D40000', display: 'inline-block',
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
                background: '#121821',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                  background: item.ready ? 'rgba(212,0,0,0.12)' : 'rgba(255,255,255,0.04)',
                  border: item.ready ? '1px solid rgba(212,0,0,0.25)' : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: item.ready ? '#FF6B6B' : '#5A5F6C',
                }}>
                  <Icon name={item.icon} size={20} stroke={2} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{
                      fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15,
                      color: item.ready ? '#F5F6FA' : '#6A6E7B',
                    }}>
                      {item.label}
                    </span>
                    {!item.ready && (
                      <span style={{
                        fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: '#5A5F6C', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 4, padding: '1px 6px',
                      }}>
                        Folgt
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-manrope)', fontSize: 12,
                    color: item.ready ? '#9AA4B2' : '#4A4E5A',
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
                  style={{ color: item.ready ? '#6A6E7B' : '#3A3E4A', flexShrink: 0 }}
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: 32, padding: '14px 16px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 10,
          fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#5A5F6C', lineHeight: 1.6,
        }}>
          Weitere Informationen unter{' '}
          <a href="https://dartunion.de" target="_blank" rel="noopener noreferrer"
            style={{ color: '#9AA4B2', textDecoration: 'underline' }}>
            dartunion.de
          </a>
        </div>
      </div>

      <Footer />
    </div>
  );
}
