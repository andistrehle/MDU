'use client';

import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { TEAMS } from '@/lib/data';

export default function AdminTeamsPage() {
  const teams = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <AdminGuard title="Teams" subtitle="Teams der aktuellen Saison verwalten und freigeben.">
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', marginBottom: 16 }}>
        {teams.length} Teams
      </div>

      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 720 }}>
        {teams.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: i < teams.length - 1 ? '1px solid var(--th-line-4)' : 'none',
          }}>
            <span style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: `${t.color}22`, border: `1px solid ${t.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12, color: t.color,
            }}>{t.short}</span>
            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-win)' }}>aktiv</span>
            <Link href={`/teams/${t.id}`} style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none', flexShrink: 0 }}>Ansehen →</Link>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 720, lineHeight: 1.6 }}>
        Hinweis: Die aktuelle Saison enthält ausschließlich bestätigte Teams. Eine echte
        Freigabe-Funktion (annehmen / ablehnen) erscheint hier, sobald neue
        Mannschaftsanmeldungen über die Saisonanmeldungen eingehen.
      </p>
    </AdminGuard>
  );
}
