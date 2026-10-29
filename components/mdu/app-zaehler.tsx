'use client';

// ============================================================
// Installierte Web-App zählen (Betreiber, 29.10.2026, Migration 0064)
// ============================================================
// Läuft die Seite als installierte App (Startbildschirm), meldet sie
// höchstens einmal am Tag eine zufällige Geräte-Kennung + Plattform an
// /api/app-installation. Im normalen Browser passiert nichts. Kein Konto,
// keine Namen; die Kennung liegt nur im Gerät (localStorage).
// ============================================================

import { useEffect } from 'react';

const ID = 'mdu-app-id', TAG = 'mdu-app-gemeldet';

function plattform(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return 'desktop';
  return 'sonst';
}

export function AppZaehler() {
  useEffect(() => {
    try {
      const installiert = window.matchMedia('(display-mode: standalone)').matches
        || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!installiert) return;
      const heute = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(TAG) === heute) return;
      let id = localStorage.getItem(ID);
      if (!id) { id = crypto.randomUUID(); localStorage.setItem(ID, id); }
      void fetch('/api/app-installation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, plattform: plattform() }), keepalive: true })
        .then(r => { if (r.ok) localStorage.setItem(TAG, heute); })
        .catch(() => {});
    } catch { /* Zählen ist nie wichtiger als die Seite */ }
  }, []);
  return null;
}
