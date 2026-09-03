// ============================================================
// MDC — Punkteschlüssel
// ============================================================
//
// ECHT. Quelle: „PUNKTESCHLÜSSEL MSDC RANKING" des Betreibers, Feldgrößen 4
// bis 32 Starter. (MSDC ist die Munich Steel Darts Challenge — dieselbe
// Serie, derselbe Schlüssel; die Steel-Wertung selbst spielt hier keine
// Rolle.) Die Tabelle steht unten Zelle für Zelle, sie ist die verbindliche
// Quelle — nicht eine Formel, die sie nachbaut.
//
// ── Wie die Tabelle aufgebaut ist ────────────────────────────
//
// Bis Platz 8 ist jeder Platz einzeln ausgespielt. Danach scheiden im
// Doppel-K.-o. mehrere im selben Durchgang aus und teilen sich Platz und
// Punkte: 9.–12., 13.–16., 17.–24., 25.–32. Die Tabelle führt deshalb nur
// die Plätze 1 bis 9 sowie 13, 17 und 25 — je nachdem, wie groß das Feld
// ist. `pointsFor` rundet einen Platz auf seine Gruppe ab.
//
// ── Gegenprobe an der Wirklichkeit ───────────────────────────
//
// Vor dieser Tabelle lag der Schlüssel nur in acht handgeschriebenen
// Ergebnislisten vor. Daraus zurückgerechnet ergab sich
//
//     Punkte ≈ max(40, round(232 − 200 × Platz / Teilnehmer))
//
// und diese Formel trifft 289 der 290 Zellen der offiziellen Tabelle. Die
// eine Ausnahme: 26 Starter, Platz 25 — Tabelle 43, Formel 40. Ob dort ein
// Rundungssprung von Hand gesetzt wurde oder ob es ein Übertragungsfehler
// ist, ist offen. Es gilt die Tabelle.
//
// Die Formel bleibt als Rückfall für Felder außerhalb 4 bis 32 stehen. So
// steht die Seite auch dann nicht ohne Punkte da, wenn einmal 35 Leute
// antreten — sie rechnet dann sichtbar nach demselben Muster weiter.
//
// ── Was der Schlüssel bedeutet ───────────────────────────────
//
//   • Der Abstand zwischen zwei Plätzen ist rund 200 / Teilnehmer. Im Feld
//     mit 4 Startern liegen 50 Punkte zwischen den Plätzen, im Feld mit 32
//     nur 6. Ein Platz weiter vorn wiegt im kleinen Feld also schwerer.
//   • Der Sieger bekommt zwischen 182 (4 Starter) und 226 (32 Starter). Ein
//     Sieg im großen Feld ist mehr wert, aber nur wenig.
//   • Nach unten ist bei 40 Punkten Schluss: Wer antritt, nimmt mindestens
//     40 mit.
//
// ── Eine Altlast, die bewusst stehen bleibt ──────────────────
//
// Die Demo-Turniere in `data/tournaments.generated.ts` wurden mit einem
// früheren, erfundenen Schlüssel erzeugt; ihre Punktzahlen passen nicht zu
// dieser Tabelle. Sie werden nicht neu gerechnet, weil dabei alle
// Turnierbäume und Ergebnislisten der Demo neu entstünden. Auf der Seite
// sind diese Turniere als Demo-Material ausgewiesen.
// ============================================================

/** Mindestpunkte fürs Antreten. */
export const MIN_POINTS = 40;

/**
 * Plätze, die eine Spalte der Tabelle führt — abhängig von der Feldgröße.
 * Alles dazwischen teilt sich den Platz davor.
 */
function placesFor(participants: number): number[] {
  const einzeln = Array.from({ length: Math.min(9, participants) }, (_, i) => i + 1);
  if (participants <= 12) return einzeln;
  if (participants <= 16) return [...einzeln, 13];
  if (participants <= 24) return [...einzeln, 13, 17];
  return [...einzeln, 13, 17, 25];
}

/**
 * Offizieller Schlüssel. Je Feldgröße die Punkte in der Reihenfolge der
 * Plätze aus `placesFor` — also 1, 2, 3, … 9, dann 13, 17, 25.
 */
const TABLE: Record<number, number[]> = {
  4:  [182, 132,  82,  40],
  5:  [192, 152, 112,  72,  40],
  6:  [199, 165, 132,  99,  65,  40],
  7:  [203, 175, 146, 118,  89,  61,  40],
  8:  [207, 182, 157, 132, 107,  82,  57,  40],
  9:  [210, 188, 165, 143, 121,  99,  76,  54,  40],
  10: [212, 192, 172, 152, 132, 112,  92,  72,  52],
  11: [214, 196, 177, 159, 141, 123, 105,  87,  68],
  12: [215, 199, 182, 165, 149, 132, 115,  99,  82],
  13: [217, 201, 186, 170, 155, 140, 124, 109,  94,  40],
  14: [218, 203, 189, 175, 161, 146, 132, 118, 103,  46],
  15: [219, 205, 192, 179, 165, 152, 139, 125, 112,  59],
  16: [220, 207, 195, 182, 170, 157, 145, 132, 120,  70],
  17: [220, 208, 197, 185, 173, 161, 150, 138, 126,  79,  40],
  18: [221, 210, 199, 188, 176, 165, 154, 143, 132,  88,  43],
  19: [221, 211, 200, 190, 179, 169, 158, 148, 137,  95,  53],
  20: [222, 212, 202, 192, 182, 172, 162, 152, 142, 102,  62],
  21: [222, 213, 203, 194, 184, 175, 165, 156, 146, 108,  70],
  22: [223, 214, 205, 196, 187, 177, 168, 159, 150, 114,  77],
  23: [223, 215, 206, 197, 189, 180, 171, 162, 154, 119,  84],
  24: [224, 215, 207, 199, 190, 182, 174, 165, 157, 124,  90],
  25: [224, 216, 208, 200, 192, 184, 176, 168, 160, 128,  96,  40],
  26: [224, 217, 209, 201, 194, 186, 178, 170, 163, 132, 101,  43],
  27: [225, 217, 210, 202, 195, 188, 180, 173, 165, 136, 106,  47],
  28: [225, 218, 211, 203, 196, 189, 182, 175, 168, 139, 111,  53],
  29: [225, 218, 211, 204, 198, 191, 184, 177, 170, 142, 115,  60],
  30: [225, 219, 212, 205, 199, 192, 185, 179, 172, 145, 119,  65],
  31: [226, 219, 213, 206, 200, 193, 187, 180, 174, 148, 122,  71],
  32: [226, 220, 213, 207, 201, 195, 188, 182, 176, 151, 126,  76],
};

/** Kleinste und größte Feldgröße, für die die Tabelle Werte führt. */
export const TABLE_RANGE = { from: 4, to: 32 } as const;

/**
 * Punkte für eine Platzierung bei gegebener Teilnehmerzahl.
 *
 * `place` ist der Platz aus der Ergebnisliste. Ein Platz mitten in einer
 * Gruppe (etwa 11 bei 27 Startern) wird auf den Gruppenplatz abgerundet —
 * genau so steht er auch auf dem Zettel.
 */
export function pointsFor(place: number, participants: number): number {
  if (place < 1 || participants < 1) return 0;

  const spalte = TABLE[participants];
  if (spalte) {
    const plaetze = placesFor(participants);
    let index = 0;
    for (let i = 0; i < plaetze.length; i++) if (plaetze[i] <= place) index = i;
    return spalte[index];
  }

  // Außerhalb der Tabelle: dasselbe Muster weitergerechnet.
  return Math.max(MIN_POINTS, Math.round(232 - (200 * place) / participants));
}

/** Platzierungsgruppen des Doppel-K.-o. — bis 8 einzeln, danach geteilt. */
const GROUPS = [1, 2, 3, 4, 5, 6, 7, 8, 12, 16, 24, 32];

/** Beschriftung der Platzierungsgruppe, z. B. „9.–12." */
export function rankGroupLabel(place: number): string {
  const index = GROUPS.findIndex(g => place <= g);
  if (index < 0) return `${place}.`;
  const from = index === 0 ? 1 : GROUPS[index - 1] + 1;
  const to = GROUPS[index];
  return from === to ? `${from}.` : `${from}.–${to}.`;
}

/** Feldgrößen, für die die Regeln-Seite die Beispieltabelle zeigt. */
export const EXAMPLE_FIELD_SIZES = [4, 8, 16, 24, 32] as const;

/**
 * Zeilen der Punktetabelle für die Regeln-Seite: je Platzierungsgruppe die
 * Punkte in den Beispiel-Feldgrößen. Plätze, die es im kleinen Feld nicht
 * gibt, bleiben leer (= 0).
 */
export function pointsTableRows(): { group: string; upTo: number; points: number[] }[] {
  return GROUPS.map((upTo, index) => {
    const from = index === 0 ? 1 : GROUPS[index - 1] + 1;
    return {
      group: rankGroupLabel(from),
      upTo,
      points: EXAMPLE_FIELD_SIZES.map(size => (from > size ? 0 : pointsFor(from, size))),
    };
  });
}

/** Kleinstmöglicher Turnierbaum (8/16/32) für eine Teilnehmerzahl. */
export function bracketSizeFor(participants: number): 8 | 16 | 32 {
  if (participants <= 8) return 8;
  if (participants <= 16) return 16;
  return 32;
}
