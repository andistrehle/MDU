'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'mdu-theme';

type Theme = 'dark' | 'light';

function getStoredTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/**
 * Light/Dark mode switch.
 * Dark is the default; the choice is persisted in localStorage and restored
 * before first paint by the inline script in app/layout.tsx.
 */
export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  // Render a stable icon during SSR; sync to the real theme after mount.
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getStoredTheme());
    setMounted(true);
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
  }

  const isLight = mounted && theme === 'light';
  const label = isLight ? 'Dark Mode' : 'Light Mode';

  return (
    <button
      onClick={toggle}
      aria-label={`Zu ${label} wechseln`}
      title={`Zu ${label} wechseln`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--th-line-5)',
        border: '1px solid var(--th-line-8)',
        borderRadius: 8,
        padding: showLabel ? '8px 12px' : 8,
        cursor: 'pointer',
        color: 'var(--th-text-muted)',
        fontFamily: 'var(--font-manrope)',
        fontWeight: 700,
        fontSize: 12,
        lineHeight: 1,
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>
        {isLight ? '🌙' : '🌞'}
      </span>
      {showLabel && <span>{label}</span>}
    </button>
  );
}
