'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import {
  listAllRegistrations, REGISTRATION_STATUS_LABELS,
  type TeamRegistration, type RegistrationStatus,
} from '@/lib/supabase/registrations';

const STATUSES: RegistrationStatus[] = ['draft','submitted','in_review','approved','rejected','changes_requested'];

function statusColor(s: RegistrationStatus): string {
  if (s === 'approved') return 'var(--th-win)';
  if (s === 'rejected') return 'var(--th-loss)';
  if (s === 'changes_requested') return 'var(--th-gold)';
  if (s === 'submitted' || s === 'in_review') return 'var(--th-accent)';
  return 'var(--th-text-muted)';
}

export default function AdminRegistrationsPage() {
  const { user } = useAuth();
  const canReview = canApproveRegistrations(user);
  const [rows, setRows] = useState<TeamRegistration[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (canReview) listAllRegistrations().then(setRows);
  }, [canReview]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows
      .filter(r => !statusFilter || r.status === statusFilter)
      .filter(r => !typeFilter || (typeFilter === 'new' ? r.is_new_team : !r.is_new_team))
      .filter(r => !needle || r.team_name.toLowerCase().includes(needle) || r.contact_name.toLowerCase().includes(needle));
  }, [rows, statusFilter, typeFilter, q]);

  const pendingCount = useMemo(
    () => (rows ?? []).filter(r => r.status === 'submitted' || r.status === 'in_review').length,
    [rows],
  );

  return (
    <AdminGuard title="Saisonanmeldungen" subtitle="Mannschaftsanmeldungen prüfen und freigeben.">
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'submitted' ? '' : 'submitted')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 820, marginBottom: 14,
            padding: '12px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
            background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)',
          }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 26, padding: '0 7px',
            borderRadius: 13, background: 'var(--th-accent)', color: '#fff',
            fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 14,
          }}>{pendingCount}</span>
          <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>
            {pendingCount === 1 ? 'Anmeldung wartet auf Prüfung' : 'Anmeldungen warten auf Prüfung'}
          </span>
        </button>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, maxWidth: 820 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Team oder Kontakt suchen …"
          style={{ flex: 1, minWidth: 180, ...ctl }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={ctl}>
          <option value="">Alle Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{REGISTRATION_STATUS_LABELS[s]}</option>)}
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={ctl}>
          <option value="">Alle</option>
          <option value="existing">Bestehende</option>
          <option value="new">Neue Mannschaft</option>
        </select>
      </div>

      {rows === null ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
          {rows.length === 0 ? 'Noch keine Mannschaftsanmeldungen vorhanden.' : 'Keine Anmeldungen für diesen Filter.'}
        </div>
      ) : (
        <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 900 }}>
          {filtered.map((r, i) => (
            <Link key={r.id} href={`/admin/registrations/${r.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div className="mdu-row-hover" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--th-line-4)' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.team_name} {r.is_new_team && <span style={{ fontSize: 10, color: 'var(--th-gold)', fontWeight: 700 }}>NEU</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.contact_name}{r.submitted_at ? ` · ${new Date(r.submitted_at).toLocaleDateString('de-DE')}` : ''}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: statusColor(r.status), flexShrink: 0 }}>
                  {REGISTRATION_STATUS_LABELS[r.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}

const ctl: React.CSSProperties = {
  padding: '10px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
  borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
};
