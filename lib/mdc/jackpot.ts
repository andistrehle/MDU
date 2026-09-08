// ============================================================
// MDC — Jackpot der laufenden Saison
// ============================================================
//
// Nachgebaut aus der Arbeitsmappe des Betreibers (Blätter „Männer" und
// „Frauen", Spalte T). Gerechnet wird hier statt abgeschrieben, damit der
// Betrag mit jedem eingelesenen Turnier von selbst mitwächst — abgeschrieben
// wäre er ab dem nächsten Spielabend falsch.
//
// Die Rechnung, in derselben Reihenfolge wie in der Mappe:
//
//   Grundstock       Männer 200 €, Frauen 220 € — der Übertrag aus der
//                    Vorsaison. Vom Betreiber genannt und in den Formeln der
//                    Mappe enthalten.
//   Startgeld        3 € je Teilnahme (Blatt „Einzelergebnisse", J5). Jede
//                    Teilnahme, nicht jeder Teilnehmer: Wer viermal spielt,
//                    zahlt viermal ein.
//   Übertrag 2 %     Zwei Prozent des Männer-Topfs gehen an die Frauen. Beim
//                    Männer-Jackpot abgezogen, beim Frauen-Jackpot addiert.
//   EZR 65 %         Anteil, der über die Einzelrangliste ausgeschüttet wird.
//   Rest 35 %        Rücklage für das folgende Turnier.
//
// ABWEICHUNG VON DER MAPPE, vom Betreiber angewiesen: Im Männer-Jackpot steht
// dort einmal `+175`, gemeint war `+200`. Hier steht durchgehend 200.
//
// ZWEITE ABWEICHUNG, hier entschieden und dem Betreiber gemeldet: Die Zelle
// „Mädels2%" der Mappe rechnet `(Summe TN × Einzelergebnisse!AW13 + 175) × 2%`
// und kommt damit auf 3,50 €, weil AW13 eine leere Hilfsspalte ist. Abgezogen
// werden den Männern aber `(Summe TN × 3 + 200) × 2%`. Zwei Seiten desselben
// Übertrags müssen denselben Betrag nennen, sonst verschwindet Geld zwischen
// den Töpfen — deshalb gilt hier der abgezogene Betrag für beide Seiten.
// ============================================================

import type { Division, PayoutSummary } from '@/data/types';
import { PARSED_RUNNING_MEN, PARSED_RUNNING_WOMEN } from '@/data/players';
import { RUNNING_SEASON } from '@/data/season';

/** Startgeld je Teilnahme, das in den Jackpot fließt. */
export const STARTGELD_JE_TEILNAHME = 3;

/** Übertrag aus der Vorsaison, je Wertung. */
export const GRUNDSTOCK: Record<Division, number> = { men: 200, women: 220 };

/** Anteil, der über die Einzelrangliste ausgeschüttet wird. */
export const EZR_PROZENT = 65;

/** Anteil des Männer-Topfs, der an die Frauen geht. */
export const UEBERTRAG_PROZENT = 2;

/**
 * So oft muss man gespielt haben, um bei der Ausschüttung dabei zu sein
 * (Blatt „Einzelergebnisse", I5 — „Mindestanzahl an Teilnahmen"; vom
 * Betreiber bestätigt). In der Rangliste steht man auch mit weniger, beim
 * Geld ist man dann aber nicht dabei.
 */
export const MINDEST_TEILNAHMEN = 15;

const cent = (n: number) => Math.round(n * 100) / 100;

function zeilen(division: Division) {
  return division === 'men' ? PARSED_RUNNING_MEN : PARSED_RUNNING_WOMEN;
}

/** Teilnahmen einer Wertung — die Summe der Spalte „Anzahl TN". */
function teilnahmen(division: Division): number {
  return zeilen(division).reduce((summe, row) => summe + row.tournaments, 0);
}

/** Wie viele einer Wertung sind schon bei der Ausschüttung dabei? */
function dabei(division: Division): number {
  return zeilen(division).filter(row => row.tournaments >= MINDEST_TEILNAHMEN).length;
}

export interface JackpotStand {
  men: PayoutSummary;
  women: PayoutSummary;
  /** Teilnahmen je Wertung — Grundlage der Rechnung, gehört daneben. */
  teilnahmen: Record<Division, number>;
  /** Wie viele haben die Mindestzahl an Teilnahmen schon erreicht? */
  dabei: Record<Division, number>;
  uebertrag: number;
}

function summary(
  division: Division,
  jackpot: number,
  transferLabel: string,
  transferAmount: number,
): PayoutSummary {
  const ezrAmount = cent(jackpot * (EZR_PROZENT / 100));
  return {
    seasonId: RUNNING_SEASON.id,
    division,
    jackpot: cent(jackpot),
    ezrPercent: EZR_PROZENT,
    ezrAmount,
    // Als Differenz, nicht als zweite Prozentrechnung: So ergeben die beiden
    // Teile zusammen immer genau den Jackpot, auch nach dem Runden.
    nextTournamentAmount: cent(cent(jackpot) - ezrAmount),
    transferLabel,
    transferAmount: cent(transferAmount),
  };
}

/** Der Jackpot der laufenden Saison, aus den bisherigen Teilnahmen gerechnet. */
export function jackpotStand(): JackpotStand {
  const tnMen = teilnahmen('men');
  const tnWomen = teilnahmen('women');

  // Der Männer-Topf VOR dem Übertrag — auf diesen Betrag rechnen die 2 %.
  const topfMen = tnMen * STARTGELD_JE_TEILNAHME + GRUNDSTOCK.men;
  const uebertrag = cent(topfMen * (UEBERTRAG_PROZENT / 100));

  return {
    men: summary('men', topfMen - uebertrag, 'Mädels 2 %', uebertrag),
    women: summary(
      'women',
      tnWomen * STARTGELD_JE_TEILNAHME + GRUNDSTOCK.women + uebertrag,
      '2 % vom Männer-Jackpot',
      uebertrag,
    ),
    teilnahmen: { men: tnMen, women: tnWomen },
    dabei: { men: dabei('men'), women: dabei('women') },
    uebertrag,
  };
}
