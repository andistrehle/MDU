'use client';

// Sprung aus einer Glocke direkt zu EINEM Spielbericht in einer Liste (Betreiber, 23.11.2026: „Spielbericht geändert“
// sagte nicht, welche Begegnung, und führte nur auf die Liste). Adresse `?bericht=<id>` → sobald die Zeile mit
// `id="bericht-<id>"` da ist, hinscrollen und kurz hervorheben.

import { useEffect } from 'react';

export const berichtParam = () => {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('bericht');
};

export function useSprungZuBericht(bereit: boolean) {
  useEffect(() => {
    const id = berichtParam();
    if (!id || !bereit) return;
    let versuche = 0;
    const t = setInterval(() => {
      const el = document.getElementById(`bericht-${id}`);
      if (el || ++versuche > 40) clearInterval(t);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'background 0.6s';
      el.style.background = 'var(--th-accent-a07)';
      el.style.borderRadius = '8px';
      setTimeout(() => { el.style.background = ''; }, 4000);
    }, 250);
    return () => clearInterval(t);
  }, [bereit]);
}
