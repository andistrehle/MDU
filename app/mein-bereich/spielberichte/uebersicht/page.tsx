'use client';

// ============================================================
// Mein Bereich — Spielberichte-Übersicht (nur Liste, kein Bogen)
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canUploadMatchReport } from '@/lib/auth/roles';
import {
  listMyReports, confirmReport, requestReportChange,
  REPORT_STATUS_LABELS, type MatchReport,
} from '@/lib/supabase/match-reports';

export default function SpielberichteUebersichtPage() {
  const { user, loading } = useAuth();
  const allowed = canUploadMatchReport(user, user?.teamId ?? '')
    || user?.role === 'team_captain' || user?.role === 'league_admin' || user?.role === 'super_admin';

  const [rows, setRows] = useState<MatchReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { if (allowed) listMyReports().then(setRows); }, [allowed]);

  const myId = user?.id;
  const myTeamId = user?.teamId;
  // Alle Berichte, an denen mein Team beteiligt ist (Heim ODER Gast).
  const allReports = (rows ?? [])
    .filter(r => r.home_captain_user_id === myId || (myTeamId && r.guest_team_id === myTeamId))
    .sort((a, b) => (b.match_date ?? '').localeCompare(a.match_date ?? ''));
  const toReview = (rows ?? []).filter(r => r.guest_team_id === myTeamId && r.home_captain_user_id !== myId && r.status === 'submitted');
  const isOwner = (r: MatchReport) => r.home_captain_user_id === myId;

  async function onConfirm(id: string) {
    setBusy(true); await confirmReport(id); setRows(await listMyReports()); setBusy(false);
  }
  async function onRequestChange(id: string) {
    if (!reviewNote.trim()) { setMsg('Bitte beschreibe die gewünschte Änderung.'); return; }
    setBusy(true); await requestReportChange(id, reviewNote.trim());
    setReviewId(null); setReviewNote(''); setMsg(null);
    setRows(await listMyReports()); setBusy(false);
  }

  return (
    <MemberShell title="Spielberichte">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Spielberichte sind für Teamkapitäne und die Ligaleitung.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 820 }}>
            <Link href="/mein-bereich/spielberichte" style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 8, background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none', alignSelf: 'flex-start' }}>
              ＋ Neuer Spielbericht
            </Link>

            {msg && <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(212,0,0,0.10)', border: '1px solid rgba(212,0,0,0.35)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: '#E24B4A' }}>{msg}</div>}

            {/* Zu prüfen (als Gegner) */}
            {toReview.length > 0 && (
              <Card title={`Zu prüfen (Gegner) · ${toReview.length}`}>
                {toReview.map(r => (
                  <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--th-line-4)' }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>{r.home_team_name} {r.spiele_home}:{r.spiele_guest} {r.guest_team_name}</div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>{r.league_label}{r.match_date ? ` · ${new Date(r.match_date).toLocaleDateString('de-DE')}` : ''}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <Link href={`/mein-bereich/spielberichte?id=${r.id}`} style={{ ...btn, color: 'var(--th-accent)', borderColor: 'var(--th-accent)', textDecoration: 'none' }}>Ansehen</Link>
                      <button onClick={() => onConfirm(r.id)} disabled={busy} style={{ ...btn, color: 'var(--th-win)', borderColor: 'var(--th-win)' }}>Bestätigen</button>
                      <button onClick={() => { setReviewId(reviewId === r.id ? null : r.id); setReviewNote(''); }} disabled={busy} style={{ ...btn, color: 'var(--th-gold)', borderColor: 'var(--th-gold)' }}>Änderung anfordern</button>
                    </div>
                    {reviewId === r.id && (
                      <div style={{ marginTop: 8 }}>
                        <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={2} placeholder="Was stimmt nicht?" style={inp} />
                        <button onClick={() => onRequestChange(r.id)} disabled={busy} style={{ ...btn, marginTop: 6, background: 'var(--th-accent)', color: '#fff', borderColor: 'var(--th-accent-hover)' }}>Änderung absenden</button>
                      </div>
                    )}
                  </div>
                ))}
                <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: '6px 0 0' }}>Das Ergebnis ist bereits übernommen. Eine Änderungsanforderung informiert die Heimmannschaft.</p>
              </Card>
            )}

            {/* Übersicht: alle Berichte mit Beteiligung (Heim & Gast) */}
            <Card title="Alle Spielberichte">
              {rows === null ? <Muted>Lade …</Muted>
                : allReports.length === 0 ? <Muted>Noch keine Spielberichte vorhanden.</Muted>
                : (
                  <>
                    {/* Desktop: Tabelle */}
                    <table className="mdu-desktop-only" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ textAlign: 'left', color: 'var(--th-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          <th style={h}>Liga</th><th style={h}>Sptg.</th><th style={h}>Datum</th><th style={h}>Rolle</th><th style={h}>Heim</th><th style={h}>Gast</th><th style={h}>Erg.</th><th style={h}>Status</th><th style={h}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReports.map(r => (
                          <tr key={r.id} style={{ borderTop: '1px solid var(--th-line-4)' }}>
                            <td style={d}>{r.league_label ?? '–'}</td>
                            <td style={d}>{r.matchday ?? '–'}</td>
                            <td style={d}>{r.match_date ? new Date(r.match_date).toLocaleDateString('de-DE') : '–'}</td>
                            <td style={{ ...d, fontWeight: 700, color: isOwner(r) ? 'var(--th-accent)' : 'var(--th-text-muted)' }}>{isOwner(r) ? 'Heim' : 'Gast'}</td>
                            <td style={{ ...d, fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.home_team_name}</td>
                            <td style={d}>{r.guest_team_name}</td>
                            <td style={{ ...d, fontWeight: 700 }}>{r.spiele_home}:{r.spiele_guest}</td>
                            <td style={{ ...d, fontWeight: 700, color: r.status === 'confirmed' ? 'var(--th-win)' : r.status === 'changes_requested' ? 'var(--th-gold)' : 'var(--th-text-muted)' }}>{REPORT_STATUS_LABELS[r.status]}</td>
                            <td style={d}><Link href={`/mein-bereich/spielberichte?id=${r.id}`} style={{ fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>{isOwner(r) && r.status !== 'confirmed' ? 'Bearbeiten' : 'Ansehen'}</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile: kompakte Karten (kein horizontales Scrollen) */}
                    <div className="mdu-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {allReports.map(r => (
                        <Link key={r.id} href={`/mein-bereich/spielberichte?id=${r.id}`} style={{ textDecoration: 'none', border: '1px solid var(--th-line-6)', borderRadius: 10, padding: '10px 12px', display: 'block' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.home_team_name} <span style={{ color: 'var(--th-accent)' }}>{r.spiele_home}:{r.spiele_guest}</span> {r.guest_team_name}
                            </span>
                            <span style={{ flexShrink: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: r.status === 'confirmed' ? 'var(--th-win)' : r.status === 'changes_requested' ? 'var(--th-gold)' : 'var(--th-text-muted)' }}>{REPORT_STATUS_LABELS[r.status]}</span>
                          </div>
                          <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-muted)', marginTop: 3 }}>
                            {r.league_label}{r.matchday ? ` · Sptg ${r.matchday}` : ''}{r.match_date ? ` · ${new Date(r.match_date).toLocaleDateString('de-DE')}` : ''} · {isOwner(r) ? 'Heim' : 'Gast'}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
            </Card>
          </div>
        )}
    </MemberShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.14em', color: 'var(--th-accent)', textTransform: 'uppercase', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

const h: React.CSSProperties = { padding: '5px 8px', fontWeight: 700, whiteSpace: 'nowrap' };
const d: React.CSSProperties = { padding: '8px 8px', whiteSpace: 'nowrap', color: 'var(--th-text-body)' };
const btn: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1.5px solid', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 };
const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none', resize: 'vertical' };
