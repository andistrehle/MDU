// ============================================================
// Saison-/Wettbewerbsbezogene Abschlussregeln & Tabellenmarkierungen
// ============================================================
//
// Zentrale, positionsbasierte Konfiguration der Auf-/Abstiegs- und
// Playoff-Qualifikationszonen je Saison + Wettbewerb. Treibt die seitlichen
// Tabellenmarkierungen, Tooltips, Legenden und Erklärtexte — damit die Logik
// NICHT in mehreren Komponenten hart verteilt liegt.
//
// Grundsatz: La/C entscheiden direkt (Auf-/Abstieg, keine Playoffs); A1/A2/B1/B2
// entscheiden nur die Playoff-QUALIFIKATION; die Playoff-Tabellen entscheiden
// endgültig. Markierung rein positionsbasiert (robust für statische UND
// importierte Tabellen). Pro Saison konfigurierbar — künftige Saisons können
// abweichen.
// ============================================================

export type OutcomeType =
  | 'promotion'           // direkter Aufstieg
  | 'relegation'          // direkter Abstieg
  | 'playoff_promotion'   // Qualifikation Aufstiegs-Playoffs
  | 'playoff_relegation'  // Qualifikation Abstiegs-Playoffs
  | 'stays'               // Verbleib in der Liga
  | 'withdrawn'           // zurückgezogen
  | 'invalid_entry';      // fehlerhafter Eintrag (nicht gewertet)

interface OutcomeZone {
  /** Plätze 1..fromTop. */
  fromTop?: number;
  /** Die letzten fromBottom Plätze. */
  fromBottom?: number;
  outcome: OutcomeType;
  label: string;
}

interface CompetitionOutcomeConfig {
  zones: OutcomeZone[];
  /** Outcome für alle nicht von einer Zone erfassten Plätze. */
  default: { outcome: OutcomeType; label: string };
  /** Zurückgezogene Teams (Override gegenüber den Positionszonen). */
  withdrawn?: { teamIds: string[]; label: string };
  /** Kurzer Erklärtext über der Tabelle. */
  note?: string;
}

const A_GROUP_NOTE =
  'A1 und A2 sind gleichwertige Gruppen der A-Liga. Die jeweils ersten drei Mannschaften qualifizierten ' +
  'sich für die Aufstiegs-Playoffs, die übrigen für die Abstiegs-Playoffs.';
const B_GROUP_NOTE =
  'B1 und B2 sind gleichwertige Gruppen der B-Liga. Die jeweils ersten drei Mannschaften qualifizierten ' +
  'sich für die Aufstiegs-Playoffs, die übrigen für die Abstiegs-Playoffs.';

/** Markierungs-/Abschlussregeln je Saison → Wettbewerb. */
export const COMPETITION_OUTCOMES: Record<string, Record<string, CompetitionOutcomeConfig>> = {
  'season-2026': {
    la: {
      zones: [{ fromBottom: 2, outcome: 'relegation', label: 'Abstieg' }],
      default: { outcome: 'stays', label: 'Verbleib in der La Liga' },
      note: 'Die letzten zwei Mannschaften steigen ab. In der La Liga fanden keine Playoffs statt.',
    },
    c: {
      zones: [{ fromTop: 3, outcome: 'promotion', label: 'Aufstieg in die B-Liga' }],
      default: { outcome: 'stays', label: 'Verbleib in der C-Liga' },
      note: 'Die ersten drei Mannschaften steigen auf. In der C Liga fanden keine Playoffs statt.',
    },
    a1: {
      zones: [{ fromTop: 3, outcome: 'playoff_promotion', label: 'Qualifikation Aufstiegs-Playoffs' }],
      default: { outcome: 'playoff_relegation', label: 'Qualifikation Abstiegs-Playoffs' },
      note: A_GROUP_NOTE,
    },
    a2: {
      zones: [{ fromTop: 3, outcome: 'playoff_promotion', label: 'Qualifikation Aufstiegs-Playoffs' }],
      default: { outcome: 'playoff_relegation', label: 'Qualifikation Abstiegs-Playoffs' },
      withdrawn: { teamIds: ['de-wolperdinga'], label: 'Zurückgezogen – keine Playoff-Teilnahme' },
      note: A_GROUP_NOTE,
    },
    b1: {
      zones: [{ fromTop: 3, outcome: 'playoff_promotion', label: 'Qualifikation Aufstiegs-Playoffs' }],
      default: { outcome: 'playoff_relegation', label: 'Qualifikation Abstiegs-Playoffs' },
      note: B_GROUP_NOTE,
    },
    b2: {
      zones: [{ fromTop: 3, outcome: 'playoff_promotion', label: 'Qualifikation Aufstiegs-Playoffs' }],
      default: { outcome: 'playoff_relegation', label: 'Qualifikation Abstiegs-Playoffs' },
      note: B_GROUP_NOTE,
    },
    'playoffs-a-aufstieg': {
      zones: [{ fromTop: 3, outcome: 'promotion', label: 'Aufstieg in die La Liga' }],
      default: { outcome: 'stays', label: 'Verbleib in der A-Liga' },
    },
    'playoffs-a-abstieg': {
      zones: [{ fromBottom: 2, outcome: 'relegation', label: 'Abstieg in die B-Liga' }],
      default: { outcome: 'stays', label: 'Verbleib in der A-Liga' },
    },
    'playoffs-b-aufstieg': {
      zones: [{ fromTop: 3, outcome: 'promotion', label: 'Aufstieg in die A-Liga' }],
      default: { outcome: 'stays', label: 'Verbleib in der B-Liga' },
    },
    'playoffs-b-abstieg': {
      zones: [{ fromBottom: 3, outcome: 'relegation', label: 'Abstieg in die C-Liga' }],
      default: { outcome: 'stays', label: 'Verbleib in der B-Liga' },
    },
  },
};

export interface RowOutcome { type: OutcomeType; label: string }

/**
 * Outcome (Markierung) einer Tabellenzeile. Gibt `null` zurück, wenn für die
 * Saison/den Wettbewerb keine Config existiert → Aufrufer nutzt den Fallback.
 */
export function getRowOutcome(
  seasonId: string,
  competitionId: string | undefined,
  pos: number,
  total: number,
  teamId?: string,
): RowOutcome | null {
  if (!competitionId) return null;
  const cfg = COMPETITION_OUTCOMES[seasonId]?.[competitionId];
  if (!cfg) return null;
  if (teamId && cfg.withdrawn?.teamIds.includes(teamId)) {
    return { type: 'withdrawn', label: cfg.withdrawn.label };
  }
  for (const z of cfg.zones) {
    if (z.fromTop != null && pos <= z.fromTop) return { type: z.outcome, label: z.label };
    if (z.fromBottom != null && pos > total - z.fromBottom) return { type: z.outcome, label: z.label };
  }
  return { type: cfg.default.outcome, label: cfg.default.label };
}

/** Erklärtext über der Tabelle (oder null). */
export function getCompetitionNote(seasonId: string, competitionId: string | undefined): string | null {
  if (!competitionId) return null;
  return COMPETITION_OUTCOMES[seasonId]?.[competitionId]?.note ?? null;
}

/** Farbe je Outcome (über CSS-Variablen-unabhängige Hex-Werte, theme-tauglich). */
export function outcomeColor(type: OutcomeType): string {
  switch (type) {
    case 'promotion':
    case 'playoff_promotion': return '#22C55E'; // grün
    case 'relegation':        return '#D40000'; // rot
    case 'playoff_relegation':return '#F59E0B'; // orange
    case 'withdrawn':         return '#9AA4B2'; // grau (zurückgezogen)
    case 'stays':             return '#6B7280'; // grau (Verbleib)
    default:                  return 'transparent';
  }
}

interface LegendEntry { type: OutcomeType; color: string; label: string }

const OUTCOME_ORDER: OutcomeType[] = [
  'promotion', 'playoff_promotion', 'playoff_relegation', 'relegation', 'stays', 'withdrawn',
];

/**
 * Baut die Legende aus den tatsächlich in der Tabelle vorkommenden Outcomes
 * (Farbe + Label), passend zum konkreten Wettbewerb. Leeres Array → kein
 * Config-Treffer (Aufrufer nutzt Fallback-Legende).
 */
export function getLegendForRows(
  seasonId: string,
  competitionId: string | undefined,
  rows: { pos: number; team: string }[],
): LegendEntry[] {
  if (!competitionId || !COMPETITION_OUTCOMES[seasonId]?.[competitionId]) return [];
  const total = rows.length;
  const byType = new Map<OutcomeType, string>();
  for (const r of rows) {
    const o = getRowOutcome(seasonId, competitionId, r.pos, total, r.team);
    if (o) byType.set(o.type, o.label);
  }
  return OUTCOME_ORDER
    .filter(t => byType.has(t))
    .map(t => ({ type: t, color: outcomeColor(t), label: byType.get(t)! }));
}
