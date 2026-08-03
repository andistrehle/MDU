import 'server-only';
import { z } from 'zod';
import type {
  AnalyzeLabelInput,
  AnalyzeMealImageInput,
  LabelAnalysisResult,
  MealAnalysisResult,
  VisionProvider,
} from './types';

/**
 * ClaudeVisionProvider — Anthropic Claude Vision über die Messages API.
 * Server-only; der API-Key kommt aus server-only ENV und erreicht nie den
 * Client. Antworten werden mit Zod validiert — ungültige Antworten führen zu
 * einem Fehler, nie zu erfundenen Daten.
 */

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

const MealItemSchema = z.object({
  name: z.string().min(1),
  estimatedGrams: z.number().min(0),
  confidence: z.number().min(0).max(1),
  preparation: z.string().nullable(),
  possibleHiddenIngredients: z.array(z.string()),
});

const MealSchema = z.object({
  mealName: z.string(),
  confidence: z.number().min(0).max(1),
  items: z.array(MealItemSchema),
  warnings: z.array(z.string()),
});

const LabelSchema = z.object({
  productName: z.string().nullable(),
  brand: z.string().nullable(),
  packageSizeGrams: z.number().nullable(),
  basis: z.enum(['per100g', 'per100ml', 'perPortion']),
  portionGrams: z.number().nullable(),
  values: z.object({
    energyKcal: z.number().nullable(),
    energyKj: z.number().nullable(),
    fat: z.number().nullable(),
    saturatedFat: z.number().nullable(),
    carbs: z.number().nullable(),
    sugar: z.number().nullable(),
    fiber: z.number().nullable(),
    protein: z.number().nullable(),
    salt: z.number().nullable(),
  }),
  barcode: z.string().nullable(),
  uncertainFields: z.array(z.string()),
  warnings: z.array(z.string()),
});

const MEAL_PROMPT = [
  'Analysiere das Foto einer Mahlzeit für ein Ernährungstagebuch.',
  'Erkenne einzelne Lebensmittel, das Gericht, plausible Zutaten und schätze Mengen in Gramm.',
  'Berücksichtige Zubereitungsart, sichtbare Soßen sowie Öl/Butter, soweit plausibel.',
  'Ignoriere Öl, Dressings, Käse, Soßen und Getränke NICHT.',
  'Zerlege Mischgerichte nach Möglichkeit in Einzelbestandteile.',
  'Erfinde nichts: Wenn etwas unklar ist, niedrige confidence und Warnung.',
  'Gib AUSSCHLIESSLICH gültiges JSON zurück — kein Markdown, kein Text davor/danach:',
  '{',
  '  "mealName": string,',
  '  "confidence": number,  // 0..1',
  '  "items": [ { "name": string, "estimatedGrams": number, "confidence": number, "preparation": string|null, "possibleHiddenIngredients": string[] } ],',
  '  "warnings": string[]  // immer mindestens: "Mengen sind nur geschätzt."',
  '}',
].join('\n');

const LABEL_PROMPT = [
  'Lies die fotografierte Nährwerttabelle einer Lebensmittelverpackung aus (deutsch oder englisch).',
  'Erkenne, ob die Werte pro 100 g, pro 100 ml oder pro Portion angegeben sind, und die Portionsgröße.',
  'Ordne „davon Zucker“ und „davon gesättigte Fettsäuren“ korrekt zu.',
  'Dezimalkomma und Dezimalpunkt sind beide möglich. Zahlen als number (Punkt als Dezimaltrenner).',
  'Fehlende oder nicht lesbare Werte als null — NIEMALS erfinden. Unsichere Felder in uncertainFields listen.',
  'Gib AUSSCHLIESSLICH gültiges JSON zurück — kein Markdown, kein Text davor/danach:',
  '{',
  '  "productName": string|null, "brand": string|null, "packageSizeGrams": number|null,',
  '  "basis": "per100g"|"per100ml"|"perPortion", "portionGrams": number|null,',
  '  "values": { "energyKcal": number|null, "energyKj": number|null, "fat": number|null, "saturatedFat": number|null, "carbs": number|null, "sugar": number|null, "fiber": number|null, "protein": number|null, "salt": number|null },',
  '  "barcode": string|null, "uncertainFields": string[], "warnings": string[]',
  '}',
].join('\n');

/** Erstes JSON-Objekt aus der Antwort extrahieren (toleriert Code-Fences). */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/g, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) throw new Error('Vision-Antwort enthält kein JSON.');
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\') { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    if (ch === '}') {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error('Vision-Antwort enthält unvollständiges JSON.');
}

export class ClaudeVisionProvider implements VisionProvider {
  readonly name = 'claude';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  private async call(prompt: string, images: { base64: string; mimeType: string }[]): Promise<unknown> {
    const content: unknown[] = images.map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
    }));
    content.push({ type: 'text', text: prompt });

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Vision-API-Fehler (${res.status}): ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n') ?? '';
    return extractJson(text);
  }

  async analyzeMealImage(input: AnalyzeMealImageInput): Promise<MealAnalysisResult> {
    const prompt = input.hint ? `${MEAL_PROMPT}\n\nHinweis der Nutzerin/des Nutzers: ${input.hint}` : MEAL_PROMPT;
    const json = await this.call(prompt, [{ base64: input.imageBase64, mimeType: input.mimeType }]);
    const parsed = MealSchema.parse(json);
    const warnings = parsed.warnings.includes('Mengen sind nur geschätzt.')
      ? parsed.warnings
      : [...parsed.warnings, 'Mengen sind nur geschätzt.'];
    return { ...parsed, warnings, provider: this.name };
  }

  async analyzeNutritionLabel(input: AnalyzeLabelInput): Promise<LabelAnalysisResult> {
    const images = [{ base64: input.imageBase64, mimeType: input.mimeType }];
    if (input.frontImageBase64) {
      images.unshift({ base64: input.frontImageBase64, mimeType: input.mimeType });
    }
    const json = await this.call(LABEL_PROMPT, images);
    const parsed = LabelSchema.parse(json);
    return { ...parsed, provider: this.name };
  }
}
