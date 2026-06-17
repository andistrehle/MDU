'use client';

import { AdminGuard } from '@/components/mdu/admin-guard';
import { getCurrentSeason, LEAGUES } from '@/lib/data';

export default function AdminSettingsPage() {
  const season = getCurrentSeason();
  const rows = [
    { k: 'Aktuelle Saison', v: season.name },
    { k: 'Aktive Wettbewerbe', v: `${LEAGUES.length} (Ligen + Playoffs)` },
    { k: 'Standard-Design', v: 'New Design (Dark)' },
    { k: 'Spielerprofile', v: 'öffentlich sichtbar' },
    { k: 'Indexierung', v: 'öffentliche Seiten indexierbar, interne via noindex' },
    { k: 'Kontakt-E-Mail', v: '[noch festlegen]' },
    { k: 'Datenschutzkontakt', v: '[noch festlegen]' },
    { k: 'Wartungsmodus', v: 'aus (folgt)' },
  ];

  return (
    <AdminGuard title="Einstellungen" subtitle="Systemeinstellungen der Plattform." require="super">
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '8px 20px', maxWidth: 640 }}>
        {rows.map((r, i) => (
          <div key={r.k} style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '12px 0',
            borderBottom: i < rows.length - 1 ? '1px solid var(--th-line-4)' : 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>{r.k}</span>
            <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 600, fontSize: 13, color: 'var(--th-text-strong)', textAlign: 'right' }}>{r.v}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 640, lineHeight: 1.6 }}>
        Diese Werte sind aktuell schreibgeschützt (read-only). Die Bearbeitung mit dauerhafter
        Speicherung folgt, sobald eine Settings-Tabelle in Supabase angelegt ist — bis dahin
        werden keine Änderungen vorgetäuscht.
      </p>
    </AdminGuard>
  );
}
