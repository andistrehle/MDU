import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BUDGET_CONFIG,
  applyDayToWeek,
  basalMetabolicRate,
  calorieTarget,
  computeBudget,
  rolloverPoints,
  type BudgetInputs,
} from '@/lib/budget/engine';

const REF_YEAR = 2026;

const inputs: BudgetInputs = {
  birthYear: 1990,
  gender: 'female',
  heightCm: 168,
  weightKg: 75,
  targetWeightKg: 68,
  activityLevel: 'light',
  paceKgPerWeek: -0.5,
};

describe('Kalorienziel', () => {
  it('berechnet Mifflin-St Jeor korrekt (weiblich)', () => {
    // 10*75 + 6.25*168 - 5*36 - 161 = 750 + 1050 - 180 - 161 = 1459
    expect(basalMetabolicRate(inputs, REF_YEAR)).toBeCloseTo(1459, 0);
  });

  it('zieht das Wochentempo als Tagesdefizit ab', () => {
    const result = calorieTarget(inputs, DEFAULT_BUDGET_CONFIG, REF_YEAR);
    // TDEE = 1459 * 1.375 ≈ 2006; -0.5 kg/Woche ≈ -550 kcal/Tag → ≈ 1456
    expect(result.maintenanceCalories).toBeCloseTo(2006, 0);
    expect(result.targetCalories).toBeCloseTo(1456, 0);
    expect(result.floorApplied).toBe(false);
  });

  it('greift auf die Kalorien-Untergrenze zurück', () => {
    const aggressive: BudgetInputs = { ...inputs, weightKg: 55, paceKgPerWeek: -1 };
    const result = calorieTarget(aggressive, DEFAULT_BUDGET_CONFIG, REF_YEAR);
    expect(result.targetCalories).toBe(DEFAULT_BUDGET_CONFIG.minCaloriesFemale);
    expect(result.floorApplied).toBe(true);
  });
});

describe('Punktebudget', () => {
  it('leitet das Tagesbudget aus dem Kalorienziel ab', () => {
    const budget = computeBudget(inputs, DEFAULT_BUDGET_CONFIG, REF_YEAR);
    // 1456 kcal * 0.03 ≈ 44 Punkte
    expect(budget.dailyPoints).toBe(44);
    expect(budget.weeklyReserve).toBe(35);
    expect(budget.manual).toBe(false);
  });

  it('respektiert Unter- und Obergrenzen', () => {
    const tiny: BudgetInputs = { ...inputs, weightKg: 45, heightCm: 150, paceKgPerWeek: -1 };
    expect(computeBudget(tiny, DEFAULT_BUDGET_CONFIG, REF_YEAR).dailyPoints).toBeGreaterThanOrEqual(
      DEFAULT_BUDGET_CONFIG.minDailyPoints,
    );
    const huge: BudgetInputs = {
      ...inputs, gender: 'male', weightKg: 140, heightCm: 200, activityLevel: 'very-active', paceKgPerWeek: 0,
    };
    expect(computeBudget(huge, DEFAULT_BUDGET_CONFIG, REF_YEAR).dailyPoints).toBeLessThanOrEqual(
      DEFAULT_BUDGET_CONFIG.maxDailyPoints,
    );
  });

  it('manueller Modus überschreibt die Berechnung', () => {
    const budget = computeBudget(inputs, { ...DEFAULT_BUDGET_CONFIG, manualDailyPoints: 30 }, REF_YEAR);
    expect(budget.dailyPoints).toBe(30);
    expect(budget.manual).toBe(true);
  });
});

describe('Wochenreserve & Übertrag', () => {
  it('überträgt ungenutzte Punkte bis zum Tagesmaximum', () => {
    expect(rolloverPoints(2)).toBe(2);
    expect(rolloverPoints(10)).toBe(DEFAULT_BUDGET_CONFIG.maxRolloverPerDay);
    expect(rolloverPoints(0)).toBe(0);
    expect(rolloverPoints(-3)).toBe(0);
    expect(rolloverPoints(10, { ...DEFAULT_BUDGET_CONFIG, rolloverEnabled: false })).toBe(0);
  });

  it('Überschreitungen zehren die Reserve auf, nie unter 0', () => {
    let state = { reserveRemaining: 5, reserveUsed: 0 };
    state = applyDayToWeek(state, 30, 38); // 8 drüber, nur 5 Reserve
    expect(state.reserveRemaining).toBe(0);
    expect(state.reserveUsed).toBe(5);
  });

  it('unter Budget füllt die Reserve über den Übertrag', () => {
    let state = { reserveRemaining: 35, reserveUsed: 0 };
    state = applyDayToWeek(state, 30, 20); // 10 übrig, Übertrag max 4
    expect(state.reserveRemaining).toBe(39);
    expect(state.reserveUsed).toBe(0);
  });
});
