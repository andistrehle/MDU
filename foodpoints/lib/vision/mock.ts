import type {
  AnalyzeLabelInput,
  AnalyzeMealImageInput,
  LabelAnalysisResult,
  MealAnalysisResult,
  VisionProvider,
} from './types';

/**
 * MockVisionProvider — deterministische Ergebnisse für Demo-Modus und Tests.
 * Wird automatisch verwendet, wenn keine externe Vision-API konfiguriert ist.
 * Die Ergebnisse sind klar als Demo-Daten gekennzeichnet.
 */
export class MockVisionProvider implements VisionProvider {
  readonly name = 'mock';

  async analyzeMealImage(_input: AnalyzeMealImageInput): Promise<MealAnalysisResult> {
    return {
      mealName: 'Gemüsepfanne mit Hähnchen und Reis',
      confidence: 0.78,
      items: [
        {
          name: 'Hähnchenbrust, gebraten',
          estimatedGrams: 140,
          confidence: 0.84,
          preparation: 'gebraten',
          possibleHiddenIngredients: ['Öl'],
        },
        {
          name: 'Reis, gekocht',
          estimatedGrams: 180,
          confidence: 0.8,
          preparation: 'gekocht',
          possibleHiddenIngredients: [],
        },
        {
          name: 'Paprika & Zucchini',
          estimatedGrams: 120,
          confidence: 0.72,
          preparation: 'gebraten',
          possibleHiddenIngredients: ['Öl'],
        },
        {
          name: 'Bratöl (geschätzt)',
          estimatedGrams: 10,
          confidence: 0.5,
          preparation: null,
          possibleHiddenIngredients: [],
        },
      ],
      warnings: [
        'Demo-Analyse (MockVisionProvider) — es wurde keine echte Bilderkennung durchgeführt.',
        'Mengen sind nur geschätzt.',
      ],
      provider: this.name,
    };
  }

  async analyzeNutritionLabel(_input: AnalyzeLabelInput): Promise<LabelAnalysisResult> {
    return {
      productName: 'Knusper-Müsli Schoko',
      brand: 'Demo-Marke',
      packageSizeGrams: 500,
      basis: 'per100g',
      portionGrams: 40,
      values: {
        energyKj: 1830,
        energyKcal: null, // absichtlich: kcal wird aus kJ abgeleitet
        fat: 14,
        saturatedFat: 4.2,
        carbs: 62,
        sugar: 18,
        fiber: 7.5,
        protein: 9.1,
        salt: 0.25,
      },
      barcode: null,
      uncertainFields: ['salt'],
      warnings: [
        'Demo-Analyse (MockVisionProvider) — es wurde keine echte Bilderkennung durchgeführt.',
      ],
      provider: this.name,
    };
  }
}
