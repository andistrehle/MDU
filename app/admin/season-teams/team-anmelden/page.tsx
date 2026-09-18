'use client';

// ============================================================
// Admin/Ligaleitung: Team nachträglich anmelden (& sofort freigeben)
// ============================================================
//
// Meldet ein Team im Namen der Mannschaft an, wenn der Kapitän es nicht selbst
// über „Mein Bereich → Mannschaft anmelden" macht. Nutzt exakt denselben Weg:
// Anmeldung anlegen (createRegistration) → einreichen (submitRegistration) →
// freigeben (applyApprovedTeamRegistration, RPC apply_team_registration inkl.
// automatischer Passnummern). Der Kader wird aus der Vorsaison vorbefüllt und
// lässt sich hier anpassen (Spieler raus / neuer rein).
//
// Berechtigung wie die übrige Saison-Teams-Verwaltung: Ligaleitung + Super-Admin
// (`canApproveRegistrations`). Schreibt in die Produktiv-DB.
// ============================================================

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import {
  TEAMS, findTeam, getCurrentSeason, getVenueForTeamInSeason,
  getRankedRosterForTeam, getPlayerDisplayName, getTeamAssignment,
  MAIN_LEAGUES, MAIN_LEAGUE_LABELS, mainLeagueForSubCode, getPredeterminedLeagueForTeam,
  type MainLeague,
} from '@/lib/data';
import {
  createRegistration, submitRegistration, applyApprovedTeamRegistration,
  splitDisplayName, type RegistrationDraft, type RegistrationPlayer,
} from '@/lib/supabase/registrations';
import { getRegistrationSeason } from '@/lib/supabase/seasons';

const SEASON = getCurrentSeason();
const TEAM_OPTIONS = [...TEAMS].map(t => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name, 'de'));

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1px solid var(--th-line-18)', background: 'var(--th-bg-page)',
  color: 'var(--th-text-strong)', fontSize: 15,
};
const label: CSSProperties = { fontSize: 12, color: 'var(--th-text-muted)', marginBottom: 4, display: 'block' };

function emptyDraft(): RegistrationDraft {
  return {
    season_id: SEASON.id, source_team_id: null, is_new_team: false,
    team_name: '', short_name: '', description: '',
    logo_url: '', team_image_url: '',
    venue_name: '', venue_address: '', venue_info: '',
    contact_name: '', contact_email: '', contact_phone: '',
    instagram_url: '', facebook_url: '', website_url: '', notes: '',
    requested_league: null,
  };
}

function makePlayer(display: string, extra?: Partial<RegistrationPlayer>): RegistrationPlayer {
  const { first, last } = splitDisplayName(display);
  return {
    player_id: null, first_name: first, last_name: last, display_name: display,
    license_number: null, is_captain: false, is_existing_player: false, status: 'active',
    ...extra,
  };
}

export default function TeamAnmeldenPage() {
  const { user } = useAuth();

  const [regSeasonId, setRegSeasonId] = useState<string | null>(null);
  const [seasonChecked, setSeasonChecked] = useState(false);
  const [choice, setChoice] = useState('');
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft());
  const [players, setPlayers] = useState<RegistrationPlayer[]>([]);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pendingActiveSeason, setPendingActiveSeason] = useState<string | null>(null);

  const predetermined = useMemo(() => (choice ? getPredeterminedLeagueForTeam(choice) : null), [choice]);

  useEffect(() => {
    let alive = true;
    getRegistrationSeason().then(s => { if (alive) { setRegSeasonId(s?.id ?? null); setSeasonChecked(true); } });
    return () => { alive = false; };
  }, []);

  function onChoice(teamId: string) {
    setChoice(teamId);
    setDone(null); setMsg(null); setPendingActiveSeason(null);
    if (!teamId) { setPlayers([]); return; }
    const team = findTeam(teamId);
    const venue = getVenueForTeamInSeason(teamId, SEASON.id);
    const predet = getPredeterminedLeagueForTeam(teamId);
    const assignment = getTeamAssignment(teamId, SEASON.id);
    const suggestedLeague: MainLeague | null =
      predet?.league ?? (assignment ? (mainLeagueForSubCode(assignment.leagueId) ?? null) : null);
    const roster = getRankedRosterForTeam(teamId, SEASON.id);
    // Kontakt = echter Kapitän aus dem Kader (NICHT das anmeldende Admin-Konto).
    // Name vorbelegen, E-Mail trägt die Ligaleitung ein.
    const captain = roster.find(e => e.isCaptain);
    setDraft({
      ...emptyDraft(),
      contact_name: captain ? getPlayerDisplayName(captain.player) : '',
      source_team_id: teamId, is_new_team: false,
      team_name: team?.name ?? '', short_name: team?.short ?? '',
      venue_name: venue?.name ?? '', venue_address: venue?.address ?? '',
      requested_league: suggestedLeague,
    });
    setPlayers(roster.map(e => ({
      player_id: e.player.id,
      first_name: e.player.firstName,
      last_name: e.player.lastName,
      display_name: getPlayerDisplayName(e.player),
      license_number: e.player.licenseNumber ?? null,
      is_captain: e.isCaptain,
      is_existing_player: true,
      status: 'active',
    })));
  }

  function set<K extends keyof RegistrationDraft>(k: K, v: string) { setDraft(d => ({ ...d, [k]: v })); }

  function editPlayer(i: number, display: string) {
    setPlayers(ps => ps.map((p, idx) => {
      if (idx !== i) return p;
      const { first, last } = splitDisplayName(display);
      const renamed = display.trim() !== p.display_name.trim();
      // Bei Umbenennung die Verknüpfung lösen — sonst hinge der alte Spieler dran.
      return { ...p, display_name: display, first_name: first, last_name: last,
        ...(renamed ? { player_id: null, is_existing_player: false } : {}) };
    }));
  }
  function removePlayer(i: number) { setPlayers(ps => ps.filter((_, idx) => idx !== i)); }
  function addPlayer() {
    const n = newName.trim();
    if (!n) return;
    setPlayers(ps => [...ps, makePlayer(n)]);
    setNewName('');
  }

  function validate(): string[] {
    const m: string[] = [];
    if (!choice) m.push('Mannschaft');
    if (!draft.team_name.trim()) m.push('Teamname');
    if (!draft.requested_league) m.push('Liga');
    if (!draft.contact_name.trim()) m.push('Ansprechpartner');
    if (!/^\S+@\S+\.\S+$/.test(draft.contact_email)) m.push('gültige Kontakt-E-Mail');
    if (!draft.venue_name?.trim()) m.push('Spielstätte (Name)');
    if (!draft.venue_address?.trim()) m.push('Spielstätte (Adresse)');
    if (players.filter(p => p.display_name.trim()).length === 0) m.push('mindestens ein Spieler');
    return m;
  }

  async function run(allowActiveSeason: boolean) {
    setBusy(true); setMsg(null);
    const s = regSeasonId ? { id: regSeasonId } : await getRegistrationSeason();
    if (!s) { setBusy(false); setMsg({ kind: 'err', text: 'Aktuell ist keine Saison zur Anmeldung geöffnet.' }); return; }
    const payload: RegistrationDraft = { ...draft, season_id: s.id, is_new_team: false, source_team_id: choice };

    // 1) Anmeldung anlegen (Entwurf) …
    const { id, error } = await createRegistration(payload, players.filter(p => p.display_name.trim()));
    if (error || !id) { setBusy(false); setMsg({ kind: 'err', text: error ?? 'Anlegen fehlgeschlagen.' }); return; }
    // 2) … einreichen …
    const se = await submitRegistration(id);
    if (se.error) { setBusy(false); setMsg({ kind: 'err', text: se.error }); return; }
    // 3) … und sofort freigeben (RPC + Passnummern).
    const res = await applyApprovedTeamRegistration(id, {
      reviewNote: `Von der Ligaleitung angemeldet (${user?.displayName ?? 'Admin'})`,
      allowActiveSeason,
      onBehalf: true,
    });
    setBusy(false);
    if (res.activeSeasonWarning) { setPendingActiveSeason(id); return; }
    if (res.error) { setMsg({ kind: 'err', text: res.error }); return; }
    const f = res.finalize;
    const extra = f ? ` · Passnummern: ${f.created ?? 0} neu, ${f.linked ?? 0} übernommen${f.ambiguous?.length ? `, ${f.ambiguous.length} unklar` : ''}` : '';
    setDone(`„${draft.team_name}" ist angemeldet und freigegeben (${MAIN_LEAGUE_LABELS[draft.requested_league as MainLeague] ?? draft.requested_league}).${extra}`);
    setChoice(''); setPlayers([]); setDraft(emptyDraft());
  }

  return (
    <AdminGuard
      title="Team anmelden"
      subtitle="Meldet eine Mannschaft im Namen des Teams an und gibt sie sofort frei. Kader aus der Vorsaison, anpassbar; Passnummern automatisch."
      require="league"
    >
      <div style={{ maxWidth: 720, padding: '0 0 60px' }}>
        <div style={{ marginBottom: 14 }}>
          <Link href="/admin/season-teams" style={{ fontSize: 13, color: 'var(--th-accent)', textDecoration: 'none' }}>← Saison-Teams</Link>
        </div>

        {seasonChecked && !regSeasonId && (
          <Notice kind="err">Aktuell ist keine Saison zur Anmeldung geöffnet.</Notice>
        )}

        {regSeasonId && (
          <>
            {done && <Notice kind="ok">{done}</Notice>}
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

            <div style={{ marginBottom: 14 }}>
              <label style={label}>Mannschaft</label>
              <select value={choice} onChange={e => onChoice(e.target.value)} style={inputStyle}>
                <option value="">— bitte wählen —</option>
                {TEAM_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {predetermined && (
                <p style={{ fontSize: 12, color: 'var(--th-text-muted)', margin: '6px 0 0' }}>
                  Vorgeschlagene Liga laut Auf-/Abstieg: <b>{predetermined.label}</b>
                </p>
              )}
            </div>

            {choice && (
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                  <div><label style={label}>Teamname</label><input value={draft.team_name} onChange={e => set('team_name', e.target.value)} style={inputStyle} /></div>
                  <div><label style={label}>Liga</label>
                    <select value={draft.requested_league ?? ''} onChange={e => set('requested_league', e.target.value)} style={inputStyle}>
                      <option value="">—</option>
                      {MAIN_LEAGUES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={label}>Spielstätte (Name)</label><input value={draft.venue_name ?? ''} onChange={e => set('venue_name', e.target.value)} style={inputStyle} /></div>
                  <div><label style={label}>Spielstätte (Adresse)</label><input value={draft.venue_address ?? ''} onChange={e => set('venue_address', e.target.value)} style={inputStyle} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={label}>Ansprechpartner</label><input value={draft.contact_name} onChange={e => set('contact_name', e.target.value)} style={inputStyle} /></div>
                  <div><label style={label}>Kontakt-E-Mail</label><input value={draft.contact_email} onChange={e => set('contact_email', e.target.value)} style={inputStyle} /></div>
                </div>

                <div>
                  <label style={label}>Kader ({players.filter(p => p.display_name.trim()).length})</label>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {players.map((p, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                        <input value={p.display_name} onChange={e => editPlayer(i, e.target.value)} style={inputStyle}
                          placeholder="Vor- und Nachname" />
                        <button type="button" onClick={() => removePlayer(i)}
                          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--th-line-18)', background: 'transparent', color: 'var(--th-text-muted)', cursor: 'pointer' }}>
                          entfernen
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 8 }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPlayer(); } }}
                      placeholder="Neuen Spieler hinzufügen …" style={inputStyle} />
                    <button type="button" onClick={addPlayer}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--th-line-18)', background: 'transparent', color: 'var(--th-text-strong)', cursor: 'pointer' }}>
                      + hinzufügen
                    </button>
                  </div>
                </div>

                {pendingActiveSeason ? (
                  <Notice kind="err">
                    Achtung: Ziel ist die <b>aktive</b> Saison (nicht die Anmelde-Saison). Wirklich dort anmelden?
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button type="button" disabled={busy} onClick={() => run(true)}
                        style={{ padding: '10px 16px', borderRadius: 10, border: 0, background: 'var(--th-accent)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                        Ja, trotzdem freigeben
                      </button>
                      <button type="button" onClick={() => setPendingActiveSeason(null)}
                        style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--th-line-18)', background: 'transparent', color: 'var(--th-text-muted)', cursor: 'pointer' }}>
                        Abbrechen
                      </button>
                    </div>
                  </Notice>
                ) : (
                  <div>
                    <button type="button" disabled={busy} onClick={() => {
                      const miss = validate();
                      if (miss.length) { setMsg({ kind: 'err', text: `Bitte noch ergänzen: ${miss.join(', ')}.` }); return; }
                      run(false);
                    }}
                      style={{ padding: '13px 22px', borderRadius: 10, border: 0, background: 'var(--th-accent)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                      {busy ? 'Wird angemeldet …' : 'Anmelden & sofort freigeben'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminGuard>
  );
}

function Notice({ kind, children }: { kind: 'ok' | 'err'; children: React.ReactNode }) {
  const ok = kind === 'ok';
  return (
    <div style={{
      margin: '0 0 14px', padding: '11px 14px', borderRadius: 10, fontSize: 13.5,
      background: ok ? 'rgba(46,125,50,.10)' : 'rgba(192,57,43,.08)',
      border: `1px solid ${ok ? 'rgba(46,125,50,.35)' : 'rgba(192,57,43,.30)'}`,
      color: ok ? '#2e7d32' : '#c0392b',
    }}>{children}</div>
  );
}
