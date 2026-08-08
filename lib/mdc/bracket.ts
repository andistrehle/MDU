// ============================================================
// MDC — Turnierbaum (Doppel-K.-o.)
// ============================================================
//
// Baut aus einer Endplatzierungsliste einen vollständigen Double-Elimination-
// Baum für 8, 16 oder 32 Plätze — Winner Bracket, Loser Bracket und Finale.
//
// Wie ehrlich ist das? Der Baum ist eine plausible REKONSTRUKTION, kein
// Mitschnitt: Die Demo hat keine echten Spielprotokolle. Gesetzt wird nach
// Endplatzierung, und in jedem Spiel gewinnt der am Ende besser Platzierte.
// Podium, Ergebnisliste und Baum widersprechen sich dadurch nie. Sobald es
// echte Match-Daten gibt (`Match` in `data/types.ts`), ersetzt man einfach
// `simulate()` durch die gespeicherten Ergebnisse — die Struktur bleibt.
//
// Freilose: Bei 20 Spielern in einem 32er-Baum bleiben 12 Plätze leer. Sie
// laufen als `null` durch den Baum und werden als „Freilos" gezeichnet, genau
// wie auf einem Papier-Spielplan.
// ============================================================

import type { BracketSide } from '@/data/types';

export interface BracketMatch {
  id: string;
  side: BracketSide;
  round: number;
  position: number;
  playerAId: string | null;
  playerBId: string | null;
  winnerId: string | null;
  loserId: string | null;
  legsA: number | null;
  legsB: number | null;
  /** Nur ein Spieler besetzt → kampflos weiter. */
  bye: boolean;
}

export interface BracketRound {
  side: BracketSide;
  round: number;
  label: string;
  matches: BracketMatch[];
}

export interface Bracket {
  size: 8 | 16 | 32;
  /** Tatsächlich gemeldete Spieler (ohne Freilose). */
  entrants: number;
  winner: BracketRound[];
  loser: BracketRound[];
  final: BracketRound;
}

// ------------------------------------------------------------
// Setzliste
// ------------------------------------------------------------

/**
 * Klassische Setzreihenfolge: 1 gegen den Letzten, 2 gegen den Vorletzten usw.
 * Aufgebaut wie beim Papier-Spielplan — Setzlisten-Nummern in Baumreihenfolge.
 * `seedOrder(8)` → [1, 8, 5, 4, 3, 6, 7, 2]
 */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const round = order.length * 2;
    const next: number[] = [];
    for (const seed of order) {
      next.push(seed, round + 1 - seed);
    }
    order = next;
  }
  return order;
}

// ------------------------------------------------------------
// Deterministische Legs (gleiche Zahlen bei jedem Rendern)
// ------------------------------------------------------------

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

/** Best of 5 (erste 3 Legs gewinnen) — Standardmodus der MDC-Ranglistenturniere. */
function legsFor(matchId: string): { winner: number; loser: number } {
  const r = hash(matchId);
  return { winner: 3, loser: r < 0.42 ? 1 : r < 0.78 ? 2 : 0 };
}

// ------------------------------------------------------------
// Baum bauen
// ------------------------------------------------------------

function roundLabel(side: BracketSide, round: number, totalRounds: number): string {
  if (side === 'final') return 'Finale';
  const prefix = side === 'winner' ? 'WB' : 'LB';
  if (round === totalRounds) return `${prefix}-Finale`;
  if (round === totalRounds - 1) return `${prefix}-Halbfinale`;
  if (side === 'winner' && round === totalRounds - 2) return `${prefix}-Viertelfinale`;
  return `${prefix} Runde ${round}`;
}

/**
 * @param orderedPlayerIds Spieler-IDs in der Endplatzierung (Sieger zuerst).
 * @param size Baumgröße (8, 16 oder 32).
 */
export function buildBracket(orderedPlayerIds: string[], size: 8 | 16 | 32): Bracket {
  // Stärke = Position in der Endplatzierung. Kleiner ist besser.
  const strength = new Map(orderedPlayerIds.map((id, i) => [id, i]));
  const better = (a: string | null, b: string | null): string | null => {
    if (a === null) return b;
    if (b === null) return a;
    return (strength.get(a) ?? Infinity) <= (strength.get(b) ?? Infinity) ? a : b;
  };

  // Startplätze nach Setzliste füllen; überzählige Plätze bleiben leer (Freilos).
  const slots: (string | null)[] = seedOrder(size).map(seed => orderedPlayerIds[seed - 1] ?? null);

  let matchCounter = 0;
  const makeMatch = (
    side: BracketSide, round: number, position: number,
    a: string | null, b: string | null,
  ): BracketMatch => {
    const id = `m${++matchCounter}-${side}-${round}-${position}`;
    const winnerId = better(a, b);
    const loserId = winnerId === null ? null : winnerId === a ? b : a;
    const bye = (a === null) !== (b === null);
    const legs = legsFor(id);
    const played = a !== null && b !== null;
    return {
      id, side, round, position,
      playerAId: a, playerBId: b, winnerId, loserId,
      legsA: played ? (winnerId === a ? legs.winner : legs.loser) : null,
      legsB: played ? (winnerId === b ? legs.winner : legs.loser) : null,
      bye,
    };
  };

  const pairUp = (side: BracketSide, round: number, players: (string | null)[]): BracketMatch[] =>
    Array.from({ length: Math.ceil(players.length / 2) }, (_, i) =>
      makeMatch(side, round, i, players[i * 2] ?? null, players[i * 2 + 1] ?? null),
    );

  // ── Winner Bracket ──
  const wbRoundCount = Math.log2(size);
  const winnerRounds: BracketRound[] = [];
  const wbLosersByRound: (string | null)[][] = [];

  let wbField: (string | null)[] = slots;
  for (let round = 1; round <= wbRoundCount; round++) {
    const matches = pairUp('winner', round, wbField);
    winnerRounds.push({
      side: 'winner', round,
      label: roundLabel('winner', round, wbRoundCount),
      matches,
    });
    wbLosersByRound.push(matches.map(m => m.loserId));
    wbField = matches.map(m => m.winnerId);
  }
  const wbChampion = wbField[0] ?? null;

  // ── Loser Bracket ──
  // Aufbau wie im Standard-Doppel-K.-o.: Eine „große" Runde (die Verlierer
  // spielen untereinander) wechselt sich mit einer „kleinen" Runde ab, in der
  // die frisch aus dem Winner Bracket Gefallenen dazustoßen. Deren Reihenfolge
  // wird gespiegelt, damit es möglichst wenig sofortige Neuauflagen gibt.
  const lbRoundCount = 2 * (wbRoundCount - 1);
  const loserRounds: BracketRound[] = [];
  let lbRound = 0;

  let lbField: (string | null)[] = wbLosersByRound[0];
  const pushRound = (matches: BracketMatch[]) => {
    loserRounds.push({
      side: 'loser', round: lbRound,
      label: roundLabel('loser', lbRound, lbRoundCount),
      matches,
    });
    lbField = matches.map(m => m.winnerId);
  };

  lbRound = 1;
  pushRound(pairUp('loser', lbRound, lbField));

  for (let wbRound = 2; wbRound <= wbRoundCount; wbRound++) {
    // Kleine Runde: LB-Sieger gegen die Absteiger aus dem Winner Bracket.
    const dropouts = [...wbLosersByRound[wbRound - 1]].reverse();
    lbRound++;
    const merged = Array.from({ length: Math.max(lbField.length, dropouts.length) }, (_, i) =>
      makeMatch('loser', lbRound, i, lbField[i] ?? null, dropouts[i] ?? null),
    );
    pushRound(merged);

    // Große Runde: die Sieger unter sich — solange mehr als einer übrig ist.
    if (lbField.length > 1) {
      lbRound++;
      pushRound(pairUp('loser', lbRound, lbField));
    }
  }
  const lbChampion = lbField[0] ?? null;

  // ── Finale ──
  const finalMatch = makeMatch('final', 1, 0, wbChampion, lbChampion);
  const final: BracketRound = { side: 'final', round: 1, label: 'Finale', matches: [finalMatch] };

  return {
    size,
    entrants: orderedPlayerIds.length,
    winner: winnerRounds,
    loser: loserRounds,
    final,
  };
}
