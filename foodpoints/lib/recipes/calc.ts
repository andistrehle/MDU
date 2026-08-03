import type { Recipe } from '@/lib/food/types';
import type { Nutrients } from '@/lib/nutrition/types';
import { scaleNutrients, sumNutrients } from '@/lib/nutrition/types';
import type { PointsFormulaConfig } from '@/lib/points/config';
import { ACTIVE_FORMULA } from '@/lib/points/config';
import { computePoints } from '@/lib/points/engine';

export interface RecipeCalcResult {
  totalNutrients: Nutrients;
  perServingNutrients: Nutrients;
  /** Punkte der Gesamtmenge. */
  totalPoints: number;
  /**
   * Punkte pro Portion — berechnet aus den Portions-Nährwerten
   * (nicht totalPoints / servings, damit Rundung pro Portion stimmt).
   */
  pointsPerServing: number;
  formulaVersion: string;
}

export function calcRecipe(
  recipe: Pick<Recipe, 'ingredients' | 'servings'>,
  config: PointsFormulaConfig = ACTIVE_FORMULA,
): RecipeCalcResult {
  const servings = Math.max(1, recipe.servings);
  const total = sumNutrients(
    recipe.ingredients.map((ing) => scaleNutrients(ing.nutrientsPer100, ing.grams)),
  );
  const perServing = scaleNutrients(total, 100 / servings);
  return {
    totalNutrients: total,
    perServingNutrients: perServing,
    totalPoints: computePoints(total, config),
    pointsPerServing: computePoints(perServing, config),
    formulaVersion: config.version,
  };
}

/** Gesamtgewicht des Rezepts in g. */
export function recipeTotalGrams(recipe: Pick<Recipe, 'ingredients'>): number {
  return recipe.ingredients.reduce((s, i) => s + i.grams, 0);
}
