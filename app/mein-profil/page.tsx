'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { ROLE_LABELS, canEditPlayerProfile } from '@/lib/auth/roles';
import { findTeam, findPlayer, getPlayerDisplayName } from '@/lib/data';
import { loadPlayerProfile, savePlayerProfile, type PlayerProfileExtras } from '@/lib/supabase/profiles';
import { ImageUpload } from '@/components/mdu/image-upload';

export default function MeinProfilPage() {
  const { user, loading } = useAuth();
  const playerId = user?.playerId ?? null;
  const player = playerId ? findPlayer(playerId) : undefined;
  const team = user?.teamId ? findTeam(user.teamId) : undefined;
  const canEdit = !!playerId && canEditPlayerProfile(user, playerId);

  const [extras, setExtras] = useState<PlayerProfileExtras | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (canEdit && playerId) loadPlayerProfile(playerId).then(setExtras);
  }, [canEdit, playerId]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!playerId || !extras) return;
    setBusy(true);
    setMsg(null);
    const { error } = await savePlayerProfile(playerId, extras);
    setBusy(false);
    setMsg(error ? { kind: 'err', text: error } : { kind: 'ok', text: 'Gespeichert.' });
  }

  function set<K extends keyof PlayerProfileExtras>(key: K, value: string) {
    setExtras(prev => prev ? { ...prev, [key]: value || null } : prev);
  }

  function setBool(key: 'showNickname' | 'showPhoto', value: boolean) {
    setExtras(prev => prev ? { ...prev, [key]: value } : prev);
  }

  return (
    <MemberShell title="Mein Profil">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Dein Profil ist nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
            {/* Basisdaten */}
            <Card title="Basisdaten">
              {[
                { k: 'Name',          v: user.displayName },
                { k: 'E-Mail',        v: user.email },
                { k: 'Rolle',         v: ROLE_LABELS[user.role] },
                { k: 'Spielerprofil', v: player ? getPlayerDisplayName(player) : 'Noch nicht verknüpft' },
                { k: 'Team',          v: team?.name ?? 'Noch nicht verknüpft' },
              ].map(row => (
                <div key={row.k} style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 10, marginBottom: 10 }}>
                  <span style={{ color: 'var(--th-text-muted)', fontSize: 13, fontFamily: 'var(--font-manrope)' }}>{row.k}</span>
                  <span style={{ color: 'var(--th-text-strong)', fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-manrope)' }}>{row.v}</span>
                </div>
              ))}
              {player && (
                <Link href={`/spieler/${player.id}`} style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>
                  Öffentliches Spielerprofil ansehen →
                </Link>
              )}
            </Card>

            {!canEdit ? (
              <Notice title="Konto noch nicht mit Spieler verknüpft">
                Sobald die Ligaleitung dein Konto mit deinem Spielerprofil verknüpft, kannst du
                hier Spitzname und „Über mich“ pflegen.
              </Notice>
            ) : !extras ? (
              <Muted>Profildaten werden geladen …</Muted>
            ) : (
              <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Card title="Mein Profil bearbeiten">
                  {msg && (
                    <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{
                      padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontFamily: 'var(--font-manrope)', fontSize: 13,
                      background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)',
                      border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`,
                      color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)',
                    }}>{msg.text}</div>
                  )}

                  <Field label="Spitzname">
                    <input value={extras.nickname ?? ''} onChange={e => set('nickname', e.target.value)}
                      placeholder={'z. B. „The Machine"'} style={inputStyle} />
                    <ConsentCheck
                      checked={extras.showNickname}
                      onChange={v => setBool('showNickname', v)}
                      label="Spitzname öffentlich auf meinem Spielerprofil anzeigen"
                    />
                  </Field>
                  <Field label="Über mich">
                    <textarea value={extras.aboutMe ?? ''} onChange={e => set('aboutMe', e.target.value)}
                      rows={4} placeholder="Erzähl etwas über dich und dein Dart-Spiel …" style={{ ...inputStyle, resize: 'vertical' }} />
                  </Field>
                  <Field label="Profilbild">
                    {playerId && (
                      <ImageUpload
                        value={extras.profileImageUrl ?? player?.photoUrl ?? null}
                        onChange={url => setExtras(prev => prev ? { ...prev, profileImageUrl: url } : prev)}
                        folder={`players/${playerId}`}
                        fileBase="avatar"
                        maxDim={512}
                        shape="circle"
                        removable={!!extras.profileImageUrl}
                      />
                    )}
                    <ConsentCheck
                      checked={extras.showPhoto}
                      onChange={v => setBool('showPhoto', v)}
                      label="Profilbild öffentlich auf meinem Spielerprofil anzeigen"
                    />
                  </Field>
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: '2px 0 0', lineHeight: 1.55 }}>
                    Bitte nur Bilder verwenden, für die du die nötigen Rechte hast. Das Bild wird beim Hochladen
                    automatisch verkleinert. „Über mich“ und deine Eingaben kannst du jederzeit hier ändern oder
                    leeren. <strong>Dein Profilbild wird standardmäßig auf deinem öffentlichen Spielerprofil
                    angezeigt</strong> — entferne das Häkchen, wenn du das nicht möchtest. Der <strong>Spitzname</strong>
                    wird nur angezeigt, wenn du es aktiv erlaubst. Vergiss nicht, anschließend zu speichern.
                  </p>

                  <button type="submit" disabled={busy} style={{
                    marginTop: 16, alignSelf: 'flex-start', padding: '12px 28px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
                    background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
                    fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
                    textTransform: 'uppercase', opacity: busy ? 0.7 : 1,
                  }}>{busy ? 'Speichern …' : 'Speichern'}</button>
                </Card>
              </form>
            )}
          </div>
        )}
    </MemberShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}

function ConsentCheck({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 1, width: 15, height: 15, accentColor: 'var(--th-accent)', flexShrink: 0, cursor: 'pointer' }} />
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', lineHeight: 1.45 }}>{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-text-body)', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)',
  border: '1px solid var(--th-line-10)', borderRadius: 8,
  color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
};
