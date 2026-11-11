'use client';

// ============================================================
// Admin → Umfrage: Auswertung der Website-Umfrage (lib/umfrage.ts, Migration 0068)
// ============================================================
// Je Frage: Anzahl und Anteil je Antwort (Balken), Sterne/Skala mit Schnitt,
// Empfehlung zusätzlich als NPS, Freitexte als Liste. Anonym — keine Namen.
// ============================================================

import { useEffect, useState } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { supabase } from '@/lib/supabase/client';
import { UMFRAGEN, umfrageEnde, umfrageLaeuft, type Antworten, type Frage } from '@/lib/umfrage';

type Zeile = { antworten: Antworten; created_at: string };
const datumDe = (iso: string) => iso.slice(0, 10).split('-').reverse().join('.');
const txt: React.CSSProperties = { fontFamily: 'var(--font-manrope)', fontSize: 14, color: 'var(--th-text-body)', lineHeight: 1.5 };

export default function UmfrageAuswertung() {
  const [z, setZ] = useState<Zeile[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [wahl, setWahl] = useState(UMFRAGEN[0].def.id);
  // Direktlink aus der Glocke: ?umfrage=<id>
  useEffect(() => {
    const w = new URLSearchParams(window.location.search).get('umfrage');
    if (w && UMFRAGEN.some(u => u.def.id === w)) queueMicrotask(() => setWahl(w));
  }, []);
  const { def: UMFRAGE, fragen: FRAGEN } = UMFRAGEN.find(u => u.def.id === wahl) ?? UMFRAGEN[0];
  useEffect(() => {
    let ab = false;
    queueMicrotask(() => { if (!ab) { setZ(null); setFehler(null); } });
    (async () => {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      const r = await fetch(`/api/umfrage?umfrage=${encodeURIComponent(wahl)}`, { headers: { Authorization: `Bearer ${token ?? ''}` } }).catch(() => null);
      const j = r ? await r.json().catch(() => ({})) : { error: 'Keine Verbindung.' };
      if (ab) return;
      if (r?.ok) setZ((j as { antworten: Zeile[] }).antworten); else setFehler((j as { error?: string }).error ?? 'Fehlgeschlagen.');
    })();
    return () => { ab = true; };
  }, [wahl]);

  const laeuft = umfrageLaeuft(new Date(), UMFRAGE);
  const ende = umfrageEnde(UMFRAGE);
  return (
    <AdminGuard title="Umfrage" subtitle={UMFRAGE.titel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
        <div role="tablist" aria-label="Umfrage wählen" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {UMFRAGEN.map(u => (
            <button key={u.def.id} type="button" role="tab" aria-selected={u.def.id === wahl} onClick={() => setWahl(u.def.id)} style={{
              fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${u.def.id === wahl ? 'var(--th-accent)' : 'var(--th-line-10)'}`,
              background: u.def.id === wahl ? 'var(--th-accent)' : 'var(--th-bg-card)', color: u.def.id === wahl ? '#fff' : 'var(--th-text-body)',
            }}>{u.def.titel}</button>
          ))}
        </div>
        <Karte>
          <div style={txt}>
            <strong>Status:</strong>{' '}
            {!UMFRAGE.live ? 'noch nicht gestartet (kein Popup, Antworten werden nicht gespeichert)'
              : laeuft ? (ende ? `läuft bis ${datumDe(ende)}` : 'läuft (ohne Ende, nur per Link)') : `beendet bzw. Zeitraum ${datumDe(UMFRAGE.start)} – ${datumDe(ende ?? '')}`}
            {' · '}<a href={UMFRAGE.pfad} target="_blank" rel="noreferrer" style={{ color: 'var(--th-accent)', fontWeight: 700 }}>Umfrage ansehen</a>
          </div>
          {z && <div style={{ ...txt, marginTop: 6 }}><strong>{z.length}</strong> Teilnahme{z.length === 1 ? '' : 'n'}{z.length ? ` · zuletzt ${datumDe(z[0].created_at)}` : ''}</div>}
        </Karte>
        {fehler && <div role="alert" style={{ ...txt, color: 'var(--th-loss)', fontWeight: 700 }}>{fehler}</div>}
        {!z && !fehler && <div style={txt}>Lade …</div>}
        {z && z.length > 0 && FRAGEN.map((f, i) => <Auswertung key={f.id} f={f} nr={i + 1} z={z} />)}
      </div>
    </AdminGuard>
  );
}

function Auswertung({ f, nr, z }: { f: Frage; nr: number; z: Zeile[] }) {
  const werte = z.map(r => r.antworten[f.id]).filter(v => v !== undefined);
  const n = werte.length;
  let inhalt: React.ReactNode;
  if (f.typ === 'eine' || f.typ === 'mehr') {
    const zahl: Record<string, number> = {};
    for (const v of werte) for (const w of (Array.isArray(v) ? v : [v]) as string[]) zahl[w] = (zahl[w] ?? 0) + 1;
    const opts = [...f.optionen!].sort((a, b) => (zahl[b.wert] ?? 0) - (zahl[a.wert] ?? 0));
    const frei = f.freitextBei ? z.map(r => r.antworten[`${f.id}_text`]).filter((t): t is string => typeof t === 'string') : [];
    inhalt = <>
      {opts.map(o => <Balken key={o.wert} text={o.text} anzahl={zahl[o.wert] ?? 0} von={n} />)}
      {frei.length > 0 && <Liste titel="Freitext" eintraege={frei} />}
    </>;
  } else if (f.typ === 'sterne' || f.typ === 'skala') {
    const zahlen = werte as number[];
    const schnitt = n ? zahlen.reduce((s, x) => s + x, 0) / n : 0;
    const stufen = f.typ === 'sterne' ? [5, 4, 3, 2, 1] : [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const nps = f.typ === 'skala' && n ? Math.round(100 * (zahlen.filter(x => x >= 9).length - zahlen.filter(x => x <= 6).length) / n) : null;
    inhalt = <>
      <div style={{ ...txt, marginBottom: 6 }}>Schnitt <strong>{schnitt.toLocaleString('de-DE', { maximumFractionDigits: 1 })}</strong> von {f.typ === 'sterne' ? 5 : 10}
        {nps !== null && <> · NPS <strong>{nps > 0 ? '+' : ''}{nps}</strong> <span style={{ color: 'var(--th-text-muted)' }}>(9–10 minus 0–6, in %)</span></>}</div>
      {stufen.map(s => <Balken key={s} text={f.typ === 'sterne' ? '★'.repeat(s) : String(s)} anzahl={zahlen.filter(x => x === s).length} von={n} />)}
    </>;
  } else {
    inhalt = <Liste eintraege={werte as string[]} />;
  }
  return (
    <Karte>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 15, color: 'var(--th-text-strong)', marginBottom: 8 }}>
        {nr}. {f.frage} <span style={{ fontWeight: 600, color: 'var(--th-text-muted)', fontSize: 13 }}>· {n} Antwort{n === 1 ? '' : 'en'}</span>
      </div>
      {n ? inhalt : <div style={{ ...txt, color: 'var(--th-text-muted)' }}>Noch keine Antworten.</div>}
    </Karte>
  );
}

function Balken({ text, anzahl, von }: { text: string; anzahl: number; von: number }) {
  const pz = von ? Math.round((anzahl / von) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 34%) 1fr 64px', gap: 10, alignItems: 'center', margin: '4px 0', ...txt, fontSize: 13.5 }}>
      <span>{text}</span>
      <span style={{ height: 10, borderRadius: 5, background: 'var(--th-line-6)', overflow: 'hidden' }}>
        <span style={{ display: 'block', height: '100%', width: `${pz}%`, background: 'var(--th-accent)', borderRadius: 5 }} />
      </span>
      <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{anzahl} · {pz} %</span>
    </div>
  );
}

function Liste({ titel, eintraege }: { titel?: string; eintraege: string[] }) {
  return (
    <div style={{ marginTop: titel ? 8 : 0 }}>
      {titel && <div style={{ ...txt, fontWeight: 700, marginBottom: 4 }}>{titel}</div>}
      <ul style={{ margin: 0, paddingLeft: 18, ...txt, fontSize: 13.5 }}>
        {eintraege.map((t, i) => <li key={i} style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{t}</li>)}
      </ul>
    </div>
  );
}

function Karte({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 12, padding: '14px 16px' }}>{children}</div>;
}
