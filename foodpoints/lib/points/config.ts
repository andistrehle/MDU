/**
 * Zentrale Konfiguration der FoodPoints-Punkteformel.
 *
 * WICHTIG (rechtlich und fachlich):
 * - Dies ist eine EIGENE, transparente Näherungsformel von FoodPoints.
 *   Sie ist ausdrücklich NICHT die Formel eines anderen Anbieters und wird
 *   nirgends als solche bezeichnet.
 * - Alle Faktoren sind hier zentral versioniert. Änderungen an Faktoren
 *   erzeugen eine NEUE Version (niemals eine bestehende Version ändern!),
 *   damit historische Tagebucheinträge nachvollziehbar bleiben.
 * - Die DB-Tabelle `point_formula_versions` spiegelt diese Versionen.
 */

export interface PointsFormulaConfig {
  /** Eindeutige Versionskennung, wird in Tagebucheinträgen gespeichert. */
  version: string;
  /** Punkte pro kcal */
  calorieFactor: number;
  /** Punkte pro g gesättigte Fettsäuren (erhöht) */
  saturatedFatFactor: number;
  /** Punkte pro g Zucker (erhöht) */
  sugarFactor: number;
  /** Punkte pro g Eiweiß (reduziert) */
  proteinFactor: number;
  /** Punkte pro g Ballaststoffe (reduziert) */
  fiberFactor: number;
  /**
   * Obergrenze, bis zu der Eiweiß/Ballaststoffe Punkte reduzieren dürfen
   * (in g pro Referenzmenge) — verhindert unrealistische „Negativ-Punkte“
   * durch extreme Werte. `null` = keine Kappung.
   */
  proteinCapGrams: number | null;
  fiberCapGrams: number | null;
}

/** Version 1 — erste Näherung (siehe docs/punkteformel.md). */
export const FORMULA_V1: PointsFormulaConfig = {
  version: 'fp-v1',
  calorieFactor: 0.03,
  saturatedFatFactor: 0.9,
  sugarFactor: 0.12,
  proteinFactor: 0.08,
  fiberFactor: 0.15,
  proteinCapGrams: null,
  fiberCapGrams: null,
};

/** Alle bekannten Versionen (Nachschlagewerk für historische Einträge). */
export const ALL_FORMULA_VERSIONS: readonly PointsFormulaConfig[] = [FORMULA_V1];

/** Die aktuell aktive Formelversion. */
export const ACTIVE_FORMULA: PointsFormulaConfig = FORMULA_V1;

export function getFormulaByVersion(version: string): PointsFormulaConfig | undefined {
  return ALL_FORMULA_VERSIONS.find((f) => f.version === version);
}

/**
 * Lebensmittelkategorien. Nur Kategorien mit `zeroPointEligible: true`
 * dürfen überhaupt als 0-Punkte-Basislebensmittel markiert werden.
 * Fertigprodukte/Mischprodukte sind grundsätzlich NICHT berechtigt —
 * auch wenn einzelne Zutaten auf einer 0-Punkte-Liste stehen.
 */
export const FOOD_CATEGORIES = [
  { id: 'vegetables', label: 'Gemüse', zeroPointEligible: true },
  { id: 'fruit', label: 'Obst', zeroPointEligible: true },
  { id: 'lean-protein', label: 'Mageres Eiweiß (z. B. Hähnchenbrust, Magerquark)', zeroPointEligible: true },
  { id: 'legumes', label: 'Hülsenfrüchte', zeroPointEligible: true },
  { id: 'eggs', label: 'Eier', zeroPointEligible: true },
  { id: 'grains', label: 'Getreide & Beilagen', zeroPointEligible: false },
  { id: 'dairy', label: 'Milchprodukte', zeroPointEligible: false },
  { id: 'meat-fish', label: 'Fleisch & Fisch', zeroPointEligible: false },
  { id: 'fats-oils', label: 'Fette & Öle', zeroPointEligible: false },
  { id: 'sweets-snacks', label: 'Süßes & Snacks', zeroPointEligible: false },
  { id: 'drinks', label: 'Getränke', zeroPointEligible: false },
  { id: 'prepared', label: 'Fertigprodukte & Gerichte', zeroPointEligible: false },
  { id: 'other', label: 'Sonstiges', zeroPointEligible: false },
] as const;

export type FoodCategoryId = (typeof FOOD_CATEGORIES)[number]['id'];

export function isZeroPointEligibleCategory(category: string): boolean {
  return FOOD_CATEGORIES.some((c) => c.id === category && c.zeroPointEligible);
}
