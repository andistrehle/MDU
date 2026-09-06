// ============================================================
// MDC — bekannte Abweichungen zwischen Zettel und Auswertung
// ============================================================
//
// Die Webseite zeigt IMMER den Stand der Arbeitsmappe des Betreibers. Sie
// rechnet nichts um und trägt nichts nach — sonst gäbe es zwei Wahrheiten:
// die Rangliste, die der Betreiber aushängt, und eine andere hier.
//
// Fällt beim Vergleich mit einem Ergebniszettel trotzdem eine Abweichung auf,
// steht sie hier — und wird bei dem betroffenen Turnier ausgewiesen, statt
// stillschweigend die eine oder andere Seite zu bevorzugen. Erledigt wird so
// ein Eintrag in der Mappe, nicht hier: Der Betreiber korrigiert dort, die
// Mappe wird neu eingelesen, der Eintrag verschwindet.
//
// `scripts/mdc-check-saison.ts` prüft bei jedem Lauf, ob eine Abweichung noch
// besteht, und meldet sich, sobald sie behoben ist.
// ============================================================

export interface OpenCorrection {
  /** Turnier-ID, z. B. „2026-08-31-harlekin". */
  tournamentId: string;
  /** Starterzahl, die die Auswertung des Betreibers führt. */
  participantsInWorkbook: number;
  /** Starterzahl laut Ergebniszettel. */
  participantsOnSheet: number;
  /** Was auf der Webseite beim Turnier steht. */
  note: string;
}

export const OPEN_CORRECTIONS: OpenCorrection[] = [
  {
    tournamentId: '2026-08-31-harlekin',
    participantsInWorkbook: 26,
    participantsOnSheet: 27,
    note:
      'Auf dem handschriftlichen Ergebniszettel stand ein Starter mehr: Micky Schul ' +
      '(Passnr. 53) auf Platz 13. Die Auswertung führt das Turnier mit 26 Startern — ' +
      'und damit für alle anderen ein bis vier Punkte weniger, weil der Punkteschlüssel ' +
      'an der Feldgröße hängt. Der Betreiber geht von einem Übertragungsfehler aus; ' +
      'bis die Auswertung nachgezogen ist, steht hier ihr Stand.',
  },
];

const BY_TOURNAMENT = new Map<string, OpenCorrection[]>();
for (const eintrag of OPEN_CORRECTIONS) {
  BY_TOURNAMENT.set(eintrag.tournamentId, [
    ...(BY_TOURNAMENT.get(eintrag.tournamentId) ?? []), eintrag,
  ]);
}

export function correctionsFor(tournamentId: string): OpenCorrection[] {
  return BY_TOURNAMENT.get(tournamentId) ?? [];
}
