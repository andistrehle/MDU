import { describe, expect, it } from 'vitest';
import { summarizeDay, summarizeWeek, startOfWeek, toDateKey } from '@/lib/diary/summary';
import { calcRecipe, recipeTotalGrams } from '@/lib/recipes/calc';
import { computePoints } from '@/lib/points/engine';
import { scaleNutrients, EMPTY_NUTRIENTS } from '@/lib/nutrition/types';
import type { DiaryEntry } from '@/lib/food/types';
import { DEFAULT_BUDGET_CONFIG } from '@/lib/budget/engine';

function entry(partial: Partial<DiaryEntry>): DiaryEntry {
  return {
    id: crypto.randomUUID(),
    date: '2026-08-03',
    meal: 'breakfast',
    foodId: null,
    recipeId: null,
    name: 'Test',
    brand: null,
    grams: 100,
    nutrients: { ...EMPTY_NUTRIENTS, calories: 200, protein: 5 },
    points: 6,
    zeroPointApplied: false,
    formulaVersion: 'fp-v1',
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe('Tagessummen', () => {
  it('summiert Punkte und Nährwerte pro Tag und Mahlzeit', () => {
    const entries = [
      entry({ meal: 'breakfast', points: 6 }),
      entry({ meal: 'breakfast', points: 3 }),
      entry({ meal: 'lunch', points: 12 }),
      entry({ date: '2026-08-02', points: 99 }), // anderer Tag — zählt nicht
    ];
    const day = summarizeDay('2026-08-03', entries);
    expect(day.totalPoints).toBe(21);
    expect(day.byMeal.breakfast.points).toBe(9);
    expect(day.byMeal.lunch.points).toBe(12);
    expect(day.byMeal.dinner.points).toBe(0);
    expect(day.totalNutrients.calories).toBe(600);
    expect(day.entryCount).toBe(3);
  });
});

describe('Wochenzusammenfassung', () => {
  it('zählt Tage im Budget und verrechnet die Reserve', () => {
    const monday = new Date(2026, 7, 3); // Mo, 3.8.2026
    const entries = [
      entry({ date: '2026-08-03', points: 20 }), // im Budget (30)
      entry({ date: '2026-08-04', points: 38 }), // 8 drüber → Reserve
    ];
    const week = summarizeWeek(monday, entries, 30, DEFAULT_BUDGET_CONFIG, new Date(2026, 7, 4));
    expect(week.days).toHaveLength(2);
    expect(week.daysWithinBudget).toBe(1);
    // Mo: 10 übrig → +4 Übertrag; Di: 8 drüber → -8
    expect(week.reserve.reserveUsed).toBe(8);
    expect(week.reserve.reserveRemaining).toBe(35 + 4 - 8);
  });

  it('startOfWeek liefert Montag', () => {
    expect(toDateKey(startOfWeek(new Date(2026, 7, 6)))).toBe('2026-08-03'); // Do → Mo
    expect(toDateKey(startOfWeek(new Date(2026, 7, 9)))).toBe('2026-08-03'); // So → Mo
  });
});

describe('Rezeptberechnung', () => {
  const ingredients = [
    {
      id: '1', foodId: null, name: 'Nudeln',
      nutrientsPer100: { ...EMPTY_NUTRIENTS, calories: 350, carbs: 70, sugar: 3, protein: 12, fiber: 3 },
      grams: 500,
    },
    {
      id: '2', foodId: null, name: 'Sahne',
      nutrientsPer100: { ...EMPTY_NUTRIENTS, calories: 300, fat: 30, saturatedFat: 19, sugar: 3 },
      grams: 200,
    },
  ];

  it('summiert Zutaten und teilt durch Portionen', () => {
    const result = calcRecipe({ ingredients, servings: 4 });
    expect(result.totalNutrients.calories).toBeCloseTo(350 * 5 + 300 * 2, 5);
    expect(result.perServingNutrients.calories).toBeCloseTo((350 * 5 + 300 * 2) / 4, 5);
    expect(recipeTotalGrams({ ingredients })).toBe(700);
  });

  it('Punkte pro Portion entsprechen den Portions-Nährwerten', () => {
    const result = calcRecipe({ ingredients, servings: 4 });
    const expected = computePoints(scaleNutrients(result.totalNutrients, 100 / 4));
    expect(result.pointsPerServing).toBe(expected);
  });

  it('Portionsänderung berechnet Werte neu', () => {
    const four = calcRecipe({ ingredients, servings: 4 });
    const two = calcRecipe({ ingredients, servings: 2 });
    expect(two.perServingNutrients.calories).toBeCloseTo(four.perServingNutrients.calories * 2, 5);
    expect(two.pointsPerServing).toBeGreaterThan(four.pointsPerServing);
    expect(two.totalPoints).toBe(four.totalPoints);
  });
});
