// ============================================================
// MDC — Bausteine für die News
// ============================================================
//
// Der Fließtext kennt genau eine Auszeichnung: **fett**. Alles andere bliebe
// als Sternchen stehen, statt sich in etwas Unerwartetes zu verwandeln — eine
// halbe Textverarbeitung wäre schlimmer als gar keine.
//
// Bewusst kein `dangerouslySetInnerHTML`: Der Text kommt zwar aus der eigenen
// Verwaltung, aber er wandert durch eine Erkennung, ein Formular und eine
// Datei. Ihn als Text zu behandeln und nur die fetten Stellen selbst zu bauen,
// kostet zehn Zeilen und schließt eine ganze Fehlerklasse aus.
// ============================================================

import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { NewsPost } from '@/data/news';
import { formatDate } from '@/lib/mdc/format';
import { mdcPath } from '@/lib/mdc/site';

/** Ein Absatz mit **fetten** Stellen. */
export function NewsAbsatz({ text }: { text: string }) {
  const teile = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p style={{ marginTop: 12, lineHeight: 1.75, color: 'var(--mdc-ink-soft)' }}>
      {teile.map((teil, i) =>
        teil.startsWith('**') && teil.endsWith('**') && teil.length > 4
          ? <strong key={i} style={{ color: 'var(--mdc-ink)' }}>{teil.slice(2, -2)}</strong>
          : <span key={i}>{teil}</span>,
      )}
    </p>
  );
}

/** Datum und Schlagwort über dem Titel. */
export function NewsKopfzeile({ post }: { post: NewsPost }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        fontSize: '0.8rem', color: 'var(--mdc-ink-dim)',
      }}
    >
      <span className="mdc-chip mdc-chip-red">{post.category}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <CalendarDays size={14} />
        {formatDate(post.date)}
      </span>
    </div>
  );
}

/** Beitrag in der Übersicht: Titel, Teaser, Weg zum ganzen Text. */
export function NewsKarte({ post }: { post: NewsPost }) {
  return (
    <article className="mdc-card mdc-card-hover" style={{ padding: '22px 20px' }}>
      <NewsKopfzeile post={post} />
      <h2 className="mdc-display" style={{ fontSize: '1.35rem', marginTop: 12 }}>
        <Link href={mdcPath(`/news/${post.id}`)}>{post.title}</Link>
      </h2>
      <p style={{ marginTop: 10, fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
        {post.teaser}
      </p>
      <Link
        href={mdcPath(`/news/${post.id}`)}
        className="mdc-btn mdc-btn-ghost mdc-btn-sm"
        style={{ marginTop: 16 }}
      >
        Ganzen Beitrag lesen
      </Link>
    </article>
  );
}
