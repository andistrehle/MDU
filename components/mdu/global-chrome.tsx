'use client';

// ============================================================
// Globale MDU-Oberflächenelemente
// ============================================================
//
// Bottom-Nav, Demo-Tour und Analytics gehören zur MDU-Seite. Unter `/mdc`
// läuft die eigenständige Demo der Munich Dart Challenge, unter `/tk` die
// Demo für Tennis Kail — beide mit eigener Navigation und eigenem
// Erscheinungsbild. Dort darf nichts davon hineinragen. Deshalb liegt die
// Entscheidung an einer Stelle statt in jedem Einzelbaustein.
// ============================================================

import { usePathname } from 'next/navigation';
import { BottomNav } from './bottom-nav';
import { DemoTour } from './demo-tour';
import { DemoTourButton } from './tour-restart-link';
import { AnalyticsTracker } from './analytics-tracker';

export function GlobalChrome() {
  const pathname = usePathname();
  if (pathname === '/mdc' || pathname.startsWith('/mdc/')) return null;
  if (pathname === '/tk' || pathname.startsWith('/tk/')) return null;

  return (
    <>
      <BottomNav />
      <DemoTourButton />
      <DemoTour />
      <AnalyticsTracker />
    </>
  );
}
