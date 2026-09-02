'use client';

// ============================================================
// Kontexte der MDU-Seite
// ============================================================
//
// Der Anmeldekontext gehört zur Münchner Dart Union. Die Munich Darts
// Challenge unter `/mdc` ist ein eigenständiges Projekt mit eigener
// Datenschicht und (später) eigener Anmeldung — dort hat er nichts zu
// suchen.
//
// Das ist nicht nur Aufräumen: Der Kontext baut beim Einhängen eine
// Verbindung zur MDU-Supabase auf (`getSession`, `onAuthStateChange`). Auf
// MDC-Seiten wäre das eine Abfrage an ein fremdes Konto-System, die niemand
// braucht und die niemand erwartet.
//
// Wenn die MDC ihr eigenes Zuhause bekommt, fällt diese Weiche ersatzlos
// weg — dort gibt es den MDU-Kontext dann gar nicht mehr.
// ============================================================

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/auth/auth-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMdc = pathname === '/mdc' || pathname.startsWith('/mdc/');

  if (isMdc) return <>{children}</>;
  return <AuthProvider>{children}</AuthProvider>;
}
