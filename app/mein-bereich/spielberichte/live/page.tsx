'use client';

// ============================================================
// Spielbericht — Live-Ansicht für den Monitor im Lokal
// ============================================================
// Wird aus dem Formular (Mein Bereich → Spielbericht erfassen) als zweites
// Fenster geöffnet und zeigt jede Eingabe sofort (lib/spielbericht-live.ts,
// nur im Browser, kein Server). Aufbau für große Bildschirme: oben der
// Spielstand, links alle 18 Spiele, rechts Aufstellung mit Punkten und
// Highlights. Schriftgrößen wachsen mit dem Fenster (vw/vh).
// ============================================================

import { useEffect, useState } from 'react';
import { abonniereLive, letzterLiveStand, type LiveStand } from '@/lib/spielbericht-live';
import { LiveAnzeige, LIVE_HINTERGRUND, fz } from '@/components/mdu/live-anzeige';

export default function LivePage() {
  const [stand, setStand] = useState<LiveStand | null>(null);
  const [voll, setVoll] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setStand(letzterLiveStand()));
    const ab = abonniereLive(setStand);
    const onFs = () => setVoll(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => { ab(); document.removeEventListener('fullscreenchange', onFs); };
  }, []);

  const vollbild = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, overflow: 'auto', color: '#fff', fontFamily: 'var(--font-manrope)',
      background: LIVE_HINTERGRUND }}>
      {!voll && (
        <button type="button" onClick={vollbild} style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
          ⛶ Vollbild
        </button>
      )}
      {!stand ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%', textAlign: 'center', padding: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: fz(28, 3, 56), letterSpacing: '0.04em', textTransform: 'uppercase' }}>Live-Ansicht</div>
            <div style={{ marginTop: 10, fontSize: fz(14, 1.2, 20), opacity: 0.75 }}>Wartet auf den Spielbericht … Öffne im anderen Fenster „Spielbericht erfassen“ und wähle die Begegnung.</div>
          </div>
        </div>
      ) : <LiveAnzeige s={stand} />}
    </div>
  );
}
