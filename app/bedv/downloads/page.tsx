// ============================================================
// Download-Bereich
// ============================================================

import type { Metadata } from 'next';
import { DownloadKarte } from '@/components/bedv/ui/download-karte';
import { DemoHinweis, SectionHead } from '@/components/bedv/ui/bausteine';
import { DOWNLOADS, DOWNLOAD_KATEGORIEN } from '@/data/bedv/downloads';

export const metadata: Metadata = {
  title: 'Downloads',
  description: 'Formulare, Regelwerk und Verbandsunterlagen zum Herunterladen.',
};

export default function DownloadsSeite() {
  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Unterlagen</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>Downloads</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Formulare für den Spielbetrieb, Meldebögen und das Regelwerk. Vieles davon
            erledigt sich mit dem digitalen Spielbericht und der Online-Meldung von selbst —
            der Papierweg bleibt aber erhalten.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <div style={{ marginBottom: 24 }}>
          <DemoHinweis>
            Hinter den Einträgen liegen keine Dateien. Der Knopf erklärt stattdessen, was in
            der echten Plattform an dieser Stelle läge.
          </DemoHinweis>
        </div>

        {DOWNLOAD_KATEGORIEN.map(kategorie => {
          const eintraege = DOWNLOADS.filter(d => d.kategorie === kategorie);
          if (eintraege.length === 0) return null;
          return (
            <section key={kategorie} style={{ marginBottom: 34 }}>
              <SectionHead eyebrow={kategorie} titel={`${eintraege.length} Unterlagen`} />
              <div className="bedv-grid bedv-grid--2">
                {eintraege.map(d => <DownloadKarte key={d.slug} eintrag={d} />)}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
