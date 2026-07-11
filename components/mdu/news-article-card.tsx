'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icon';
import type { NewsArticle } from '@/lib/data/news';
import { useAuth } from '@/lib/auth/auth-context';
import { hasMinRole } from '@/lib/auth/roles';
import { ShareNews } from './share-news';

/** Rendert einfache Markdown-Fettschrift (**…**) als <strong>. */
function renderRich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(part);
    return m
      ? <strong key={i} style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{m[1]}</strong>
      : <span key={i}>{part}</span>;
  });
}

/**
 * Featured news card for the Homepage „Aktuelles" section.
 * Shows only the key fact; on click a modal opens with the full text.
 * Themed via the shared --th-* tokens (dark + Old School light).
 */
export function NewsArticleCard({ article }: { article: NewsArticle }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const isAdmin = hasMinRole(user, 'league_admin');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mdu-card-hover"
        style={{
          textAlign: 'left', width: '100%', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px 18px', borderRadius: 12,
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-accent)',
        }}>
          <Icon name="bell" size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)' }}>{article.date}</span>
            <span style={{
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
              letterSpacing: '0.18em', color: 'var(--th-accent)', textTransform: 'uppercase',
            }}>{article.category}</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14,
            color: 'var(--th-text-strong)', lineHeight: 1.4, marginTop: 6,
          }}>
            {article.title}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10,
            fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)',
          }}>
            Mehr lesen <Icon name="arrow-right" size={13} stroke={2.5} />
          </div>
        </div>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mdu-news-modal-title"
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 600, maxHeight: '85vh',
              overflowY: 'auto',
              background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)',
              borderRadius: 16, padding: '26px 28px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Schließen"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 36, height: 36, borderRadius: 8,
                background: 'var(--th-line-5)', border: '1px solid var(--th-line-8)',
                color: 'var(--th-text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="close" size={18} stroke={2.5} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingRight: 44 }}>
              <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)' }}>{article.date}</span>
              <span style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
                letterSpacing: '0.18em', color: 'var(--th-accent)', textTransform: 'uppercase',
              }}>{article.category}</span>
            </div>

            <h2
              id="mdu-news-modal-title"
              style={{
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26,
                letterSpacing: '0.01em', color: 'var(--th-text-strong)', margin: '0 0 18px',
                textTransform: 'uppercase', lineHeight: 1.1,
              }}
            >
              {article.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {article.content.map((p, i) => (
                <p key={i} style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 15, lineHeight: 1.65,
                  color: 'var(--th-text-body)', margin: 0,
                }}>
                  {renderRich(p)}
                </p>
              ))}
            </div>

            <div style={{
              marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--th-line-6)',
              fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)',
            }}>
              Quelle:{' '}
              <span style={{ color: 'var(--th-text-muted)' }}>
                {article.source}
              </span>
            </div>

            {/* Publishing-Hilfe: News für FB-Gruppe + Instagram aufbereiten (nur Ligaleitung). */}
            {isAdmin && <ShareNews article={article} />}
          </div>
        </div>
      )}
    </>
  );
}
