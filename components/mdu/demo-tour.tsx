'use client';

// ============================================================
// Demo-Tour — geführte Willkommens-Tour beim ersten Besuch
// ============================================================
//
// Kurze, klickbare Schritt-für-Schritt-Tour (passend zum HeyGen-
// Einführungsvideo, siehe docs/einfuehrungsvideo-runsheet.md).
// Erscheint einmalig auf der Startseite und hebt echte Elemente der
// Seite per „Spotlight" hervor (data-tour-Anker). Schritte ohne Anker
// werden als zentrierte Karte gezeigt.
//
// Anzeige-Regeln (localStorage, ehrlich & sparsam):
//   - Einmal komplett durchgeklickt  → nie wieder.
//   - 3× weggeklickt/übersprungen    → nie wieder.
// Neustart jederzeit über den Footer-Link „Tour ansehen" (Custom-Event
// 'mdu:start-tour') oder Aufruf von „/?tour=1".
// Versioniertes Storage-Präfix (v1) für spätere bewusste Neu-Ausspielung.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DONE_KEY = 'mdu.tour.v1.done';
const SKIP_KEY = 'mdu.tour.v1.skips';
const MAX_SKIPS = 3;

interface TourStep {
  icon: string;
  tag: string;
  title: string;
  body: string;
  /** data-tour-Wert des hervorzuhebenden Elements (optional). */
  target?: string;
  cta?: { label: string; href: string };
}

// Inhalte sinngemäß aus dem finalen Sprechertext des Einführungsvideos.
const STEPS: TourStep[] = [
  {
    icon: '👋',
    tag: 'Willkommen',
    title: 'Die neue MDU-Plattform',
    body: 'Servus! Modern, übersichtlich und komplett aufs Smartphone ausgelegt. In ein paar kurzen Schritten zeigen wir dir die wichtigsten Bereiche.',
  },
  {
    icon: '🌗',
    tag: 'Design',
    title: 'Zwei Looks, ein Klick',
    body: 'Mit diesem Schalter wechselst du jederzeit zwischen modernem („New Design") und klassischem Look („Old School").',
    target: 'theme',
  },
  {
    icon: '🏆',
    tag: 'Ligen & Tabellen',
    title: 'Direkt zum Spielbetrieb',
    body: 'Über die Schnellzugriffe kommst du zu Spielplan und Tabellen. Für jede Liga und Playoff-Runde gibt es Tabellen, Ergebnisse und Einzelranglisten – die Farben zeigen sofort Auf- und Abstieg.',
    target: 'quickbar',
    cta: { label: 'Ligen ansehen', href: '/ligen' },
  },
  {
    icon: '📰',
    tag: 'Aktuelles',
    title: 'Immer auf dem Laufenden',
    body: 'News rund um den Spielbetrieb findest du direkt hier auf der Startseite.',
    target: 'news',
  },
  {
    icon: '📅',
    tag: 'Spiele',
    title: 'Nächste & letzte Spiele',
    body: 'Kommende Begegnungen und die letzten Ergebnisse auf einen Blick.',
    target: 'matches',
  },
  {
    icon: '🎯',
    tag: 'Teams & Spieler',
    title: 'Ein Profil für jeden',
    body: 'Jede Mannschaft hat ein eigenes Profil – mit Kader, Spielstätte, Ergebnissen und Statistik. Und jeder Spieler eins, mit Foto, Platzierung und Saisonwerten.',
    cta: { label: 'Teams ansehen', href: '/teams' },
  },
  {
    icon: '🔐',
    tag: 'Dein Bereich',
    title: 'Anmelden & loslegen',
    body: 'Nach dem Login siehst du genau das, was zu deiner Rolle passt – mit eigenem Benachrichtigungscenter. Neu dabei? Die Registrierung geht in wenigen Schritten.',
    target: 'account',
    cta: { label: 'Registrieren', href: '/registrieren' },
  },
  {
    icon: '📋',
    tag: 'Für Kapitäne',
    title: 'Mannschaft & Spielbericht',
    body: 'Teamkapitäne melden ihre Mannschaft online an und erfassen Spielberichte digital – 18 Spiele, zwei Doppel, Auswertung automatisch. Als PDF oder per Foto-Erkennung geht’s auch.',
    cta: { label: 'Zu den Downloads', href: '/downloads' },
  },
  {
    icon: '🚀',
    tag: 'Los geht’s',
    title: 'Viel Spaß auf der Plattform',
    body: 'Das war die Kurztour. Schau dich in Ruhe um – und gut Pfeil! 🎯',
  },
];

interface SpotRect { top: number; left: number; width: number; height: number; }

/** Sichtbares Element zum data-tour-Namen finden (Desktop/Mobile-Duplikate). */
function findTarget(name?: string): HTMLElement | null {
  if (!name || typeof document === 'undefined') return null;
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.height > 1) return el;
  }
  return null;
}

export function DemoTour() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<SpotRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => { setStep(0); setSpot(null); setVisible(true); }, []);

  // Erst-Anzeige auf der Startseite + Neustart via ?tour=1.
  useEffect(() => {
    if (pathname !== '/') return;
    let forced = false;
    try { forced = new URLSearchParams(window.location.search).get('tour') === '1'; } catch { /* ignore */ }
    if (forced) {
      try { window.history.replaceState({}, '', '/'); } catch { /* ignore */ }
      const t = setTimeout(start, 250);
      return () => clearTimeout(t);
    }
    let show = false;
    try {
      const done = localStorage.getItem(DONE_KEY) === '1';
      const skips = parseInt(localStorage.getItem(SKIP_KEY) ?? '0', 10) || 0;
      show = !done && skips < MAX_SKIPS;
    } catch { /* localStorage nicht verfügbar → Tour einfach nicht zeigen */ }
    if (!show) return;
    const t = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(t);
  }, [pathname, start]);

  // Neustart von außen (Footer-Link „Tour ansehen").
  useEffect(() => {
    window.addEventListener('mdu:start-tour', start);
    return () => window.removeEventListener('mdu:start-tour', start);
  }, [start]);

  const finish = useCallback(() => {
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* ignore */ }
    setVisible(false);
  }, []);

  const skip = useCallback(() => {
    try {
      const n = (parseInt(localStorage.getItem(SKIP_KEY) ?? '0', 10) || 0) + 1;
      localStorage.setItem(SKIP_KEY, String(n));
    } catch { /* ignore */ }
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    setStep(s => { if (s >= STEPS.length - 1) { finish(); return s; } return s + 1; });
  }, [finish]);

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  // Spotlight berechnen: Ziel finden, in den Blick scrollen, Rechteck messen.
  useEffect(() => {
    if (!visible) return;
    const name = STEPS[step]?.target;
    let ticking = false;

    const measure = () => {
      const el = findTarget(name);
      if (!el) { setSpot(null); return; }
      const r = el.getBoundingClientRect();
      const pad = 8;
      setSpot({
        top: Math.max(8, r.top - pad),
        left: Math.max(8, r.left - pad),
        width: Math.min(window.innerWidth - 16, r.width + pad * 2),
        height: r.height + pad * 2,
      });
    };

    const el = findTarget(name);
    if (el) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    else setSpot(null);

    const raf = requestAnimationFrame(measure);
    const settle = setTimeout(measure, 420); // nach Smooth-Scroll erneut messen

    const onWin = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; measure(); });
    };
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [visible, step]);

  // Fokus + Tastatur.
  useEffect(() => {
    if (!visible) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skip();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, skip, next, prev]);

  if (!visible) return null;

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Karte andocken: Ziel oben → Karte unten, Ziel unten → Karte oben, sonst zentriert.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const dock: 'center' | 'top' | 'bottom' =
    !spot ? 'center' : (spot.top + spot.height / 2 < vh / 2 ? 'bottom' : 'top');

  const anchorStyle: React.CSSProperties =
    dock === 'center'
      ? { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }
      : { position: 'fixed', left: 0, right: 0, [dock]: 0, display: 'flex', justifyContent: 'center', padding: 20, pointerEvents: 'none' };

  return (
    <div
      className="mdu-tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mdu-tour-title"
      style={{ background: spot ? 'transparent' : 'rgba(4,6,10,0.62)', backdropFilter: spot ? 'none' : 'blur(3px)' }}
      onClick={skip}
    >
      <style>{TOUR_CSS}</style>

      {spot && (
        <div
          className="mdu-tour-spot"
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
          aria-hidden="true"
        />
      )}

      <div style={anchorStyle}>
        <div
          className="mdu-tour-card"
          ref={cardRef}
          tabIndex={-1}
          style={{ pointerEvents: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <button type="button" className="mdu-tour-x" onClick={skip} aria-label="Tour schließen">×</button>

          <div className="mdu-tour-icon" aria-hidden="true">{s.icon}</div>
          <div className="mdu-tour-tag">{s.tag}</div>
          <h2 id="mdu-tour-title" className="mdu-tour-title">{s.title}</h2>
          <p className="mdu-tour-body">{s.body}</p>

          {s.cta && (
            <Link href={s.cta.href} className="mdu-tour-cta" onClick={finish}>
              {s.cta.label} →
            </Link>
          )}

          <div className="mdu-tour-dots" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span key={i} className={`mdu-tour-dot${i === step ? ' is-active' : ''}`} />
            ))}
          </div>

          <div className="mdu-tour-nav">
            <button type="button" className="mdu-tour-skip" onClick={skip}>
              {isLast ? 'Schließen' : 'Überspringen'}
            </button>
            <div className="mdu-tour-nav-right">
              {step > 0 && (
                <button type="button" className="mdu-tour-btn ghost" onClick={prev}>Zurück</button>
              )}
              <button type="button" className="mdu-tour-btn primary" onClick={next}>
                {isLast ? 'Fertig' : 'Weiter'}
              </button>
            </div>
          </div>

          <div className="mdu-tour-count">{step + 1} / {STEPS.length}</div>
        </div>
      </div>
    </div>
  );
}

const TOUR_CSS = `
.mdu-tour-overlay {
  position:fixed; inset:0; z-index:1000;
  animation:mdu-tour-fade .2s ease;
}
.mdu-tour-spot {
  position:fixed; z-index:1001; border-radius:12px; pointer-events:none;
  box-shadow:0 0 0 9999px rgba(4,6,10,0.62);
  outline:2px solid var(--th-accent); outline-offset:2px;
  transition:top .25s ease, left .25s ease, width .25s ease, height .25s ease;
}
.mdu-tour-card {
  position:relative; z-index:1002; width:100%; max-width:420px; max-height:calc(100dvh - 40px);
  overflow-y:auto; box-sizing:border-box;
  background:var(--th-bg-card); color:var(--th-text-strong);
  border:1px solid var(--th-line-10); border-radius:18px;
  padding:24px 24px 18px; box-shadow:0 24px 60px rgba(0,0,0,0.45);
  font-family:var(--font-manrope), system-ui, sans-serif;
  animation:mdu-tour-pop .24s cubic-bezier(.2,.9,.3,1.2); outline:none;
}
.mdu-tour-x {
  position:absolute; top:12px; right:12px; width:32px; height:32px; border-radius:8px;
  border:none; background:transparent; color:var(--th-text-muted); cursor:pointer;
  font-size:22px; line-height:1; display:flex; align-items:center; justify-content:center;
}
.mdu-tour-x:hover { background:var(--th-line-6); color:var(--th-text-strong); }
.mdu-tour-icon {
  width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;
  font-size:28px; background:var(--th-accent-a12); border:1px solid var(--th-accent-a25); margin-bottom:12px;
}
.mdu-tour-tag {
  font-size:11px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase;
  color:var(--th-accent); margin-bottom:6px;
}
.mdu-tour-title {
  font-family:var(--font-saira-condensed), var(--font-manrope), sans-serif;
  font-weight:900; font-size:25px; line-height:1.1; text-transform:uppercase;
  margin:0 0 8px; color:var(--th-text-strong);
}
.mdu-tour-body { font-size:14.5px; line-height:1.55; color:var(--th-text-muted); margin:0; }
.mdu-tour-cta {
  display:inline-block; margin-top:14px; font-size:13px; font-weight:800;
  color:var(--th-accent); text-decoration:none;
}
.mdu-tour-cta:hover { text-decoration:underline; }
.mdu-tour-dots { display:flex; gap:7px; margin:18px 0 14px; }
.mdu-tour-dot { width:7px; height:7px; border-radius:50%; background:var(--th-line-10); transition:all .2s ease; }
.mdu-tour-dot.is-active { background:var(--th-accent); width:20px; border-radius:4px; }
.mdu-tour-nav { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.mdu-tour-nav-right { display:flex; gap:10px; }
.mdu-tour-skip {
  background:none; border:none; cursor:pointer; padding:8px 2px;
  font-family:inherit; font-size:13px; font-weight:600; color:var(--th-text-muted);
}
.mdu-tour-skip:hover { color:var(--th-text-strong); }
.mdu-tour-btn {
  padding:10px 20px; border-radius:9px; cursor:pointer; font-family:inherit;
  font-weight:800; font-size:13px;
}
.mdu-tour-btn.ghost { background:transparent; color:var(--th-text-strong); border:1.5px solid var(--th-line-10); }
.mdu-tour-btn.primary { background:var(--th-accent); color:#fff; border:1px solid var(--th-accent-hover); }
.mdu-tour-btn.primary:hover { background:var(--th-accent-hover); }
.mdu-tour-count { text-align:center; font-size:11px; color:var(--th-text-muted); margin-top:10px; opacity:.7; }
@keyframes mdu-tour-fade { from { opacity:0; } to { opacity:1; } }
@keyframes mdu-tour-pop { from { opacity:0; transform:translateY(12px) scale(.98); } to { opacity:1; transform:none; } }
@media (prefers-reduced-motion: reduce) {
  .mdu-tour-overlay, .mdu-tour-card { animation:none; }
  .mdu-tour-spot { transition:none; }
}
`;
