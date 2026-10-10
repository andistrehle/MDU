// ============================================================
// Leg-Ergebnisse und Einzelpunkte — Best of 3 und Best of 5
// ============================================================
//
// Spielbedingungen Ziffer 2: Jede Partie auf zwei Gewinn-Legs (Best of 3),
// in der La Liga auf drei Gewinn-Legs (Best of 5) — Einzel UND Doppel.
//
// Einzelpunkte (Einzelrangliste, nur Einzel):
//   Best of 3: 2:0 = 3 · 2:1 = 2 · 1:2 = 1 · 0:2 = 0   (Spielbedingungen Ziffer 10)
//   Best of 5: 3:0 = 5 · 3:1 = 4 · 3:2 = 3 · 2:3 = 2 · 1:3 = 1 · 0:3 = 0
//              (vom Betreiber festgelegt, 10.10.2026)
// Der Modus ergibt sich aus dem Ergebnis selbst (wer 3 Legs hat, spielte
// Best of 5) — so stimmt die Rechnung auch dort, wo die Liga nicht bekannt ist.
// ============================================================

export type BestOf = 3 | 5;

export const LEG_RESULTS_BO3 = ['2:0', '2:1', '1:2', '0:2'] as const;
export const LEG_RESULTS_BO5 = ['3:0', '3:1', '3:2', '2:3', '1:3', '0:3'] as const;
export type LegResult = typeof LEG_RESULTS_BO3[number] | typeof LEG_RESULTS_BO5[number];

export const legResults = (bestOf: BestOf): readonly LegResult[] => (bestOf === 5 ? LEG_RESULTS_BO5 : LEG_RESULTS_BO3);

/** La Liga = Best of 5, alle anderen Best of 3 (Liga-Code „la" oder Name „La Liga"/„La-Liga"). */
export function bestOfFuerLiga(liga: string | null | undefined): BestOf {
  const s = (liga ?? '').toLowerCase().trim();
  return s === 'la' || /\bla[\s-]?liga\b/.test(s) ? 5 : 3;
}

const BO3: Record<string, number> = { '2:0': 3, '2:1': 2, '1:2': 1, '0:2': 0 };
const BO5: Record<string, number> = { '3:0': 5, '3:1': 4, '3:2': 3, '2:3': 2, '1:3': 1, '0:3': 0 };

/** Einzelpunkte für ein Leg-Ergebnis aus Sicht des Spielers (ungültig → 0). */
export function pointsForLegs(legsFor: number, legsAgainst: number): number {
  const k = `${legsFor}:${legsAgainst}`;
  return (Math.max(legsFor, legsAgainst) === 3 ? BO5[k] : BO3[k]) ?? 0;
}

/** Legs je Spiel bei einer Wertung (Nichtantritt): 18 Spiele à 2:0 bzw. 3:0. */
export const legsJeSpiel = (bestOf: BestOf) => (bestOf === 5 ? 3 : 2);
