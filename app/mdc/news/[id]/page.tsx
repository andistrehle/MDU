// ============================================================
// MDC — ein einzelner News-Beitrag
// ============================================================
//
// Eigene Adresse je Beitrag, damit man ihn verschicken und in der
// Facebook-Gruppe verlinken kann. Entwürfe haben keine Seite — `getNewsPost`
// gibt sie nicht heraus, der Aufruf endet auf der 404-Seite.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { NewsAbsatz, NewsKopfzeile } from '@/components/mdc/news';
import { getNewsPost, publishedNews } from '@/data/news';
import { formatDate } from '@/lib/mdc/format';
import { mdcPath } from '@/lib/mdc/site';

export function generateStaticParams() {
  return publishedNews().map(post => ({ id: post.id }));
}

export async function generateMetadata(
  props: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await props.params;
  const post = getNewsPost(id);
  if (!post) return { title: 'Beitrag' };
  return { title: post.title, description: post.teaser };
}

export default async function NewsBeitragPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const post = getNewsPost(id);
  if (!post) notFound();

  const weitere = publishedNews().filter(p => p.id !== post.id).slice(0, 3);

  return (
    <>
      <section className="mdc-section">
        <div className="mdc-shell" style={{ maxWidth: 760 }}>
          <Link href={mdcPath('/news')} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
            <ArrowLeft size={15} />
            Alle News
          </Link>

          <article style={{ marginTop: 24 }}>
            <NewsKopfzeile post={post} />
            <h1 className="mdc-display mdc-h1" style={{ marginTop: 14, fontSize: 'clamp(1.7rem, 4vw, 2.6rem)' }}>
              {post.title}
            </h1>
            <p style={{ marginTop: 14, fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--mdc-ink)' }}>
              {post.teaser}
            </p>

            <div style={{ marginTop: 22, borderTop: '1px solid var(--mdc-line)', paddingTop: 8 }}>
              {post.paragraphs.map((absatz, i) => <NewsAbsatz key={i} text={absatz} />)}
            </div>

            <p style={{ marginTop: 26, fontSize: '0.82rem', color: 'var(--mdc-ink-dim)' }}>
              Veröffentlicht am {formatDate(post.date)} · Munich Darts Challenge
            </p>
          </article>
        </div>
      </section>

      {weitere.length > 0 && (
        <section className="mdc-section mdc-section-tint">
          <div className="mdc-shell">
            <h2 className="mdc-display mdc-h3" style={{ marginBottom: 16 }}>Weitere Beiträge</h2>
            <ul style={{ display: 'grid', gap: 12 }}>
              {weitere.map(p => (
                <li key={p.id} className="mdc-card" style={{ padding: '16px 18px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                    {formatDate(p.date)} · {p.category}
                  </span>
                  <h3 className="mdc-display" style={{ fontSize: '1.1rem', marginTop: 4 }}>
                    <Link href={mdcPath(`/news/${p.id}`)}>{p.title}</Link>
                  </h3>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
