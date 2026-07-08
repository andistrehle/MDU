import Image from 'next/image';
import Link from 'next/link';
import { Icon } from './icon';
import { SOCIAL_LINKS } from '@/lib/site-config';

export function Footer() {
  return (
    <footer style={{
      background: 'var(--th-bg-page)',
      borderTop: '1px solid var(--th-line-6)',
      padding: '40px 28px 28px',
    }}>
      <div className="mdu-footer-grid" style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40,
      }}>
        <div>
          <Image src="/mdu-logo.webp" unoptimized alt="Münchner Dart Union" height={32} width={91} style={{ height: 32, width: 'auto' }} />
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginTop: 14, lineHeight: 1.6, maxWidth: 280 }}>
            Die offizielle Liga-Seite für den organisierten Dartsport in München.
          </p>
          {/* Echte Kontakt-/Social-Wege (nur gesetzte Kanäle, keine Attrappen). */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <a href="mailto:kontakt@mdudarts.de" aria-label="E-Mail an die Münchner Dart Union" style={socialIcon}>
              <Icon name="mail" size={14} />
            </a>
            {SOCIAL_LINKS.facebook && (
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="MDU auf Facebook"
                style={{ ...socialIcon, fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 15 }}>
                f
              </a>
            )}
            {SOCIAL_LINKS.instagram && (
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="MDU auf Instagram" style={socialIcon}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            )}
          </div>
        </div>

        {[
          { title: 'Schnellzugriff', links: [{ l: 'Ligen', h: '/ligen' }, { l: 'Spielplan', h: '/spielplan' }, { l: 'Ergebnisse', h: '/ergebnisse' }, { l: 'Teams', h: '/teams' }, { l: 'Downloads', h: '/downloads' }] },
          { title: 'Rechtliches',   links: [{ l: 'Impressum', h: '/impressum' }, { l: 'Datenschutz', h: '/datenschutz' }, { l: 'Nutzungsbedingungen', h: '/nutzungsbedingungen' }] },
          { title: 'Kontakt',       links: [{ l: 'Kontaktformular', h: '/kontakt' }, { l: 'kontakt@mdudarts.de', h: 'mailto:kontakt@mdudarts.de' }, { l: 'Impressum', h: '/impressum' }] },
        ].map(group => (
          <div key={group.title}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', color: 'var(--th-text-strong)', marginBottom: 14 }}>
              {group.title}
            </div>
            {group.links.map(link => (
              <Link key={link.l} href={link.h} style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', padding: '5px 0', textDecoration: 'none', transition: 'color 120ms' }}>
                {link.l}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 1280, margin: '28px auto 0', paddingTop: 20, borderTop: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint2)', textAlign: 'center' }}>
        © {new Date().getFullYear()} Münchner Dart Union. Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}

const socialIcon: React.CSSProperties = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'var(--th-line-4)', border: '1px solid var(--th-line-8)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--th-text-muted)', textDecoration: 'none',
};
