'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Plus } from 'lucide-react';
import type { MealSlot, Recipe } from '@/lib/food/types';
import { MEAL_SLOTS } from '@/lib/food/types';
import { calcRecipe } from '@/lib/recipes/calc';
import { entryFromRecipe } from '@/lib/diary/entry-factory';
import { toDateKey } from '@/lib/diary/summary';
import { useAppStore } from '@/lib/store/app-store';
import { useHydrated } from '@/lib/store/use-hydrated';
import { fmt } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Field, Input, Select } from '@/components/ui/input';
import { suggestMeal } from '@/components/add-food-sheet';

export default function RecipesPage() {
  const hydrated = useHydrated();
  const recipes = useAppStore((s) => s.recipes);
  const updateRecipe = useAppStore((s) => s.updateRecipe);
  const [selected, setSelected] = useState<Recipe | null>(null);

  if (!hydrated) {
    return <main className="p-4"><div className="fp-skeleton h-32 w-full" /></main>;
  }

  const sorted = [...recipes].sort(
    (a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.name.localeCompare(b.name),
  );

  return (
    <main className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink">Rezepte</h1>
        <Link href="/rezepte/neu">
          <Button size="sm"><Plus size={16} aria-hidden /> Neues Rezept</Button>
        </Link>
      </header>

      {sorted.length === 0 ? (
        <Card className="space-y-2 py-8 text-center">
          <p className="text-sm text-body">Noch keine Rezepte.</p>
          <p className="text-xs text-mut">
            Lege dein erstes Rezept an — Punkte und Nährwerte pro Portion werden automatisch berechnet.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {sorted.map((recipe) => {
            const calc = calcRecipe(recipe);
            return (
              <li key={recipe.id}>
                <Card className="flex items-center gap-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(recipe)}>
                    <p className="truncate text-sm font-bold text-ink">{recipe.name}</p>
                    <p className="text-xs text-mut">
                      {recipe.servings} Portionen · {calc.pointsPerServing} P /{' '}
                      {fmt(calc.perServingNutrients.calories, 0)} kcal pro Portion
                    </p>
                  </button>
                  <button
                    aria-label={recipe.isFavorite ? 'Favorit entfernen' : 'Als Favorit markieren'}
                    aria-pressed={recipe.isFavorite}
                    onClick={() => updateRecipe(recipe.id, { isFavorite: !recipe.isFavorite })}
                    className="shrink-0 p-1.5"
                  >
                    <Heart size={18} className={recipe.isFavorite ? 'fill-danger text-danger' : 'text-mut'} />
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <RecipeSheet recipe={selected} onClose={() => setSelected(null)} />
    </main>
  );
}

function RecipeSheet({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const addEntry = useAppStore((s) => s.addEntry);
  const addRecipe = useAppStore((s) => s.addRecipe);
  const deleteRecipe = useAppStore((s) => s.deleteRecipe);
  const [servings, setServings] = useState('1');
  const [meal, setMeal] = useState<MealSlot>(suggestMeal());

  if (!recipe) return null;
  const calc = calcRecipe(recipe);
  const parsedServings = Number.parseFloat(servings.replace(',', '.'));
  const validServings = Number.isFinite(parsedServings) && parsedServings > 0;

  return (
    <Sheet open onClose={onClose} title={recipe.name}>
      <div className="space-y-4">
        {recipe.description && <p className="text-sm text-body">{recipe.description}</p>}

        <div className="rounded-xl bg-brand-soft px-4 py-3">
          <p className="text-lg font-extrabold text-brand-ink">
            {calc.pointsPerServing} Punkte pro Portion
          </p>
          <p className="text-xs text-brand-ink/80">
            {fmt(calc.perServingNutrients.calories, 0)} kcal ·{' '}
            {fmt(calc.perServingNutrients.protein)} g Eiweiß ·{' '}
            {fmt(calc.perServingNutrients.carbs)} g KH ·{' '}
            {fmt(calc.perServingNutrients.fat)} g Fett
            {' '}· gesamt {calc.totalPoints} P ({recipe.servings} Portionen)
          </p>
        </div>

        <div>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-mut">Zutaten</h3>
          <ul className="space-y-1 text-sm text-body">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="flex justify-between">
                <span>{ing.name}</span>
                <span className="text-mut">{fmt(ing.grams, 0)} g</span>
              </li>
            ))}
          </ul>
        </div>

        {recipe.instructions && (
          <div>
            <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-mut">Zubereitung</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-body">{recipe.instructions}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Portionen" htmlFor="r-servings">
            <Input id="r-servings" inputMode="decimal" value={servings} onChange={(e) => setServings(e.target.value)} />
          </Field>
          <Field label="Mahlzeit" htmlFor="r-meal">
            <Select id="r-meal" value={meal} onChange={(e) => setMeal(e.target.value as MealSlot)}>
              {MEAL_SLOTS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </Select>
          </Field>
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={!validServings}
          onClick={() => {
            addEntry(entryFromRecipe(recipe, parsedServings, toDateKey(new Date()), meal));
            onClose();
          }}
        >
          Zum Tagebuch hinzufügen
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const nowIso = new Date().toISOString();
              addRecipe({
                ...recipe,
                id: crypto.randomUUID(),
                name: `${recipe.name} (Kopie)`,
                isFavorite: false,
                createdAt: nowIso,
                updatedAt: nowIso,
                ingredients: recipe.ingredients.map((i) => ({ ...i, id: crypto.randomUUID() })),
              });
              onClose();
            }}
          >
            Duplizieren
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteRecipe(recipe.id);
              onClose();
            }}
          >
            Löschen
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
