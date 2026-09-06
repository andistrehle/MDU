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
import { isMdcPath, MDC_STANDALONE } from '@/lib/mdc/site';
import { AuthProvider } from '@/lib/auth/auth-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Eigenständige MDC-Seite: Dort gibt es keine MDU-Anmeldung. Der Kontext
  // wird trotzdem gestellt — er ist ohne Supabase-Zugangsdaten von selbst
  // untätig (`lib/supabase/client.ts` liefert dann `null`, es gibt weder eine
  // Anfrage noch ein Cookie), und die MDU-Seiten im selben Build lassen sich
  // nur so vorrendern. Im MDC-Projekt deshalb KEINE Supabase-Variablen setzen.
  if (MDC_STANDALONE) return <AuthProvider>{children}</AuthProvider>;

  // In der MDU-Ausprägung entscheidet der Pfad: Unter `/mdc` läuft die
  // eigenständige Seite ohne MDU-Kontext.
  if (isMdcPath(pathname)) return <>{children}</>;
  return <AuthProvider>{children}</AuthProvider>;
}
