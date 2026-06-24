// ============================================================
// OCR — erkannte Spieler mit dem Saisonkader abgleichen
// ============================================================
//
// Zuordnung primär über die Pass-/Lizenznummer (eindeutiger Schlüssel) —
// damit auch ein nur mit Vornamen eingetragener Spieler sicher erkannt wird.
// Fällt die Pass-Nr. weg oder ist sie nicht eindeutig, greift das
// Namens-Matching (normalisiert + Dice-Koeffizient). Unsichere Zuordnungen
// werden NICHT automatisch übernommen — der Nutzer bestätigt.
// ============================================================

import { normalizePlayerName } from '@/lib/data';

export interface RosterCandidate {
  id: string;
  name: string;
  /** Lizenz-/Pass-Nr. aus den Stammdaten (z. B. "MDU 26 5707"). */
  passNo?: string | null;
}

export interface NameMatch {
  detected: string | null;
  matchedPlayerId: string | null;
  matchedName: string | null;
  confidence: number;                 // 0..1
  status: 'certain' | 'review' | 'unresolved';
  /** Worüber zugeordnet wurde. */
  method: 'pass' | 'name' | 'none';
  alternatives: { id: string; name: string; score: number }[];
}

export interface MatchThresholds {
  certain: number;   // >= → sehr sicher
  review: number;    // >= → prüfen
}
export const DEFAULT_THRESHOLDS: MatchThresholds = { certain: 0.95, review: 0.8 };

/** Eindeutige Ziffernfolge einer Pass-Nr. — der längste Ziffernblock ist die
 *  eigentliche Nummer (ein Saison-Token wie "26" ist kurz und wird ignoriert).
 *  So matcht "5707" auch gegen "MDU 26 5707". */
export function normalizePass(s: string | null | undefined): string | null {
  if (!s) return null;
  const runs = s.match(/\d+/g);
  if (!runs || runs.length === 0) return null;
  return runs.reduce((a, b) => (b.length >= a.length ? b : a));
}

function tokenSorted(s: string): string {
  return normalizePlayerName(s).split(/\s+/).filter(Boolean).sort().join(' ');
}

function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

/** Sørensen-Dice-Koeffizient (0..1) zweier Strings. */
export function dice(a: string, b: string): number {
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

/** Reines Namens-Matching (Fallback, wenn keine eindeutige Pass-Nr.). */
export function matchPlayerName(
  detected: string | null,
  roster: RosterCandidate[],
  thresholds: MatchThresholds = DEFAULT_THRESHOLDS,
): NameMatch {
  const empty: NameMatch = { detected, matchedPlayerId: null, matchedName: null, confidence: 0, status: 'unresolved', method: 'none', alternatives: [] };
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
    method: status === 'unresolved' ? 'none' : 'name',
    alternatives: scored.slice(0, 3),
  };
}

/**
 * Zuordnung eines erkannten Spielers: zuerst über die Pass-Nr. (eindeutig),
 * dann über den Namen.
 */
export function matchPlayer(
  input: { name: string | null; passNo: string | null },
  roster: RosterCandidate[],
  thresholds: MatchThresholds = DEFAULT_THRESHOLDS,
): NameMatch {
  const detPass = normalizePass(input.passNo);
  if (detPass) {
    const hits = roster.filter(c => normalizePass(c.passNo) === detPass);
    if (hits.length === 1) {
      return {
        detected: input.name,
        matchedPlayerId: hits[0].id,
        matchedName: hits[0].name,
        confidence: 1,
        status: 'certain',
        method: 'pass',
        alternatives: [{ id: hits[0].id, name: hits[0].name, score: 1 }],
      };
    }
    // 0 Treffer (Nummer evtl. falsch gelesen) oder mehrdeutig → Namens-Fallback.
  }
  return matchPlayerName(input.name, roster, thresholds);
}
