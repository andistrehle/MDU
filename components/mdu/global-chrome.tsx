'use client';

// ============================================================
// Globale MDU-Oberflächenelemente
// ============================================================
//
// Bottom-Nav, Demo-Tour und Analytics gehören zur MDU-Seite. Unter `/mdc`
// läuft die eigenständige Demo der Munich Dart Challenge mit eigener
// Navigation und eigenem Erscheinungsbild — dort darf nichts davon
// hineinragen. Deshalb liegt die Entscheidung an einer Stelle statt in jedem
// Einzelbaustein.
// ============================================================

import { usePathname } from 'next/navigation';
import { isMdcPath } from '@/lib/mdc/site';
import { BottomNav } from './bottom-nav';
import { DemoTour } from './demo-tour';
import { DemoTourButton } from './tour-restart-link';
import { AnalyticsTracker } from './analytics-tracker';

export function GlobalChrome() {
  const pathname = usePathname();
  // `isMdcPath` ist auf der eigenen MDC-Domain immer wahr — dort gibt es die
  // MDU-Oberfläche gar nicht, und der Pfad heißt im Browser nicht mehr /mdc.
  if (isMdcPath(pathname)) return null;

  return (
    <>
      <BottomNav />
      <DemoTourButton />
      <DemoTour />
      <AnalyticsTracker />
    </>
  );
}
