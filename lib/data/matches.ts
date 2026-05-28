// ============================================================
// Match Data — Münchner Dart Union · Saison 2026
// ============================================================
//
// Sources:
//   • PDF-extracted match data (mdu_matches_from_pdfs.ts, 22.05.2026)
//   • dartunion.de static HTML (Pokal section)
//
// ── How to add a match ────────────────────────────────────────
//   Scheduled:  status: 'scheduled', result: null, date: 'YYYY-MM-DD' or null
//   Completed:  status: 'completed', result: { home: N, away: N }
//               home + away must sum to 18
//
// ── Liga-Codes (leagueId) ─────────────────────────────────────
//   la                    La Liga
//   c                     C Liga
//   playoffs-a-aufstieg   Playoffs A Liga Aufstieg
//   playoffs-a-abstieg    Playoffs A Liga Abstieg
//   playoffs-b-aufstieg   Playoffs B Liga Aufstieg
//   playoffs-b-abstieg    Playoffs B Liga Abstieg
//   pokal-2026            Pokal Fight 2026
//
// ── Team-IDs ─────────────────────────────────────────────────
//  La Liga:    spartans · ohne-jackie · jolly-pirates-kts
//              dc-null-bull · no-maam · les-dartagnons
//  C Liga:     wild-indians · muenchen-0815 · lucky-darts-two
//              funny-darters · black-devils · fuenf-sterne-boazn
//  PA Auf:     alptraum · dc-animals-ii · gambas
//              silberpfeile-ii · treff-nix-freimann · jolly-pirates-v
//  PA Abs:     spartans-vi · sound-warriors · game-over · oldies-co
//  PB Auf:     flying-seven · flying-fighters · freibad-bazis
//              fiaker-deife · master-of-desaster · belfort-evolution
//  PB Abs:     team-desaster · de-vogelwuidn · dc-dark-angels
//              massl-ghabt · de-hutzeldarter · lucky-darts-one
// ─────────────────────────────────────────────────────────────

import importedRaw from './imported-matches.json';

export type MatchStatus =
  | 'scheduled'
  | 'completed'
  | 'postponed'
  | 'cancelled';

export interface MatchResult {
  home: number;
  away: number;
}

export interface Match {
  /** Stable unique ID */
  id: string;
  seasonId: string;
  leagueId: string;
  matchday?: number;
  round?: 'hinrunde' | 'rueckrunde' | 'playoff';
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  /** ISO date "YYYY-MM-DD" or null when not yet scheduled */
  date: string | null;
  /** Time "HH:MM" or null */
  time: string | null;
  status: MatchStatus;
  result: MatchResult | null;
  sourceUrl?: string;
}

// ── Match data ────────────────────────────────────────────────

const STATIC_MATCHES: Match[] = [

  // ════════════════════════════════════════════════════════════
  // POKAL FIGHT 2026
  // ════════════════════════════════════════════════════════════
  { id: 'pokal-2026-r02-001', seasonId: 'season-2026', leagueId: 'pokal-2026', matchday: 2, round: 'rueckrunde', homeTeamId: 'de-vogelwuidn', awayTeamId: 'lucky-darts-one', homeTeamName: "De Vogelwuid'n", awayTeamName: 'Lucky Darts One', date: '2026-01-18', time: null, status: 'completed', result: { home: 9, away: 9 }, sourceUrl: 'https://dartunion.de' },
  { id: 'pokal-2026-r02-002', seasonId: 'season-2026', leagueId: 'pokal-2026', matchday: 2, round: 'rueckrunde', homeTeamId: 'game-over', awayTeamId: 'treff-nix-freimann', homeTeamName: 'Game Over', awayTeamName: 'Treff Nix Freimann', date: '2026-01-18', time: null, status: 'completed', result: { home: 14, away: 4 }, sourceUrl: 'https://dartunion.de' },
  { id: 'pokal-2026-r01-001', seasonId: 'season-2026', leagueId: 'pokal-2026', matchday: 1, round: 'hinrunde', homeTeamId: 'lucky-darts-one', awayTeamId: 'de-vogelwuidn', homeTeamName: 'Lucky Darts One', awayTeamName: "De Vogelwuid'n", date: '2025-12-07', time: null, status: 'completed', result: { home: 10, away: 8 }, sourceUrl: 'https://dartunion.de' },
  { id: 'pokal-2026-r01-002', seasonId: 'season-2026', leagueId: 'pokal-2026', matchday: 1, round: 'hinrunde', homeTeamId: 'treff-nix-freimann', awayTeamId: 'game-over', homeTeamName: 'Treff Nix Freimann', awayTeamName: 'Game Over', date: '2025-12-07', time: null, status: 'completed', result: { home: 6, away: 12 }, sourceUrl: 'https://dartunion.de' },

  // ════════════════════════════════════════════════════════════
  // LA LIGA 2026
  // ════════════════════════════════════════════════════════════
  { id: 'la-01-1', seasonId: 'season-2026', leagueId: 'la', matchday: 1, round: 'hinrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'DC Null Bull', awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'la-01-2', seasonId: 'season-2026', leagueId: 'la', matchday: 1, round: 'hinrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'les-dartagnons', homeTeamName: 'Ohne Jackie', awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 18, away: 0 } },
  { id: 'la-01-3', seasonId: 'season-2026', leagueId: 'la', matchday: 1, round: 'hinrunde', homeTeamId: 'spartans', awayTeamId: 'no-maam', homeTeamName: 'Spartans', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'la-02-1', seasonId: 'season-2026', leagueId: 'la', matchday: 2, round: 'hinrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'dc-null-bull', homeTeamName: 'Les Dartagnons', awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'la-02-2', seasonId: 'season-2026', leagueId: 'la', matchday: 2, round: 'hinrunde', homeTeamId: 'spartans', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'Spartans', awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'la-02-3', seasonId: 'season-2026', leagueId: 'la', matchday: 2, round: 'hinrunde', homeTeamId: 'no-maam', awayTeamId: 'ohne-jackie', homeTeamName: "No Ma'am", awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'la-03-1', seasonId: 'season-2026', leagueId: 'la', matchday: 3, round: 'hinrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'no-maam', homeTeamName: 'DC Null Bull', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'la-03-2', seasonId: 'season-2026', leagueId: 'la', matchday: 3, round: 'hinrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'les-dartagnons', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'la-03-3', seasonId: 'season-2026', leagueId: 'la', matchday: 3, round: 'hinrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'spartans', homeTeamName: 'Ohne Jackie', awayTeamName: 'Spartans', date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'la-04-1', seasonId: 'season-2026', leagueId: 'la', matchday: 4, round: 'hinrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'dc-null-bull', homeTeamName: 'Ohne Jackie', awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 15, away: 3 } },
  { id: 'la-04-2', seasonId: 'season-2026', leagueId: 'la', matchday: 4, round: 'hinrunde', homeTeamId: 'no-maam', awayTeamId: 'jolly-pirates-kts', homeTeamName: "No Ma'am", awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'la-04-3', seasonId: 'season-2026', leagueId: 'la', matchday: 4, round: 'hinrunde', homeTeamId: 'spartans', awayTeamId: 'les-dartagnons', homeTeamName: 'Spartans', awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 18, away: 0 } },
  { id: 'la-05-1', seasonId: 'season-2026', leagueId: 'la', matchday: 5, round: 'hinrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'spartans', homeTeamName: 'DC Null Bull', awayTeamName: 'Spartans', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-05-2', seasonId: 'season-2026', leagueId: 'la', matchday: 5, round: 'hinrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'ohne-jackie', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'la-05-3', seasonId: 'season-2026', leagueId: 'la', matchday: 5, round: 'hinrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'no-maam', homeTeamName: 'Les Dartagnons', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'la-06-1', seasonId: 'season-2026', leagueId: 'la', matchday: 6, round: 'hinrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'dc-null-bull', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'DC Null Bull', date: '2025-12-19', time: '20:30', status: 'scheduled', result: null },
  { id: 'la-06-2', seasonId: 'season-2026', leagueId: 'la', matchday: 6, round: 'hinrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'ohne-jackie', homeTeamName: 'Les Dartagnons', awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'la-06-3', seasonId: 'season-2026', leagueId: 'la', matchday: 6, round: 'hinrunde', homeTeamId: 'no-maam', awayTeamId: 'spartans', homeTeamName: "No Ma'am", awayTeamName: 'Spartans', date: null, time: null, status: 'completed', result: { home: 3, away: 15 } },
  { id: 'la-07-1', seasonId: 'season-2026', leagueId: 'la', matchday: 7, round: 'hinrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'les-dartagnons', homeTeamName: 'DC Null Bull', awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'la-07-2', seasonId: 'season-2026', leagueId: 'la', matchday: 7, round: 'hinrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'spartans', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'Spartans', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'la-07-3', seasonId: 'season-2026', leagueId: 'la', matchday: 7, round: 'hinrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'no-maam', homeTeamName: 'Ohne Jackie', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'la-08-1', seasonId: 'season-2026', leagueId: 'la', matchday: 8, round: 'hinrunde', homeTeamId: 'no-maam', awayTeamId: 'dc-null-bull', homeTeamName: "No Ma'am", awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'la-08-2', seasonId: 'season-2026', leagueId: 'la', matchday: 8, round: 'hinrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'Les Dartagnons', awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'la-08-3', seasonId: 'season-2026', leagueId: 'la', matchday: 8, round: 'hinrunde', homeTeamId: 'spartans', awayTeamId: 'ohne-jackie', homeTeamName: 'Spartans', awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'la-09-1', seasonId: 'season-2026', leagueId: 'la', matchday: 9, round: 'hinrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'ohne-jackie', homeTeamName: 'DC Null Bull', awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'la-09-2', seasonId: 'season-2026', leagueId: 'la', matchday: 9, round: 'hinrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'no-maam', homeTeamName: "Jolly Pirates KT's", awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 16, away: 2 } },
  { id: 'la-09-3', seasonId: 'season-2026', leagueId: 'la', matchday: 9, round: 'hinrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'spartans', homeTeamName: 'Les Dartagnons', awayTeamName: 'Spartans', date: null, time: null, status: 'completed', result: { home: 1, away: 17 } },
  { id: 'la-10-1', seasonId: 'season-2026', leagueId: 'la', matchday: 10, round: 'hinrunde', homeTeamId: 'spartans', awayTeamId: 'dc-null-bull', homeTeamName: 'Spartans', awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 15, away: 3 } },
  { id: 'la-10-2', seasonId: 'season-2026', leagueId: 'la', matchday: 10, round: 'hinrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'Ohne Jackie', awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'la-10-3', seasonId: 'season-2026', leagueId: 'la', matchday: 10, round: 'hinrunde', homeTeamId: 'no-maam', awayTeamId: 'les-dartagnons', homeTeamName: "No Ma'am", awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 18, away: 0 } },
  { id: 'la-11-1', seasonId: 'season-2026', leagueId: 'la', matchday: 11, round: 'rueckrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'DC Null Bull', awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'la-11-2', seasonId: 'season-2026', leagueId: 'la', matchday: 11, round: 'rueckrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'les-dartagnons', homeTeamName: 'Ohne Jackie', awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 17, away: 1 } },
  { id: 'la-11-3', seasonId: 'season-2026', leagueId: 'la', matchday: 11, round: 'rueckrunde', homeTeamId: 'spartans', awayTeamId: 'no-maam', homeTeamName: 'Spartans', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'la-12-1', seasonId: 'season-2026', leagueId: 'la', matchday: 12, round: 'rueckrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'dc-null-bull', homeTeamName: 'Les Dartagnons', awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 0, away: 18 } },
  { id: 'la-12-2', seasonId: 'season-2026', leagueId: 'la', matchday: 12, round: 'rueckrunde', homeTeamId: 'spartans', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'Spartans', awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'la-12-3', seasonId: 'season-2026', leagueId: 'la', matchday: 12, round: 'rueckrunde', homeTeamId: 'no-maam', awayTeamId: 'ohne-jackie', homeTeamName: "No Ma'am", awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'la-13-1', seasonId: 'season-2026', leagueId: 'la', matchday: 13, round: 'rueckrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'no-maam', homeTeamName: 'DC Null Bull', awayTeamName: "No Ma'am", date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-13-2', seasonId: 'season-2026', leagueId: 'la', matchday: 13, round: 'rueckrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'les-dartagnons', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 16, away: 2 } },
  { id: 'la-13-3', seasonId: 'season-2026', leagueId: 'la', matchday: 13, round: 'rueckrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'spartans', homeTeamName: 'Ohne Jackie', awayTeamName: 'Spartans', date: null, time: null, status: 'completed', result: { home: 3, away: 15 } },
  { id: 'la-14-1', seasonId: 'season-2026', leagueId: 'la', matchday: 14, round: 'rueckrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'dc-null-bull', homeTeamName: 'Ohne Jackie', awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 15, away: 3 } },
  { id: 'la-14-2', seasonId: 'season-2026', leagueId: 'la', matchday: 14, round: 'rueckrunde', homeTeamId: 'no-maam', awayTeamId: 'jolly-pirates-kts', homeTeamName: "No Ma'am", awayTeamName: "Jolly Pirates KT's", date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'la-14-3', seasonId: 'season-2026', leagueId: 'la', matchday: 14, round: 'rueckrunde', homeTeamId: 'spartans', awayTeamId: 'les-dartagnons', homeTeamName: 'Spartans', awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 18, away: 0 } },
  { id: 'la-15-1', seasonId: 'season-2026', leagueId: 'la', matchday: 15, round: 'rueckrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'spartans', homeTeamName: 'DC Null Bull', awayTeamName: 'Spartans', date: null, time: null, status: 'completed', result: { home: 3, away: 15 } },
  { id: 'la-15-2', seasonId: 'season-2026', leagueId: 'la', matchday: 15, round: 'rueckrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'ohne-jackie', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 15, away: 3 } },
  { id: 'la-15-3', seasonId: 'season-2026', leagueId: 'la', matchday: 15, round: 'rueckrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'no-maam', homeTeamName: 'Les Dartagnons', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 1, away: 17 } },
  { id: 'la-16-1', seasonId: 'season-2026', leagueId: 'la', matchday: 16, round: 'rueckrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'dc-null-bull', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'DC Null Bull', date: null, time: null, status: 'completed', result: { home: 16, away: 2 } },
  { id: 'la-16-2', seasonId: 'season-2026', leagueId: 'la', matchday: 16, round: 'rueckrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'ohne-jackie', homeTeamName: 'Les Dartagnons', awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 1, away: 17 } },
  { id: 'la-16-3', seasonId: 'season-2026', leagueId: 'la', matchday: 16, round: 'rueckrunde', homeTeamId: 'no-maam', awayTeamId: 'spartans', homeTeamName: "No Ma'am", awayTeamName: 'Spartans', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-17-1', seasonId: 'season-2026', leagueId: 'la', matchday: 17, round: 'rueckrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'les-dartagnons', homeTeamName: 'DC Null Bull', awayTeamName: 'Les Dartagnons', date: null, time: null, status: 'completed', result: { home: 15, away: 3 } },
  { id: 'la-17-2', seasonId: 'season-2026', leagueId: 'la', matchday: 17, round: 'rueckrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'spartans', homeTeamName: "Jolly Pirates KT's", awayTeamName: 'Spartans', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-17-3', seasonId: 'season-2026', leagueId: 'la', matchday: 17, round: 'rueckrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'no-maam', homeTeamName: 'Ohne Jackie', awayTeamName: "No Ma'am", date: null, time: null, status: 'completed', result: { home: 18, away: 0 } },
  { id: 'la-18-1', seasonId: 'season-2026', leagueId: 'la', matchday: 18, round: 'rueckrunde', homeTeamId: 'no-maam', awayTeamId: 'dc-null-bull', homeTeamName: "No Ma'am", awayTeamName: 'DC Null Bull', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-18-2', seasonId: 'season-2026', leagueId: 'la', matchday: 18, round: 'rueckrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'Les Dartagnons', awayTeamName: "Jolly Pirates KT's", date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-18-3', seasonId: 'season-2026', leagueId: 'la', matchday: 18, round: 'rueckrunde', homeTeamId: 'spartans', awayTeamId: 'ohne-jackie', homeTeamName: 'Spartans', awayTeamName: 'Ohne Jackie', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'la-19-1', seasonId: 'season-2026', leagueId: 'la', matchday: 19, round: 'rueckrunde', homeTeamId: 'dc-null-bull', awayTeamId: 'ohne-jackie', homeTeamName: 'DC Null Bull', awayTeamName: 'Ohne Jackie', date: '2026-06-12', time: '20:30', status: 'scheduled', result: null },
  { id: 'la-19-2', seasonId: 'season-2026', leagueId: 'la', matchday: 19, round: 'rueckrunde', homeTeamId: 'jolly-pirates-kts', awayTeamId: 'no-maam', homeTeamName: "Jolly Pirates KT's", awayTeamName: "No Ma'am", date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-19-3', seasonId: 'season-2026', leagueId: 'la', matchday: 19, round: 'rueckrunde', homeTeamId: 'les-dartagnons', awayTeamId: 'spartans', homeTeamName: 'Les Dartagnons', awayTeamName: 'Spartans', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'la-20-1', seasonId: 'season-2026', leagueId: 'la', matchday: 20, round: 'rueckrunde', homeTeamId: 'spartans', awayTeamId: 'dc-null-bull', homeTeamName: 'Spartans', awayTeamName: 'DC Null Bull', date: '2026-06-19', time: '20:00', status: 'scheduled', result: null },
  { id: 'la-20-2', seasonId: 'season-2026', leagueId: 'la', matchday: 20, round: 'rueckrunde', homeTeamId: 'ohne-jackie', awayTeamId: 'jolly-pirates-kts', homeTeamName: 'Ohne Jackie', awayTeamName: "Jolly Pirates KT's", date: '2026-06-19', time: '20:00', status: 'scheduled', result: null },
  { id: 'la-20-3', seasonId: 'season-2026', leagueId: 'la', matchday: 20, round: 'rueckrunde', homeTeamId: 'no-maam', awayTeamId: 'les-dartagnons', homeTeamName: "No Ma'am", awayTeamName: 'Les Dartagnons', date: '2026-06-19', time: '20:00', status: 'scheduled', result: null },

  // ════════════════════════════════════════════════════════════
  // C LIGA 2026
  // ════════════════════════════════════════════════════════════
  { id: 'c-01-1', seasonId: 'season-2026', leagueId: 'c', matchday: 1, round: 'hinrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'wild-indians', homeTeamName: 'München 08/15', awayTeamName: 'Wild Indians', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'c-01-2', seasonId: 'season-2026', leagueId: 'c', matchday: 1, round: 'hinrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'funny-darters', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'c-01-3', seasonId: 'season-2026', leagueId: 'c', matchday: 1, round: 'hinrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'black-devils', homeTeamName: 'Lucky Darts Two', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'c-02-1', seasonId: 'season-2026', leagueId: 'c', matchday: 2, round: 'hinrunde', homeTeamId: 'funny-darters', awayTeamId: 'muenchen-0815', homeTeamName: 'Funny Darters Munich', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'c-02-2', seasonId: 'season-2026', leagueId: 'c', matchday: 2, round: 'hinrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'wild-indians', homeTeamName: 'Lucky Darts Two', awayTeamName: 'Wild Indians', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'c-02-3', seasonId: 'season-2026', leagueId: 'c', matchday: 2, round: 'hinrunde', homeTeamId: 'black-devils', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Black Devils', awayTeamName: '5 Sterne Boazn Team', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'c-03-1', seasonId: 'season-2026', leagueId: 'c', matchday: 3, round: 'hinrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'black-devils', homeTeamName: 'München 08/15', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'c-03-2', seasonId: 'season-2026', leagueId: 'c', matchday: 3, round: 'hinrunde', homeTeamId: 'wild-indians', awayTeamId: 'funny-darters', homeTeamName: 'Wild Indians', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'c-03-3', seasonId: 'season-2026', leagueId: 'c', matchday: 3, round: 'hinrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'lucky-darts-two', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Lucky Darts Two', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-04-1', seasonId: 'season-2026', leagueId: 'c', matchday: 4, round: 'hinrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'muenchen-0815', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 0, away: 18 } },
  { id: 'c-04-2', seasonId: 'season-2026', leagueId: 'c', matchday: 4, round: 'hinrunde', homeTeamId: 'black-devils', awayTeamId: 'wild-indians', homeTeamName: 'Black Devils', awayTeamName: 'Wild Indians', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-04-3', seasonId: 'season-2026', leagueId: 'c', matchday: 4, round: 'hinrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'funny-darters', homeTeamName: 'Lucky Darts Two', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'c-05-1', seasonId: 'season-2026', leagueId: 'c', matchday: 5, round: 'hinrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'lucky-darts-two', homeTeamName: 'München 08/15', awayTeamName: 'Lucky Darts Two', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-05-2', seasonId: 'season-2026', leagueId: 'c', matchday: 5, round: 'hinrunde', homeTeamId: 'wild-indians', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Wild Indians', awayTeamName: '5 Sterne Boazn Team', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-05-3', seasonId: 'season-2026', leagueId: 'c', matchday: 5, round: 'hinrunde', homeTeamId: 'funny-darters', awayTeamId: 'black-devils', homeTeamName: 'Funny Darters Munich', awayTeamName: 'Black Devils', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-06-1', seasonId: 'season-2026', leagueId: 'c', matchday: 6, round: 'hinrunde', homeTeamId: 'wild-indians', awayTeamId: 'muenchen-0815', homeTeamName: 'Wild Indians', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'c-06-2', seasonId: 'season-2026', leagueId: 'c', matchday: 6, round: 'hinrunde', homeTeamId: 'funny-darters', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Funny Darters Munich', awayTeamName: '5 Sterne Boazn Team', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-06-3', seasonId: 'season-2026', leagueId: 'c', matchday: 6, round: 'hinrunde', homeTeamId: 'black-devils', awayTeamId: 'lucky-darts-two', homeTeamName: 'Black Devils', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-07-1', seasonId: 'season-2026', leagueId: 'c', matchday: 7, round: 'hinrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'funny-darters', homeTeamName: 'München 08/15', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-07-2', seasonId: 'season-2026', leagueId: 'c', matchday: 7, round: 'hinrunde', homeTeamId: 'wild-indians', awayTeamId: 'lucky-darts-two', homeTeamName: 'Wild Indians', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'c-07-3', seasonId: 'season-2026', leagueId: 'c', matchday: 7, round: 'hinrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'black-devils', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'c-08-1', seasonId: 'season-2026', leagueId: 'c', matchday: 8, round: 'hinrunde', homeTeamId: 'black-devils', awayTeamId: 'muenchen-0815', homeTeamName: 'Black Devils', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-08-2', seasonId: 'season-2026', leagueId: 'c', matchday: 8, round: 'hinrunde', homeTeamId: 'funny-darters', awayTeamId: 'wild-indians', homeTeamName: 'Funny Darters Munich', awayTeamName: 'Wild Indians', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-08-3', seasonId: 'season-2026', leagueId: 'c', matchday: 8, round: 'hinrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Lucky Darts Two', awayTeamName: '5 Sterne Boazn Team', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'c-09-1', seasonId: 'season-2026', leagueId: 'c', matchday: 9, round: 'hinrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'München 08/15', awayTeamName: '5 Sterne Boazn Team', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-09-2', seasonId: 'season-2026', leagueId: 'c', matchday: 9, round: 'hinrunde', homeTeamId: 'wild-indians', awayTeamId: 'black-devils', homeTeamName: 'Wild Indians', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-09-3', seasonId: 'season-2026', leagueId: 'c', matchday: 9, round: 'hinrunde', homeTeamId: 'funny-darters', awayTeamId: 'lucky-darts-two', homeTeamName: 'Funny Darters Munich', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'c-10-1', seasonId: 'season-2026', leagueId: 'c', matchday: 10, round: 'hinrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'muenchen-0815', homeTeamName: 'Lucky Darts Two', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-10-2', seasonId: 'season-2026', leagueId: 'c', matchday: 10, round: 'hinrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'wild-indians', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Wild Indians', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-10-3', seasonId: 'season-2026', leagueId: 'c', matchday: 10, round: 'hinrunde', homeTeamId: 'black-devils', awayTeamId: 'funny-darters', homeTeamName: 'Black Devils', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'c-11-1', seasonId: 'season-2026', leagueId: 'c', matchday: 11, round: 'rueckrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'wild-indians', homeTeamName: 'München 08/15', awayTeamName: 'Wild Indians', date: null, time: null, status: 'completed', result: { home: 3, away: 15 } },
  { id: 'c-11-2', seasonId: 'season-2026', leagueId: 'c', matchday: 11, round: 'rueckrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'funny-darters', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-11-3', seasonId: 'season-2026', leagueId: 'c', matchday: 11, round: 'rueckrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'black-devils', homeTeamName: 'Lucky Darts Two', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-12-1', seasonId: 'season-2026', leagueId: 'c', matchday: 12, round: 'rueckrunde', homeTeamId: 'funny-darters', awayTeamId: 'muenchen-0815', homeTeamName: 'Funny Darters Munich', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'c-12-2', seasonId: 'season-2026', leagueId: 'c', matchday: 12, round: 'rueckrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'wild-indians', homeTeamName: 'Lucky Darts Two', awayTeamName: 'Wild Indians', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'c-12-3', seasonId: 'season-2026', leagueId: 'c', matchday: 12, round: 'rueckrunde', homeTeamId: 'black-devils', awayTeamId: 'lucky-darts-two', homeTeamName: 'Black Devils', awayTeamName: 'Lucky Darts Two', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-13-1', seasonId: 'season-2026', leagueId: 'c', matchday: 13, round: 'rueckrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'black-devils', homeTeamName: 'München 08/15', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 13, away: 5 } },
  { id: 'c-13-2', seasonId: 'season-2026', leagueId: 'c', matchday: 13, round: 'rueckrunde', homeTeamId: 'wild-indians', awayTeamId: 'funny-darters', homeTeamName: 'Wild Indians', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-13-3', seasonId: 'season-2026', leagueId: 'c', matchday: 13, round: 'rueckrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'lucky-darts-two', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'c-14-1', seasonId: 'season-2026', leagueId: 'c', matchday: 14, round: 'rueckrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'muenchen-0815', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'c-14-2', seasonId: 'season-2026', leagueId: 'c', matchday: 14, round: 'rueckrunde', homeTeamId: 'black-devils', awayTeamId: 'wild-indians', homeTeamName: 'Black Devils', awayTeamName: 'Wild Indians', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'c-14-3', seasonId: 'season-2026', leagueId: 'c', matchday: 14, round: 'rueckrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'funny-darters', homeTeamName: 'Lucky Darts Two', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'c-15-1', seasonId: 'season-2026', leagueId: 'c', matchday: 15, round: 'rueckrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'lucky-darts-two', homeTeamName: 'München 08/15', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'c-15-2', seasonId: 'season-2026', leagueId: 'c', matchday: 15, round: 'rueckrunde', homeTeamId: 'wild-indians', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Wild Indians', awayTeamName: '5 Sterne Boazn Team', date: null, time: null, status: 'completed', result: { home: 13, away: 5 } },
  { id: 'c-15-3', seasonId: 'season-2026', leagueId: 'c', matchday: 15, round: 'rueckrunde', homeTeamId: 'funny-darters', awayTeamId: 'black-devils', homeTeamName: 'Funny Darters Munich', awayTeamName: 'Black Devils', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'c-16-1', seasonId: 'season-2026', leagueId: 'c', matchday: 16, round: 'rueckrunde', homeTeamId: 'wild-indians', awayTeamId: 'muenchen-0815', homeTeamName: 'Wild Indians', awayTeamName: 'München 08/15', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'c-16-2', seasonId: 'season-2026', leagueId: 'c', matchday: 16, round: 'rueckrunde', homeTeamId: 'funny-darters', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Funny Darters Munich', awayTeamName: '5 Sterne Boazn Team', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-16-3', seasonId: 'season-2026', leagueId: 'c', matchday: 16, round: 'rueckrunde', homeTeamId: 'black-devils', awayTeamId: 'lucky-darts-two', homeTeamName: 'Black Devils', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'c-17-1', seasonId: 'season-2026', leagueId: 'c', matchday: 17, round: 'rueckrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'funny-darters', homeTeamName: 'München 08/15', awayTeamName: 'Funny Darters Munich', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'c-17-2', seasonId: 'season-2026', leagueId: 'c', matchday: 17, round: 'rueckrunde', homeTeamId: 'wild-indians', awayTeamId: 'lucky-darts-two', homeTeamName: 'Wild Indians', awayTeamName: 'Lucky Darts Two', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'c-17-3', seasonId: 'season-2026', leagueId: 'c', matchday: 17, round: 'rueckrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'black-devils', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Black Devils', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-18-1', seasonId: 'season-2026', leagueId: 'c', matchday: 18, round: 'rueckrunde', homeTeamId: 'black-devils', awayTeamId: 'muenchen-0815', homeTeamName: 'Black Devils', awayTeamName: 'München 08/15', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-18-2', seasonId: 'season-2026', leagueId: 'c', matchday: 18, round: 'rueckrunde', homeTeamId: 'funny-darters', awayTeamId: 'wild-indians', homeTeamName: 'Funny Darters Munich', awayTeamName: 'Wild Indians', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-18-3', seasonId: 'season-2026', leagueId: 'c', matchday: 18, round: 'rueckrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'Lucky Darts Two', awayTeamName: '5 Sterne Boazn Team', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-19-1', seasonId: 'season-2026', leagueId: 'c', matchday: 19, round: 'rueckrunde', homeTeamId: 'muenchen-0815', awayTeamId: 'fuenf-sterne-boazn', homeTeamName: 'München 08/15', awayTeamName: '5 Sterne Boazn Team', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-19-2', seasonId: 'season-2026', leagueId: 'c', matchday: 19, round: 'rueckrunde', homeTeamId: 'wild-indians', awayTeamId: 'black-devils', homeTeamName: 'Wild Indians', awayTeamName: 'Black Devils', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-19-3', seasonId: 'season-2026', leagueId: 'c', matchday: 19, round: 'rueckrunde', homeTeamId: 'funny-darters', awayTeamId: 'lucky-darts-two', homeTeamName: 'Funny Darters Munich', awayTeamName: 'Lucky Darts Two', date: null, time: '20:00', status: 'scheduled', result: null },
  { id: 'c-20-1', seasonId: 'season-2026', leagueId: 'c', matchday: 20, round: 'rueckrunde', homeTeamId: 'lucky-darts-two', awayTeamId: 'muenchen-0815', homeTeamName: 'Lucky Darts Two', awayTeamName: 'München 08/15', date: '2026-06-20', time: '20:00', status: 'scheduled', result: null },
  { id: 'c-20-2', seasonId: 'season-2026', leagueId: 'c', matchday: 20, round: 'rueckrunde', homeTeamId: 'fuenf-sterne-boazn', awayTeamId: 'wild-indians', homeTeamName: '5 Sterne Boazn Team', awayTeamName: 'Wild Indians', date: '2026-06-20', time: '20:30', status: 'scheduled', result: null },
  // c-20-3 (black-devils vs black-devils) — data artifact, skipped

  // ════════════════════════════════════════════════════════════
  // PLAYOFFS A LIGA AUFSTIEG
  // ════════════════════════════════════════════════════════════
  { id: 'paa-01-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'alptraum', awayTeamId: 'gambas', homeTeamName: 'Alptraum', awayTeamName: 'Gambas', date: null, time: null, status: 'completed', result: { home: 15, away: 3 } },
  { id: 'paa-01-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'jolly-pirates-v', awayTeamId: 'dc-animals-ii', homeTeamName: 'Jolly Pirates V', awayTeamName: 'DC Animals II', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'paa-01-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'treff-nix-freimann', awayTeamId: 'silberpfeile-ii', homeTeamName: 'Treff Nix Freimann', awayTeamName: 'Silberpfeile II', date: null, time: null, status: 'completed', result: { home: 3, away: 15 } },
  { id: 'paa-02-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'dc-animals-ii', awayTeamId: 'alptraum', homeTeamName: 'DC Animals II', awayTeamName: 'Alptraum', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'paa-02-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'treff-nix-freimann', awayTeamId: 'gambas', homeTeamName: 'Treff Nix Freimann', awayTeamName: 'Gambas', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'paa-02-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'silberpfeile-ii', awayTeamId: 'jolly-pirates-v', homeTeamName: 'Silberpfeile II', awayTeamName: 'Jolly Pirates V', date: '2026-04-04', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-03-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'alptraum', awayTeamId: 'silberpfeile-ii', homeTeamName: 'Alptraum', awayTeamName: 'Silberpfeile II', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'paa-03-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'gambas', awayTeamId: 'dc-animals-ii', homeTeamName: 'Gambas', awayTeamName: 'DC Animals II', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'paa-03-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'jolly-pirates-v', awayTeamId: 'treff-nix-freimann', homeTeamName: 'Jolly Pirates V', awayTeamName: 'Treff Nix Freimann', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'paa-04-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'jolly-pirates-v', awayTeamId: 'alptraum', homeTeamName: 'Jolly Pirates V', awayTeamName: 'Alptraum', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'paa-04-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'silberpfeile-ii', awayTeamId: 'gambas', homeTeamName: 'Silberpfeile II', awayTeamName: 'Gambas', date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'paa-04-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'treff-nix-freimann', awayTeamId: 'dc-animals-ii', homeTeamName: 'Treff Nix Freimann', awayTeamName: 'DC Animals II', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'paa-05-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'alptraum', awayTeamId: 'treff-nix-freimann', homeTeamName: 'Alptraum', awayTeamName: 'Treff Nix Freimann', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'paa-05-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'gambas', awayTeamId: 'jolly-pirates-v', homeTeamName: 'Gambas', awayTeamName: 'Jolly Pirates V', date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'paa-05-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'dc-animals-ii', awayTeamId: 'silberpfeile-ii', homeTeamName: 'DC Animals II', awayTeamName: 'Silberpfeile II', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'paa-06-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'gambas', awayTeamId: 'alptraum', homeTeamName: 'Gambas', awayTeamName: 'Alptraum', date: '2026-05-02', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-06-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'dc-animals-ii', awayTeamId: 'jolly-pirates-v', homeTeamName: 'DC Animals II', awayTeamName: 'Jolly Pirates V', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'paa-06-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'silberpfeile-ii', awayTeamId: 'treff-nix-freimann', homeTeamName: 'Silberpfeile II', awayTeamName: 'Treff Nix Freimann', date: '2026-05-30', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-07-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'alptraum', awayTeamId: 'dc-animals-ii', homeTeamName: 'Alptraum', awayTeamName: 'DC Animals II', date: '2026-05-08', time: '20:30', status: 'scheduled', result: null },
  { id: 'paa-07-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'gambas', awayTeamId: 'treff-nix-freimann', homeTeamName: 'Gambas', awayTeamName: 'Treff Nix Freimann', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'paa-07-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'jolly-pirates-v', awayTeamId: 'silberpfeile-ii', homeTeamName: 'Jolly Pirates V', awayTeamName: 'Silberpfeile II', date: '2026-05-08', time: '20:30', status: 'scheduled', result: null },
  { id: 'paa-08-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'silberpfeile-ii', awayTeamId: 'alptraum', homeTeamName: 'Silberpfeile II', awayTeamName: 'Alptraum', date: '2026-06-05', time: '20:30', status: 'scheduled', result: null },
  { id: 'paa-08-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'dc-animals-ii', awayTeamId: 'gambas', homeTeamName: 'DC Animals II', awayTeamName: 'Gambas', date: '2026-06-06', time: '20:30', status: 'scheduled', result: null },
  { id: 'paa-08-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'treff-nix-freimann', awayTeamId: 'jolly-pirates-v', homeTeamName: 'Treff Nix Freimann', awayTeamName: 'Jolly Pirates V', date: '2026-06-05', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-09-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'alptraum', awayTeamId: 'jolly-pirates-v', homeTeamName: 'Alptraum', awayTeamName: 'Jolly Pirates V', date: '2026-06-12', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-09-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'gambas', awayTeamId: 'silberpfeile-ii', homeTeamName: 'Gambas', awayTeamName: 'Silberpfeile II', date: '2026-06-03', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-09-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'dc-animals-ii', awayTeamId: 'treff-nix-freimann', homeTeamName: 'DC Animals II', awayTeamName: 'Treff Nix Freimann', date: '2026-05-23', time: '20:30', status: 'scheduled', result: null },
  { id: 'paa-10-1', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'treff-nix-freimann', awayTeamId: 'alptraum', homeTeamName: 'Treff Nix Freimann', awayTeamName: 'Alptraum', date: '2026-06-19', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-10-2', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'jolly-pirates-v', awayTeamId: 'gambas', homeTeamName: 'Jolly Pirates V', awayTeamName: 'Gambas', date: '2026-06-20', time: '20:00', status: 'scheduled', result: null },
  { id: 'paa-10-3', seasonId: 'season-2026', leagueId: 'playoffs-a-aufstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'silberpfeile-ii', awayTeamId: 'dc-animals-ii', homeTeamName: 'Silberpfeile II', awayTeamName: 'DC Animals II', date: '2026-06-19', time: '20:30', status: 'scheduled', result: null },

  // ════════════════════════════════════════════════════════════
  // PLAYOFFS A LIGA ABSTIEG  (isBye entries skipped)
  // ════════════════════════════════════════════════════════════
  { id: 'pab-01-3', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'game-over', awayTeamId: 'oldies-co', homeTeamName: 'Game Over', awayTeamName: 'Oldies & Co', date: null, time: null, status: 'completed', result: { home: 5, away: 13 } },
  { id: 'pab-02-2', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'game-over', awayTeamId: 'sound-warriors', homeTeamName: 'Game Over', awayTeamName: "Sound Warrior's", date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'pab-03-2', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'sound-warriors', awayTeamId: 'spartans-vi', homeTeamName: "Sound Warrior's", awayTeamName: 'Spartans VI', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'pab-04-2', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'oldies-co', awayTeamId: 'sound-warriors', homeTeamName: 'Oldies & Co', awayTeamName: "Sound Warrior's", date: '2026-04-17', time: '20:00', status: 'scheduled', result: null },
  { id: 'pab-04-3', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'game-over', awayTeamId: 'spartans-vi', homeTeamName: 'Game Over', awayTeamName: 'Spartans VI', date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'pab-05-3', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'spartans-vi', awayTeamId: 'oldies-co', homeTeamName: 'Spartans VI', awayTeamName: 'Oldies & Co', date: null, time: null, status: 'completed', result: { home: 13, away: 5 } },
  { id: 'pab-06-3', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'oldies-co', awayTeamId: 'game-over', homeTeamName: 'Oldies & Co', awayTeamName: 'Game Over', date: '2026-06-05', time: '20:00', status: 'scheduled', result: null },
  { id: 'pab-07-2', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'sound-warriors', awayTeamId: 'game-over', homeTeamName: "Sound Warrior's", awayTeamName: 'Game Over', date: '2026-05-08', time: '20:00', status: 'scheduled', result: null },
  { id: 'pab-08-2', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'spartans-vi', awayTeamId: 'sound-warriors', homeTeamName: 'Spartans VI', awayTeamName: "Sound Warrior's", date: '2026-06-05', time: '20:00', status: 'scheduled', result: null },
  { id: 'pab-09-2', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'sound-warriors', awayTeamId: 'oldies-co', homeTeamName: "Sound Warrior's", awayTeamName: 'Oldies & Co', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'pab-09-3', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'spartans-vi', awayTeamId: 'game-over', homeTeamName: 'Spartans VI', awayTeamName: 'Game Over', date: '2026-06-13', time: '20:00', status: 'scheduled', result: null },
  { id: 'pab-10-3', seasonId: 'season-2026', leagueId: 'playoffs-a-abstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'oldies-co', awayTeamId: 'spartans-vi', homeTeamName: 'Oldies & Co', awayTeamName: 'Spartans VI', date: '2026-06-19', time: '20:00', status: 'scheduled', result: null },

  // ════════════════════════════════════════════════════════════
  // PLAYOFFS B LIGA AUFSTIEG
  // ════════════════════════════════════════════════════════════
  { id: 'pba-01-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'flying-seven', awayTeamId: 'flying-fighters', homeTeamName: 'Flying Seven', awayTeamName: 'Flying Fighters', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'pba-01-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'freibad-bazis', awayTeamId: 'fiaker-deife', homeTeamName: 'Freibad Bazis', awayTeamName: 'Fiaker Deife', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'pba-01-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'master-of-desaster', awayTeamId: 'belfort-evolution', homeTeamName: 'Master of Desaster', awayTeamName: 'Belfort Evolution', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'pba-02-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'fiaker-deife', awayTeamId: 'flying-seven', homeTeamName: 'Fiaker Deife', awayTeamName: 'Flying Seven', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'pba-02-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'master-of-desaster', awayTeamId: 'flying-fighters', homeTeamName: 'Master of Desaster', awayTeamName: 'Flying Fighters', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'pba-02-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'belfort-evolution', awayTeamId: 'freibad-bazis', homeTeamName: 'Belfort Evolution', awayTeamName: 'Freibad Bazis', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'pba-03-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'belfort-evolution', awayTeamId: 'flying-seven', homeTeamName: 'Belfort Evolution', awayTeamName: 'Flying Seven', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'pba-03-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'flying-fighters', awayTeamId: 'fiaker-deife', homeTeamName: 'Flying Fighters', awayTeamName: 'Fiaker Deife', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'pba-03-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'freibad-bazis', awayTeamId: 'master-of-desaster', homeTeamName: 'Freibad Bazis', awayTeamName: 'Master of Desaster', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pba-04-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'freibad-bazis', awayTeamId: 'flying-seven', homeTeamName: 'Freibad Bazis', awayTeamName: 'Flying Seven', date: '2026-05-22', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-04-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'belfort-evolution', awayTeamId: 'flying-fighters', homeTeamName: 'Belfort Evolution', awayTeamName: 'Flying Fighters', date: null, time: null, status: 'completed', result: { home: 13, away: 5 } },
  { id: 'pba-04-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'master-of-desaster', awayTeamId: 'fiaker-deife', homeTeamName: 'Master of Desaster', awayTeamName: 'Fiaker Deife', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'pba-05-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'flying-seven', awayTeamId: 'master-of-desaster', homeTeamName: 'Flying Seven', awayTeamName: 'Master of Desaster', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pba-05-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'flying-fighters', awayTeamId: 'freibad-bazis', homeTeamName: 'Flying Fighters', awayTeamName: 'Freibad Bazis', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'pba-05-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'fiaker-deife', awayTeamId: 'belfort-evolution', homeTeamName: 'Fiaker Deife', awayTeamName: 'Belfort Evolution', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'pba-06-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'flying-fighters', awayTeamId: 'flying-seven', homeTeamName: 'Flying Fighters', awayTeamName: 'Flying Seven', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'pba-06-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'fiaker-deife', awayTeamId: 'freibad-bazis', homeTeamName: 'Fiaker Deife', awayTeamName: 'Freibad Bazis', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'pba-06-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'belfort-evolution', awayTeamId: 'master-of-desaster', homeTeamName: 'Belfort Evolution', awayTeamName: 'Master of Desaster', date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'pba-07-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'flying-seven', awayTeamId: 'fiaker-deife', homeTeamName: 'Flying Seven', awayTeamName: 'Fiaker Deife', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'pba-07-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'flying-fighters', awayTeamId: 'master-of-desaster', homeTeamName: 'Flying Fighters', awayTeamName: 'Master of Desaster', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pba-07-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'freibad-bazis', awayTeamId: 'belfort-evolution', homeTeamName: 'Freibad Bazis', awayTeamName: 'Belfort Evolution', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pba-08-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'flying-seven', awayTeamId: 'belfort-evolution', homeTeamName: 'Flying Seven', awayTeamName: 'Belfort Evolution', date: '2026-06-06', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-08-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'fiaker-deife', awayTeamId: 'flying-fighters', homeTeamName: 'Fiaker Deife', awayTeamName: 'Flying Fighters', date: '2026-06-06', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-08-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'master-of-desaster', awayTeamId: 'freibad-bazis', homeTeamName: 'Master of Desaster', awayTeamName: 'Freibad Bazis', date: '2026-06-05', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-09-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'flying-seven', awayTeamId: 'freibad-bazis', homeTeamName: 'Flying Seven', awayTeamName: 'Freibad Bazis', date: '2026-06-12', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-09-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'flying-fighters', awayTeamId: 'belfort-evolution', homeTeamName: 'Flying Fighters', awayTeamName: 'Belfort Evolution', date: '2026-06-13', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-09-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'fiaker-deife', awayTeamId: 'master-of-desaster', homeTeamName: 'Fiaker Deife', awayTeamName: 'Master of Desaster', date: '2026-06-12', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-10-1', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'master-of-desaster', awayTeamId: 'flying-seven', homeTeamName: 'Master of Desaster', awayTeamName: 'Flying Seven', date: '2026-06-20', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-10-2', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'freibad-bazis', awayTeamId: 'flying-fighters', homeTeamName: 'Freibad Bazis', awayTeamName: 'Flying Fighters', date: '2026-06-20', time: '20:00', status: 'scheduled', result: null },
  { id: 'pba-10-3', seasonId: 'season-2026', leagueId: 'playoffs-b-aufstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'belfort-evolution', awayTeamId: 'fiaker-deife', homeTeamName: 'Belfort Evolution', awayTeamName: 'Fiaker Deife', date: '2026-05-31', time: '20:00', status: 'scheduled', result: null },

  // ════════════════════════════════════════════════════════════
  // PLAYOFFS B LIGA ABSTIEG
  // ════════════════════════════════════════════════════════════
  { id: 'pbb-01-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'team-desaster', awayTeamId: 'lucky-darts-one', homeTeamName: 'Team Desaster', awayTeamName: 'Lucky Darts One', date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'pbb-01-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'de-vogelwuidn', awayTeamId: 'dc-dark-angels', homeTeamName: "De Vogelwuid'n", awayTeamName: 'DC Dark Angels', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pbb-01-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 1, round: 'hinrunde', homeTeamId: 'massl-ghabt', awayTeamId: 'de-hutzeldarter', homeTeamName: 'Massl Ghabt', awayTeamName: 'De Hutzeldarter', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pbb-02-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'dc-dark-angels', awayTeamId: 'team-desaster', homeTeamName: 'DC Dark Angels', awayTeamName: 'Team Desaster', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pbb-02-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'massl-ghabt', awayTeamId: 'lucky-darts-one', homeTeamName: 'Massl Ghabt', awayTeamName: 'Lucky Darts One', date: null, time: null, status: 'completed', result: { home: 7, away: 11 } },
  { id: 'pbb-02-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 2, round: 'hinrunde', homeTeamId: 'de-hutzeldarter', awayTeamId: 'de-vogelwuidn', homeTeamName: 'De Hutzeldarter', awayTeamName: "De Vogelwuid'n", date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pbb-03-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'team-desaster', awayTeamId: 'de-hutzeldarter', homeTeamName: 'Team Desaster', awayTeamName: 'De Hutzeldarter', date: '2026-05-22', time: '20:00', status: 'scheduled', result: null },
  { id: 'pbb-03-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'lucky-darts-one', awayTeamId: 'dc-dark-angels', homeTeamName: 'Lucky Darts One', awayTeamName: 'DC Dark Angels', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pbb-03-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 3, round: 'hinrunde', homeTeamId: 'de-vogelwuidn', awayTeamId: 'massl-ghabt', homeTeamName: "De Vogelwuid'n", awayTeamName: 'Massl Ghabt', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pbb-04-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'de-vogelwuidn', awayTeamId: 'team-desaster', homeTeamName: "De Vogelwuid'n", awayTeamName: 'Team Desaster', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pbb-04-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'de-hutzeldarter', awayTeamId: 'lucky-darts-one', homeTeamName: 'De Hutzeldarter', awayTeamName: 'Lucky Darts One', date: null, time: null, status: 'completed', result: { home: 4, away: 14 } },
  { id: 'pbb-04-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 4, round: 'hinrunde', homeTeamId: 'massl-ghabt', awayTeamId: 'dc-dark-angels', homeTeamName: 'Massl Ghabt', awayTeamName: 'DC Dark Angels', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'pbb-05-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'team-desaster', awayTeamId: 'massl-ghabt', homeTeamName: 'Team Desaster', awayTeamName: 'Massl Ghabt', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pbb-05-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'de-vogelwuidn', awayTeamId: 'lucky-darts-one', homeTeamName: "De Vogelwuid'n", awayTeamName: 'Lucky Darts One', date: null, time: null, status: 'completed', result: { home: 12, away: 6 } },
  { id: 'pbb-05-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 5, round: 'hinrunde', homeTeamId: 'dc-dark-angels', awayTeamId: 'de-hutzeldarter', homeTeamName: 'DC Dark Angels', awayTeamName: 'De Hutzeldarter', date: null, time: null, status: 'completed', result: { home: 8, away: 10 } },
  { id: 'pbb-06-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'lucky-darts-one', awayTeamId: 'team-desaster', homeTeamName: 'Lucky Darts One', awayTeamName: 'Team Desaster', date: null, time: null, status: 'completed', result: { home: 10, away: 8 } },
  { id: 'pbb-06-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'dc-dark-angels', awayTeamId: 'de-vogelwuidn', homeTeamName: 'DC Dark Angels', awayTeamName: "De Vogelwuid'n", date: null, time: null, status: 'completed', result: { home: 6, away: 12 } },
  { id: 'pbb-06-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 6, round: 'rueckrunde', homeTeamId: 'de-hutzeldarter', awayTeamId: 'massl-ghabt', homeTeamName: 'De Hutzeldarter', awayTeamName: 'Massl Ghabt', date: null, time: null, status: 'completed', result: { home: 14, away: 4 } },
  { id: 'pbb-07-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'team-desaster', awayTeamId: 'dc-dark-angels', homeTeamName: 'Team Desaster', awayTeamName: 'DC Dark Angels', date: null, time: null, status: 'completed', result: { home: 13, away: 5 } },
  { id: 'pbb-07-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'lucky-darts-one', awayTeamId: 'massl-ghabt', homeTeamName: 'Lucky Darts One', awayTeamName: 'Massl Ghabt', date: null, time: null, status: 'completed', result: { home: 11, away: 7 } },
  { id: 'pbb-07-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 7, round: 'rueckrunde', homeTeamId: 'de-vogelwuidn', awayTeamId: 'de-hutzeldarter', homeTeamName: "De Vogelwuid'n", awayTeamName: 'De Hutzeldarter', date: null, time: null, status: 'completed', result: { home: 9, away: 9 } },
  { id: 'pbb-08-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'de-hutzeldarter', awayTeamId: 'team-desaster', homeTeamName: 'De Hutzeldarter', awayTeamName: 'Team Desaster', date: '2026-05-05', time: '20:00', status: 'scheduled', result: null },
  { id: 'pbb-08-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'dc-dark-angels', awayTeamId: 'lucky-darts-one', homeTeamName: 'DC Dark Angels', awayTeamName: 'Lucky Darts One', date: '2026-05-30', time: '20:30', status: 'scheduled', result: null },
  { id: 'pbb-08-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 8, round: 'rueckrunde', homeTeamId: 'massl-ghabt', awayTeamId: 'de-vogelwuidn', homeTeamName: 'Massl Ghabt', awayTeamName: "De Vogelwuid'n", date: '2026-06-06', time: '19:30', status: 'scheduled', result: null },
  { id: 'pbb-09-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'team-desaster', awayTeamId: 'de-vogelwuidn', homeTeamName: 'Team Desaster', awayTeamName: "De Vogelwuid'n", date: '2026-06-12', time: '20:00', status: 'scheduled', result: null },
  { id: 'pbb-09-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'lucky-darts-one', awayTeamId: 'de-hutzeldarter', homeTeamName: 'Lucky Darts One', awayTeamName: 'De Hutzeldarter', date: '2026-06-12', time: '20:30', status: 'scheduled', result: null },
  { id: 'pbb-09-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 9, round: 'rueckrunde', homeTeamId: 'dc-dark-angels', awayTeamId: 'massl-ghabt', homeTeamName: 'DC Dark Angels', awayTeamName: 'Massl Ghabt', date: '2026-06-13', time: '20:00', status: 'scheduled', result: null },
  { id: 'pbb-10-1', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'massl-ghabt', awayTeamId: 'team-desaster', homeTeamName: 'Massl Ghabt', awayTeamName: 'Team Desaster', date: '2026-04-11', time: '19:30', status: 'scheduled', result: null },
  { id: 'pbb-10-2', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'lucky-darts-one', awayTeamId: 'de-vogelwuidn', homeTeamName: 'Lucky Darts One', awayTeamName: "De Vogelwuid'n", date: '2026-06-19', time: '20:30', status: 'scheduled', result: null },
  { id: 'pbb-10-3', seasonId: 'season-2026', leagueId: 'playoffs-b-abstieg', matchday: 10, round: 'rueckrunde', homeTeamId: 'de-hutzeldarter', awayTeamId: 'dc-dark-angels', homeTeamName: 'De Hutzeldarter', awayTeamName: 'DC Dark Angels', date: '2026-06-19', time: '20:00', status: 'scheduled', result: null },
];

// ── Import overlay & merge ────────────────────────────────────
//
// lib/data/imported-matches.json is written by:
//   npm run import:dartunion
//
// Merge rules (applied at module init, zero runtime cost):
//   • Static "scheduled" match that import shows as "completed" → upgraded.
//   • Brand-new match (home+away+league pair not in static set) → appended.
//   • Static "completed" results → never overwritten.

type _PartialImport = {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  leagueId: string;
  date: string | null;
  time: string | null;
  status: string;
  result: { home: number; away: number } | null;
  [k: string]: unknown;
};

function _buildMerged(): Match[] {
  const imported = importedRaw as unknown as _PartialImport[];

  // Index imported matches by (home, away, league) for quick lookup
  const importByPair = new Map<string, _PartialImport>();
  for (const m of imported) {
    importByPair.set(`${m.homeTeamId}|${m.awayTeamId}|${m.leagueId}`, m);
  }

  const staticIds   = new Set(STATIC_MATCHES.map(m => m.id));
  const staticPairs = new Set(
    STATIC_MATCHES.map(m => `${m.homeTeamId}|${m.awayTeamId}|${m.leagueId}`),
  );

  // Upgrade scheduled → completed where import has a confirmed result
  const updated: Match[] = STATIC_MATCHES.map(m => {
    if (m.status === 'scheduled') {
      const imp = importByPair.get(`${m.homeTeamId}|${m.awayTeamId}|${m.leagueId}`);
      if (
        imp?.status === 'completed' &&
        imp.result != null &&
        typeof imp.result.home === 'number' &&
        typeof imp.result.away === 'number'
      ) {
        // Only keep the static date if it's not in the future.
        // If the match was played before its scheduled date, the static date
        // would be a future date — clear it to null so it doesn't surface
        // as a recent result with a future timestamp.
        const _today = new Date().toISOString().slice(0, 10);
        const mergedDate =
          m.date && m.date <= _today ? m.date :
          imp.date && imp.date <= _today ? imp.date :
          null;
        return {
          ...m,
          status: 'completed' as const,
          result: { home: imp.result.home, away: imp.result.away },
          date: mergedDate,
        };
      }
      // Clear stale past date when import says match is still open
      // (dartunion.de encodes "no date yet" as 30.11.99 → parsed as null).
      // If the static match had a scheduled date that is now in the past but
      // the import still shows it as scheduled with no date, clear the date.
      if (imp?.status === 'scheduled' && imp.date === null && m.date !== null) {
        const _today = new Date().toISOString().slice(0, 10);
        if (m.date < _today) {
          return { ...m, date: null };
        }
      }
    }
    return m;
  });

  // Append brand-new matches that are not in the static set at all
  const extras: Match[] = (imported as unknown as Match[]).filter(
    m =>
      !staticIds.has(m.id) &&
      !staticPairs.has(`${m.homeTeamId}|${m.awayTeamId}|${m.leagueId}`),
  );

  return [...updated, ...extras];
}

/** All matches — static base data merged with any imported updates from dartunion.de */
export const MATCHES: Match[] = _buildMerged();

// ── Helper functions ──────────────────────────────────────────

/**
 * Returns all matches for a given league code.
 */
export function getMatchesForLeague(leagueId: string): Match[] {
  const id = leagueId.toLowerCase();
  return MATCHES.filter(m => m.leagueId === id);
}

/**
 * Returns scheduled matches, optionally filtered by league.
 * Sorted ascending by date (null dates last).
 */
export function getScheduledMatches(leagueId?: string): Match[] {
  return MATCHES
    .filter(m =>
      isFutureOrOpenMatch(m) &&
      (leagueId == null || m.leagueId === leagueId.toLowerCase()),
    )
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
}

/**
 * Returns completed matches, optionally filtered by league.
 * Sorted descending by date (newest first, null dates last).
 */
export function getCompletedMatches(leagueId?: string): Match[] {
  const today = new Date().toISOString().slice(0, 10);
  return MATCHES
    .filter(m =>
      m.status === 'completed' &&
      m.result != null &&
      (!m.date || m.date <= today) &&
      (leagueId == null || m.leagueId === leagueId.toLowerCase()),
    )
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
}

/**
 * Next N upcoming matches for a league (or all leagues).
 */
export function getUpcomingMatches(leagueId?: string, limit?: number): Match[] {
  const list = getScheduledMatches(leagueId);
  return limit != null ? list.slice(0, limit) : list;
}

/**
 * Most recent N completed results for a league (or all leagues).
 */
export function getRecentResults(leagueId?: string, limit?: number): Match[] {
  const list = getCompletedMatches(leagueId);
  return limit != null ? list.slice(0, limit) : list;
}

/**
 * Formats an ISO date "YYYY-MM-DD" to German display format "DD.MM.YYYY".
 * Returns "—" for null/empty (used in results/completed views).
 */
export function formatMatchDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts;
  return `${d}.${m}.${y}`;
}

/**
 * Like formatMatchDate but returns "Termin noch nicht verfügbar" for null.
 * Used in scheduled match views (Spielplan, Liga-Detail Spielplan tab).
 */
export function formatScheduledDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Termin noch nicht verfügbar';
  return formatMatchDate(isoDate);
}

/**
 * Converts a team display name to a stable kebab-case ID.
 */
export function normalizeTeamId(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Team-specific helpers ─────────────────────────────────────

/**
 * Returns true if a match is open/scheduled AND either has no date
 * (not yet scheduled) or its date is today or in the future.
 * Past-dated scheduled entries are treated as stale placeholders and hidden.
 */
export function isFutureOrOpenMatch(m: Match): boolean {
  if (m.status !== 'scheduled') return false;
  if (!m.date) return true; // no date = open/unscheduled, always show
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return m.date >= today;
}

/**
 * Returns all matches (any status) where teamId is home OR away.
 */
export function getMatchesForTeam(teamId: string): Match[] {
  const id = teamId.toLowerCase();
  return MATCHES.filter(m => m.homeTeamId === id || m.awayTeamId === id);
}

/**
 * Scheduled matches for a specific team, sorted ascending by date (null dates last).
 */
export function getScheduledMatchesForTeam(teamId: string): Match[] {
  return getMatchesForTeam(teamId)
    .filter(m => isFutureOrOpenMatch(m))
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
}

/**
 * Completed matches for a specific team, sorted descending by date (newest first).
 */
export function getCompletedMatchesForTeam(teamId: string): Match[] {
  const today = new Date().toISOString().slice(0, 10);
  return getMatchesForTeam(teamId)
    .filter(m =>
      m.status === 'completed' &&
      m.result != null &&
      (!m.date || m.date <= today),
    )
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });
}

// ── By-league grouping helpers ────────────────────────────────

/**
 * All scheduled matches grouped by leagueId.
 * Matches within each group are sorted ascending by date (null last).
 * Use LEAGUES.sortOrder to re-sort groups on the consumer side.
 */
export function getScheduledMatchesByLeague(): Array<{ leagueId: string; matches: Match[] }> {
  const scheduled = getScheduledMatches();
  const map = new Map<string, Match[]>();
  for (const m of scheduled) {
    if (!map.has(m.leagueId)) map.set(m.leagueId, []);
    map.get(m.leagueId)!.push(m);
  }
  return Array.from(map.entries()).map(([leagueId, matches]) => ({ leagueId, matches }));
}

/**
 * All completed matches grouped by leagueId.
 * Matches within each group are sorted descending by date (newest first).
 */
export function getCompletedMatchesByLeague(): Array<{ leagueId: string; matches: Match[] }> {
  const completed = getCompletedMatches();
  const map = new Map<string, Match[]>();
  for (const m of completed) {
    if (!map.has(m.leagueId)) map.set(m.leagueId, []);
    map.get(m.leagueId)!.push(m);
  }
  return Array.from(map.entries()).map(([leagueId, matches]) => ({ leagueId, matches }));
}

// ── Matchday grouping ─────────────────────────────────────────

export interface MatchdayGroup {
  matchday: number | null;
  matches: Match[];
}

/**
 * Groups a list of matches by matchday, sorted descending (latest first).
 * Matches without a matchday are collected under `null` and placed last.
 */
export function groupMatchesByMatchday(matches: Match[]): MatchdayGroup[] {
  const map = new Map<number | null, Match[]>();
  for (const m of matches) {
    const key = m.matchday ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  const numbered = Array.from(map.entries())
    .filter(([k]) => k !== null)
    .sort(([a], [b]) => (b as number) - (a as number))
    .map(([matchday, ms]) => ({ matchday, matches: ms }));
  const nullGroup = map.has(null)
    ? [{ matchday: null as null, matches: map.get(null)! }]
    : [];
  return [...numbered, ...nullGroup];
}

// ── Match classification helpers ──────────────────────────────

/**
 * Returns true if home + away are valid MDU leg counts (both ints, sum = 18).
 */
export function isValidMatchResult(home: number, away: number): boolean {
  return (
    Number.isInteger(home) && Number.isInteger(away) &&
    home >= 0 && home <= 18 &&
    away >= 0 && away <= 18 &&
    home + away === 18
  );
}

/** Returns true when a match has no date (not yet scheduled). */
export function isPlaceholderDate(m: Match): boolean {
  return !m.date;
}

/**
 * Returns true when the match is scheduled and its date is today or later.
 * Matches with no date are NOT considered future-scheduled (they are open/floating).
 */
export function isFutureScheduledMatch(m: Match): boolean {
  if (m.status !== 'scheduled' || !m.date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return m.date >= today;
}

/**
 * Returns true when the match is still scheduled but its date is in the past.
 * These are stale placeholders — hidden from Spielplan and "Letzte Spiele".
 */
export function isPastScheduledWithoutResult(m: Match): boolean {
  if (m.status !== 'scheduled' || !m.date) return false;
  const today = new Date().toISOString().slice(0, 10);
  return m.date < today;
}

/**
 * Returns true when the match should appear in Spielplan / "Nächste Spiele":
 * scheduled with a future date, or scheduled with no date at all.
 * Alias for isFutureOrOpenMatch — use whichever reads better at the call site.
 */
export function isUpcomingOrOpenMatch(m: Match): boolean {
  return isFutureOrOpenMatch(m);
}

/**
 * Returns true when the match is a valid completed result that may appear in
 * "Letzte Spiele" / Ergebnisse:
 *   - status = 'completed'
 *   - result is non-null with a valid MDU score (sum = 18)
 *   - date is null OR in the past / today (never a future date)
 */
export function isCompletedMatch(m: Match): boolean {
  if (m.status !== 'completed' || m.result == null) return false;
  if (!isValidMatchResult(m.result.home, m.result.away)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return !m.date || m.date <= today;
}
