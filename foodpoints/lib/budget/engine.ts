import { ACTIVE_FORMULA } from '@/lib/points/config';
import { roundHalfUp } from '@/lib/points/engine';

/**
 * Budget-Modell: leitet aus den Onboarding-Angaben ein Kalorienziel und ein
 * Punktebudget ab. Alle Regeln sind konfigurierbar (BudgetConfig) und werden
 * dem Nutzer als allgemeine Schätzung angezeigt — keine medizinische Beratung.
 */

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
export type Gender = 'female' | 'male' | 'unspecified';
/** Gewünschte Veränderung in kg pro Woche (negativ = abnehmen). */
export type PaceKgPerWeek = -1 | -0.75 | -0.5 | -0.25 | 0 | 0.25;

export interface BudgetInputs {
  birthYear: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  paceKgPerWeek: PaceKgPerWeek;
}

export interface BudgetConfig {
  /** Wochenreserve in Punkten. */
  weeklyReserve: number;
  /** Nicht genutzte Tagespunkte in die Reserve übertragen? */
  rolloverEnabled: boolean;
  /** Maximal übertragbare Punkte pro Tag. */
  maxRolloverPerDay: number;
  /** Untergrenze/Obergrenze des Tagesbudgets in Punkten. */
  minDailyPoints: number;
  maxDailyPoints: number;
  /** Kalorien-Untergrenzen (Sicherheitsnetz). */
  minCaloriesFemale: number;
  minCaloriesMale: number;
  /** Manueller Modus: Nutzer setzt das Tagesbudget selbst. */
  manualDailyPoints: number | null;
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  weeklyReserve: 35,
  rolloverEnabled: true,
  maxRolloverPerDay: 4,
  minDailyPoints: 23,
  maxDailyPoints: 71,
  minCaloriesFemale: 1200,
  minCaloriesMale: 1500,
  manualDailyPoints: null,
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  'very-active': 1.9,
};

export const ACTIVITY_LEVELS: { id: ActivityLevel; label: string }[] = [
  { id: 'sedentary', label: 'Überwiegend sitzend' },
  { id: 'light', label: 'Leicht aktiv (1–2× Sport/Woche)' },
  { id: 'moderate', label: 'Aktiv (3–4× Sport/Woche)' },
  { id: 'active', label: 'Sehr aktiv (fast täglich Sport)' },
  { id: 'very-active', label: 'Extrem aktiv (körperliche Arbeit + Sport)' },
];

/** ~7700 kcal entsprechen etwa 1 kg Körperfett. */
const KCAL_PER_KG = 7700;

/**
 * Grundumsatz nach Mifflin-St Jeor.
 * Bei „unspecified“ wird der Mittelwert aus weiblicher und männlicher
 * Formel verwendet (transparent dokumentiert).
 */
export function basalMetabolicRate(inputs: BudgetInputs, referenceYear: number): number {
  const age = Math.max(14, referenceYear - inputs.birthYear);
  const base = 10 * inputs.weightKg + 6.25 * inputs.heightCm - 5 * age;
  if (inputs.gender === 'male') return base + 5;
  if (inputs.gender === 'female') return base - 161;
  return base + (5 - 161) / 2;
}

export interface CalorieTargetResult {
  /** Geschätzter Gesamtumsatz (TDEE) in kcal. */
  maintenanceCalories: number;
  /** Empfohlenes Tagesziel in kcal (inkl. Sicherheits-Untergrenze). */
  targetCalories: number;
  /** true, wenn die Untergrenze gegriffen hat. */
  floorApplied: boolean;
}

export function calorieTarget(
  inputs: BudgetInputs,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG,
  referenceYear: number = new Date().getFullYear(),
): CalorieTargetResult {
  const bmr = basalMetabolicRate(inputs, referenceYear);
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[inputs.activityLevel];
  const dailyDelta = (inputs.paceKgPerWeek * KCAL_PER_KG) / 7;
  const floor =
    inputs.gender === 'male' ? config.minCaloriesMale : config.minCaloriesFemale;
  const raw = maintenance + dailyDelta;
  const target = Math.max(floor, raw);
  return {
    maintenanceCalories: Math.round(maintenance),
    targetCalories: Math.round(target),
    floorApplied: raw < floor,
  };
}

export interface BudgetResult extends CalorieTargetResult {
  /** Tagesbudget in Punkten. */
  dailyPoints: number;
  /** Wochenreserve in Punkten. */
  weeklyReserve: number;
  /** true, wenn der manuelle Modus aktiv ist. */
  manual: boolean;
}

/**
 * Punktebudget aus dem Kalorienziel ableiten.
 * Die Umrechnung nutzt bewusst denselben calorieFactor wie die Punkteformel,
 * damit Budget und Lebensmittelpunkte in derselben „Währung“ liegen.
 */
export function computeBudget(
  inputs: BudgetInputs,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG,
  referenceYear: number = new Date().getFullYear(),
): BudgetResult {
  const cal = calorieTarget(inputs, config, referenceYear);
  if (config.manualDailyPoints !== null) {
    return {
      ...cal,
      dailyPoints: config.manualDailyPoints,
      weeklyReserve: config.weeklyReserve,
      manual: true,
    };
  }
  const rawPoints = cal.targetCalories * ACTIVE_FORMULA.calorieFactor;
  const dailyPoints = Math.min(
    config.maxDailyPoints,
    Math.max(config.minDailyPoints, roundHalfUp(rawPoints)),
  );
  return { ...cal, dailyPoints, weeklyReserve: config.weeklyReserve, manual: false };
}

/**
 * Übertrag nicht genutzter Tagespunkte in die Wochenreserve.
 * @returns Punkte, die der Reserve gutgeschrieben werden.
 */
export function rolloverPoints(
  unusedDailyPoints: number,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG,
): number {
  if (!config.rolloverEnabled) return 0;
  if (unusedDailyPoints <= 0) return 0;
  return Math.min(config.maxRolloverPerDay, Math.floor(unusedDailyPoints));
}

export interface WeekBudgetState {
  /** Verbleibende Wochenreserve. */
  reserveRemaining: number;
  /** Über die Woche verbrauchte Reservepunkte. */
  reserveUsed: number;
}

/**
 * Verrechnet einen Tag mit dem Wochenbudget:
 * Überschreitungen zehren die Reserve auf, ungenutzte Punkte füllen sie
 * (bis maxRolloverPerDay) — die Reserve wächst nie über ihr Maximum + Überträge.
 */
export function applyDayToWeek(
  state: WeekBudgetState,
  dailyBudget: number,
  usedPoints: number,
  config: BudgetConfig = DEFAULT_BUDGET_CONFIG,
): WeekBudgetState {
  const diff = dailyBudget - usedPoints;
  if (diff < 0) {
    const overdraft = Math.min(state.reserveRemaining, -diff);
    return {
      reserveRemaining: state.reserveRemaining - overdraft,
      reserveUsed: state.reserveUsed + overdraft,
    };
  }
  return {
    reserveRemaining: state.reserveRemaining + rolloverPoints(diff, config),
    reserveUsed: state.reserveUsed,
  };
}
