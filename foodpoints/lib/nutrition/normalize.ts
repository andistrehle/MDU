import type { Nutrients, NutritionBasis } from './types';

/**
 * Normalisierung von Nährwertangaben aus Etiketten-Scans und Nutzereingaben:
 * kJ→kcal, Dezimalkomma, Umrechnung zwischen „pro 100 g/ml“ und „pro Portion“.
 */

/** 1 kcal = 4,184 kJ */
export const KJ_PER_KCAL = 4.184;

export function kjToKcal(kj: number): number {
  return kj / KJ_PER_KCAL;
}

export function kcalToKj(kcal: number): number {
  return kcal * KJ_PER_KCAL;
}

/**
 * Parst eine Dezimalzahl aus Etiketten-/Nutzertext.
 * Unterstützt Dezimalkomma („1,5“), Dezimalpunkt („1.5“), Leerzeichen
 * und angehängte Einheiten („12,3 g“). Gibt `null` zurück, wenn keine
 * Zahl erkennbar ist — fehlende Werte werden NIE als 0 erfunden.
 */
export function parseDecimal(input: string | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const cleaned = input.trim().replace(/\s+/g, '');
  if (cleaned === '') return null;
  // „<0,5“ auf Etiketten: als 0 werten (kleiner als kleinste Angabe)
  const lessThan = cleaned.match(/^<(\d+(?:[.,]\d+)?)/);
  if (lessThan) return 0;
  const m = cleaned.match(/^-?\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const num = Number.parseFloat(m[0].replace(',', '.'));
  return Number.isFinite(num) ? num : null;
}

/** Rohwerte eines Etiketten-Scans; jedes Feld darf fehlen. */
export interface RawLabelValues {
  energyKcal?: number | null;
  energyKj?: number | null;
  fat?: number | null;
  saturatedFat?: number | null;
  carbs?: number | null;
  sugar?: number | null;
  fiber?: number | null;
  protein?: number | null;
  salt?: number | null;
}

export interface NormalizedLabel {
  /** Nährwerte pro 100 g/ml (fehlende Werte = 0, aber in `missing` gelistet). */
  per100: Nutrients;
  /** Felder, die im Scan fehlten und geprüft werden sollten. */
  missing: (keyof RawLabelValues)[];
  /** true, wenn kcal aus kJ umgerechnet wurde. */
  kcalDerivedFromKj: boolean;
}

/**
 * Normalisiert Etikettenwerte auf „pro 100 g/ml“.
 * @param basis Bezugsgröße der Rohwerte
 * @param portionGrams Portionsgröße in g/ml — Pflicht bei basis 'perPortion'
 */
export function normalizeLabel(
  raw: RawLabelValues,
  basis: NutritionBasis,
  portionGrams?: number | null,
): NormalizedLabel {
  const missing: (keyof RawLabelValues)[] = [];

  let kcal = raw.energyKcal ?? null;
  let kcalDerivedFromKj = false;
  if (kcal === null && raw.energyKj !== null && raw.energyKj !== undefined) {
    kcal = kjToKcal(raw.energyKj);
    kcalDerivedFromKj = true;
  }
  if (kcal === null) missing.push('energyKcal');

  const pick = (key: Exclude<keyof RawLabelValues, 'energyKcal' | 'energyKj'>): number => {
    const v = raw[key];
    if (v === null || v === undefined) {
      missing.push(key);
      return 0;
    }
    return v;
  };

  const asGiven: Nutrients = {
    calories: kcal ?? 0,
    fat: pick('fat'),
    saturatedFat: pick('saturatedFat'),
    carbs: pick('carbs'),
    sugar: pick('sugar'),
    fiber: pick('fiber'),
    protein: pick('protein'),
    salt: pick('salt'),
  };

  let per100: Nutrients;
  if (basis === 'perPortion') {
    if (!portionGrams || portionGrams <= 0) {
      throw new Error('Portionsgröße erforderlich, wenn Werte pro Portion angegeben sind.');
    }
    const f = 100 / portionGrams;
    per100 = {
      calories: asGiven.calories * f,
      fat: asGiven.fat * f,
      saturatedFat: asGiven.saturatedFat * f,
      carbs: asGiven.carbs * f,
      sugar: asGiven.sugar * f,
      fiber: asGiven.fiber * f,
      protein: asGiven.protein * f,
      salt: asGiven.salt * f,
    };
  } else {
    // per100g und per100ml sind numerisch identisch zu behandeln.
    per100 = asGiven;
  }

  return { per100, missing, kcalDerivedFromKj };
}

/** Plausibilitätsprüfung: erkennt widersprüchliche Nährwertangaben. */
export function validateNutrients(per100: Nutrients): string[] {
  const warnings: string[] = [];
  if (per100.sugar > per100.carbs + 0.5) {
    warnings.push('Zucker ist größer als Kohlenhydrate gesamt — bitte prüfen.');
  }
  if (per100.saturatedFat > per100.fat + 0.5) {
    warnings.push('Gesättigte Fettsäuren sind größer als Fett gesamt — bitte prüfen.');
  }
  const macroKcal =
    per100.fat * 9 + per100.carbs * 4 + per100.protein * 4 + per100.fiber * 2;
  if (per100.calories > 0 && macroKcal > 0) {
    const ratio = macroKcal / per100.calories;
    if (ratio > 1.5 || ratio < 0.5) {
      warnings.push('Kalorien passen nicht zu den Makronährstoffen — bitte prüfen.');
    }
  }
  if (per100.calories > 950) {
    warnings.push('Ungewöhnlich hoher Kalorienwert pro 100 g — bitte prüfen.');
  }
  for (const [key, value] of Object.entries(per100)) {
    if (value < 0) warnings.push(`Negativer Wert bei ${key} — bitte prüfen.`);
  }
  return warnings;
}
