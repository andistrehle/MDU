'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DesktopHeader } from '@/components/mdu/desktop-header';
import { Icon } from '@/components/mdu/icon';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLE_LABELS } from '@/lib/auth/roles';

export default function MeinProfilPage() {
  const { user, loading } = useAuth();
  // TODO Supabase: Spitzname in der profiles-Tabelle persistieren.
  const [nickname, setNickname] = useState('');
  const [saved, setSaved] = useState(false);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{ background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh' }}>
      <DesktopHeader activeHref="/mein-bereich" />

      <div className="mdu-section-pad" style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20,
          fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)',
        }}>
          <Link href="/mein-bereich" style={{ color: 'var(--th-text-muted)', textDecoration: 'none' }}>Mein Bereich</Link>
          <Icon name="chevron" size={11} />
          <span style={{ color: 'var(--th-text-strong)' }}>Mein Profil</span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 36,
          letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--th-text-strong)',
          margin: '0 0 24px', paddingBottom: 12, borderBottom: '3px solid var(--th-accent)', display: 'inline-block',
        }}>
          Mein Profil
        </h1>

        {loading ? (
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
        ) : !user ? (
          <div style={{
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
            borderRadius: 14, padding: '28px 24px',
          }}>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', margin: '0 0 16px' }}>
              Bitte einloggen, um dein Profil zu sehen.
            </p>
            <Link href="/login" style={{ color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Zur Anmeldung →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Basisdaten */}
            <div style={{
              background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
              borderRadius: 14, padding: '22px 24px',
            }}>
              <div style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
                letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 14,
              }}>
                Basisdaten
              </div>
              {[
                { k: 'Name',   v: user.displayName },
                { k: 'E-Mail', v: user.email },
                { k: 'Rolle',  v: ROLE_LABELS[user.role] },
                { k: 'Spielerprofil', v: user.playerId ?? 'Noch nicht verknüpft' },
                { k: 'Team',          v: user.teamId ?? 'Noch nicht verknüpft' },
              ].map(row => (
                <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: 'var(--th-text-muted)', fontSize: 13, fontFamily: 'var(--font-manrope)' }}>{row.k}</span>
                  <span style={{ color: 'var(--th-text-strong)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-manrope)' }}>{row.v}</span>
                </div>
              ))}
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', lineHeight: 1.55, margin: '12px 0 0' }}>
                Die Verknüpfung mit deinem Spielerprofil und Team erfolgt durch die Ligaleitung.
              </p>
            </div>

            {/* Spitzname */}
            <form
              onSubmit={onSave}
              style={{
                background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
                borderRadius: 14, padding: '22px 24px',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11,
                letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 14,
              }}>
                Spitzname
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="z. B. „The Machine“"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  style={{
                    flex: 1, minWidth: 200, padding: '11px 14px',
                    background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
                    borderRadius: 8, color: 'var(--th-text-strong)',
                    fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '11px 20px', borderRadius: 8, cursor: 'pointer',
                    background: 'var(--th-accent)', color: '#fff', border: 'none',
                    fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  Speichern
                </button>
              </div>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: saved ? 'var(--th-win)' : 'var(--th-text-faint)', margin: '10px 0 0' }}>
                {saved
                  ? 'Gespeichert (Hinweis: dauerhafte Speicherung folgt mit der Backend-Anbindung).'
                  : 'Wird mit der Backend-Anbindung dauerhaft gespeichert.'}
              </p>
            </form>

            {/* Profilbild — Coming soon */}
            <div style={{
              background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
              borderRadius: 14, padding: '22px 24px', opacity: 0.55,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name="image" size={18} stroke={2} style={{ color: 'var(--th-text-faint2)' }} />
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>
                  Profilbild ändern
                </span>
                <span style={{
                  marginLeft: 'auto', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9,
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)',
                  border: '1px solid var(--th-line-8)', borderRadius: 4, padding: '2px 6px',
                }}>
                  Folgt
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
