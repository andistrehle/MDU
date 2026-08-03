import type { DiaryEntry, Food, MealSlot, Recipe } from '@/lib/food/types';
import { scaleNutrients } from '@/lib/nutrition/types';
import { computeFoodPoints } from '@/lib/points/engine';
import { calcRecipe } from '@/lib/recipes/calc';

/**
 * Erzeugt Tagebucheintrag-Daten (ohne id/Zeitstempel) aus einem Lebensmittel
 * bzw. Rezept — Punkte und Nährwerte werden als Snapshot eingefroren.
 */

export type NewDiaryEntry = Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>;

export function entryFromFood(
  food: Food,
  grams: number,
  date: string,
  meal: MealSlot,
): NewDiaryEntry {
  const points = computeFoodPoints(
    {
      nutrientsPer100: food.nutrientsPer100,
      category: food.category,
      isZeroPointFood: food.isZeroPointFood,
    },
    grams,
  );
  return {
    date,
    meal,
    foodId: food.id,
    recipeId: null,
    name: food.name,
    brand: food.brand,
    grams,
    nutrients: scaleNutrients(food.nutrientsPer100, grams),
    points: points.total,
    zeroPointApplied: points.zeroPointApplied,
    formulaVersion: points.formulaVersion,
    source: food.source,
  };
}

export function entryFromRecipe(
  recipe: Recipe,
  servings: number,
  date: string,
  meal: MealSlot,
): NewDiaryEntry {
  const calc = calcRecipe(recipe);
  const perServing = calc.perServingNutrients;
  const nutrients = scaleNutrients(perServing, servings * 100);
  const points = computeFoodPoints(
    { nutrientsPer100: perServing, category: 'prepared', isZeroPointFood: false },
    servings * 100,
  );
  const totalGrams = recipe.ingredients.reduce((s, i) => s + i.grams, 0);
  return {
    date,
    meal,
    foodId: null,
    recipeId: recipe.id,
    name: servings === 1 ? recipe.name : `${recipe.name} (${servings} Portionen)`,
    brand: null,
    grams: Math.round((totalGrams / Math.max(1, recipe.servings)) * servings),
    nutrients,
    points: points.total,
    zeroPointApplied: false,
    formulaVersion: points.formulaVersion,
    source: 'user',
  };
}
