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
import {
  getPredeterminedLeagueForTeam, isLeagueDowngrade,
  MAIN_LEAGUE_LABELS, MAIN_LEAGUES, type MainLeague,
} from '@/lib/data';

/** Vorbestimmte Liga, wenn die Meldung nach unten abweicht — sonst null. */
function downgradeHint(r: TeamRegistration): string | null {
  if (r.is_new_team || !r.source_team_id || !r.requested_league) return null;
  const predet = getPredeterminedLeagueForTeam(r.source_team_id);
  if (!predet || !isLeagueDowngrade(r.requested_league as MainLeague, predet.league)) return null;
  return predet.label;
}

/** Hauptliga-Label (gewünschte bzw. zugewiesene Liga). */
function leagueLabel(code: string | null | undefined): string | null {
  return code ? (MAIN_LEAGUE_LABELS[code as MainLeague] ?? code) : null;
}

const LEAGUE_RANK: Record<string, number> = { la_liga: 0, a_liga: 1, b_liga: 2, c_liga: 3 };

type SortKey = 'date_desc' | 'date_asc' | 'league' | 'name';
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc', label: 'Datum (neueste zuerst)' },
  { value: 'date_asc',  label: 'Datum (älteste zuerst)' },
  { value: 'league',    label: 'Liga' },
  { value: 'name',      label: 'Name' },
];

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
  const [leagueFilter, setLeagueFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('date_desc');
  const [q, setQ] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (canReview) listAllRegistrations().then(setRows);
  }, [canReview]);

  // Erfolgsmeldung nach Freigabe (von der Detailseite via sessionStorage übergeben).
  useEffect(() => {
    try {
      const f = sessionStorage.getItem('mdu_admin_flash');
      if (f) { queueMicrotask(() => setFlash(f)); sessionStorage.removeItem('mdu_admin_flash'); }
    } catch { /* sessionStorage optional */ }
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    const out = rows
      // „pending" = derselbe Umfang wie der Zähler oben (submitted + in_review), REV-034.
      .filter(r => !statusFilter || (statusFilter === 'pending'
        ? (r.status === 'submitted' || r.status === 'in_review')
        : r.status === statusFilter))
      .filter(r => !typeFilter || (typeFilter === 'new' ? r.is_new_team : !r.is_new_team))
      .filter(r => !leagueFilter || r.requested_league === leagueFilter)
      .filter(r => !needle || r.team_name.toLowerCase().includes(needle) || r.contact_name.toLowerCase().includes(needle));
    const dateVal = (r: TeamRegistration) => new Date(r.submitted_at ?? r.created_at).getTime();
    out.sort((a, b) => {
      if (sort === 'name')   return a.team_name.localeCompare(b.team_name, 'de');
      if (sort === 'league') {
        const ra = LEAGUE_RANK[a.requested_league ?? ''] ?? 99;
        const rb = LEAGUE_RANK[b.requested_league ?? ''] ?? 99;
        return ra - rb || a.team_name.localeCompare(b.team_name, 'de');
      }
      if (sort === 'date_asc') return dateVal(a) - dateVal(b);
      return dateVal(b) - dateVal(a); // date_desc
    });
    return out;
  }, [rows, statusFilter, typeFilter, leagueFilter, q, sort]);

  const pendingCount = useMemo(
    () => (rows ?? []).filter(r => r.status === 'submitted' || r.status === 'in_review').length,
    [rows],
  );

  return (
    <AdminGuard title="Saisonanmeldungen" subtitle="Mannschaftsanmeldungen prüfen und freigeben.">
      {flash && (
        <div role="status" style={{
          display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', maxWidth: 820, marginBottom: 14,
          padding: '12px 16px', borderRadius: 12,
          background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.35)',
          fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-win)', lineHeight: 1.5,
        }}>
          <span style={{ flex: 1 }}>{flash}</span>
          <button type="button" onClick={() => setFlash(null)} aria-label="Schließen" style={{
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-win)',
            fontFamily: 'var(--font-manrope)', fontSize: 16, lineHeight: 1, flexShrink: 0,
          }}>×</button>
        </div>
      )}
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}
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

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, maxWidth: 980, alignItems: 'flex-end' }}>
        <FilterField label="Suche" grow>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Team oder Kontakt suchen …"
            style={{ width: '100%', ...ctl }} />
        </FilterField>
        <FilterField label="Status">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={ctl}>
            <option value="">Alle Status</option>
            <option value="pending">Warten auf Prüfung</option>
            {STATUSES.map(s => <option key={s} value={s}>{REGISTRATION_STATUS_LABELS[s]}</option>)}
          </select>
        </FilterField>
        <FilterField label="Liga">
          <select value={leagueFilter} onChange={e => setLeagueFilter(e.target.value)} style={ctl}>
            <option value="">Alle Ligen</option>
            {MAIN_LEAGUES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </FilterField>
        <FilterField label="Typ">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={ctl}>
            <option value="">Alle</option>
            <option value="existing">Bestehende</option>
            <option value="new">Neue Mannschaft</option>
          </select>
        </FilterField>
        <FilterField label="Sortierung">
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={ctl}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </FilterField>
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
                {(() => {
                  const reqLabel = leagueLabel(r.requested_league);
                  const asgLabel = leagueLabel(r.assigned_competition_id);
                  if (!reqLabel && !asgLabel) return null;
                  const text = asgLabel && asgLabel !== reqLabel ? `${reqLabel ?? '—'} → ${asgLabel}` : (reqLabel ?? asgLabel);
                  return (
                    <span title="Gemeldete Liga (ggf. → zugewiesene Liga)" style={{
                      flexShrink: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10.5,
                      letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-muted)',
                      border: '1px solid var(--th-line-10)', borderRadius: 6, padding: '2px 8px',
                    }}>{text}</span>
                  );
                })()}
                {(() => {
                  const hint = downgradeHint(r);
                  return hint ? (
                    <span title={`Eigentlich eine ${hint} Mannschaft`} style={{
                      flexShrink: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10,
                      letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-gold)',
                      border: '1px solid rgba(232,184,74,0.5)', borderRadius: 6, padding: '2px 7px',
                    }}>↓ {hint}</span>
                  ) : null;
                })()}
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

function FilterField({ label, grow, children }: { label: string; grow?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: grow ? 1 : undefined, minWidth: grow ? 180 : undefined }}>
      <label style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-muted)' }}>{label}</label>
      {children}
    </div>
  );
}

const ctl: React.CSSProperties = {
  padding: '10px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
  borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
};
