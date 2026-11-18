'use client';

// ============================================================
// Admin-Untermenü (Betreiber, 18.11.2026): Sammelkachel → Liste ihrer Seiten
// ============================================================
// Mein Bereich und das Admin-Dashboard zeigen nur noch 7 Gruppen (Postfach ·
// Spielbetrieb · Teams & Spieler · Benutzer · News · Statistik · Premium). Die
// Gruppen mit mehreren Seiten führen hierher; an jedem Punkt steht die Zahl der
// offenen Aufgaben (useAdminNotificationCounts), wie vorher an der Kachel.
// ============================================================

import Link from 'next/link';
import { AdminGuard } from './admin-guard';
import { Icon } from './icon';
import { NotificationBadge } from './notification-badge';
import { useAdminNotificationCounts, type AdminNotificationCounts } from '@/lib/supabase/admin-counts';

export interface HubPunkt { href: string; titel: string; text: string; icon?: string; badgeKey?: keyof AdminNotificationCounts }

export function AdminHub({ titel, untertitel, punkte }: { titel: string; untertitel: string; punkte: HubPunkt[] }) {
  const { counts } = useAdminNotificationCounts();
  return (
    <AdminGuard title={titel} subtitle={untertitel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 760 }}>
        {punkte.map(p => {
          const zahl = p.badgeKey ? counts[p.badgeKey] : 0;
          return (
            <Link key={p.href} href={p.href} style={{
              display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
              background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px',
            }}>
              <span style={{ color: 'var(--th-accent)', display: 'inline-flex' }}><Icon name={(p.icon ?? 'list') as 'list'} size={20} stroke={2} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>
                  {p.titel}
                  {zahl > 0 && <NotificationBadge count={zahl} title={`${zahl} offen: ${p.titel}`} />}
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginTop: 3 }}>{p.text}</span>
              </span>
              <span aria-hidden style={{ color: 'var(--th-text-faint)', fontSize: 18 }}>›</span>
            </Link>
          );
        })}
      </div>
    </AdminGuard>
  );
}
