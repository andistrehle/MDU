'use client';

// ============================================================
// /kiosk — Eingabeseite fürs Tablet im Lokal
// ============================================================
// Stand 19.11.2026: NUR DIE PROBE (`/kiosk?probe=1`). Sie zeigt den geplanten
// Ablauf — Aufstellung antippen, dann die 18 Spiele im Aufbau des Bogens —
// mit einer erfundenen Begegnung, rechnet nur im Gerät und schickt NICHTS an
// den Server (kein Spielbericht, kein Live-Ticker). Ohne `?probe=1` sagt die
// Seite ehrlich, dass es die Gerätebindung noch nicht gibt.
// Die Spielansicht ist dieselbe wie im Live-Modus des Formulars (LiveAnzeige).
// ============================================================

import { useEffect, useState } from 'react';
import { LiveAnzeige, LIVE_HINTERGRUND, GRUEN, BLAU, GOLD, type LiveBearbeiten } from '@/components/mdu/live-anzeige';
import { highlightHinzufuegen, legResults, type HighlightEntry, type ReportGame, type ReportPlayer } from '@/lib/supabase/match-reports';
import type { LiveStand } from '@/lib/spielbericht-live';
import { alleGespielt, aufstellungFertig, erlaubteSlots, leereSpiele, leereSpieler, legsSetzen, slotSetzen, PROBE, type Seite } from '@/lib/kiosk';

const SPEICHER = 'mdu-kiosk-probe';
interface Zustand { schritt: 'aufstellung' | 'spiel'; heim: ReportPlayer[]; gast: ReportPlayer[]; games: ReportGame[]; highlights: HighlightEntry[] }

/** Start der Probe: Heim ist schon gesetzt (so käme sie aus dem Team Manager), den Gast tippt man selbst. */
const neu = (): Zustand => ({
  schritt: 'aufstellung',
  heim: leereSpieler('home').map(p => ({ ...p, name: PROBE.kaderHeim[p.slot - 1] ?? '' })).map(p => (p.slot > 5 ? { ...p, name: '' } : p)),
  gast: leereSpieler('guest'),
  games: leereSpiele(),
  highlights: [],
});

const knopf: React.CSSProperties = { border: 0, borderRadius: 14, padding: '14px 22px', fontSize: 18, fontWeight: 800, color: '#fff', background: 'rgba(255,255,255,0.14)', cursor: 'pointer', fontFamily: 'inherit', minHeight: 56 };
const rahmen: React.CSSProperties = { position: 'fixed', inset: 0, overflow: 'auto', color: '#fff', fontFamily: 'var(--font-manrope)', background: LIVE_HINTERGRUND };

export default function KioskPage() {
  const [probe, setProbe] = useState<boolean | null>(null);
  const [z, setZ] = useState<Zustand>(neu);

  useEffect(() => {
    queueMicrotask(() => {
      setProbe(new URLSearchParams(window.location.search).get('probe') === '1');
      try { const s = localStorage.getItem(SPEICHER); if (s) setZ(JSON.parse(s) as Zustand); } catch { /* frisch anfangen */ }
    });
  }, []);
  useEffect(() => {
    if (probe) { try { localStorage.setItem(SPEICHER, JSON.stringify(z)); } catch { /* privat / voll */ } }
  }, [z, probe]);

  if (probe === null) return <div style={rahmen} />;
  if (!probe) return (
    <div style={{ ...rahmen, display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
      <div style={{ maxWidth: 560 }}>
        <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 44, textTransform: 'uppercase', lineHeight: 1.05 }}>Dieses Gerät ist noch nicht eingerichtet</div>
        <p style={{ fontSize: 18, opacity: 0.8, margin: '16px 0 28px' }}>Die Eingabe am Tablet ist in Vorbereitung. Du kannst dir schon ansehen, wie sie aussehen wird – dabei wird nichts gespeichert.</p>
        <a href="/kiosk?probe=1" style={{ ...knopf, background: GRUEN, textDecoration: 'none', display: 'inline-block' }}>Probe ansehen</a>
      </div>
    </div>
  );

  const neuStarten = () => { if (window.confirm('Probe von vorn beginnen?')) setZ(neu()); };
  const band = (
    <div style={{ position: 'sticky', top: 0, zIndex: 5, background: GOLD, color: '#1a1300', fontWeight: 800, fontSize: 15, padding: '8px 14px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      <span>PROBE – erfundene Begegnung, nichts wird gespeichert oder veröffentlicht</span>
      <button type="button" onClick={neuStarten} style={{ border: 0, borderRadius: 999, padding: '6px 14px', fontWeight: 800, fontSize: 14, background: 'rgba(0,0,0,0.18)', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit' }}>Von vorn</button>
    </div>
  );

  if (z.schritt === 'aufstellung') {
    const bereit = aufstellungFertig(z.heim, z.gast);
    return (
      <div style={rahmen}>
        {band}
        <div style={{ padding: 'clamp(12px, 2vw, 28px)', paddingBottom: 120, maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 'clamp(30px, 4.5vw, 54px)', textTransform: 'uppercase', margin: '8px 0 4px', lineHeight: 1.05 }}>Wer spielt heute?</h1>
          <p style={{ fontSize: 18, opacity: 0.8, margin: '0 0 18px' }}>Tipp auf einen Platz und wähl den Namen. 1–4 spielen von Anfang an, 5–8 sind Ersatz.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
            <Mannschaft titel={PROBE.heim} label="Heim" prefix="H" farbe={GRUEN} spieler={z.heim} kader={PROBE.kaderHeim} onChange={heim => setZ(x => ({ ...x, heim }))} />
            <Mannschaft titel={PROBE.gast} label="Gast" prefix="G" farbe={BLAU} spieler={z.gast} kader={PROBE.kaderGast} onChange={gast => setZ(x => ({ ...x, gast }))} />
          </div>
        </div>
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: 14, background: 'linear-gradient(transparent, rgba(11,14,20,0.95) 35%)', display: 'flex', justifyContent: 'center' }}>
          <button type="button" disabled={!bereit} onClick={() => setZ(x => ({ ...x, schritt: 'spiel' }))}
            style={{ ...knopf, background: bereit ? GRUEN : 'rgba(255,255,255,0.14)', opacity: bereit ? 1 : 0.7, fontSize: 22, minHeight: 68, width: 'min(560px, 100%)' }}>
            {bereit ? 'Los geht’s →' : 'Erst die Plätze 1–4 beider Teams besetzen'}
          </button>
        </div>
      </div>
    );
  }

  const stand: LiveStand = {
    homeTeamId: null, guestTeamId: null, homeName: PROBE.heim, guestName: PROBE.gast,
    liga: 'Probe', datum: null, ort: '', homePlayers: z.heim, guestPlayers: z.gast,
    games: z.games, highlights: z.highlights, bestOf: 3, zeit: 0,
  };
  const bearbeiten: LiveBearbeiten = {
    legOptionen: legResults(3),
    slotOptionen: (no, feld) => erlaubteSlots(z.games, feld.startsWith('home') ? z.heim : z.gast, no, feld),
    onLegs: (no, res) => setZ(x => ({ ...x, games: legsSetzen(x.games, no, res) })),
    onSlot: (no, feld, slot) => setZ(x => ({ ...x, games: slotSetzen(x.games, no, feld, slot) })),
    onHighlight: h => setZ(x => ({ ...x, highlights: highlightHinzufuegen(x.highlights, h) })),
    onHighlightWeg: i => setZ(x => ({ ...x, highlights: x.highlights.filter((_, k) => k !== i) })),
  };
  const fertig = alleGespielt(z.games);
  return (
    <div style={rahmen}>
      {band}
      <div style={{ paddingBottom: 96 }}><LiveAnzeige s={stand} bearbeiten={bearbeiten} /></div>
      <div style={{ position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 3, display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setZ(x => ({ ...x, schritt: 'aufstellung' }))} style={{ ...knopf, background: 'rgba(30,36,48,0.95)' }}>‹ Aufstellung</button>
        {fertig && (
          <button type="button" onClick={() => window.alert('Hier würde der Spielbericht abgesendet. In der Probe passiert nichts.')} style={{ ...knopf, background: GRUEN, fontSize: 20 }}>Abend fertig – absenden</button>
        )}
      </div>
    </div>
  );
}

function Mannschaft({ titel, label, prefix, farbe, spieler, kader, onChange }: {
  titel: string; label: string; prefix: string; farbe: string; spieler: ReportPlayer[]; kader: readonly string[]; onChange: (s: ReportPlayer[]) => void;
}) {
  const [offen, setOffen] = useState<number | null>(null);
  const setze = (slot: number, name: string) => {
    // Ein Name steht nur einmal in der Aufstellung — wer umzieht, räumt den alten Platz.
    onChange(spieler.map(p => (p.slot === slot ? { ...p, name } : name && p.name === name ? { ...p, name: '' } : p)));
    setOffen(null);
  };
  const vergeben = new Set(spieler.map(p => p.name).filter(Boolean));
  const seite: Seite = prefix === 'H' ? 'home' : 'guest';
  return (
    <section data-seite={seite} style={{ borderRadius: 18, padding: 16, background: 'rgba(255,255,255,0.05)', border: `2px solid ${farbe}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: farbe === GRUEN ? '#8BD67F' : '#9DBEEB' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 30, textTransform: 'uppercase', marginBottom: 12 }}>{titel}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {spieler.map(p => (
          <div key={p.slot}>
            {p.slot === 5 && <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.6, margin: '8px 0' }}>Ersatz</div>}
            <button type="button" onClick={() => setOffen(offen === p.slot ? null : p.slot)}
              style={{ width: '100%', minHeight: 64, display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', border: offen === p.slot ? `2px solid ${GOLD}` : '2px solid transparent', borderRadius: 14, padding: '10px 14px', background: p.name ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 12, display: 'grid', placeItems: 'center', background: farbe, fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 24 }}>{prefix}{p.slot}</span>
              <span style={{ fontSize: 22, fontWeight: 800, opacity: p.name ? 1 : 0.45 }}>{p.name || 'antippen'}</span>
            </button>
            {offen === p.slot && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, padding: '10px 0 6px' }}>
                {kader.map(n => (
                  <button key={n} type="button" onClick={() => setze(p.slot, n)}
                    style={{ ...knopf, fontSize: 17, padding: '10px 12px', background: n === p.name ? farbe : 'rgba(255,255,255,0.14)', opacity: vergeben.has(n) && n !== p.name ? 0.5 : 1 }}>{n}</button>
                ))}
                <button type="button" onClick={() => { const n = window.prompt('Name eintippen')?.trim(); if (n) setze(p.slot, n); }} style={{ ...knopf, fontSize: 17, padding: '10px 12px', background: 'transparent', border: '2px dashed rgba(255,255,255,0.35)' }}>Anderer Name …</button>
                {p.name && <button type="button" onClick={() => setze(p.slot, '')} style={{ ...knopf, fontSize: 17, padding: '10px 12px', background: 'rgba(200,60,60,0.5)' }}>Platz leeren</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
