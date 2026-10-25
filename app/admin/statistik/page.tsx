'use client';

// ============================================================
// Admin — Statistik (Untermenü, Betreiber 25.10.2026)
// ============================================================
// Sammelt die Auswertungen an einer Stelle: Erfassung der Spielberichte
// (Ligaleitung) und die anonyme Nutzungsstatistik (nur Super Admin, wie
// bisher). Erreichbar über die Kachel „Statistik“ unter Mein Bereich.
// ============================================================

import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { Icon } from '@/components/mdu/icon';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageUsers } from '@/lib/auth/roles';

const PUNKTE = [
  { href: '/admin/erfassung', titel: 'Erfassung der Spielberichte', text: 'Je Begegnung: live eingetragen, Foto hochgeladen oder vom Zettel abgeschrieben.', nurSuper: false },
  { href: '/admin/analytics', titel: 'Nutzungsstatistik', text: 'Anonyme Aufrufe, Top-Seiten, Dark/Classic, Login-Quote.', nurSuper: true },
];

export default function AdminStatistikPage() {
  const { user } = useAuth();
  const punkte = PUNKTE.filter(p => !p.nurSuper || canManageUsers(user));
  return (
    <AdminGuard title="Statistik" subtitle="Auswertungen der Plattform.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {punkte.map(p => (
          <Link key={p.href} href={p.href} style={{
            display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none',
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px',
          }}>
            <Icon name="bar" size={20} stroke={2} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>{p.titel}</span>
              <span style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginTop: 3 }}>{p.text}</span>
            </span>
            <span aria-hidden style={{ color: 'var(--th-text-faint)', fontSize: 18 }}>›</span>
          </Link>
        ))}
      </div>
    </AdminGuard>
  );
}
