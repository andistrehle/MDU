'use client';

import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Icon } from '@/components/mdu/icon';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLE_LABELS, hasMinRole, hasRole, canManageLeague, canManageUsers } from '@/lib/auth/roles';
import type { UserProfile } from '@/lib/auth/roles';

interface Tile {
  icon: string;
  label: string;
  description: string;
  href?: string;
  /** false → Coming-Soon-Karte (deaktiviert) */
  ready: boolean;
}

/** Rollenbasierte Kacheln — zentral definiert, Rechte via roles.ts. */
function tilesFor(user: UserProfile): Tile[] {
  const tiles: Tile[] = [];

  // Spieler aufwärts
  if (hasMinRole(user, 'player')) {
    tiles.push(
      { icon: 'user',   label: 'Mein Profil',        description: 'Basisdaten prüfen und Spitznamen pflegen.', href: '/mein-profil', ready: true },
      { icon: 'image', label: 'Profilbild ändern',  description: 'Eigenes Spielerfoto hochladen.', ready: false },
    );
  }

  // Teamkapitän
  if (hasRole(user, 'team_captain')) {
    tiles.push(
      { icon: 'users',    label: 'Mein Team',             description: 'Teamdaten und Social Media pflegen.', ready: false },
      { icon: 'list',     label: 'Spieler verwalten',     description: 'Kader des eigenen Teams verwalten.', ready: false },
      { icon: 'image',   label: 'Mannschaftsbild',       description: 'Teamfoto hochladen.', ready: false },
      { icon: 'file',     label: 'Spielbericht hochladen', description: 'Ergebnisse und Berichte erfassen.', ready: false },
      { icon: 'calendar', label: 'Mannschaft anmelden',   description: 'Team zur neuen Saison anmelden.', ready: false },
    );
  }

  // Ligaleitung / Vorstand aufwärts
  if (canManageLeague(user)) {
    tiles.push(
      { icon: 'list',     label: 'Anmeldungen verwalten',   description: 'Mannschaftsanmeldungen prüfen.', ready: false },
      { icon: 'check',    label: 'Teams freigeben',         description: 'Neue Teams für die Saison freigeben.', ready: false },
      { icon: 'file',     label: 'Spielberichte freigeben', description: 'Eingereichte Berichte prüfen.', ready: false },
      { icon: 'bell',     label: 'News pflegen',            description: 'Aktuelles auf der Startseite verwalten.', ready: false },
      { icon: 'globe',    label: 'Inhalte moderieren',      description: 'Inhalte prüfen und moderieren.', ready: false },
    );
  }

  // Super Admin
  if (canManageUsers(user)) {
    tiles.push(
      { icon: 'users',    label: 'Benutzerverwaltung',    description: 'Konten verwalten und verknüpfen.', href: '/admin', ready: true },
      { icon: 'edit',     label: 'Rollenverwaltung',      description: 'Rollen und Rechte vergeben.', ready: false },
      { icon: 'settings', label: 'Systemeinstellungen',   description: 'Plattform-Einstellungen verwalten.', ready: false },
    );
  }

  return tiles;
}

export default function MeinBereichPage() {
  const { user, loading, signOut } = useAuth();

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mein-bereich" />

      <div className="mdu-section-pad" style={{ maxWidth: 880, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.2em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Münchner Dart Union
          </div>
          <h1 style={{
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 40,
            letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
            margin: 0, paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
          }}>
            Mein Bereich
          </h1>
        </div>

        {loading ? (
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
            Lade …
          </p>
        ) : !user ? (
          /* Gast — Hinweis: bitte einloggen */
          <div style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 14, padding: '32px 24px', maxWidth: 480,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Icon name="user" size={18} stroke={2} style={{ color: 'var(--th-text-muted)' }} />
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 15, color: 'var(--th-text-strong)' }}>
                Bitte einloggen
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
              Der Mitgliederbereich ist nur mit MDU-Konto verfügbar. Alle Ligen, Tabellen
              und Ergebnisse bleiben weiterhin öffentlich.
            </p>
            <Link href="/login" style={{
              display: 'inline-block', padding: '12px 24px',
              background: 'var(--th-accent)', color: '#fff', borderRadius: 8,
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
            }}>
              Zur Anmeldung
            </Link>
          </div>
        ) : (
          <>
            {/* User-Karte */}
            <div style={{
              background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
              borderRadius: 14, padding: '18px 20px', marginBottom: 22,
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                background: 'var(--th-accent-a12)', border: '1px solid var(--th-accent-a25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 16, color: 'var(--th-accent)',
              }}>
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>
                  {user.displayName}
                </div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                  {user.email} · {ROLE_LABELS[user.role]}
                </div>
              </div>
              <button
                onClick={signOut}
                style={{
                  padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                  background: 'transparent', color: 'var(--th-accent)',
                  border: '1.5px solid var(--th-accent)',
                  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                }}
              >
                Logout
              </button>
            </div>

            {/* Rollen-Kacheln */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12,
            }}>
              {tilesFor(user).map(tile => {
                const inner = (
                  <div style={{
                    background: 'var(--th-bg-card)',
                    border: '1px solid var(--th-line-6)',
                    borderRadius: 12, padding: '18px 18px', height: '100%',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    opacity: tile.ready ? 1 : 0.55,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                        background: tile.ready ? 'var(--th-accent-a12)' : 'var(--th-line-4)',
                        border: tile.ready ? '1px solid var(--th-accent-a25)' : '1px solid var(--th-line-8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: tile.ready ? 'var(--th-accent)' : 'var(--th-text-faint2)',
                      }}>
                        <Icon name={tile.icon as 'user'} size={18} stroke={2} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>
                        {tile.label}
                      </span>
                      {!tile.ready && (
                        <span style={{
                          marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9,
                          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)',
                          border: '1px solid var(--th-line-8)', borderRadius: 4, padding: '2px 6px', flexShrink: 0,
                        }}>
                          Folgt
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', lineHeight: 1.5, margin: 0 }}>
                      {tile.description}
                    </p>
                  </div>
                );
                return tile.ready && tile.href ? (
                  <Link key={tile.label} href={tile.href} className="mdu-card-hover" style={{ textDecoration: 'none', display: 'block' }}>
                    {inner}
                  </Link>
                ) : (
                  <div key={tile.label} aria-disabled="true">{inner}</div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
