'use client';

import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Icon } from '@/components/mdu/icon';
import { NotificationBadge } from '@/components/mdu/notification-badge';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLE_LABELS, hasMinRole, hasRole, canManageLeague, canManageUsers } from '@/lib/auth/roles';
import type { UserProfile } from '@/lib/auth/roles';
import { useCaptainMode } from '@/lib/auth/use-captain-mode';
import { getCurrentSeason, getCurrentCompetitionForTeam, findTeam } from '@/lib/data';
import { useAdminNotificationCounts, type AdminNotificationCounts } from '@/lib/supabase/admin-counts';
import { useNotifications, type NotificationArea } from '@/lib/supabase/user-notifications';

interface Tile {
  icon: string;
  label: string;
  description: string;
  href?: string;
  /** false → Coming-Soon-Karte (deaktiviert) */
  ready: boolean;
  /** Welcher Admin-Zähler (offene Aufgaben) als Badge auf dieser Kachel erscheint. */
  badgeKey?: keyof AdminNotificationCounts;
  /** Welcher Notification-Bereich (ungelesene) als Badge erscheint. */
  notifKey?: NotificationArea;
}

/** Darf der Nutzer den Kapitäns-Modus nutzen? (Admin mit verknüpftem eigenem Team.) */
function canUseCaptainMode(user: UserProfile): boolean {
  return canManageLeague(user) && !!user.teamId;
}

/** Rollenbasierte Kacheln — zentral definiert, Rechte via roles.ts. */
function tilesFor(user: UserProfile, captainMode: boolean): Tile[] {
  const tiles: Tile[] = [];
  // Kapitäns-Modus nur wirksam für Admins mit eigenem Team. Dann: Admin-Kacheln
  // ausblenden, Kapitäns-Einstiege zeigen (echte Kapitäne sehen sie immer).
  const inCaptainMode = captainMode && canUseCaptainMode(user);
  const showCaptainTiles = hasRole(user, 'team_captain') || inCaptainMode;

  // Spieler aufwärts — eigenes Profil + eigene Statistik
  if (hasMinRole(user, 'player')) {
    tiles.push(
      { icon: 'user', label: 'Mein Profil', description: 'Profilbild hochladen, Spitzname und „Über mich" pflegen.', href: '/mein-profil', ready: true, notifKey: 'profile' },
    );
    if (user.playerId) {
      tiles.push(
        { icon: 'bar', label: 'Meine Statistik', description: 'Deine Einzelstatistik, Form und letzte Ergebnisse.', href: `/spieler/${user.playerId}`, ready: true },
      );
    }
  }

  // Mit einem Team verknüpft (Spieler ODER Kapitän) — Team & Liga ansehen
  if (user.teamId) {
    tiles.push(
      { icon: 'users', label: 'Mein Team', description: 'Übersicht deines Teams.', href: '/mein-team', ready: true, notifKey: 'team' },
    );
    const leagueId = getCurrentCompetitionForTeam(user.teamId, getCurrentSeason().id)?.leagueId;
    if (leagueId) {
      tiles.push(
        { icon: 'trophy', label: 'Meine Liga', description: 'Direkt zu deiner Liga – Tabelle und Spiele.', href: `/ligen/${leagueId}`, ready: true },
      );
    }
  }

  // Teamkapitän (oder Admin im Kapitäns-Modus) — Team-Verwaltung
  if (showCaptainTiles) {
    tiles.push(
      { icon: 'calendar', label: 'Mannschaft anmelden', description: 'Team zur neuen Saison anmelden.', href: '/mein-bereich/mannschaft-anmelden', ready: true },
      { icon: 'file',     label: 'Meine Anmeldungen',   description: 'Status deiner Anmeldungen.', href: '/mein-bereich/anmeldungen', ready: true, notifKey: 'anmeldungen' },
      { icon: 'edit',     label: 'Spielbericht erfassen', description: 'Neuen Spielberichtsbogen online ausfüllen.', href: '/mein-bereich/spielberichte', ready: true },
      { icon: 'file',     label: 'Spielberichte ansehen/bearbeiten', description: 'Übersicht eigener Spielberichte.', href: '/mein-bereich/spielberichte/uebersicht', ready: true, notifKey: 'spielberichte' },
    );
  }

  // Ligaleitung / Vorstand aufwärts — Verwaltung (im Kapitäns-Modus ausgeblendet)
  if (canManageLeague(user) && !inCaptainMode) {
    tiles.push(
      { icon: 'check',  label: 'Teams freigeben',         description: 'Teams für die Saison verwalten.', href: '/admin/teams', ready: true },
      { icon: 'users',  label: 'Benutzer verwalten',      description: 'Konten und Zuordnungen prüfen.', href: '/admin/users', ready: true, badgeKey: 'users' },
      { icon: 'list',   label: 'Offene Saisonanmeldungen', description: 'Mannschaftsanmeldungen prüfen und freigeben.', href: '/admin/registrations', ready: true, badgeKey: 'registrations' },
      { icon: 'trophy', label: 'Saison-Teams',            description: 'Freigegebene Mannschaften je Saison.', href: '/admin/season-teams', ready: true },
      { icon: 'file',   label: 'Spielberichte (Übersicht)', description: 'Alle Spielberichte einsehen.', href: '/admin/spielberichte', ready: true },
      { icon: 'user',   label: 'Nachmeldungen',            description: 'Spieler-Nachmeldungen prüfen.', href: '/admin/nachmeldungen', ready: true, badgeKey: 'nominations' },
      { icon: 'bell',   label: 'News pflegen',            description: 'Aktuelles verwalten.', href: '/admin/news', ready: true },
    );
  }

  // Super Admin — exklusiv (im Kapitäns-Modus ausgeblendet)
  if (canManageUsers(user) && !inCaptainMode) {
    tiles.push(
      { icon: 'edit',     label: 'Rollenverwaltung',    description: 'Rollen vergeben (in der Benutzerverwaltung).', href: '/admin/users', ready: true },
      { icon: 'settings', label: 'Systemeinstellungen', description: 'Plattform-Einstellungen (folgt).', ready: false },
    );
  }

  return tiles;
}

export default function MeinBereichPage() {
  const { user, loading, signOut } = useAuth();
  const { counts } = useAdminNotificationCounts();
  const { byArea } = useNotifications();
  const [captainMode, setCaptainMode] = useCaptainMode();

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

            {/* Kapitäns-Modus — nur für Ligaleitung/Super-Admin mit eigenem Team */}
            {canUseCaptainMode(user) && (
              <div style={{
                background: captainMode ? 'var(--th-accent-a07)' : 'var(--th-bg-card)',
                border: `1px solid ${captainMode ? 'var(--th-accent-a25)' : 'var(--th-line-6)'}`,
                borderRadius: 12, padding: '12px 16px', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
              }}>
                <Icon name="users" size={18} stroke={2} style={{ color: 'var(--th-accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>
                    {captainMode
                      ? `Kapitäns-Modus aktiv${user.teamId ? ` · ${findTeam(user.teamId)?.name ?? user.teamId}` : ''}`
                      : 'Admin-Modus'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2, lineHeight: 1.5 }}>
                    {captainMode
                      ? 'Du siehst aktuell nur die Kapitäns-Funktionen deines Teams. Die Admin-Funktionen sind ausgeblendet.'
                      : 'In den Kapitäns-Modus wechseln, um nur die Funktionen deines eigenen Teams zu sehen (Admin-Funktionen ausgeblendet).'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCaptainMode(!captainMode)}
                  aria-pressed={captainMode}
                  style={{
                    padding: '9px 18px', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
                    background: captainMode ? 'transparent' : 'var(--th-accent)',
                    color: captainMode ? 'var(--th-accent)' : '#fff',
                    border: `1.5px solid ${captainMode ? 'var(--th-accent)' : 'var(--th-accent-hover)'}`,
                    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13,
                  }}
                >
                  {captainMode ? 'In den Admin-Modus wechseln' : 'In den Kapitäns-Modus wechseln'}
                </button>
              </div>
            )}

            {/* Hinweise: erkanntes Spielerprofil / Teamkapitän-Wunsch */}
            {(() => {
              const hints: string[] = [];
              if (user.matchedPlayerId && !user.playerId) {
                hints.push('Wir haben wahrscheinlich dein Spielerprofil erkannt. Die Verknüpfung wird noch von der Ligaleitung geprüft.');
              }
              if (user.registrationIntent === 'team_captain' && user.role === 'player') {
                hints.push('Deine Teamkapitän-Anfrage wartet auf Freigabe durch die Ligaleitung.');
              }
              return hints.length === 0 ? null : (
                <div style={{
                  background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', borderRadius: 12,
                  padding: '14px 16px', marginBottom: 18,
                  fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', lineHeight: 1.6,
                }}>
                  {hints.map(h => <div key={h}>{h}</div>)}
                </div>
              );
            })()}

            {/* Rollen-Kacheln */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12,
            }}>
              {tilesFor(user, captainMode).map(tile => {
                const badgeCount = tile.badgeKey ? counts[tile.badgeKey] : tile.notifKey ? byArea[tile.notifKey] : 0;
                const inner = (
                  <div style={{
                    background: 'var(--th-bg-card)',
                    border: '1px solid var(--th-line-6)',
                    borderRadius: 12, padding: '18px 18px', height: '100%',
                    display: 'flex', flexDirection: 'column', gap: 10,
                    opacity: tile.ready ? 1 : 0.55,
                    position: 'relative',
                  }}>
                    <NotificationBadge
                      count={badgeCount}
                      absolute
                      ringColor="var(--th-bg-page)"
                      title={`${badgeCount} offene Aufgabe${badgeCount === 1 ? '' : 'n'}: ${tile.label}`}
                    />
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
