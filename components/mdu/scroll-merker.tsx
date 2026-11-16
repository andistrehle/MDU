'use client';

// ============================================================
// „Zurück“ landet an der Absprungstelle (Betreiber, 16.11.2026)
// ============================================================
// Next stellt beim Zurückgehen die Scroll-Position selbst wieder her — aber nur,
// wenn die Seite dann schon so lang ist. Fast alle Team-Manager-Seiten laden ihre
// Daten erst im Browser nach (Zusagen, Kader, Statistik): beim Zurück ist die
// Seite noch kurz, und man landet oben statt dort, wo man abgesprungen ist.
//
// Deshalb merken wir uns je Adresse die Position (sessionStorage) und setzen sie
// nach einem „Zurück“/„Vor“ noch einmal, sobald die Seite lang genug ist — bis zu
// 5 s, und sofort Schluss, wenn man selbst scrollt oder tippt. Gilt überall
// (Browser-Pfeil, Wischgeste, ‹-Knopf der App, ZurueckLink).
// ============================================================

import { useEffect } from 'react';

const KEY = 'mdu-scroll';
const adresse = () => window.location.pathname + window.location.search;
function lies(): Record<string, number> { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; } }

export function ScrollMerker() {
  useEffect(() => {
    let sichernUhr: number | undefined;
    let takt: number | undefined;
    let stellt = false; // während des Wiederherstellens nichts überschreiben

    const sichern = () => {
      if (stellt) return;
      window.clearTimeout(sichernUhr);
      sichernUhr = window.setTimeout(() => {
        try {
          const m = lies(); m[adresse()] = Math.round(window.scrollY);
          const k = Object.keys(m); if (k.length > 60) delete m[k[0]];
          sessionStorage.setItem(KEY, JSON.stringify(m));
        } catch { /* privater Modus: dann eben ohne */ }
      }, 120);
    };

    const schluss = () => {
      stellt = false; window.clearInterval(takt);
      for (const e of ['wheel', 'touchstart', 'keydown', 'mousedown'] as const) window.removeEventListener(e, schluss);
    };

    // popstate: die Adresse ist schon die Zielseite, gerendert ist sie noch nicht.
    const zurueck = () => {
      schluss();
      const ziel = lies()[adresse()];
      if (!ziel || ziel < 40) return;
      stellt = true;
      const start = Date.now();
      for (const e of ['wheel', 'touchstart', 'keydown', 'mousedown'] as const) window.addEventListener(e, schluss, { passive: true, once: true });
      takt = window.setInterval(() => {
        const alt = Date.now() - start;
        const platz = document.documentElement.scrollHeight - window.innerHeight;
        if (alt > 150 && platz >= ziel - 2) {
          if (Math.abs(window.scrollY - ziel) > 2) window.scrollTo(0, ziel);
          // Noch kurz halten: nachladende Karten schieben den Inhalt sonst wieder weg.
          if (alt > 1200) schluss();
        }
        if (alt > 5000) schluss();
      }, 100);
    };

    window.addEventListener('scroll', sichern, { passive: true });
    window.addEventListener('popstate', zurueck);
    return () => {
      window.removeEventListener('scroll', sichern); window.removeEventListener('popstate', zurueck);
      window.clearTimeout(sichernUhr); schluss();
    };
  }, []);
  return null;
}
