// ============================================================
// OCR — erkannte Spielernamen mit dem Saisonkader abgleichen
// ============================================================
//
// Dependency-freies Fuzzy-Matching (normalisiert + Dice-Koeffizient über
// token-sortierte Bigramme) gegen die bekannten Kadernamen. Unsichere
// Zuordnungen werden NICHT automatisch übernommen — der Nutzer bestätigt.
// ============================================================

import { normalizePlayerName } from '@/lib/data';

export interface RosterCandidate {
  id: string;
  name: string;
}

export interface NameMatch {
  detected: string | null;
  matchedPlayerId: string | null;
  matchedName: string | null;
  confidence: number;                 // 0..1 (Ähnlichkeit der besten Zuordnung)
  status: 'certain' | 'review' | 'unresolved';
  alternatives: { id: string; name: string; score: number }[];
}

export interface MatchThresholds {
  certain: number;   // >= → sehr sicher
  review: number;    // >= → prüfen
}
export const DEFAULT_THRESHOLDS: MatchThresholds = { certain: 0.95, review: 0.8 };

function tokenSorted(s: string): string {
  return normalizePlayerName(s).split(/\s+/).filter(Boolean).sort().join(' ');
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

/** Sørensen-Dice-Koeffizient (0..1) zweier Strings. */
function dice(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const A = bigrams(a);
  const B = bigrams(b);
  const counts = new Map<string, number>();
  for (const x of B) counts.set(x, (counts.get(x) ?? 0) + 1);
  let inter = 0;
  for (const x of A) {
    const c = counts.get(x);
    if (c) { inter++; counts.set(x, c - 1); }
  }
  return (2 * inter) / (A.length + B.length);
}

export function matchPlayerName(
  detected: string | null,
  roster: RosterCandidate[],
  thresholds: MatchThresholds = DEFAULT_THRESHOLDS,
): NameMatch {
  const empty: NameMatch = { detected, matchedPlayerId: null, matchedName: null, confidence: 0, status: 'unresolved', alternatives: [] };
  if (!detected || !detected.trim() || roster.length === 0) return empty;

  const target = tokenSorted(detected);
  const scored = roster
    .map(c => ({ id: c.id, name: c.name, score: dice(target, tokenSorted(c.name)) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const status: NameMatch['status'] =
    best.score >= thresholds.certain ? 'certain' : best.score >= thresholds.review ? 'review' : 'unresolved';

  return {
    detected,
    matchedPlayerId: status === 'unresolved' ? null : best.id,
    matchedName: status === 'unresolved' ? null : best.name,
    confidence: Number(best.score.toFixed(3)),
    status,
    alternatives: scored.slice(0, 3),
  };
}
