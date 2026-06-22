'use client';

// ============================================================
// Mein Bereich — Spielbericht erfassen (MDU 4er-Bogen, online)
// ============================================================

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canUploadMatchReport } from '@/lib/auth/roles';
import {
  TEAMS, findTeam, getCurrentSeason, getVenueForTeamInSeason,
  getRankedRosterForTeam, getPlayerDisplayName, getCaptainForTeamInSeason,
} from '@/lib/data';
import { getRegistrationSeason, getActiveSeason } from '@/lib/supabase/seasons';
import {
  GAME_SCHEDULE, LEG_RESULTS, computeTotals,
  createReport, updateReport, submitReport, notifyReportChange,
  getReport, getReportPlayers, getReportGames,
  computePlayerRanking,
  type ReportPlayer, type ReportGame, type ReportHeaderDraft, type LegResult,
} from '@/lib/supabase/match-reports';

const LEAGUES = ['La-Liga', 'A-Liga', 'B-Liga', 'C-Liga', 'D-Liga'];
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8]; // 4 Starter + bis zu 4 Wechsel
const SEASON = getCurrentSeason();
const TEAM_OPTIONS = [...TEAMS].map(t => ({ id: t.id, name: t.name })).sort((a, b) => a.name.localeCompare(b.name, 'de'));

interface RosterOption { id: string; name: string; isCaptain: boolean }
function rosterOptions(teamId: string | null | undefined): RosterOption[] {
  if (!teamId) return [];
  return getRankedRosterForTeam(teamId, SEASON.id).map(e => ({
    id: e.player.id, name: getPlayerDisplayName(e.player), isCaptain: e.isCaptain,
  }));
}

function emptyPlayers(side: 'home' | 'guest'): ReportPlayer[] {
  return SLOTS.map(slot => ({ side, slot, pass_no: '', name: '', player_id: null, points: 0 }));
}
function emptyGames(): ReportGame[] {
  return GAME_SCHEDULE.map(s => ({
    game_no: s.no, game_type: s.type,
    home_slot: s.homeSlot ?? null, guest_slot: s.guestSlot ?? null,
    home_slot2: null, guest_slot2: null, legs_home: null, legs_guest: null,
  }));
}
function legToResult(g: ReportGame): LegResult | '' {
  if (g.legs_home == null || g.legs_guest == null) return '';
  return `${g.legs_home}:${g.legs_guest}` as LegResult;
}

export default function SpielberichtePage() {
  return (
    <Suspense fallback={<MemberShell title="Spielbericht erfassen"><Muted>Lade …</Muted></MemberShell>}>
      <SpielberichteInner />
    </Suspense>
  );
}

function SpielberichteInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = canUploadMatchReport(user, user?.teamId ?? '') || (user?.role === 'team_captain') || (user ? user.role === 'league_admin' || user.role === 'super_admin' : false);

  const [regId, setRegId] = useState<string | null>(null);
  const [seasonId, setSeasonId] = useState<string>('');
  const [header, setHeader] = useState<ReportHeaderDraft>({
    season_id: null, league_label: '', matchday: null, match_date: null, venue: '',
    home_team_id: null, guest_team_id: null, home_team_name: '', guest_team_name: '',
    tc_home: '', tc_guest: '', protest: false, protest_note: '',
  });
  const [homePlayers, setHomePlayers] = useState<ReportPlayer[]>(emptyPlayers('home'));
  const [guestPlayers, setGuestPlayers] = useState<ReportPlayer[]>(emptyPlayers('guest'));
  const [games, setGames] = useState<ReportGame[]>(emptyGames());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  const isAdminRole = user?.role === 'league_admin' || user?.role === 'super_admin';
  // Admin bearbeitet fremden Bericht → Kapitäne benachrichtigen.
  const adminEditsForeign = isAdminRole && !!ownerId && ownerId !== user?.id;
  // Gegner-Kapitän (nicht Eigentümer, kein Admin) → nur Lese-Ansicht.
  const readOnly = !!ownerId && ownerId !== user?.id && !isAdminRole;

  const totals = useMemo(() => computeTotals(games), [games]);
  const ranking = useMemo(
    () => computePlayerRanking(games, [...homePlayers, ...guestPlayers], header.home_team_name || 'Heim', header.guest_team_name || 'Gast'),
    [games, homePlayers, guestPlayers, header.home_team_name, header.guest_team_name],
  );
  const homeRoster = useMemo(() => rosterOptions(header.home_team_id), [header.home_team_id]);
  const guestRoster = useMemo(() => rosterOptions(header.guest_team_id), [header.guest_team_id]);
  const isCaptainFixed = user?.role === 'team_captain' && !!user?.teamId;

  function onHomeTeam(id: string) {
    const t = findTeam(id);
    const v = (getVenueForTeamInSeason(id, SEASON.id) as { name?: string } | null)?.name ?? '';
    setHeader(h => ({ ...h, home_team_id: id || null, home_team_name: t?.name ?? '', venue: v }));
    setHomePlayers(emptyPlayers('home'));
  }
  function onGuestTeam(id: string) {
    const t = findTeam(id);
    const captain = id ? (getCaptainForTeamInSeason(id, SEASON.id) ?? '') : '';
    setHeader(h => ({ ...h, guest_team_id: id || null, guest_team_name: t?.name ?? '', tc_guest: captain }));
    setGuestPlayers(emptyPlayers('guest'));
  }

  // Laden: bestehenden Bericht (?id=…) ODER neues Formular mit Defaults.
  // Reagiert auf id-Wechsel (auch bei In-Page-Navigation aus der Liste).
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    (async () => {
      if (idParam) {
        await loadExisting(idParam);
      } else {
        const s = (await getRegistrationSeason()) ?? (await getActiveSeason());
        if (cancelled) return;
        const teamName = user?.teamId ? (findTeam(user.teamId)?.name ?? '') : '';
        const venue = user?.teamId ? ((getVenueForTeamInSeason(user.teamId, SEASON.id) as { name?: string } | null)?.name ?? '') : '';
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        setRegId(null);
        setSeasonId(s?.id ?? '');
        setHeader({
          season_id: s?.id ?? null, league_label: '', matchday: null, match_date: today, venue,
          home_team_id: user?.teamId ?? null, guest_team_id: null, home_team_name: teamName, guest_team_name: '',
          tc_home: user?.displayName ?? '', tc_guest: '', protest: false, protest_note: '',
        });
        setHomePlayers(emptyPlayers('home'));
        setGuestPlayers(emptyPlayers('guest'));
        setGames(emptyGames());
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, idParam]);

  async function loadExisting(id: string) {
    const r = await getReport(id);
    if (!r) return;
    setRegId(r.id);
    setOwnerId(r.home_captain_user_id);
    setSeasonId(r.season_id ?? '');
    setHeader({
      season_id: r.season_id, league_label: r.league_label ?? '', matchday: r.matchday, match_date: r.match_date,
      venue: r.venue ?? '', home_team_id: r.home_team_id, guest_team_id: r.guest_team_id,
      home_team_name: r.home_team_name, guest_team_name: r.guest_team_name,
      tc_home: r.tc_home ?? '', tc_guest: r.tc_guest ?? '', protest: r.protest, protest_note: r.protest_note ?? '',
    });
    const ps = await getReportPlayers(id);
    const gs = await getReportGames(id);
    setHomePlayers(SLOTS.map(slot => ps.find(p => p.side === 'home' && p.slot === slot) ?? { side: 'home', slot, pass_no: '', name: '', player_id: null, points: 0 }));
    setGuestPlayers(SLOTS.map(slot => ps.find(p => p.side === 'guest' && p.slot === slot) ?? { side: 'guest', slot, pass_no: '', name: '', player_id: null, points: 0 }));
    setGames(GAME_SCHEDULE.map(s => gs.find(g => g.game_no === s.no) ?? { game_no: s.no, game_type: s.type, home_slot: s.homeSlot ?? null, guest_slot: s.guestSlot ?? null, home_slot2: null, guest_slot2: null, legs_home: null, legs_guest: null }));
  }

  function setH<K extends keyof ReportHeaderDraft>(k: K, v: ReportHeaderDraft[K]) { setHeader(h => ({ ...h, [k]: v })); }
  function setGameLegs(no: number, res: string) {
    setGames(arr => arr.map(g => {
      if (g.game_no !== no) return g;
      if (!res) return { ...g, legs_home: null, legs_guest: null };
      const [a, b] = res.split(':').map(Number);
      return { ...g, legs_home: a, legs_guest: b };
    }));
  }
  function setGameSlot(no: number, field: 'home_slot' | 'guest_slot' | 'home_slot2' | 'guest_slot2', v: number | null) {
    setGames(arr => arr.map(g => g.game_no === no ? { ...g, [field]: v } : g));
  }

  // aktive (in der Aufstellung gewählte) Slots je Seite
  function activeSlots(side: 'home' | 'guest'): number[] {
    return (side === 'home' ? homePlayers : guestPlayers).filter(p => p.name.trim()).map(p => p.slot);
  }

  /**
   * Erlaubte Spieler-Slots für ein Einzel an fester Position:
   *  • der Startspieler dieser Position
   *  • Wechselspieler (5–8), die noch ungebunden ODER genau an diese Position gebunden sind
   * (Wechselspieler bindet sich beim ersten Einsatz fest an eine Position.)
   */
  function singlesAllowed(side: 'home' | 'guest', position: number): number[] {
    const subPos = new Map<number, Set<number>>();
    for (const g of games) {
      if (g.game_type !== 'single') continue;
      const sch = GAME_SCHEDULE.find(s => s.no === g.game_no);
      const pos = side === 'home' ? sch?.homeSlot : sch?.guestSlot;
      const slot = side === 'home' ? g.home_slot : g.guest_slot;
      if (pos == null || slot == null || slot <= 4) continue;
      if (!subPos.has(slot)) subPos.set(slot, new Set());
      subPos.get(slot)!.add(pos);
    }
    return activeSlots(side).filter(slot => {
      if (slot === position) return true;       // Startspieler dieser Position
      if (slot <= 4) return false;              // andere Startspieler nicht erlaubt
      const ps = subPos.get(slot);              // Wechselspieler
      if (!ps || ps.size === 0) return true;    // noch ungebunden
      return ps.size === 1 && ps.has(position); // fest an genau diese Position gebunden
    });
  }

  /** Erlaubte Slots für ein Doppel: aktiv, nicht der Partner, nicht im anderen Doppel verwendet. */
  function doublesAllowed(side: 'home' | 'guest', currentGameNo: number, partnerSlot: number | null): number[] {
    const usedElsewhere = new Set<number>();
    for (const g of games) {
      if (g.game_type !== 'double' || g.game_no === currentGameNo) continue;
      const slots = side === 'home' ? [g.home_slot, g.home_slot2] : [g.guest_slot, g.guest_slot2];
      slots.forEach(s => { if (s != null) usedElsewhere.add(s); });
    }
    return activeSlots(side).filter(s => s !== partnerSlot && !usedElsewhere.has(s));
  }

  function playerName(side: 'home' | 'guest', slot: number | null): string {
    if (slot == null) return '?';
    const arr = side === 'home' ? homePlayers : guestPlayers;
    return arr.find(p => p.slot === slot)?.name.trim() || `${side === 'home' ? 'H' : 'G'}${slot}`;
  }

  function validate(): string | null {
    if (!header.league_label) return 'Bitte Liga wählen.';
    if (!header.home_team_name.trim() || !header.guest_team_name.trim()) return 'Bitte Heim- und Gastmannschaft angeben.';
    if (!header.match_date) return 'Bitte Datum angeben.';
    for (let i = 1; i <= 4; i++) {
      if (!homePlayers.find(p => p.slot === i)?.name.trim()) return `Bitte Heimspieler H${i} angeben.`;
      if (!guestPlayers.find(p => p.slot === i)?.name.trim()) return `Bitte Gastspieler G${i} angeben.`;
    }
    if (games.some(g => g.legs_home == null)) return 'Bitte alle 18 Spielergebnisse eintragen.';
    return null;
  }

  async function persist(): Promise<string | null> {
    const players = [...homePlayers, ...guestPlayers];
    const payload: ReportHeaderDraft = { ...header, season_id: seasonId || header.season_id };
    if (regId) {
      const { error } = await updateReport(regId, payload, players, games);
      if (error) { setMsg({ kind: 'err', text: error }); return null; }
      return regId;
    }
    const { id, error } = await createReport(payload, players, games);
    if (error || !id) { setMsg({ kind: 'err', text: error ?? 'Speichern fehlgeschlagen.' }); return null; }
    setRegId(id);
    return id;
  }

  async function onSaveDraft() {
    setBusy(true); setMsg(null);
    const id = await persist();
    if (id && adminEditsForeign) await notifyReportChange(id, 'changed');
    setBusy(false);
    if (id) setMsg({ kind: 'ok', text: 'Als Entwurf gespeichert.' });
  }
  async function onSubmit() {
    const v = validate();
    if (v) { setMsg({ kind: 'err', text: v }); return; }
    setBusy(true); setMsg(null);
    const id = await persist();
    if (!id) { setBusy(false); return; }
    const { error } = await submitReport(id);
    if (!error && adminEditsForeign) await notifyReportChange(id, 'changed');
    setBusy(false);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    router.push(adminEditsForeign ? '/admin/spielberichte' : '/mein-bereich');
  }

  return (
    <MemberShell title="Spielbericht erfassen">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Spielberichte sind nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Spielberichte erfassen dürfen Teamkapitäne und die Ligaleitung.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            {msg && <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>}

            {readOnly && (
              <div style={{ padding: '11px 15px', borderRadius: 10, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                Nur-Lese-Ansicht (du bist die Gastmannschaft). Zum Bestätigen oder Ändern zurück zur Übersicht.
              </div>
            )}

            <fieldset disabled={readOnly} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Kopf */}
            <Section title="Spielbericht – Kopfdaten">
              <Row2>
                <Field label="Liga *">
                  <select value={header.league_label ?? ''} onChange={e => setH('league_label', e.target.value)} style={input}>
                    <option value="">— wählen —</option>
                    {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Spieltag-Nr."><input type="number" value={header.matchday ?? ''} onChange={e => setH('matchday', e.target.value ? Number(e.target.value) : null)} style={input} /></Field>
              </Row2>
              <Row2>
                <Field label="Datum *"><input type="date" value={header.match_date ?? ''} onChange={e => setH('match_date', e.target.value || null)} style={input} /></Field>
                <Field label="Spielort"><input value={header.venue ?? ''} onChange={e => setH('venue', e.target.value)} style={input} /></Field>
              </Row2>
              <Row2>
                <Field label="Heimmannschaft *">
                  {isCaptainFixed ? (
                    <input value={header.home_team_name} disabled style={{ ...input, opacity: 0.7 }} />
                  ) : (
                    <select value={header.home_team_id ?? ''} onChange={e => onHomeTeam(e.target.value)} style={input}>
                      <option value="">— wählen —</option>
                      {TEAM_OPTIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  )}
                </Field>
                <Field label="Gastmannschaft *">
                  <select value={header.guest_team_id ?? ''} onChange={e => onGuestTeam(e.target.value)} style={input}>
                    <option value="">— wählen —</option>
                    {TEAM_OPTIONS.filter(t => t.id !== header.home_team_id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </Field>
              </Row2>
              <Row2>
                <Field label="TC Heim"><input value={header.tc_home ?? ''} onChange={e => setH('tc_home', e.target.value)} style={input} /></Field>
                <Field label="TC Gast">
                  <input value={header.tc_guest ?? ''} onChange={e => setH('tc_guest', e.target.value)} style={input} />
                  {header.guest_team_id && !header.tc_guest?.trim() && (
                    <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, color: 'var(--th-gold)' }}>Kein Teamkapitän hinterlegt</span>
                  )}
                </Field>
              </Row2>
            </Section>

            {/* Aufstellung */}
            <Section title="Aufstellung (H1–H8 / G1–G8 · Position 1–4 startet, 5–8 Wechsel)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Lineup label="Heim" players={homePlayers} setPlayers={setHomePlayers} prefix="H" options={homeRoster} teamChosen={!!header.home_team_id} />
                <Lineup label="Gast" players={guestPlayers} setPlayers={setGuestPlayers} prefix="G" options={guestRoster} teamChosen={!!header.guest_team_id} />
              </div>
            </Section>

            {/* Spiele */}
            <Section title="Spiele (Best of 3 Legs)">
              {GAME_SCHEDULE.map((s, i) => {
                const g = games[i];
                const showRound = i === 0 || GAME_SCHEDULE[i - 1].round !== s.round;
                return (
                  <div key={s.no}>
                    {showRound && <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)', margin: '10px 0 4px' }}>{s.round}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--th-line-4)' }}>
                      <span style={{ width: 22, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: 'var(--th-text-faint)' }}>{s.no}</span>
                      {s.type === 'single' ? (
                        <span className="mdu-mr-single">
                          <SlotSel value={g.home_slot} onChange={v => setGameSlot(s.no, 'home_slot', v)} prefix="H" players={homePlayers} allowedSlots={singlesAllowed('home', s.homeSlot!)} />
                          <span className="mdu-mr-vs">vs</span>
                          <SlotSel value={g.guest_slot} onChange={v => setGameSlot(s.no, 'guest_slot', v)} prefix="G" players={guestPlayers} allowedSlots={singlesAllowed('guest', s.guestSlot!)} />
                        </span>
                      ) : (
                        <span className="mdu-mr-double">
                          <span className="mdu-mr-pair">
                            <SlotSel value={g.home_slot} onChange={v => setGameSlot(s.no, 'home_slot', v)} prefix="H" players={homePlayers} allowedSlots={doublesAllowed('home', s.no, g.home_slot2)} />
                            <SlotSel value={g.home_slot2} onChange={v => setGameSlot(s.no, 'home_slot2', v)} prefix="H" players={homePlayers} allowedSlots={doublesAllowed('home', s.no, g.home_slot)} />
                          </span>
                          <span className="mdu-mr-vs">vs</span>
                          <span className="mdu-mr-pair">
                            <SlotSel value={g.guest_slot} onChange={v => setGameSlot(s.no, 'guest_slot', v)} prefix="G" players={guestPlayers} allowedSlots={doublesAllowed('guest', s.no, g.guest_slot2)} />
                            <SlotSel value={g.guest_slot2} onChange={v => setGameSlot(s.no, 'guest_slot2', v)} prefix="G" players={guestPlayers} allowedSlots={doublesAllowed('guest', s.no, g.guest_slot)} />
                          </span>
                        </span>
                      )}
                      <select value={legToResult(g)} onChange={e => setGameLegs(s.no, e.target.value)} style={{ ...input, width: 80, padding: '7px 8px' }}>
                        <option value="">—</option>
                        {LEG_RESULTS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </Section>

            {/* Ergebnis (auto) */}
            <Section title="Ergebnis (automatisch berechnet)">
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-strong)' }}>
                <ResultBox label="Spiele" h={totals.spieleHome} g={totals.spieleGuest} />
                <ResultBox label="Legs" h={totals.legsHome} g={totals.legsGuest} />
                <ResultBox label="Punkte" h={totals.pointsHome} g={totals.pointsGuest} />
              </div>
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 8 }}>
                Einzelspieler-Punkte fließen in die Einzelrangliste (nur Einzelspiele). Doppel zählen für Spiele/Legs.
              </p>
            </Section>

            {/* Einzelranglisten-Auswertung (live) */}
            <Section title="Einzelranglisten-Auswertung">
              {ranking.length === 0 ? (
                <Muted>Sobald Einzelergebnisse eingetragen sind, erscheint hier die Auswertung.</Muted>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-manrope)', fontSize: 12, tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--th-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '4px 4px', width: 'auto' }}>Spieler</th>
                      <th style={{ padding: '4px 2px', width: 34, textAlign: 'center' }}>Sp.</th>
                      <th style={{ padding: '4px 2px', width: 24, textAlign: 'center' }}>S</th>
                      <th style={{ padding: '4px 2px', width: 24, textAlign: 'center' }}>N</th>
                      <th style={{ padding: '4px 2px', width: 46, textAlign: 'center' }}>Legs</th>
                      <th style={{ padding: '4px 4px', width: 40, textAlign: 'center' }}>Pkt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map(r => (
                      <tr key={r.side + r.slot} style={{ borderTop: '1px solid var(--th-line-4)' }}>
                        <td style={{ padding: '6px 4px', maxWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--th-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.team}</div>
                        </td>
                        <td style={{ padding: '6px 2px', textAlign: 'center' }}>{r.singles}</td>
                        <td style={{ padding: '6px 2px', textAlign: 'center' }}>{r.wins}</td>
                        <td style={{ padding: '6px 2px', textAlign: 'center' }}>{r.losses}</td>
                        <td style={{ padding: '6px 2px', textAlign: 'center', whiteSpace: 'nowrap' }}>{r.legsWon}:{r.legsLost}</td>
                        <td style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 800, color: 'var(--th-accent)' }}>{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: 0 }}>Nur Einzelspiele · Punkte dem tatsächlich eingesetzten Spieler zugeordnet (inkl. Auswechslungen).</p>
            </Section>

            <Section title="Protest">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                <input type="checkbox" checked={header.protest} onChange={e => setH('protest', e.target.checked)} /> Protest eingelegt
              </label>
              {header.protest && <textarea value={header.protest_note ?? ''} onChange={e => setH('protest_note', e.target.value)} rows={2} placeholder="Anmerkung zum Protest" style={{ ...input, marginTop: 8, resize: 'vertical' }} />}
            </Section>

            </fieldset>

            {readOnly ? (
              <Link href="/mein-bereich/spielberichte/uebersicht" style={{ ...ghost, display: 'inline-flex', alignItems: 'center', textDecoration: 'none', alignSelf: 'flex-start' }}>Zurück zur Übersicht</Link>
            ) : (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={onSaveDraft} disabled={busy} style={ghost}>Als Entwurf speichern</button>
                <button type="button" onClick={onSubmit} disabled={busy} style={primary}>{busy ? 'Bitte warten …' : 'Spielbericht absenden'}</button>
                <Link href="/mein-bereich/spielberichte/uebersicht" style={{ ...ghost, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Zur Übersicht</Link>
              </div>
            )}
          </div>
        )}
    </MemberShell>
  );
}

// ── kleine Bausteine ───────────────────────────────────────────

function Lineup({ label, players, setPlayers, prefix, options, teamChosen }: {
  label: string; players: ReportPlayer[];
  setPlayers: (f: (a: ReportPlayer[]) => ReportPlayer[]) => void;
  prefix: string; options: RosterOption[]; teamChosen: boolean;
}) {
  function pick(slot: number, id: string) {
    const opt = options.find(o => o.id === id);
    setPlayers(arr => arr.map(x => x.slot === slot ? { ...x, player_id: id || null, name: opt ? opt.name : '' } : x));
  }
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, color: 'var(--th-accent)', marginBottom: 6 }}>{label}</div>
      {!teamChosen && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginBottom: 6 }}>Bitte zuerst Mannschaft wählen.</div>}
      {players.map(p => {
        const usedByOthers = new Set(players.filter(x => x.slot !== p.slot && x.player_id).map(x => x.player_id));
        return (
          <div key={p.slot} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ width: 26, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: p.slot <= 4 ? 'var(--th-text-body)' : 'var(--th-text-faint)' }}>{prefix}{p.slot}</span>
            <select value={p.player_id ?? ''} onChange={e => pick(p.slot, e.target.value)} disabled={!teamChosen} style={{ ...input, flex: 1, padding: '7px 9px', opacity: teamChosen ? 1 : 0.6 }}>
              <option value="">{p.slot <= 4 ? '— Spieler wählen * —' : '— Wechsel (optional) —'}</option>
              {options.map(o => <option key={o.id} value={o.id} disabled={usedByOthers.has(o.id)}>{o.name}{o.isCaptain ? ' (C)' : ''}{usedByOthers.has(o.id) ? ' — bereits gewählt' : ''}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function SlotSel({ value, onChange, prefix, players, allowedSlots }: { value: number | null; onChange: (v: number | null) => void; prefix: string; players: ReportPlayer[]; allowedSlots?: number[] }) {
  const named = players.filter(p => p.name.trim() && (!allowedSlots || allowedSlots.includes(p.slot) || p.slot === value));
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} style={{ ...input, flex: 1, minWidth: 0, width: '100%', padding: '6px 8px' }}>
      <option value="">{prefix}?</option>
      {named.map(p => <option key={p.slot} value={p.slot}>{prefix}{p.slot} · {p.name}</option>)}
    </select>
  );
}

function ResultBox({ label, h, g }: { label: string; h: number; g: number }) {
  return (
    <div style={{ background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--th-text-faint)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 22, color: 'var(--th-text-strong)' }}>{h}:{g}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.14em', color: 'var(--th-accent)', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-body)', marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const input: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)',
  borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none',
};
const ghost: React.CSSProperties = { padding: '12px 22px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
const primary: React.CSSProperties = { padding: '12px 28px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 };
