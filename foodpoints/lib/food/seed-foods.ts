import type { Food } from './types';
import type { Nutrients } from '@/lib/nutrition/types';

/**
 * Mitgelieferte Basisdatenbank (Näherungswerte gängiger Lebensmittel,
 * Quelle: übliche Durchschnittswerte deutscher Nährwerttabellen).
 * Dient als Offline-Grundstock und für den Demo-Modus.
 */

const T0 = '2026-01-01T00:00:00.000Z';

function n(partial: Partial<Nutrients>): Nutrients {
  return {
    calories: 0, fat: 0, saturatedFat: 0, carbs: 0, sugar: 0, fiber: 0, protein: 0, salt: 0,
    ...partial,
  };
}

interface SeedSpec {
  id: string;
  name: string;
  brand?: string;
  category: Food['category'];
  per100: Nutrients;
  isLiquid?: boolean;
  zeroPoint?: boolean;
  defaultPortion: number;
  portions?: { label: string; grams: number }[];
  barcode?: string;
}

const SEEDS: SeedSpec[] = [
  { id: 'seed-apple', name: 'Apfel', category: 'fruit', zeroPoint: true, defaultPortion: 150,
    per100: n({ calories: 52, carbs: 14, sugar: 10, fiber: 2.4, protein: 0.3 }),
    portions: [{ label: '1 mittelgroßer Apfel', grams: 150 }, { label: '1 kleiner Apfel', grams: 100 }] },
  { id: 'seed-banana', name: 'Banane', category: 'fruit', zeroPoint: true, defaultPortion: 120,
    per100: n({ calories: 89, carbs: 23, sugar: 12, fiber: 2.6, protein: 1.1 }),
    portions: [{ label: '1 Banane', grams: 120 }] },
  { id: 'seed-broccoli', name: 'Brokkoli, gegart', category: 'vegetables', zeroPoint: true, defaultPortion: 200,
    per100: n({ calories: 34, carbs: 7, sugar: 1.7, fiber: 2.6, protein: 2.8 }) },
  { id: 'seed-paprika', name: 'Paprika, roh', category: 'vegetables', zeroPoint: true, defaultPortion: 120,
    per100: n({ calories: 31, carbs: 6, sugar: 4.2, fiber: 2.1, protein: 1 }) },
  { id: 'seed-zucchini', name: 'Zucchini, gebraten', category: 'vegetables', zeroPoint: true, defaultPortion: 150,
    per100: n({ calories: 24, carbs: 3.1, sugar: 2.5, fiber: 1.1, protein: 1.2, fat: 0.4 }) },
  { id: 'seed-chicken-breast', name: 'Hähnchenbrust, gebraten (ohne Haut)', category: 'lean-protein', zeroPoint: true, defaultPortion: 140,
    per100: n({ calories: 165, fat: 3.6, saturatedFat: 1, protein: 31 }) },
  { id: 'seed-magerquark', name: 'Magerquark', category: 'lean-protein', zeroPoint: true, defaultPortion: 250,
    per100: n({ calories: 67, fat: 0.2, saturatedFat: 0.1, carbs: 4, sugar: 4, protein: 12 }),
    portions: [{ label: '1 Becher (250 g)', grams: 250 }, { label: '1 EL (30 g)', grams: 30 }] },
  { id: 'seed-egg', name: 'Ei, gekocht', category: 'eggs', zeroPoint: true, defaultPortion: 60,
    per100: n({ calories: 155, fat: 11, saturatedFat: 3.3, carbs: 1.1, sugar: 1.1, protein: 13 }),
    portions: [{ label: '1 Ei (Größe M)', grams: 60 }] },
  { id: 'seed-linsen', name: 'Linsen, gekocht', category: 'legumes', zeroPoint: true, defaultPortion: 150,
    per100: n({ calories: 116, carbs: 20, sugar: 1.8, fiber: 7.9, protein: 9 }) },
  { id: 'seed-rice', name: 'Reis, gekocht', category: 'grains', defaultPortion: 180,
    per100: n({ calories: 130, carbs: 28, sugar: 0.1, fiber: 0.4, protein: 2.7, fat: 0.3 }),
    portions: [{ label: '1 Portion (180 g)', grams: 180 }, { label: '1 EL (20 g)', grams: 20 }] },
  { id: 'seed-pasta', name: 'Nudeln, gekocht', category: 'grains', defaultPortion: 200,
    per100: n({ calories: 158, carbs: 31, sugar: 0.6, fiber: 1.8, protein: 5.8, fat: 0.9, saturatedFat: 0.2 }) },
  { id: 'seed-vollkornbrot', name: 'Vollkornbrot', category: 'grains', defaultPortion: 50,
    per100: n({ calories: 213, carbs: 38, sugar: 1.5, fiber: 8, protein: 7.5, fat: 1.7, saturatedFat: 0.3, salt: 1.1 }),
    portions: [{ label: '1 Scheibe (50 g)', grams: 50 }] },
  { id: 'seed-butter', name: 'Butter', category: 'fats-oils', defaultPortion: 10,
    per100: n({ calories: 741, fat: 82, saturatedFat: 52, sugar: 0.6, carbs: 0.6, protein: 0.7 }),
    portions: [{ label: '1 TL (5 g)', grams: 5 }, { label: '1 EL (10 g)', grams: 10 }] },
  { id: 'seed-olivenoel', name: 'Olivenöl', category: 'fats-oils', defaultPortion: 10,
    per100: n({ calories: 884, fat: 100, saturatedFat: 14 }),
    portions: [{ label: '1 TL (5 g)', grams: 5 }, { label: '1 EL (10 g)', grams: 10 }] },
  { id: 'seed-gouda', name: 'Gouda (48 % Fett i. Tr.)', category: 'dairy', defaultPortion: 30,
    per100: n({ calories: 356, fat: 27, saturatedFat: 18, carbs: 2.2, sugar: 2.2, protein: 25, salt: 2 }),
    portions: [{ label: '1 Scheibe (30 g)', grams: 30 }] },
  { id: 'seed-joghurt', name: 'Naturjoghurt (3,5 %)', category: 'dairy', defaultPortion: 150,
    per100: n({ calories: 66, fat: 3.5, saturatedFat: 2.3, carbs: 4.7, sugar: 4.7, protein: 3.8 }),
    portions: [{ label: '1 Becher (150 g)', grams: 150 }] },
  { id: 'seed-milch', name: 'Milch (1,5 %)', category: 'dairy', isLiquid: true, defaultPortion: 200,
    per100: n({ calories: 47, fat: 1.5, saturatedFat: 1, carbs: 4.9, sugar: 4.9, protein: 3.4 }),
    portions: [{ label: '1 Glas (200 ml)', grams: 200 }] },
  { id: 'seed-lachs', name: 'Lachsfilet, gebraten', category: 'meat-fish', defaultPortion: 150,
    per100: n({ calories: 208, fat: 13, saturatedFat: 3.1, protein: 20 }) },
  { id: 'seed-haferflocken', name: 'Haferflocken', category: 'grains', defaultPortion: 50,
    per100: n({ calories: 372, carbs: 59, sugar: 0.7, fiber: 10, protein: 13, fat: 7, saturatedFat: 1.2 }),
    portions: [{ label: '1 Portion (50 g)', grams: 50 }, { label: '1 EL (10 g)', grams: 10 }] },
  { id: 'seed-schokolade', name: 'Vollmilchschokolade', category: 'sweets-snacks', defaultPortion: 25,
    per100: n({ calories: 535, fat: 30, saturatedFat: 19, carbs: 58, sugar: 56, protein: 7.5 }),
    portions: [{ label: '1 Riegel (25 g)', grams: 25 }, { label: '1 Stück (6 g)', grams: 6 }] },
  { id: 'seed-chips', name: 'Kartoffelchips, gesalzen', category: 'sweets-snacks', defaultPortion: 30,
    per100: n({ calories: 539, fat: 35, saturatedFat: 3.1, carbs: 49, sugar: 0.6, fiber: 4, protein: 6, salt: 1.4 }),
    portions: [{ label: '1 Handvoll (30 g)', grams: 30 }] },
  { id: 'seed-cola', name: 'Cola', category: 'drinks', isLiquid: true, defaultPortion: 330,
    per100: n({ calories: 42, carbs: 10.6, sugar: 10.6 }),
    portions: [{ label: '1 Dose (330 ml)', grams: 330 }, { label: '1 Glas (250 ml)', grams: 250 }] },
  { id: 'seed-apfelschorle', name: 'Apfelschorle', category: 'drinks', isLiquid: true, defaultPortion: 250,
    per100: n({ calories: 25, carbs: 6, sugar: 5.8 }) },
  { id: 'seed-wasser', name: 'Wasser', category: 'drinks', isLiquid: true, defaultPortion: 250,
    per100: n({}) },
  { id: 'seed-kaffee', name: 'Kaffee, schwarz', category: 'drinks', isLiquid: true, defaultPortion: 200,
    per100: n({ calories: 2, protein: 0.1 }) },
  { id: 'seed-tomatensauce', name: 'Tomatensauce (passiert, gewürzt)', category: 'prepared', defaultPortion: 100,
    per100: n({ calories: 38, fat: 0.9, saturatedFat: 0.1, carbs: 5.5, sugar: 4.8, fiber: 1.5, protein: 1.5, salt: 0.8 }) },
  { id: 'seed-pizza-salami', name: 'Pizza Salami (TK, gebacken)', category: 'prepared', defaultPortion: 350,
    per100: n({ calories: 252, fat: 10, saturatedFat: 4.3, carbs: 29, sugar: 3.5, fiber: 2.1, protein: 10.5, salt: 1.4 }),
    portions: [{ label: '1 ganze Pizza (350 g)', grams: 350 }, { label: '1/2 Pizza (175 g)', grams: 175 }] },
];

export const SEED_FOODS: Food[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  brand: s.brand ?? null,
  barcode: s.barcode ?? null,
  category: s.category,
  nutrientsPer100: s.per100,
  isLiquid: s.isLiquid ?? false,
  isZeroPointFood: s.zeroPoint ?? false,
  defaultPortionGrams: s.defaultPortion,
  portions: (s.portions ?? []).map((p, i) => ({ id: `${s.id}-p${i}`, ...p })),
  source: 'seed',
  confidence: 0.9,
  warnings: [],
  createdAt: T0,
  updatedAt: T0,
  isPrivate: false,
}));

/** Einfache Suche in der Seed-Datenbank (Name/Marke, case-insensitiv). */
export function searchSeedFoods(query: string, limit = 20): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return SEED_FOODS.slice(0, limit);
  return SEED_FOODS.filter(
    (f) => f.name.toLowerCase().includes(q) || (f.brand ?? '').toLowerCase().includes(q),
  ).slice(0, limit);
}
