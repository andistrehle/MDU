// ============================================================
// Beitragsseite
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { bedvPath } from '@/lib/bedv/site';
import { Absatz, BeitragsBild, NewsCard } from '@/components/bedv/news/news-card';
import { Badge, DemoHinweis, SectionHead } from '@/components/bedv/ui/bausteine';
import { NEWS, newsBySlug, weitereNews } from '@/data/bedv/news';
import { datumLang } from '@/lib/bedv/format';

export function generateStaticParams() {
  return NEWS.map(n => ({ slug: n.slug }));
}

export async function generateMetadata(props: PageProps<'/bedv/news/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const beitrag = newsBySlug(slug);
  if (!beitrag) return { title: 'Beitrag nicht gefunden' };
  return { title: beitrag.titel, description: beitrag.teaser };
}

export default async function BeitragSeite(props: PageProps<'/bedv/news/[slug]'>) {
  const { slug } = await props.params;
  const beitrag = newsBySlug(slug);
  if (!beitrag) notFound();

  return (
    <article>
      <div style={{ position: 'relative' }}>
        <BeitragsBild farben={beitrag.bildFarben} hoehe={220} />
      </div>

      <div className="bedv-shell" style={{ paddingBlock: '26px 52px', maxWidth: 780 }}>
        <Link href={bedvPath('/news')} style={{ color: 'var(--bedv-blue-deep)', fontSize: '0.86rem', fontWeight: 600 }}>
          ← Alle Beiträge
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Badge ton="blau">{beitrag.kategorie}</Badge>
          <span className="bedv-kicker">{datumLang(beitrag.datum)}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(1.7rem, 4.6vw, 2.5rem)', marginTop: 12 }}>{beitrag.titel}</h1>

        <p
          style={{
            fontSize: '1.1rem', color: 'var(--bedv-ink-soft)', marginTop: 14,
            lineHeight: 1.65, fontWeight: 500,
            paddingLeft: 16, borderLeft: '3px solid var(--bedv-accent)',
          }}
        >
          {beitrag.teaser}
        </p>

        <div className="bedv-prose" style={{ marginTop: 24 }}>
          {beitrag.absaetze.map((a, i) => <Absatz key={i} text={a} />)}
        </div>

        <div style={{ marginTop: 28 }}>
          <DemoHinweis>
            Demo-Beitrag. Er stammt nicht vom BeDV und gibt keine Beschlüsse oder
            Mitteilungen des Verbands wieder.
          </DemoHinweis>
        </div>
      </div>

      <section className="bedv-section bedv-section--tinted">
        <div className="bedv-shell">
          <SectionHead eyebrow="Weiterlesen" titel="Weitere Beiträge" aktion={{ label: 'Alle News', href: bedvPath('/news') }} />
          <div className="bedv-grid bedv-grid--3">
            {weitereNews(beitrag.slug, 3).map(n => <NewsCard key={n.slug} beitrag={n} />)}
          </div>
        </div>
      </section>
    </article>
  );
}
