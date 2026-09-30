// Datenform des Spielplans (Generator-Ausgabe spielplan.json bzw. daraus
// abgeleitet für 2026/27, siehe spielplanDaten27 in lib/data/saison-2027.ts).

export type Game = { home: string; away: string; venue: string; derby: boolean };
export type Matchday = { nr: number; half: 'hin' | 'rueck'; games: Game[]; bye: string | null; weekendIndex: number };
export type Weekend = { fri: string; sun: string };
export type SpielplanData = {
  generatedAt: string;
  leagues: { key: string; label: string; teams: { name: string; venue: string }[] }[];
  schedule: Record<string, Matchday[]>;
  weekends: Weekend[];
  skipped: { fri: string; label: string }[];
  maxMatchday: number;
  venueClusterObjective: number;
};
