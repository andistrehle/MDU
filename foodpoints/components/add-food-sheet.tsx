'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Food, MealSlot } from '@/lib/food/types';
import { FOOD_SOURCE_LABELS, MEAL_SLOTS } from '@/lib/food/types';
import { computeFoodPoints } from '@/lib/points/engine';
import { entryFromFood } from '@/lib/diary/entry-factory';
import { toDateKey } from '@/lib/diary/summary';
import { useAppStore } from '@/lib/store/app-store';
import { fmt, fmtAmount } from '@/lib/utils';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input, Field, Select } from '@/components/ui/input';

/**
 * Bottom-Sheet: Portion wählen und Lebensmittel zum Tagebuch hinzufügen.
 * Punkte werden live proportional zur Menge aktualisiert; externe Quellen
 * werden angezeigt und müssen bestätigt werden.
 */
export function AddFoodSheet({
  food,
  open,
  onClose,
  defaultDate,
  defaultMeal,
  onAdded,
}: {
  food: Food | null;
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
  defaultMeal?: MealSlot;
  onAdded?: () => void;
}) {
  const router = useRouter();
  const addEntry = useAppStore((s) => s.addEntry);
  const [grams, setGrams] = useState<number | null>(null);
  const [meal, setMeal] = useState<MealSlot | null>(null);
  const [date, setDate] = useState<string | null>(null);

  const effGrams = grams ?? food?.defaultPortionGrams ?? 100;
  const effMeal = meal ?? defaultMeal ?? suggestMeal();
  const effDate = date ?? defaultDate ?? toDateKey(new Date());

  const points = useMemo(() => {
    if (!food) return null;
    return computeFoodPoints(
      { nutrientsPer100: food.nutrientsPer100, category: food.category, isZeroPointFood: food.isZeroPointFood },
      effGrams,
    );
  }, [food, effGrams]);

  if (!food) return null;

  const kcal = (food.nutrientsPer100.calories * effGrams) / 100;
  const isExternal = food.source === 'openfoodfacts' || food.source === 'photo-ai' || food.source === 'label-scan';

  const submit = () => {
    addEntry(entryFromFood(food, effGrams, effDate, effMeal));
    setGrams(null);
    setMeal(null);
    setDate(null);
    onClose();
    if (onAdded) onAdded();
    else router.push('/');
  };

  return (
    <Sheet open={open} onClose={onClose} title={food.name}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl bg-brand-soft px-4 py-3">
          <div>
            <p className="text-2xl font-extrabold text-brand-ink">
              {points?.total ?? 0} {points?.total === 1 ? 'Punkt' : 'Punkte'}
            </p>
            <p className="text-xs text-brand-ink/80">
              {fmt(kcal, 0)} kcal · {fmtAmount(effGrams, food.isLiquid)}
              {points?.zeroPointApplied && ' · 0-Punkte-Lebensmittel'}
            </p>
          </div>
          {food.brand && <span className="text-xs text-mut">{food.brand}</span>}
        </div>

        {isExternal && (
          <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
            Quelle: {FOOD_SOURCE_LABELS[food.source]}
            {food.confidence < 0.7 && ' · niedriger Vertrauenswert'} — bitte Werte prüfen.
            {food.warnings.map((w) => (
              <span key={w} className="block">{w}</span>
            ))}
          </p>
        )}

        <Field label={`Menge (${food.isLiquid ? 'ml' : 'g'})`} htmlFor="add-grams">
          <Input
            id="add-grams"
            type="number"
            inputMode="decimal"
            min={1}
            value={effGrams}
            onChange={(e) => {
              const v = Number.parseFloat(e.target.value);
              setGrams(Number.isFinite(v) && v > 0 ? v : null);
            }}
          />
        </Field>

        {(food.portions.length > 0 || food.defaultPortionGrams !== 100) && (
          <div className="flex flex-wrap gap-2">
            {[{ id: 'default', label: `Standard (${fmtAmount(food.defaultPortionGrams, food.isLiquid)})`, grams: food.defaultPortionGrams },
              ...food.portions,
              { id: 'p100', label: food.isLiquid ? '100 ml' : '100 g', grams: 100 }].map((p) => (
              <button
                key={p.id}
                onClick={() => setGrams(p.grams)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  effGrams === p.grams
                    ? 'border-brand bg-brand-soft text-brand-ink'
                    : 'border-line bg-card text-body hover:bg-card2'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mahlzeit" htmlFor="add-meal">
            <Select id="add-meal" value={effMeal} onChange={(e) => setMeal(e.target.value as MealSlot)}>
              {MEAL_SLOTS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Datum" htmlFor="add-date">
            <Input id="add-date" type="date" value={effDate} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center text-xs text-mut">
          <div><p className="font-bold text-ink">{fmt((food.nutrientsPer100.protein * effGrams) / 100)} g</p>Eiweiß</div>
          <div><p className="font-bold text-ink">{fmt((food.nutrientsPer100.carbs * effGrams) / 100)} g</p>Kohlenh.</div>
          <div><p className="font-bold text-ink">{fmt((food.nutrientsPer100.fat * effGrams) / 100)} g</p>Fett</div>
          <div><p className="font-bold text-ink">{fmt((food.nutrientsPer100.fiber * effGrams) / 100)} g</p>Ballastst.</div>
        </div>

        <Button size="lg" className="w-full" onClick={submit}>
          Zum Tagebuch hinzufügen
        </Button>
      </div>
    </Sheet>
  );
}

/** Schlägt die Mahlzeit anhand der Uhrzeit vor. */
export function suggestMeal(): MealSlot {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 17) return 'snacks';
  return 'dinner';
}
