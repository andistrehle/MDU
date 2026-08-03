import type { DiaryEntry, MealSlot } from '@/lib/food/types';
import type { Nutrients } from '@/lib/nutrition/types';
import { sumNutrients } from '@/lib/nutrition/types';
import type { BudgetConfig, WeekBudgetState } from '@/lib/budget/engine';
import { DEFAULT_BUDGET_CONFIG, applyDayToWeek } from '@/lib/budget/engine';

/** Zusammenfassung eines Tagebuch-Tages. */
export interface DaySummary {
  date: string;
  totalPoints: number;
  totalNutrients: Nutrients;
  byMeal: Record<MealSlot, { points: number; nutrients: Nutrients; entries: DiaryEntry[] }>;
  entryCount: number;
}

export function summarizeDay(date: string, entries: DiaryEntry[]): DaySummary {
  const dayEntries = entries.filter((e) => e.date === date);
  const byMeal = {} as DaySummary['byMeal'];
  for (const meal of ['breakfast', 'lunch', 'dinner', 'snacks'] as MealSlot[]) {
    const mealEntries = dayEntries.filter((e) => e.meal === meal);
    byMeal[meal] = {
      points: mealEntries.reduce((s, e) => s + e.points, 0),
      nutrients: sumNutrients(mealEntries.map((e) => e.nutrients)),
      entries: mealEntries,
    };
  }
  return {
    date,
    totalPoints: dayEntries.reduce((s, e) => s + e.points, 0),
    totalNutrients: sumNutrients(dayEntries.map((e) => e.nutrients)),
    byMeal,
    entryCount: dayEntries.length,
  };
}

/** ISO-Datum (YYYY-MM-DD) in lokaler Zeit. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Montag der Woche, in der `date` liegt. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Mo=0 … So=6
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface WeekSummary {
  weekStart: string;
  days: { date: string; points: number; withinBudget: boolean }[];
  totalPoints: number;
  daysWithinBudget: number;
  reserve: WeekBudgetState;
}

/**
 * Wochenzusammenfassung: verrechnet jeden Tag (Mo–So bis heute) mit dem
 * Wochenbudget. Tage ohne Einträge zählen nicht als „im Budget“.
 */
export function summarizeWeek(
  weekStartDate: Date,
  entries: DiaryEntry[],
  dailyBudget: number,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG,
  today: Date = new Date(),
): WeekSummary {
  const days: WeekSummary['days'] = [];
  let reserve: WeekBudgetState = { reserveRemaining: config.weeklyReserve, reserveUsed: 0 };
  const todayKey = toDateKey(today);

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    if (key > todayKey) break;
    const day = summarizeDay(key, entries);
    reserve = applyDayToWeek(reserve, dailyBudget, day.totalPoints, config);
    days.push({
      date: key,
      points: day.totalPoints,
      withinBudget: day.entryCount > 0 && day.totalPoints <= dailyBudget,
    });
  }

  return {
    weekStart: toDateKey(weekStartDate),
    days,
    totalPoints: days.reduce((s, d) => s + d.points, 0),
    daysWithinBudget: days.filter((d) => d.withinBudget).length,
    reserve,
  };
}
