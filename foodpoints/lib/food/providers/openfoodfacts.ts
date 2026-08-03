import { z } from 'zod';
import type { Food } from '../types';
import type { FoodCategoryId } from '@/lib/points/config';

/**
 * Open-Food-Facts-Anbindung (Barcode-Lookup + Textsuche).
 * Kein API-Key nötig; Daten stehen unter freier Lizenz (ODbL).
 * Externe Werte gelten als unbestätigt (confidence < 1) und müssen vom
 * Nutzer vor dem Speichern geprüft werden.
 */

const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product';
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';

const NutrimentsSchema = z.object({
  'energy-kcal_100g': z.number().optional(),
  'energy-kj_100g': z.number().optional(),
  fat_100g: z.number().optional(),
  'saturated-fat_100g': z.number().optional(),
  carbohydrates_100g: z.number().optional(),
  sugars_100g: z.number().optional(),
  fiber_100g: z.number().optional(),
  proteins_100g: z.number().optional(),
  salt_100g: z.number().optional(),
}).loose();

const ProductSchema = z.object({
  code: z.string().optional(),
  product_name: z.string().optional(),
  product_name_de: z.string().optional(),
  brands: z.string().optional(),
  quantity: z.string().optional(),
  serving_quantity: z.union([z.number(), z.string()]).optional(),
  nutriments: NutrimentsSchema.optional(),
  categories_tags: z.array(z.string()).optional(),
}).loose();

type OffProduct = z.infer<typeof ProductSchema>;

function guessCategory(tags: string[] | undefined): FoodCategoryId {
  const t = (tags ?? []).join(' ');
  if (t.includes('beverages')) return 'drinks';
  if (t.includes('sweet') || t.includes('snacks') || t.includes('chocolate') || t.includes('biscuits')) return 'sweets-snacks';
  if (t.includes('dairies') || t.includes('cheeses') || t.includes('yogurts')) return 'dairy';
  if (t.includes('meats') || t.includes('fishes') || t.includes('seafood')) return 'meat-fish';
  if (t.includes('fruits')) return 'fruit';
  if (t.includes('vegetables')) return 'vegetables';
  if (t.includes('legumes')) return 'legumes';
  if (t.includes('breads') || t.includes('cereals') || t.includes('pastas')) return 'grains';
  if (t.includes('fats') || t.includes('oils')) return 'fats-oils';
  if (t.includes('meals') || t.includes('prepared')) return 'prepared';
  return 'other';
}

function toFood(p: OffProduct): Food | null {
  const nut = p.nutriments;
  if (!nut) return null;
  const kcal = nut['energy-kcal_100g'] ?? (nut['energy-kj_100g'] !== undefined ? nut['energy-kj_100g'] / 4.184 : undefined);
  if (kcal === undefined) return null; // ohne Energieangabe unbrauchbar

  const missing: string[] = [];
  const val = (v: number | undefined, field: string): number => {
    if (v === undefined) { missing.push(field); return 0; }
    return v;
  };

  const name = p.product_name_de || p.product_name;
  if (!name) return null;

  const servingQty = typeof p.serving_quantity === 'string'
    ? Number.parseFloat(p.serving_quantity)
    : p.serving_quantity;
  const isLiquid = (p.quantity ?? '').toLowerCase().includes('ml') || (p.quantity ?? '').toLowerCase().includes(' l');
  const now = new Date().toISOString();

  const warnings =
    missing.length > 0
      ? [`Fehlende Angaben bei Open Food Facts (${missing.join(', ')}) — bitte prüfen und ergänzen.`]
      : [];

  return {
    id: `off-${p.code ?? crypto.randomUUID()}`,
    name,
    brand: p.brands?.split(',')[0]?.trim() || null,
    barcode: p.code ?? null,
    category: guessCategory(p.categories_tags),
    nutrientsPer100: {
      calories: kcal,
      fat: val(nut.fat_100g, 'Fett'),
      saturatedFat: val(nut['saturated-fat_100g'], 'gesättigte Fettsäuren'),
      carbs: val(nut.carbohydrates_100g, 'Kohlenhydrate'),
      sugar: val(nut.sugars_100g, 'Zucker'),
      fiber: val(nut.fiber_100g, 'Ballaststoffe'),
      protein: val(nut.proteins_100g, 'Eiweiß'),
      salt: val(nut.salt_100g, 'Salz'),
    },
    isLiquid,
    isZeroPointFood: false, // externe Produkte nie automatisch 0 Punkte
    defaultPortionGrams: servingQty && Number.isFinite(servingQty) && servingQty > 0 ? servingQty : 100,
    portions: servingQty && Number.isFinite(servingQty) && servingQty > 0
      ? [{ id: 'off-serving', label: `1 Portion (${servingQty} ${isLiquid ? 'ml' : 'g'})`, grams: servingQty }]
      : [],
    source: 'openfoodfacts',
    confidence: missing.length === 0 ? 0.8 : 0.5,
    warnings,
    createdAt: now,
    updatedAt: now,
    isPrivate: false,
  };
}

/** Barcode-Lookup. `null` = Produkt nicht gefunden. */
export async function lookupBarcode(barcode: string): Promise<Food | null> {
  const res = await fetch(
    `${OFF_PRODUCT_URL}/${encodeURIComponent(barcode)}.json?fields=code,product_name,product_name_de,brands,quantity,serving_quantity,nutriments,categories_tags`,
    { headers: { 'user-agent': 'FoodPoints/0.1 (dev)' }, next: { revalidate: 86400 } },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts nicht erreichbar (${res.status}).`);
  const data = (await res.json()) as { status?: number; product?: unknown };
  if (!data.product || data.status === 0) return null;
  const parsed = ProductSchema.safeParse(data.product);
  if (!parsed.success) return null;
  return toFood(parsed.data);
}

/** Textsuche (deutschsprachiger Markt bevorzugt). */
export async function searchProducts(query: string, limit = 10): Promise<Food[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(limit),
    fields: 'code,product_name,product_name_de,brands,quantity,serving_quantity,nutriments,categories_tags',
    cc: 'de',
    lc: 'de',
  });
  const res = await fetch(`${OFF_SEARCH_URL}?${params}`, {
    headers: { 'user-agent': 'FoodPoints/0.1 (dev)' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Open Food Facts nicht erreichbar (${res.status}).`);
  const data = (await res.json()) as { products?: unknown[] };
  const foods: Food[] = [];
  for (const raw of data.products ?? []) {
    const parsed = ProductSchema.safeParse(raw);
    if (!parsed.success) continue;
    const food = toFood(parsed.data);
    if (food) foods.push(food);
  }
  return foods;
}
