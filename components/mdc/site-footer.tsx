// ============================================================
// MDC — Fußzeile
// ============================================================
//
// Enthält den Verweis auf die Münchner Dart Union: MDC und MDU sind getrennte
// Projekte mit eigenen Spielern und eigenen Passnummern — verbunden sind sie
// nur über diesen Link.
// ============================================================

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { MdcMark } from './logo';
import { getCurrentSeason } from '@/data/season';
import { VENUES } from '@/data/venues';
import { formatDate } from '@/lib/mdc/format';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Spielbetrieb',
    links: [
      { label: 'Rangliste', href: mdcPath('/rangliste') },
      { label: 'Archiv', href: mdcPath('/rangliste/archiv') },
      { label: 'Turniere', href: mdcPath('/turniere') },
      { label: 'Spieler', href: mdcPath('/spieler') },
      { label: 'Spielorte', href: mdcPath('/spielorte') },
    ],
  },
  {
    title: 'Die MDC',
    links: [
      { label: 'Regeln', href: mdcPath('/regeln') },
      { label: 'Kontakt', href: mdcPath('/kontakt') },
      { label: 'Turnierverwaltung', href: mdcPath('/admin') },
    ],
  },
  {
    title: 'Rechtliches',
    links: [
      { label: 'Impressum', href: mdcPath('/impressum') },
      { label: 'Datenschutz', href: mdcPath('/datenschutz') },
    ],
  },
];

import type { BrandImage } from '@/lib/mdc/brand';
import { mdcPath } from '@/lib/mdc/site';

export function SiteFooter({ logo }: { logo?: BrandImage | null }) {
  const season = getCurrentSeason();

  return (
    <footer className="mdc-footer">
      <div className="mdc-shell">
        <div
          style={{
            display: 'grid',
            gap: 40,
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          }}
        >
          <div style={{ minWidth: 220 }}>
            {logo ? (
              // Das Logo steht auf Weiß. Auf dem dunkelblauen Grund bekommt es
              // deshalb eine eigene weiße Fläche — sonst klebte ein weißer
              // Kasten mit harter Kante in der Fußzeile.
              <span
                style={{
                  display: 'inline-flex', background: '#FFFFFF',
                  borderRadius: 12, padding: '12px 16px',
                }}
              >
                <MdcMark size={logo.wide ? 64 : 96} withText src={logo} />
              </span>
            ) : (
              <MdcMark size={104} withText />
            )}
            <p style={{ marginTop: 16, color: '#C9D6EA', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: 300 }}>
              Münchens Ranking-Serie für Einzelspieler. Gespielt wird in{' '}
              {VENUES.length} Lokalen quer durch die Stadt — mehrmals pro Woche,
              das ganze Jahr.
            </p>
            <p style={{ marginTop: 14, fontSize: '0.78rem', color: '#8FA3C4' }}>
              Stand: {formatDate(season.asOf)}
            </p>
          </div>

          {COLUMNS.map(column => (
            <div key={column.title}>
              <h3
                style={{
                  fontFamily: 'var(--mdc-font-display)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: 14,
                }}
              >
                {column.title}
              </h3>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: '0.9rem' }}>
                {column.links.map(link => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3
              style={{
                fontFamily: 'var(--mdc-font-display)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#FFFFFF',
                marginBottom: 14,
              }}
            >
              Ligadart in München
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#C9D6EA', lineHeight: 1.6, marginBottom: 12 }}>
              Du willst im Team spielen statt einzeln? Die Münchner Dart Union
              organisiert den Ligabetrieb — ein eigenständiges Projekt mit
              eigenen Pässen.
            </p>
            <a
              href="https://www.mdudarts.de"
              className="mdc-chip"
              style={{ color: '#FFFFFF' }}
            >
              Münchner Dart Union
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            paddingTop: 22,
            borderTop: '1px solid rgba(255, 255, 255, 0.14)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: '#8FA3C4',
          }}
        >
          <span>© {season.asOf.slice(0, 4)} Munich Darts Challenge</span>
          <span>Ergebnisse und Ranglisten aus der offiziellen Auswertung · Angaben ohne Gewähr</span>
        </div>
      </div>
    </footer>
  );
}
