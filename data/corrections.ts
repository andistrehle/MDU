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

// ------------------------------------------------------------
// Zweite Art: die verwechselte Passnummer
// ------------------------------------------------------------
//
// Kommt vor: Auf dem Zettel steht eine Nummer, in der Mappe landet eine
// andere — ein Ziffernddreher, und schon bekommt der Falsche die Punkte. Hier
// wird NUR die Nummer getauscht: Platz, Punkte und Feldgröße bleiben, wie sie
// sind. Es ändert sich also nichts an der Rangfolge des Turniers, nur daran,
// WEM die Zeile gehört.
//
// Absichtlich eine eigene Liste und kein Sonderfall der Ergänzung oben: Dort
// wird das ganze Turnier neu durchgerechnet, was hier falsch wäre.

export interface PassNrCorrection {
  /** Turnier-ID, z. B. „2026-09-07-harlekin". */
  tournamentId: string;
  /** Die Nummer, wie sie in der Mappe steht. */
  falschePassNr: number;
  /** Die Nummer, die es sein muss. */
  passNr: number;
  /** Woher die Berichtigung kommt. */
  source: string;
  /** Hinweis, der beim Turnier und bei der Wertung steht. */
  note: string;
}

export const PASS_KORREKTUREN: PassNrCorrection[] = [
  {
    tournamentId: '2026-09-07-harlekin',
    falschePassNr: 57,
    passNr: 67,
    source: 'Vom Betreiber gemeldet am 12.09.2026 (Zahlendreher beim Übertragen).',
    // Ohne den Satz „Punkte bleiben gleich" — der steht als `folge` schon in
    // `BERICHTIGUNGS_HINWEISE` und stünde sonst zweimal untereinander.
    note: 'Die Zeile auf Platz 18 lief auf Passnr. 57 (Peter Seidl); richtig ist '
      + 'Passnr. 67 (Cheyenne Fuss).',
  },
];

const BY_TOURNAMENT = new Map<string, ResultCorrection[]>();
for (const eintrag of CORRECTIONS) {
  BY_TOURNAMENT.set(eintrag.tournamentId, [
    ...(BY_TOURNAMENT.get(eintrag.tournamentId) ?? []), eintrag,
  ]);
}

const PASS_BY_TOURNAMENT = new Map<string, PassNrCorrection[]>();
for (const eintrag of PASS_KORREKTUREN) {
  PASS_BY_TOURNAMENT.set(eintrag.tournamentId, [
    ...(PASS_BY_TOURNAMENT.get(eintrag.tournamentId) ?? []), eintrag,
  ]);
}

export function correctionsFor(tournamentId: string): ResultCorrection[] {
  return BY_TOURNAMENT.get(tournamentId) ?? [];
}

export function passKorrekturenFor(tournamentId: string): PassNrCorrection[] {
  return PASS_BY_TOURNAMENT.get(tournamentId) ?? [];
}

/** Gibt es überhaupt Berichtigungen? Steuert die Hinweise in der Oberfläche. */
export const HAS_CORRECTIONS = CORRECTIONS.length > 0 || PASS_KORREKTUREN.length > 0;

/**
 * Alle Berichtigungen in einer Form, die die Oberfläche anzeigen kann — mit
 * je eigenem Satz, weil das eine die Punkte verschiebt und das andere nicht.
 */
export const BERICHTIGUNGS_HINWEISE: {
  tournamentId: string;
  note: string;
  folge: string;
}[] = [
  ...CORRECTIONS.map(k => ({
    tournamentId: k.tournamentId,
    note: k.note,
    folge: 'Dadurch weichen einzelne Punktzahlen und Plätze von der ausgehängten Liste ab.',
  })),
  ...PASS_KORREKTUREN.map(k => ({
    tournamentId: k.tournamentId,
    note: k.note,
    folge: 'Punkte und Plätze des Turniers bleiben dieselben — nur die Zeile gehört jemand anderem.',
  })),
];
