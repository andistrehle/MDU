'use client';

// ============================================================
// Admin: Saison-Teams — freigegebene Mannschaften je Saison
// ============================================================
//
// Zeigt die per Freigabe erzeugten season_team_assignments + Kader aus
// Supabase. Read-only-Übersicht; Standard-Saison ist die Anmelde-Saison.
// ============================================================

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import { listSeasons, getRegistrationSeason, SEASON_STATUS_LABELS, type DbSeason } from '@/lib/supabase/seasons';
import { listSeasonTeams, listSeasonRoster, type SeasonTeamRow, type SeasonRosterRow } from '@/lib/supabase/season-teams';

export default function AdminSeasonTeamsPage() {
  const { user } = useAuth();
  const canView = canApproveRegistrations(user);

  const [seasons, setSeasons] = useState<DbSeason[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [teams, setTeams] = useState<SeasonTeamRow[] | null>(null);
  const [roster, setRoster] = useState<SeasonRosterRow[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  // Saisons laden + Standard = Anmelde-Saison (sonst erste).
  useEffect(() => {
    if (!canView) return;
    (async () => {
      const all = await listSeasons();
      setSeasons(all);
      const reg = await getRegistrationSeason();
      queueMicrotask(() => setSeasonId(reg?.id ?? all[0]?.id ?? ''));
    })();
  }, [canView]);

  // Teams + Kader der gewählten Saison laden.
  useEffect(() => {
    if (!canView || !seasonId) return;
    setTeams(null);
    (async () => {
      const [t, r] = await Promise.all([listSeasonTeams(seasonId), listSeasonRoster(seasonId)]);
      setTeams(t);
      setRoster(r);
    })();
  }, [canView, seasonId]);

  const rosterFor = (teamId: string) => roster.filter(p => p.team_id === teamId);
  const season = seasons.find(s => s.id === seasonId) ?? null;

  return (
    <AdminGuard title="Saison-Teams" subtitle="Freigegebene Mannschaften je Saison (aus den Anmeldungen übernommen).">
      {/* Saison-Auswahl */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-muted)' }}>Saison:</span>
        <select value={seasonId} onChange={e => { setSeasonId(e.target.value); setOpen(null); }}
          style={{ padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name} – {SEASON_STATUS_LABELS[s.status]}</option>)}
        </select>
        {season && (
          <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>
            {teams ? `${teams.length} Team${teams.length === 1 ? '' : 's'}` : 'lädt …'}
          </span>
        )}
      </div>

      {teams === null ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : teams.length === 0 ? (
        <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
          Für diese Saison wurden noch keine Mannschaften freigegeben.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 900 }}>
          {teams.map(t => {
            const r = rosterFor(t.team_id);
            const isOpen = open === t.id;
            const captain = r.find(p => p.is_captain);
            return (
              <div key={t.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : t.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: '14px 18px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)' }}>
                      {t.teams?.name ?? t.team_id}
                    </div>
                    <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                      {r.length} Spieler{captain ? ` · Kapitän: ${captain.first_name} ${captain.last_name}` : ''}{t.venues?.name ? ` · ${t.venues.name}` : ''}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-win)' }}>
                    {t.status}
                  </span>
                  <span style={{ color: 'var(--th-text-faint)', fontSize: 18, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>⌄</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '4px 18px 16px', borderTop: '1px solid var(--th-line-4)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, padding: '12px 0', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
                      <span style={{ color: 'var(--th-text-muted)' }}>Spielstätte</span>
                      <span style={{ color: 'var(--th-text-strong)' }}>{t.venues?.name ?? '–'}{t.venues?.address ? ` · ${t.venues.address}` : ''}</span>
                      <span style={{ color: 'var(--th-text-muted)' }}>Team-ID</span>
                      <span style={{ color: 'var(--th-text-strong)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>{t.team_id}</span>
                      <span style={{ color: 'var(--th-text-muted)' }}>Liga/Wettbewerb</span>
                      <span style={{ color: t.assigned_competition_id ? 'var(--th-text-strong)' : 'var(--th-text-faint2)' }}>{t.assigned_competition_id ?? 'noch nicht zugewiesen'}</span>
                    </div>

                    <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', margin: '6px 0 8px' }}>
                      Kader ({r.length})
                    </div>
                    {r.length === 0 ? (
                      <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)' }}>Kein Kader übernommen.</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {r.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                            <span style={{ flex: 1 }}>
                              {p.first_name} {p.last_name}
                              {p.license_number ? ` · ${p.license_number}` : ''}
                              {p.status === 'pending_review' ? ' · neu (Prüfung)' : ''}
                            </span>
                            {p.is_captain && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--th-gold)', textTransform: 'uppercase' }}>Kapitän</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminGuard>
  );
}
