'use client';

// ============================================================
// NotificationBell — Glocke + Badge + Dropdown (Sprint Notification-Center)
// ============================================================
//
// Für ALLE eingeloggten Nutzer. Zeigt ungelesene Anzahl als roten Badge,
// öffnet ein Popover mit den letzten Benachrichtigungen. Klick auf einen
// Eintrag markiert ihn als gelesen und navigiert zur action_url.
// Öffnen markiert NICHT automatisch alles als gelesen.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icon';
import { NotificationBadge } from './notification-badge';
import { useNotifications, relativeTime, type AppNotification } from '@/lib/supabase/user-notifications';

export function NotificationBell() {
  const router = useRouter();
  const { items, unread, loading, error, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Klick außerhalb / Escape schließt das Popover (Escape gibt den Fokus zurück).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Beim Öffnen den Fokus ins Popover setzen (Tastatur/Screenreader).
  useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true });
  }, [open]);

  async function onItemClick(n: AppNotification) {
    setOpen(false);
    if (!n.read_at) await markRead(n.id);
    if (n.action_url) router.push(n.action_url);
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <button
        ref={btnRef}
        type="button"
        aria-label="Benachrichtigungen öffnen"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="mdu-bell-btn"
        style={{
          position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 42, height: 42, borderRadius: 10, cursor: 'pointer',
          background: open ? 'var(--th-accent-a12)' : 'var(--th-bg-card)',
          border: `1.5px solid ${open ? 'var(--th-accent)' : 'var(--th-line-12, var(--th-line-10))'}`,
          color: 'var(--th-text-strong)',
          transition: 'background 140ms, border-color 140ms, box-shadow 140ms',
        }}
      >
        <Icon name="bell" size={22} stroke={2.2} />
        <NotificationBadge count={unread} absolute ringColor="var(--th-bg-header)" title={`${unread} ungelesene Benachrichtigungen`} />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Benachrichtigungen"
          aria-modal="false"
          tabIndex={-1}
          className="mdu-notif-pop"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 300,
            width: 360, maxWidth: 'calc(100vw - 24px)',
            background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)',
            borderRadius: 12, boxShadow: '0 24px 60px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}
        >
          {/* Kopf */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
            borderBottom: '1px solid var(--th-line-6)',
          }}>
            <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>
              Benachrichtigungen
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)' }}
              >
                Alle als gelesen
              </button>
            )}
          </div>

          {/* Fehlerhinweis, wenn eine Aktion serverseitig fehlschlug (REV-081) */}
          {error && (
            <div role="alert" style={{
              padding: '9px 16px', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 600,
              color: 'var(--th-accent)', background: 'var(--th-accent-a07)', borderBottom: '1px solid var(--th-line-6)',
            }}>
              {error}
            </div>
          )}

          {/* Liste */}
          <div style={{ maxHeight: 'min(420px, 60vh)', overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              // Ladezustand statt „leer" beim ersten Öffnen (REV-078)
              <div style={{ padding: '8px 0' }} aria-hidden="true">
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px' }}>
                    <span className="mdu-skel" style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="mdu-skel" style={{ display: 'block', height: 12, borderRadius: 4, width: '85%' }} />
                      <span className="mdu-skel" style={{ display: 'block', height: 10, borderRadius: 4, width: '40%', marginTop: 6 }} />
                    </span>
                  </div>
                ))}
                <style>{`
                  .mdu-skel { background: var(--th-line-8); position: relative; overflow: hidden; }
                  .mdu-skel::after {
                    content: ''; position: absolute; inset: 0;
                    background: linear-gradient(90deg, transparent, var(--th-line-6), transparent);
                    transform: translateX(-100%); animation: mdu-skel-shine 1.2s infinite;
                  }
                  @keyframes mdu-skel-shine { to { transform: translateX(100%); } }
                  @media (prefers-reduced-motion: reduce) { .mdu-skel::after { animation: none; } }
                `}</style>
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                Keine neuen Benachrichtigungen.
              </div>
            ) : (
              items.map(n => {
                const unreadItem = !n.read_at;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onItemClick(n)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left',
                      padding: '12px 16px', cursor: 'pointer', border: 'none',
                      borderBottom: '1px solid var(--th-line-4)',
                      background: unreadItem ? 'var(--th-accent-a07)' : 'transparent',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                      background: unreadItem ? 'var(--th-accent)' : 'transparent',
                    }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 13,
                        fontWeight: unreadItem ? 700 : 500, color: 'var(--th-text-strong)', lineHeight: 1.4,
                      }}>
                        {n.short_text}
                      </span>
                      <span style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', marginTop: 2 }}>
                        {relativeTime(n.created_at)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
