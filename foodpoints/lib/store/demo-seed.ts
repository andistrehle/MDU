import type { Recipe } from '@/lib/food/types';
import { SEED_FOODS } from '@/lib/food/seed-foods';
import { toDateKey } from '@/lib/diary/summary';
import { entryFromFood } from '@/lib/diary/entry-factory';
import type { UserProfile } from './app-store';
import { DEFAULT_SETTINGS, useAppStore } from './app-store';

/**
 * Demo-Modus: befüllt den Store mit einem Beispieltag (Frühstück, Mittag-,
 * Abendessen, Snack), Beispielprofil, Beispielrezept und Gewichtsverlauf.
 * Alle Daten sind als Demo-Daten erkennbar und lokal im Browser gespeichert.
 */

export const DEMO_PROFILE: UserProfile = {
  firstName: 'Alex',
  birthYear: 1990,
  gender: 'unspecified',
  heightCm: 172,
  weightKg: 78,
  targetWeightKg: 72,
  activityLevel: 'light',
  paceKgPerWeek: -0.5,
  unit: 'kg',
  allergies: '',
  dietStyle: '',
  onboardingComplete: true,
};

function food(id: string) {
  const f = SEED_FOODS.find((f) => f.id === id);
  if (!f) throw new Error(`Seed-Lebensmittel fehlt: ${id}`);
  return f;
}

export function buildDemoRecipe(): Recipe {
  const nowIso = new Date().toISOString();
  return {
    id: 'demo-recipe-1',
    name: 'Linsen-Bolognese mit Nudeln',
    description: 'Schnelle vegetarische Bolognese auf Linsenbasis — Demo-Rezept.',
    servings: 4,
    instructions:
      '1. Zwiebeln in Öl anschwitzen.\n2. Linsen und Tomatensauce zugeben, 15 Min. köcheln.\n' +
      '3. Nudeln kochen und mit der Sauce servieren.',
    ingredients: [
      { id: 'di-1', foodId: 'seed-linsen', name: 'Linsen, gekocht', grams: 400, nutrientsPer100: food('seed-linsen').nutrientsPer100 },
      { id: 'di-2', foodId: 'seed-tomatensauce', name: 'Tomatensauce', grams: 400, nutrientsPer100: food('seed-tomatensauce').nutrientsPer100 },
      { id: 'di-3', foodId: 'seed-pasta', name: 'Nudeln, gekocht', grams: 800, nutrientsPer100: food('seed-pasta').nutrientsPer100 },
      { id: 'di-4', foodId: 'seed-olivenoel', name: 'Olivenöl', grams: 15, nutrientsPer100: food('seed-olivenoel').nutrientsPer100 },
    ],
    photoUrl: null,
    isFavorite: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

/** Aktiviert den Demo-Modus und befüllt den Store mit Beispieldaten. */
export function activateDemoMode(): void {
  const store = useAppStore.getState();
  store.resetAll();
  const today = toDateKey(new Date());

  useAppStore.setState({
    demoMode: true,
    profile: DEMO_PROFILE,
    settings: { ...DEFAULT_SETTINGS },
    recipes: [buildDemoRecipe()],
  });

  const s = useAppStore.getState();
  // Beispieltag
  s.addEntry(entryFromFood(food('seed-haferflocken'), 50, today, 'breakfast'));
  s.addEntry(entryFromFood(food('seed-milch'), 200, today, 'breakfast'));
  s.addEntry(entryFromFood(food('seed-banana'), 120, today, 'breakfast'));
  s.addEntry(entryFromFood(food('seed-chicken-breast'), 140, today, 'lunch'));
  s.addEntry(entryFromFood(food('seed-rice'), 180, today, 'lunch'));
  s.addEntry(entryFromFood(food('seed-broccoli'), 200, today, 'lunch'));
  s.addEntry(entryFromFood(food('seed-vollkornbrot'), 100, today, 'dinner'));
  s.addEntry(entryFromFood(food('seed-gouda'), 30, today, 'dinner'));
  s.addEntry(entryFromFood(food('seed-apple'), 150, today, 'snacks'));
  s.addEntry(entryFromFood(food('seed-schokolade'), 25, today, 'snacks'));
  s.addWater(today, 1000);

  // Gewichtsverlauf der letzten Wochen
  const start = 79.4;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    s.addWeight(Math.round((start - (6 - i) * 0.25) * 10) / 10, toDateKey(d));
  }
}
