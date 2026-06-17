'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import {
  getRegistration, getRegistrationPlayers, reviewRegistration,
  REGISTRATION_STATUS_LABELS, type TeamRegistration, type RegistrationPlayer,
} from '@/lib/supabase/registrations';

export default function RegistrationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useAuth();
  const canReview = canApproveRegistrations(user);

  const [reg, setReg] = useState<TeamRegistration | null>(null);
  const [players, setPlayers] = useState<RegistrationPlayer[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!canReview || !id) return;
    (async () => {
      setReg(await getRegistration(id));
      setPlayers(await getRegistrationPlayers(id));
    })();
  }, [canReview, id]);

  async function act(status: 'in_review' | 'approved' | 'rejected' | 'changes_requested') {
    if ((status === 'rejected' || status === 'changes_requested') && !note.trim()) {
      setMsg('Bitte eine Begründung / Anmerkung eingeben.');
      return;
    }
    setBusy(true); setMsg(null);
    const { error } = await reviewRegistration(id, status, note.trim() || undefined);
    if (error) { setMsg(error); setBusy(false); return; }
    setReg(await getRegistration(id));
    setBusy(false);
    setNote('');
  }

  return (
    <AdminGuard title="Anmeldung prüfen" subtitle="Details und Freigabe-Workflow.">
      <Link href="/admin/registrations" style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>← Zur Übersicht</Link>

      {!canReview ? null : !reg ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)', marginTop: 16 }}>Lade …</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760, marginTop: 16 }}>
          {msg && <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{msg}</div>}

          {/* Kopf */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24, color: 'var(--th-text-strong)', textTransform: 'uppercase' }}>{reg.team_name}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                  {reg.is_new_team ? 'Neue Mannschaft' : 'Bestehende Mannschaft'} · Saison {reg.season_id}
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-accent)' }}>
                {REGISTRATION_STATUS_LABELS[reg.status]}
              </span>
            </div>
          </Card>

          <Card title="Teamdaten">
            <Row k="Kurzname" v={reg.short_name} />
            <Row k="Beschreibung" v={reg.description} />
            <Row k="Logo-URL" v={reg.logo_url} />
            <Row k="Mannschaftsbild-URL" v={reg.team_image_url} />
          </Card>

          <Card title="Spielstätte">
            <Row k="Name" v={reg.venue_name} />
            <Row k="Adresse" v={reg.venue_address} />
            <Row k="Zusatzinfo" v={reg.venue_info} />
          </Card>

          <Card title="Kontakt">
            <Row k="Ansprechpartner" v={reg.contact_name} />
            <Row k="E-Mail" v={reg.contact_email} />
            <Row k="Telefon" v={reg.contact_phone} />
          </Card>

          <Card title="Social Media">
            <Row k="Instagram" v={reg.instagram_url} />
            <Row k="Facebook" v={reg.facebook_url} />
            <Row k="Website" v={reg.website_url} />
          </Card>

          <Card title={`Kader (${players.length})`}>
            {players.length === 0 ? <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)' }}>Kein Kader angegeben.</span> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {players.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                    <span style={{ flex: 1 }}>{p.display_name}{p.license_number ? ` · ${p.license_number}` : ''}{p.is_existing_player ? '' : ' · neu'}</span>
                    {p.is_captain && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--th-gold)', textTransform: 'uppercase' }}>Kapitän</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {reg.notes && <Card title="Notizen"><span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>{reg.notes}</span></Card>}

          {/* Workflow-Aktionen */}
          <Card title="Freigabe-Workflow">
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Begründung / Anmerkung (Pflicht bei Ablehnung & Nachbesserung)"
              style={{ width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => act('in_review')} disabled={busy} style={btn('ghost')}>In Prüfung</button>
              <button onClick={() => act('changes_requested')} disabled={busy} style={btn('gold')}>Nachbesserung</button>
              <button onClick={() => act('rejected')} disabled={busy} style={btn('red')}>Ablehnen</button>
              <button onClick={() => act('approved')} disabled={busy} style={btn('green')}>Freigeben</button>
            </div>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 12, lineHeight: 1.55 }}>
              Hinweis: Nach Freigabe wird der Status gespeichert. Die automatische Übernahme in die
              offiziellen Team-/Saisondaten ist vorbereitet (applyApprovedTeamRegistration) und folgt
              in einem späteren Sprint.
            </p>
          </Card>
        </div>
      )}
    </AdminGuard>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px' }}>
      {title && <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>}
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 10, padding: '5px 0' }}>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>{k}</span>
      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: v ? 'var(--th-text-strong)' : 'var(--th-text-faint2)', wordBreak: 'break-word' }}>{v || '–'}</span>
    </div>
  );
}

function btn(kind: 'ghost' | 'gold' | 'red' | 'green'): React.CSSProperties {
  const base: React.CSSProperties = { padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, border: '1px solid' };
  if (kind === 'green') return { ...base, background: '#1E9E5A', color: '#fff', borderColor: '#1E9E5A' };
  if (kind === 'red')   return { ...base, background: 'transparent', color: 'var(--th-loss)', borderColor: 'var(--th-loss)' };
  if (kind === 'gold')  return { ...base, background: 'transparent', color: 'var(--th-gold)', borderColor: 'var(--th-gold)' };
  return { ...base, background: 'transparent', color: 'var(--th-text-muted)', borderColor: 'var(--th-line-10)' };
}
