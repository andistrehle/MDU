'use client';

// ============================================================
// Admin — Spielberichte: Übersicht (nach Liga), Bearbeiten & Löschen
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import { canApproveMatchReports } from '@/lib/auth/roles';
import { findTeam } from '@/lib/data';
import { NEUE_SAISON, LIGEN_2027, alleBegegnungen27, begegnungKey, team27, findLiga27, wochenendeText, type Liga27Code } from '@/lib/data/saison-2027';
import {
  listAllReports, deleteReport, notifyReportChange, setzeWertung,
  REPORT_STATUS_LABELS, WERTUNG_LABELS, type MatchReport, type Wertung,
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

  // ── Alle Partien 2026/27: je Liga jede Begegnung mit Stand und Aktionen ──
  const [pLiga, setPLiga] = useState<Liga27Code>('la');
  const [pFilter, setPFilter] = useState<'alle' | 'ohne' | 'offen' | 'bestaetigt'>('alle');
  const berichtJeBegegnung = useMemo(() => {
    const m = new Map<string, MatchReport>();
    for (const r of rows ?? []) if (r.season_id === NEUE_SAISON.id && r.home_team_id && r.guest_team_id) m.set(begegnungKey(r.home_team_id, r.guest_team_id), r);
    return m;
  }, [rows]);
  const partien = useMemo(() => {
    return alleBegegnungen27().filter(b => b.liga === pLiga).filter(b => {
      const r = berichtJeBegegnung.get(b.key);
      if (pFilter === 'ohne') return !r;
      if (pFilter === 'offen') return !!r && r.status !== 'confirmed';
      if (pFilter === 'bestaetigt') return r?.status === 'confirmed';
      return true;
    });
  }, [pLiga, pFilter, berichtJeBegegnung]);
  const heute = new Date().toISOString().slice(0, 10);

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
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', marginBottom: 22, maxWidth: 960 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 14, color: 'var(--th-text-strong)', marginRight: 'auto' }}>Alle Partien {NEUE_SAISON.kurz}</div>
          <select value={pLiga} onChange={e => setPLiga(e.target.value as Liga27Code)} style={sel}>
            {LIGEN_2027.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
          <select value={pFilter} onChange={e => setPFilter(e.target.value as typeof pFilter)} style={sel}>
            <option value="alle">alle Partien</option>
            <option value="ohne">ohne Spielbericht</option>
            <option value="offen">Entwurf / nicht bestätigt</option>
            <option value="bestaetigt">bestätigt</option>
          </select>
          <Link href="/mein-bereich/spielberichte?from=admin" style={{ padding: '8px 14px', borderRadius: 8, background: 'var(--th-accent)', color: '#fff', textDecoration: 'none', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12.5 }}>＋ Neuer Spielbericht</Link>
        </div>
        {rows === null ? <p style={muted}>Lade …</p> : partien.length === 0 ? <p style={{ ...muted, fontSize: 13 }}>Keine Partien für diesen Filter.</p> : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {partien.map((b, i) => {
              const r = berichtJeBegegnung.get(b.key);
              const vorbei = (b.termin?.datum ?? b.sun) < heute;
              const stand = !r ? (vorbei ? 'kein Bericht' : '—')
                : r.forfeit ? WERTUNG_LABELS[r.forfeit]
                : `${r.spiele_home}:${r.spiele_guest} · ${REPORT_STATUS_LABELS[r.status]}`;
              const farbe = !r ? (vorbei ? 'var(--th-loss)' : 'var(--th-text-faint)')
                : r.forfeit ? 'var(--th-loss)' : r.status === 'confirmed' ? 'var(--th-win)' : r.status === 'changes_requested' ? 'var(--th-gold)' : 'var(--th-text-muted)';
              return (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 0', borderTop: i ? '1px solid var(--th-line-4)' : 'none', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>
                  <span style={{ width: 92, flexShrink: 0, color: 'var(--th-text-faint)' }}>{b.spieltag}. ST · {wochenendeText(b.fri, b.sun, false)}</span>
                  <span style={{ flex: '1 1 260px', minWidth: 0, fontWeight: 700, color: 'var(--th-text-strong)' }}>{team27(b.home)?.name ?? b.home} – {team27(b.away)?.name ?? b.away}</span>
                  <span style={{ flex: '0 0 auto', fontWeight: 700, color: farbe }}>{stand}</span>
                  <span style={{ display: 'flex', gap: 12, flex: '0 0 auto' }}>
                    {r ? (
                      <>
                        <Link href={`/mein-bereich/spielberichte?id=${r.id}&from=admin`} style={{ fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>Prüfen / Bearbeiten</Link>
                        <button onClick={() => onDelete(r)} disabled={busy === r.id} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--th-loss)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, padding: 0 }}>{busy === r.id ? '…' : 'Löschen'}</button>
                      </>
                    ) : (
                      <>
                        <Link href={`/mein-bereich/spielberichte?from=admin&begegnung=${encodeURIComponent(b.key)}`} style={{ fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>＋ Bericht hinzufügen</Link>
                        <Link href={`/mein-bereich/spielberichte/ocr?from=admin&begegnung=${encodeURIComponent(b.key)}`} style={{ fontWeight: 700, color: 'var(--th-accent)', textDecoration: 'none' }}>📷 Foto/PDF</Link>
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 960 }}>
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
              Hinweis: Spielberichte gelten ohne Freigabe. Bei „Bearbeiten"/„Löschen" werden die betroffenen Kapitäne benachrichtigt.
            </p>
          </div>
        )}
    </AdminGuard>
  );
}

function shortName(teamId: string | null, name: string): string {
  return (teamId ? (team27(teamId)?.short ?? findTeam(teamId)?.short) : null) ?? name.slice(0, 3).toUpperCase();
}

const sel: React.CSSProperties = { padding: '9px 11px', borderRadius: 8, background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13, outline: 'none', minWidth: 0 };
const muted: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-muted)' };
const h: React.CSSProperties = { padding: '8px 12px', fontWeight: 700, whiteSpace: 'nowrap' };
const d: React.CSSProperties = { padding: '10px 12px', whiteSpace: 'nowrap', color: 'var(--th-text-body)' };
