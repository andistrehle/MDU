'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import type { Food, Recipe, RecipeIngredient } from '@/lib/food/types';
import { searchSeedFoods } from '@/lib/food/seed-foods';
import { calcRecipe } from '@/lib/recipes/calc';
import { useAppStore } from '@/lib/store/app-store';
import { fmt } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';

export default function NewRecipePage() {
  const router = useRouter();
  const addRecipe = useAppStore((s) => s.addRecipe);
  const customFoods = useAppStore((s) => s.customFoods);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [instructions, setInstructions] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const own = customFoods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
    return [...own, ...searchSeedFoods(query, 8)].slice(0, 8);
  }, [query, customFoods]);

  const parsedServings = Math.max(1, Number.parseInt(servings, 10) || 1);
  const calc = calcRecipe({ ingredients, servings: parsedServings });

  const addIngredient = (food: Food) => {
    setIngredients([
      ...ingredients,
      {
        id: crypto.randomUUID(),
        foodId: food.id,
        name: food.name,
        grams: food.defaultPortionGrams,
        nutrientsPer100: food.nutrientsPer100,
      },
    ]);
    setQuery('');
  };

  const save = () => {
    if (!name.trim() || ingredients.length === 0) return;
    const nowIso = new Date().toISOString();
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      servings: parsedServings,
      instructions: instructions.trim(),
      ingredients,
      photoUrl: null,
      isFavorite: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    addRecipe(recipe);
    router.push('/rezepte');
  };

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Neues Rezept</h1>

      <Card className="space-y-3">
        <Field label="Name *" htmlFor="rname">
          <Input id="rname" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Beschreibung" htmlFor="rdesc">
          <Input id="rdesc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Portionen *" htmlFor="rserv">
          <Input id="rserv" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} />
        </Field>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-bold text-ink">Zutaten</h2>
        <div className="relative">
          <Input
            placeholder="Zutat suchen …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Zutat suchen"
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-12 z-10 max-h-56 overflow-y-auto rounded-xl border border-line bg-card shadow-lg">
              {results.map((f) => (
                <li key={f.id}>
                  <button
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-inset"
                    onClick={() => addIngredient(f)}
                  >
                    <span className="min-w-0 truncate text-ink">{f.name}</span>
                    <span className="ml-2 shrink-0 text-xs text-mut">{fmt(f.nutrientsPer100.calories, 0)} kcal/100</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {ingredients.length === 0 ? (
          <p className="text-sm text-mut">Noch keine Zutaten — suche oben nach Lebensmitteln.</p>
        ) : (
          <ul className="space-y-2">
            {ingredients.map((ing) => (
              <li key={ing.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-body">{ing.name}</span>
                <Input
                  inputMode="decimal"
                  value={ing.grams}
                  onChange={(e) => {
                    const v = Number.parseFloat(e.target.value.replace(',', '.'));
                    setIngredients(ingredients.map((x) =>
                      x.id === ing.id ? { ...x, grams: Number.isFinite(v) && v > 0 ? v : 0 } : x,
                    ));
                  }}
                  className="w-24"
                  aria-label={`Menge für ${ing.name} in Gramm`}
                />
                <span className="text-xs text-mut">g</span>
                <button
                  aria-label={`${ing.name} entfernen`}
                  onClick={() => setIngredients(ingredients.filter((x) => x.id !== ing.id))}
                  className="p-1.5 text-mut hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <Field label="Zubereitung" htmlFor="rinstr">
          <Textarea id="rinstr" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </Field>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-mut">Pro Portion ({parsedServings} gesamt)</p>
          <p className="text-2xl font-extrabold text-brand-ink">{calc.pointsPerServing} Punkte</p>
          <p className="text-xs text-mut">
            {fmt(calc.perServingNutrients.calories, 0)} kcal · gesamt {calc.totalPoints} P
          </p>
        </div>
        <Button size="lg" onClick={save} disabled={!name.trim() || ingredients.length === 0}>
          Speichern
        </Button>
      </Card>
    </main>
  );
}
