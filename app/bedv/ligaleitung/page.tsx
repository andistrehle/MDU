// ============================================================
// Bereich der Ligaleitung
// ============================================================

import type { Metadata } from 'next';
import { Ligaleitung } from '@/components/bedv/dashboard/ligaleitung';
import { SAISON_AKTUELL } from '@/data/bedv/saison';

export const metadata: Metadata = {
  title: 'Ligaleitung',
  description: 'Mannschaftsmeldungen prüfen, Spielberichte freigeben, Spielerverwaltung (Demo).',
};

export default function LigaleitungSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '34px 30px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>
            Verwaltung · {SAISON_AKTUELL.name}
          </div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4.8vw, 2.5rem)', marginTop: 8 }}>Ligaleitung</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '64ch', lineHeight: 1.6 }}>
            Nicht nur die öffentliche Seite wird besser. Was heute in einem Mailpostfach
            liegt — Meldungen, Spielberichte, Passanträge — steht hier als Arbeitsliste mit
            Stand: wer hat wann was eingereicht, was fehlt noch, wer hat freigegeben.
          </p>
        </div>
      </header>

      <Ligaleitung />
    </>
  );
}
