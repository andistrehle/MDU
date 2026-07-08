import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Footer } from '@/components/mdu/footer';
import { NewsArticleCard } from '@/components/mdu/news-article-card';
import { NEWS_ARTICLES } from '@/lib/data/news';

export default function NewsPage() {
  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DesktopHeader />

      <main style={{ flex: 1 }}>
        <div className="mdu-section-pad" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 28px 80px', width: '100%' }}>
          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8,
            }}>
              Aktuelles
            </div>
            <h1 style={{
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 48,
              letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
              margin: 0, paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
            }}>
              News
            </h1>
          </div>

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
