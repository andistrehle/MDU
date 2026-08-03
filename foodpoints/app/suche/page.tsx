'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Star } from 'lucide-react';
import type { Food, MealSlot } from '@/lib/food/types';
import { FOOD_SOURCE_LABELS } from '@/lib/food/types';
import { searchSeedFoods } from '@/lib/food/seed-foods';
import { computeFoodPoints } from '@/lib/points/engine';
import { useAppStore } from '@/lib/store/app-store';
import { fmt } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AddFoodSheet } from '@/components/add-food-sheet';

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="p-4"><div className="fp-skeleton h-11 w-full" /></main>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const params = useSearchParams();
  const meal = (params.get('meal') as MealSlot | null) ?? undefined;
  const customFoods = useAppStore((s) => s.customFoods);
  const favorites = useAppStore((s) => s.favoriteFoodIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const [query, setQuery] = useState('');
  const [external, setExternal] = useState<Food[]>([]);
  const [externalState, setExternalState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [selected, setSelected] = useState<Food | null>(null);

  // Lokale Treffer sofort (eigene + Seed-Datenbank)
  const local = useMemo(() => {
    const q = query.trim().toLowerCase();
    const own = customFoods.filter(
      (f) => !q || f.name.toLowerCase().includes(q) || (f.brand ?? '').toLowerCase().includes(q),
    );
    return [...own, ...searchSeedFoods(query, 15)];
  }, [query, customFoods]);

  // Externe Suche mit Debounce
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setExternal([]);
      setExternalState('idle');
      return;
    }
    setExternalState('loading');
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as { external: Food[]; externalError: boolean };
        setExternal(data.external);
        setExternalState(data.externalError ? 'error' : 'done');
      } catch {
        setExternal([]);
        setExternalState('error');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const sortedLocal = useMemo(
    () => [...local].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id))),
    [local, favorites],
  );

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Lebensmittel suchen</h1>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" aria-hidden />
        <Input
          autoFocus
          placeholder="z. B. Apfel, Haferflocken, Joghurt …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          aria-label="Lebensmittel suchen"
        />
      </div>

      <FoodList
        title="Deine Lebensmittel & Datenbank"
        foods={sortedLocal}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSelect={setSelected}
        emptyText="Keine lokalen Treffer."
      />

      {externalState === 'loading' && (
        <div className="space-y-2">
          <div className="fp-skeleton h-14 w-full" />
          <div className="fp-skeleton h-14 w-full" />
        </div>
      )}
      {externalState === 'error' && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
          Externe Suche gerade nicht erreichbar — lokale Ergebnisse werden angezeigt.
        </p>
      )}
      {externalState === 'done' && external.length > 0 && (
        <FoodList
          title="Open Food Facts (Werte bitte prüfen)"
          foods={external}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onSelect={setSelected}
          emptyText=""
        />
      )}

      <Card className="text-center">
        <p className="text-sm text-body">Nichts gefunden?</p>
        <Link href="/lebensmittel/neu" className="text-sm font-bold text-brand-ink hover:underline">
          Eigenes Lebensmittel anlegen
        </Link>
      </Card>

      <AddFoodSheet
        food={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        defaultMeal={meal}
      />
    </main>
  );
}

function FoodList({
  title,
  foods,
  favorites,
  onToggleFavorite,
  onSelect,
  emptyText,
}: {
  title: string;
  foods: Food[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onSelect: (f: Food) => void;
  emptyText: string;
}) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-mut">{title}</h2>
      {foods.length === 0 ? (
        emptyText && <p className="text-sm text-mut">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {foods.map((food) => {
            const points = computeFoodPoints(
              { nutrientsPer100: food.nutrientsPer100, category: food.category, isZeroPointFood: food.isZeroPointFood },
              food.defaultPortionGrams,
            );
            return (
              <li key={food.id}>
                <div className="flex w-full items-center gap-2 rounded-2xl border border-line-soft bg-card p-3">
                  <button className="min-w-0 flex-1 text-left" onClick={() => onSelect(food)}>
                    <p className="truncate text-sm font-semibold text-ink">{food.name}</p>
                    <p className="truncate text-xs text-mut">
                      {food.brand ? `${food.brand} · ` : ''}
                      {fmt(food.defaultPortionGrams, 0)} {food.isLiquid ? 'ml' : 'g'} ·{' '}
                      {fmt((food.nutrientsPer100.calories * food.defaultPortionGrams) / 100, 0)} kcal
                      {food.source !== 'seed' && ` · ${FOOD_SOURCE_LABELS[food.source]}`}
                    </p>
                  </button>
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-extrabold text-brand-ink">
                    {points.total} P
                  </span>
                  <button
                    aria-label={favorites.includes(food.id) ? 'Favorit entfernen' : 'Als Favorit markieren'}
                    aria-pressed={favorites.includes(food.id)}
                    onClick={() => onToggleFavorite(food.id)}
                    className="shrink-0 p-1.5 text-mut"
                  >
                    <Star
                      size={18}
                      className={favorites.includes(food.id) ? 'fill-accent text-accent' : ''}
                    />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
