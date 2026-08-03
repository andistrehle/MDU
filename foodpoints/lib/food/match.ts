import type { Food } from './types';
import { SEED_FOODS } from './seed-foods';

/**
 * Fuzzy-Zuordnung erkannter Lebensmittelnamen (Foto-Analyse) zu bekannten
 * Lebensmitteln. Findet sich kein plausibler Treffer, wird NICHTS erfunden —
 * der Aufrufer muss den Nutzer zuordnen lassen.
 */

const SYNONYMS: Record<string, string> = {
  bratöl: 'seed-olivenoel',
  öl: 'seed-olivenoel',
  pflanzenöl: 'seed-olivenoel',
  rapsöl: 'seed-olivenoel',
  hähnchen: 'seed-chicken-breast',
  hühnchen: 'seed-chicken-breast',
  pute: 'seed-chicken-breast',
  kartoffelchips: 'seed-chips',
  spaghetti: 'seed-pasta',
  penne: 'seed-pasta',
  brot: 'seed-vollkornbrot',
  quark: 'seed-magerquark',
  joghurt: 'seed-joghurt',
  käse: 'seed-gouda',
  zucchini: 'seed-zucchini',
  paprika: 'seed-paprika',
};

function tokenize(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-zäöüß\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((t) => t.length >= 3);
}

/**
 * Sucht das passendste Lebensmittel zu einem erkannten Namen.
 * @param candidates zusätzliche Lebensmittel (z. B. eigene des Nutzers)
 * @returns Treffer oder null (kein plausibler Treffer)
 */
export function matchFoodByName(name: string, candidates: Food[] = []): Food | null {
  const pool = [...candidates, ...SEED_FOODS];
  const tokens = tokenize(name);
  if (tokens.length === 0) return null;

  // 1. Synonym-Treffer
  for (const token of tokens) {
    const seedId = SYNONYMS[token];
    if (seedId) {
      const food = pool.find((f) => f.id === seedId);
      if (food) return food;
    }
  }

  // 2. Token-Überlappung mit Namens-Tokens
  let best: { food: Food; score: number } | null = null;
  for (const food of pool) {
    const foodTokens = tokenize(food.name);
    let score = 0;
    for (const t of tokens) {
      for (const ft of foodTokens) {
        if (ft === t) score += 2;
        else if (ft.startsWith(t) || t.startsWith(ft)) score += 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { food, score };
  }

  return best && best.score >= 2 ? best.food : null;
}
