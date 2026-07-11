'use client';

// Schwebender Einstieg „Demo Tour erneut ansehen" — global sichtbar,
// startet die zur aktuellen Seite passende Tour neu (Startseite: öffentlich,
// Mein Bereich: rollenadaptiv). Von anderen Seiten geht es zur Startseite.

import { usePathname } from 'next/navigation';

const KEYS = [
  'mdu.tour.v1.done', 'mdu.tour.v1.skips',
  'mdu.tour.v1.member.done', 'mdu.tour.v1.member.skips',
];

export function DemoTourButton() {
  const pathname = usePathname();

  // UT-01: Der schwebende CTA erscheint nur auf der Startseite UND auf dem
  // „Mein Bereich"-Dashboard (dort lebt die rollenadaptive Tour) — aber NICHT
  // auf Unterseiten/Teamprofilen und NICHT auf den „Mein Bereich"-Unterseiten
  // (wenn man eine Kachel anklickt). Daher exakter Pfad-Match, kein startsWith.
  if (pathname !== '/' && pathname !== '/mein-bereich') return null;

  const restart = () => {
    // localStorage UND Cookie-Spiegel löschen (der Fallback aus demo-tour.tsx
    // greift z. B. im iOS-Privatmodus), sonst bliebe die Tour „gesehen".
    try { KEYS.forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }
    try { KEYS.forEach(k => { document.cookie = `${k}=; path=/; max-age=0; SameSite=Lax`; }); } catch { /* ignore */ }
    if (pathname === '/' || pathname === '/mein-bereich') {
      window.dispatchEvent(new Event('mdu:start-tour'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = '/?tour=1';
    }
  };

  return (
    <>
      <style>{`
        .mdu-demo-tour-btn {
          position:fixed; z-index:900; right:20px; bottom:22px;
          display:inline-flex; align-items:center; gap:8px;
          padding:11px 16px; border-radius:999px; cursor:pointer;
          background:var(--th-bg-card); color:var(--th-accent);
          border:1.5px solid var(--th-accent);
          box-shadow:0 8px 22px rgba(0,0,0,0.28), 0 0 0 4px var(--th-accent-a12);
          font-family:var(--font-manrope), system-ui, sans-serif;
          font-weight:800; font-size:13px; letter-spacing:0.01em;
          transition:background 150ms ease, transform 150ms ease;
          /* UT-06: nie breiter als der Viewport → Rahmen wird bei hohem Zoom /
             im In-App-Browser nicht mehr seitlich abgeschnitten. */
          max-width:calc(100vw - 24px); box-sizing:border-box; overflow:hidden;
        }
        .mdu-demo-tour-label { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
        .mdu-demo-tour-btn > span[aria-hidden] { flex:0 0 auto; }
        .mdu-demo-tour-btn:hover { background:var(--th-accent); color:#fff; transform:translateY(-1px); }
        /* Sobald die Bottom-Navigation sichtbar ist (≤1080px): darüber platzieren. */
        @media (max-width:1080px) {
          .mdu-demo-tour-btn { right:12px; bottom:86px; padding:10px 14px; font-size:12px; }
        }
        @media print { .mdu-demo-tour-btn { display:none; } }
      `}</style>
      <button
        type="button"
        onClick={restart}
        className="mdu-demo-tour-btn"
        aria-label="Demo Tour erneut ansehen"
      >
        <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>▶</span>
        <span className="mdu-demo-tour-label">Demo Tour erneut ansehen</span>
      </button>
    </>
  );
}
