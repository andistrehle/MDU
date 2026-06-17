'use client';

import { AdminGuard } from '@/components/mdu/admin-guard';
import matches from '@/lib/data/imported-matches.json';
import statsRaw from '@/lib/data/imported-statistics.json';

const stats = statsRaw as Record<string, unknown[]>;
const matchCount = (matches as unknown[]).length;
const completed = (matches as { status: string }[]).filter(m => m.status === 'completed').length;
const statEntries = Object.values(stats).reduce((sum, arr) => sum + arr.length, 0);
const leagueCount = Object.keys(stats).length;

const AREAS = [
  { label: 'Ergebnisse & Spielpläne', detail: `${matchCount} Spiele (${completed} abgeschlossen)` },
  { label: 'Tabellen', detail: 'offizielle Liga-/Playoff-Tabellen' },
  { label: 'Einzelranglisten', detail: `${statEntries} Spieler-Einträge in ${leagueCount} Ligen` },
  { label: 'Leg-Bilanz', detail: 'aus „Legs"-Spalte übernommen' },
  { label: 'Spielerfotos / Teamlogos', detail: 'lokal in /public, per Skript ergänzt' },
];

export default function AdminImportPage() {
  return (
    <AdminGuard title="Datenimport" subtitle="Status des dartunion.de-Imports.">
      <div style={{
        background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 12,
        padding: '14px 18px', marginBottom: 18, maxWidth: 720,
        fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.6,
      }}>
        Der Import läuft aktuell <strong>lokal</strong> über
        {' '}<code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>npm run import:dartunion</code>.
        Ein serverseitiger Import-Button ist bewusst nicht aktiv (kein unsicherer Client-Import).
      </div>

      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 720 }}>
        {AREAS.map((a, i) => (
          <div key={a.label} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
            borderBottom: i < AREAS.length - 1 ? '1px solid var(--th-line-4)' : 'none',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)' }}>{a.label}</div>
              <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{a.detail}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-win)', flexShrink: 0 }}>importiert</span>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 720, lineHeight: 1.6 }}>
        Quellen: La Liga, C Liga sowie die vier Playoff-Gruppen (ranking01.php). Bei Importfehlern
        bleiben bestehende Daten erhalten; betroffene Liga/URL werden im Log genannt.
      </p>
    </AdminGuard>
  );
}
