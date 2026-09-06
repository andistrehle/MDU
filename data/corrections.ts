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

export const CORRECTIONS: ResultCorrection[] = [
  {
    tournamentId: '2026-08-31-harlekin',
    insertAfterRank: 15,
    passNr: 53,
    workbookParticipants: 26,
    source: 'Ergebniszettel Harlekin, 31.08.2026',
    note:
      'In der Auswertung fehlt ein Starter: Micky Schul (Passnr. 53), auf dem ' +
      'Ergebniszettel in der Platzgruppe 13–16. Der Betreiber hat bestätigt, dass der ' +
      'Zettel stimmt — das Turnier steht hier deshalb mit 27 Startern, und alle Punkte ' +
      'sind nach dem offiziellen Schlüssel für 27 Starter gerechnet. Bis die Auswertung ' +
      'nachgezogen ist, weicht die Punktzahl um wenige Zähler von der ausgehängten ' +
      'Liste ab.',
  },
];

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
