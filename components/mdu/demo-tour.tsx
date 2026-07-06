'use client';

// ============================================================
// Demo-Tour — geführte Touren (öffentlich + „Mein Bereich")
// ============================================================
//
// Zwei Teile (passend zum HeyGen-Einführungsvideo,
// siehe docs/einfuehrungsvideo-runsheet.md):
//
//  1) PUBLIC  — beim ersten Besuch der Startseite. Erklärt die
//     öffentliche Seite bis inkl. Registrierung. Hebt echte Elemente
//     per Spotlight hervor (data-tour-Anker).
//  2) MEMBER  — beim ersten Öffnen von „/mein-bereich" (eingeloggt).
//     Führt durch die eigenen Kacheln und passt sich automatisch der
//     Rolle an: Es werden nur Schritte gezeigt, deren Kachel wirklich
//     sichtbar ist (Spieler sehen weniger, Kapitän mehr).
//
// Anzeige-Regeln je Tour (localStorage):
//   - Einmal komplett durchgeklickt  → nie wieder.
//   - 3× weggeklickt/übersprungen    → nie wieder.
// Neustart: Footer-Link „Tour ansehen" (Event 'mdu:start-tour') bzw.
// „/?tour=1" für die öffentliche Tour.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

type TourId = 'public' | 'member';

const KEYS: Record<TourId, { done: string; skips: string }> = {
  // PUBLIC behält die bestehenden Schlüssel (bereits gesehene Nutzer nicht erneut nerven).
  public: { done: 'mdu.tour.v1.done', skips: 'mdu.tour.v1.skips' },
  member: { done: 'mdu.tour.v1.member.done', skips: 'mdu.tour.v1.member.skips' },
};
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

// ── Öffentliche Tour (Startseite → Registrierung) ───────────────────
const PUBLIC_STEPS: TourStep[] = [
  {
    icon: '👋', tag: 'Willkommen', title: 'Die neue MDU-Plattform',
    body: 'Servus! Modern, übersichtlich und komplett aufs Smartphone ausgelegt. In ein paar kurzen Schritten zeigen wir dir die wichtigsten Bereiche.',
  },
  {
    icon: '🌗', tag: 'Design', title: 'Zwei Looks, ein Klick',
    body: 'Mit diesem Schalter wechselst du jederzeit zwischen modernem („New Design") und klassischem Look („Old School").',
    target: 'theme',
  },
  {
    icon: '🏆', tag: 'Ligen & Tabellen', title: 'Direkt zum Spielbetrieb',
    body: 'Über die Schnellzugriffe kommst du zu Spielplan und Tabellen. Für jede Liga und Playoff-Runde gibt es Tabellen, Ergebnisse und Einzelranglisten – die Farben zeigen sofort Auf- und Abstieg.',
    target: 'quickbar', cta: { label: 'Ligen ansehen', href: '/ligen' },
  },
  {
    icon: '📰', tag: 'Aktuelles', title: 'Immer auf dem Laufenden',
    body: 'News rund um den Spielbetrieb findest du direkt hier auf der Startseite.',
    target: 'news',
  },
  {
    icon: '📅', tag: 'Spiele', title: 'Nächste & letzte Spiele',
    body: 'Kommende Begegnungen und die letzten Ergebnisse auf einen Blick.',
    target: 'matches',
  },
  {
    icon: '🎯', tag: 'Teams & Spieler', title: 'Ein Profil für jeden',
    body: 'Jede Mannschaft hat ein eigenes Profil – mit Kader, Spielstätte, Ergebnissen und Statistik. Und jeder Spieler eins, mit Foto, Platzierung und Saisonwerten.',
    cta: { label: 'Teams ansehen', href: '/teams' },
  },
  {
    icon: '📝', tag: 'Registrierung', title: 'Neu dabei? So geht’s',
    body: 'Die Registrierung dauert nur wenige Schritte: Name & E-Mail eingeben, Rolle wählen (Spieler oder Teamkapitän) und Datenschutz bestätigen – fertig. Danach hast du deinen eigenen Bereich.',
    target: 'account', cta: { label: 'Zur Registrierung', href: '/registrieren' },
  },
  {
    icon: '🚀', tag: 'Los geht’s', title: 'Viel Spaß auf der Plattform',
    body: 'Schau dich in Ruhe um. Nach dem Login führen wir dich noch kurz durch deinen persönlichen Bereich – und gut Pfeil! 🎯',
  },
];

// ── „Mein Bereich"-Tour (rollenadaptiv über sichtbare Kacheln) ──────
// Reihenfolge = Anzeigereihenfolge. Schritte mit target werden nur
// gezeigt, wenn das Element (die Kachel) tatsächlich vorhanden ist.
const MEMBER_CANDIDATES: TourStep[] = [
  {
    icon: '🙌', tag: 'Mein Bereich', title: 'Dein persönlicher Bereich',
    body: 'Hier läuft alles zusammen, was zu dir gehört. Wir zeigen dir kurz die wichtigsten Kacheln.',
  },
  {
    icon: '🧑', tag: 'Profil', title: 'Mein Profil', target: 'm-profile',
    body: 'Profilbild, Spitzname und „Über mich" pflegst du hier.',
  },
  {
    icon: '📊', tag: 'Statistik', title: 'Meine Statistik', target: 'm-stats',
    body: 'Deine Einzelstatistik, Form und die letzten Ergebnisse – dein eigenes Spielerprofil.',
  },
  {
    icon: '👥', tag: 'Team', title: 'Mein Team', target: 'm-team',
    body: 'Direkt zu deinem Team – Kader, Spielstätte und Ergebnisse.',
  },
  {
    icon: '🏆', tag: 'Liga', title: 'Meine Liga', target: 'm-league',
    body: 'Tabelle und Spiele deiner Liga auf einen Klick.',
  },
  {
    icon: '📝', tag: 'Kapitän', title: 'Mannschaft anmelden', target: 'm-register',
    body: 'Als Kapitän meldest du dein Team komplett online zur neuen Saison an – Wunschliga, Spielstätte, Logo und Kader.',
  },
  {
    icon: '📄', tag: 'Kapitän', title: 'Meine Anmeldungen', target: 'm-registrations',
    body: 'Den Status deiner Anmeldungen siehst du jederzeit hier.',
  },
  {
    icon: '✏️', tag: 'Kapitän', title: 'Spielbericht erfassen', target: 'm-report',
    body: 'Spielberichte füllst du digital aus – 18 Spiele mit zwei Doppeln, die Auswertung übernimmt das System. Papier geht auch: als PDF oder per Foto-Erkennung.',
  },
  {
    icon: '🔔', tag: 'Benachrichtigungen', title: 'Dein Benachrichtigungscenter', target: 'm-bell',
    body: 'Über die Glocke bekommst du Hinweise – zum Beispiel zu Anmeldungen oder Spielberichten.',
  },
  {
    icon: '🚀', tag: 'Los geht’s', title: 'Alles startklar',
    body: 'Das war dein Bereich. Viel Erfolg – und gut Pfeil! 🎯',
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

/** „Mein Bereich"-Schritte auf die tatsächlich sichtbaren Kacheln reduzieren. */
function buildMemberSteps(): TourStep[] {
  if (typeof document === 'undefined') return MEMBER_CANDIDATES;
  return MEMBER_CANDIDATES.filter(c => !c.target || document.querySelector(`[data-tour="${c.target}"]`));
}

function eligible(id: TourId): boolean {
  try {
    const done = localStorage.getItem(KEYS[id].done) === '1';
    const skips = parseInt(localStorage.getItem(KEYS[id].skips) ?? '0', 10) || 0;
    return !done && skips < MAX_SKIPS;
  } catch { return false; }
}

export function DemoTour() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [tourId, setTourId] = useState<TourId | null>(null);
  const [spot, setSpot] = useState<SpotRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const startTour = useCallback((id: TourId, built: TourStep[]) => {
    if (built.length === 0) return;
    setTourId(id); setSteps(built); setStep(0); setSpot(null); setVisible(true);
  }, []);

  // Automatische Erst-Anzeige je nach Seite.
  useEffect(() => {
    if (visible) return;

    // PUBLIC — Startseite (inkl. Neustart via ?tour=1)
    if (pathname === '/') {
      let forced = false;
      try { forced = new URLSearchParams(window.location.search).get('tour') === '1'; } catch { /* ignore */ }
      if (forced) {
        try { window.history.replaceState({}, '', '/'); } catch { /* ignore */ }
        const t = setTimeout(() => startTour('public', PUBLIC_STEPS), 250);
        return () => clearTimeout(t);
      }
      if (!eligible('public')) return;
      const t = setTimeout(() => startTour('public', PUBLIC_STEPS), 700);
      return () => clearTimeout(t);
    }

    // MEMBER — „Mein Bereich" nach erstem Login
    if (pathname === '/mein-bereich' && !loading && user) {
      if (!eligible('member')) return;
      const t = setTimeout(() => startTour('member', buildMemberSteps()), 800);
      return () => clearTimeout(t);
    }
  }, [pathname, user, loading, visible, startTour]);

  // Neustart von außen (Footer-Link „Tour ansehen") — passend zur aktuellen Seite.
  useEffect(() => {
    const onStart = () => {
      if (pathname === '/mein-bereich' && user) startTour('member', buildMemberSteps());
      else startTour('public', PUBLIC_STEPS);
    };
    window.addEventListener('mdu:start-tour', onStart);
    return () => window.removeEventListener('mdu:start-tour', onStart);
  }, [pathname, user, startTour]);

  const finish = useCallback(() => {
    if (tourId) { try { localStorage.setItem(KEYS[tourId].done, '1'); } catch { /* ignore */ } }
    setVisible(false);
  }, [tourId]);

  const skip = useCallback(() => {
    if (tourId) {
      try {
        const n = (parseInt(localStorage.getItem(KEYS[tourId].skips) ?? '0', 10) || 0) + 1;
        localStorage.setItem(KEYS[tourId].skips, String(n));
      } catch { /* ignore */ }
    }
    setVisible(false);
  }, [tourId]);

  const next = useCallback(() => {
    setStep(s => { if (s >= steps.length - 1) { finish(); return s; } return s + 1; });
  }, [finish, steps.length]);

  const prev = useCallback(() => setStep(s => Math.max(0, s - 1)), []);

  // Spotlight berechnen: Ziel finden, in den Blick scrollen, Rechteck messen.
  useEffect(() => {
    if (!visible) return;
    const name = steps[step]?.target;
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
    const settle = setTimeout(measure, 420);

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
  }, [visible, step, steps]);

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

  if (!visible || steps.length === 0) return null;

  const s = steps[step];
  const isLast = step === steps.length - 1;

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
            {steps.map((_, i) => (
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

          <div className="mdu-tour-count">{step + 1} / {steps.length}</div>
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
.mdu-tour-dots { display:flex; gap:6px; margin:18px 0 14px; flex-wrap:wrap; }
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
