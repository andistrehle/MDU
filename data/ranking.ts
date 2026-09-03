// ============================================================
// MDC — Wertungen
// ============================================================
//
// LAUFEND — Saison 2026/27
//   Die Wertung wird aus den Ergebnislisten der Lokale gerechnet
//   (`results-2026-27.ts`), nicht von Hand gepflegt: Punkte je Spieler
//   summiert, Teilnahmen gezählt, Schnitt = Punkte / Teilnahmen. Kommt eine
//   Liste dazu, ändert sich die Rangliste von selbst — und kann gar nicht
//   erst zur Summe darunter im Widerspruch stehen.
//
//   Was die Wertung NICHT tut: Punkte aus der Vorsaison mitschleppen, fehlende
//   Listen schätzen oder Spieler erfinden. Liegt keine Liste vor, ist die
//   Wertung leer und `RUNNING_HAS_RESULTS` falsch; die Seiten zeigen dann
//   einen Hinweis statt einer leeren Tabelle.
//
// ARCHIV — zwei abgeschlossene Wertungen, beide echt:
//   1. ENDRANGLISTE 2025/26 — Saison-Endstand vom 27.07.2026, getrennt nach
//      Männern und Frauen, mit Ausschüttung. Quelle: `ranking-final.ts`.
//   2. SOMMER-RANKING 2026 — Endstand der Zwischenserie vom 01.09.2026.
//      Quelle: `ranking-sommer-2026-*.ts`.
//
// Die Turniere in `tournaments.generated.ts` sind weiterhin Demo-Material und
// zahlen auf KEINE dieser Ranglisten ein — sie zeigen nur, wie Turnierseiten,
// Ergebnislisten und Turnierbäume aussehen.
// ============================================================

import type { Division, RankingEntry } from './types';
import {
  PLAYERS, PARSED_SOMMER_MEN, PARSED_SOMMER_WOMEN,
  playerIdForSheetRow, getPlayerByPassNr,
} from './players';
import { RESULT_SHEETS, type SheetRow } from './results-2026-27';
import { FINAL_RANKING_2025_26 } from './ranking-final';
import { VENUES } from './venues';

function toEntries(rows: typeof PARSED_SOMMER_MEN): RankingEntry[] {
  return rows.map(row => ({
    rank: row.rank,
    sharedRank: row.sharedRank,
    previousRank: null,
    trend: row.trend,
    playerId: row.playerId,
    points: row.points,
    tournaments: row.tournaments,
    average: Math.round((row.points / row.tournaments) * 100) / 100,
    // Beste Platzierung und Turniersiege gehen aus der Auswertung nicht
    // hervor — hier wird nichts geraten.
    bestFinish: 0,
    wins: 0,
  }));
}

const SUMMER_BY_DIVISION: Record<Division, RankingEntry[]> = {
  men: toEntries(PARSED_SOMMER_MEN),
  women: toEntries(PARSED_SOMMER_WOMEN),
};

/** Endstand des Sommer-Rankings 2026, Männer und Frauen zusammen. */
export const SUMMER_RANKING: RankingEntry[] = [
  ...SUMMER_BY_DIVISION.men,
  ...SUMMER_BY_DIVISION.women,
].sort((a, b) => b.points - a.points);

const SUMMER_BY_PLAYER = new Map(SUMMER_RANKING.map(e => [e.playerId, e]));

export function getSummerEntry(playerId: string): RankingEntry | undefined {
  return SUMMER_BY_PLAYER.get(playerId);
}

/** Sommer-Ranking einer Wertungsklasse — gespielt gemeinsam, gewertet getrennt. */
export function summerRankingOf(division: Division): RankingEntry[] {
  return SUMMER_BY_DIVISION[division];
}

/** Endrangliste 2025/26 einer Wertungsklasse (Archiv). */
export function finalRankingOf(division: Division): RankingEntry[] {
  return FINAL_RANKING_2025_26[division];
}

// ------------------------------------------------------------
// Laufende Saison 2026/27
// ------------------------------------------------------------

/**
 * Wertung der laufenden Saison, gerechnet aus den Ergebnislisten.
 *
 * Geteilte Plätze entstehen von selbst: Wer punktgleich ist, bekommt
 * denselben Platz, und die nächste Platznummer überspringt die Gruppe —
 * genauso wie in der offiziellen Auswertung.
 *
 * Der Trend bleibt „gleich": Ein Auf oder Ab bräuchte den Stand der
 * Vorwoche, und den gibt es hier noch nicht. Erfunden wird er nicht.
 */
/**
 * Wertungsklasse einer Zettelzeile: erst das Kreuz auf dem Zettel, sonst die
 * Klasse aus dem Spielerstamm über die Passnummer. Ist beides unbekannt,
 * `null` — dann bleibt die Zeile offen.
 */
function divisionOfRow(row: { division: Division | null; passNr: number | null }): Division | null {
  if (row.division) return row.division;
  if (row.passNr === null) return null;
  return getPlayerByPassNr(row.passNr)?.division ?? null;
}

/**
 * Zeilen, die keiner Wertungsklasse zugeordnet werden konnten: Auf dem Zettel
 * war M/F nicht angekreuzt UND die Passnummer steht nicht im Stamm. Die
 * Oberfläche weist sie aus, statt sie zu verschweigen.
 */
export function openSheetRows(): { sheetId: string; row: SheetRow }[] {
  return RESULT_SHEETS.flatMap(sheet =>
    sheet.rows
      .filter(row => !divisionOfRow(row))
      .map(row => ({ sheetId: sheet.id, row })),
  );
}

function buildRunningRanking(): Record<Division, RankingEntry[]> {
  const konten = new Map<string, {
    division: Division; points: number; tournaments: number; bestFinish: number; wins: number;
  }>();

  for (const sheet of RESULT_SHEETS) {
    for (const row of sheet.rows) {
      const division = divisionOfRow(row);
      // Ohne Wertungsklasse kann die Zeile in keiner der beiden Ranglisten
      // stehen. Sie fällt hier heraus und wird über `openSheetRows()`
      // ausgewiesen, damit sie nicht einfach verschwindet.
      if (!division) continue;

      const id = playerIdForSheetRow(row);
      const konto = konten.get(id) ?? {
        division, points: 0, tournaments: 0, bestFinish: Infinity, wins: 0,
      };
      konto.points += row.points;
      konto.tournaments += 1;
      konto.bestFinish = Math.min(konto.bestFinish, row.place);
      if (row.place === 1) konto.wins += 1;
      konten.set(id, konto);
    }
  }

  const je: Record<Division, RankingEntry[]> = { men: [], women: [] };

  for (const division of ['men', 'women'] as Division[]) {
    const liste = [...konten.entries()]
      .filter(([, k]) => k.division === division)
      .sort((a, b) => b[1].points - a[1].points || a[0].localeCompare(b[0]));

    let platz = 0;
    let vorherPunkte: number | null = null;
    let vorherPlatz = 0;

    je[division] = liste.map(([playerId, k], index) => {
      platz = index + 1;
      const geteilt = k.points === vorherPunkte;
      const eigenerPlatz = geteilt ? vorherPlatz : platz;
      if (!geteilt) { vorherPunkte = k.points; vorherPlatz = platz; }

      return {
        rank: eigenerPlatz,
        // „geteilt" markiert die zweite und jede weitere Zeile einer Gruppe —
        // dort bleibt die Platzspalte leer, wie in der Auswertung.
        sharedRank: geteilt,
        previousRank: null,
        trend: 'same',
        playerId,
        points: k.points,
        tournaments: k.tournaments,
        average: Math.round((k.points / k.tournaments) * 100) / 100,
        bestFinish: Number.isFinite(k.bestFinish) ? k.bestFinish : 0,
        wins: k.wins,
      };
    });
  }

  return je;
}

const RUNNING_BY_DIVISION: Record<Division, RankingEntry[]> = buildRunningRanking();

/** Wertung der laufenden Saison einer Wertungsklasse. */
export function runningRankingOf(division: Division): RankingEntry[] {
  return RUNNING_BY_DIVISION[division];
}

/**
 * Liegt für die laufende Saison überhaupt schon eine Wertung vor?
 * Wird abgefragt, statt irgendwo ein Datum hart einzutragen — die Seiten
 * schalten dadurch von selbst um, wenn die Ergebnisse eintreffen.
 */
export const RUNNING_HAS_RESULTS =
  RUNNING_BY_DIVISION.men.length > 0 || RUNNING_BY_DIVISION.women.length > 0;

// ------------------------------------------------------------
// Kennzahlen für die Statistik-Karten der Startseite
// ------------------------------------------------------------

export interface MdcStats {
  /**
   * Spitzenreiter der Männer-Endrangliste 2025/26 — also des Archivs, nicht
   * der laufenden Saison. Der Name sagt das ausdrücklich: In der Oberfläche
   * darf daraus keine „aktuelle Nummer 1" werden, solange 2026/27 ohne
   * Ergebnisse ist.
   */
  archivedLeaderId: string | null;
  archivedLeaderPoints: number;
  /** Meiste Turnierteilnahmen der archivierten Saison — und wer sie hat. */
  mostAppearances: number;
  mostAppearancesPlayerId: string | null;
  players: number;
  venues: number;
  /** Turniere, die das Sommer-Ranking gewertet hat (meiste Teilnahmen). */
  summerTournaments: number;
}

function computeStats(): MdcStats {
  const all = [...FINAL_RANKING_2025_26.men, ...FINAL_RANKING_2025_26.women];
  const top = all.reduce(
    (best, e) => (e.tournaments > best.tournaments ? e : best),
    all[0],
  );
  const leader = FINAL_RANKING_2025_26.men[0] ?? null;

  return {
    archivedLeaderId: leader?.playerId ?? null,
    archivedLeaderPoints: leader?.points ?? 0,
    mostAppearances: top?.tournaments ?? 0,
    mostAppearancesPlayerId: top?.playerId ?? null,
    players: PLAYERS.length,
    venues: VENUES.length,
    // Untergrenze: So oft war der fleißigste Spieler dabei — mehr Turniere
    // hatte die Serie mindestens.
    summerTournaments: Math.max(0, ...SUMMER_RANKING.map(e => e.tournaments)),
  };
}

export const MDC_STATS: MdcStats = computeStats();
