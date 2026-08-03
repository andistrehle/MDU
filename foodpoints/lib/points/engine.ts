import type { Nutrients } from '@/lib/nutrition/types';
import { scaleNutrients } from '@/lib/nutrition/types';
import {
  ACTIVE_FORMULA,
  isZeroPointEligibleCategory,
  type PointsFormulaConfig,
} from './config';

/**
 * FoodPoints-Punkte-Engine.
 *
 * Eine einzige Implementierung für Server UND Client — dadurch sind die
 * Ergebnisse überall identisch. Die Faktoren kommen ausschließlich aus
 * `lib/points/config.ts` (versioniert).
 */

/** Kaufmännisch runden (half-up), reproduzierbar auch für negative Rohwerte. */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

/**
 * Roh-Punktwert (unrundiert, kann negativ sein) für einen Nährwertsatz.
 * Die Nährwerte müssen sich auf die Menge beziehen, für die Punkte
 * berechnet werden sollen (z. B. bereits auf Portionsgröße skaliert).
 */
export function computePointsRaw(
  n: Nutrients,
  config: PointsFormulaConfig = ACTIVE_FORMULA,
): number {
  const protein =
    config.proteinCapGrams === null ? n.protein : Math.min(n.protein, config.proteinCapGrams);
  const fiber =
    config.fiberCapGrams === null ? n.fiber : Math.min(n.fiber, config.fiberCapGrams);

  return (
    n.calories * config.calorieFactor +
    n.saturatedFat * config.saturatedFatFactor +
    n.sugar * config.sugarFactor -
    protein * config.proteinFactor -
    fiber * config.fiberFactor
  );
}

/** Gerundete, nie negative Punkte für einen Nährwertsatz. */
export function computePoints(
  n: Nutrients,
  config: PointsFormulaConfig = ACTIVE_FORMULA,
): number {
  return Math.max(0, roundHalfUp(computePointsRaw(n, config)));
}

export interface ZeroPointCheckInput {
  /** Kategorie-ID des Lebensmittels (siehe FOOD_CATEGORIES). */
  category: string;
  /** Vom Ersteller/Kurator als 0-Punkte-Basislebensmittel markiert. */
  isZeroPointFood: boolean;
  /** Zucker in g pro 100 g/ml — Getränke mit Zucker werden immer berechnet. */
  sugarPer100: number;
}

/**
 * Prüft, ob die 0-Punkte-Regel greifen darf.
 * Regeln:
 * - nur wenn das Lebensmittel explizit markiert ist UND
 * - die Kategorie grundsätzlich berechtigt ist (Basislebensmittel).
 * - Getränke mit Zucker sind nie 0 Punkte (Kategorie 'drinks' ist ohnehin
 *   nicht berechtigt — doppelte Absicherung über sugarPer100).
 */
export function qualifiesAsZeroPoint(input: ZeroPointCheckInput): boolean {
  if (!input.isZeroPointFood) return false;
  if (!isZeroPointEligibleCategory(input.category)) return false;
  if (input.category === 'drinks' && input.sugarPer100 > 0) return false;
  return true;
}

export interface FoodPointsInput {
  /** Nährwerte pro 100 g bzw. 100 ml. */
  nutrientsPer100: Nutrients;
  category: string;
  isZeroPointFood: boolean;
}

export interface PointsResult {
  /** Punkte pro 100 g/ml */
  per100: number;
  /** Punkte für die angefragte Menge */
  total: number;
  /** Unrundierter Rohwert für die angefragte Menge */
  raw: number;
  /** Verwendete Formelversion */
  formulaVersion: string;
  /** 0-Punkte-Regel angewendet? */
  zeroPointApplied: boolean;
}

/**
 * Punkte für eine beliebige Menge eines Lebensmittels.
 * Wichtig: Es werden die SKALIERTEN Nährwerte gerundet (nicht die Punkte
 * skaliert) — so ergibt die doppelte Portion ungefähr doppelte Punkte und
 * Rundungsfehler summieren sich nicht.
 */
export function computeFoodPoints(
  food: FoodPointsInput,
  grams: number,
  config: PointsFormulaConfig = ACTIVE_FORMULA,
): PointsResult {
  const zero = qualifiesAsZeroPoint({
    category: food.category,
    isZeroPointFood: food.isZeroPointFood,
    sugarPer100: food.nutrientsPer100.sugar,
  });

  if (zero) {
    return { per100: 0, total: 0, raw: 0, formulaVersion: config.version, zeroPointApplied: true };
  }

  const scaled = scaleNutrients(food.nutrientsPer100, grams);
  return {
    per100: computePoints(food.nutrientsPer100, config),
    total: computePoints(scaled, config),
    raw: computePointsRaw(scaled, config),
    formulaVersion: config.version,
    zeroPointApplied: false,
  };
}
