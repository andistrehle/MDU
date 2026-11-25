'use client';

// ============================================================
// Admin → WM-Tipp (Betreiber, 25.11.2026): Spielplan einfügen, Ergebnisse eintragen/berichtigen, Bonusfragen auflösen.
// Schreibt direkt über RLS (is_admin). Automatischer Abgleich mit einer öffentlichen Quelle folgt nach der Auslosung —
// bis dahin ist das hier der Weg, und auch danach die Kontrolle.
// ============================================================

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { RUNDEN, rundenName, spielplanLesen, tippGueltig, WM_TIPP_LIVE, type WmSpiel, type WmAuswertung } from '@/lib/wm-tipp';

const font = 'var(--font-manrope)';

export default function AdminWmTippPage() {
  const [spiele, setSpiele] = useState<WmSpiel[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [aw, setAw] = useState<WmAuswertung>({ n180: null, neun_darter: null, bester_deutscher: null });
  const [eingabe, setEingabe] = useState<Record<string, [string, string]>>({});

  async function laden() {
    if (!supabase) return;
    const [{ data, error }, { data: a }] = await Promise.all([
      supabase.from('wm_spiele').select('*').order('beginn', { ascending: true, nullsFirst: false }).order('nr'),
      supabase.from('wm_auswertung').select('n180, neun_darter, bester_deutscher').eq('id', 1).maybeSingle(),
    ]);
    if (error) { setFehler(/wm_spiele/.test(error.message) ? 'Migration 0075 fehlt noch.' : error.message); setSpiele([]); return; }
    setSpiele((data ?? []) as WmSpiel[]);
    if (a) setAw(a as WmAuswertung);
  }
  useEffect(() => { queueMicrotask(() => void laden()); }, []);

  const vorschau = useMemo(() => text.trim() ? spielplanLesen(text) : null, [text]);

  async function uebernehmen() {
    if (!supabase || !vorschau || vorschau.fehler.length || !vorschau.spiele.length) return;
    const vorhanden = new Set((spiele ?? []).map(s => `${s.runde}|${s.nr}`));
    const ueber = vorschau.spiele.filter(s => vorhanden.has(`${s.runde}|${s.nr}`)).length;
    if (!confirm(`${vorschau.spiele.length} Spiele übernehmen?${ueber ? `\n\n${ueber} davon gibt es schon (gleiche Runde + Nummer) – Spieler und Termin werden ersetzt, Ergebnisse und Tipps bleiben.` : ''}`)) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('wm_spiele').upsert(vorschau.spiele.map(s => ({ ...s, quelle: 'hand', updated_at: new Date().toISOString() })), { onConflict: 'runde,nr' });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setText(''); setMsg(`${vorschau.spiele.length} Spiele übernommen.`); void laden();
  }

  async function ergebnis(s: WmSpiel, leeren = false) {
    if (!supabase) return;
    const [a, b] = eingabe[s.id] ?? [String(s.sets_a ?? ''), String(s.sets_b ?? '')];
    const sa = leeren ? null : parseInt(a, 10), sb = leeren ? null : parseInt(b, 10);
    if (!leeren && !tippGueltig(sa!, sb!, s.ziel)) { setMsg(`${s.spieler_a} – ${s.spieler_b}: Ergebnis ungültig (einer braucht genau ${s.ziel} Sätze).`); return; }
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('wm_spiele').update({ sets_a: sa, sets_b: sb, quelle: 'hand', updated_at: new Date().toISOString() }).eq('id', s.id);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setEingabe(e => { const x = { ...e }; delete x[s.id]; return x; });
    void laden();
  }

  async function loeschen(s: WmSpiel) {
    if (!supabase || !confirm(`${s.spieler_a} – ${s.spieler_b} löschen? Alle Tipps auf dieses Spiel gehen mit.`)) return;
    const { error } = await supabase.from('wm_spiele').delete().eq('id', s.id);
    if (error) setMsg(error.message); else void laden();
  }

  async function auswertungSpeichern() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.from('wm_auswertung').upsert({ id: 1, ...aw, bester_deutscher: aw.bester_deutscher?.trim() || null, updated_at: new Date().toISOString() });
    setBusy(false);
    setMsg(error ? error.message : 'Bonusfragen gespeichert.');
  }

  const offen = (spiele ?? []).filter(s => s.sets_a == null).length;

  return (
    <AdminGuard title="WM-Tipp" subtitle={`Spielplan, Ergebnisse und Bonusfragen. ${WM_TIPP_LIVE ? 'Die Seite ist öffentlich.' : 'Noch nicht live – nur die Ligaleitung sieht die Seite.'}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 820 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><Link href="/wm-tipp" style={{ ...knopf, textDecoration: 'none' }}>Zur Tippseite</Link></div>
        {fehler && <div role="alert" style={{ ...karte, borderColor: 'var(--th-loss)', color: 'var(--th-loss)' }}>{fehler}</div>}
        {msg && <div role="status" style={{ ...karte, ...leise }}>{msg}</div>}

        <section style={karte}>
          <h2 style={h2}>Spielplan einfügen</h2>
          <p style={leise}>Je Zeile: <code>Runde; Datum Uhrzeit; Spieler A; Spieler B</code> – optional dahinter die Sätze zum Sieg (sonst R1/R2 = 3, R3/AF = 4, VF 5, HF 6, Finale 7). Runden: {RUNDEN.map(r => r.key).join(', ')}. Trenner ; oder Tab (aus Excel kopieren geht).</p>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder={'r1; 11.12.2026 20:00; Spieler A; Spieler B'} style={{ ...inp, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13 }} />
          {vorschau && (
            <div style={{ marginTop: 8, ...leise }}>
              {vorschau.fehler.length ? <ul style={{ color: 'var(--th-loss)', margin: 0, paddingLeft: 18 }}>{vorschau.fehler.map(f => <li key={f}>{f}</li>)}</ul>
                : <>Erkannt: {vorschau.spiele.length} Spiele ({RUNDEN.map(r => [r, vorschau.spiele.filter(s => s.runde === r.key).length] as const).filter(([, n]) => n).map(([r, n]) => `${r.kurz} ${n}`).join(' · ')}). <button type="button" disabled={busy} onClick={uebernehmen} style={knopf}>Übernehmen</button></>}
            </div>
          )}
        </section>

        <section style={karte}>
          <h2 style={h2}>Spiele und Ergebnisse {spiele && <span style={leise}>· {spiele.length} Spiele, {offen} ohne Ergebnis</span>}</h2>
          {!spiele ? <p style={leise}>Lade …</p> : !spiele.length ? <p style={leise}>Noch kein Spielplan.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {spiele.map(s => {
                const [a, b] = eingabe[s.id] ?? [String(s.sets_a ?? ''), String(s.sets_b ?? '')];
                const setz = (i: 0 | 1, x: string) => setEingabe(e => ({ ...e, [s.id]: i === 0 ? [x, b] : [a, x] }));
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid var(--th-line-4)', fontFamily: font, fontSize: 13 }}>
                    <span style={{ width: 150, ...leise }}>{rundenName(s.runde)} {s.nr} · {s.beginn ? new Date(s.beginn).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'ohne Termin'}</span>
                    <span style={{ flex: '1 1 220px', fontWeight: 700 }}>{s.spieler_a} – {s.spieler_b}</span>
                    <input value={a} onChange={e => setz(0, e.target.value)} inputMode="numeric" aria-label="Sätze A" style={zahl} />
                    <span>:</span>
                    <input value={b} onChange={e => setz(1, e.target.value)} inputMode="numeric" aria-label="Sätze B" style={zahl} />
                    <button type="button" disabled={busy} onClick={() => ergebnis(s)} style={knopf}>Speichern</button>
                    {s.sets_a != null && <button type="button" disabled={busy} onClick={() => ergebnis(s, true)} style={geist}>Leeren</button>}
                    <button type="button" disabled={busy} onClick={() => loeschen(s)} style={{ ...geist, color: 'var(--th-loss)' }}>Löschen</button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section style={karte}>
          <h2 style={h2}>Bonusfragen auflösen (nach dem Finale)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: font, fontSize: 13 }}>
            <label>180er im ganzen Turnier <input type="number" min={0} value={aw.n180 ?? ''} onChange={e => setAw(o => ({ ...o, n180: e.target.value === '' ? null : parseInt(e.target.value, 10) }))} style={{ ...inp, maxWidth: 160, display: 'block', marginTop: 4 }} /></label>
            <div>Neun-Darter gefallen?{' '}
              {([[true, 'Ja'], [false, 'Nein'], [null, 'offen']] as [boolean | null, string][]).map(([w, t]) => <button key={t} type="button" onClick={() => setAw(o => ({ ...o, neun_darter: w }))} style={{ ...geist, ...(aw.neun_darter === w ? { background: 'var(--th-accent)', color: '#fff' } : {}) }}>{t}</button>)}
            </div>
            <label>Bester Deutscher (Name wie im Spielplan) <input value={aw.bester_deutscher ?? ''} onChange={e => setAw(o => ({ ...o, bester_deutscher: e.target.value }))} style={{ ...inp, display: 'block', marginTop: 4 }} /></label>
            <div><button type="button" disabled={busy} onClick={auswertungSpeichern} style={knopf}>Bonusfragen speichern</button></div>
          </div>
        </section>
      </div>
    </AdminGuard>
  );
}

const karte: CSSProperties = { background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' };
const leise: CSSProperties = { fontFamily: font, fontSize: 12.5, color: 'var(--th-text-muted)' };
const h2: CSSProperties = { fontFamily: font, fontSize: 15, fontWeight: 800, margin: '0 0 8px', color: 'var(--th-text-strong)' };
const inp: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, fontSize: 14, fontFamily: font, color: 'var(--th-text-strong)', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)' };
const zahl: CSSProperties = { ...inp, width: 46, padding: '7px 6px', textAlign: 'center' };
const knopf: CSSProperties = { padding: '7px 14px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: 'none', fontFamily: font, fontWeight: 700, fontSize: 12.5 };
const geist: CSSProperties = { padding: '7px 12px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-text-muted)', border: '1px solid var(--th-line-10)', fontFamily: font, fontWeight: 700, fontSize: 12.5, marginRight: 4 };
