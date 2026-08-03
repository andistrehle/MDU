import { describe, expect, it } from 'vitest';
import {
  kjToKcal,
  normalizeLabel,
  parseDecimal,
  validateNutrients,
} from '@/lib/nutrition/normalize';
import { EMPTY_NUTRIENTS, scaleNutrients } from '@/lib/nutrition/types';

describe('parseDecimal', () => {
  it('unterstützt Dezimalkomma und Dezimalpunkt', () => {
    expect(parseDecimal('1,5')).toBe(1.5);
    expect(parseDecimal('1.5')).toBe(1.5);
    expect(parseDecimal('12,34 g')).toBe(12.34);
    expect(parseDecimal(' 250 ')).toBe(250);
  });

  it('erfindet keine Werte', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('n/a')).toBeNull();
    expect(parseDecimal(null)).toBeNull();
    expect(parseDecimal(undefined)).toBeNull();
  });

  it('behandelt „<0,5“ als 0', () => {
    expect(parseDecimal('<0,5')).toBe(0);
    expect(parseDecimal('< 0.5 g')).toBe(0);
  });
});

describe('kJ → kcal', () => {
  it('rechnet korrekt um', () => {
    expect(kjToKcal(4.184)).toBeCloseTo(1, 6);
    expect(kjToKcal(1046)).toBeCloseTo(250, 0);
  });
});

describe('normalizeLabel', () => {
  it('übernimmt 100g-Werte direkt und leitet kcal aus kJ ab', () => {
    const result = normalizeLabel(
      { energyKj: 1046, fat: 10, saturatedFat: 4, carbs: 30, sugar: 12, fiber: 3, protein: 8, salt: 1.2 },
      'per100g',
    );
    expect(result.per100.calories).toBeCloseTo(250, 0);
    expect(result.kcalDerivedFromKj).toBe(true);
    expect(result.per100.sugar).toBe(12);
    expect(result.missing).toHaveLength(0);
  });

  it('rechnet Portionswerte auf 100 g um', () => {
    // 30-g-Portion mit 120 kcal → 400 kcal / 100 g
    const result = normalizeLabel(
      { energyKcal: 120, fat: 6, saturatedFat: 3, carbs: 12, sugar: 9, fiber: 1.5, protein: 3, salt: 0.3 },
      'perPortion',
      30,
    );
    expect(result.per100.calories).toBeCloseTo(400, 5);
    expect(result.per100.sugar).toBeCloseTo(30, 5);
  });

  it('wirft bei Portionsbasis ohne Portionsgröße', () => {
    expect(() => normalizeLabel({ energyKcal: 100 }, 'perPortion')).toThrow();
  });

  it('listet fehlende Felder auf statt Werte zu erfinden', () => {
    const result = normalizeLabel({ energyKcal: 100, fat: 5 }, 'per100g');
    expect(result.missing).toContain('sugar');
    expect(result.missing).toContain('protein');
    expect(result.per100.sugar).toBe(0);
  });
});

describe('validateNutrients', () => {
  it('erkennt Zucker > Kohlenhydrate', () => {
    const warnings = validateNutrients({ ...EMPTY_NUTRIENTS, calories: 100, carbs: 5, sugar: 20 });
    expect(warnings.some((w) => w.includes('Zucker'))).toBe(true);
  });

  it('erkennt gesättigte Fettsäuren > Fett gesamt', () => {
    const warnings = validateNutrients({ ...EMPTY_NUTRIENTS, calories: 100, fat: 2, saturatedFat: 10 });
    expect(warnings.some((w) => w.includes('esättigte'))).toBe(true);
  });

  it('meldet plausible Werte nicht', () => {
    const warnings = validateNutrients({
      calories: 250, fat: 10, saturatedFat: 4, carbs: 30, sugar: 12, fiber: 3, protein: 8, salt: 1.2,
    });
    expect(warnings).toHaveLength(0);
  });
});

describe('Portionsskalierung', () => {
  it('skaliert linear zwischen 100 g und Portion', () => {
    const per100 = { calories: 200, fat: 8, saturatedFat: 2, carbs: 20, sugar: 5, fiber: 4, protein: 10, salt: 0.5 };
    const portion = scaleNutrients(per100, 75);
    expect(portion.calories).toBeCloseTo(150, 5);
    expect(portion.protein).toBeCloseTo(7.5, 5);
    // Rück-Skalierung
    const back = scaleNutrients(portion, (100 / 75) * 100);
    expect(back.calories).toBeCloseTo(200, 5);
  });
});
