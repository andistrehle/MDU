'use client';

// ============================================================
// Admin — Spielberichte: alle Partien nach Spieltag mit Filtern, Bearbeiten & Löschen
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveMatchReports } from '@/lib/auth/roles';
import { findTeam } from '@/lib/data';
import { NEUE_SAISON, LIGEN_2027, alleBegegnungen27, begegnungKey, team27, findLiga27, wochenendeText, type Liga27Code, type Begegnung27 } from '@/lib/data/saison-2027';
import { ladeErfassung, WEG, WEGE, type Erfassungsweg } from '@/lib/supabase/erfassung';
import { berichtPfad } from '@/lib/spieltag';
import {
  listAllReports, deleteReport, notifyReportChange, setzeWertung,
  REPORT_STATUS_LABELS, WERTUNG_LABELS, protestErledigt, type MatchReport, type Wertung,
} from '@/lib/supabase/match-reports';
import { cleanupReportUploads, loescheSaisonFotos } from '@/lib/supabase/match-report-uploads';
import { FOTOS_AUFBEWAHREN } from '@/lib/ocr/aufbewahrung';

export default function AdminSpielberichtePage() {
  const { user } = useAuth();
  const canManage = canApproveMatchReports(user); // Ligaleitung aufwärts
  const [rows, setRows] = useState<MatchReport[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => { if (canManage) listAllReports().then(setRows); }, [canManage]);

  // Nach Liga gruppieren (sortiert), darin nach Datum absteigend.
  const groups = useMemo(() => {
    const map = new Map<string, MatchReport[]>();
    for (const r of rows ?? []) {
      const key = r.league_label || 'Ohne Liga';
      (map.get(key) ?? map.set(key, []).get(key)!).push(r);
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'de'))
      .map(([league, list]) => [league, list.sort((x, y) => (y.matchday ?? -1) - (x.matchday ?? -1) || (y.match_date ?? '').localeCompare(x.match_date ?? ''))] as const);
  }, [rows]);

  // ── Alle Partien 2026/27 (Betreiber, 25.10.2026) ──
  // Alle Begegnungen auf einmal, nach Spieltag gruppiert (begonnene Spieltage
  // zuerst, neuester oben; kommende darunter). Filter: Status (mit Anzahl),
  // Liga, Spieltag, Wochenende des echten Termins, Team-Suche, Erfassungsweg.
  const berichtJeBegegnung = useMemo(() => {
    const m = new Map<string, MatchReport>();
    for (const r of rows ?? []) if (r.season_id === NEUE_SAISON.id && r.home_team_id && r.guest_team_id) m.set(begegnungKey(r.home_team_id, r.guest_team_id), r);
    return m;
  }, [rows]);
  const [erfassung, setErfassung] = useState<Map<string, Erfassungsweg>>(new Map());
  useEffect(() => {
    if (!canManage) return;
    void ladeErfassung().then(r => setErfassung(new Map((r.data?.zeilen ?? []).map(z => [z.key, z.weg]))));
  }, [canManage, rows]);
  const heute = berlinHeute();
  const alle = useMemo(() => alleBegegnungen27().map(b => {
    const r = berichtJeBegegnung.get(b.key) ?? null;
    const datum = b.termin?.datum ?? b.fri;
    const vorbei = (b.termin?.datum ?? b.sun) < heute;
    const st: PStatus = !r || r.status === 'draft' ? (vorbei ? 'fehlt' : 'kommend')
      : r.forfeit ? 'wertung' : r.status === 'confirmed' ? 'bestaetigt' : 'eingereicht';
    const ueberfaellig = st === 'fehlt' && heute > fristFuer(datum);
    const protestOffen = !!r?.protest && r.status !== 'draft' && !r.protest_handled_at;
    const problem = ueberfaellig || st === 'wertung' || r?.status === 'changes_requested' || protestOffen;
    return { b, r, datum, st, ueberfaellig, problem, woche: wocheVon(datum), weg: erfassung.get(b.key) ?? null };
  }), [berichtJeBegegnung, erfassung, heute]);

  const [fStatus, setFStatus] = useState<StatusFilter>('alle');
  // Direktlink aus Glocke/E-Mail/Hinweis: ?status=problem
  useEffect(() => {
    const st = new URLSearchParams(window.location.search).get('status');
    if (st && STATUS_FILTER.some(f => f.key === st)) queueMicrotask(() => setFStatus(st as StatusFilter));
  }, []);
  async function onProtestErledigt(r: MatchReport) {
    const notiz = prompt(`Protest ${r.home_team_name} – ${r.guest_team_name} als erledigt markieren.\n\nKurze Notiz (z. B. Entscheidung), optional:`);
    if (notiz === null) return;
    setBusy(r.id);
    const { error } = await protestErledigt(r.id, notiz);
    setBusy(null);
    if (error) { alert(error); return; }
    setRows(await listAllReports());
  }
  const [fLiga, setFLiga] = useState<Liga27Code | 'alle'>('alle');
  const [fSpieltag, setFSpieltag] = useState<number | 0>(0);
  const [fWoche, setFWoche] = useState('');
  const [fTeam, setFTeam] = useState('');
  const [fWeg, setFWeg] = useState<Erfassungsweg | ''>('');
  const wochen = useMemo(() => [...new Set(alle.map(x => x.woche))].sort(), [alle]);
  const spieltage = useMemo(() => [...new Set(alle.map(x => x.b.spieltag))].sort((a, b) => a - b), [alle]);
  // Alle Filter außer Status — die Status-Knöpfe zählen darauf.
  const vorStatus = useMemo(() => {
    const q = normal(fTeam);
    return alle.filter(x => (fLiga === 'alle' || x.b.liga === fLiga)
      && (!fSpieltag || x.b.spieltag === fSpieltag)
      && (!fWoche || x.woche === fWoche)
      && (!q || normal(team27(x.b.home)?.name ?? x.b.home).includes(q) || normal(team27(x.b.away)?.name ?? x.b.away).includes(q))
      && (!fWeg || x.weg === fWeg));
  }, [alle, fLiga, fSpieltag, fWoche, fTeam, fWeg]);
  const passt = (x: (typeof alle)[number], f: StatusFilter) => f === 'alle' || (f === 'problem' ? x.problem : x.st === f);
  const zahl = (f: StatusFilter) => vorStatus.filter(x => passt(x, f)).length;
  const gruppen = useMemo(() => {
    const m = new Map<number, typeof alle>();
    for (const x of vorStatus.filter(x => passt(x, fStatus))) (m.get(x.b.spieltag) ?? m.set(x.b.spieltag, []).get(x.b.spieltag)!).push(x);
    const ligaPos = (c: string) => LIGEN_2027.findIndex(l => l.code === c);
    const begonnen = (st: number) => alle.some(x => x.b.spieltag === st && x.b.fri <= heute);
    return [...m.entries()]
      .sort(([a], [b]) => (begonnen(b) ? 1 : 0) - (begonnen(a) ? 1 : 0) || (begonnen(a) ? b - a : a - b))
      .map(([st, list]) => ({ st, begonnen: begonnen(st), list: list.sort((x, y) => ligaPos(x.b.liga) - ligaPos(y.b.liga) || x.datum.localeCompare(y.datum) || (x.b.termin?.uhrzeit ?? '').localeCompare(y.b.termin?.uhrzeit ?? '')) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vorStatus, fStatus, alle, heute]);
  const filterAktiv = fStatus !== 'alle' || fLiga !== 'alle' || !!fSpieltag || !!fWoche || !!fTeam || !!fWeg;

  // ── Wertung (Nichtantritt / kein Bericht) ──
  const begegnungen = useMemo(() => alleBegegnungen27(), []);
  const [wKey, setWKey] = useState('');
  const [wArt, setWArt] = useState<Wertung>('guest_no_show');
  const [wMsg, setWMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  async function onWertung() {
    const b = begegnungen.find(x => x.key === wKey);
    if (!b) { setWMsg({ kind: 'err', text: 'Bitte die Begegnung wählen.' }); return; }
    const heim = team27(b.home)?.name ?? b.home, gast = team27(b.away)?.name ?? b.away;
    const folge = wArt === 'no_report' ? `${heim} verliert 0:3 / 0:18.`
      : `${wArt === 'home_no_show' ? heim : gast} verliert 0:3 / 0:18 und bekommt 3 Punkte abgezogen.`;
    if (!confirm(`${heim} – ${gast}\n${WERTUNG_LABELS[wArt]}\n\n${folge}\nBeide Kapitäne werden benachrichtigt.`)) return;
    setBusy('wertung'); setWMsg(null);
    const { error } = await setzeWertung({
      seasonId: NEUE_SAISON.id, leagueLabel: findLiga27(b.liga)?.name ?? b.liga, matchday: b.spieltag,
      date: b.termin?.datum ?? b.fri, homeId: b.home, homeName: heim, guestId: b.away, guestName: gast,
    }, wArt);
    setBusy(null);
    if (error) { setWMsg({ kind: 'err', text: error }); return; }
    setWMsg({ kind: 'ok', text: `Gewertet: ${heim} – ${gast} (${WERTUNG_LABELS[wArt]}).` });
    setWKey('');
    setRows(await listAllReports());
  }

  async function onPurge() {
    if (!confirm(`Alle noch gespeicherten Spielbericht-Fotos der ${NEUE_SAISON.name} löschen?\n\nDie Spielberichte selbst (Ergebnisse, Aufstellungen) bleiben. Das lässt sich nicht rückgängig machen.`)) return;
    setBusy('purge'); setWMsg(null);
    const r = await loescheSaisonFotos(NEUE_SAISON.id);
    setBusy(null);
    setWMsg(r.error ? { kind: 'err', text: r.error } : { kind: 'ok', text: `${r.deleted} Foto${r.deleted === 1 ? '' : 's'} gelöscht.` });
  }

  async function onDelete(r: MatchReport) {
    if (!confirm(`Spielbericht ${r.home_team_name} – ${r.guest_team_name} wirklich löschen? Die Kapitäne werden benachrichtigt.`)) return;
    setBusy(r.id);
    await notifyReportChange(r.id, 'deleted'); // vor dem Löschen (Team-Infos noch lesbar)
    await cleanupReportUploads(r.id); // hochgeladene Original-Fotos mitlöschen (Verknüpfung besteht noch)
    const { error } = await deleteReport(r.id);
    setBusy(null);
    if (error) { alert(error); return; }
    setRows(await listAllReports());
  }

  return (
    <AdminGuard title="Spielberichte" subtitle="Jede Partie prüfen, bearbeiten, löschen oder einen Bericht nachtragen.">
      {/* Alle Partien 2026/27 */}
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', marginBottom: 22, maxWidth: 1040 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', marginRight: 'auto' }}>Alle Partien {NEUE_SAISON.kurz}</div>
          <Link href="/mein-bereich/spielberichte?from=admin" style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--th-accent)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5 }}>＋ Neuer Spielbericht</Link>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUS_FILTER.map(f => (
            <button key={f.key} type="button" onClick={() => setFStatus(f.key)} style={chip(fStatus === f.key, f.farbe)}>
              {f.label} <span style={{ opacity: 0.75 }}>{rows === null ? '' : zahl(f.key)}</span>
            </button>
          ))}
        </div>
        {/* Liga */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {([{ code: 'alle', name: 'Alle Ligen' }, ...LIGEN_2027] as { code: Liga27Code | 'alle'; name: string }[]).map(l => (
            <button key={l.code} type="button" onClick={() => setFLiga(l.code)} style={chip(fLiga === l.code)}>{l.name}</button>
          ))}
        </div>
        {/* Spieltag, Wochenende, Erfassungsweg, Team */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <select value={fSpieltag} onChange={e => setFSpieltag(Number(e.target.value))} style={sel} aria-label="Spieltag">
            <option value={0}>Alle Spieltage</option>
            {spieltage.map(n => <option key={n} value={n}>{n}. Spieltag</option>)}
          </select>
          <select value={fWoche} onChange={e => setFWoche(e.target.value)} style={sel} aria-label="Wochenende">
            <option value="">Alle Wochenenden</option>
            {wochen.map(w => <option key={w} value={w}>{wocheText(w)}</option>)}
          </select>
          <select value={fWeg} onChange={e => setFWeg(e.target.value as Erfassungsweg | '')} style={sel} aria-label="Erfassungsweg">
            <option value="">Jeder Erfassungsweg</option>
            {WEGE.map(w => <option key={w} value={w}>{WEG[w].icon} {WEG[w].label}</option>)}
          </select>
          <input value={fTeam} onChange={e => setFTeam(e.target.value)} placeholder="Team suchen …" style={{ ...sel, flex: '1 1 180px' }} aria-label="Team suchen" />
          {filterAktiv && (
            <button type="button" onClick={() => { setFStatus('alle'); setFLiga('alle'); setFSpieltag(0); setFWoche(''); setFTeam(''); setFWeg(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>Filter zurücksetzen</button>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {rows === null ? <p style={muted}>Lade …</p> : gruppen.length === 0 ? <p style={{ ...muted, fontSize: 13 }}>Keine Partien für diese Filter.</p> : gruppen.map(g => (
            <div key={g.st} style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderBottom: '2px solid var(--th-line-8)' }}>
                <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.04em', color: g.begonnen ? 'var(--th-accent)' : 'var(--th-text-muted)' }}>{g.st}. Spieltag</span>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontWeight: 700 }}>
                  {g.list.length} {g.list.length === 1 ? 'Partie' : 'Partien'}{!g.begonnen && ' · kommt noch'}
                </span>
              </div>
              {g.list.map(x => <PartieZeile key={x.b.key} x={x} busy={busy} onDelete={onDelete} onProtestErledigt={onProtestErledigt} />)}
            </div>
          ))}
        </div>
        <p style={{ ...muted, fontSize: 11.5, margin: '12px 0 0' }}>
          „Fehlt“ = Termin vorbei, kein eingereichter Bericht (auch wenn ein Entwurf existiert). „Problemfälle“ = überfällig (nach Dienstag 24 Uhr), Wertung, Änderung angefordert oder offener Protest (bis „Protest erledigt“).
        </p>
      </div>

      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', marginBottom: 22, maxWidth: 960 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', marginBottom: 4 }}>Begegnung werten ({NEUE_SAISON.kurz})</div>
        <p style={{ ...muted, fontSize: 12.5, margin: '0 0 12px' }}>
          Nichtantritt: 0:3 Punkte, 0:18 Spiele und 3 Punkte Abzug für das nicht angetretene Team. Kein Spielbericht bis Dienstag 24 Uhr: Heimteam verliert 0:3 / 0:18 (ohne Abzug).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={wKey} onChange={e => setWKey(e.target.value)} style={{ ...sel, flex: '1 1 320px' }}>
            <option value="">— Begegnung wählen —</option>
            {LIGEN_2027.map(l => (
              <optgroup key={l.code} label={l.name}>
                {begegnungen.filter(b => b.liga === l.code).map(b => (
                  <option key={b.key} value={b.key}>{b.spieltag}. ST ({wochenendeText(b.fri, b.sun, false)}) · {team27(b.home)?.name ?? b.home} – {team27(b.away)?.name ?? b.away}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <select value={wArt} onChange={e => setWArt(e.target.value as Wertung)} style={{ ...sel, flex: '0 1 260px' }}>
            {(Object.keys(WERTUNG_LABELS) as Wertung[]).map(k => <option key={k} value={k}>{WERTUNG_LABELS[k]}</option>)}
          </select>
          <button type="button" onClick={onWertung} disabled={busy === 'wertung'} style={{ padding: '9px 16px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-loss)', color: '#fff', border: 'none', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5 }}>
            {busy === 'wertung' ? '…' : 'Werten'}
          </button>
        </div>
        {FOTOS_AUFBEWAHREN && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--th-line-4)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ ...muted, fontSize: 12.5, flex: '1 1 300px' }}>Die Original-Fotos der Spielberichte werden bis zum Saisonende aufbewahrt. Danach hier alle auf einmal löschen.</span>
            <button type="button" onClick={onPurge} disabled={busy === 'purge'} style={{ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-loss)', border: '1px solid var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5 }}>
              {busy === 'purge' ? '…' : `Fotos der Saison ${NEUE_SAISON.kurz} löschen`}
            </button>
          </div>
        )}
        {wMsg && <div role={wMsg.kind === 'err' ? 'alert' : 'status'} style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: wMsg.kind === 'err' ? '#E24B4A' : 'var(--th-win)' }}>{wMsg.text}</div>}
      </div>

      {rows === null ? <p style={muted}>Lade …</p>
        : (rows.length === 0) ? (
          <div style={{ background: 'var(--th-bg-card)', border: '1px dashed var(--th-line-10)', borderRadius: 14, padding: '32px 24px', maxWidth: 620, ...muted }}>
            Es wurden noch keine Spielberichte eingereicht.
          </div>
        ) : (
          <details style={{ maxWidth: 960 }}>
            <summary style={{ cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', marginBottom: 12 }}>
              Rohliste aller gespeicherten Berichte ({rows.length}) – nach Liga, auch ältere Saisons und Berichte ohne Begegnung im Plan
            </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {groups.map(([league, list]) => (
              <div key={league}>
                <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 18, color: 'var(--th-accent)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  {league} <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', fontWeight: 700 }}>· {list.length}</span>
                </div>
                {/* Desktop: Tabelle */}
                <div className="mdu-desktop-only" style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-manrope)', fontSize: 12.5, minWidth: 640 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--th-text-faint)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <th style={h}>Sptg.</th><th style={h}>Datum</th><th style={h}>Heim</th><th style={h}>Gast</th><th style={h}>Erg.</th><th style={h}>Status</th><th style={h}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r, i) => (
                        <tr key={r.id} style={{ borderTop: i ? '1px solid var(--th-line-4)' : 'none' }}>
                          <td style={d}>{r.matchday ?? '–'}</td>
                          <td style={d}>{r.match_date ? new Date(r.match_date).toLocaleDateString('de-DE') : '–'}</td>
                          <td style={{ ...d, fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.home_team_name}</td>
                          <td style={d}>{r.guest_team_name}</td>
                          <td style={{ ...d, fontWeight: 700 }} title={r.forfeit ? WERTUNG_LABELS[r.forfeit] : undefined}>{r.spiele_home}:{r.spiele_guest}{r.forfeit ? ' (W)' : ''}</td>
                          <td style={{ ...d, fontWeight: 700, color: r.forfeit ? 'var(--th-loss)' : r.status === 'confirmed' ? 'var(--th-win)' : r.status === 'changes_requested' ? 'var(--th-gold)' : 'var(--th-text-muted)' }}>{r.forfeit ? WERTUNG_LABELS[r.forfeit] : REPORT_STATUS_LABELS[r.status]}</td>
                          <td style={{ ...d, display: 'flex', gap: 12 }}>
                            <Link href={`/mein-bereich/spielberichte?id=${r.id}&from=admin`} style={{ fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none', whiteSpace: 'nowrap' }}>Bearbeiten</Link>
                            <button onClick={() => onDelete(r)} disabled={busy === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, padding: 0 }}>
                              {busy === r.id ? '…' : 'Löschen'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: kompakte Karten */}
                <div className="mdu-mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {list.map(r => (
                    <div key={r.id} style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ flexShrink: 0, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 13, color: 'var(--th-accent)' }}>{r.matchday ?? '–'}. Sp.</span>
                        <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {shortName(r.home_team_id, r.home_team_name)} <span style={{ color: 'var(--th-accent)' }}>{r.spiele_home}:{r.spiele_guest}</span> {shortName(r.guest_team_id, r.guest_team_name)}
                        </span>
                        <span style={{ flexShrink: 0, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: r.status === 'confirmed' ? 'var(--th-win)' : r.status === 'changes_requested' ? 'var(--th-gold)' : 'var(--th-text-muted)' }}>{r.forfeit ? 'Wertung' : REPORT_STATUS_LABELS[r.status]}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-muted)', marginTop: 3 }}>
                        {r.match_date ? new Date(r.match_date).toLocaleDateString('de-DE') : ''}
                      </div>
                      <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                        <Link href={`/mein-bereich/spielberichte?id=${r.id}&from=admin`} style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, color: 'var(--th-accent)', textDecoration: 'none' }}>Bearbeiten</Link>
                        <button onClick={() => onDelete(r)} disabled={busy === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, padding: 0 }}>
                          {busy === r.id ? '…' : 'Löschen'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', margin: 0 }}>
              Hinweis: Spielberichte gelten ohne Freigabe. Bei „Bearbeiten“/„Löschen“ werden die betroffenen Kapitäne benachrichtigt.
            </p>
          </div>
          </details>
        )}
    </AdminGuard>
  );
}

type PStatus = 'kommend' | 'fehlt' | 'eingereicht' | 'bestaetigt' | 'wertung';
type StatusFilter = 'alle' | 'fehlt' | 'eingereicht' | 'bestaetigt' | 'problem';
const STATUS_FILTER: { key: StatusFilter; label: string; farbe?: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'fehlt', label: 'Fehlt', farbe: 'var(--th-loss)' },
  { key: 'eingereicht', label: 'Eingereicht · unbestätigt', farbe: '#9A6B00' },
  { key: 'bestaetigt', label: 'Bestätigt', farbe: 'var(--th-win)' },
  { key: 'problem', label: 'Problemfälle', farbe: 'var(--th-loss)' },
];

interface Partie {
  b: Begegnung27; r: MatchReport | null; datum: string; st: PStatus;
  ueberfaellig: boolean; problem: boolean; woche: string; weg: Erfassungsweg | null;
}

function PartieZeile({ x, busy, onDelete, onProtestErledigt }: { x: Partie; busy: string | null; onDelete: (r: MatchReport) => void; onProtestErledigt: (r: MatchReport) => void }) {
  const { b, r } = x;
  const t = b.termin;
  const etikett = x.st === 'kommend' ? { text: 'kommt noch', farbe: 'var(--th-text-faint)' }
    : x.st === 'fehlt' ? { text: r ? 'Entwurf – nicht eingereicht' : x.ueberfaellig ? 'fehlt – überfällig' : 'fehlt', farbe: 'var(--th-loss)' }
    : x.st === 'wertung' ? { text: WERTUNG_LABELS[r!.forfeit!], farbe: 'var(--th-loss)' }
    : { text: `${r!.spiele_home}:${r!.spiele_guest} · ${REPORT_STATUS_LABELS[r!.status]}`, farbe: x.st === 'bestaetigt' ? 'var(--th-win)' : r!.status === 'changes_requested' ? 'var(--th-gold)' : '#9A6B00' };
  const link: React.CSSProperties = { fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none', whiteSpace: 'nowrap' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px 12px', flexWrap: 'wrap', padding: '9px 0', borderTop: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>
      <span style={{ width: 118, flexShrink: 0, color: 'var(--th-text-muted)' }}>
        {t ? <>{tagKurz(t.datum)}{t.uhrzeit && ` ${t.uhrzeit}`}</> : wochenendeText(b.fri, b.sun, false)}
      </span>
      <span style={{ flexShrink: 0, minWidth: 54, padding: '2px 7px', borderRadius: 6, background: 'var(--th-line-6)', fontWeight: 800, fontSize: 11, textAlign: 'center', color: 'var(--th-text-body)' }}>{findLiga27(b.liga)?.name ?? b.liga}</span>
      <span style={{ flex: '1 1 240px', minWidth: 0, fontWeight: 700, color: 'var(--th-text-strong)' }}>{team27(b.home)?.name ?? b.home} – {team27(b.away)?.name ?? b.away}</span>
      <span style={{ flex: '0 0 auto', fontWeight: 700, color: etikett.farbe }}>
        {etikett.text}{r?.protest && <span style={{ color: r.protest_handled_at ? 'var(--th-text-muted)' : 'var(--th-loss)' }}> · Protest{r.protest_handled_at ? ' (erledigt)' : ''}</span>}
        {x.weg && <span title={WEG[x.weg].label} style={{ marginLeft: 6 }}>{WEG[x.weg].icon}</span>}
      </span>
      {r?.protest && (
        <span style={{ flexBasis: '100%', paddingLeft: 130, fontSize: 12, color: r.protest_handled_at ? 'var(--th-text-muted)' : 'var(--th-loss)' }}>
          Protest: „{(r.protest_note ?? '').trim() || 'ohne Begründung'}“{r.protest_handled_at && r.protest_handled_note ? ` · Erledigt: ${r.protest_handled_note}` : ''}
        </span>
      )}
      <span style={{ display: 'flex', gap: 12, flex: '0 0 auto' }}>
        {r ? (
          <>
            {(x.st === 'eingereicht' || x.st === 'bestaetigt') && <Link href={berichtPfad(b.key)} style={link}>Ansehen</Link>}
            {r.protest && r.status !== 'draft' && !r.protest_handled_at && (
              <button onClick={() => onProtestErledigt(r)} disabled={busy === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5, padding: 0 }}>Protest erledigt</button>
            )}
            <Link href={`/mein-bereich/spielberichte?id=${r.id}&from=admin`} style={link}>Bearbeiten</Link>
            <button onClick={() => onDelete(r)} disabled={busy === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, padding: 0 }}>{busy === r.id ? '…' : 'Löschen'}</button>
          </>
        ) : (
          <>
            <Link href={`/mein-bereich/spielberichte?from=admin&begegnung=${encodeURIComponent(b.key)}`} style={link}>＋ Bericht</Link>
            <Link href={`/mein-bereich/spielberichte/ocr?from=admin&begegnung=${encodeURIComponent(b.key)}`} style={link}>📷 Foto/PDF</Link>
          </>
        )}
      </span>
    </div>
  );
}

const WT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const utc = (iso: string) => new Date(iso + 'T12:00:00Z');
const iso = (d: Date) => d.toISOString().slice(0, 10);
const tagKurz = (s: string) => { const d = utc(s); return `${WT[d.getUTCDay()]} ${d.getUTCDate()}.${d.getUTCMonth() + 1}.`; };
const berlinHeute = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
/** Montag der Woche (Kennung des Wochenendes). */
function wocheVon(s: string): string { const d = utc(s); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return iso(d); }
/** „Fr 23.10. – So 25.10.“ (Wochenende der Woche, die am Montag `mo` beginnt). */
function wocheText(mo: string): string { const f = utc(mo); f.setUTCDate(f.getUTCDate() + 4); const so = utc(mo); so.setUTCDate(so.getUTCDate() + 6); return `${tagKurz(iso(f))} – ${tagKurz(iso(so))}`; }
/** Frist: Dienstag nach dem Spielwochenende, 24 Uhr (Tag, an dem sie noch läuft). */
function fristFuer(datum: string): string { const d = utc(wocheVon(datum)); d.setUTCDate(d.getUTCDate() + 8); return iso(d); }
const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
function chip(an: boolean, farbe?: string): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5,
    border: `1.5px solid ${an ? (farbe ?? 'var(--th-accent)') : 'var(--th-line-10)'}`,
    background: an ? (farbe ?? 'var(--th-accent)') : 'transparent', color: an ? '#fff' : (farbe ?? 'var(--th-text-body)'),
  };
}

function shortName(teamId: string | null, name: string): string {
  return (teamId ? (team27(teamId)?.short ?? findTeam(teamId)?.short) : null) ?? name.slice(0, 3).toUpperCase();
}

const sel: React.CSSProperties = { padding: '9px 11px', borderRadius: 8, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none', minWidth: 0 };
const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' };
const h: React.CSSProperties = { padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap' };
const d: React.CSSProperties = { padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--th-text-body)' };
