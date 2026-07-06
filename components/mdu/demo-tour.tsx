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

/** Steckt das Element in einem sticky/fixed Container (Header) → scrollt nicht mit. */
function isStickyish(el: HTMLElement | null): boolean {
  let n: HTMLElement | null = el;
  while (n && n !== document.body) {
    const pos = getComputedStyle(n).position;
    if (pos === 'sticky' || pos === 'fixed') return true;
    n = n.parentElement;
  }
  return false;
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
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  // Andockrichtung der Karte: 'desktop' = frei am Element (via cardPos),
  // 'center' = mittig, 'bottom'/'top' = feste Sheet (mobil, CSS-verankert).
  const [dock, setDock] = useState<'center' | 'bottom' | 'top' | 'desktop'>('center');
  const cardRef = useRef<HTMLDivElement>(null);
  // Für welche Seiten-Ankunft die Auto-Anzeige bereits entschieden wurde.
  // Verhindert, dass die Tour nach dem Wegklicken im selben Besuch neu aufpoppt.
  const autoHandledRef = useRef<string | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startTour = useCallback((id: TourId, built: TourStep[]) => {
    if (built.length === 0) return;
    setTourId(id); setSteps(built); setStep(0); setSpot(null); setVisible(true);
  }, []);

  // Bei echtem Seitenwechsel: Merker zurücksetzen + geplanten Timer verwerfen.
  // Dadurch entscheidet die Auto-Anzeige pro Ankunft nur EINMAL und poppt nach
  // dem Wegklicken nicht im selben Besuch wieder auf – erscheint aber bei einem
  // erneuten Homepage-Besuch wieder (bis Abschluss oder 3× weggeklickt).
  useEffect(() => {
    autoHandledRef.current = null;
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    return () => { if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; } };
  }, [pathname]);

  // Automatische Erst-Anzeige je nach Seite (nur einmal pro Ankunft).
  useEffect(() => {
    if (visible) return;
    if (autoHandledRef.current === pathname) return;

    // PUBLIC — Startseite (inkl. Neustart via ?tour=1)
    if (pathname === '/') {
      let forced = false;
      try { forced = new URLSearchParams(window.location.search).get('tour') === '1'; } catch { /* ignore */ }
      if (forced) {
        autoHandledRef.current = '/';
        try { window.history.replaceState({}, '', '/'); } catch { /* ignore */ }
        autoTimerRef.current = setTimeout(() => startTour('public', PUBLIC_STEPS), 250);
        return;
      }
      autoHandledRef.current = '/';
      if (eligible('public')) autoTimerRef.current = setTimeout(() => startTour('public', PUBLIC_STEPS), 700);
      return;
    }

    // MEMBER — „Mein Bereich" nach erstem Login
    if (pathname === '/mein-bereich') {
      if (loading || !user) return;   // noch nicht entscheidbar → später erneut
      autoHandledRef.current = '/mein-bereich';
      if (eligible('member')) autoTimerRef.current = setTimeout(() => startTour('member', buildMemberSteps()), 800);
      return;
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
    let lastSpotKey = '';   // Re-Render nur bei echter Änderung
    let lastCardKey = '';   // dito für die Desktop-Kartenposition
    let sticky = false;     // Ziel im Sticky-Header (scrollt nicht mit)?

    const isMobile = window.innerWidth <= 760;
    const gap = 12;
    // Sichtbare Viewport-Höhe (iOS: ohne Adressleiste) für die Scroll-Rechnung.
    const vpH = () => window.visualViewport?.height ?? window.innerHeight;
    // Entschiedene Andockrichtung dieses Schritts (synchron, ohne Effekt-Neustart).
    let curDock: 'center' | 'bottom' | 'top' | 'desktop' = 'center';

    // Desktop: Karte frei am Element positionieren.
    const placeDesktop = (sp: SpotRect) => {
      const card = cardRef.current; if (!card) return;
      const cw = card.offsetWidth, ch = card.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight;
      let top: number;
      if (sp.top + sp.height + gap + ch <= vh - 12) top = sp.top + sp.height + gap;
      else if (sp.top - gap - ch >= 12) top = sp.top - gap - ch;
      else top = Math.max(12, Math.min(vh - ch - 12, sp.top + sp.height + gap));
      let left = sp.left + sp.width / 2 - cw / 2;
      left = Math.max(12, Math.min(vw - cw - 12, left));
      const key = `${Math.round(top)}|${Math.round(left)}`;
      if (key !== lastCardKey) { lastCardKey = key; setCardPos({ top, left }); }
    };

    const measure = () => {
      const el = findTarget(name);
      if (!el) { if (lastSpotKey !== 'null') { lastSpotKey = 'null'; setSpot(null); } return; }
      const r = el.getBoundingClientRect();
      const pad = 8;
      const sp: SpotRect = {
        top: Math.max(8, r.top - pad),
        left: Math.max(8, r.left - pad),
        width: Math.min(window.innerWidth - 16, r.width + pad * 2),
        height: r.height + pad * 2,
      };
      // Mobil (ohne Sticky-Ziel): Andockseite live an die Zielposition anpassen –
      // mit Hysterese, damit es nicht flackert. So sitzt die Karte immer auf der
      // dem Ziel abgewandten Seite, egal wohin iOS tatsächlich gescrollt hat.
      if (isMobile && !sticky) {
        const cy = r.top + r.height / 2;
        const vh = vpH();
        if (curDock !== 'top' && cy > vh * 0.60) { curDock = 'top'; setDock('top'); }
        else if (curDock !== 'bottom' && cy < vh * 0.40) { curDock = 'bottom'; setDock('bottom'); }
      }
      // Spot nie hinter die Karte reichen lassen — anhand der echten Kartenlage.
      const cardRect = cardRef.current?.getBoundingClientRect();
      if (cardRect && cardRect.height > 0) {
        if (curDock === 'bottom' && sp.top + sp.height > cardRect.top - gap) {
          sp.height = Math.max(28, cardRect.top - gap - sp.top);
        } else if (curDock === 'top' && sp.top < cardRect.bottom + gap) {
          const d = cardRect.bottom + gap - sp.top;
          sp.top += d; sp.height = Math.max(28, sp.height - d);
        }
      }
      // Nur bei echter Änderung neu rendern (rAF läuft jede Frame).
      const key = `${Math.round(sp.top)}|${Math.round(sp.left)}|${Math.round(sp.width)}|${Math.round(sp.height)}`;
      if (key !== lastSpotKey) { lastSpotKey = key; setSpot(sp); }
      if (curDock === 'desktop') placeDesktop(sp);
    };

    const el = findTarget(name);
    if (!el) {
      setSpot(null);
      curDock = 'center';
      // zentrierte Karte (Intro/Outro)
      const card = cardRef.current;
      if (card) setCardPos({ top: Math.max(12, (vpH() - card.offsetHeight) / 2), left: Math.max(12, (window.innerWidth - card.offsetWidth) / 2) });
      setDock('center');
    } else if (!isMobile) {
      curDock = 'desktop';
      setDock('desktop');
      el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    } else {
      // Mobil: Ziel per nativem scrollIntoView zuverlässig in den freien Bereich
      // holen (iOS-fest). scroll-margin sorgt dafür, dass die GANZE Kachel über
      // dem Sticky-Header UND über der unteren Karte liegt – dann wird sie
      // vollständig umrahmt (kein Beschneiden). Die endgültige Andockseite
      // richtet sich danach live an der Zielposition aus (measure()).
      sticky = isStickyish(el);
      curDock = 'bottom';
      setDock('bottom');
      if (!sticky) {
        const ch = cardRef.current?.offsetHeight ?? Math.round(vpH() * 0.42);
        el.style.scrollMarginTop = '92px';
        el.style.scrollMarginBottom = `${ch + 92}px`; // Karte + Bottom-Nav + Abstand
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
    }

    // Kontinuierliches Tracking: hält den Spot jede Frame an der Live-Position
    // des Ziels – robust gegen iOS-Scroll-/Adressleisten-Verschiebungen, die
    // sonst einen einmal gesetzten Spot „einfrieren" würden.
    let rafId = requestAnimationFrame(function tick() {
      measure();
      rafId = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(rafId);
      if (el) { el.style.scrollMarginTop = ''; el.style.scrollMarginBottom = ''; }
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

      <div
        className="mdu-tour-card"
        ref={cardRef}
        tabIndex={-1}
        style={
          dock === 'bottom'
            ? { position: 'fixed', left: 0, right: 0, bottom: 80, marginLeft: 'auto', marginRight: 'auto', pointerEvents: 'auto' }
            : dock === 'top'
            ? { position: 'fixed', left: 0, right: 0, top: 12, marginLeft: 'auto', marginRight: 'auto', pointerEvents: 'auto' }
            : { position: 'fixed', top: cardPos?.top ?? 0, left: cardPos?.left ?? 0, visibility: cardPos ? 'visible' : 'hidden', pointerEvents: 'auto' }
        }
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

          <div className="mdu-tour-count">{step + 1} / {steps.length} · v4</div>
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
  z-index:1002; width:min(380px, calc(100vw - 24px)); max-height:calc(100dvh - 24px);
  overflow-y:auto; box-sizing:border-box;
  background:var(--th-bg-card); color:var(--th-text-strong);
  border:1.5px solid var(--th-accent); border-radius:16px;
  padding:22px 22px 16px;
  box-shadow:0 20px 55px rgba(0,0,0,0.5), 0 0 0 4px var(--th-accent-a12);
  font-family:var(--font-manrope), system-ui, sans-serif;
  animation:mdu-tour-pop .24s cubic-bezier(.2,.9,.3,1.2); outline:none;
  transition:top .28s cubic-bezier(.3,.8,.3,1), left .28s cubic-bezier(.3,.8,.3,1);
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
.mdu-tour-btn.primary {
  background:var(--th-accent); color:#fff; border:1px solid var(--th-accent-hover);
  animation:mdu-tour-pulse 2.2s ease-in-out infinite;
}
.mdu-tour-btn.primary:hover { background:var(--th-accent-hover); animation:none; }
.mdu-tour-count { text-align:center; font-size:11px; color:var(--th-text-muted); margin-top:10px; opacity:.7; }
@keyframes mdu-tour-fade { from { opacity:0; } to { opacity:1; } }
@keyframes mdu-tour-pop { from { opacity:0; transform:translateY(8px) scale(.98); } to { opacity:1; transform:none; } }
@keyframes mdu-tour-pulse {
  0% { box-shadow:0 0 0 0 var(--th-accent-a40); }
  70% { box-shadow:0 0 0 9px rgba(0,0,0,0); }
  100% { box-shadow:0 0 0 0 rgba(0,0,0,0); }
}
@media (prefers-reduced-motion: reduce) {
  .mdu-tour-overlay, .mdu-tour-card { animation:none; }
  .mdu-tour-spot, .mdu-tour-card { transition:none; }
  .mdu-tour-btn.primary { animation:none; }
}
/* Mobil: kompaktere Karte, damit sie als untere Sheet Platz für das
   hervorgehobene Element oben lässt. */
@media (max-width:760px) {
  .mdu-tour-card { width:calc(100vw - 20px); max-height:60dvh; padding:16px 18px 12px; border-radius:16px; }
  .mdu-tour-icon { width:42px; height:42px; font-size:22px; border-radius:12px; margin-bottom:8px; }
  .mdu-tour-title { font-size:21px; margin-bottom:6px; }
  .mdu-tour-body { font-size:13.5px; line-height:1.5; }
  .mdu-tour-cta { margin-top:10px; }
  .mdu-tour-dots { margin:12px 0 10px; }
  .mdu-tour-btn { padding:9px 16px; }
  .mdu-tour-count { margin-top:8px; }
}
`;
