import Image from 'next/image';
import Link from 'next/link';
import { Icon } from './icon';

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
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {(['mail', 'globe'] as const).map((icon, i) => (
              <div key={i} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--th-line-4)', border: '1px solid var(--th-line-8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-text-muted)',
                cursor: 'pointer',
              }}>
                <Icon name={icon} size={14} />
              </div>
            ))}
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--th-line-4)', border: '1px solid var(--th-line-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-text-muted)', fontFamily: 'var(--font-manrope)', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>f</div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--th-line-4)', border: '1px solid var(--th-line-8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-text-muted)', cursor: 'pointer' }}><Icon name="image" size={14} /></div>
          </div>
        </div>

        {[
          { title: 'Schnellzugriff', links: [{ l: 'Ligen', h: '/ligen' }, { l: 'Spielplan', h: '/spielplan' }, { l: 'Ergebnisse', h: '/ergebnisse' }, { l: 'Teams', h: '/teams' }, { l: 'Downloads', h: '/downloads' }] },
          { title: 'Rechtliches',   links: [{ l: 'Impressum', h: '/impressum' }, { l: 'Datenschutz', h: '/datenschutz' }, { l: 'Nutzungsbedingungen', h: '/nutzungsbedingungen' }] },
          { title: 'Kontakt',       links: [{ l: 'Münchner Dart Union', h: '/impressum' }, { l: 'kontakt@mdudarts.de', h: 'mailto:kontakt@mdudarts.de' }] },
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
