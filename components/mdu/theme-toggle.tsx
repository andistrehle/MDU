'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mdu-theme';

type Theme = 'dark' | 'light';

function getStoredTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Theme in ein Cookie schreiben — DER Server liest es und setzt data-theme
 *  direkt ins <html> (kein Flash, kein „springt auf Dunkel"). */
function writeThemeCookie(theme: Theme): void {
  if (typeof document === 'undefined') return;
  try {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `mdu-theme=${theme}; path=/; max-age=31536000; SameSite=Lax${secure}`;
  } catch { /* ignore */ }
}

/** Decorative flanking lines around a sub-label, e.g. ── HELL ── */
function SubLabel({ text, color, lineColor, fontSize }: { text: string; color: string; lineColor: string; fontSize: number }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 10, height: 1.5, background: lineColor, transition: 'background 250ms ease' }} />
      <span style={{ fontWeight: 700, fontSize, letterSpacing: '0.18em', color, transition: 'color 250ms ease' }}>{text}</span>
      <span style={{ width: 10, height: 1.5, background: lineColor, transition: 'background 250ms ease' }} />
    </span>
  );
}

/**
 * Two-Worlds-Switch: „OLD SCHOOL" (light · classic dartunion.de world,
 * green accent) vs. „NEW DESIGN" (dark · modern MDU red world).
 *
 * Both worlds are ALWAYS visible — the left half permanently shows the light
 * world, the right half the dark world — so you can preview the other theme.
 * A small round handle slides to the active side; the active half's text is
 * vibrant, the inactive side muted. Clean neutral frame (no rainbow border).
 *
 * Maps onto the existing theme logic unchanged: light = Old School ·
 * dark = New Design. Persisted in localStorage; restored before first paint
 * by the inline script in app/layout.tsx.
 *
 * `compact` renders the smaller header variant.
 */
export function ThemeToggle({ compact = false, mini = false }: { compact?: boolean; mini?: boolean }) {
  // Render the dark state during SSR; sync to the real theme after mount.
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initial-Sync außerhalb des Effect-Bodys (react-hooks/set-state-in-effect)
    queueMicrotask(() => {
      const current = getStoredTheme();
      setTheme(current);
      setMounted(true);
      // Migration: Wer noch kein Theme-Cookie hat, aber früher schon per
      // localStorage eine Wahl getroffen hat, bekommt jetzt das Cookie gesetzt
      // (damit der Server das Theme künftig direkt richtig ausliefert).
      const hasCookie = /(?:^|;\s*)mdu-theme=/.test(document.cookie);
      if (!hasCookie) {
        let pref: Theme = current;
        try { const ls = localStorage.getItem(STORAGE_KEY); if (ls === 'dark' || ls === 'light') pref = ls; } catch { /* ignore */ }
        writeThemeCookie(pref);
        if (pref !== current) {
          if (pref === 'light') document.documentElement.dataset.theme = 'light';
          else delete document.documentElement.dataset.theme;
          setTheme(pref);
        }
      }
    });
    // Keep every switch instance in sync (e.g. header + /mehr) and across tabs.
    const onChange = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setTheme(e.newValue === 'light' ? 'light' : 'dark');
    };
    window.addEventListener('mdu-theme-change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('mdu-theme-change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode) — toggle still works for session */
    }
    // Cookie ist die maßgebliche Quelle für die serverseitige Theme-Auslieferung.
    writeThemeCookie(next);
    window.dispatchEvent(new CustomEvent<Theme>('mdu-theme-change', { detail: next }));
  }

  const isDark = !mounted || theme === 'dark'; // true = New Design active

  // ── Sizing (Variante 2 proportions) ─────────────────────────
  const W       = mini ? 118 : compact ? 220 : 288;
  const H       = mini ? 34  : compact ? 46  : 54;
  const pad     = mini ? 2 : 4;
  const thumbD  = mini ? 20 : H - pad * 2 - 2; // small round handle, stays inside
  const clear   = mini ? 22 : thumbD + 6;      // active-label clearance on handle side
  const fz      = mini ? 8 : compact ? 11.5 : 13; // main label
  const fz2     = compact ? 7.5 : 8.5;       // sub label (not shown in mini)

  const OLD_GREEN = '#3E9C33';

  // Handle rides on the active side's outer edge (inside the pill).
  const thumbInset = pad + 3;
  const thumbLeft  = isDark ? W - thumbD - thumbInset : thumbInset;

  // Active world vibrant, inactive world muted (readable on its own half).
  const oldMain = !isDark ? OLD_GREEN : '#9AA0AA';   // on white half
  const newMain = isDark ? '#F5F6FA' : '#7E8590';    // on dark half

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Design wechseln: Old School oder New Design. Aktuelles Design: ${isDark ? 'New Design' : 'Old School'}`}
      onClick={toggle}
      className={`mdu-world-switch${compact ? ' mdu-world-switch--compact' : ''}${mini ? ' mdu-world-switch--mini' : ''}`}
      style={{
        position: 'relative',
        width: W, maxWidth: '100%', height: H,
        borderRadius: 999, padding: pad,
        border: mini ? 'none' : '1px solid var(--th-line-8)',
        cursor: 'pointer', flexShrink: 0,
        background: mini ? 'transparent' : '#14171F',
        // Subtle active-world glow — no rainbow ring (kein Rahmen in mini).
        boxShadow: mini ? 'none' : (isDark
          ? '0 2px 8px rgba(0,0,0,0.30), 0 0 14px rgba(212,0,0,0.20)'
          : '0 2px 8px rgba(46,78,128,0.16), 0 0 12px rgba(95,140,201,0.18)'),
        transition: 'box-shadow 250ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Two fixed worlds, always visible, clipped to the pill */}
      <span aria-hidden style={{ position: 'absolute', inset: pad, display: 'flex', borderRadius: 999, overflow: 'hidden' }}>
        {/* Left — Old School (always the light world) */}
        <span
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            paddingLeft: !isDark ? clear : 6, paddingRight: 6,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #EAF1FB 100%)',
            boxShadow: !isDark ? 'inset 0 0 0 1.5px rgba(62,156,51,0.45)' : 'none',
            fontFamily: 'var(--font-manrope)', textTransform: 'uppercase',
            transition: 'padding 300ms cubic-bezier(.4,.95,.4,1.05), box-shadow 250ms ease',
          }}
        >
          {mini ? (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.06, color: oldMain, transition: 'color 250ms ease' }}>
              <span style={{ fontWeight: 800, fontSize: fz, letterSpacing: '0.03em' }}>Old</span>
              <span style={{ fontWeight: 800, fontSize: fz, letterSpacing: '0.03em' }}>School</span>
            </span>
          ) : (
            <>
              <span style={{ fontWeight: 800, fontSize: fz, letterSpacing: '0.05em', color: oldMain, whiteSpace: 'nowrap', transition: 'color 250ms ease' }}>
                <span className="mdu-ws-full">Old School</span>
                <span className="mdu-ws-short">Old</span>
              </span>
              <span className="mdu-ws-full">
                <SubLabel text="Hell" color="#8A8F9C" lineColor={!isDark ? '#5F8CC9' : '#C7CCD4'} fontSize={fz2} />
              </span>
            </>
          )}
        </span>

        {/* Right — New Design (always the dark world) */}
        <span
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 2,
            paddingRight: isDark ? clear : 6, paddingLeft: 6,
            background: 'linear-gradient(135deg, #20242E 0%, #14171F 100%)',
            boxShadow: isDark ? 'inset 0 0 0 1.5px rgba(212,0,0,0.50)' : 'none',
            fontFamily: 'var(--font-manrope)', textTransform: 'uppercase',
            transition: 'padding 300ms cubic-bezier(.4,.95,.4,1.05), box-shadow 250ms ease',
          }}
        >
          {mini ? (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.06, color: newMain, transition: 'color 250ms ease' }}>
              <span style={{ fontWeight: 800, fontSize: fz, letterSpacing: '0.03em' }}>New</span>
              <span style={{ fontWeight: 800, fontSize: fz, letterSpacing: '0.03em' }}>Design</span>
            </span>
          ) : (
            <>
              <span style={{ fontWeight: 800, fontSize: fz, letterSpacing: '0.05em', color: newMain, whiteSpace: 'nowrap', transition: 'color 250ms ease' }}>
                <span className="mdu-ws-full">New Design</span>
                <span className="mdu-ws-short">New</span>
              </span>
              <span className="mdu-ws-full">
                <SubLabel text="Dark" color="#9AA0AC" lineColor={isDark ? '#E23A3A' : '#5A616B'} fontSize={fz2} />
              </span>
            </>
          )}
        </span>
      </span>

      {/* Small round handle — slides to the active side */}
      <span
        aria-hidden
        style={{
          position: 'absolute', top: '50%', left: thumbLeft,
          width: thumbD, height: thumbD, borderRadius: '50%',
          transform: 'translateY(-50%)',
          background: 'radial-gradient(circle at 38% 32%, #FFFFFF 0%, #F1F3F6 70%, #DDE2E8 100%)',
          boxShadow: isDark
            ? '0 2px 5px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,0,0,0.35)'
            : '0 2px 5px rgba(46,78,128,0.30), 0 0 0 1px rgba(95,140,201,0.45)',
          transition: 'left 300ms cubic-bezier(.4,.95,.4,1.05), box-shadow 250ms ease',
          zIndex: 2,
        }}
      />
    </button>
  );
}
