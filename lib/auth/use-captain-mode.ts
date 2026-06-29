'use client';

// ============================================================
// Kapitäns-Modus — manueller Umschalter für Ligaleitung/Super-Admin
// ============================================================
//
// Admins (league_admin/super_admin) haben über die Rollen-Overrides in
// roles.ts ohnehin Kapitänsrechte für jedes Team. Dieser Modus ist reine
// UI-Bequemlichkeit: er blendet die Kapitäns-Einstiege („Mein Team",
// „Mannschaft anmelden", Spielberichte) für das EIGENE verknüpfte Team ein.
// Keine Rechtevergabe — nur Sichtbarkeit. Persistiert in localStorage.

import { useEffect, useState } from 'react';

const KEY = 'mdu_captain_mode';

export function useCaptainMode(): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try { setOn(localStorage.getItem(KEY) === '1'); } catch { /* SSR/Storage off */ }
  }, []);

  const set = (v: boolean) => {
    setOn(v);
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch { /* egal */ }
  };

  return [on, set];
}
