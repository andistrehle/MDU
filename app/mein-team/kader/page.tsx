'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageTeamPlayers } from '@/lib/auth/roles';
import { getRankedRosterForTeam, getCurrentSeason, getPlayerDisplayName, findTeam } from '@/lib/data';
import { NachmeldenButton } from '@/components/mdu/nachmelden-button';
import { listMyNominations, NOMINATION_STATUS_LABELS, type PlayerNomination } from '@/lib/supabase/nominations';
import { getCaptainTeamView, listCaptainTeamSeasons } from '@/lib/supabase/season-teams';

type SeasonView = { seasonId: string; seasonName: string; source: 'static' | 'db' };

export default function KaderPage() {
  const { user, loading } = useAuth();
  const teamId = user?.teamId ?? null;
  const allowed = !!teamId && canManageTeamPlayers(user, teamId);
  const staticTeam = teamId ? findTeam(teamId) : undefined;
  const activeSeason = getCurrentSeason();

  // DB-Saisons dieses Teams (aus season_team_assignments) — neueste zuerst.
  const [dbSeasons, setDbSeasons] = useState<{ seasonId: string; seasonName: string | null }[] | null>(null);
  useEffect(() => {
    if (allowed && teamId) listCaptainTeamSeasons(teamId).then(setDbSeasons);
    else setDbSeasons(null);
  }, [allowed, teamId]);

  // Auswählbare Saisons: DB-Saisons + (falls statisches Team) die aktive Saison
  // mit dem statischen Kader. Neueste zuerst.
  const views = useMemo<SeasonView[]>(() => {
    const list: SeasonView[] = (dbSeasons ?? []).map(s => ({
      seasonId: s.seasonId, seasonName: s.seasonName ?? s.seasonId, source: 'db',
    }));
    // Statische Saison (letzter Kader) nur, wenn dieses Team dort auch Spieler hat.
    if (staticTeam && teamId && !list.some(v => v.seasonId === activeSeason.id)
        && getRankedRosterForTeam(teamId, activeSeason.id).length > 0) {
      list.push({ seasonId: activeSeason.id, seasonName: activeSeason.name, source: 'static' });
    }
    list.sort((a, b) => b.seasonId.localeCompare(a.seasonId));
    return list;
  }, [dbSeasons, staticTeam, teamId, activeSeason.id, activeSeason.name]);

  // Default = neueste Saison. Solange der Kapitän nicht selbst umschaltet, folgt
  // die Auswahl der neuesten Saison — auch wenn die DB-Saison erst nachlädt
  // (sonst bliebe der Default auf dem zuerst geladenen statischen Kader hängen).
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [userPicked, setUserPicked] = useState(false);
  useEffect(() => {
    if (!views.length) return;
    if (!userPicked) { setSelectedSeason(views[0].seasonId); return; }
    if (!views.some(v => v.seasonId === selectedSeason)) setSelectedSeason(views[0].seasonId);
  }, [views, userPicked, selectedSeason]);
  const pickSeason = (id: string) => { setUserPicked(true); setSelectedSeason(id); };

  const currentView = views.find(v => v.seasonId === selectedSeason) ?? views[0] ?? null;
  // Nachmeldung nur in der NEUESTEN (aktuellen) DB-Saison — dort landen neue Spieler.
  const isNewSeason = !!currentView && currentView.source === 'db' && currentView.seasonId === views[0]?.seasonId;

  // DB-Kader der gewählten Saison laden (statische Saison braucht keinen DB-Abruf).
  const [dbView, setDbView] = useState<Awaited<ReturnType<typeof getCaptainTeamView>> | null>(null);
  useEffect(() => {
    if (currentView?.source === 'db' && teamId) getCaptainTeamView(teamId, currentView.seasonId).then(setDbView);
    else setDbView(null);
  }, [currentView?.source, currentView?.seasonId, teamId]);

  const teamName = staticTeam?.name ?? dbView?.teamName ?? teamId ?? '';
  const seasonLabel = currentView?.seasonName ?? activeSeason.name;

  // Normalisierte Kaderzeilen der gewählten Saison (statisch ODER DB).
  const roster = useMemo<{ id: string; name: string; license: string | null; isCaptain: boolean }[]>(() => {
    if (!allowed || !teamId || !currentView) return [];
    const rows = currentView.source === 'static'
      ? getRankedRosterForTeam(teamId, currentView.seasonId)
          .map(e => ({ id: e.player.id, name: getPlayerDisplayName(e.player), license: e.player.licenseNumber ?? null, isCaptain: e.isCaptain }))
      : (dbView?.roster ?? [])
          .map((r, i) => ({ id: r.playerId ?? `row-${i}`, name: r.name, license: r.license, isCaptain: r.isCaptain }));
    // Aufsteigend nach Passnummer sortieren (ohne Nummer ans Ende).
    const num = (lic: string | null) => { const m = /(\d{3,5})\s*$/.exec(lic ?? ''); return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY; };
    return rows.sort((a, b) => num(a.license) - num(b.license) || a.name.localeCompare(b.name, 'de'));
  }, [allowed, teamId, currentView, dbView]);

  // Nachgemeldete Spieler dieses Teams (nur in der neuen Saison relevant).
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
      const name = e.name.toLowerCase();
      const lic = (e.license ?? '').toLowerCase();
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
            {/* Saison-Umschaltung (nur wenn mehr als eine Saison vorhanden). */}
            {views.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 700, color: 'var(--th-text-muted)' }}>Saison</span>
                <select
                  value={currentView?.seasonId ?? ''}
                  onChange={e => pickSeason(e.target.value)}
                  style={{
                    padding: '9px 34px 9px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
                    color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, outline: 'none',
                    appearance: 'none', WebkitAppearance: 'none',
                    backgroundImage: 'linear-gradient(45deg, transparent 50%, var(--th-text-muted) 50%), linear-gradient(135deg, var(--th-text-muted) 50%, transparent 50%)',
                    backgroundPosition: 'calc(100% - 18px) 50%, calc(100% - 13px) 50%',
                    backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat',
                  }}
                >
                  {views.map(v => (
                    <option key={v.seasonId} value={v.seasonId}>
                      {v.seasonName}{v.seasonId === views[0].seasonId ? ' (aktuell)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 200, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
                {teamName} · {seasonLabel} · {roster.length} Spieler
                {!isNewSeason && <span style={{ color: 'var(--th-text-faint)' }}> · Archiv (nur Ansicht)</span>}
              </div>
              {isNewSeason && <NachmeldenButton teamId={teamId} teamName={teamName} onSuccess={loadNoms} />}
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
                const name = entry.name;
                const lic = entry.license;
                return (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--th-line-4)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-faint)', width: 22, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    {entry.isCaptain && (
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--th-gold)', background: 'rgba(232,184,74,0.12)', border: '1px solid rgba(232,184,74,0.3)', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>Kapitän</span>
                    )}
                    <span title="Pass-/Lizenznummer" style={{ flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: lic ? 'var(--th-text-muted)' : 'var(--th-text-faint)' }}>
                      {lic ?? '—'}
                    </span>
                  </div>
                );
              })}
              {roster.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Noch keine Spieler im Kader.</div>}
              {roster.length > 0 && filtered.length === 0 && <div style={{ padding: '22px 16px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Kein Spieler passt zu „{query}".</div>}
            </div>

            {isNewSeason && noms && noms.length > 0 && (
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

            {isNewSeason && (
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 14 }}>
                Neue Spieler über „＋ Spieler nachmelden" einreichen — die Ligaleitung prüft die Nachmeldung.
                Nachmeldungen gelten immer für die aktuelle Saison ({views[0]?.seasonName}).
              </p>
            )}
          </>
        )}
    </MemberShell>
  );
}
