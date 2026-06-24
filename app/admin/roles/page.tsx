'use client';

import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { ROLE_LABELS, type UserRole } from '@/lib/auth/roles';

const ROLE_RIGHTS: { role: UserRole; rights: string[] }[] = [
  { role: 'player', rights: [
    'Eigenes Profil bearbeiten',
    'Profilbild hochladen / ändern',
    'Spitzname pflegen',
    '„Über mich" bearbeiten',
  ]},
  { role: 'team_captain', rights: [
    'Alle Spieler-Rechte',
    'Eigenes Teamprofil bearbeiten',
    'Teamlogo & Mannschaftsbild (URL) pflegen',
    'Social-Media-Links pflegen',
    'Kader des eigenen Teams ansehen',
  ]},
  { role: 'league_admin', rights: [
    'Alle Kapitäns-Rechte (für alle Teams)',
    'Teams verwalten',
    'Benutzer einsehen (ohne Rollenvergabe)',
    'Saisonanmeldungen bearbeiten',
    'Spielberichte freigeben',
    'News & Downloads pflegen',
  ]},
  { role: 'super_admin', rights: [
    'Vollzugriff auf alle Bereiche',
    'Rollen vergeben & ändern',
    'Benutzer mit Spielern/Teams verknüpfen',
    'Systemeinstellungen',
  ]},
];

export default function AdminRolesPage() {
  return (
    <AdminGuard title="Rollen & Rechte" subtitle="Übersicht der Rollen und ihrer Berechtigungen.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
        {ROLE_RIGHTS.map(({ role, rights }) => (
          <div key={role} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18,
                color: 'var(--th-text-strong)', textTransform: 'uppercase', letterSpacing: '0.03em',
              }}>{ROLE_LABELS[role]}</span>
              <code style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-faint)', background: 'var(--th-line-5)', padding: '2px 6px', borderRadius: 4 }}>{role}</code>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.8 }}>
              {rights.map(r => <li key={r}>{r}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 720, lineHeight: 1.6 }}>
        Rollen werden in der{' '}
        <Link href="/admin/users" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>Benutzerverwaltung</Link>{' '}
        vergeben (nur Super Admin). Eine feinere, konfigurierbare Rechte-Matrix kann später ergänzt werden.
      </p>
    </AdminGuard>
  );
}
