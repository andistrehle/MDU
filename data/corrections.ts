// ============================================================
// MDC — Berichtigungen gegenüber der Arbeitsmappe
// ============================================================
//
// Normalfall: Die Webseite zeigt genau den Stand der Arbeitsmappe und rechnet
// nichts um. Hier stehen die Ausnahmen — Turniere, bei denen der
// handschriftliche Ergebniszettel etwas anderes sagt als die Auswertung UND
// der Betreiber entschieden hat, dass der Zettel stimmt.
//
// Was eine Berichtigung tut:
//
//   • Sie fügt die fehlende Zeile an ihrer Stelle ein (`insertAfterRank`).
//   • Danach wird das ganze Turnier neu durchnummeriert und JEDE Punktzahl
//     aus `pointsFor(Platz, Feldgröße)` neu gerechnet — der Schlüssel hängt an
//     der Feldgröße, ein Starter mehr ändert deshalb alle Punkte.
//   • Die Wertung der Saison wird aus den so berichtigten Ergebnissen
//     aufaddiert, nicht aus der Punktespalte der Auswertung.
//
// Die erzeugten Dateien (`results-*.generated.ts`) bleiben unangetastet — sie
// sind die Mappe. Die Berichtigung liegt daneben und übersteht damit jeden
// neuen Import.
//
// Erledigt wird eine Berichtigung, indem der Betreiber die Zeile in der Mappe
// nachträgt. `scripts/mdc-check-saison.ts` meldet dann „ERLEDIGT" und der
// Eintrag hier kann weg.
// ============================================================

export interface ResultCorrection {
  /** Turnier-ID, z. B. „2026-08-31-harlekin". */
  tournamentId: string;
  /** Nach welchem Platz der Auswertung die Zeile gehört (laut Zettel). */
  insertAfterRank: number;
  /** Passnummer der fehlenden Person. */
  passNr: number;
  /** Starterzahl, die die Auswertung führt — zum Erkennen, wann es erledigt ist. */
  workbookParticipants: number;
  /** Woher die Berichtigung kommt. */
  source: string;
  /** Hinweis, der beim Turnier und bei der Wertung steht. */
  note: string;
}

// Zurzeit keine. Die bisher einzige — im Harlekin am 31.08.2026 fehlte Micky
// Schul (Passnr. 53) — hat der Betreiber am 06.09.2026 in der Mappe
// nachgetragen; seitdem kommt das Turnier wieder unverändert von dort.
export const CORRECTIONS: ResultCorrection[] = [];

const BY_TOURNAMENT = new Map<string, ResultCorrection[]>();
for (const eintrag of CORRECTIONS) {
  BY_TOURNAMENT.set(eintrag.tournamentId, [
    ...(BY_TOURNAMENT.get(eintrag.tournamentId) ?? []), eintrag,
  ]);
}

export function correctionsFor(tournamentId: string): ResultCorrection[] {
  return BY_TOURNAMENT.get(tournamentId) ?? [];
}

/** Gibt es überhaupt Berichtigungen? Steuert die Hinweise in der Oberfläche. */
export const HAS_CORRECTIONS = CORRECTIONS.length > 0;
