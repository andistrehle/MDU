'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { Food } from '@/lib/food/types';
import { FOOD_CATEGORIES, isZeroPointEligibleCategory, type FoodCategoryId } from '@/lib/points/config';
import { parseDecimal, validateNutrients } from '@/lib/nutrition/normalize';
import type { Nutrients } from '@/lib/nutrition/types';
import { computeFoodPoints } from '@/lib/points/engine';
import { useAppStore } from '@/lib/store/app-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';

/**
 * Eigenes Lebensmittel anlegen. Nährwert-Felder akzeptieren Dezimalkomma
 * und -punkt; fehlende Werte bleiben leer (werden als 0 gespeichert, aber
 * nur nach expliziter Bestätigung durch den Nutzer).
 */

interface FormValues {
  name: string;
  brand: string;
  barcode: string;
  category: FoodCategoryId;
  isLiquid: boolean;
  isZeroPointFood: boolean;
  defaultPortion: string;
  calories: string;
  fat: string;
  saturatedFat: string;
  carbs: string;
  sugar: string;
  fiber: string;
  protein: string;
  salt: string;
}

export default function NewFoodPage() {
  return (
    <Suspense fallback={null}>
      <NewFoodForm />
    </Suspense>
  );
}

function NewFoodForm() {
  const router = useRouter();
  const params = useSearchParams();
  const addCustomFood = useAppStore((s) => s.addCustomFood);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: params.get('name') ?? '',
      brand: '',
      barcode: params.get('barcode') ?? '',
      category: 'other',
      isLiquid: false,
      isZeroPointFood: false,
      defaultPortion: '100',
      calories: '', fat: '', saturatedFat: '', carbs: '', sugar: '', fiber: '', protein: '', salt: '',
    },
  });

  const values = watch();
  const zeroPointAllowed = isZeroPointEligibleCategory(values.category);

  const per100: Nutrients = useMemo(() => ({
    calories: parseDecimal(values.calories) ?? 0,
    fat: parseDecimal(values.fat) ?? 0,
    saturatedFat: parseDecimal(values.saturatedFat) ?? 0,
    carbs: parseDecimal(values.carbs) ?? 0,
    sugar: parseDecimal(values.sugar) ?? 0,
    fiber: parseDecimal(values.fiber) ?? 0,
    protein: parseDecimal(values.protein) ?? 0,
    salt: parseDecimal(values.salt) ?? 0,
  }), [values]);

  const warnings = useMemo(() => validateNutrients(per100), [per100]);

  const preview = computeFoodPoints(
    {
      nutrientsPer100: per100,
      category: values.category,
      isZeroPointFood: values.isZeroPointFood && zeroPointAllowed,
    },
    parseDecimal(values.defaultPortion) ?? 100,
  );

  const onSubmit = (data: FormValues) => {
    const nowIso = new Date().toISOString();
    const food: Food = {
      id: crypto.randomUUID(),
      name: data.name.trim(),
      brand: data.brand.trim() || null,
      barcode: data.barcode.trim() || null,
      category: data.category,
      nutrientsPer100: per100,
      isLiquid: data.isLiquid,
      isZeroPointFood: data.isZeroPointFood && zeroPointAllowed,
      defaultPortionGrams: parseDecimal(data.defaultPortion) ?? 100,
      portions: [],
      source: 'user',
      confidence: 1,
      warnings: [],
      createdAt: nowIso,
      updatedAt: nowIso,
      isPrivate: true,
    };
    addCustomFood(food);
    setSaved(true);
    router.push(`/suche?q=${encodeURIComponent(food.name)}`);
  };

  const nutrientField = (key: keyof FormValues, label: string, hint?: string) => (
    <Field label={label} htmlFor={key} hint={hint}>
      <Input
        id={key}
        inputMode="decimal"
        placeholder="z. B. 12,5"
        {...register(key)}
      />
    </Field>
  );

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Eigenes Lebensmittel</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="space-y-3">
          <Field label="Name *" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register('name', { required: 'Bitte gib einen Namen an.' })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marke" htmlFor="brand">
              <Input id="brand" {...register('brand')} />
            </Field>
            <Field label="Barcode" htmlFor="barcode">
              <Input id="barcode" inputMode="numeric" {...register('barcode')} />
            </Field>
          </div>
          <Field label="Kategorie" htmlFor="category">
            <Select id="category" {...register('category')}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-body">
              <input type="checkbox" className="h-4 w-4 accent-[var(--fp-brand)]" {...register('isLiquid')} />
              Flüssigkeit (Angaben pro 100 ml)
            </label>
            <label className={`flex items-center gap-2 text-sm ${zeroPointAllowed ? 'text-body' : 'text-mut'}`}>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--fp-brand)]"
                disabled={!zeroPointAllowed}
                {...register('isZeroPointFood')}
              />
              0-Punkte-Basislebensmittel
            </label>
            {!zeroPointAllowed && (
              <p className="text-xs text-mut">
                Die 0-Punkte-Regel gilt nur für unverarbeitete Basislebensmittel
                (Gemüse, Obst, mageres Eiweiß, Hülsenfrüchte, Eier).
              </p>
            )}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-bold text-ink">
            Nährwerte pro 100 {values.isLiquid ? 'ml' : 'g'}
          </h2>
          {nutrientField('calories', 'Kalorien (kcal) *')}
          <div className="grid grid-cols-2 gap-3">
            {nutrientField('fat', 'Fett (g)')}
            {nutrientField('saturatedFat', 'davon gesättigt (g)')}
            {nutrientField('carbs', 'Kohlenhydrate (g)')}
            {nutrientField('sugar', 'davon Zucker (g)')}
            {nutrientField('fiber', 'Ballaststoffe (g)')}
            {nutrientField('protein', 'Eiweiß (g)')}
          </div>
          {nutrientField('salt', 'Salz (g)')}
          <Field label={`Standardportion (${values.isLiquid ? 'ml' : 'g'})`} htmlFor="defaultPortion">
            <Input id="defaultPortion" inputMode="decimal" {...register('defaultPortion')} />
          </Field>
        </Card>

        {warnings.length > 0 && (
          <div className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
            {warnings.map((w) => <p key={w}>{w}</p>)}
          </div>
        )}

        <Card className="flex items-center justify-between">
          <div>
            <p className="text-sm text-mut">Vorschau pro Portion</p>
            <p className="text-2xl font-extrabold text-brand-ink">
              {preview.total} {preview.total === 1 ? 'Punkt' : 'Punkte'}
            </p>
          </div>
          <Button type="submit" size="lg" disabled={saved}>
            Speichern
          </Button>
        </Card>
      </form>
    </main>
  );
}
