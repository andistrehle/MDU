'use client';

// ============================================================
// Admin — Spielberichte prüfen & freigeben
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveMatchReports } from '@/lib/auth/roles';
import {
  listAllReports, getReportPlayers, getReportGames, reviewReport,
  GAME_SCHEDULE, REPORT_STATUS_LABELS,
  type MatchReport, type ReportPlayer, type ReportGame, type ReportStatus,
} from '@/lib/supabase/match-reports';

const STATUSES: ReportStatus[] = ['submitted', 'approved', 'rejected', 'draft'];

export default function AdminSpielberichtePage() {
  const { user } = useAuth();
  const canReview = canApproveMatchReports(user);
  const [rows, setRows] = useState<MatchReport[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('submitted');
  const [open, setOpen] = useState<MatchReport | null>(null);
  const [players, setPlayers] = useState<ReportPlayer[]>([]);
  const [games, setGames] = useState<ReportGame[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (canReview) listAllReports().then(setRows); }, [canReview]);

  const filtered = useMemo(
    () => (rows ?? []).filter(r => !statusFilter || r.status === statusFilter),
    [rows, statusFilter],
  );

  async function openReport(r: MatchReport) {
    setOpen(r); setNote(''); setMsg(null);
    setPlayers(await getReportPlayers(r.id));
    setGames(await getReportGames(r.id));
  }

  async function act(status: 'approved' | 'rejected') {
    if (!open) return;
    if (status === 'rejected' && !note.trim()) { setMsg('Bitte eine Begründung eingeben.'); return; }
    setBusy(true); setMsg(null);
    const { error } = await reviewReport(open.id, status, note.trim() || undefined);
    setBusy(false);
    if (error) { setMsg(error); return; }
    setRows(await listAllReports());
    setOpen(null);
  }

  const playerName = (side: 'home' | 'guest', slot: number | null) =>
    slot == null ? '?' : (players.find(p => p.side === side && p.slot === slot)?.name || `${side === 'home' ? 'H' : 'G'}${slot}`);

  return (
    <AdminGuard title="Spielberichte freigeben" subtitle="Von Teamkapitänen eingereichte Spielberichte prüfen.">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={ctl}>
          <option value="">Alle Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{REPORT_STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {rows === null ? <p style={muted}>Lade …</p>
        : filtered.length === 0 ? (
          <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, ...muted }}>
            Keine Spielberichte für diesen Filter.
          </div>
        ) : (
          <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 900 }}>
            {filtered.map((r, i) => (
              <button key={r.id} type="button" onClick={() => openReport(r)} className="mdu-row-hover"
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '13px 18px', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: i < filtered.length - 1 ? '1px solid var(--th-line-4)' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)' }}>
                    {r.home_team_name} <span style={{ color: 'var(--th-accent)' }}>{r.spiele_home}:{r.spiele_guest}</span> {r.guest_team_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                    {r.league_label}{r.matchday ? ` · Spieltag ${r.matchday}` : ''}{r.match_date ? ` · ${new Date(r.match_date).toLocaleDateString('de-DE')}` : ''}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: r.status === 'approved' ? 'var(--th-win)' : r.status === 'rejected' ? 'var(--th-loss)' : 'var(--th-accent)' }}>{REPORT_STATUS_LABELS[r.status]}</span>
              </button>
            ))}
          </div>
        )}

      {/* Detail-Modal */}
      {open && (
        <div onClick={() => setOpen(null)} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: '100%', maxWidth: 640, margin: '40px 0', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', borderRadius: 16, padding: '24px 26px', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <h2 style={{ flex: 1, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: 'var(--th-text-strong)', margin: 0, textTransform: 'uppercase' }}>
                {open.home_team_name} {open.spiele_home}:{open.spiele_guest} {open.guest_team_name}
              </h2>
              <button onClick={() => setOpen(null)} aria-label="Schließen" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-text-faint)', fontSize: 22 }}>×</button>
            </div>
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: '0 0 14px' }}>
              {open.league_label}{open.matchday ? ` · Spieltag ${open.matchday}` : ''}{open.match_date ? ` · ${new Date(open.match_date).toLocaleDateString('de-DE')}` : ''}{open.venue ? ` · ${open.venue}` : ''}
            </p>

            {msg && <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A', marginBottom: 12 }}>{msg}</div>}

            <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
              <Mini label="Spiele" v={`${open.spiele_home}:${open.spiele_guest}`} />
              <Mini label="Legs" v={`${open.legs_home}:${open.legs_guest}`} />
              <Mini label="Punkte" v={`${open.points_home}:${open.points_guest}`} />
            </div>

            {/* Aufstellung + Punkte */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {(['home', 'guest'] as const).map(side => (
                <div key={side}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 6 }}>{side === 'home' ? 'Heim' : 'Gast'}</div>
                  {players.filter(p => p.side === side).map(p => (
                    <div key={p.slot} style={{ display: 'flex', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', padding: '2px 0' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{side === 'home' ? 'H' : 'G'}{p.slot} {p.name}</span>
                      <span style={{ color: 'var(--th-accent)', fontWeight: 700 }}>{p.points} P</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Spiele */}
            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, color: 'var(--th-accent)', textTransform: 'uppercase', margin: '4px 0 8px' }}>Spiele</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
              {GAME_SCHEDULE.map(s => {
                const g = games.find(x => x.game_no === s.no);
                return (
                  <div key={s.no} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', padding: '3px 0', borderBottom: '1px solid var(--th-line-4)' }}>
                    <span style={{ width: 20, color: 'var(--th-text-faint)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11 }}>{s.no}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.type === 'double' ? (
                        <><strong style={{ color: 'var(--th-accent)' }}>Doppel</strong> {playerName('home', g?.home_slot ?? null)}/{playerName('home', g?.home_slot2 ?? null)} vs {playerName('guest', g?.guest_slot ?? null)}/{playerName('guest', g?.guest_slot2 ?? null)}</>
                      ) : (
                        <>{playerName('home', g?.home_slot ?? null)} vs {playerName('guest', g?.guest_slot ?? null)}</>
                      )}
                    </span>
                    <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-strong)' }}>{g && g.legs_home != null ? `${g.legs_home}:${g.legs_guest}` : '–'}</span>
                  </div>
                );
              })}
            </div>

            {open.protest && <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-gold)', marginBottom: 12 }}>⚠️ Protest: {open.protest_note || '—'}</p>}

            {/* Freigabe */}
            {open.status === 'submitted' ? (
              <>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Begründung (Pflicht bei Ablehnung)"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none', resize: 'vertical', marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => act('rejected')} disabled={busy} style={btnRed}>Ablehnen</button>
                  <button onClick={() => act('approved')} disabled={busy} style={btnGreen}>Freigeben</button>
                </div>
              </>
            ) : (
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                Status: {REPORT_STATUS_LABELS[open.status]}{open.review_note ? ` · ${open.review_note}` : ''}
              </p>
            )}
          </div>
        </div>
      )}
    </AdminGuard>
  );
}

function Mini({ label, v }: { label: string; v: string }) {
  return (
    <div style={{ background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-text-faint)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 20, color: 'var(--th-text-strong)' }}>{v}</div>
    </div>
  );
}

const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' };
const ctl: React.CSSProperties = { padding: '10px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' };
const btnGreen: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, cursor: 'pointer', background: '#1E9E5A', color: '#fff', border: '1px solid #1E9E5A', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
const btnRed: React.CSSProperties = { padding: '10px 18px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-loss)', border: '1px solid var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
