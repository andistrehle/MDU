import type { Nutrients } from '@/lib/nutrition/types';
import type { FoodCategoryId } from '@/lib/points/config';

/** Herkunft eines Lebensmittel-Datensatzes. */
export type FoodSource =
  | 'seed' // mitgelieferte Basisdatenbank
  | 'user' // manuell vom Nutzer angelegt
  | 'openfoodfacts' // externe API
  | 'label-scan' // aus Nährwerttabellen-Scan
  | 'photo-ai' // aus Foto-Erkennung
  | 'mock'; // Demo-/Testdaten

export const FOOD_SOURCE_LABELS: Record<FoodSource, string> = {
  seed: 'FoodPoints-Datenbank',
  user: 'Selbst angelegt',
  openfoodfacts: 'Open Food Facts',
  'label-scan': 'Nährwert-Scan',
  'photo-ai': 'Foto-Erkennung',
  mock: 'Demo-Daten',
};

export interface FoodPortion {
  id: string;
  label: string; // z. B. „1 Scheibe“, „1 EL“
  grams: number;
}

export interface Food {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  category: FoodCategoryId;
  /** Nährwerte pro 100 g bzw. 100 ml. */
  nutrientsPer100: Nutrients;
  /** Flüssigkeit? (Anzeige ml statt g) */
  isLiquid: boolean;
  /** Als 0-Punkte-Basislebensmittel markiert (greift nur bei berechtigter Kategorie). */
  isZeroPointFood: boolean;
  /** Standardportion in g/ml. */
  defaultPortionGrams: number;
  /** Weitere Portionsgrößen. */
  portions: FoodPortion[];
  source: FoodSource;
  /** Vertrauenswert 0–1 (extern/KI-Daten < 1). */
  confidence: number;
  /** Warnhinweise, z. B. widersprüchliche Quellen. */
  warnings: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** true = privates Lebensmittel des Nutzers, false = global lesbar. */
  isPrivate: boolean;
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export const MEAL_SLOTS: { id: MealSlot; label: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Frühstück', emoji: '🥣' },
  { id: 'lunch', label: 'Mittagessen', emoji: '🍽️' },
  { id: 'dinner', label: 'Abendessen', emoji: '🌙' },
  { id: 'snacks', label: 'Snacks', emoji: '🍎' },
];

/**
 * Tagebucheintrag. Nährwerte + Punkte werden als Snapshot zum
 * Erfassungszeitpunkt gespeichert (siehe DECISIONS.md D-011).
 */
export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  meal: MealSlot;
  foodId: string | null; // Referenz, falls aus Lebensmittel/Rezept erstellt
  recipeId: string | null;
  name: string;
  brand: string | null;
  grams: number;
  /** Auf `grams` skalierte Nährwerte (Snapshot). */
  nutrients: Nutrients;
  /** Punkte für diese Menge (Snapshot). */
  points: number;
  /** 0-Punkte-Regel beim Erfassen angewendet? (bleibt bei Portionsänderung erhalten) */
  zeroPointApplied: boolean;
  formulaVersion: string;
  source: FoodSource;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  id: string;
  foodId: string | null;
  name: string;
  grams: number;
  /** Nährwerte pro 100 g der Zutat (Snapshot bei Aufnahme ins Rezept). */
  nutrientsPer100: Nutrients;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  instructions: string;
  ingredients: RecipeIngredient[];
  photoUrl: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  note: string | null;
  createdAt: string;
}
