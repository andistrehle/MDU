'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageTeamPlayers } from '@/lib/auth/roles';
import { getRankedRosterForTeam, getCurrentSeason, getPlayerDisplayName, findTeam } from '@/lib/data';
import { NachmeldenButton } from '@/components/mdu/nachmelden-button';
import { listMyNominations, NOMINATION_STATUS_LABELS, type PlayerNomination } from '@/lib/supabase/nominations';

export default function KaderPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const allowed = !!teamId && canManageTeamPlayers(user, teamId);
  const team = teamId ? findTeam(teamId) : undefined;
  const season = getCurrentSeason();
  // Eigenes useMemo: sonst wäre `roster` bei jedem Render eine neue Referenz und
  // das `filtered`-useMemo weiter unten würde jedes Mal neu rechnen (REV-045).
  const roster = useMemo(
    () => (allowed && teamId ? getRankedRosterForTeam(teamId, season.id) : []),
    [allowed, teamId, season.id],
  );

  // Nachgemeldete Spieler dieses Teams (in Prüfung + freigegeben, mit Passnummer).
  const [noms, setNoms] = useState<PlayerNomination[] | null>(null);
  const loadNoms = useCallback(() => {
    if (!allowed || !teamId) return;
    listMyNominations().then(all => setNoms(all.filter(n => n.team_id === teamId && n.status !== 'rejected')));
  }, [allowed, teamId]);
  useEffect(() => { loadNoms(); }, [loadNoms]);

  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    const qDigits = q.replace(/\D/g, '');
    return roster.filter(e => {
      const name = getPlayerDisplayName(e.player).toLowerCase();
      const lic = (e.player.licenseNumber ?? '').toLowerCase();
      const licDigits = lic.replace(/\D/g, '');
      return name.includes(q) || lic.includes(q) || (qDigits.length >= 2 && licDigits.includes(qDigits));
    });
  }, [roster, query]);

  return (
    <MemberShell title="Kader">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur für Teamkapitäne.{' '}<LoginLink /></Notice>
        : !teamId ? <Notice title="Kein Team verknüpft">Deinem Konto ist noch kein Team zugeordnet.</Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Du kannst nur den Kader deines eigenen Teams verwalten.</Notice>
        : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 200, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                {team?.name ?? teamId} · {season.name} · {roster.length} Spieler
              </div>
              <NachmeldenButton teamId={teamId} teamName={team?.name ?? teamId} onSuccess={loadNoms} />
            </div>

            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Suche nach Name oder Pass-Nr. …"
              style={{ width: '100%', padding: '10px 12px', marginBottom: 12, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}
            />

            <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
              {filtered.map((entry, i) => {
                const name = getPlayerDisplayName(entry.player);
                const lic = entry.player.licenseNumber;
                return (
                  <div key={entry.player.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-faint)', width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span title="Pass-/Lizenznummer" style={{ flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: lic ? 'var(--th-text-muted)' : 'var(--th-text-faint)' }}>
                      {lic ?? '—'}
                    </span>
                    {entry.isCaptain && (
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>Kapitän</span>
                    )}
                  </div>
                );
              })}
              {roster.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Noch keine Spieler im Kader.</div>}
              {roster.length > 0 && filtered.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Kein Spieler passt zu „{query}".</div>}
            </div>

            {noms && noms.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--th-text-muted)', marginBottom: 8 }}>
                  Nachgemeldete Spieler
                </div>
                <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden' }}>
                  {noms.map((n, i) => (
                    <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < noms.length - 1 ? '1px solid var(--th-line-4)' : 'none' }}>
                      <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.first_name} {n.last_name}
                      </span>
                      {n.status === 'approved' && (
                        <span title="Pass-/Lizenznummer" style={{ flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: n.license_number ? 'var(--th-text-muted)' : 'var(--th-text-faint)' }}>
                          {n.license_number ?? '—'}{n.license_provisional && n.license_number ? ' *' : ''}
                        </span>
                      )}
                      <span style={{ flexShrink: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 4, padding: '2px 6px',
                        color: n.status === 'approved' ? 'var(--th-win)' : 'var(--th-accent)',
                        background: n.status === 'approved' ? 'rgba(30,158,90,0.12)' : 'var(--th-accent-a07)',
                        border: `1px solid ${n.status === 'approved' ? 'rgba(30,158,90,0.3)' : 'var(--th-accent-a25)'}` }}>
                        {NOMINATION_STATUS_LABELS[n.status]}
                      </span>
                    </div>
                  ))}
                </div>
                {noms.some(n => n.status === 'approved' && n.license_provisional && n.license_number) && (
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', marginTop: 6 }}>
                    * vorläufige Passnummer — wird durch die offizielle Nummer ersetzt, sobald sie vorliegt.
                  </p>
                )}
              </div>
            )}

            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 14 }}>
              Neue Spieler über „＋ Spieler nachmelden" einreichen — die Ligaleitung prüft die Nachmeldung.
            </p>
          </>
        )}
    </MemberShell>
  );
}
