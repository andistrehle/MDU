'use client';

// ============================================================
// Admin — Spieler-Nachmeldungen prüfen (bestätigen / ablehnen)
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageLeague } from '@/lib/auth/roles';
import {
  listAllNominations, reviewNomination, updateNominationLicense, NOMINATION_STATUS_LABELS, LAST_LEAGUE_LABELS,
  type PlayerNomination, type NominationStatus,
} from '@/lib/supabase/nominations';

const STATUSES: NominationStatus[] = ['pending', 'approved', 'rejected'];

export default function AdminNachmeldungenPage() {
  const { user } = useAuth();
  const canReview = canManageLeague(user);
  const [rows, setRows] = useState<PlayerNomination[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [licenseEditId, setLicenseEditId] = useState<string | null>(null);
  const [licenseVal, setLicenseVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (canReview) listAllNominations().then(setRows); }, [canReview]);

  const filtered = useMemo(() => (rows ?? []).filter(r => !statusFilter || r.status === statusFilter), [rows, statusFilter]);

  async function approve(id: string) {
    // Freigabe erzeugt eine vorläufige Passnummer + übernimmt den Spieler in den
    // Kader → vor dieser folgenreichen Aktion rückfragen (REV-035).
    const nom = (rows ?? []).find(n => n.id === id);
    const who = nom ? `${nom.first_name} ${nom.last_name}`.trim() : 'diesen Spieler';
    if (!window.confirm(`„${who}" freigeben?\n\nEs wird eine vorläufige Passnummer erzeugt und der Spieler in den Kader übernommen.`)) return;
    setBusy(true); setMsg(null);
    const { error } = await reviewNomination(id, 'approved');
    setBusy(false);
    if (error) { setMsg(error); return; }
    setRows(await listAllNominations());
  }
  async function reject(id: string) {
    if (!note.trim()) { setMsg('Bitte eine Begründung für die Ablehnung eingeben.'); return; }
    setBusy(true); setMsg(null);
    const { error } = await reviewNomination(id, 'rejected', note.trim());
    setBusy(false);
    if (error) { setMsg(error); return; }
    setRejectId(null); setNote('');
    setRows(await listAllNominations());
  }
  async function saveLicense(id: string) {
    setBusy(true); setMsg(null);
    const { error } = await updateNominationLicense(id, licenseVal);
    setBusy(false);
    if (error) { setMsg(error); return; }
    setLicenseEditId(null);
    setRows(await listAllNominations());
  }

  return (
    <AdminGuard title="Spieler-Nachmeldungen" subtitle="Von Teamkapitänen nachgemeldete Spieler prüfen.">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={ctl}>
          <option value="">Alle Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{NOMINATION_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {msg && <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A', marginBottom: 14, maxWidth: 620 }}>{msg}</div>}

      {rows === null ? <p style={muted}>Lade …</p>
        : filtered.length === 0 ? (
          <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, ...muted }}>
            Keine Nachmeldungen für diesen Filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>{r.first_name} {r.last_name}</div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                      {r.team_name} · Letzte Liga: {r.last_league ? LAST_LEAGUE_LABELS[r.last_league] : 'Keine Angabe'} · {new Date(r.created_at).toLocaleDateString('de-DE')}
                      {r.status === 'rejected' && r.review_note ? ` · Begründung: ${r.review_note}` : ''}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: r.status === 'approved' ? 'var(--th-win)' : r.status === 'rejected' ? 'var(--th-loss)' : 'var(--th-accent)' }}>{NOMINATION_STATUS_LABELS[r.status]}</span>
                </div>

                {r.status === 'pending' && (
                  <div style={{ marginTop: 10 }}>
                    {rejectId === r.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Begründung für die Ablehnung (Pflicht)" style={inp} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => reject(r.id)} disabled={busy} style={btnRed}>Ablehnung absenden</button>
                          <button onClick={() => { setRejectId(null); setNote(''); setMsg(null); }} disabled={busy} style={ghost}>Abbrechen</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => approve(r.id)} disabled={busy} style={btnGreen}>Bestätigen</button>
                        <button onClick={() => { setRejectId(r.id); setNote(''); setMsg(null); }} disabled={busy} style={btnRed}>Ablehnen</button>
                      </div>
                    )}
                  </div>
                )}

                {r.status === 'approved' && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>Passnummer:</span>
                    {licenseEditId === r.id ? (
                      <>
                        <input value={licenseVal} onChange={e => setLicenseVal(e.target.value)} style={{ ...ctl, padding: '7px 10px', fontSize: 13, fontFamily: 'var(--font-jetbrains-mono)', width: 150 }} />
                        <button onClick={() => saveLicense(r.id)} disabled={busy} style={btnGreen}>Speichern</button>
                        <button onClick={() => { setLicenseEditId(null); setMsg(null); }} disabled={busy} style={ghost}>Abbrechen</button>
                      </>
                    ) : (
                      <>
                        <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.license_number ?? '—'}</span>
                        {r.license_provisional && r.license_number && (
                          <span title="Automatisch generiert – offizielle Nummer der dartunion später eintragen." style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--th-accent)', border: '1px solid var(--th-accent-a25)', borderRadius: 4, padding: '2px 6px' }}>vorläufig</span>
                        )}
                        <button onClick={() => { setLicenseEditId(r.id); setLicenseVal(r.license_number ?? ''); setMsg(null); }} disabled={busy} style={{ ...ghost, padding: '6px 12px' }}>Nummer ändern</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </AdminGuard>
  );
}

const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' };
const ctl: React.CSSProperties = { padding: '10px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' };
const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none', resize: 'vertical' };
const btnGreen: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, cursor: 'pointer', background: '#1E9E5A', color: '#fff', border: '1px solid #1E9E5A', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
const btnRed: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-loss)', border: '1px solid var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
const ghost: React.CSSProperties = { padding: '9px 18px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-muted)', border: '1px solid var(--th-line-10)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
