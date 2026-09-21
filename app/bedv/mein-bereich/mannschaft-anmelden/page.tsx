// ============================================================
// Mannschaftsmeldung
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { MannschaftAnmelden, type LigaWahl, type OrtWahl } from '@/components/bedv/forms/mannschaft-anmelden';
import { LIGEN_AKTUELL } from '@/data/bedv/ligen';
import { teamsDerLiga } from '@/data/bedv/teams';
import { SPIELSTAETTEN, adresse } from '@/data/bedv/spielstaetten';
import { SAISON_AKTUELL } from '@/data/bedv/saison';

export const metadata: Metadata = {
  title: 'Mannschaft melden',
  description: 'Digitale Mannschaftsmeldung in sechs geführten Schritten (Demo).',
};

export default function MannschaftAnmeldenSeite() {
  const ligen: LigaWahl[] = LIGEN_AKTUELL.map(l => ({
    slug: l.slug,
    name: l.name,
    beschreibung: l.beschreibung,
    plaetze: `${teamsDerLiga(l.slug).length} Mannschaften gemeldet`,
  }));

  const orte: OrtWahl[] = SPIELSTAETTEN.map(v => ({
    id: v.id, name: v.name, adresse: adresse(v), automaten: v.automaten,
  }));

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '30px 28px' }}>
          <Link href={bedvPath('/mein-bereich')} style={{ color: 'var(--bedv-on-dark-dim)', fontSize: '0.84rem' }}>
            ← Mein Bereich
          </Link>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)', marginTop: 12 }}>
            {SAISON_AKTUELL.name}
          </div>
          <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.4rem)', marginTop: 7 }}>Mannschaft melden</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 9, maxWidth: '60ch', lineHeight: 1.6 }}>
            Was heute ein ausgedrucktes, ausgefülltes und abfotografiertes PDF ist: sechs
            Schritte, die sich selbst prüfen — und am Ende eine Meldung, bei der nichts fehlt.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', maxWidth: 940 }}>
        <MannschaftAnmelden ligen={ligen} orte={orte} />
      </div>
    </>
  );
}
