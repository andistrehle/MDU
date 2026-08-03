'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { AI_ESTIMATE_DISCLAIMER } from '@/lib/app-config';
import type { MealAnalysisResult } from '@/lib/vision/types';
import type { Food, MealSlot } from '@/lib/food/types';
import { MEAL_SLOTS } from '@/lib/food/types';
import { matchFoodByName } from '@/lib/food/match';
import { searchSeedFoods } from '@/lib/food/seed-foods';
import { computeFoodPoints } from '@/lib/points/engine';
import { entryFromFood } from '@/lib/diary/entry-factory';
import { toDateKey } from '@/lib/diary/summary';
import { useAppStore } from '@/lib/store/app-store';
import { fmt } from '@/lib/utils';
import { PhotoPicker } from '@/components/photo-picker';
import { suggestMeal } from '@/components/add-food-sheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';

/**
 * Fotoscan einer Mahlzeit:
 * Foto → serverseitige Analyse → Bestätigungsseite (Bestandteile prüfen,
 * Mengen ändern, Zuordnungen korrigieren) → erst dann ins Tagebuch.
 */

interface ReviewItem {
  key: string;
  name: string;
  grams: number;
  confidence: number;
  preparation: string | null;
  hidden: string[];
  food: Food | null; // zugeordnetes Lebensmittel (Nährwertquelle)
}

export default function PhotoScanPage() {
  const router = useRouter();
  const addEntry = useAppStore((s) => s.addEntry);
  const customFoods = useAppStore((s) => s.customFoods);
  const keepPhotos = useAppStore((s) => s.settings.keepPhotosAfterAnalysis);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MealAnalysisResult | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [meal, setMeal] = useState<MealSlot>(suggestMeal());
  const [assigning, setAssigning] = useState<string | null>(null); // item key

  const analyze = async (img: { base64: string; mimeType: string }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/vision/analyze-meal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analyse fehlgeschlagen.');
      const analysis = data as MealAnalysisResult;
      setResult(analysis);
      setItems(
        analysis.items.map((it, i) => ({
          key: `${i}-${it.name}`,
          name: it.name,
          grams: it.estimatedGrams,
          confidence: it.confidence,
          preparation: it.preparation,
          hidden: it.possibleHiddenIngredients,
          food: matchFoodByName(it.name, customFoods),
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const totalPoints = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (!it.food || it.grams <= 0) return sum;
        return sum + computeFoodPoints(
          { nutrientsPer100: it.food.nutrientsPer100, category: it.food.category, isZeroPointFood: it.food.isZeroPointFood },
          it.grams,
        ).total;
      }, 0),
    [items],
  );

  const unmatchedCount = items.filter((it) => !it.food).length;

  const confirm = () => {
    const today = toDateKey(new Date());
    for (const it of items) {
      if (!it.food || it.grams <= 0) continue;
      const entry = entryFromFood(it.food, it.grams, today, meal);
      addEntry({ ...entry, name: it.name, source: 'photo-ai' });
    }
    router.push('/');
  };

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Mahlzeit fotografieren</h1>

      {!result && (
        <>
          <PhotoPicker onImage={analyze} busy={busy} />
          {busy && (
            <Card className="space-y-2">
              <p className="text-sm font-semibold text-body">Foto wird analysiert …</p>
              <div className="fp-skeleton h-4 w-3/4" />
              <div className="fp-skeleton h-4 w-1/2" />
            </Card>
          )}
          {error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}
          <p className="text-[11px] leading-relaxed text-mut">
            {AI_ESTIMATE_DISCLAIMER}{' '}
            {keepPhotos
              ? 'Fotos werden nach der Analyse gespeichert (änderbar im Profil).'
              : 'Das Foto wird nur für die Analyse verwendet und danach verworfen.'}
          </p>
        </>
      )}

      {result && (
        <>
          <Card className="space-y-1">
            <p className="text-sm font-bold text-ink">{result.mealName}</p>
            <p className="text-xs text-mut">
              Gesamtvertrauen: {Math.round(result.confidence * 100)} %
              {result.provider === 'mock' && ' · Demo-Analyse'}
            </p>
            {result.warnings.map((w) => (
              <p key={w} className="flex items-start gap-1.5 text-xs text-body">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-accent" aria-hidden /> {w}
              </p>
            ))}
          </Card>

          <section className="space-y-2" aria-label="Erkannte Bestandteile">
            {items.map((it) => (
              <Card key={it.key} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{it.name}</p>
                    <p className="text-xs text-mut">
                      {it.preparation && `${it.preparation} · `}
                      Vertrauen: {Math.round(it.confidence * 100)} %
                      {it.confidence < 0.6 && (
                        <span className="ml-1 rounded bg-accent-soft px-1.5 py-0.5 font-bold text-accent">unsicher</span>
                      )}
                    </p>
                    {it.hidden.length > 0 && (
                      <p className="text-xs text-mut">Möglich enthalten: {it.hidden.join(', ')}</p>
                    )}
                  </div>
                  <button
                    aria-label={`${it.name} entfernen`}
                    className="p-1.5 text-mut hover:text-danger"
                    onClick={() => setItems(items.filter((x) => x.key !== it.key))}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <div className="flex items-end gap-3">
                  <div className="w-28">
                    <Field label="Menge (g)" htmlFor={`grams-${it.key}`}>
                      <Input
                        id={`grams-${it.key}`}
                        inputMode="decimal"
                        value={it.grams}
                        onChange={(e) => {
                          const v = Number.parseFloat(e.target.value.replace(',', '.'));
                          setItems(items.map((x) => (x.key === it.key ? { ...x, grams: Number.isFinite(v) ? v : 0 } : x)));
                        }}
                      />
                    </Field>
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    {it.food ? (
                      <p className="truncate text-xs text-body">
                        Nährwerte: <strong>{it.food.name}</strong> ·{' '}
                        {computeFoodPoints(
                          { nutrientsPer100: it.food.nutrientsPer100, category: it.food.category, isZeroPointFood: it.food.isZeroPointFood },
                          it.grams,
                        ).total} P
                      </p>
                    ) : (
                      <p className="text-xs font-semibold text-danger">
                        Keine Zuordnung — wird nicht übernommen.
                      </p>
                    )}
                    <button
                      className="text-xs font-semibold text-brand-ink hover:underline"
                      onClick={() => setAssigning(it.key)}
                    >
                      Zuordnung ändern
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </section>

          <Card className="space-y-3">
            <Field label="Mahlzeit" htmlFor="scan-meal">
              <Select id="scan-meal" value={meal} onChange={(e) => setMeal(e.target.value as MealSlot)}>
                {MEAL_SLOTS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-center justify-between">
              <p className="text-sm text-body">
                Gesamt: <strong className="text-brand-ink">{totalPoints} Punkte</strong>
                {unmatchedCount > 0 && (
                  <span className="block text-xs text-mut">
                    {unmatchedCount} Bestandteil{unmatchedCount > 1 ? 'e' : ''} ohne Zuordnung
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setResult(null); setItems([]); }}>
                  Verwerfen
                </Button>
                <Button onClick={confirm} disabled={items.every((it) => !it.food)}>
                  Bestätigen
                </Button>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-mut">{AI_ESTIMATE_DISCLAIMER}</p>
          </Card>
        </>
      )}

      <AssignSheet
        open={assigning !== null}
        initialQuery={items.find((i) => i.key === assigning)?.name ?? ''}
        customFoods={customFoods}
        onClose={() => setAssigning(null)}
        onPick={(food) => {
          setItems(items.map((x) => (x.key === assigning ? { ...x, food } : x)));
          setAssigning(null);
        }}
      />
    </main>
  );
}

/** Kleine Suche zum manuellen Zuordnen eines erkannten Bestandteils. */
function AssignSheet({
  open,
  initialQuery,
  customFoods,
  onClose,
  onPick,
}: {
  open: boolean;
  initialQuery: string;
  customFoods: Food[];
  onClose: () => void;
  onPick: (food: Food) => void;
}) {
  const [query, setQuery] = useState('');
  const q = query || initialQuery.split(/[\s,(]/)[0] || '';
  const results = useMemo(() => {
    const own = customFoods.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));
    return [...own, ...searchSeedFoods(q, 12)];
  }, [q, customFoods]);

  if (!open) return null;
  return (
    <Sheet open={open} onClose={onClose} title="Lebensmittel zuordnen">
      <div className="space-y-3">
        <Input
          autoFocus
          placeholder="Suchen …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Lebensmittel zum Zuordnen suchen"
        />
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {results.map((food) => (
            <li key={food.id}>
              <button
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-inset"
                onClick={() => onPick(food)}
              >
                <span className="min-w-0 truncate text-sm text-ink">{food.name}</span>
                <span className="ml-2 shrink-0 text-xs text-mut">
                  {fmt(food.nutrientsPer100.calories, 0)} kcal/100
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && <p className="px-3 py-2 text-sm text-mut">Keine Treffer.</p>}
        </ul>
      </div>
    </Sheet>
  );
}
