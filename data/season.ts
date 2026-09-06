// ============================================================
// MDC — Saison-Stammdaten
// ============================================================
//
// Die MDC-Saison läuft von September bis Ende Juli. Zwischen Saisonende und
// Saisonstart läuft das „Sommer-Ranking" als eigene Turnierserie mit eigener
// Wertung.
//
// Es gibt genau eine laufende Wertung und ein Archiv:
//
//   LAUFEND    Saison 2026/27 — gestartet am 31.08.2026. Ergebnisse und
//              Wertung kommen aus der Arbeitsmappe des Betreibers und werden
//              mit jeder neuen Fassung neu eingelesen. Es wird nichts
//              geschätzt und nichts aus der Vorsaison fortgeschrieben.
//
//   ARCHIV     Saison 2025/26 (Endstand mit Ausschüttung) und das
//              Sommer-Ranking 2026. Beide sind abgeschlossen und werden nicht
//              mehr angefasst.
//
// Die Oberfläche fragt nie nach „dem heutigen Datum", sondern nach der Saison
// und ihrem Stand. Damit bleibt die Seite an jedem Tag stimmig.
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
    asOf: '2026-09-01',
    current: false,
  },
  {
    id: '2026-27',
    label: '2026/27',
    startDate: '2026-08-31',
    endDate: '2027-07-25',
    // Stand der Wertung — steht in der Kopfzeile der Arbeitsmappe und wird
    // beim Import mitgeliefert.
    asOf: '2026-09-05',
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

/** Die laufende Saison. Ihre Wertung beginnt bei null. */
export const RUNNING_SEASON = SEASONS[2];

/**
 * Abgeschlossene Wertungen, neueste zuerst — der Inhalt des Archivs.
 * Kommt eine Saison zum Abschluss, wandert sie durch `current: false`
 * automatisch hierher.
 */
export const ARCHIVED_SEASONS: Season[] = SEASONS
  .filter(s => !s.current)
  .sort((a, b) => b.asOf.localeCompare(a.asOf));

/**
 * Das heutige Datum in München, als `JJJJ-MM-TT`.
 *
 * Warum nicht `new Date().toISOString()`: Der Server läuft in UTC. Ab 22 bzw.
 * 23 Uhr deutscher Zeit wäre dort schon der nächste Tag — der Wochenplan
 * spränge also am Abend um einen Tag vor. `sv-SE` ist der kürzeste Weg zum
 * Format JJJJ-MM-TT.
 *
 * Früher stand hier ein fester Stichtag. Der war nötig, solange der
 * Wochenplan aus erfundenen Turnieren kam: Mit echtem Datum wären die
 * „kommenden Turniere" irgendwann Vergangenheit gewesen. Seit der Plan aus
 * den Spielorten kommt (fester Wochentag je Lokal), kann er nicht mehr
 * veralten — und das echte Datum ist das richtige.
 */
export function todayInMunich(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
}
