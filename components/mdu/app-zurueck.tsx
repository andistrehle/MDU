'use client';

// ============================================================
// Zurück-Knopf für die installierte Web-App (Betreiber, 27.10.2026)
// ============================================================
// Vom Home-Bildschirm gestartet läuft die MDU ohne Browserleiste
// (manifest: display 'standalone' — 'minimal-ui' ginge nicht, das iPhone
// behandelte die App dann wie Safari und Push fiele weg). Damit fehlt der
// Zurück-Pfeil; am iPhone geht nur der Wisch vom linken Rand, den kaum
// jemand kennt. Deshalb ein eigener ‹-Knopf, NUR in der installierten App
// und nicht auf der Startseite. Sitzt im Seitenkopf links vom Logo
// (#mdu-zurueck-platz in desktop-header.tsx); Seiten ohne diesen Kopf
// (Admin, Profil …) bekommen ihn oben links über der Seite.
// Ohne eigene Vorgeschichte (App frisch geöffnet, Link aus einem Push)
// führt er zur Startseite statt ins Leere.
// ============================================================

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';

const istApp = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Besuchte Seiten in dieser App-Sitzung — ein „Zurück“ zur vorletzten Seite
// nimmt die letzte wieder heraus, damit erkennbar bleibt, ob es noch zurückgeht.
const verlauf: string[] = [];

export function AppZurueck() {
  const pathname = usePathname();
  const router = useRouter();
  const app = useSyncExternalStore(() => () => {}, istApp, () => false);
  const [platz, setPlatz] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (verlauf[verlauf.length - 2] === pathname) verlauf.pop();
    else if (verlauf[verlauf.length - 1] !== pathname) verlauf.push(pathname);
    // Platz im Seitenkopf erst nach dem Rendern der neuen Seite suchen.
    const id = requestAnimationFrame(() => setPlatz(document.getElementById('mdu-zurueck-platz')));
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  if (!app || pathname === '/') return null;

  const zurueck = () => {
    if (verlauf.length > 1) router.back();
    else router.push('/');
  };

  const knopf = (
    <button
      type="button"
      onClick={zurueck}
      aria-label="Zurück"
      style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)',
        color: 'var(--th-text-strong)', cursor: 'pointer', padding: 0,
        ...(platz ? {} : {
          position: 'fixed', zIndex: 60,
          top: 'calc(env(safe-area-inset-top, 0px) + 10px)', left: 'calc(env(safe-area-inset-left, 0px) + 10px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        }),
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
  return platz ? createPortal(knopf, platz) : knopf;
}
