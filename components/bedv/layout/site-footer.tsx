// ============================================================
// Fußzeile
// ============================================================
//
// Hier steht der Hinweis, der auf jeder Seite stehen MUSS: Das ist eine
// unverbindliche Demo und keine Website des BeDV. Er ist bewusst gut
// lesbar — nicht in Grau auf Grau versteckt — aber er steht am Ende und
// stört die Vorführung dadurch an keiner Stelle.
// ============================================================

import Link from 'next/link';
import { bedvPath, BEDV_DISCLAIMER_LANG, BEDV_NAME_LANG } from '@/lib/bedv/site';
import { BedvEmblem, BedvWortmarke } from '../brand/logo';
import { HAUPT_NAV, WEITERE_NAV } from './navigation';
import { SAISON_AKTUELL } from '@/data/bedv/saison';

export function SiteFooter() {
  return (
    <footer className="bedv-dark" style={{ position: 'relative', overflow: 'hidden', marginTop: 8 }}>
      <div className="bedv-grid-overlay" aria-hidden="true" />
      <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '40px 26px' }}>
        <div
          style={{
            display: 'grid', gap: 30,
            gridTemplateColumns: 'minmax(0, 1.4fr) repeat(2, minmax(0, 1fr))',
          }}
          className="bedv-footer-grid"
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <BedvEmblem groesse={40} />
              <BedvWortmarke variante="hell" />
            </div>
            <p style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.87rem', marginTop: 14, maxWidth: '42ch', lineHeight: 1.6 }}>
              {BEDV_NAME_LANG} — Ligaspielbetrieb im Elektronik-Dart in Bayern.
              Laufende Spielzeit: {SAISON_AKTUELL.name}.
            </p>
          </div>

          <div>
            <div className="bedv-kicker" style={{ color: 'var(--bedv-on-dark-faint)', marginBottom: 10 }}>Spielbetrieb</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 7 }}>
              {HAUPT_NAV.map(p => (
                <li key={p.pfad}>
                  <Link href={bedvPath(p.pfad)} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.88rem' }}>
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="bedv-kicker" style={{ color: 'var(--bedv-on-dark-faint)', marginBottom: 10 }}>Verband</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 7 }}>
              {WEITERE_NAV.map(p => (
                <li key={p.pfad}>
                  <Link href={bedvPath(p.pfad)} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.88rem' }}>
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          style={{
            marginTop: 30, paddingTop: 18, borderTop: '1px solid var(--bedv-line-dark)',
            display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start',
          }}
        >
          <p
            style={{
              color: 'var(--bedv-on-dark-dim)', fontSize: '0.8rem', maxWidth: '68ch',
              lineHeight: 1.6, margin: 0,
            }}
          >
            <strong style={{ color: 'var(--bedv-accent)' }}>Hinweis:</strong>{' '}
            {BEDV_DISCLAIMER_LANG}
          </p>
          <span style={{ color: 'var(--bedv-on-dark-faint)', fontSize: '0.78rem' }}>
            Demo · Stand {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
