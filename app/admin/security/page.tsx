'use client';

import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { Icon } from '@/components/mdu/icon';

const CHECKS: { ok: boolean; label: string }[] = [
  { ok: true, label: 'Supabase Auth aktiv (Login/Logout/Reset)' },
  { ok: true, label: 'Row Level Security auf profiles / player_profiles / team_profiles' },
  { ok: true, label: 'Keine Rollen-Selbsteskalation (with check)' },
  { ok: true, label: 'Nur anon/publishable Key im Frontend — kein service_role' },
  { ok: true, label: 'robots.txt blockt interne Pfade' },
  { ok: true, label: 'noindex auf Login / Admin / Mein-Bereich' },
  { ok: true, label: 'Sitemap ohne interne Seiten' },
  { ok: true, label: 'Datenschutzerklärung & Impressum vorhanden (Vorlagen)' },
];

const TODOS = [
  'Datenschutz/Impressum mit echten Daten füllen & rechtlich prüfen',
  'AV-Verträge mit Vercel & Supabase prüfen',
  'Vor Upload-Feature: Storage-Policies & Datei-Validierung',
];

export default function AdminSecurityPage() {
  return (
    <AdminGuard title="Sicherheit & Datenschutz" subtitle="Status und offene Punkte.">
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px', marginBottom: 16, maxWidth: 720 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 12 }}>Status</div>
        {CHECKS.map(c => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
            <Icon name="check" size={15} stroke={2.5} style={{ color: 'var(--th-win)', flexShrink: 0 }} />
            {c.label}
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px', marginBottom: 16, maxWidth: 720 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-gold)', textTransform: 'uppercase', marginBottom: 12 }}>Offene TODOs vor Livegang</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.8 }}>
          {TODOS.map(t => <li key={t}>{t}</li>)}
        </ul>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
        <Link href="/datenschutz" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>→ Datenschutzerklärung</Link>
        <Link href="/impressum" style={{ color: 'var(--th-accent)', textDecoration: 'none', fontWeight: 700 }}>→ Impressum</Link>
      </div>
      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 720, lineHeight: 1.6 }}>
        Details: <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>docs/security-checklist.md</code> und
        {' '}<code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>docs/datenschutz-und-sicherheit.md</code> im Projekt.
      </p>
    </AdminGuard>
  );
}
