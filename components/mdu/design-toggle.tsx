'use client';

import { useEffect, useState } from 'react';

/**
 * Umschalter für die Design-Vorschau: New Design (dunkel/rot) ↔ Old School
 * (hell/grün). Setzt `html[data-theme]` für die Dauer der Seite; der ursprüngliche
 * Zustand (persönliche Theme-Wahl) wird beim Verlassen wiederhergestellt.
 */
export function DesignToggle({ initial = 'light' }: { initial?: 'light' | 'dark' }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(initial);

  // Ursprüngliches Theme einmal merken und beim Verlassen zurücksetzen.
  useEffect(() => {
    const el = document.documentElement;
    const original = el.dataset.theme;
    return () => {
      if (original === undefined) delete el.dataset.theme;
      else el.dataset.theme = original;
    };
  }, []);

  // Aktuelle Wahl anwenden.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div style={{
      position: 'fixed', bottom: 14, left: 14, zIndex: 60,
      display: 'flex', borderRadius: 999, overflow: 'hidden',
      border: '1px solid rgba(128,128,128,0.45)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      fontFamily: 'var(--font-manrope), sans-serif', fontWeight: 700, fontSize: 12,
    }}>
      {([['dark', 'New Design'], ['light', 'Old School']] as const).map(([t, label]) => (
        <button key={t} type="button" onClick={() => setTheme(t)}
          style={{
            padding: '9px 16px', cursor: 'pointer', border: 0,
            background: theme === t ? '#0D1117' : '#FFFFFF',
            color: theme === t ? '#F5F6FA' : '#333',
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}
