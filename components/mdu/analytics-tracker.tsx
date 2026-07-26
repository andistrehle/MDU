'use client';

// ============================================================
// Anonyme, cookielose Nutzungsstatistik — Client-Tracker
// ============================================================
//
// Meldet pro Seitenaufruf EIN Ereignis (Pfad, Theme, ein-/ausgeloggt-Flag,
// anonyme Session-Kennung). KEIN Cookie, KEINE IP, KEINE Zuordnung zu einem
// Konto/Spieler. Die Session-Kennung liegt nur in sessionStorage (verschwindet
// beim Schließen des Tabs). Admin-Seiten werden bewusst NICHT gezählt.
// ============================================================

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

const SESSION_KEY = 'mdu-analytics-session';

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? `s-${Math.floor(performance.now())}-${Math.floor(performance.timeOrigin)}`);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'nostore';
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase || !pathname || loading) return;
    // Admin-Bereich nicht mitzählen (das ist Verwaltungsarbeit, keine Nutzung).
    if (pathname.startsWith('/admin')) return;
    // Pro Pfadwechsel nur einmal (verhindert Doppel-Events).
    if (lastLogged.current === pathname) return;
    lastLogged.current = pathname;

    const theme = typeof document !== 'undefined'
      ? (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
      : null;

    // Ereignis über RPC melden (security definer) — kein Zurücklesen der Zeile,
    // daher keine RLS-Select-Falle. Fehler nur loggen, nie den Nutzer stören.
    supabase.rpc('track_event', {
      p_path: pathname.slice(0, 300),
      p_theme: theme,
      p_logged_in: !!user,
      p_session_id: sessionId(),
    }).then(({ error }) => { if (error) console.warn('[analytics]', error.message); });
  }, [pathname, user, loading]);

  return null;
}
