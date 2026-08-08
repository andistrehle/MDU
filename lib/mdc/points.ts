// ============================================================
// MDC — Punkteschlüssel
// ============================================================
//
// Grundgedanke der Serie: Ein Sieg in einem großen Feld ist mehr wert als
// einer in einem kleinen. Deshalb skalieren die Punkte linear mit der Zahl
// der gemeldeten Spieler.
//
//   Punkte = round( Teilnehmer × Punktwert(Platz) / 100 )
//
// `Punktwert` ist der Wert je 100 gemeldeter Spieler. Die Plätze sind — wie im
// Doppel-K.-o. üblich — in Gruppen zusammengefasst: Wer im selben Durchgang
// ausscheidet, bekommt dieselbe Punktzahl.
//
// Beispiel (20 Teilnehmer): 1. = 221, 2. = 211, 3. = 200, 4. = 190 Punkte.
// ============================================================

/** Punktwert je 100 gemeldeter Spieler, nach Platzierungsgruppe. */
const POINT_TABLE: { upTo: number; value: number }[] = [
  { upTo: 1,  value: 1105 },
  { upTo: 2,  value: 1055 },
  { upTo: 3,  value: 1000 },
  { upTo: 4,  value: 950 },
  { upTo: 6,  value: 850 },
  { upTo: 8,  value: 750 },
  { upTo: 12, value: 600 },
  { upTo: 16, value: 450 },
  { upTo: 24, value: 300 },
  { upTo: 32, value: 200 },
];

/** Punkte für eine Platzierung bei gegebener Teilnehmerzahl. */
export function pointsFor(rank: number, participants: number): number {
  const row = POINT_TABLE.find(r => rank <= r.upTo);
  if (!row) return 0;
  return Math.round((participants * row.value) / 100);
}

/** Beschriftung der Platzierungsgruppe, z. B. „5.–6." */
export function rankGroupLabel(rank: number): string {
  const index = POINT_TABLE.findIndex(r => rank <= r.upTo);
  if (index < 0) return `${rank}.`;
  const from = index === 0 ? 1 : POINT_TABLE[index - 1].upTo + 1;
  const to = POINT_TABLE[index].upTo;
  return from === to ? `${from}.` : `${from}.–${to}.`;
}

/** Feldgrößen, für die die Regeln-Seite die Beispieltabelle zeigt. */
export const EXAMPLE_FIELD_SIZES = [8, 16, 20, 24, 32] as const;

/** Zeilen der Punktetabelle für die Regeln-Seite. */
export function pointsTableRows(): { group: string; upTo: number; points: number[] }[] {
  return POINT_TABLE.map((row, index) => {
    const from = index === 0 ? 1 : POINT_TABLE[index - 1].upTo + 1;
    return {
      group: rankGroupLabel(from),
      upTo: row.upTo,
      points: EXAMPLE_FIELD_SIZES.map(size =>
        // Plätze, die es im kleinen Feld gar nicht gibt, bleiben leer (= 0).
        from > size ? 0 : pointsFor(from, size),
      ),
    };
  });
}

/** Kleinstmöglicher Turnierbaum (8/16/32) für eine Teilnehmerzahl. */
export function bracketSizeFor(participants: number): 8 | 16 | 32 {
  if (participants <= 8) return 8;
  if (participants <= 16) return 16;
  return 32;
}
