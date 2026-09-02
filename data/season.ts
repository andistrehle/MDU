// ============================================================
// MDC — Saison-Stammdaten
// ============================================================
//
// Die MDC-Saison läuft von September bis Ende Juli. Zwischen Saisonende und
// Saisonstart läuft das „Sommer-Ranking" als eigene Turnierserie mit eigener
// Wertung — genau die Turniere, die diese Demo im Spielbetrieb zeigt.
//
// Die Oberfläche fragt nie nach „dem heutigen Datum", sondern nach der Saison
// und ihrem Stand. Damit bleibt die Demo an jedem Tag stimmig.
// ============================================================

import type { Season } from './types';

export const SEASONS: Season[] = [
  {
    id: '2025-26',
    label: '2025/26',
    startDate: '2025-09-01',
    endDate: '2026-07-26',
    asOf: '2026-07-27',
    current: false,
  },
  {
    // Zwischenserie im Sommerloch zwischen den beiden Saisons.
    id: 'sommer-2026',
    label: 'Sommer-Ranking 2026',
    startDate: '2026-07-27',
    endDate: '2026-08-30',
    asOf: '2026-08-03',
    current: false,
  },
  {
    id: '2026-27',
    label: '2026/27',
    startDate: '2026-08-31',
    endDate: '2027-07-25',
    asOf: '2026-09-02',
    current: true,
  },
];

export function getSeason(id: string): Season | undefined {
  return SEASONS.find(s => s.id === id);
}

export function getCurrentSeason(): Season {
  return SEASONS.find(s => s.current) ?? SEASONS[SEASONS.length - 1];
}

/** Die abgeschlossene Saison mit der offiziellen Endrangliste. */
export const FINAL_SEASON = SEASONS[0];

/** Die Zwischenserie im Sommerloch — deren Turniere zeigt der Spielbetrieb. */
export const SUMMER_SEASON = SEASONS[1];

/**
 * Stichtag der Demo. Was davor liegt, gilt als gespielt; was danach kommt, als
 * „kommend". Bewusst ein fester Wert statt `new Date()` — sonst wären die
 * „kommenden Turniere" irgendwann Vergangenheit und die Demo kaputt.
 */
export const DEMO_TODAY = getCurrentSeason().asOf;
