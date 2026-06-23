// ============================================================
// OCR — Validierung der erkannten Ergebnisse (Spielregeln + Summen)
// ============================================================
//
// Reine Logik. Prüft Leg-Ergebnisse gegen den Spielmodus (Best of 3, in der
// La-Liga Best of 5), die feste Reihenfolge/Doppel und ob der erkannte
// Endstand zu den Einzelergebnissen passt. Gibt Hinweise zurück (error/warning),
// blockiert nichts hart — die Prüfung macht der Mensch.
// ============================================================

import type { MatchReportExtraction } from './schemas';

export interface ValidationIssue {
  fieldKey: string;
  level: 'error' | 'warning';
  message: string;
}

/** Best-of-Wert anhand der Liga (La-Liga = Best of 5, sonst Best of 3). */
export function bestOfForLeague(league: string | null | undefined): 3 | 5 {
  return (league ?? '').toLowerCase().includes('la') ? 5 : 3;
}

function targetLegs(bestOf: 3 | 5): number {
  return bestOf === 5 ? 3 : 2;
}

/** Ist ein einzelnes Leg-Ergebnis im Modus gültig (genau ein Sieger erreicht das Ziel)? */
export function isValidLegResult(legsHome: number | null, legsGuest: number | null, bestOf: 3 | 5): boolean {
  if (legsHome == null || legsGuest == null) return false;
  if (legsHome < 0 || legsGuest < 0) return false;
  const t = targetLegs(bestOf);
  const max = Math.max(legsHome, legsGuest);
  const min = Math.min(legsHome, legsGuest);
  if (max !== t) return false;              // Sieger muss genau das Ziel erreichen
  if (min >= t) return false;               // nicht beide Sieger / kein Gleichstand
  return true;
}

export function validateExtraction(data: MatchReportExtraction): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const bestOf = bestOfForLeague(data.match.league);

  if (data.documentType !== 'mdu_match_report') {
    issues.push({ fieldKey: 'documentType', level: 'error', message: 'Dokument wurde nicht eindeutig als MDU-Spielbericht erkannt.' });
  }

  if (data.games.length !== 18) {
    issues.push({ fieldKey: 'games', level: 'warning', message: `Es wurden ${data.games.length} statt 18 Begegnungen erkannt.` });
  }
  const doubles = data.games.filter(g => g.type === 'double').map(g => g.gameNo).sort((a, b) => a - b);
  if (!(doubles.length === 2 && doubles[0] === 9 && doubles[1] === 18)) {
    issues.push({ fieldKey: 'games.doubles', level: 'warning', message: 'Doppel sollten Nr. 9 (Mitte) und Nr. 18 (Ende) sein.' });
  }

  let homeWins = 0;
  let guestWins = 0;
  for (const g of data.games) {
    const both = g.legsHome != null && g.legsGuest != null;
    if (!both) continue;
    if (!isValidLegResult(g.legsHome, g.legsGuest, bestOf)) {
      issues.push({ fieldKey: `game.${g.gameNo}.legs`, level: 'error', message: `Spiel ${g.gameNo}: ungültiges Leg-Ergebnis ${g.legsHome}:${g.legsGuest} (Best of ${bestOf}).` });
      continue;
    }
    if (g.legsHome! > g.legsGuest!) homeWins++; else guestWins++;
  }

  const fs = data.finalScore;
  if (fs.home != null && fs.guest != null) {
    if (fs.home !== homeWins || fs.guest !== guestWins) {
      issues.push({
        fieldKey: 'finalScore',
        level: 'error',
        message: `Der eingetragene Endstand ${fs.home}:${fs.guest} stimmt nicht mit den Einzelergebnissen ${homeWins}:${guestWins} überein.`,
      });
    }
  }

  return issues;
}

/** Aus den erkannten Spielen berechneter Spielstand (Sieger je Begegnung). */
export function computedScore(data: MatchReportExtraction): { home: number; guest: number } {
  let home = 0, guest = 0;
  for (const g of data.games) {
    if (g.legsHome == null || g.legsGuest == null) continue;
    if (g.legsHome > g.legsGuest) home++; else if (g.legsGuest > g.legsHome) guest++;
  }
  return { home, guest };
}
