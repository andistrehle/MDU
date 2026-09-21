// ============================================================
// Kontakt
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath, BEDV_DISCLAIMER_LANG } from '@/lib/bedv/site';
import { Card, Feld, SectionHead } from '@/components/bedv/ui/bausteine';
import { KontaktFormular } from '@/components/bedv/forms/kontakt-formular';
import { VERBAND } from '@/data/bedv/verband';

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Anfragen an den Verband — Demo-Formular ohne Versand.',
};

export default function KontaktSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Ansprechpartner</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Kontakt</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Anfragen laufen in der echten Plattform als Vorgang bei der zuständigen Stelle
            auf — mit Eingangsbestätigung und Verlauf, statt in einem Sammelpostfach.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }} className="bedv-liga-split">
          <div>
            <SectionHead eyebrow="Anfrage" titel="Schreib uns" />
            <KontaktFormular />
          </div>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Card padding="16px 18px">
              <h3 style={{ fontSize: '1.02rem', marginBottom: 10 }}>Verband</h3>
              <Feld label="E-Mail">{VERBAND.kontakt.email}</Feld>
              <Feld label="Anschrift">
                <span>{VERBAND.kontakt.postanschrift.map(z => <span key={z} style={{ display: 'block' }}>{z}</span>)}</span>
              </Feld>
              <p style={{ fontSize: '0.78rem', color: 'var(--bedv-ink-faint)', marginTop: 10, lineHeight: 1.5 }}>
                {VERBAND.kontakt.hinweis}
              </p>
            </Card>

            <Card padding="16px 18px">
              <h3 style={{ fontSize: '1.02rem', marginBottom: 8 }}>Zu dieser Seite</h3>
              <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                {BEDV_DISCLAIMER_LANG}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <Link href={bedvPath('/verband')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">Der Verband</Link>
                <Link href={bedvPath('/downloads')} className="bedv-btn bedv-btn--ghost bedv-btn--sm">Downloads</Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
