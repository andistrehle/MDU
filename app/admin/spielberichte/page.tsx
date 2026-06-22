'use client';

// ============================================================
// Admin — Spielberichte: Übersicht (nach Liga), Bearbeiten & Löschen
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveMatchReports } from '@/lib/auth/roles';
import {
  listAllReports, deleteReport, notifyReportChange,
  REPORT_STATUS_LABELS, type MatchReport,
} from '@/lib/supabase/match-reports';

export default function AdminSpielberichtePage() {
  const { user } = useAuth();
  const canManage = canApproveMatchReports(user); // Ligaleitung aufwärts
  const [rows, setRows] = useState<MatchReport[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { if (canManage) listAllReports().then(setRows); }, [canManage]);

  // Nach Liga gruppieren (sortiert), darin nach Datum absteigend.
  const groups = useMemo(() => {
    const map = new Map<string, MatchReport[]>();
    for (const r of rows ?? []) {
      const key = r.league_label || 'Ohne Liga';
      (map.get(key) ?? map.set(key, []).get(key)!).push(r);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'de'))
      .map(([league, list]) => [league, list.sort((x, y) => (y.match_date ?? '').localeCompare(x.match_date ?? ''))] as const);
  }, [rows]);

  async function onDelete(r: MatchReport) {
    if (!confirm(`Spielbericht ${r.home_team_name} – ${r.guest_team_name} wirklich löschen? Die Kapitäne werden benachrichtigt.`)) return;
    setBusy(r.id);
    await notifyReportChange(r.id, 'deleted'); // vor dem Löschen (Team-Infos noch lesbar)
    const { error } = await deleteReport(r.id);
    setBusy(null);
    if (error) { alert(error); return; }
    setRows(await listAllReports());
  }

  return (
    <AdminGuard title="Spielberichte" subtitle="Alle eingereichten Spielberichte – ändern oder löschen (keine Freigabe nötig).">
      {rows === null ? <p style={muted}>Lade …</p>
        : (rows.length === 0) ? (
          <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, ...muted }}>
            Es wurden noch keine Spielberichte eingereicht.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 960 }}>
            {groups.map(([league, list]) => (
              <div key={league}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  {league} <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontWeight: 700 }}>· {list.length}</span>
                </div>
                <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-manrope)', fontSize: 12.5, minWidth: 640 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--th-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <th style={h}>Sptg.</th><th style={h}>Datum</th><th style={h}>Heim</th><th style={h}>Gast</th><th style={h}>Erg.</th><th style={h}>Status</th><th style={h}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r, i) => (
                        <tr key={r.id} style={{ borderTop: i ? '1px solid var(--th-line-4)' : 'none' }}>
                          <td style={d}>{r.matchday ?? '–'}</td>
                          <td style={d}>{r.match_date ? new Date(r.match_date).toLocaleDateString('de-DE') : '–'}</td>
                          <td style={{ ...d, fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.home_team_name}</td>
                          <td style={d}>{r.guest_team_name}</td>
                          <td style={{ ...d, fontWeight: 700 }}>{r.spiele_home}:{r.spiele_guest}</td>
                          <td style={{ ...d, fontWeight: 700, color: r.status === 'confirmed' ? 'var(--th-win)' : r.status === 'changes_requested' ? 'var(--th-gold)' : 'var(--th-text-muted)' }}>{REPORT_STATUS_LABELS[r.status]}</td>
                          <td style={{ ...d, display: 'flex', gap: 12 }}>
                            <Link href={`/mein-bereich/spielberichte?id=${r.id}`} style={{ fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Bearbeiten</Link>
                            <button onClick={() => onDelete(r)} disabled={busy === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, padding: 0 }}>
                              {busy === r.id ? '…' : 'Löschen'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: 0 }}>
              Hinweis: Spielberichte gelten ohne Freigabe. Bei „Bearbeiten"/„Löschen" werden die betroffenen Kapitäne benachrichtigt.
            </p>
          </div>
        )}
    </AdminGuard>
  );
}

const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' };
const h: React.CSSProperties = { padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap' };
const d: React.CSSProperties = { padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--th-text-body)' };
