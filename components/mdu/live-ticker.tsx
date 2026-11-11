'use client';

// ============================================================
// Live-Ticker — Anzeige-Bausteine (Betreiber, 11.11.2026)
// ============================================================
// Alles hier zeigt NUR etwas, wenn am Spieltag mindestens eine Begegnung läuft
// oder fertig ist (`aktiv` aus /api/live). Sonst rendert jeder Baustein nichts —
// an allen anderen Tagen bleibt die Seite genau wie vorher.
//   LiveBand        rotes Band „LIVE · n Spiele laufen“ → /live (Startseite, Spielplan, Ergebnisse, Liga)
//   LigaTickerLeiste dezentes Laufband der eigenen Liga + kurze Meldung bei neuem Stand
//                   (Spielbericht-Formular, Live-Modus, zweites Fenster); das eigene Spiel fehlt dort.
// Abgefragt wird nur, solange die Seite sichtbar ist; die Antwort liegt 20 s am CDN.
// ============================================================

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LIVE_TICKER_AN, meldungText, type LiveAntwort, type TickerAnzeige } from '@/lib/live-ticker';

export const LIVE_ROT = '#E11D48';

/** Abend-Fenster (Berlin 16–04 Uhr): nur dann fragt das Band überhaupt nach. */
function imAbendfenster(jetzt = new Date()): boolean {
  const teil = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: 'numeric', hourCycle: 'h23' }).formatToParts(jetzt).find(t => t.type === 'hour');
  const h = Number(teil?.value ?? NaN);
  if (Number.isNaN(h)) return true; // im Zweifel nachfragen
  return h >= 16 || h < 4;
}

/** Holt /api/live: sofort und dann alle `sekunden`, nur solange die Seite sichtbar ist. */
export function useLiveTicker(sekunden = 30, nurAbends = false): LiveAntwort | null {
  const [daten, setDaten] = useState<LiveAntwort | null>(null);
  useEffect(() => {
    if (!LIVE_TICKER_AN) return;
    let weg = false;
    const holen = async () => {
      if (document.visibilityState !== 'visible') return;
      if (nurAbends && !imAbendfenster()) return;
      try {
        const r = await fetch('/api/live');
        if (!r.ok) return;
        const d = await r.json() as LiveAntwort;
        if (!weg) setDaten(d);
      } catch { /* Netz weg — nächster Versuch */ }
    };
    void holen();
    const t = setInterval(holen, sekunden * 1000);
    const sicht = () => { if (document.visibilityState === 'visible') void holen(); };
    document.addEventListener('visibilitychange', sicht);
    return () => { weg = true; clearInterval(t); document.removeEventListener('visibilitychange', sicht); };
  }, [sekunden, nurAbends]);
  return daten;
}

/** Rotes Band „LIVE“ — nur, wenn heute etwas läuft oder fertig ist. `liga` filtert (Ligaseite). */
export function LiveBand({ liga }: { liga?: string }) {
  const d = useLiveTicker(60, true);
  if (!d?.aktiv) return null;
  const spiele = d.spiele.filter(s => !liga || s.liga === liga);
  const live = spiele.filter(s => s.status === 'live').length;
  const fertig = spiele.filter(s => s.status === 'beendet').length;
  if (!live && !fertig) return null;
  const text = live
    ? `${live} ${live === 1 ? 'Spiel läuft' : 'Spiele laufen'} gerade${fertig ? ` · ${fertig} beendet` : ''}`
    : `${fertig} ${fertig === 1 ? 'Spiel' : 'Spiele'} heute beendet`;
  return (
    <Link href={liga ? `/live?liga=${liga}` : '/live'} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', background: LIVE_ROT, color: '#fff',
      textDecoration: 'none', fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600, position: 'relative', zIndex: 1,
    }}>
      <span style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 14, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span className="mdu-live-punkt" aria-hidden /> LIVE
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{text}</span>
      <span style={{ fontWeight: 800, whiteSpace: 'nowrap' }}>Zum Ticker ›</span>
      <LivePunktStil />
    </Link>
  );
}

export function LivePunktStil() {
  return <style>{`
    .mdu-live-punkt { width: 8px; height: 8px; border-radius: 50%; background: currentColor; display: inline-block; animation: mdu-live-blink 1.4s ease-in-out infinite; }
    @keyframes mdu-live-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.25 } }
    @keyframes mdu-lt-lauf { from { transform: translateX(0) } to { transform: translateX(-50%) } }
    @keyframes mdu-lt-rein { from { opacity: 0; transform: translate(-50%, -8px) } to { opacity: 1; transform: translate(-50%, 0) } }
    @media (prefers-reduced-motion: reduce) { .mdu-live-punkt, .mdu-lt-band { animation: none !important; } }
  `}</style>;
}

/**
 * Dezentes Laufband der eigenen Liga (ohne das eigene Spiel) + Meldung bei jedem neuen Stand.
 * `fest` = unten am Bildschirm angeheftet (Live-Modus/zweites Fenster), sonst im Fluss.
 * `dunkel` = Farben für die schwarze Live-Ansicht.
 */
export function LigaTickerLeiste({ liga, ohneKey, fest = false, dunkel = false, onSichtbar }: {
  liga: string | null | undefined; ohneKey?: string | null; fest?: boolean; dunkel?: boolean; onSichtbar?: (sichtbar: boolean) => void;
}) {
  const d = useLiveTicker(30);
  const vorher = useRef<Map<string, TickerAnzeige> | null>(null);
  const [meldung, setMeldung] = useState<string | null>(null);
  const spiele = (d?.aktiv ? d.spiele : []).filter(s => s.liga === liga && s.key !== ohneKey && s.status !== 'offen');
  const sichtbar = spiele.length > 0;

  useEffect(() => { onSichtbar?.(sichtbar); }, [sichtbar, onSichtbar]);

  // Neue Stände melden (nicht beim ersten Laden).
  useEffect(() => {
    if (!d) return;
    const jetzt = new Map(d.spiele.map(s => [s.key, s]));
    const alt = vorher.current;
    vorher.current = jetzt;
    if (!alt) return;
    const texte = d.spiele.filter(s => s.liga === liga && s.key !== ohneKey)
      .map(s => meldungText(alt.get(s.key), s)).filter((t): t is string => !!t);
    if (!texte.length) return;
    queueMicrotask(() => setMeldung(texte[0]));
  }, [d, liga, ohneKey]);
  useEffect(() => {
    if (!meldung) return;
    const t = setTimeout(() => setMeldung(null), 6000);
    return () => clearTimeout(t);
  }, [meldung]);

  if (!sichtbar && !meldung) return null;
  const farbeText = dunkel ? 'rgba(255,255,255,0.8)' : 'var(--th-text-body)';
  const teile = spiele.map(s => (
    <span key={s.key} style={{ padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {s.status === 'live' ? <span className="mdu-live-punkt" style={{ color: LIVE_ROT, width: 6, height: 6 }} aria-hidden /> : null}
      {s.homeName} <strong style={{ fontFamily: 'var(--font-jetbrains-mono)', color: dunkel ? '#fff' : 'var(--th-text-strong)' }}>{s.standHeim}:{s.standGast}</strong> {s.awayName}
      {s.status === 'beendet' ? <span style={{ opacity: 0.6 }}>(Ende)</span> : null}
    </span>
  ));
  const dauer = `${Math.max(18, spiele.length * 9)}s`;

  return (
    <>
      <LivePunktStil />
      {sichtbar && (
        <Link href={`/live?liga=${liga}`} aria-label="Live-Ticker deiner Liga öffnen" style={{
          display: 'flex', alignItems: 'center', gap: 0, textDecoration: 'none', color: farbeText,
          fontFamily: 'var(--font-manrope)', fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap',
          background: dunkel ? 'rgba(255,255,255,0.06)' : 'var(--th-bg-card)',
          border: dunkel ? 'none' : '1px solid var(--th-line-8)', borderRadius: fest ? 0 : 8,
          ...(fest ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, borderTop: '1px solid rgba(255,255,255,0.12)' } : { margin: '0 0 16px' }),
        }}>
          <span style={{ flexShrink: 0, padding: '7px 10px', background: LIVE_ROT, color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span className="mdu-live-punkt" aria-hidden /> LIVE
          </span>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: '7px 0' }}>
            <span className="mdu-lt-band" style={{ display: 'inline-flex', animation: `mdu-lt-lauf ${dauer} linear infinite` }}>
              <span style={{ display: 'inline-flex' }}>{teile}</span>
              <span style={{ display: 'inline-flex' }} aria-hidden>{teile}</span>
            </span>
          </span>
        </Link>
      )}
      {meldung && (
        <div role="status" style={{
          position: 'fixed', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 60, maxWidth: 'calc(100vw - 32px)',
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10,
          background: dunkel ? 'rgba(20,20,20,0.92)' : 'var(--th-bg-card)', color: dunkel ? '#fff' : 'var(--th-text-strong)',
          border: `1px solid ${LIVE_ROT}`, boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
          fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600, animation: 'mdu-lt-rein 0.25s ease-out',
        }}>
          <span className="mdu-live-punkt" style={{ color: LIVE_ROT }} aria-hidden />
          <span>{meldung}</span>
        </div>
      )}
    </>
  );
}
