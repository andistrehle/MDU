'use client';

// ============================================================
// Demo-Tour — geführte Willkommens-Tour beim ersten Besuch
// ============================================================
//
// Kurze, klickbare Schritt-für-Schritt-Tour (passend zum HeyGen-
// Einführungsvideo, siehe docs/einfuehrungsvideo-runsheet.md).
// Erscheint einmalig auf der Startseite.
//
// Anzeige-Regeln (localStorage, ehrlich & sparsam):
//   - Einmal komplett durchgeklickt  → nie wieder.
//   - 3× weggeklickt/übersprungen    → nie wieder.
// Versioniertes Storage-Präfix (v1), damit eine spätere überarbeitete
// Tour bewusst erneut ausgespielt werden könnte.
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
  cta?: { label: string; href: string };
}

// Inhalte sinngemäß aus dem finalen Sprechertext des Einführungsvideos.
const STEPS: TourStep[] = [
  {
    icon: '👋',
    tag: 'Willkommen',
    title: 'Die neue MDU-Plattform',
    body: 'Servus! Modern, übersichtlich und komplett aufs Smartphone ausgelegt. In ein paar kurzen Schritten zeigen wir dir, was die Seite alles kann.',
  },
  {
    icon: '🏠',
    tag: 'Startseite',
    title: 'Alles auf einen Blick',
    body: 'News, die nächsten und die letzten Spiele findest du direkt hier. Und mit dem Schalter oben im Header wechselst du jederzeit zwischen modernem und klassischem Design.',
  },
  {
    icon: '🏆',
    tag: 'Ligen',
    title: 'Tabellen & Ranglisten',
    body: 'Für jede Liga und jede Playoff-Runde gibt es aktuelle Tabellen, Spielpläne, Ergebnisse und Einzelranglisten. Die Farben zeigen sofort, wer auf Auf- oder Abstiegskurs ist.',
    cta: { label: 'Ligen ansehen', href: '/ligen' },
  },
  {
    icon: '🎯',
    tag: 'Teams & Spieler',
    title: 'Ein Profil für jeden',
    body: 'Jede Mannschaft hat ein eigenes Profil – mit Kader, Spielstätte, Ergebnissen und Statistiken. Und jeder Spieler eins, mit Foto, Platzierung und den wichtigsten Saisonwerten.',
    cta: { label: 'Teams ansehen', href: '/teams' },
  },
  {
    icon: '🔐',
    tag: 'Dein Bereich',
    title: 'Nach dem Login',
    body: 'Angemeldet siehst du genau das, was zu deiner Rolle passt – Profil, Statistik, Team und Liga, mit eigenem Benachrichtigungscenter. Neu dabei? Die Registrierung geht in wenigen Schritten.',
    cta: { label: 'Registrieren', href: '/registrieren' },
  },
  {
    icon: '📋',
    tag: 'Für Kapitäne',
    title: 'Mannschaft & Spielbericht',
    body: 'Teamkapitäne verwalten alles online: die Mannschaft anmelden (Wunschliga, Spielstätte, Logo, Kader) und Spielberichte digital erfassen – 18 Spiele mit zwei Doppeln, die Auswertung übernimmt das System.',
  },
  {
    icon: '📸',
    tag: 'Papier? Kein Problem',
    title: 'PDF & Foto-Erkennung',
    body: 'Den offiziellen Spielbericht gibt es als PDF zum Ausdrucken. Oder du fotografierst den ausgefüllten Bogen mit dem Handy – die Erkennung überträgt die Daten, geprüft und bestätigt wird aber immer von dir.',
    cta: { label: 'Zu den Downloads', href: '/downloads' },
  },
  {
    icon: '🚀',
    tag: 'Los geht’s',
    title: 'Viel Spaß auf der Plattform',
    body: 'Das war die Kurztour. Schau dich in Ruhe um – und gut Pfeil! 🎯',
  },
];

export function DemoTour() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Erst-Anzeige nur auf der Startseite und nur, wenn noch nicht erledigt/oft genug weggeklickt.
  useEffect(() => {
    if (pathname !== '/') return;
    let show = false;
    try {
      const done = localStorage.getItem(DONE_KEY) === '1';
      const skips = parseInt(localStorage.getItem(SKIP_KEY) ?? '0', 10) || 0;
      show = !done && skips < MAX_SKIPS;
    } catch { /* localStorage nicht verfügbar → Tour einfach nicht zeigen */ }
    if (!show) return;
    const t = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(t);
  }, [pathname]);

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
    setStep(s => {
      if (s >= STEPS.length - 1) { finish(); return s; }
      return s + 1;
    });
  }, [finish]);

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  // Body-Scroll sperren, Fokus setzen.
  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; };
  }, [visible]);

  // Tastatur: Esc = überspringen, Pfeile = blättern.
  useEffect(() => {
    if (!visible) return;
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

  return (
    <div
      className="mdu-tour-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mdu-tour-title"
      onClick={skip}
    >
      <style>{TOUR_CSS}</style>
      <div
        className="mdu-tour-card"
        ref={dialogRef}
        tabIndex={-1}
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
  );
}

const TOUR_CSS = `
.mdu-tour-overlay {
  position:fixed; inset:0; z-index:1000;
  display:flex; align-items:center; justify-content:center;
  padding:20px; background:rgba(4,6,10,0.62); backdrop-filter:blur(3px);
  animation:mdu-tour-fade .2s ease;
}
.mdu-tour-card {
  position:relative; width:100%; max-width:420px; max-height:calc(100dvh - 40px);
  overflow-y:auto; box-sizing:border-box;
  background:var(--th-bg-card); color:var(--th-text-strong);
  border:1px solid var(--th-line-10); border-radius:18px;
  padding:26px 24px 20px; box-shadow:0 24px 60px rgba(0,0,0,0.45);
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
  width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center;
  font-size:30px; background:var(--th-accent-a12); border:1px solid var(--th-accent-a25); margin-bottom:14px;
}
.mdu-tour-tag {
  font-size:11px; font-weight:800; letter-spacing:0.16em; text-transform:uppercase;
  color:var(--th-accent); margin-bottom:6px;
}
.mdu-tour-title {
  font-family:var(--font-saira-condensed), var(--font-manrope), sans-serif;
  font-weight:900; font-size:26px; line-height:1.1; text-transform:uppercase;
  margin:0 0 8px; color:var(--th-text-strong);
}
.mdu-tour-body { font-size:14.5px; line-height:1.55; color:var(--th-text-muted); margin:0; }
.mdu-tour-cta {
  display:inline-block; margin-top:14px; font-size:13px; font-weight:800;
  color:var(--th-accent); text-decoration:none;
}
.mdu-tour-cta:hover { text-decoration:underline; }
.mdu-tour-dots { display:flex; gap:7px; margin:20px 0 16px; }
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
.mdu-tour-count { text-align:center; font-size:11px; color:var(--th-text-muted); margin-top:12px; opacity:.7; }
@keyframes mdu-tour-fade { from { opacity:0; } to { opacity:1; } }
@keyframes mdu-tour-pop { from { opacity:0; transform:translateY(12px) scale(.98); } to { opacity:1; transform:none; } }
@media (prefers-reduced-motion: reduce) {
  .mdu-tour-overlay, .mdu-tour-card { animation:none; }
}
`;
