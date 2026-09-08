// ============================================================
// MDC — News-Übersicht
// ============================================================
//
// Alle veröffentlichten Beiträge, neueste zuerst. Entwürfe stehen zwar in
// `data/news.ts`, tauchen hier aber nicht auf.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { NewsKarte } from '@/components/mdc/news';
import { publishedNews } from '@/data/news';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  title: 'News',
  description:
    'Neuigkeiten der Munich Darts Challenge: Termine, Änderungen im Spielbetrieb '
    + 'und alles, was die Serie sonst betrifft.',
};

export default function NewsPage() {
  const posts = publishedNews();

  return (
    <>
      <PageHero
        kicker="Aktuelles"
        title="News"
        description="Was es bei der Munich Darts Challenge Neues gibt — Termine, Änderungen im Spielbetrieb und alles, was die Serie betrifft."
      />

      <section className="mdc-section">
        <div className="mdc-shell">
          {posts.length === 0 ? (
            // Kein leeres Raster und keine erfundenen Platzhalter: Wenn noch
            // nichts geschrieben wurde, steht genau das da.
            <div className="mdc-card" style={{ padding: '26px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <Newspaper size={20} style={{ flexShrink: 0, marginTop: 3, color: 'var(--mdc-red)' }} />
              <div>
                <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Noch keine Beiträge</h2>
                <p style={{ marginTop: 8, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)', maxWidth: 620 }}>
                  Hier stehen künftig Neuigkeiten zur Serie. Solange nichts geschrieben ist,
                  bleibt die Seite leer — die aktuellen Ranglisten und Ergebnisse gibt es
                  unabhängig davon.
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                  <Link href={mdcPath('/rangliste')} className="mdc-btn mdc-btn-primary mdc-btn-sm">
                    Zur Rangliste
                  </Link>
                  <Link href={mdcPath('/turniere')} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
                    Kommende Turniere
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
              {posts.map(post => <NewsKarte key={post.id} post={post} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
