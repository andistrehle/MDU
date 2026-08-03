'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiaryEntry, Food, MealSlot, Recipe, WeightEntry } from '@/lib/food/types';
import type { Nutrients } from '@/lib/nutrition/types';
import { scaleNutrients } from '@/lib/nutrition/types';
import { computeFoodPoints } from '@/lib/points/engine';
import { ACTIVE_FORMULA } from '@/lib/points/config';
import type { ActivityLevel, Gender, PaceKgPerWeek, BudgetConfig } from '@/lib/budget/engine';
import { DEFAULT_BUDGET_CONFIG, computeBudget } from '@/lib/budget/engine';

/**
 * Zentraler Client-Store (zustand, persistiert in localStorage).
 * Im Demo-Modus ist er die alleinige Datenhaltung; im Supabase-Modus dient
 * er als lokaler Cache (vollständiger Sync: siehe BACKLOG P1).
 */

export interface UserProfile {
  firstName: string;
  birthYear: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  paceKgPerWeek: PaceKgPerWeek;
  unit: 'kg' | 'lb';
  allergies: string;
  dietStyle: string;
  onboardingComplete: boolean;
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  /** Fotos nach der Analyse dauerhaft speichern? (Opt-in) */
  keepPhotosAfterAnalysis: boolean;
  budget: BudgetConfig;
  /** Wasserziel in ml/Tag */
  waterGoalMl: number;
}

interface UndoState {
  entry: DiaryEntry;
  expiresAt: number;
}

interface AppState {
  demoMode: boolean;
  profile: UserProfile | null;
  settings: AppSettings;
  entries: DiaryEntry[];
  customFoods: Food[];
  recipes: Recipe[];
  weights: WeightEntry[];
  /** Wasser in ml pro Tag (date-key → ml). */
  water: Record<string, number>;
  favoriteFoodIds: string[];
  lastDeleted: UndoState | null;

  setDemoMode: (v: boolean) => void;
  setProfile: (p: UserProfile) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  setBudgetConfig: (b: Partial<BudgetConfig>) => void;

  addEntry: (e: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => DiaryEntry;
  updateEntryGrams: (id: string, grams: number, foodPer100?: Nutrients) => void;
  moveEntry: (id: string, meal: MealSlot) => void;
  copyEntry: (id: string, targetDate: string, targetMeal?: MealSlot) => void;
  copyMeal: (date: string, meal: MealSlot, targetDate: string) => void;
  deleteEntry: (id: string) => void;
  undoDelete: () => void;

  addCustomFood: (f: Food) => void;
  updateCustomFood: (id: string, patch: Partial<Food>) => void;
  linkBarcode: (foodId: string, barcode: string) => void;

  addRecipe: (r: Recipe) => void;
  updateRecipe: (id: string, patch: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;

  addWeight: (weightKg: number, date: string, note?: string) => void;
  deleteWeight: (id: string) => void;
  addWater: (date: string, ml: number) => void;

  toggleFavorite: (foodId: string) => void;
  resetAll: () => void;
}

const now = () => new Date().toISOString();

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  keepPhotosAfterAnalysis: false,
  budget: DEFAULT_BUDGET_CONFIG,
  waterGoalMl: 2000,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      demoMode: false,
      profile: null,
      settings: DEFAULT_SETTINGS,
      entries: [],
      customFoods: [],
      recipes: [],
      weights: [],
      water: {},
      favoriteFoodIds: [],
      lastDeleted: null,

      setDemoMode: (v) => set({ demoMode: v }),
      setProfile: (p) => set({ profile: p }),
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setBudgetConfig: (b) =>
        set({ settings: { ...get().settings, budget: { ...get().settings.budget, ...b } } }),

      addEntry: (e) => {
        const entry: DiaryEntry = { ...e, id: crypto.randomUUID(), createdAt: now(), updatedAt: now() };
        set({ entries: [...get().entries, entry] });
        return entry;
      },

      updateEntryGrams: (id, grams, foodPer100) => {
        set({
          entries: get().entries.map((e) => {
            if (e.id !== id) return e;
            if (grams <= 0) return e;
            // Nährwerte pro 100 g aus dem Snapshot zurückrechnen, falls nicht übergeben
            const per100 = foodPer100 ?? scaleNutrients(e.nutrients, (100 / e.grams) * 100);
            const nutrients = scaleNutrients(per100, grams);
            const points = e.zeroPointApplied
              ? 0
              : computeFoodPoints(
                  { nutrientsPer100: per100, category: 'other', isZeroPointFood: false },
                  grams,
                ).total;
            return {
              ...e,
              grams,
              nutrients,
              points,
              formulaVersion: ACTIVE_FORMULA.version,
              updatedAt: now(),
            };
          }),
        });
      },

      moveEntry: (id, meal) =>
        set({ entries: get().entries.map((e) => (e.id === id ? { ...e, meal, updatedAt: now() } : e)) }),

      copyEntry: (id, targetDate, targetMeal) => {
        const src = get().entries.find((e) => e.id === id);
        if (!src) return;
        const copy: DiaryEntry = {
          ...src,
          id: crypto.randomUUID(),
          date: targetDate,
          meal: targetMeal ?? src.meal,
          createdAt: now(),
          updatedAt: now(),
        };
        set({ entries: [...get().entries, copy] });
      },

      copyMeal: (date, meal, targetDate) => {
        const src = get().entries.filter((e) => e.date === date && e.meal === meal);
        const copies = src.map((e) => ({
          ...e, id: crypto.randomUUID(), date: targetDate, createdAt: now(), updatedAt: now(),
        }));
        set({ entries: [...get().entries, ...copies] });
      },

      deleteEntry: (id) => {
        const entry = get().entries.find((e) => e.id === id);
        if (!entry) return;
        set({
          entries: get().entries.filter((e) => e.id !== id),
          lastDeleted: { entry, expiresAt: Date.now() + 8000 },
        });
      },

      undoDelete: () => {
        const u = get().lastDeleted;
        if (!u || Date.now() > u.expiresAt) {
          set({ lastDeleted: null });
          return;
        }
        set({ entries: [...get().entries, u.entry], lastDeleted: null });
      },

      addCustomFood: (f) => set({ customFoods: [...get().customFoods, f] }),
      updateCustomFood: (id, patch) =>
        set({
          customFoods: get().customFoods.map((f) =>
            f.id === id ? { ...f, ...patch, updatedAt: now() } : f,
          ),
        }),
      linkBarcode: (foodId, barcode) =>
        set({
          customFoods: get().customFoods.map((f) =>
            f.id === foodId ? { ...f, barcode, updatedAt: now() } : f,
          ),
        }),

      addRecipe: (r) => set({ recipes: [...get().recipes, r] }),
      updateRecipe: (id, patch) =>
        set({
          recipes: get().recipes.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r)),
        }),
      deleteRecipe: (id) => set({ recipes: get().recipes.filter((r) => r.id !== id) }),

      addWeight: (weightKg, date, note) =>
        set({
          weights: [
            ...get().weights.filter((w) => w.date !== date),
            { id: crypto.randomUUID(), date, weightKg, note: note ?? null, createdAt: now() },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        }),
      deleteWeight: (id) => set({ weights: get().weights.filter((w) => w.id !== id) }),
      addWater: (date, ml) =>
        set({ water: { ...get().water, [date]: Math.max(0, (get().water[date] ?? 0) + ml) } }),

      toggleFavorite: (foodId) => {
        const list = get().favoriteFoodIds;
        set({
          favoriteFoodIds: list.includes(foodId)
            ? list.filter((id) => id !== foodId)
            : [...list, foodId],
        });
      },

      resetAll: () =>
        set({
          demoMode: false,
          profile: null,
          settings: DEFAULT_SETTINGS,
          entries: [],
          customFoods: [],
          recipes: [],
          weights: [],
          water: {},
          favoriteFoodIds: [],
          lastDeleted: null,
        }),
    }),
    {
      name: 'foodpoints-store-v1',
      partialize: (state) => {
        // Undo-Puffer nicht persistieren
        const { lastDeleted: _lastDeleted, ...rest } = state;
        return rest;
      },
    },
  ),
);

/** Aktuelles Punktebudget aus Profil + Einstellungen (Demo-Fallback: 30/35). */
export function useBudget(): { dailyPoints: number; weeklyReserve: number } {
  const profile = useAppStore((s) => s.profile);
  const budget = useAppStore((s) => s.settings.budget);
  if (budget.manualDailyPoints !== null) {
    return { dailyPoints: budget.manualDailyPoints, weeklyReserve: budget.weeklyReserve };
  }
  if (!profile || !profile.onboardingComplete) {
    return { dailyPoints: 30, weeklyReserve: budget.weeklyReserve };
  }
  const result = computeBudget(
    {
      birthYear: profile.birthYear,
      gender: profile.gender,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      targetWeightKg: profile.targetWeightKg,
      activityLevel: profile.activityLevel,
      paceKgPerWeek: profile.paceKgPerWeek,
    },
    budget,
  );
  return { dailyPoints: result.dailyPoints, weeklyReserve: result.weeklyReserve };
}
