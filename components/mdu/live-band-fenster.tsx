'use client';

// ============================================================
// Live-Band herausziehen (Betreiber, 20.11.2026, per Klick-Umfrage)
// ============================================================
// Ein Griff „✥“ im roten Live-Band: mit der Maus herausziehen (oder antippen) → das durchlaufende Band
// läuft in einem eigenen kleinen Fenster weiter, das über allen anderen Programmen schwebt.
//  · PC (Chrome/Edge 116+): Document Picture-in-Picture — echtes HTML, aktualisiert sich mit.
//  · Handy (TEST): Das Band wird laufend in ein stummes Video gezeichnet (Canvas → captureStream) und als
//    Bild-in-Bild geöffnet, wie bei YouTube. Ob das Betriebssystem es im Hintergrund weiterlaufen lässt,
//    entscheidet das Gerät (Android eher ja, iPhone ungeprüft).
// Kann ein Gerät beides nicht, erscheint der Griff gar nicht.
// Ein Fenster darf der Browser nur nach einer Nutzeraktion öffnen: pointerdown/pointerup auf dem Griff zählen dafür.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Art = 'dokument' | 'video' | null;
type DocPip = { requestWindow: (o: { width: number; height: number }) => Promise<Window> };

const ROT = '#D63447';
const MASSE = { breite: 560, hoehe: 52 };

function erkennen(): Art {
  if (typeof window === 'undefined') return null;
  if ('documentPictureInPicture' in window) return 'dokument';
  const c = document.createElement('canvas') as HTMLCanvasElement & { captureStream?: unknown };
  if (document.pictureInPictureEnabled && typeof c.captureStream === 'function') return 'video';
  return null;
}

export function LiveBandGriff({ eintraege }: { eintraege: string[] }) {
  const [art, setArt] = useState<Art>(null);
  const [fenster, setFenster] = useState<Window | null>(null);
  const textRef = useRef(eintraege);
  useEffect(() => { textRef.current = eintraege; }, [eintraege]);
  const video = useRef<{ v: HTMLVideoElement; c: HTMLCanvasElement; t: ReturnType<typeof setInterval> | null } | null>(null);

  const start = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => { queueMicrotask(() => setArt(erkennen())); }, []);

  // Handy: Video + Zeichenfläche vorbereiten, damit der Griff sofort öffnen kann (Metadaten müssen da sein).
  useEffect(() => {
    if (art !== 'video') return;
    const c = document.createElement('canvas');
    c.width = 720; c.height = 96;
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.autoplay = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
    Object.assign(v.style, { position: 'fixed', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none', left: '0', top: '0' });
    document.body.appendChild(v);
    zeichne(c, textRef.current, 0);
    v.srcObject = (c as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(30);
    void v.play().catch(() => {});
    video.current = { v, c, t: null };
    const aus = () => { if (video.current?.t) { clearInterval(video.current.t); video.current.t = null; } };
    v.addEventListener('leavepictureinpicture', aus);
    return () => { aus(); v.removeEventListener('leavepictureinpicture', aus); v.remove(); video.current = null; };
  }, [art]);

  // PC-Fenster zu → aufräumen.
  useEffect(() => {
    if (!fenster) return;
    const zu = () => setFenster(null);
    fenster.addEventListener('pagehide', zu);
    return () => fenster.removeEventListener('pagehide', zu);
  }, [fenster]);

  if (!art) return null;

  async function oeffnen() {
    try {
      if (art === 'dokument') {
        if (fenster) { fenster.focus(); return; }
        const w = await (window as unknown as { documentPictureInPicture: DocPip }).documentPictureInPicture.requestWindow({ width: MASSE.breite, height: MASSE.hoehe });
        w.document.title = 'MDU Live';
        w.document.body.style.margin = '0';
        w.document.body.style.background = ROT;
        setFenster(w);
      } else if (video.current) {
        const { v, c } = video.current;
        if (!video.current.t) {
          let x = 0;
          video.current.t = setInterval(() => { x += 2; zeichne(c, textRef.current, x); }, 33);
        }
        await v.play().catch(() => {});
        if (document.pictureInPictureElement !== v) await v.requestPictureInPicture();
      }
    } catch { /* abgelehnt oder nicht möglich – nichts tun */ }
  }

  // Griff: herausziehen (Maus) oder antippen. Er sitzt im Link des Bands → Klick nicht weitergeben.
  return (
    <>
      <span
        role="button" tabIndex={0} aria-label="Live-Band im eigenen Fenster öffnen"
        title="Herausziehen: Live-Band im eigenen Fenster, schwebt über anderen Programmen"
        onPointerDown={e => { e.stopPropagation(); start.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); }}
        onPointerUp={e => { e.preventDefault(); e.stopPropagation(); start.current = null; void oeffnen(); }}
        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); void oeffnen(); } }}
        style={{
          flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, marginLeft: 2,
          borderRadius: 6, border: '1.5px solid rgba(255,255,255,0.7)', cursor: 'grab', fontSize: 17, lineHeight: 1, touchAction: 'none', userSelect: 'none',
        }}
      >✥</span>
      {fenster && createPortal(<FensterBand eintraege={eintraege} />, fenster.document.body)}
    </>
  );
}

/** Das Band im PC-Fenster: eigenes Dokument, deshalb Schrift und Lauf-Animation hier mitgeben. */
function FensterBand({ eintraege }: { eintraege: string[] }) {
  const teile = eintraege.map((t, i) => <span key={i} style={{ padding: '0 18px' }}>{t}<span style={{ opacity: 0.5, paddingLeft: 12 }}>·</span></span>);
  const dauer = `${Math.max(14, eintraege.length * 8)}s`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100vh', background: ROT, color: '#fff', fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif', fontSize: 15, fontWeight: 600, overflow: 'hidden', whiteSpace: 'nowrap' }}>
      <style>{`@keyframes lauf { from { transform: translateX(0) } to { transform: translateX(-50%) } } @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .25 } }`}</style>
      <span style={{ flexShrink: 0, padding: '0 12px', fontWeight: 900, letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'blink 1.4s ease-in-out infinite' }} /> LIVE
      </span>
      <span style={{ flex: 1, overflow: 'hidden' }}>
        <span style={{ display: 'inline-flex', animation: `lauf ${dauer} linear infinite` }}>
          <span style={{ display: 'inline-flex' }}>{teile.length ? teile : <span style={{ padding: '0 18px' }}>Gerade läuft kein Spiel</span>}</span>
          <span style={{ display: 'inline-flex' }}>{teile}</span>
        </span>
      </span>
    </div>
  );
}

/** Handy: ein Bild des Bands, `x` = wie weit es schon gelaufen ist. */
function zeichne(c: HTMLCanvasElement, eintraege: string[], x: number) {
  const g = c.getContext('2d');
  if (!g) return;
  g.fillStyle = ROT; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textBaseline = 'middle';
  g.font = '700 34px system-ui, -apple-system, sans-serif';
  const text = (eintraege.length ? eintraege.join('   ·   ') : 'Gerade läuft kein Spiel') + '   ·   ';
  const breite = g.measureText(text).width;
  const links = 150;
  g.save(); g.beginPath(); g.rect(links, 0, c.width - links, c.height); g.clip();
  const start = links - (x % breite);
  for (let p = start; p < c.width; p += breite) g.fillText(text, p, c.height / 2);
  g.restore();
  g.fillStyle = ROT; g.fillRect(0, 0, links, c.height);
  g.fillStyle = '#fff'; g.font = '900 34px system-ui, -apple-system, sans-serif';
  if (Math.floor(Date.now() / 700) % 2 === 0) { g.beginPath(); g.arc(28, c.height / 2, 9, 0, Math.PI * 2); g.fill(); }
  g.fillText('LIVE', 48, c.height / 2);
}
