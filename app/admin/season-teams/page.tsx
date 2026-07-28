'use client';

// ============================================================
// Admin: Saison-Teams — freigegebene Mannschaften je Saison
// ============================================================
//
// Zeigt die per Freigabe erzeugten season_team_assignments + Kader aus
// Supabase. Read-only-Übersicht; Standard-Saison ist die Anmelde-Saison.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveRegistrations } from '@/lib/auth/roles';
import { listSeasons, getRegistrationSeason, SEASON_STATUS_LABELS, type DbSeason } from '@/lib/supabase/seasons';
import { listSeasonTeams, listSeasonRoster, setActiveSeason, finalizeNewRosterPlayers, type SeasonTeamRow, type SeasonRosterRow } from '@/lib/supabase/season-teams';
import { playerLeagueHint } from '@/lib/data/roster-hints';
import { canManageUsers } from '@/lib/auth/roles';
import {
  MAIN_LEAGUE_LABELS, mainLeagueForSubCode, getPredeterminedLeagueForTeam,
  type MainLeague,
} from '@/lib/data';

const LEAGUE_ORDER: MainLeague[] = ['la_liga', 'a_liga', 'b_liga', 'c_liga'];

/** Code (Hauptliga oder Staffel wie b1/b2) → Hauptliga. */
function toMainLeague(code: string | null | undefined): MainLeague | null {
  if (!code) return null;
  if (code === 'la_liga' || code === 'a_liga' || code === 'b_liga' || code === 'c_liga') return code;
  return mainLeagueForSubCode(code) ?? null;
}

/** Beste verfügbare Liga-Zuordnung eines Saison-Teams für die Gruppierung. */
function teamMainLeague(t: SeasonTeamRow): MainLeague | null {
  return toMainLeague(t.assigned_competition_id)
    ?? toMainLeague(t.requested_league)
    ?? getPredeterminedLeagueForTeam(t.team_id)?.league
    ?? null;
}

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
    let cancelled = false;
    (async () => {
      setTeams(null);
      const [t, r] = await Promise.all([listSeasonTeams(seasonId), listSeasonRoster(seasonId)]);
      if (cancelled) return;
      setTeams(t);
      setRoster(r);
    })();
    return () => { cancelled = true; };
  }, [canView, seasonId]);

  const rosterFor = (teamId: string) => roster.filter(p => p.team_id === teamId);
  const season = seasons.find(s => s.id === seasonId) ?? null;
  const activeSeason = seasons.find(s => s.status === 'active') ?? null;
  const canSwitch = canManageUsers(user); // Saison aktivieren: nur Super Admin

  const [switching, setSwitching] = useState(false);
  const [switchMsg, setSwitchMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Neue Spieler eines Teams freigeben (Profil + Passnummer erzeugen).
  const [finalizing, setFinalizing] = useState<string | null>(null);
  const [finalizeMsg, setFinalizeMsg] = useState<{ teamId: string; kind: 'ok' | 'err'; text: string } | null>(null);

  async function onFinalize(teamId: string, teamName: string) {
    const pending = rosterFor(teamId).filter(p => p.status === 'pending_review');
    if (pending.length === 0) return;
    if (!confirm(
      `Für „${teamName}" ${pending.length} neue${pending.length === 1 ? 'n' : ''} Spieler freigeben und ` +
      `${pending.length === 1 ? 'eine Passnummer' : 'Passnummern'} vergeben?\n\n` +
      `Es werden echte Spielerprofile mit Passnummer angelegt. Das lässt sich nicht einfach rückgängig machen.`,
    )) return;
    setFinalizing(teamId); setFinalizeMsg(null);
    const { finalized, created, linked, ambiguous, error } = await finalizeNewRosterPlayers(seasonId, teamId);
    if (error) {
      setFinalizing(null);
      setFinalizeMsg({ teamId, kind: 'err', text: `Fehler nach ${finalized} Spieler(n): ${error}` });
      return;
    }
    setRoster(await listSeasonRoster(seasonId));
    setFinalizing(null);
    // Ehrliche Rückmeldung: neu angelegt vs. mit bestehendem Profil verknüpft
    // (Teamwechsler) vs. mehrdeutige Namen, die manuell zugeordnet werden müssen.
    const parts: string[] = [];
    if (created) parts.push(`${created} neu angelegt (mit Passnummer)`);
    if (linked) parts.push(`${linked} mit bestehendem Profil verknüpft`);
    let text = parts.length ? parts.join(' · ') : `${finalized} Spieler freigegeben.`;
    if (ambiguous?.length) text += ` · ⚠ ${ambiguous.length} mehrdeutig (bitte manuell zuordnen): ${ambiguous.join(', ')}`;
    setFinalizeMsg({ teamId, kind: ambiguous?.length ? 'err' : 'ok', text });
  }

  async function onActivate() {
    if (!season) return;
    if (!confirm(
      `„${season.name}" als AKTIVE Saison schalten?\n\n` +
      `Die bisher aktive Saison (${activeSeason?.name ?? '—'}) wird archiviert (bleibt vollständig erhalten). ` +
      `Die öffentliche Seite zeigt danach die neue Saison.`,
    )) return;
    setSwitching(true); setSwitchMsg(null);
    const { error } = await setActiveSeason(season.id);
    if (error) { setSwitching(false); setSwitchMsg({ kind: 'err', text: error }); return; }
    setSeasons(await listSeasons());
    setSwitching(false);
    setSwitchMsg({ kind: 'ok', text: `„${season.name}" ist jetzt die aktive Saison.` });
  }

  // Aufklappbare Team-Karte (in beiden Gruppen-Rendern identisch).
  const renderTeam = (t: SeasonTeamRow) => {
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
              <span style={{ color: 'var(--th-text-muted)' }}>Kurzname</span>
              <span style={{ color: t.teams?.short_name ? 'var(--th-text-strong)' : 'var(--th-text-faint2)', letterSpacing: t.teams?.short_name ? '0.08em' : undefined }}>{t.teams?.short_name ?? '–'}</span>
              <span style={{ color: 'var(--th-text-muted)' }}>Spielstätte</span>
              <span style={{ color: 'var(--th-text-strong)' }}>{t.venues?.name ?? '–'}{t.venues?.address ? ` · ${t.venues.address}` : ''}</span>
              <span style={{ color: 'var(--th-text-muted)' }}>Team-ID</span>
              <span style={{ color: 'var(--th-text-strong)', fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12 }}>{t.team_id}</span>
              <span style={{ color: 'var(--th-text-muted)' }}>Liga/Wettbewerb</span>
              <span style={{ color: t.assigned_competition_id ? 'var(--th-text-strong)' : 'var(--th-text-faint2)' }}>{t.assigned_competition_id ?? 'noch nicht zugewiesen'}</span>
            </div>

            <Link href={`/mein-team/bearbeiten?team=${t.team_id}`}
              style={{ display: 'inline-block', marginBottom: 10, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-accent)', textDecoration: 'none' }}>
              Team-Profil bearbeiten (Logo, Beschreibung, Social) →
            </Link>

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
                      {p.first_name} {p.last_name}{p.license_number ? ` · ${p.license_number}` : ''}
                      <span style={{ color: 'var(--th-text-muted)' }}>{playerLeagueHint(p.player_id, t.team_id)}</span>
                      {p.status === 'pending_review' ? ' · neu (Prüfung)' : ''}
                    </span>
                    {p.is_captain && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--th-gold)', textTransform: 'uppercase' }}>Kapitän</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Neue Spieler freigeben + Passnummern vergeben */}
            {(() => {
              const pending = r.filter(p => p.status === 'pending_review').length;
              if (pending === 0) return null;
              return (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--th-line-4)' }}>
                  <button
                    type="button"
                    onClick={() => onFinalize(t.team_id, t.teams?.name ?? t.team_id)}
                    disabled={finalizing === t.team_id}
                    style={{ padding: '9px 14px', borderRadius: 8, cursor: finalizing === t.team_id ? 'wait' : 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}
                  >
                    {finalizing === t.team_id ? 'Vergebe Passnummern …' : `${pending} neue${pending === 1 ? 'n' : ''} Spieler freigeben & Passnummer${pending === 1 ? '' : 'n'} vergeben`}
                  </button>
                  <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-text-faint)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    Legt für die als „neu (Prüfung)" markierten Spieler ein Spielerprofil an und vergibt eine Passnummer
                    (Regel: höchste Teamkollegen-Nummer + 1, nächste freie). Danach sind sie im „Verknüpfter Spieler"-Feld auswählbar.
                  </p>
                  {finalizeMsg?.teamId === t.team_id && (
                    <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, marginTop: 8, color: finalizeMsg.kind === 'ok' ? 'var(--th-win)' : '#E24B4A' }}>
                      {finalizeMsg.text}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  // Teams nach Hauptliga gruppieren (La → A → B → C, dann „ohne Zuordnung").
  const grouped = (() => {
    if (!teams) return [] as { key: string; label: string; teams: SeasonTeamRow[] }[];
    const buckets = new Map<string, SeasonTeamRow[]>();
    for (const t of teams) {
      const key = teamMainLeague(t) ?? '_none';
      (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(t);
    }
    const out: { key: string; label: string; teams: SeasonTeamRow[] }[] = [];
    for (const lg of LEAGUE_ORDER) {
      const arr = buckets.get(lg);
      if (arr?.length) out.push({ key: lg, label: MAIN_LEAGUE_LABELS[lg], teams: arr });
    }
    const none = buckets.get('_none');
    if (none?.length) out.push({ key: '_none', label: 'Noch keine Liga zugewiesen', teams: none });
    return out;
  })();

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

      {/* Saison verwalten — aktive Saison + Umschalten (nur Super Admin) */}
      {canSwitch && (
        <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 18px', marginBottom: 18, maxWidth: 900, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
            Aktive Saison: <strong style={{ color: 'var(--th-text-strong)' }}>{activeSeason?.name ?? '—'}</strong>
            <div style={{ fontSize: 11.5, color: 'var(--th-text-faint)', marginTop: 3 }}>
              Beim Go-live die neue Saison aktivieren — die alte wird archiviert (bleibt als Historie erhalten).
            </div>
          </div>
          {season && season.id !== activeSeason?.id && (
            <button type="button" onClick={onActivate} disabled={switching} style={{
              padding: '10px 16px', borderRadius: 8, cursor: switching ? 'wait' : 'pointer',
              background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)',
              fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, opacity: switching ? 0.7 : 1,
            }}>{switching ? 'Schalte …' : `„${season.name}" aktivieren`}</button>
          )}
          {season && season.id === activeSeason?.id && (
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, fontWeight: 700, color: 'var(--th-win)' }}>● aktiv</span>
          )}
        </div>
      )}
      {switchMsg && (
        <div role={switchMsg.kind === 'err' ? 'alert' : 'status'} style={{
          maxWidth: 900, marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13,
          background: switchMsg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)',
          border: `1px solid ${switchMsg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`,
          color: switchMsg.kind === 'err' ? '#E24B4A' : 'var(--th-win)',
        }}>{switchMsg.text}</div>
      )}

      {teams === null ? (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>Lade …</p>
      ) : teams.length === 0 ? (
        <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' }}>
          Für diese Saison wurden noch keine Mannschaften freigegeben.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }}>
          {grouped.map(g => (
            <div key={g.key}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, margin: '0 0 10px',
                paddingBottom: 6, borderBottom: '2px solid var(--th-line-10)',
              }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 16, color: 'var(--th-text-strong)' }}>
                  {g.label}
                </h3>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)' }}>
                  {g.teams.length} Team{g.teams.length === 1 ? '' : 's'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {g.teams.map(renderTeam)}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
