'use client';

// ============================================================
// /kiosk — Eingabeseite fürs Tablet im Lokal (Betreiber, 19.11.2026)
// ============================================================
// Das Tablet startet im Kiosk-Modus direkt hier. Es hat kein Konto: einmal mit
// einem Code aus dem Team Manager gekoppelt, zeigt es von selbst das heutige
// Heimspiel seines Teams — Aufstellung antippen, dann die 18 Spiele in
// derselben Anzeige wie der Live-Modus des Formulars (LiveAnzeige).
// Gespeichert wird von selbst (3 s nach der letzten Eingabe) über /api/kiosk;
// Team und Begegnung bestimmt der Server, nicht das Gerät.
// Zustände: koppeln · nicht aktiv · heute kein Spiel · Aufstellung · Spiel · abgesendet.
// `/kiosk?probe=1`: erfundene Begegnung, rechnet nur im Gerät, schickt nichts.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveAnzeige, LIVE_HINTERGRUND, GRUEN, BLAU, GOLD, type LiveBearbeiten } from '@/components/mdu/live-anzeige';
import { highlightHinzufuegen, legResults, type BestOf, type HighlightEntry, type ReportGame, type ReportPlayer } from '@/lib/supabase/match-reports';
import type { LiveStand } from '@/lib/spielbericht-live';
import {
  absendeFehler, alleGespielt, aufstellungFertig, CODE_LAENGE, codeAnzeige, erlaubteSlots, leereSpiele, leereSpieler, legsSetzen, slotSetzen,
  PROBE, type KioskStand,
} from '@/lib/kiosk';
import type { KioskLage } from '@/lib/server/kiosk';

interface Zustand { schritt: 'aufstellung' | 'spiel'; heim: ReportPlayer[]; gast: ReportPlayer[]; games: ReportGame[]; highlights: HighlightEntry[] }

const TOKEN = 'mdu-kiosk-token', SICHERUNG = 'mdu-kiosk-stand', PROBE_SPEICHER = 'mdu-kiosk-probe';
const lesen = <T,>(k: string): T | null => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) as T : null; } catch { return null; } };
const schreiben = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privat / voll */ } };

const knopf: React.CSSProperties = { border: 0, borderRadius: 14, padding: '14px 22px', fontSize: 18, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 56 };
// top/right/bottom/left statt `inset`: ältere iPads (Safari < 14.1) kennen `inset` nicht — die Seite blieb dort weiß (19.11.2026).
const rahmen: React.CSSProperties = { position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, overflow: 'auto', color: '#fff', fontFamily: 'var(--font-manrope)', background: LIVE_HINTERGRUND };
const gross: React.CSSProperties = { fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.05 };

const mitNamen = (side: 'home' | 'guest', liste: { slot: number; name: string }[]) =>
  leereSpieler(side).map(p => ({ ...p, name: liste.find(x => x.slot === p.slot)?.name ?? '' }));
const zuStand = (z: Zustand): KioskStand => ({
  heim: z.heim.filter(p => p.name.trim()).map(p => ({ slot: p.slot, name: p.name.trim() })),
  gast: z.gast.filter(p => p.name.trim()).map(p => ({ slot: p.slot, name: p.name.trim() })),
  games: z.games, highlights: z.highlights,
});
const ausStand = (s: KioskStand): Zustand => {
  const heim = mitNamen('home', s.heim), gast = mitNamen('guest', s.gast);
  const begonnen = s.games.some(g => g.legs_home != null);
  return { schritt: begonnen && aufstellungFertig(heim, gast) ? 'spiel' : 'aufstellung', heim, gast, games: s.games, highlights: s.highlights };
};

async function api(pfad: string, body?: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
  const token = lesen<string>(TOKEN);
  const headers: Record<string, string> = { ...(token ? { 'x-kiosk-token': token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) };
  try {
    const r = await fetch(pfad, { method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', credentials: 'same-origin' });
    return { status: r.status, json: await r.json().catch(() => ({})) };
  } catch { return { status: 0, json: {} }; }
}

export default function KioskPage() {
  const [modus, setModus] = useState<'probe' | 'echt' | null>(null);
  const [code, setCode] = useState('');
  useEffect(() => {
    (window as unknown as { __kioskLaeuft?: boolean }).__kioskLaeuft = true;   // für die Diagnose im Layout
    queueMicrotask(() => {
      const q = new URLSearchParams(window.location.search);
      setCode((q.get('code') ?? '').replace(/\D/g, '').slice(0, CODE_LAENGE));
      setModus(q.get('probe') === '1' ? 'probe' : 'echt');
    });
  }, []);
  if (modus === null) return <Laedt />;
  return modus === 'probe' ? <Probe /> : <Echt codeVorgabe={code} />;
}

// ── Probe: nur im Gerät ────────────────────────────────────────
function Probe() {
  const neu = (): Zustand => ({
    schritt: 'aufstellung',
    // Heim ist schon gesetzt (so käme es aus dem Team Manager), den Gast tippt man selbst.
    heim: mitNamen('home', PROBE.kaderHeim.slice(0, 5).map((name, i) => ({ slot: i + 1, name }))),
    gast: leereSpieler('guest'), games: leereSpiele(), highlights: [],
  });
  const [z, setZ] = useState<Zustand>(neu);
  const [geladen, setGeladen] = useState(false);
  useEffect(() => { queueMicrotask(() => { const s = lesen<Zustand>(PROBE_SPEICHER); if (s?.games?.length === 18) setZ(s); setGeladen(true); }); }, []);
  useEffect(() => { if (geladen) schreiben(PROBE_SPEICHER, z); }, [z, geladen]);
  const [hinweis, setHinweis] = useState(false);
  return (
    <div style={rahmen}>
      <Band farbe={GOLD}>
        <span>PROBE – erfundene Begegnung, nichts wird gespeichert oder veröffentlicht</span>
        <button type="button" onClick={() => setZ(neu())} style={bandKnopf}>Von vorn</button>
      </Band>
      <Eingabe z={z} setZ={setZ} heimName={PROBE.heim} gastName={PROBE.gast} heimId={null} gastId={null} liga="Probe" datum={null} ort="" bestOf={3}
        kaderHeim={PROBE.kaderHeim} kaderGast={PROBE.kaderGast} onAbsenden={() => setHinweis(true)} />
      {hinweis && <Frage titel="Hier würde der Spielbericht abgesendet" text="In der Probe passiert nichts." ja="Alles klar" onJa={() => setHinweis(false)} />}
    </div>
  );
}

// ── Echtbetrieb ────────────────────────────────────────────────
type Speicher = 'ok' | 'offen' | 'speichert' | 'fehler';

function Echt({ codeVorgabe }: { codeVorgabe: string }) {
  const [lage, setLage] = useState<KioskLage | 'koppeln' | 'fehler' | null>(null);
  const [z, setZ0] = useState<Zustand | null>(null);
  const [speicher, setSpeicher] = useState<Speicher>('ok');
  const [meldung, setMeldung] = useState<string | null>(null);
  const [frage, setFrage] = useState(false);
  const basis = useRef<string | null>(null);
  const version = useRef(0);          // zählt Eingaben
  const gespeichert = useRef(0);      // Version des letzten erfolgreichen Speicherns
  const laeuft = useRef(false);
  const zRef = useRef<Zustand | null>(null);
  const keyRef = useRef<string | null>(null);

  const uebernehmen = useCallback((l: KioskLage, sicherungNutzen: boolean) => {
    setLage(l);
    if (l.art !== 'spiel') { setZ0(null); zRef.current = null; keyRef.current = null; return; }
    basis.current = l.basis;
    let neu = ausStand(l.stand);
    // Noch nicht gespeicherte Eingaben dieses Spiels (Netz weg, Tablet neu gestartet) gehen vor.
    const s = sicherungNutzen ? lesen<{ key: string; datum: string; z: Zustand }>(SICHERUNG) : null;
    const ausSicherung = !!s && s.key === l.key && s.datum === l.datum && s.z?.games?.length === 18 && l.status === 'offen';
    if (ausSicherung) neu = s!.z;
    // Bei einem neuen Stand vom Server bleibt man auf der Seite, auf der man gerade ist.
    if (!ausSicherung && keyRef.current === l.key && zRef.current) neu = { ...neu, schritt: zRef.current.schritt };
    keyRef.current = l.key; zRef.current = neu; setZ0(neu);
    if (ausSicherung) { version.current += 1; setSpeicher('offen'); } else { gespeichert.current = version.current; setSpeicher('ok'); }
  }, []);

  const laden = useCallback(async (sicherungNutzen = false) => {
    const r = await api('/api/kiosk');
    if (r.status === 401) { setLage('koppeln'); return; }
    if (r.status !== 200) { setLage(l => l ?? 'fehler'); return; }
    uebernehmen(r.json as unknown as KioskLage, sicherungNutzen);
  }, [uebernehmen]);
  useEffect(() => { queueMicrotask(() => void laden(true)); }, [laden]);

  const spiel = lage && typeof lage === 'object' && lage.art === 'spiel' ? lage : null;
  const offen = spiel?.status === 'offen';

  const setZ = useCallback((f: (x: Zustand) => Zustand) => {
    setZ0(alt => {
      if (!alt) return alt;
      const neu = f(alt);
      zRef.current = neu;
      // Nur der Wechsel zwischen Aufstellung und Spiel ist keine Eingabe.
      if (neu.heim !== alt.heim || neu.gast !== alt.gast || neu.games !== alt.games || neu.highlights !== alt.highlights) {
        version.current += 1;
        if (keyRef.current && spiel) schreiben(SICHERUNG, { key: spiel.key, datum: spiel.datum, z: neu });
        setSpeicher('offen');
      }
      return neu;
    });
  }, [spiel]);

  const speichern = useCallback(async (absenden = false): Promise<boolean> => {
    const stand = zRef.current;
    if (!stand || laeuft.current) return false;
    laeuft.current = true; setSpeicher('speichert');
    const v = version.current;
    const r = await api('/api/kiosk', { stand: zuStand(stand), basis: basis.current, absenden });
    laeuft.current = false;
    if (r.status === 200) {
      basis.current = String(r.json.basis ?? '') || basis.current;
      gespeichert.current = v;
      if (version.current === v) { setSpeicher('ok'); try { localStorage.removeItem(SICHERUNG); } catch { /* egal */ } } else setSpeicher('offen');
      if (absenden) await laden();
      return true;
    }
    if (r.status === 401) { setLage('koppeln'); return false; }
    if (r.json.konflikt) {
      // Jemand anderes hat gespeichert (Kapitän am Handy) — dessen Stand gilt.
      try { localStorage.removeItem(SICHERUNG); } catch { /* egal */ }
      setMeldung(String(r.json.error ?? 'Der Stand wurde auf einem anderen Gerät geändert.') + ' Der neue Stand wurde geladen.');
      await laden();
      return false;
    }
    if (r.status === 400 || r.status === 409) setMeldung(String(r.json.error ?? 'Das hat nicht geklappt.'));
    setSpeicher('fehler');
    return false;
  }, [laden]);

  // Autospeichern: 3 s nach der letzten Eingabe; nach einem Fehler neuer Versuch nach 15 s.
  // Gespeichert wird ab dem ersten Ergebnis (wie im Formular) — vorher liegt die Aufstellung nur im Gerät.
  useEffect(() => {
    if (!offen || !z || (speicher !== 'offen' && speicher !== 'fehler')) return;
    if (basis.current == null && !z.games.some(g => g.legs_home != null)) return;
    const t = setTimeout(() => void speichern(), speicher === 'fehler' ? 15_000 : 3000);
    return () => clearTimeout(t);
  }, [z, speicher, offen, speichern]);

  // Nachsehen, ob sich etwas getan hat: Spiel läuft → alle 45 s (nur ohne offene Eingaben), sonst alle 5 Min.
  useEffect(() => {
    if (lage === null || lage === 'koppeln') return;
    const t = setInterval(() => { if (!laeuft.current && version.current === gespeichert.current) void laden(); }, spiel ? 45_000 : 300_000);
    return () => clearInterval(t);
  }, [lage, spiel, laden]);

  if (lage === null) return <Laedt />;
  if (lage === 'koppeln') return <Koppeln vorgabe={codeVorgabe} fertig={() => { setLage(null); void laden(true); }} />;
  if (lage === 'fehler') return <Tafel titel="Keine Verbindung" text="Das Tablet erreicht die MDU-Seite gerade nicht. Es versucht es von selbst wieder." knopfText="Jetzt versuchen" onKnopf={() => void laden(true)} />;
  if (lage.art === 'aus' || lage.art === 'kein_premium') return <Tafel titel="Tablet-Eingabe nicht aktiv" text={lage.art === 'aus' ? `Für ${lage.team} ist die Eingabe am Tablet nicht freigeschaltet.` : `${lage.team} hat den Team Manager gerade nicht aktiv. Der Kapitän kann ihn unter „Mein Team“ wieder freischalten.`} />;
  if (lage.art === 'kein_spiel') {
    const n = lage.naechstes;
    return <Tafel titel="Heute kein Spiel" text={n
      ? `${n.heim === false ? 'Nächstes Spiel' : 'Nächstes Heimspiel'} von ${lage.team}: ${new Date(n.datum + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}${n.uhrzeit ? `, ${n.uhrzeit} Uhr` : ''} ${n.heim === false ? 'bei' : 'gegen'} ${n.gegner}.`
      : `Für ${lage.team} steht kein weiteres Heimspiel im Plan.`} knopfText="Aktualisieren" onKnopf={() => void laden(true)} leise />;
  }
  if (!z || !spiel) return <Laedt />;
  const kopf = { heimName: spiel.heimName, gastName: spiel.gastName, heimId: spiel.heimId, gastId: spiel.gastId, liga: spiel.liga, datum: spiel.datum, ort: spiel.ort, bestOf: spiel.bestOf };

  if (spiel.status !== 'offen') return (
    <div style={rahmen}>
      <Band farbe={GRUEN} hell>{spiel.status === 'gesperrt' ? 'Für dieses Spiel hat die Ligaleitung eine Wertung eingetragen.' : spiel.test ? '✓ Testspiel abgesendet – so sieht es nach einem echten Abend aus. Der Kapitän beendet den Test im Team Manager.' : '✓ Der Spielbericht ist abgesendet. Danke! Der Gast bestätigt ihn jetzt.'}</Band>
      <LiveAnzeige s={liveStand(z, kopf)} />
    </div>
  );

  const grund = absendeFehler(zuStand(z));
  return (
    <div style={rahmen}>
      {spiel.test && <Band farbe={GOLD}>TESTSPIEL – wird nicht veröffentlicht und am Ende gelöscht</Band>}
      <Eingabe z={z} setZ={setZ} {...kopf} kaderHeim={spiel.kaderHeim} kaderGast={spiel.kaderGast}
        onAbsenden={() => (grund ? setMeldung(grund) : setFrage(true))}
        status={!spiel.basis && !z.games.some(g => g.legs_home != null) ? '' : speicher === 'ok' ? '✓ gespeichert' : speicher === 'fehler' ? '⚠ Kein Netz – wird nachgeholt' : 'speichert …'} statusFehler={speicher === 'fehler'} />
      {frage && <Frage titel="Abend fertig?" text={`Der Spielbericht ${spiel.heimName} – ${spiel.gastName} wird jetzt abgesendet. Danach kannst du hier nichts mehr ändern.`}
        ja="Ja, absenden" nein="Noch nicht" onNein={() => setFrage(false)} onJa={() => { setFrage(false); void speichern(true); }} />}
      {meldung && <Frage titel="Hinweis" text={meldung} ja="Ok" onJa={() => setMeldung(null)} />}
    </div>
  );
}

interface Kopf { heimName: string; gastName: string; heimId: string | null; gastId: string | null; liga: string; datum: string | null; ort: string; bestOf: BestOf }
const liveStand = (z: Zustand, k: Kopf): LiveStand => ({
  homeTeamId: k.heimId, guestTeamId: k.gastId, homeName: k.heimName, guestName: k.gastName, liga: k.liga, datum: k.datum, ort: k.ort,
  homePlayers: z.heim, guestPlayers: z.gast, games: z.games, highlights: z.highlights, bestOf: k.bestOf, zeit: 0,
});

// ── Gemeinsame Oberfläche (Probe + Echtbetrieb) ────────────────
function Eingabe({ z, setZ, kaderHeim, kaderGast, onAbsenden, status, statusFehler, ...k }: Kopf & {
  z: Zustand; setZ: (f: (x: Zustand) => Zustand) => void; kaderHeim: readonly string[]; kaderGast: readonly string[];
  onAbsenden: () => void; status?: string; statusFehler?: boolean;
}) {
  const statusFeld = status ? <span style={{ alignSelf: 'center', padding: '8px 14px', borderRadius: 999, fontSize: 15, fontWeight: 800, background: statusFehler ? 'rgba(200,60,60,0.9)' : 'rgba(30,36,48,0.95)' }}>{status}</span> : null;

  if (z.schritt === 'aufstellung') {
    const bereit = aufstellungFertig(z.heim, z.gast);
    return (
      <>
        <div style={{ padding: 'clamp(12px, 2vw, 28px)', paddingBottom: 120, maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ ...gross, fontSize: 'clamp(30px, 4.5vw, 54px)', margin: '8px 0 4px' }}>Wer spielt heute?</h1>
          <p style={{ fontSize: 18, opacity: 0.8, margin: '0 0 18px' }}>Tipp auf einen Platz und wähl den Namen. 1–4 spielen von Anfang an, 5–8 sind Ersatz.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            <Mannschaft titel={k.heimName} label="Heim" prefix="H" farbe={GRUEN} spieler={z.heim} kader={kaderHeim} onChange={f => setZ(x => ({ ...x, heim: f(x.heim) }))} />
            <Mannschaft titel={k.gastName} label="Gast" prefix="G" farbe={BLAU} spieler={z.gast} kader={kaderGast} onChange={f => setZ(x => ({ ...x, gast: f(x.gast) }))} />
          </div>
        </div>
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: 14, background: 'linear-gradient(transparent, rgba(11,14,20,0.95) 35%)', display: 'flex', justifyContent: 'center', gap: 10 }}>
          {statusFeld}
          <button type="button" disabled={!bereit} onClick={() => setZ(x => ({ ...x, schritt: 'spiel' }))}
            style={{ ...knopf, background: bereit ? GRUEN : 'rgba(255,255,255,0.14)', opacity: bereit ? 1 : 0.7, fontSize: 22, minHeight: 68, width: 'min(560px, 100%)' }}>
            {bereit ? (z.games.some(g => g.legs_home != null) ? 'Weiter zum Spiel →' : 'Los geht’s →') : 'Erst die Plätze 1–4 beider Teams besetzen'}
          </button>
        </div>
      </>
    );
  }

  const bearbeiten: LiveBearbeiten = {
    legOptionen: legResults(k.bestOf),
    slotOptionen: (no, feld) => erlaubteSlots(z.games, feld.startsWith('home') ? z.heim : z.gast, no, feld),
    onLegs: (no, res) => setZ(x => ({ ...x, games: legsSetzen(x.games, no, res) })),
    onSlot: (no, feld, slot) => setZ(x => ({ ...x, games: slotSetzen(x.games, no, feld, slot) })),
    onHighlight: h => setZ(x => ({ ...x, highlights: highlightHinzufuegen(x.highlights, h) })),
    onHighlightWeg: i => setZ(x => ({ ...x, highlights: x.highlights.filter((_, n) => n !== i) })),
  };
  return (
    <>
      <div style={{ paddingBottom: 96 }}><LiveAnzeige s={liveStand(z, k)} bearbeiten={bearbeiten} /></div>
      <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 3, display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap', pointerEvents: 'none' }}>
        <button type="button" onClick={() => setZ(x => ({ ...x, schritt: 'aufstellung' }))} style={{ ...knopf, background: 'rgba(30,36,48,0.95)', pointerEvents: 'auto' }}>‹ Aufstellung</button>
        <span style={{ display: 'flex', gap: 10, pointerEvents: 'auto' }}>
          {statusFeld}
          {alleGespielt(z.games) && <button type="button" onClick={onAbsenden} style={{ ...knopf, background: GRUEN, fontSize: 20 }}>Abend fertig – absenden</button>}
        </span>
      </div>
    </>
  );
}

function Mannschaft({ titel, label, prefix, farbe, spieler, kader, onChange }: {
  titel: string; label: string; prefix: string; farbe: string; spieler: ReportPlayer[]; kader: readonly string[];
  onChange: (f: (s: ReportPlayer[]) => ReportPlayer[]) => void;
}) {
  const [offen, setOffen] = useState<number | null>(null);
  const [frei, setFrei] = useState('');
  const setze = (slot: number, roh: string) => {
    const name = roh.replace(/\s+/g, ' ').trim().slice(0, 60);
    // Ein Name steht nur einmal in der Aufstellung — wer umzieht, räumt den alten Platz.
    onChange(liste => liste.map(p => (p.slot === slot ? { ...p, name } : name && p.name === name ? { ...p, name: '' } : p)));
    setOffen(null); setFrei('');
  };
  const vergeben = new Set(spieler.map(p => p.name).filter(Boolean));
  const klein: React.CSSProperties = { ...knopf, fontSize: 17, padding: '10px 12px' };
  return (
    <section data-seite={prefix === 'H' ? 'home' : 'guest'} style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.05)', border: `2px solid ${farbe}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: farbe === GRUEN ? '#8BD67F' : '#9DBEEB' }}>{label}</div>
      <div style={{ ...gross, fontSize: 30, marginBottom: 12 }}>{titel}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {spieler.map(p => (
          <div key={p.slot}>
            {p.slot === 5 && <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, margin: '8px 0' }}>Ersatz</div>}
            <button type="button" onClick={() => { setOffen(offen === p.slot ? null : p.slot); setFrei(''); }}
              style={{ width: '100%', minHeight: 64, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', border: offen === p.slot ? `2px solid ${GOLD}` : '2px solid transparent', borderRadius: 14, padding: '10px 14px', background: p.name ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', background: farbe, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24 }}>{prefix}{p.slot}</span>
              <span style={{ fontSize: 22, fontWeight: 800, opacity: p.name ? 1 : 0.45 }}>{p.name || 'antippen'}</span>
            </button>
            {offen === p.slot && (
              <div style={{ padding: '10px 0 6px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                  {kader.map(n => (
                    <button key={n} type="button" onClick={() => setze(p.slot, n)}
                      style={{ ...klein, background: n === p.name ? farbe : 'rgba(255,255,255,0.14)', opacity: vergeben.has(n) && n !== p.name ? 0.5 : 1 }}>{n}</button>
                  ))}
                  {p.name && <button type="button" onClick={() => setze(p.slot, '')} style={{ ...klein, background: 'rgba(200,60,60,0.5)' }}>Platz leeren</button>}
                </div>
                <form onSubmit={e => { e.preventDefault(); if (frei.trim()) setze(p.slot, frei); }} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={frei} onChange={e => setFrei(e.target.value)} maxLength={60} placeholder="Steht nicht in der Liste? Name eintippen" aria-label="Anderer Name"
                    style={{ flex: 1, minWidth: 0, minHeight: 52, borderRadius: 12, border: '2px dashed rgba(255,255,255,0.35)', background: 'transparent', color: '#fff', fontSize: 17, fontFamily: 'inherit', padding: '0 12px' }} />
                  <button type="submit" disabled={!frei.trim()} style={{ ...klein, opacity: frei.trim() ? 1 : 0.5 }}>Eintragen</button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Koppeln: einmalig, Code aus dem Team Manager ───────────────
function Koppeln({ vorgabe, fertig }: { vorgabe: string; fertig: () => void }) {
  const [code, setCode] = useState(vorgabe);
  const [fehler, setFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const senden = async (c: string) => {
    setBusy(true); setFehler(null);
    const r = await api('/api/kiosk/koppeln', { code: c });
    setBusy(false);
    if (r.status === 200 && typeof r.json.token === 'string') { schreiben(TOKEN, r.json.token); fertig(); return; }
    setFehler(r.status === 0 ? 'Keine Verbindung – bitte noch einmal.' : String(r.json.error ?? 'Das hat nicht geklappt.'));
    setCode('');
  };
  const tippe = (zeichen: string) => {
    if (busy) return;
    const neu = zeichen === '←' ? code.slice(0, -1) : (code + zeichen).slice(0, CODE_LAENGE);
    setCode(neu); setFehler(null);
    if (neu.length === CODE_LAENGE) void senden(neu);
  };
  const taste: React.CSSProperties = { ...knopf, fontSize: 30, minHeight: 76, fontFamily: 'var(--font-saira-condensed)' };
  return (
    <div style={{ ...rahmen, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(440px, 100%)', textAlign: 'center' }}>
        <div style={{ ...gross, fontSize: 40 }}>Tablet einrichten</div>
        <p style={{ fontSize: 17, opacity: 0.8, margin: '10px 0 18px' }}>Tipp den Code ein, den dir der Kapitän im Team Manager unter „Tablet im Lokal“ zeigt. Das ist nur einmal nötig.</p>
        <div aria-live="polite" style={{ ...gross, fontSize: 46, letterSpacing: '0.12em', minHeight: 60, padding: '8px 0', borderRadius: 14, background: 'rgba(255,255,255,0.06)', marginBottom: 12 }}>
          {busy ? '…' : codeAnzeige(code.padEnd(CODE_LAENGE, '·'))}
        </div>
        {fehler && <div role="alert" style={{ color: '#FF9C9C', fontWeight: 800, fontSize: 16, marginBottom: 12 }}>{fehler}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((t, i) => t
            ? <button key={i} type="button" onClick={() => tippe(t)} style={taste} aria-label={t === '←' ? 'Löschen' : t}>{t}</button>
            : <span key={i} />)}
        </div>
        <a href="/kiosk?probe=1" style={{ display: 'inline-block', marginTop: 22, color: '#fff', opacity: 0.7, fontSize: 15 }}>Erst einmal ohne Code ausprobieren</a>
      </div>
    </div>
  );
}

// ── Kleinteile ─────────────────────────────────────────────────
/** Steht schon im ausgelieferten HTML: Bleibt es bei „Lädt …“, läuft das Skript der Seite auf diesem Gerät nicht. */
function Laedt() {
  return <div style={{ ...rahmen, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, opacity: 0.9 }}>Lädt …</div>;
}
const bandKnopf: React.CSSProperties = { border: 0, borderRadius: 999, padding: '6px 14px', fontWeight: 800, fontSize: 14, background: 'rgba(0,0,0,0.18)', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' };
function Band({ farbe, hell, children }: { farbe: string; hell?: boolean; children: React.ReactNode }) {
  return <div style={{ position: 'sticky', top: 0, zIndex: 5, background: farbe, color: hell ? '#fff' : '#1a1300', fontWeight: 800, fontSize: 16, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', textAlign: 'center' }}>{children}</div>;
}
function Tafel({ titel, text, knopfText, onKnopf, leise }: { titel: string; text: string; knopfText?: string; onKnopf?: () => void; leise?: boolean }) {
  return (
    <div style={{ ...rahmen, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 640 }}>
        <div style={{ ...gross, fontSize: 'clamp(40px, 7vw, 84px)' }}>{titel}</div>
        <p style={{ fontSize: 20, opacity: 0.8, margin: '16px 0 0', lineHeight: 1.45 }}>{text}</p>
        {knopfText && <button type="button" onClick={onKnopf} style={{ ...knopf, background: leise ? 'rgba(255,255,255,0.14)' : GRUEN, marginTop: 24 }}>{knopfText}</button>}
      </div>
    </div>
  );
}
function Frage({ titel, text, ja, nein, onJa, onNein }: { titel: string; text: string; ja: string; nein?: string; onJa: () => void; onNein?: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={titel} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div style={{ width: 'min(520px, 100%)', borderRadius: 20, padding: 24, background: '#1B212D', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' }}>
        <div style={{ ...gross, fontSize: 34 }}>{titel}</div>
        <p style={{ fontSize: 18, opacity: 0.85, lineHeight: 1.45, margin: '12px 0 20px' }}>{text}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {nein && <button type="button" onClick={onNein} style={knopf}>{nein}</button>}
          <button type="button" onClick={onJa} style={{ ...knopf, background: GRUEN }}>{ja}</button>
        </div>
      </div>
    </div>
  );
}
