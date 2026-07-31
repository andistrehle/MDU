'use client';

// ============================================================
// Admin: Kontakte — Telefonnummern der Team-Kapitäne je Saison
// ============================================================
//
// Zentrale Liste aller Ansprechpartner (Kapitäne) aus den Mannschafts-
// anmeldungen: Team · Name · Telefon · E-Mail. Nur Ligaleitung/Super-Admin
// (AdminGuard). Quelle sind die Kontaktdaten der Anmeldung (contact_*).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import { listSeasons, getRegistrationSeason, SEASON_STATUS_LABELS, type DbSeason } from '@/lib/supabase/seasons';
import { listSeasonTeams, type SeasonTeamRow } from '@/lib/supabase/season-teams';
import { PhoneActions } from '@/components/mdu/phone-actions';

export default function AdminKontaktePage() {
  const { user } = useAuth();
  const canView = canApproveRegistrations(user);

  const [seasons, setSeasons] = useState<DbSeason[]>([]);
  const [seasonId, setSeasonId] = useState('');
  const [teams, setTeams] = useState<SeasonTeamRow[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!canView) return;
    (async () => {
      const all = await listSeasons();
      setSeasons(all);
      const reg = await getRegistrationSeason();
      queueMicrotask(() => setSeasonId(reg?.id ?? all[0]?.id ?? ''));
    })();
  }, [canView]);

  useEffect(() => {
    if (!canView || !seasonId) return;
    let cancelled = false;
    (async () => {
      setTeams(null);
      const t = await listSeasonTeams(seasonId);
      if (!cancelled) setTeams(t);
    })();
    return () => { cancelled = true; };
  }, [canView, seasonId]);

  const season = seasons.find(s => s.id === seasonId) ?? null;

  const rows = useMemo(() => {
    const list = (teams ?? []).slice().sort((a, b) =>
      (a.teams?.name ?? a.team_id).localeCompare(b.teams?.name ?? b.team_id, 'de'));
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(t =>
      [t.teams?.name, t.contact_name, t.contact_phone, t.contact_email, t.team_id]
        .filter(Boolean).some(v => (v as string).toLowerCase().includes(needle)));
  }, [teams, q]);

  const withPhone = (teams ?? []).filter(t => t.contact_phone).length;

  return (
    <AdminGuard title="Kontakte" subtitle="Telefonnummern der Team-Kapitäne aus den Mannschaftsanmeldungen.">
      {/* Saison + Suche */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-muted)' }}>Saison:</span>
        <select value={seasonId} onChange={e => setSeasonId(e.target.value)}
          style={{ padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}>
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name} – {SEASON_STATUS_LABELS[s.status]}</option>)}
        </select>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Suche (Team, Name, Nummer …)"
          style={{ flex: 1, minWidth: 180, padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }} />
      </div>

      {teams === null ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : teams.length === 0 ? (
        <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
          Für diese Saison wurden noch keine Mannschaften freigegeben.
        </div>
      ) : (
        <>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-faint)', margin: '0 0 12px' }}>
            {season?.name} · {rows.length} Team{rows.length === 1 ? '' : 's'} angezeigt · {withPhone} mit Telefonnummer
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 900 }}>
            {rows.map(t => (
              <div key={t.id} style={{
                background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12,
                padding: '12px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 14px',
              }}>
                <div style={{ minWidth: 200, flex: '1 1 200px' }}>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)' }}>
                    {t.teams?.name ?? t.team_id}
                  </div>
                  <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', marginTop: 2 }}>
                    {t.contact_name ?? '– kein Ansprechpartner –'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center', fontFamily: 'var(--font-manrope)', fontSize: 13 }}>
                  {t.contact_phone
                    ? <PhoneActions phone={t.contact_phone} />
                    : <span style={{ color: 'var(--th-text-faint2)' }}>📞 keine Nummer</span>}
                  {t.contact_email && <a href={`mailto:${t.contact_email}`} style={{ color: 'var(--th-accent)', textDecoration: 'none' }}>✉ {t.contact_email}</a>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminGuard>
  );
}
