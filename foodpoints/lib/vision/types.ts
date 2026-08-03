import type { NutritionBasis } from '@/lib/nutrition/types';
import type { RawLabelValues } from '@/lib/nutrition/normalize';

/**
 * VisionProvider-Schnittstelle: Foto-Mahlzeitenerkennung und
 * Nährwerttabellen-Analyse. Implementierungen laufen NUR serverseitig
 * (API-Keys erreichen nie den Client). Ergebnisse sind immer Schätzungen
 * und werden nie ohne Nutzerbestätigung übernommen.
 */

export interface VisionImageInput {
  /** Bilddaten Base64 (ohne data:-Präfix). */
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface AnalyzeMealImageInput extends VisionImageInput {
  /** Optionale Nutzerangabe („Das ist mein Mittagessen“). */
  hint?: string;
}

export interface MealAnalysisItem {
  name: string;
  estimatedGrams: number;
  /** 0–1 */
  confidence: number;
  preparation: string | null;
  possibleHiddenIngredients: string[];
}

export interface MealAnalysisResult {
  mealName: string;
  /** 0–1, Gesamtvertrauen */
  confidence: number;
  items: MealAnalysisItem[];
  warnings: string[];
  provider: string;
}

export interface AnalyzeLabelInput extends VisionImageInput {
  /** Optionales zweites Bild (Vorderseite der Verpackung). */
  frontImageBase64?: string;
}

export interface LabelAnalysisResult {
  productName: string | null;
  brand: string | null;
  /** Füllmenge der Packung in g/ml, falls erkennbar. */
  packageSizeGrams: number | null;
  /** Bezugsgröße der erkannten Werte. */
  basis: NutritionBasis;
  /** Portionsgröße in g/ml, falls auf dem Etikett angegeben. */
  portionGrams: number | null;
  /** Rohwerte, fehlende Felder bleiben null (nie erfinden!). */
  values: RawLabelValues;
  barcode: string | null;
  /** Felder mit unsicherer Erkennung — in der UI markieren. */
  uncertainFields: string[];
  warnings: string[];
  provider: string;
}

export interface VisionProvider {
  readonly name: string;
  analyzeMealImage(input: AnalyzeMealImageInput): Promise<MealAnalysisResult>;
  analyzeNutritionLabel(input: AnalyzeLabelInput): Promise<LabelAnalysisResult>;
}
