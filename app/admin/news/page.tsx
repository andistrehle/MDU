'use client';

import { AdminGuard } from '@/components/mdu/admin-guard';
import { NEWS_ARTICLES } from '@/lib/data/news';

export default function AdminNewsPage() {
  return (
    <AdminGuard title="News" subtitle="Aktuelles verwalten.">
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginBottom: 14 }}>
        {NEWS_ARTICLES.length} {NEWS_ARTICLES.length === 1 ? 'Meldung' : 'Meldungen'} · Quelle: <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>lib/data/news.ts</code>
      </div>

      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 760 }}>
        {NEWS_ARTICLES.map((n, i) => (
          <div key={n.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
            borderBottom: i < NEWS_ARTICLES.length - 1 ? '1px solid var(--th-line-4)' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{n.date} · {n.category}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-win)', flexShrink: 0 }}>veröffentlicht</span>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 760, lineHeight: 1.6 }}>
        News werden aktuell aus dem Code (<code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>lib/data/news.ts</code>) geladen
        und sind hier schreibgeschützt. Das Erstellen/Bearbeiten mit Speicherung in Supabase
        (Status Entwurf / veröffentlicht / archiviert) folgt in einem späteren Sprint.
      </p>
    </AdminGuard>
  );
}
