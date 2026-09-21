'use client';

// ============================================================
// Demo-Anmeldung — Rolle merken, mehr nicht
// ============================================================
//
// Es gibt KEINE Authentifizierung. Diese Demo soll zeigen, wie sich die
// Seite je nach Rolle verändert — dafür braucht es kein Konto, kein
// Passwort und keinen Server. Gemerkt wird die Wahl im `localStorage` des
// Geräts.
//
// Warum nicht im Cookie: Ein Cookie ginge an den Server, und diese Demo
// schickt nichts dorthin. Warum nicht nur im Zustand: Dann wäre die Rolle
// nach jedem Neuladen weg — mitten im Gespräch der sichere Weg, den Faden
// zu verlieren.
//
// Der ERSTE Durchgang rendert bewusst „abgemeldet", auch wenn im Speicher
// eine Rolle steht: Server und Browser müssen dasselbe ausliefern, sonst
// meldet React einen Hydration-Fehler. `bereit` sagt, ab wann der Speicher
// gelesen wurde — bis dahin zeigen die Bausteine nichts Rollenabhängiges an.
// ============================================================

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';
import type { DemoRolle } from '@/data/bedv/typen';

const SCHLUESSEL = 'bedv-demo-rolle';
const GUELTIG: DemoRolle[] = ['spieler', 'kapitaen', 'ligaleitung', 'admin'];

interface DemoAuth {
  rolle: DemoRolle | null;
  bereit: boolean;
  anmelden: (rolle: DemoRolle) => void;
  abmelden: () => void;
}

const Kontext = createContext<DemoAuth>({
  rolle: null, bereit: false, anmelden: () => {}, abmelden: () => {},
});

/**
 * Wer will benachrichtigt werden, wenn sich die Rolle ändert?
 *
 * `storage`-Ereignisse feuern nur in ANDEREN Tabs. Für den eigenen Tab
 * meldet `anmelden`/`abmelden` selbst — sonst bliebe die Kopfzeile nach dem
 * Rollenwechsel auf dem alten Stand stehen.
 */
const hoerer = new Set<() => void>();

function abonnieren(melden: () => void): () => void {
  hoerer.add(melden);
  window.addEventListener('storage', melden);
  return () => {
    hoerer.delete(melden);
    window.removeEventListener('storage', melden);
  };
}

function melden(): void {
  for (const h of hoerer) h();
}

function lesen(): DemoRolle | null {
  try {
    const wert = window.localStorage.getItem(SCHLUESSEL);
    return wert && (GUELTIG as string[]).includes(wert) ? (wert as DemoRolle) : null;
  } catch {
    // Privater Modus oder gesperrter Speicher: Die Demo läuft trotzdem,
    // die Rolle hält dann nur nicht über das Neuladen hinweg.
    return null;
  }
}

/**
 * Auf dem Server gibt es keinen Speicher — dort ist niemand angemeldet.
 *
 * Muss eine KONSTANTE sein und darf kein frisches Objekt liefern: React ruft
 * die Funktion beim Rendern mehrfach auf und käme sonst in eine Endlosschleife.
 */
function aufDemServer(): DemoRolle | null {
  return null;
}

export function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const rolle = useSyncExternalStore(abonnieren, lesen, aufDemServer);

  // Im ersten Durchgang liefert React den Server-Wert, damit Server und
  // Browser dasselbe rendern. `bereit` sagt den Bausteinen, ab wann sie sich
  // auf die Rolle verlassen dürfen — bis dahin zeigen sie nichts
  // Rollenabhängiges, sonst blitzte „nicht angemeldet" kurz auf.
  const bereit = useSyncExternalStore(abonnieren, () => true, () => false);

  const anmelden = useCallback((neu: DemoRolle) => {
    try { window.localStorage.setItem(SCHLUESSEL, neu); } catch { /* s. o. */ }
    melden();
  }, []);

  const abmelden = useCallback(() => {
    try { window.localStorage.removeItem(SCHLUESSEL); } catch { /* s. o. */ }
    melden();
  }, []);

  return (
    <Kontext.Provider value={{ rolle, bereit, anmelden, abmelden }}>
      {children}
    </Kontext.Provider>
  );
}

export function useDemoAuth(): DemoAuth {
  return useContext(Kontext);
}
