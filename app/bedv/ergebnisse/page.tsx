// ============================================================
// Ergebnisse — alle Ligen an einer Stelle
// ============================================================

import type { Metadata } from 'next';
import { ErgebnisseAnsicht } from '@/components/bedv/matches/ergebnisse-ansicht';
import { Stat } from '@/components/bedv/ui/bausteine';
import { BEGEGNUNGEN, SPIELE_JE_BEGEGNUNG } from '@/data/bedv/spiele';
import { LIGEN_AKTUELL } from '@/data/bedv/ligen';
import { SAISON_AKTUELL } from '@/data/bedv/saison';

export const metadata: Metadata = {
  title: 'Ergebnisse',
  description: 'Alle gespielten Begegnungen der laufenden Spielzeit, nach Liga und Spieltag filterbar.',
};

/** Wie die Startseite: Die Liste hängt am heutigen Tag. */
export const revalidate = 1800;

export default function ErgebnisseSeite() {
  const gespielt = BEGEGNUNGEN.filter(
    b => b.saisonId === SAISON_AKTUELL.id && b.status === 'gespielt',
  );
  const hoechster = gespielt.reduce((max, b) => Math.max(max, b.spieltag), 0);
  const einzelspiele = gespielt.length * SPIELE_JE_BEGEGNUNG;
  const unentschieden = gespielt.filter(b => b.heimPunkte === b.gastPunkte).length;
  const heimsiege = gespielt.filter(b => b.heimPunkte > b.gastPunkte).length;

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>{SAISON_AKTUELL.name}</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Ergebnisse</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Alle Staffeln an einer Stelle. Liga und Spieltag lassen sich umschalten, ohne
            die Seite zu verlassen.
          </p>

          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--bedv-line-dark)' }}>
            <Stat wert={gespielt.length} label="Begegnungen" ton="dunkel" />
            <Stat wert={einzelspiele.toLocaleString('de-DE')} label="Einzelspiele" ton="dunkel" />
            <Stat wert={heimsiege} label="Heimsiege" ton="dunkel" />
            <Stat wert={unentschieden} label="Unentschieden" ton="dunkel" hinweis="9:9" />
          </div>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <ErgebnisseAnsicht
          begegnungen={gespielt}
          staffeln={LIGEN_AKTUELL.map(l => ({ slug: l.slug, name: l.name }))}
          hoechsterSpieltag={hoechster}
        />
      </div>
    </>
  );
}
