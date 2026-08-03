'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AI_ESTIMATE_DISCLAIMER } from '@/lib/app-config';
import type { LabelAnalysisResult } from '@/lib/vision/types';
import type { Food } from '@/lib/food/types';
import type { NutritionBasis } from '@/lib/nutrition/types';
import { normalizeLabel, parseDecimal, validateNutrients, type RawLabelValues } from '@/lib/nutrition/normalize';
import { computeFoodPoints } from '@/lib/points/engine';
import { useAppStore } from '@/lib/store/app-store';
import { fmt } from '@/lib/utils';
import { PhotoPicker } from '@/components/photo-picker';
import { AddFoodSheet } from '@/components/add-food-sheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';

/**
 * Nährwerttabellen-Scan:
 * Foto → serverseitige Analyse → Korrekturmaske (Basis, Portion, alle Werte
 * editierbar; unsichere Felder markiert) → Normalisierung auf 100 g →
 * privates Lebensmittel speichern und optional direkt eintragen.
 */

type ValueKey = Exclude<keyof RawLabelValues, never>;

const VALUE_FIELDS: { key: ValueKey; label: string }[] = [
  { key: 'energyKcal', label: 'Kalorien (kcal)' },
  { key: 'energyKj', label: 'Energie (kJ)' },
  { key: 'fat', label: 'Fett (g)' },
  { key: 'saturatedFat', label: 'davon gesättigt (g)' },
  { key: 'carbs', label: 'Kohlenhydrate (g)' },
  { key: 'sugar', label: 'davon Zucker (g)' },
  { key: 'fiber', label: 'Ballaststoffe (g)' },
  { key: 'protein', label: 'Eiweiß (g)' },
  { key: 'salt', label: 'Salz (g)' },
];

export default function LabelScanPage() {
  return (
    <Suspense fallback={null}>
      <LabelScanContent />
    </Suspense>
  );
}

function LabelScanContent() {
  const params = useSearchParams();
  const barcodeFromScan = params.get('barcode');
  const addCustomFood = useAppStore((s) => s.addCustomFood);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<LabelAnalysisResult | null>(null);

  // Korrekturmaske (Strings, um Dezimalkomma zuzulassen)
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [basis, setBasis] = useState<NutritionBasis>('per100g');
  const [portion, setPortion] = useState('');
  const [values, setValues] = useState<Record<ValueKey, string>>(
    Object.fromEntries(VALUE_FIELDS.map((f) => [f.key, ''])) as Record<ValueKey, string>,
  );
  const [savedFood, setSavedFood] = useState<Food | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const analyze = async (img: { base64: string; mimeType: string }) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/vision/analyze-label', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageBase64: img.base64, mimeType: img.mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analyse fehlgeschlagen.');
      const result = data as LabelAnalysisResult;
      setScan(result);
      setName(result.productName ?? '');
      setBrand(result.brand ?? '');
      setBasis(result.basis);
      setPortion(result.portionGrams ? String(result.portionGrams) : '');
      setValues(
        Object.fromEntries(
          VALUE_FIELDS.map((f) => {
            const v = result.values[f.key];
            return [f.key, v === null || v === undefined ? '' : String(v).replace('.', ',')];
          }),
        ) as Record<ValueKey, string>,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analyse fehlgeschlagen.');
    } finally {
      setBusy(false);
    }
  };

  const raw: RawLabelValues = useMemo(
    () =>
      Object.fromEntries(
        VALUE_FIELDS.map((f) => [f.key, parseDecimal(values[f.key])]),
      ) as RawLabelValues,
    [values],
  );

  const normalized = useMemo(() => {
    try {
      return normalizeLabel(raw, basis, parseDecimal(portion));
    } catch {
      return null;
    }
  }, [raw, basis, portion]);

  const warnings = useMemo(
    () => (normalized ? validateNutrients(normalized.per100) : []),
    [normalized],
  );

  const previewPoints = normalized
    ? computeFoodPoints(
        { nutrientsPer100: normalized.per100, category: 'prepared', isZeroPointFood: false },
        parseDecimal(portion) ?? 100,
      )
    : null;

  const save = () => {
    if (!normalized || !name.trim()) return;
    const nowIso = new Date().toISOString();
    const portionGrams = parseDecimal(portion);
    const food: Food = {
      id: crypto.randomUUID(),
      name: name.trim(),
      brand: brand.trim() || null,
      barcode: barcodeFromScan ?? scan?.barcode ?? null,
      category: 'prepared',
      nutrientsPer100: normalized.per100,
      isLiquid: basis === 'per100ml',
      isZeroPointFood: false,
      defaultPortionGrams: portionGrams ?? 100,
      portions: portionGrams ? [{ id: 'label-portion', label: `1 Portion (${fmt(portionGrams, 0)} g)`, grams: portionGrams }] : [],
      source: 'label-scan',
      confidence: scan && scan.uncertainFields.length > 0 ? 0.6 : 0.8,
      warnings: normalized.missing.length > 0
        ? [`Nicht erkannt: ${normalized.missing.join(', ')} — als 0 gespeichert.`]
        : [],
      createdAt: nowIso,
      updatedAt: nowIso,
      isPrivate: true,
    };
    addCustomFood(food);
    setSavedFood(food);
    setSheetOpen(true);
  };

  return (
    <main className="space-y-4 p-4">
      <h1 className="text-xl font-extrabold text-ink">Nährwerttabelle scannen</h1>
      {barcodeFromScan && (
        <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs text-brand-ink">
          Barcode {barcodeFromScan} wird mit dem neuen Produkt verknüpft.
        </p>
      )}

      {!scan && (
        <>
          <PhotoPicker onImage={analyze} busy={busy} label="Etikett fotografieren" />
          {busy && (
            <Card className="space-y-2">
              <p className="text-sm font-semibold text-body">Etikett wird ausgelesen …</p>
              <div className="fp-skeleton h-4 w-3/4" />
              <div className="fp-skeleton h-4 w-1/2" />
            </Card>
          )}
          {error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>
          )}
          <p className="text-[11px] leading-relaxed text-mut">{AI_ESTIMATE_DISCLAIMER}</p>
        </>
      )}

      {scan && (
        <>
          {scan.warnings.length > 0 && (
            <div className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
              {scan.warnings.map((w) => <p key={w}>{w}</p>)}
            </div>
          )}
          {normalized?.kcalDerivedFromKj && (
            <p className="rounded-xl bg-brand-soft px-3 py-2 text-xs text-brand-ink">
              Kalorien wurden aus der kJ-Angabe umgerechnet (÷ 4,184).
            </p>
          )}

          <Card className="space-y-3">
            <Field label="Produktname *" htmlFor="label-name">
              <Input id="label-name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Marke" htmlFor="label-brand">
              <Input id="label-brand" value={brand} onChange={(e) => setBrand(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Angaben beziehen sich auf" htmlFor="label-basis">
                <Select id="label-basis" value={basis} onChange={(e) => setBasis(e.target.value as NutritionBasis)}>
                  <option value="per100g">100 g</option>
                  <option value="per100ml">100 ml</option>
                  <option value="perPortion">1 Portion</option>
                </Select>
              </Field>
              <Field
                label="Portionsgröße (g/ml)"
                htmlFor="label-portion"
                error={basis === 'perPortion' && !parseDecimal(portion) ? 'Bei Portionsangaben erforderlich.' : undefined}
              >
                <Input id="label-portion" inputMode="decimal" value={portion} onChange={(e) => setPortion(e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card className="space-y-3">
            <h2 className="text-sm font-bold text-ink">Erkannte Werte — bitte prüfen</h2>
            <div className="grid grid-cols-2 gap-3">
              {VALUE_FIELDS.map((f) => {
                const uncertain = scan.uncertainFields.includes(f.key);
                return (
                  <Field
                    key={f.key}
                    label={f.label}
                    htmlFor={`v-${f.key}`}
                    hint={uncertain ? 'Unsicher erkannt' : undefined}
                  >
                    <Input
                      id={`v-${f.key}`}
                      inputMode="decimal"
                      value={values[f.key]}
                      onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                      className={uncertain ? 'border-accent bg-accent-soft/40' : ''}
                      aria-describedby={uncertain ? `hint-${f.key}` : undefined}
                    />
                  </Field>
                );
              })}
            </div>
            {warnings.length > 0 && (
              <div className="rounded-xl bg-accent-soft px-3 py-2 text-xs text-body">
                {warnings.map((w) => <p key={w}>{w}</p>)}
              </div>
            )}
          </Card>

          <Card className="flex items-center justify-between">
            <div>
              <p className="text-sm text-mut">Vorschau pro Portion</p>
              <p className="text-2xl font-extrabold text-brand-ink">
                {previewPoints ? `${previewPoints.total} Punkte` : '—'}
              </p>
              {normalized && (
                <p className="text-xs text-mut">
                  {fmt(normalized.per100.calories, 0)} kcal / 100 {basis === 'per100ml' ? 'ml' : 'g'}
                </p>
              )}
            </div>
            <Button size="lg" onClick={save} disabled={!normalized || !name.trim()}>
              Speichern
            </Button>
          </Card>
        </>
      )}

      <AddFoodSheet food={savedFood} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </main>
  );
}
