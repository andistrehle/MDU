// Gemeinsame Typen für Team Manager → Statistiken (Server: /api/team-statistik/detail, Browser: team-statistiken.tsx).

export interface SpielerImSpiel {
  name: string;
  /** Einzel Siege/Niederlagen, Doppel Siege/Niederlagen, Legs (nur Einzel) für/gegen */
  eS: number; eN: number; dS: number; dN: number; lp: number; lm: number;
  b180: number; b171: number;
  /** High Finishes / Short Legs (je Eintrag im Bericht ein Wert) */
  hf: number[]; sl: number[];
}
export interface SpielStat { datum: string | null; heim: boolean; bestaetigt: boolean; spieler: Record<string, SpielerImSpiel> }
