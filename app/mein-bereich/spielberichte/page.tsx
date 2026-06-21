'use client';

// ============================================================
// Mein Bereich — Spielbericht erfassen (MDU 4er-Bogen, online)
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { canUploadMatchReport } from '@/lib/auth/roles';
import { findTeam } from '@/lib/data';
import { getRegistrationSeason, getActiveSeason } from '@/lib/supabase/seasons';
import {
  GAME_SCHEDULE, LEG_RESULTS, REPORT_STATUS_LABELS, computeTotals,
  createReport, updateReport, submitReport, listMyReports,
  getReport, getReportPlayers, getReportGames,
  type ReportPlayer, type ReportGame, type ReportHeaderDraft, type MatchReport, type LegResult,
} from '@/lib/supabase/match-reports';

const LEAGUES = ['La-Liga', 'A-Liga', 'B-Liga', 'C-Liga', 'D-Liga'];
const SLOTS = [1, 2, 3, 4, 5, 6];

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
  const [rows, setRows] = useState<MatchReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const didInit = useRef(false);

  const totals = useMemo(() => computeTotals(games), [games]);

  // Saison + Liste laden, Heim-Team vorbelegen
  useEffect(() => {
    if (!allowed) return;
    (async () => {
      const s = (await getRegistrationSeason()) ?? (await getActiveSeason());
      const id = new URLSearchParams(window.location.search).get('id');
      if (id) await loadExisting(id);
      else if (!didInit.current) {
        didInit.current = true;
        const teamName = user?.teamId ? (findTeam(user.teamId)?.name ?? '') : '';
        setSeasonId(s?.id ?? '');
        setHeader(h => ({ ...h, season_id: s?.id ?? null, home_team_id: user?.teamId ?? null, home_team_name: teamName }));
      }
      setRows(await listMyReports());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  async function loadExisting(id: string) {
    const r = await getReport(id);
    if (!r) return;
    setRegId(r.id);
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
    setBusy(false);
    if (id) { setMsg({ kind: 'ok', text: 'Als Entwurf gespeichert.' }); setRows(await listMyReports()); }
  }
  async function onSubmit() {
    const v = validate();
    if (v) { setMsg({ kind: 'err', text: v }); return; }
    setBusy(true); setMsg(null);
    const id = await persist();
    if (!id) { setBusy(false); return; }
    const { error } = await submitReport(id);
    setBusy(false);
    if (error) { setMsg({ kind: 'err', text: error }); return; }
    router.push('/mein-bereich');
  }

  return (
    <MemberShell title="Spielbericht erfassen">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Spielberichte sind nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Spielberichte erfassen dürfen Teamkapitäne und die Ligaleitung.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            {msg && <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'rgba(34,197,94,0.10)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'rgba(34,197,94,0.35)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{msg.text}</div>}

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
                <Field label="Heimmannschaft *"><input value={header.home_team_name} onChange={e => setH('home_team_name', e.target.value)} style={input} /></Field>
                <Field label="Gastmannschaft *"><input value={header.guest_team_name} onChange={e => setH('guest_team_name', e.target.value)} style={input} /></Field>
              </Row2>
              <Row2>
                <Field label="TC Heim"><input value={header.tc_home ?? ''} onChange={e => setH('tc_home', e.target.value)} style={input} /></Field>
                <Field label="TC Gast"><input value={header.tc_guest ?? ''} onChange={e => setH('tc_guest', e.target.value)} style={input} /></Field>
              </Row2>
            </Section>

            {/* Aufstellung */}
            <Section title="Aufstellung (H1–H6 / G1–G6, Position 1–4 spielt)">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Lineup label="Heim" players={homePlayers} setPlayers={setHomePlayers} prefix="H" />
                <Lineup label="Gast" players={guestPlayers} setPlayers={setGuestPlayers} prefix="G" />
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
                        <span style={{ flex: 1, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {playerName('home', g.home_slot)} <span style={{ color: 'var(--th-text-faint)' }}>vs</span> {playerName('guest', g.guest_slot)}
                        </span>
                      ) : (
                        <span style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontFamily: 'var(--font-manrope)', fontSize: 12 }}>
                          <strong style={{ color: 'var(--th-accent)' }}>Doppel</strong>
                          <SlotSel value={g.home_slot} onChange={v => setGameSlot(s.no, 'home_slot', v)} prefix="H" />
                          <SlotSel value={g.home_slot2} onChange={v => setGameSlot(s.no, 'home_slot2', v)} prefix="H" />
                          <span style={{ color: 'var(--th-text-faint)' }}>vs</span>
                          <SlotSel value={g.guest_slot} onChange={v => setGameSlot(s.no, 'guest_slot', v)} prefix="G" />
                          <SlotSel value={g.guest_slot2} onChange={v => setGameSlot(s.no, 'guest_slot2', v)} prefix="G" />
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

            <Section title="Protest">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                <input type="checkbox" checked={header.protest} onChange={e => setH('protest', e.target.checked)} /> Protest eingelegt
              </label>
              {header.protest && <textarea value={header.protest_note ?? ''} onChange={e => setH('protest_note', e.target.value)} rows={2} placeholder="Anmerkung zum Protest" style={{ ...input, marginTop: 8, resize: 'vertical' }} />}
            </Section>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={onSaveDraft} disabled={busy} style={ghost}>Als Entwurf speichern</button>
              <button type="button" onClick={onSubmit} disabled={busy} style={primary}>{busy ? 'Bitte warten …' : 'Spielbericht absenden'}</button>
            </div>

            {/* Eigene Berichte */}
            {rows && rows.length > 0 && (
              <Section title="Meine Spielberichte">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--th-line-4)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)' }}>{r.home_team_name} {r.spiele_home}:{r.spiele_guest} {r.guest_team_name}</div>
                        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)' }}>{r.league_label}{r.matchday ? ` · Spieltag ${r.matchday}` : ''}{r.match_date ? ` · ${new Date(r.match_date).toLocaleDateString('de-DE')}` : ''}</div>
                        {r.review_note && r.status === 'rejected' && <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: '#E24B4A', marginTop: 2 }}>Anmerkung: {r.review_note}</div>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: r.status === 'approved' ? 'var(--th-win)' : r.status === 'rejected' ? 'var(--th-loss)' : 'var(--th-text-muted)' }}>{REPORT_STATUS_LABELS[r.status]}</span>
                      {(r.status === 'draft' || r.status === 'rejected') && <Link href={`/mein-bereich/spielberichte?id=${r.id}`} style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12, color: 'var(--th-accent)', textDecoration: 'none' }}>Bearbeiten</Link>}
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        )}
    </MemberShell>
  );
}

// ── kleine Bausteine ───────────────────────────────────────────

function Lineup({ label, players, setPlayers, prefix }: { label: string; players: ReportPlayer[]; setPlayers: (f: (a: ReportPlayer[]) => ReportPlayer[]) => void; prefix: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, color: 'var(--th-accent)', marginBottom: 6 }}>{label}</div>
      {players.map(p => (
        <div key={p.slot} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <span style={{ width: 26, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12, color: p.slot <= 4 ? 'var(--th-text-body)' : 'var(--th-text-faint)' }}>{prefix}{p.slot}</span>
          <input value={p.name} onChange={e => setPlayers(arr => arr.map(x => x.slot === p.slot ? { ...x, name: e.target.value } : x))} placeholder={p.slot <= 4 ? 'Name *' : 'Name (Wechsel)'} style={{ ...input, flex: 1, padding: '7px 9px' }} />
        </div>
      ))}
    </div>
  );
}

function SlotSel({ value, onChange, prefix }: { value: number | null; onChange: (v: number | null) => void; prefix: string }) {
  return (
    <select value={value ?? ''} onChange={e => onChange(e.target.value ? Number(e.target.value) : null)} style={{ ...input, width: 56, padding: '6px 6px' }}>
      <option value="">{prefix}?</option>
      {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>{prefix}{s}</option>)}
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
