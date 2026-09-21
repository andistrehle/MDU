// ============================================================
// Beitragsübersicht
// ============================================================

import type { Metadata } from 'next';
import { NewsCard } from '@/components/bedv/news/news-card';
import { DemoHinweis, SectionHead } from '@/components/bedv/ui/bausteine';
import { NEWS } from '@/data/bedv/news';

export const metadata: Metadata = {
  title: 'News',
  description: 'Meldungen aus dem Verband: Ligabetrieb, Pokal, Termine und Digitales.',
};

export default function NewsSeite() {
  const [erster, ...weitere] = NEWS;

  return (
    <>
      <header className="bedv-dark" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="bedv-grid-overlay" aria-hidden="true" />
        <div className="bedv-shell" style={{ position: 'relative', paddingBlock: '36px 32px' }}>
          <div className="bedv-eyebrow" style={{ color: 'var(--bedv-accent)' }}>Aus dem Verband</div>
          <h1 style={{ fontSize: 'clamp(1.9rem, 5vw, 2.8rem)', marginTop: 8 }}>News</h1>
          <p style={{ color: 'var(--bedv-on-dark-dim)', marginTop: 10, maxWidth: '58ch', lineHeight: 1.6 }}>
            Meldungen zum Spielbetrieb, zum Pokal und zum Verband — in der echten Plattform
            direkt von der Ligaleitung geschrieben, ohne Umweg über einen Dienstleister.
          </p>
        </div>
      </header>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px' }}>
        <div style={{ marginBottom: 22 }}>
          <DemoHinweis>
            Die Beiträge sind für diese Demo geschrieben. Es wurden keine Texte von der
            bestehenden BeDV-Seite übernommen.
          </DemoHinweis>
        </div>

        {erster && (
          <div style={{ marginBottom: 32 }}>
            <SectionHead eyebrow="Neuester Beitrag" titel={erster.kategorie} />
            <div style={{ maxWidth: 640 }}>
              <NewsCard beitrag={erster} gross />
            </div>
          </div>
        )}

        <SectionHead eyebrow="Weitere Beiträge" titel={`${weitere.length} Meldungen`} />
        <div className="bedv-grid bedv-grid--3">
          {weitere.map(n => <NewsCard key={n.slug} beitrag={n} />)}
        </div>
      </div>
    </>
  );
}
