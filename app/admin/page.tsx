'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/mdu/icon';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLE_LABELS, isSuperAdmin, canManageLeague } from '@/lib/auth/roles';
import { TEAMS, PLAYERS, LEAGUES } from '@/lib/data';
import { listAdminNotifications, markNotificationRead, type AdminNotification } from '@/lib/supabase/notifications';

interface AdminCard {
  icon: string;
  label: string;
  desc: string;
  href: string;
  super?: boolean;
}

const CARDS: AdminCard[] = [
  { icon: 'users',    label: 'Benutzerverwaltung', desc: 'Konten, Rollen & Verknüpfungen.', href: '/admin/users' },
  { icon: 'edit',     label: 'Rollenverwaltung',   desc: 'Rollen & Rechte im Überblick.',   href: '/admin/roles' },
  { icon: 'trophy',   label: 'Teams',              desc: 'Teams der Saison verwalten.',     href: '/admin/teams' },
  { icon: 'user',     label: 'Spieler',            desc: 'Spieler & Verknüpfungen.',        href: '/admin/players' },
  { icon: 'list',     label: 'Saisonanmeldungen',  desc: 'Mannschaftsanmeldungen prüfen.',  href: '/admin/registrations' },
  { icon: 'file',     label: 'Spielberichte',      desc: 'Berichte prüfen & freigeben.',    href: '/admin/spielberichte' },
  { icon: 'bell',     label: 'News',               desc: 'Aktuelles verwalten.',            href: '/admin/news' },
  { icon: 'download', label: 'Downloads',          desc: 'Dokumente & Formulare.',          href: '/admin/downloads' },
  { icon: 'upload',   label: 'Datenimport',        desc: 'dartunion.de-Importstatus.',      href: '/admin/import' },
  { icon: 'check',    label: 'Sicherheit',         desc: 'Datenschutz- & Security-Status.', href: '/admin/security' },
  { icon: 'settings', label: 'Einstellungen',      desc: 'Systemeinstellungen.',            href: '/admin/settings', super: true },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const superUser = isSuperAdmin(user);
  const cards = CARDS.filter(c => !c.super || superUser);

  return (
    <AdminGuard title="Dashboard" subtitle="Zentrale Verwaltung der MDU-Plattform.">
      {user && (
        <div style={{
          background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14,
          padding: '16px 20px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>
              Willkommen, {user.displayName}
            </div>
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
              Angemeldet als {ROLE_LABELS[user.role]}
            </div>
          </div>
          <Link href="/" style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-accent)', textDecoration: 'none' }}>
            Zur öffentlichen Seite →
          </Link>
        </div>
      )}

      {/* Offene Hinweise für Ligaleitung / Super Admin */}
      {canManageLeague(user) && <NotificationsPanel />}

      {/* System-Status (echte Zahlen aus Projektdaten) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
        <Stat label="Ligen / Playoffs" value={String(LEAGUES.length)} />
        <Stat label="Teams" value={String(TEAMS.length)} />
        <Stat label="Spieler" value={String(PLAYERS.length)} />
        <Stat label="Auth" value="aktiv" accent />
      </div>

      {/* Schnellzugriffe */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <Link key={c.href} href={c.href} className="mdu-card-hover" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: 18, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                  background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--th-accent)',
                }}>
                  <Icon name={c.icon as 'users'} size={18} stroke={2} />
                </div>
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>{c.label}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', lineHeight: 1.5, margin: 0 }}>{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AdminGuard>
  );
}

function NotificationsPanel() {
  const [items, setItems] = useState<AdminNotification[] | null>(null);

  useEffect(() => {
    listAdminNotifications(true).then(setItems);
  }, []);

  async function dismiss(n: AdminNotification) {
    await markNotificationRead(n.id);
    setItems(prev => (prev ?? []).filter(x => x.id !== n.id));
  }

  if (items === null) return null;

  return (
    <div style={{
      background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14,
      padding: '16px 20px', marginBottom: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: items.length ? 12 : 0 }}>
        <Icon name="bell" size={16} stroke={2} style={{ color: 'var(--th-accent)' }} />
        <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>
          Offene Aufgaben
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, height: 22, padding: '0 6px',
          borderRadius: 11, background: items.length ? 'var(--th-accent)' : 'var(--th-line-8)', color: items.length ? '#fff' : 'var(--th-text-faint)',
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 12,
        }}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', margin: 0 }}>
          Keine offenen Hinweise.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 10,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>{n.title}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>{n.message}</div>
              </div>
              {n.related_entity_type === 'team_registration' && n.related_entity_id && (
                <Link href={`/admin/registrations/${n.related_entity_id}`}
                  style={{ flexShrink: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)', textDecoration: 'none' }}>
                  Ansehen →
                </Link>
              )}
              <button type="button" onClick={() => dismiss(n)} aria-label="Als erledigt markieren"
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-faint)', fontFamily: 'var(--font-manrope)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 26, color: accent ? 'var(--th-win)' : 'var(--th-text-strong)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginTop: 6 }}>{label}</div>
    </div>
  );
}
