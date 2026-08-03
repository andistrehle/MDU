/**
 * Nährwerte, immer in Gramm bzw. kcal bezogen auf eine Referenzmenge
 * (typisch: 100 g / 100 ml oder eine Portion).
 */
export interface Nutrients {
  /** Kilokalorien */
  calories: number;
  /** Fett gesamt in g */
  fat: number;
  /** davon gesättigte Fettsäuren in g */
  saturatedFat: number;
  /** Kohlenhydrate gesamt in g */
  carbs: number;
  /** davon Zucker in g */
  sugar: number;
  /** Ballaststoffe in g */
  fiber: number;
  /** Eiweiß in g */
  protein: number;
  /** Salz in g */
  salt: number;
}

export const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0,
  fat: 0,
  saturatedFat: 0,
  carbs: 0,
  sugar: 0,
  fiber: 0,
  protein: 0,
  salt: 0,
};

export type NutrientKey = keyof Nutrients;

export const NUTRIENT_KEYS: NutrientKey[] = [
  'calories',
  'fat',
  'saturatedFat',
  'carbs',
  'sugar',
  'fiber',
  'protein',
  'salt',
];

/** Bezugsgröße einer Nährwertangabe. */
export type NutritionBasis = 'per100g' | 'per100ml' | 'perPortion';

/** Skaliert Nährwerte linear (z. B. von 100 g auf `grams`). */
export function scaleNutrients(per100: Nutrients, grams: number): Nutrients {
  const f = grams / 100;
  return {
    calories: per100.calories * f,
    fat: per100.fat * f,
    saturatedFat: per100.saturatedFat * f,
    carbs: per100.carbs * f,
    sugar: per100.sugar * f,
    fiber: per100.fiber * f,
    protein: per100.protein * f,
    salt: per100.salt * f,
  };
}

/** Addiert zwei Nährwertsätze. */
export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    calories: a.calories + b.calories,
    fat: a.fat + b.fat,
    saturatedFat: a.saturatedFat + b.saturatedFat,
    carbs: a.carbs + b.carbs,
    sugar: a.sugar + b.sugar,
    fiber: a.fiber + b.fiber,
    protein: a.protein + b.protein,
    salt: a.salt + b.salt,
  };
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  return list.reduce(addNutrients, { ...EMPTY_NUTRIENTS });
}
