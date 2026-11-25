'use client';

// ============================================================
// WM-Tipp — Seite zum Tippen (Betreiber, 25.11.2026). Rechnung: lib/wm-tipp.ts, Stand: /api/wm-tipp.
// Eigene Tipps schreibt der Browser direkt (RLS: nur eigene, nur bis Spielbeginn bzw. WM-Start).
// Solange WM_TIPP_LIVE = false, sieht nur die Ligaleitung die Seite.
// ============================================================

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { canManageLeague } from '@/lib/auth/roles';
import { supabase } from '@/lib/supabase/client';
import { findLiga27, team27 } from '@/lib/data/saison-2027';
import {
  WM_TIPP_LIVE, WM_START, PUNKTE, RUNDEN, rundenName, moeglicheErgebnisse, punkteSpiel, fertig, tippOffen, vorabOffen, ausschnitt, punkteVorab,
  type WmSpiel, type WmVorab, type WmZeile, type WmAuswertung,
} from '@/lib/wm-tipp';

type Stand = { spiele: WmSpiel[]; zeilen: WmZeile[]; auswertung: WmAuswertung; teilnehmer: number; ich: { id: string; teamId: string | null; liga: string | null } };
type Reiter = 'spiele' | 'vorab' | 'rangliste' | 'regeln';

const font = 'var(--font-manrope)';
const karte: CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' };
const leise: CSSProperties = { fontFamily: font, fontSize: 12.5, color: 'var(--th-text-muted)' };
const tagText = (iso: string | null) => iso
  ? new Date(iso).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit' })
  : 'Termin offen';
const zeitText = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }) : '';

async function token() { return (await supabase?.auth.getSession())?.data.session?.access_token ?? null; }

export function WmTipp() {
  const { user, loading } = useAuth();
  const admin = canManageLeague(user);
  const [stand, setStand] = useState<Stand | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [tipps, setTipps] = useState<Map<string, [number, number]>>(new Map());
  const [vorab, setVorab] = useState<WmVorab | null>(null);
  const [reiter, setReiter] = useState<Reiter>('spiele');
  const darf = !!user && (WM_TIPP_LIVE || admin);

  const laden = useCallback(async () => {
    const t = await token();
    if (!t || !supabase) return;
    const r = await fetch('/api/wm-tipp', { headers: { Authorization: `Bearer ${t}` } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setFehler(j.error ?? 'Laden fehlgeschlagen.'); return; }
    setStand(j as Stand); setFehler(null);
    const [{ data: ti }, { data: vo }] = await Promise.all([
      supabase.from('wm_tipps').select('spiel_id, sets_a, sets_b'),
      supabase.from('wm_vorab').select('*').maybeSingle(),
    ]);
    setTipps(new Map(((ti ?? []) as { spiel_id: string; sets_a: number; sets_b: number }[]).map(x => [x.spiel_id, [x.sets_a, x.sets_b]])));
    setVorab((vo as WmVorab | null) ?? null);
  }, []);
  useEffect(() => { if (darf) queueMicrotask(() => void laden()); }, [darf, laden]);

  if (loading) return <p style={leise}>Lade …</p>;
  if (!user) return (
    <div style={karte}>
      <p style={{ fontFamily: font, fontSize: 15, margin: '0 0 12px', color: 'var(--th-text-strong)' }}>Mittippen kannst du mit deinem MDU-Konto – gewertet wird gesamt, in deiner Liga und in deinem Team.</p>
      <Link href="/login?next=/wm-tipp" style={knopf(true)}>Anmelden</Link>{' '}
      <Link href="/registrieren" style={knopf(false)}>Konto anlegen</Link>
    </div>
  );
  if (!darf) return <div style={karte}><p style={{ ...leise, margin: 0, fontSize: 15 }}>Der WM-Tipp startet bald. Schau in ein paar Tagen wieder vorbei!</p></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {!WM_TIPP_LIVE && <div style={{ ...karte, borderColor: 'var(--th-gold)', ...leise }}>Vorschau – nur für die Ligaleitung sichtbar. Live geht es mit <code>WM_TIPP_LIVE</code> in lib/wm-tipp.ts.</div>}
      {fehler && <div role="alert" style={{ ...karte, borderColor: 'var(--th-loss)', color: 'var(--th-loss)', fontFamily: font, fontSize: 13 }}>{fehler}</div>}
      <nav style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {([['spiele', 'Spiele tippen'], ['vorab', 'Vorab & Bonus'], ['rangliste', 'Rangliste'], ['regeln', 'Regeln & Preise']] as [Reiter, string][]).map(([k, t]) => (
          <button key={k} type="button" onClick={() => setReiter(k)} style={{ ...chip, ...(reiter === k ? chipAn : {}) }}>{t}</button>
        ))}
      </nav>
      {!stand ? <p style={leise}>Lade …</p>
        : reiter === 'spiele' ? <Spiele spiele={stand.spiele} tipps={tipps} setTipps={setTipps} ich={stand.ich.id} />
        : reiter === 'vorab' ? <Vorab spiele={stand.spiele} vorab={vorab} setVorab={setVorab} ich={stand.ich.id} />
        : reiter === 'rangliste' ? <Rangliste stand={stand} />
        : <Regeln />}
    </div>
  );
}

// ── Spiele tippen ─────────────────────────────────────────

function Spiele({ spiele, tipps, setTipps, ich }: { spiele: WmSpiel[]; tipps: Map<string, [number, number]>; setTipps: (m: Map<string, [number, number]>) => void; ich: string }) {
  const [jetzt] = useState(() => new Date());
  const [nurOffen, setNurOffen] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  if (!spiele.length) return <div style={karte}><p style={{ ...leise, margin: 0 }}>Der Spielplan kommt nach der Auslosung. Bis dahin kannst du schon unter „Vorab & Bonus“ tippen.</p></div>;

  const liste = spiele.filter(s => !nurOffen || tippOffen(s, jetzt) || !fertig(s));
  const tage = new Map<string, WmSpiel[]>();
  for (const s of liste) { const k = tagText(s.beginn); (tage.get(k) ?? tage.set(k, []).get(k)!).push(s); }
  const offenOhneTipp = spiele.filter(s => tippOffen(s, jetzt) && !tipps.has(s.id)).length;

  async function setze(s: WmSpiel, a: number, b: number) {
    if (!supabase) return;
    setBusy(s.id); setFehler(null);
    const { error } = await supabase.from('wm_tipps').upsert({ user_id: ich, spiel_id: s.id, sets_a: a, sets_b: b, updated_at: new Date().toISOString() });
    setBusy(null);
    if (error) { setFehler(/row-level|policy/i.test(error.message) ? 'Das Spiel hat schon begonnen – Tipp nicht mehr möglich.' : error.message); return; }
    const m = new Map(tipps); m.set(s.id, [a, b]); setTipps(m);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ ...leise, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={nurOffen} onChange={e => setNurOffen(e.target.checked)} /> Nur offene und laufende Spiele</label>
        {offenOhneTipp > 0 && <span style={{ ...leise, color: 'var(--th-accent)', fontWeight: 700 }}>{offenOhneTipp} Spiel{offenOhneTipp === 1 ? '' : 'e'} noch ohne Tipp</span>}
      </div>
      {fehler && <div role="alert" style={{ ...leise, color: 'var(--th-loss)' }}>{fehler}</div>}
      {[...tage].map(([tag, l]) => (
        <section key={tag}>
          <h3 style={{ fontFamily: font, fontSize: 12, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--th-text-body)', margin: '4px 0 8px' }}>{tag}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {l.map(s => {
              const t = tipps.get(s.id);
              const offen = tippOffen(s, jetzt);
              const p = t && fertig(s) ? punkteSpiel({ sets_a: t[0], sets_b: t[1] }, s) : null;
              return (
                <div key={s.id} style={karte}>
                  <div style={{ ...leise, fontSize: 11.5, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span>{rundenName(s.runde)} · {zeitText(s.beginn)}{s.beginn ? ' Uhr' : ''} · Best of {s.ziel * 2 - 1} Sätze</span>
                    {fertig(s) ? <strong style={{ color: 'var(--th-text-strong)' }}>Ergebnis {s.sets_a}:{s.sets_b}</strong> : !offen ? <span style={{ color: 'var(--th-loss)', fontWeight: 700 }}>läuft</span> : null}
                  </div>
                  <div style={{ fontFamily: font, fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)', margin: '6px 0 10px' }}>{s.spieler_a} <span style={{ color: 'var(--th-text-faint)', fontWeight: 500 }}>–</span> {s.spieler_b}</div>
                  {offen ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {moeglicheErgebnisse(s.ziel).map(([a, b]) => {
                        const an = t?.[0] === a && t?.[1] === b;
                        return <button key={`${a}:${b}`} type="button" disabled={busy === s.id} onClick={() => setze(s, a, b)} aria-pressed={an}
                          style={{ ...chip, padding: '8px 11px', minWidth: 48, fontFamily: 'var(--font-jetbrains-mono)', ...(an ? chipAn : {}) }}>{a}:{b}</button>;
                      })}
                    </div>
                  ) : (
                    <div style={leise}>
                      Dein Tipp: <strong style={{ color: 'var(--th-text-strong)' }}>{t ? `${t[0]}:${t[1]}` : '—'}</strong>
                      {p != null && <> · <strong style={{ color: p ? 'var(--th-win)' : 'var(--th-text-muted)' }}>{p} Punkte</strong></>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {!liste.length && <p style={leise}>Gerade kein offenes Spiel. Haken oben weg, dann siehst du alle.</p>}
    </div>
  );
}

// ── Vorab & Bonus ─────────────────────────────────────────

function Vorab({ spiele, vorab, setVorab, ich }: { spiele: WmSpiel[]; vorab: WmVorab | null; setVorab: (v: WmVorab) => void; ich: string }) {
  const [jetzt] = useState(() => new Date());
  const offen = vorabOffen(jetzt);
  const leer: WmVorab = { user_id: ich, vf: Array(8).fill(''), hf: Array(4).fill(''), finale: ['', ''], weltmeister: '', n180: null, neun_darter: null, bester_deutscher: '' };
  const [v, setV] = useState<WmVorab>(() => vorab ? { ...leer, ...vorab, vf: fuellen(vorab.vf, 8), hf: fuellen(vorab.hf, 4), finale: fuellen(vorab.finale, 2) } : leer);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const namen = useMemo(() => [...new Set(spiele.flatMap(s => [s.spieler_a, s.spieler_b]))].sort((a, b) => a.localeCompare(b, 'de')), [spiele]);
  const ergebnis = vorab && !offen ? punkteVorab(vorab, spiele) : null;

  async function speichern() {
    if (!supabase) return;
    const doppelt = (l: string[]) => { const x = l.map(n => n.trim().toLowerCase()).filter(Boolean); return x.length !== new Set(x).size; };
    if (doppelt(v.vf) || doppelt(v.hf) || doppelt(v.finale)) { setMsg({ ok: false, text: 'Ein Spieler steht in einer Runde doppelt.' }); return; }
    const zeile = {
      user_id: ich, vf: v.vf.map(s => s.trim()).filter(Boolean), hf: v.hf.map(s => s.trim()).filter(Boolean), finale: v.finale.map(s => s.trim()).filter(Boolean),
      weltmeister: v.weltmeister?.trim() || null, n180: v.n180, neun_darter: v.neun_darter, bester_deutscher: v.bester_deutscher?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('wm_vorab').upsert(zeile);
    if (error) { setMsg({ ok: false, text: /row-level|policy/i.test(error.message) ? 'Die WM hat begonnen – Vorab-Tipps sind gesperrt.' : error.message }); return; }
    setVorab(zeile as WmVorab); setMsg({ ok: true, text: 'Gespeichert ✓' });
  }

  const feld = (wert: string, aendern: (x: string) => void, ph: string) => (
    <input list="wm-spieler" value={wert} disabled={!offen} onChange={e => aendern(e.target.value)} placeholder={ph} style={eingabe} />
  );
  const setL = (k: 'vf' | 'hf' | 'finale', i: number, x: string) => setV(o => { const l = [...o[k]]; l[i] = x; return { ...o, [k]: l }; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <datalist id="wm-spieler">{namen.map(n => <option key={n} value={n} />)}</datalist>
      <p style={{ ...leise, margin: 0 }}>{offen ? `Abgabe bis zum WM-Start am ${tagText(WM_START)} um ${zeitText(WM_START)} Uhr. Bis dahin kannst du alles ändern.` : 'Die WM läuft – die Vorab-Tipps sind gesperrt.'}</p>
      <Block titel={`Viertelfinalisten · je ${PUNKTE.vf} Punkte`}>{v.vf.map((n, i) => <div key={i}>{feld(n, x => setL('vf', i, x), `Spieler ${i + 1}`)}</div>)}</Block>
      <Block titel={`Halbfinalisten · je ${PUNKTE.hf} Punkte`}>{v.hf.map((n, i) => <div key={i}>{feld(n, x => setL('hf', i, x), `Spieler ${i + 1}`)}</div>)}</Block>
      <Block titel={`Finalisten · je ${PUNKTE.finale} Punkte`}>{v.finale.map((n, i) => <div key={i}>{feld(n, x => setL('finale', i, x), `Spieler ${i + 1}`)}</div>)}</Block>
      <Block titel={`Weltmeister · ${PUNKTE.weltmeister} Punkte`}>{feld(v.weltmeister ?? '', x => setV(o => ({ ...o, weltmeister: x })), 'Weltmeister')}</Block>
      <Block titel={`Bonusfragen`}>
        <label style={leise}>Wie viele 180er fallen im ganzen Turnier? <span style={{ color: 'var(--th-text-faint)' }}>(am nächsten dran {PUNKTE.n180[0]}, Platz 2 und 3 je {PUNKTE.n180[1]})</span>
          <input type="number" min={0} inputMode="numeric" value={v.n180 ?? ''} disabled={!offen} onChange={e => setV(o => ({ ...o, n180: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0) }))} style={{ ...eingabe, marginTop: 6 }} />
        </label>
        <div style={leise}>Gibt es einen Neun-Darter? <span style={{ color: 'var(--th-text-faint)' }}>({PUNKTE.neunDarter} Punkte)</span>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {([[true, 'Ja'], [false, 'Nein']] as [boolean, string][]).map(([w, t]) => <button key={t} type="button" disabled={!offen} onClick={() => setV(o => ({ ...o, neun_darter: w }))} style={{ ...chip, ...(v.neun_darter === w ? chipAn : {}) }}>{t}</button>)}
          </div>
        </div>
        <label style={leise}>Welcher deutsche Spieler kommt am weitesten? <span style={{ color: 'var(--th-text-faint)' }}>({PUNKTE.besterDeutscher} Punkte)</span>
          <div style={{ marginTop: 6 }}>{feld(v.bester_deutscher ?? '', x => setV(o => ({ ...o, bester_deutscher: x })), 'z. B. Name')}</div>
        </label>
      </Block>
      {offen && <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={speichern} style={{ ...knopf(true), border: 'none', cursor: 'pointer' }}>Vorab-Tipps speichern</button>
        {msg && <span style={{ ...leise, color: msg.ok ? 'var(--th-win)' : 'var(--th-loss)', fontWeight: 700 }}>{msg.text}</span>}
      </div>}
      {ergebnis && <div style={karte}><span style={leise}>Bisher aus Vorab-Tipps: </span><strong style={{ fontFamily: font }}>{ergebnis.summe} Punkte</strong> <span style={leise}>(VF {ergebnis.vf} · HF {ergebnis.hf} · Finale {ergebnis.finale} · Weltmeister {ergebnis.weltmeister}; Bonusfragen kommen am Ende dazu)</span></div>}
    </div>
  );
}
const fuellen = (l: string[], n: number) => [...l, ...Array(Math.max(0, n - l.length)).fill('')].slice(0, n);
function Block({ titel, children }: { titel: string; children: React.ReactNode }) {
  return <div style={{ ...karte, display: 'flex', flexDirection: 'column', gap: 8 }}><div style={{ fontFamily: font, fontWeight: 800, fontSize: 13, color: 'var(--th-text-strong)' }}>{titel}</div>{children}</div>;
}

// ── Rangliste ─────────────────────────────────────────────

function Rangliste({ stand }: { stand: Stand }) {
  const { ich } = stand;
  const [sicht, setSicht] = useState<'gesamt' | 'liga' | 'team'>(ich.teamId ? 'team' : 'gesamt');
  const liste = sicht === 'gesamt' ? stand.zeilen
    : sicht === 'liga' ? ausschnitt(stand.zeilen, z => !!ich.liga && z.liga === ich.liga)
    : ausschnitt(stand.zeilen, z => !!ich.teamId && z.teamId === ich.teamId);
  const ligaName = ich.liga ? findLiga27(ich.liga)?.name ?? ich.liga : null;
  const teamName = ich.teamId ? team27(ich.teamId)?.name ?? null : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {teamName && <button type="button" onClick={() => setSicht('team')} style={{ ...chip, ...(sicht === 'team' ? chipAn : {}) }}>{teamName}</button>}
        {ligaName && <button type="button" onClick={() => setSicht('liga')} style={{ ...chip, ...(sicht === 'liga' ? chipAn : {}) }}>{ligaName}</button>}
        <button type="button" onClick={() => setSicht('gesamt')} style={{ ...chip, ...(sicht === 'gesamt' ? chipAn : {}) }}>Gesamt-MDU</button>
      </div>
      <p style={{ ...leise, margin: 0 }}>{stand.teilnehmer} tippen mit. Gleichstand: mehr genaue Ergebnisse, dann mehr richtige Sieger.</p>
      {!liste.length ? <p style={leise}>Hier tippt noch niemand.</p> : (
        <div style={{ ...karte, padding: 0, overflow: 'hidden' }}>
          {liste.map(z => (
            <div key={z.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderTop: '1px solid var(--th-line-4)', background: z.user_id === ich.id ? 'var(--th-accent-a07)' : undefined, fontFamily: font, fontSize: 13.5 }}>
              <span style={{ width: 26, textAlign: 'right', fontWeight: 800, color: 'var(--th-text-muted)' }}>{z.platz}.</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, color: 'var(--th-text-strong)' }}>{z.name}</span>
                {sicht !== 'team' && z.teamId && <span style={{ ...leise, fontSize: 11.5 }}> · {team27(z.teamId)?.name ?? ''}</span>}
                <span style={{ display: 'block', ...leise, fontSize: 11 }}>Spiele {z.spiele} · Vorab {z.vorab} · Bonus {z.bonus} · {z.genau}× genau</span>
              </span>
              <strong style={{ fontSize: 16, color: 'var(--th-text-strong)' }}>{z.punkte}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Regeln & Preise ───────────────────────────────────────

/** Sachpreise: trägt der Betreiber ein, sobald sie feststehen. Kein Geld (Betreiber, 25.11.2026). */
export const WM_PREISE: string[] = [];

function Regeln() {
  const zeile = (a: string, b: string) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', borderTop: '1px solid var(--th-line-4)' }}><span>{a}</span><strong>{b}</strong></div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: font, fontSize: 13.5, color: 'var(--th-text-body)', lineHeight: 1.55 }}>
      <div style={karte}>
        <div style={{ fontWeight: 800, marginBottom: 6, color: 'var(--th-text-strong)' }}>Jedes Spiel</div>
        {zeile('Richtiger Sieger', `${PUNKTE.sieger} Punkte`)}
        {zeile('Genaues Ergebnis (z. B. 3:1)', `${PUNKTE.genau} Punkte`)}
        <p style={{ ...leise, margin: '8px 0 0' }}>Tippen bis zum Spielbeginn. Ein genaues Ergebnis ist zugleich die richtige Satzdifferenz – deshalb keine eigene Stufe dafür.</p>
      </div>
      <div style={karte}>
        <div style={{ fontWeight: 800, marginBottom: 6, color: 'var(--th-text-strong)' }}>Vorab bis zum WM-Start</div>
        {zeile('je richtiger Viertelfinalist', `${PUNKTE.vf} Punkte`)}
        {zeile('je richtiger Halbfinalist', `${PUNKTE.hf} Punkte`)}
        {zeile('je richtiger Finalist', `${PUNKTE.finale} Punkte`)}
        {zeile('Weltmeister', `${PUNKTE.weltmeister} Punkte`)}
        {zeile('Anzahl 180er: am nächsten dran', `${PUNKTE.n180[0]} Punkte`)}
        {zeile('Anzahl 180er: Platz 2 und 3', `je ${PUNKTE.n180[1]} Punkte`)}
        {zeile('Neun-Darter ja/nein', `${PUNKTE.neunDarter} Punkte`)}
        {zeile('Bester Deutscher', `${PUNKTE.besterDeutscher} Punkte`)}
      </div>
      <div style={karte}>
        <div style={{ fontWeight: 800, marginBottom: 6, color: 'var(--th-text-strong)' }}>Wertungen und Preise</div>
        <p style={{ margin: 0 }}>Gewertet wird in deinem Team, in deiner Liga und über die ganze MDU – mit einem Tipp für alle drei. Bei Gleichstand zählen mehr genaue Ergebnisse, dann mehr richtige Sieger. Mitmachen ist kostenlos{WM_PREISE.length ? '; zu gewinnen gibt es:' : ', die Preise geben wir noch bekannt.'}</p>
        {WM_PREISE.length > 0 && <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>{WM_PREISE.map(p => <li key={p}>{p}</li>)}</ul>}
      </div>
      <p style={{ ...leise, margin: 0 }}>Die Runden: {RUNDEN.map(r => r.name).join(' · ')}.</p>
    </div>
  );
}

const chip: CSSProperties = { padding: '8px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: font, fontWeight: 700, fontSize: 13, background: 'var(--th-bg-card)', color: 'var(--th-text-body)', border: '1px solid var(--th-line-8)' };
const chipAn: CSSProperties = { background: 'var(--th-accent)', color: '#fff', borderColor: 'var(--th-accent)' };
const eingabe: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, fontSize: 16, fontFamily: font, color: 'var(--th-text-strong)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)' };
const knopf = (voll: boolean): CSSProperties => ({ display: 'inline-block', padding: '10px 18px', borderRadius: 8, textDecoration: 'none', fontFamily: font, fontWeight: 800, fontSize: 13.5, background: voll ? 'var(--th-accent)' : 'transparent', color: voll ? '#fff' : 'var(--th-accent)', border: voll ? 'none' : '1.5px solid var(--th-accent)' });
