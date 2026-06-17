'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canStartRegistration } from '@/lib/auth/roles';
import {
  listMyRegistrations, submitRegistration,
  REGISTRATION_STATUS_LABELS, type TeamRegistration,
} from '@/lib/supabase/registrations';
import { getCurrentSeason } from '@/lib/data';

const SEASON = getCurrentSeason();

function statusColor(s: TeamRegistration['status']): string {
  if (s === 'approved') return 'var(--th-win)';
  if (s === 'rejected') return 'var(--th-loss)';
  if (s === 'changes_requested') return 'var(--th-gold)';
  return 'var(--th-text-muted)';
}

export default function MeineAnmeldungenPage() {
  const { user, loading } = useAuth();
  const allowed = canStartRegistration(user);
  const [rows, setRows] = useState<TeamRegistration[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (allowed) listMyRegistrations().then(setRows);
  }, [allowed]);

  async function onSubmit(id: string) {
    setBusyId(id);
    await submitRegistration(id);
    setRows(await listMyRegistrations());
    setBusyId(null);
  }

  return (
    <MemberShell title="Meine Anmeldungen">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Mannschaftsanmeldungen sind für Teamkapitäne und die Ligaleitung.</Notice>
        : (
          <>
            <div style={{ marginBottom: 16 }}>
              <Link href="/mein-bereich/mannschaft-anmelden" style={{ display: 'inline-block', padding: '11px 20px', borderRadius: 8, background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none' }}>
                ＋ Neue Anmeldung
              </Link>
            </div>

            {rows === null ? <Muted>Anmeldungen werden geladen …</Muted>
              : rows.length === 0 ? (
                <Notice title="Noch keine Anmeldungen">Du hast noch keine Mannschaftsanmeldung erstellt.</Notice>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rows.map(r => {
                    const editable = r.status === 'draft' || r.status === 'changes_requested';
                    return (
                      <div key={r.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <div style={{ flex: 1, minWidth: 160 }}>
                            <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>{r.team_name}</div>
                            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                              Saison {SEASON.name} · {r.is_new_team ? 'neue Mannschaft' : 'bestehende Mannschaft'}
                              {r.submitted_at ? ` · eingereicht ${new Date(r.submitted_at).toLocaleDateString('de-DE')}` : ''}
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: statusColor(r.status) }}>
                            {REGISTRATION_STATUS_LABELS[r.status]}
                          </span>
                        </div>
                        {r.review_note && (r.status === 'rejected' || r.status === 'changes_requested') && (
                          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: 'var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-body)' }}>
                            Anmerkung der Ligaleitung: {r.review_note}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          {editable && (
                            <Link href={`/mein-bereich/mannschaft-anmelden?id=${r.id}`} style={ghostBtn}>Bearbeiten</Link>
                          )}
                          {editable && (
                            <button onClick={() => onSubmit(r.id)} disabled={busyId === r.id}
                              style={{ padding: '8px 16px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12 }}>
                              {busyId === r.id ? '…' : (r.status === 'changes_requested' ? 'Erneut einreichen' : 'Einreichen')}
                            </button>
                          )}
                          {!editable && (
                            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>
                              {r.status === 'approved' ? 'Freigegeben — keine Bearbeitung nötig.' : 'In Bearbeitung durch die Ligaleitung.'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </>
        )}
    </MemberShell>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, background: 'transparent', color: 'var(--th-accent)',
  border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, textDecoration: 'none',
};
