'use client';

// ============================================================
// Globale MDU-Oberflächenelemente
// ============================================================
//
// Bottom-Nav, Demo-Tour und Analytics gehören zur MDU-Seite. Die Demo-Tour
// ist seit 25.10.2026 ausgeblendet (nur noch über „/?tour=1“, siehe
// demo-tour.tsx); `DemoTourButton` (tour-restart-link.tsx) bleibt ungenutzt liegen. Unter `/mdc`
// läuft die eigenständige Demo der Munich Dart Challenge mit eigener
// Navigation und eigenem Erscheinungsbild — dort darf nichts davon
// hineinragen. Deshalb liegt die Entscheidung an einer Stelle statt in jedem
// Einzelbaustein.
// ============================================================

import { usePathname } from 'next/navigation';
import { isMdcPath } from '@/lib/mdc/site';
import { BottomNav } from './bottom-nav';
import { DemoTour } from './demo-tour';
import { AnalyticsTracker } from './analytics-tracker';
import { PushAbfrage } from './push-abfrage';
import { AppZurueck } from './app-zurueck';

export function GlobalChrome() {
  const pathname = usePathname();
  // `isMdcPath` ist auf der eigenen MDC-Domain immer wahr — dort gibt es die
  // MDU-Oberfläche gar nicht, und der Pfad heißt im Browser nicht mehr /mdc.
  if (isMdcPath(pathname)) return null;

  return (
    <>
      <BottomNav />
      <DemoTour />
      <AnalyticsTracker />
      <PushAbfrage />
      <AppZurueck />
    </>
  );
}
