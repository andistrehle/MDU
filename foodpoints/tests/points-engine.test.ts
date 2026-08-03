import { describe, expect, it } from 'vitest';
import type { Nutrients } from '@/lib/nutrition/types';
import { EMPTY_NUTRIENTS } from '@/lib/nutrition/types';
import {
  computeFoodPoints,
  computePoints,
  computePointsRaw,
  qualifiesAsZeroPoint,
  roundHalfUp,
} from '@/lib/points/engine';
import { ACTIVE_FORMULA, FORMULA_V1 } from '@/lib/points/config';

const base: Nutrients = { ...EMPTY_NUTRIENTS };

function nutrients(partial: Partial<Nutrients>): Nutrients {
  return { ...base, ...partial };
}

describe('Punkteformel (fp-v1)', () => {
  it('Lebensmittel ohne verwertbare Energie ergibt 0 Punkte', () => {
    expect(computePoints(nutrients({}))).toBe(0);
    // Wasser: 0 kcal, 0 Makros
    expect(computePoints(nutrients({ calories: 0 }))).toBe(0);
  });

  it('Punkte können nie negativ sein', () => {
    // Extrem: viel Eiweiß + Ballaststoffe, kaum Kalorien
    const n = nutrients({ calories: 10, protein: 30, fiber: 20 });
    expect(computePointsRaw(n)).toBeLessThan(0);
    expect(computePoints(n)).toBe(0);
  });

  it('verdoppelte Portion ergibt ungefähr doppelte Punkte', () => {
    const food = {
      nutrientsPer100: nutrients({ calories: 250, saturatedFat: 3, sugar: 10, protein: 8, fiber: 2 }),
      category: 'prepared',
      isZeroPointFood: false,
    };
    const single = computeFoodPoints(food, 100);
    const double = computeFoodPoints(food, 200);
    expect(double.total).toBeGreaterThanOrEqual(single.total * 2 - 1);
    expect(double.total).toBeLessThanOrEqual(single.total * 2 + 1);
  });

  it('mehr Zucker erhöht die Punkte', () => {
    const low = nutrients({ calories: 100, sugar: 5 });
    const high = nutrients({ calories: 100, sugar: 40 });
    expect(computePointsRaw(high)).toBeGreaterThan(computePointsRaw(low));
    expect(computePoints(high)).toBeGreaterThan(computePoints(low));
  });

  it('mehr gesättigtes Fett erhöht die Punkte', () => {
    const low = nutrients({ calories: 200, saturatedFat: 1 });
    const high = nutrients({ calories: 200, saturatedFat: 12 });
    expect(computePoints(high)).toBeGreaterThan(computePoints(low));
  });

  it('mehr Eiweiß oder Ballaststoffe reduziert die Punkte', () => {
    const plain = nutrients({ calories: 300 });
    const protein = nutrients({ calories: 300, protein: 30 });
    const fiber = nutrients({ calories: 300, fiber: 15 });
    expect(computePointsRaw(protein)).toBeLessThan(computePointsRaw(plain));
    expect(computePointsRaw(fiber)).toBeLessThan(computePointsRaw(plain));
  });

  it('Rundung ist reproduzierbar (half-up, auch bei .5)', () => {
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(3.5)).toBe(4);
    expect(roundHalfUp(2.4999)).toBe(2);
    expect(roundHalfUp(-0.4)).toBe(0);
    // dieselben Nährwerte ergeben immer dieselben Punkte
    const n = nutrients({ calories: 183, saturatedFat: 2.2, sugar: 7.7, protein: 4.1, fiber: 1.3 });
    expect(computePoints(n)).toBe(computePoints({ ...n }));
  });

  it('Rohwert entspricht der dokumentierten Formel', () => {
    const n = nutrients({ calories: 100, saturatedFat: 2, sugar: 10, protein: 5, fiber: 3 });
    const expected =
      100 * FORMULA_V1.calorieFactor +
      2 * FORMULA_V1.saturatedFatFactor +
      10 * FORMULA_V1.sugarFactor -
      5 * FORMULA_V1.proteinFactor -
      3 * FORMULA_V1.fiberFactor;
    expect(computePointsRaw(n, FORMULA_V1)).toBeCloseTo(expected, 10);
  });
});

describe('0-Punkte-Regel', () => {
  it('greift nur bei markierten Lebensmitteln in berechtigten Kategorien', () => {
    expect(
      qualifiesAsZeroPoint({ category: 'vegetables', isZeroPointFood: true, sugarPer100: 3 }),
    ).toBe(true);
    expect(
      qualifiesAsZeroPoint({ category: 'vegetables', isZeroPointFood: false, sugarPer100: 3 }),
    ).toBe(false);
  });

  it('Fertigprodukte sind nie 0 Punkte, auch wenn markiert', () => {
    expect(
      qualifiesAsZeroPoint({ category: 'prepared', isZeroPointFood: true, sugarPer100: 0 }),
    ).toBe(false);
  });

  it('Getränke mit Zucker werden immer berechnet', () => {
    expect(
      qualifiesAsZeroPoint({ category: 'drinks', isZeroPointFood: true, sugarPer100: 10 }),
    ).toBe(false);
    const cola = {
      nutrientsPer100: nutrients({ calories: 42, sugar: 10.6, carbs: 10.6 }),
      category: 'drinks',
      isZeroPointFood: true, // selbst bei (fälschlicher) Markierung
    };
    const result = computeFoodPoints(cola, 330);
    expect(result.zeroPointApplied).toBe(false);
    expect(result.total).toBeGreaterThan(0);
  });

  it('markiertes Basislebensmittel ergibt 0 Punkte für jede Menge', () => {
    const broccoli = {
      nutrientsPer100: nutrients({ calories: 34, carbs: 7, sugar: 1.7, fiber: 2.6, protein: 2.8 }),
      category: 'vegetables',
      isZeroPointFood: true,
    };
    expect(computeFoodPoints(broccoli, 500).total).toBe(0);
    expect(computeFoodPoints(broccoli, 500).zeroPointApplied).toBe(true);
  });
});

describe('Formelversion', () => {
  it('Ergebnis trägt die aktive Versionskennung', () => {
    const r = computeFoodPoints(
      { nutrientsPer100: nutrients({ calories: 100 }), category: 'other', isZeroPointFood: false },
      100,
    );
    expect(r.formulaVersion).toBe(ACTIVE_FORMULA.version);
  });
});
