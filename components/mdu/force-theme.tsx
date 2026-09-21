'use client';

import { useEffect } from 'react';

/**
 * Erzwingt für die Dauer dieser Seite ein bestimmtes Theme (setzt
 * `html[data-theme]`), damit z. B. die Design-Vorschau durchgängig im New
 * Design (dunkel) erscheint und nicht mit dem Old-School-Hell-Theme des
 * Browsers vermischt wird. Beim Verlassen wird der vorherige Zustand
 * wiederhergestellt — die persönliche Theme-Wahl (localStorage) bleibt unberührt.
 */
export function ForceTheme({ theme }: { theme: 'dark' | 'light' }) {
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.dataset.theme;
    el.dataset.theme = theme;
    return () => {
      if (prev === undefined) delete el.dataset.theme;
      else el.dataset.theme = prev;
    };
  }, [theme]);
  return null;
}
