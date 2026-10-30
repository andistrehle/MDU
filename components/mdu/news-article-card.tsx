'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './icon';
import type { NewsArticle } from '@/lib/data/news';
import { useAuth } from '@/lib/auth/auth-context';
import { hasMinRole } from '@/lib/auth/roles';
import { ShareNews } from './share-news';
import { NewsZahlenKlein, NewsReaktionen, alsGelesenMelden } from './news-reaktionen';

/**
 * Rendert die wenigen Auszeichnungen im Beitrag: **fett** und Links
 * [Text](/pfad) (nur Pfade auf der eigenen Seite oder https). Zeilenumbrüche
 * im Absatz bleiben stehen (Ergebnislisten im Spieltagsbericht).
 */
function renderRich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g).map((part, i) => {
    const fett = /^\*\*([^*]+)\*\*$/.exec(part);
    if (fett) return <strong key={i} style={{ fontWeight: 800, color: 'var(--th-text-strong)' }}>{fett[1]}</strong>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link && (link[2].startsWith('/') || link[2].startsWith('https://'))) {
      return <a key={i} href={link[2]} style={{ color: 'var(--th-accent)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}>{link[1]}</a>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Zwischenüberschrift: ein Absatz „## Titel“. */
const ueberschrift = (p: string) => /^##\s+(.+)$/.exec(p.trim())?.[1] ?? null;

/**
 * Video im Beitrag: ein Absatz, der nur aus `[video:/pfad.mp4]` besteht
 * (optional mit Vorschaubild `[video:/pfad.mp4|/bild.jpg]`), wird als Player
 * gezeigt. Dateien liegen unter public/videos/ (Vercel liefert sie aus —
 * nicht Supabase Storage, dessen Freikontingent für Videos schnell aufgebraucht wäre).
 */
const VIDEO_RE = /^\[video:([^\]|\s]+)(?:\|([^\]\s]+))?\]$/;
function videoAus(p: string): { src: string; poster?: string } | null {
  const m = VIDEO_RE.exec(p.trim());
  if (!m) return null;
  const ok = (u: string) => u.startsWith('/') || u.startsWith('https://');
  if (!ok(m[1]) || (m[2] && !ok(m[2]))) return null;
  return { src: m[1], poster: m[2] };
}

/**
 * Featured news card for the Homepage „Aktuelles" section.
 * Shows only the key fact; on click a modal opens with the full text.
 * Themed via the shared --th-* tokens (dark + Old School light).
 */
export function NewsArticleCard({ article }: { article: NewsArticle }) {
  const [open, setOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const isAdmin = hasMinRole(user, 'league_admin');

  // Geöffnet = gelesen (je Gerät einmal, Migration 0065).
  useEffect(() => { if (open) alsGelesenMelden(article.id); }, [open, article.id]);

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

  // Deep-Link: Artikel per #<id> in der URL direkt öffnen (teilbarer Link).
  useEffect(() => {
    const applyHash = () => {
      const id = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
      if (id === article.id) setOpen(true);
    };
    applyHash();
    window.addEventListener('hashchange', applyHash);
    return () => window.removeEventListener('hashchange', applyHash);
  }, [article.id]);

  // URL-Hash mit dem Öffnungszustand spiegeln (ohne History-Einträge/Scroll-Sprung).
  useEffect(() => {
    const current = decodeURIComponent((window.location.hash || '').replace(/^#/, ''));
    if (open && current !== article.id) {
      history.replaceState(null, '', `#${article.id}`);
    } else if (!open && current === article.id) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [open, article.id]);

  const articleUrl = `https://www.mdudarts.de/news#${article.id}`;
  const hatVideo = article.content.some(p => videoAus(p) !== null);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* Clipboard nicht verfügbar */ }
  };

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)',
            }}>
              {hatVideo ? 'Video ansehen' : 'Mehr lesen'} <Icon name="arrow-right" size={13} stroke={2.5} />
            </span>
            <NewsZahlenKlein id={article.id} />
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
              {article.content.map((p, i) => {
                const video = videoAus(p);
                if (video) return (
                  <video
                    key={i}
                    src={video.src}
                    poster={video.poster}
                    controls
                    playsInline
                    preload="none"
                    style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 10, background: '#000', border: '1px solid var(--th-line-8)' }}
                  />
                );
                const h = ueberschrift(p);
                if (h) return (
                  <h3 key={i} style={{
                    fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase',
                    letterSpacing: '0.02em', color: 'var(--th-text-strong)', margin: '8px 0 -4px',
                  }}>{h}</h3>
                );
                return (
                <p key={i} style={{
                  fontFamily: 'var(--font-manrope)', fontSize: 15, lineHeight: 1.65,
                  color: 'var(--th-text-body)', margin: 0, whiteSpace: 'pre-line',
                }}>
                  {renderRich(p)}
                </p>
                );
              })}
            </div>

            <div style={{
              marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--th-line-6)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
              fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <span>
                  Quelle:{' '}
                  <span style={{ color: 'var(--th-text-muted)' }}>
                    {article.source}
                  </span>
                </span>
                <NewsReaktionen id={article.id} />
              </span>
              <button
                type="button"
                onClick={copyLink}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent', color: 'var(--th-accent)',
                  border: '1.5px solid var(--th-accent)',
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12,
                }}
              >
                {linkCopied ? '✓ Link kopiert' : '🔗 Link kopieren'}
              </button>
            </div>

            {/* Publishing-Hilfe: News für FB-Gruppe + Instagram aufbereiten (nur Ligaleitung). */}
            {isAdmin && <ShareNews article={article} />}
          </div>
        </div>
      )}
    </>
  );
}
