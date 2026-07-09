import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { NewsArticleCard } from '@/components/mdu/news-article-card';
import { PageBanner } from '@/components/mdu/page-banner';
import { NEWS_ARTICLES } from '@/lib/data/news';

export default function NewsPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader />

      <PageBanner eyebrow="Aktuelles" title="News" />

      <main style={{ flex: 1 }}>
        <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '32px 28px 80px', width: '100%' }}>
          {NEWS_ARTICLES.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', fontStyle: 'italic', padding: '24px 0' }}>
              Aktuell keine Neuigkeiten.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {NEWS_ARTICLES.map(a => <NewsArticleCard key={a.id} article={a} />)}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
