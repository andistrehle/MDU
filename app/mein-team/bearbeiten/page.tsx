'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canEditTeam } from '@/lib/auth/roles';
import { findTeam } from '@/lib/data';
import { loadTeamProfile, saveTeamProfile, type TeamProfileExtras } from '@/lib/supabase/profiles';
import { getDbTeamName } from '@/lib/supabase/season-teams';
import { NachmeldenButton } from '@/components/mdu/nachmelden-button';
import { ImageUpload } from '@/components/mdu/image-upload';

export default function TeamBearbeitenPage() {
  return <Suspense fallback={<MemberShell title="Team bearbeiten"><Muted>Lade …</Muted></MemberShell>}><TeamBearbeiten /></Suspense>;
}

function TeamBearbeiten() {
  const { user, loading } = useAuth();
  const params = useSearchParams();
  // Admins (league_admin+) dürfen per ?team=<id> jedes Team bearbeiten; sonst
  // das eigene. canEditTeam lässt für Kapitäne nur das eigene Team zu.
  const paramTeam = params.get('team');
  const teamId = (paramTeam && canEditTeam(user, paramTeam)) ? paramTeam : (user?.teamId ?? null);
  const isForeign = !!paramTeam && paramTeam !== user?.teamId;
  const allowed = !!teamId && canEditTeam(user, teamId);
  const staticTeam = teamId ? findTeam(teamId) : undefined;

  const [extras, setExtras] = useState<TeamProfileExtras | null>(null);
  const [dbTeamName, setDbTeamName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const team: { name: string; logoUrl: string | null } | undefined = staticTeam
    ? { name: staticTeam.name, logoUrl: staticTeam.logoUrl ?? null }
    : (dbTeamName ? { name: dbTeamName, logoUrl: null } : undefined);

  useEffect(() => {
    if (allowed && teamId) loadTeamProfile(teamId).then(setExtras);
  }, [allowed, teamId]);
  useEffect(() => {
    if (teamId && !staticTeam) getDbTeamName(teamId).then(t => setDbTeamName(t?.name ?? null));
    else setDbTeamName(null);
  }, [teamId, staticTeam]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId || !extras) return;
    setBusy(true);
    setMsg(null);
    const { error } = await saveTeamProfile(teamId, extras);
    setBusy(false);
    setMsg(error ? { kind: 'err', text: error } : { kind: 'ok', text: 'Gespeichert.' });
  }

  function set<K extends keyof TeamProfileExtras>(key: K, value: string) {
    setExtras(prev => prev ? { ...prev, [key]: value || null } : prev);
  }

  return (
    <MemberShell title="Team bearbeiten">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur für Teamkapitäne.{' '}<LoginLink /></Notice>
        : !teamId ? <Notice title="Kein Team verknüpft">Deinem Konto ist noch kein Team zugeordnet.</Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Du kannst nur dein eigenes Team bearbeiten.</Notice>
        : !extras ? <Muted>Teamdaten werden geladen …</Muted>
        : (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 620 }}>
            {isForeign && (
              <div role="status" style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.35)', color: 'var(--th-text-body)' }}>
                Admin-Modus: Du bearbeitest ein fremdes Team-Profil (<strong>{team?.name ?? teamId}</strong>).
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                Team: <strong style={{ color: 'var(--th-text-strong)' }}>{team?.name ?? teamId}</strong>
                <span style={{ color: 'var(--th-text-faint)' }}> · der Teamname wird zentral verwaltet</span>
              </div>
              {!isForeign && <NachmeldenButton teamId={teamId} teamName={team?.name ?? teamId} />}
            </div>

            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{
                padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13,
                background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)',
                border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`,
                color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)',
              }}>{msg.text}</div>
            )}

            <Section title="Kurzname">
              <Field label="Kurzname (Kürzel/Badge)">
                <input value={extras.shortName ?? ''} onChange={e => set('shortName', e.target.value.toUpperCase())}
                  maxLength={4} placeholder="z. B. FDM" style={{ ...inputStyle, maxWidth: 160, letterSpacing: '0.08em' }} />
              </Field>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 6, lineHeight: 1.45 }}>
                Kurzes Kürzel (2–4 Zeichen), das z. B. in Tabellen als Badge genutzt wird. Leer lassen, um es
                automatisch aus dem Teamnamen ableiten zu lassen (z. B. „Funny Darters Munich" → FDM).
              </p>
            </Section>

            <Section title="Beschreibung">
              <Field label="Kurzbeschreibung">
                <textarea value={extras.description ?? ''} onChange={e => set('description', e.target.value)}
                  rows={3} placeholder="Ein paar Worte über euer Team …" style={{ ...inputStyle, resize: 'vertical' }} />
              </Field>
            </Section>

            <Section title="Bilder">
              <Field label="Teamlogo">
                {teamId && (
                  <ImageUpload
                    value={extras.logoUrl ?? team?.logoUrl ?? null}
                    onChange={url => setExtras(prev => prev ? { ...prev, logoUrl: url } : prev)}
                    folder={`teams/${teamId}`}
                    fileBase="logo"
                    maxDim={400}
                    shape="square"
                    removable={!!extras.logoUrl}
                  />
                )}
              </Field>
              <Field label="Mannschaftsbild">
                {teamId && (
                  <ImageUpload
                    value={extras.teamImageUrl}
                    onChange={url => setExtras(prev => prev ? { ...prev, teamImageUrl: url } : prev)}
                    folder={`teams/${teamId}`}
                    fileBase="photo"
                    maxDim={1000}
                    shape="square"
                  />
                )}
              </Field>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: 0 }}>
                Bilder werden beim Hochladen automatisch verkleinert. Mannschaftsbilder bitte nur mit Zustimmung
                aller abgebildeten Personen. Vergiss nicht, anschließend zu speichern.
              </p>
            </Section>

            <Section title="Social Media">
              <Field label="Instagram"><input value={extras.instagramUrl ?? ''} onChange={e => set('instagramUrl', e.target.value)} placeholder="https://instagram.com/…" style={inputStyle} /></Field>
              <Field label="Facebook"><input value={extras.facebookUrl ?? ''} onChange={e => set('facebookUrl', e.target.value)} placeholder="https://facebook.com/…" style={inputStyle} /></Field>
              <Field label="Website"><input value={extras.websiteUrl ?? ''} onChange={e => set('websiteUrl', e.target.value)} placeholder="https://…" style={inputStyle} /></Field>
            </Section>

            <button type="submit" disabled={busy} style={{
              alignSelf: 'flex-start', padding: '12px 28px', borderRadius: 8, cursor: busy ? 'wait' : 'pointer',
              background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em',
              textTransform: 'uppercase', opacity: busy ? 0.7 : 1,
            }}>{busy ? 'Speichern …' : 'Speichern'}</button>
          </form>
        )}
    </MemberShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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
