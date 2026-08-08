// ============================================================
// Munich Dart Challenge (MDC) — Typen der Demo-Datenschicht
// ============================================================
//
// Die MDC ist ein EIGENSTÄNDIGES Projekt neben der Münchner Dart Union:
// eigene Spieler, eigene Passnummern, eigene Datenstruktur. Es gibt bewusst
// KEINE Verknüpfung zu den MDU-Daten (`lib/data*`) — nur Links zwischen den
// beiden Webseiten.
//
// Alles hier ist Demo-/Mockmaterial. Die Typen sind aber schon so geschnitten,
// dass sie 1:1 auf Supabase-Tabellen abbildbar sind (siehe `lib/mdc/data-source.ts`):
// flache Datensätze, stabile String-IDs, Fremdschlüssel statt verschachtelter
// Objekte, Datumsangaben als ISO-String.
// ============================================================

/** Richtung im Ranking gegenüber dem letzten Stand. */
export type Trend = 'up' | 'down' | 'same' | 'new';

/** Wochentag als Zahl (1 = Montag … 7 = Sonntag) — passend zu ISO-8601. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Wertungsklasse. Männer und Frauen spielen dieselben Turniere, werden am
 * Saisonende aber in zwei getrennten Tabellen mit eigener Ausschüttung geführt.
 */
export type Division = 'men' | 'women';

// ------------------------------------------------------------
// Spieler
// ------------------------------------------------------------

export interface Player {
  /** Stabile Slug-ID, wird in URLs benutzt: /mdc/spieler/<id> */
  id: string;
  /** MDC-Passnummer — eigenständig, hat nichts mit MDU-Nummern zu tun. */
  passNr: number;
  firstName: string;
  lastName: string;
  /** Spitzname aus der Rangliste (steht dort in Klammern). `null` = keiner. */
  nickname: string | null;
  division: Division;
  /**
   * Foto-URL. In der Demo überall `null` → die Oberfläche zeigt einen
   * generierten Initialen-Avatar statt eines erfundenen Gesichts.
   */
  photoUrl: string | null;
  /**
   * Stammlokal, sofern bekannt. Die MDC führt Spieler ohne bekannten Nachnamen
   * unter dem Namen ihres Lokals („Legendary Armin", „RG Gerd") — daraus lässt
   * sich das Stammlokal sicher ableiten. Sonst `null`; nichts wird geraten.
   */
  homeVenueId: string | null;
}

// ------------------------------------------------------------
// Spielorte
// ------------------------------------------------------------

export interface Venue {
  id: string;
  name: string;
  street: string;
  zip: string;
  city: string;
  district: string;
  /** Spieltag des wöchentlichen Turniers. */
  weekday: Weekday;
  /** Startzeit „HH:MM". */
  time: string;
  phone: string;
  /** Anzahl Dartautomaten. */
  boards: number;
  /** Kurzbeschreibung fürs Karten-Layout. */
  description: string;
  /** Schlagworte („Boazn", „Sportsbar", …). */
  tags: string[];
}

// ------------------------------------------------------------
// Turniere
// ------------------------------------------------------------

/** Turnierbaum-Größen, die die MDC ausspielt. */
export type BracketSize = 8 | 16 | 32;

export type TournamentStatus = 'upcoming' | 'running' | 'finished';

/** Seite des Turnierbaums. */
export type BracketSide = 'winner' | 'loser' | 'final';

export interface Match {
  id: string;
  tournamentId: string;
  side: BracketSide;
  /** Runde innerhalb der Seite, 1-basiert. */
  round: number;
  /** Position innerhalb der Runde, 0-basiert (von oben). */
  position: number;
  /** Spieler-ID oder null (Freilos / noch nicht qualifiziert). */
  playerAId: string | null;
  playerBId: string | null;
  legsA: number | null;
  legsB: number | null;
  winnerId: string | null;
  /** Freilos: Spieler A kommt kampflos weiter. */
  bye: boolean;
}

export interface TournamentResult {
  /** Endplatzierung, 1-basiert. Geteilte Plätze bekommen den besseren Wert. */
  rank: number;
  playerId: string;
  /** Punkte fürs Saisonranking. */
  points: number;
  /** Gewonnene / verlorene Legs über das gesamte Turnier. */
  legsWon: number;
  legsLost: number;
}

export interface Tournament {
  id: string;
  /** Turnierserie, z. B. „Sommer-Ranking". */
  series: string;
  /** Anzeigename, z. B. „Sommer-Ranking #12". */
  name: string;
  venueId: string;
  /** ISO-Datum „YYYY-MM-DD". */
  date: string;
  /** Startzeit „HH:MM". */
  time: string;
  status: TournamentStatus;
  /** Meldeschluss-Kapazität (4–32). */
  maxPlayers: number;
  /** Gemeldete Spieler-IDs. Bei `upcoming` = aktueller Meldestand. */
  participantIds: string[];
  /** Endergebnis — leer, solange das Turnier nicht beendet ist. */
  results: TournamentResult[];
  /** Baumgröße (nächste Zweierpotenz über der Teilnehmerzahl). */
  bracketSize: BracketSize;
  /** Startgeld in Euro. */
  entryFee: number;
}

// ------------------------------------------------------------
// Ranking
// ------------------------------------------------------------

export interface RankingEntry {
  rank: number;
  /** Punktgleich mit der Zeile darüber → geteilter Platz. */
  sharedRank: boolean;
  /** Platz beim vorherigen Stand — für den Trendpfeil. `null` = neu dabei. */
  previousRank: number | null;
  trend: Trend;
  playerId: string;
  points: number;
  /** Anzahl gewerteter Turniere. */
  tournaments: number;
  /** Punkteschnitt pro Turnier. */
  average: number;
  /** Beste Einzelplatzierung der Saison. */
  bestFinish: number;
  /** Anzahl Turniersiege. */
  wins: number;
  /**
   * Anteil an der Saison-Ausschüttung in Prozent (nur die vorderen Plätze).
   * Entspricht der Spalte „%" in der offiziellen MDC-Endrangliste.
   */
  payoutPercent?: number;
  /** Ausgeschütteter Betrag in Euro — Spalte „€" der Endrangliste. */
  payoutEuro?: number;
}

/**
 * Ausschüttung am Saisonende. In der offiziellen MDC-Endrangliste steht das
 * als Kasten neben der Tabelle (Jackpot, EZR 65 %, folgendes Turnier, Mädels 2 %).
 */
export interface PayoutSummary {
  seasonId: string;
  division: Division;
  /** Gesamter Jackpot in Euro. */
  jackpot: number;
  /** Einzelranglisten-Anteil (EZR): Prozentsatz und Betrag. */
  ezrPercent: number;
  ezrAmount: number;
  /** Rücklage fürs folgende Turnier (der Rest des Jackpots). */
  nextTournamentAmount: number;
  /** Übertrag zwischen den beiden Ranglisten — Beschriftung und Betrag. */
  transferLabel: string;
  transferAmount: number;
}

/** Saison-Kopfdaten — bereitet das spätere Saisonarchiv vor. */
export interface Season {
  id: string;
  label: string;
  /** ISO-Datum. */
  startDate: string;
  endDate: string;
  /** Stand der Rangliste (ISO-Datum). */
  asOf: string;
  current: boolean;
}
