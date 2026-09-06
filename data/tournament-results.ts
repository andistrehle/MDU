// ============================================================
// MDC — Einzelergebnisse: Zugriff und Auswertung
// ============================================================
//
// Die Rohzeilen stehen je Saison in `results-<saison>.generated.ts` und kommen
// aus den Arbeitsmappen des Betreibers (siehe
// `scripts/mdc-import-saison.py`). Hier werden sie einmal aufgeschlüsselt und
// über kleine Funktionen zugänglich gemacht.
//
// ECHTE DATEN, echte Personen — beide Saisons:
//
//   2025/26   abgeschlossen, 744 Turniere
//   2026/27   läuft, wächst mit jeder neuen Fassung der Mappe
//
// Die Summe der Punkte je Spieler ergibt exakt die Rangliste derselben Saison;
// beides kommt aus derselben Mappe und wird beim Import gegeneinander
// gerechnet (`scripts/mdc-check-saison.ts` prüft es noch einmal hier).
//
// Was hier bewusst NICHT steht: Turnierbäume, Legs, Meldestände. Die Mappe
// führt nur Platzierung und Punkte — erfunden wird der Rest nicht.
// ============================================================

import { pointsFor } from '@/lib/mdc/points';
import { correctionsFor } from './corrections';
import { RESULTS_2025_26_RAW } from './results-2025-26.generated';
import { RESULTS_2026_27_RAW } from './results-2026-27.generated';
import {
  PARSED_MEN, PARSED_WOMEN, PARSED_RUNNING_MEN, PARSED_RUNNING_WOMEN, getPlayerByPassNr,
} from './players';
import { isFormerVenue, venueName } from './venues';
import { FINAL_SEASON, RUNNING_SEASON } from './season';

export interface TournamentResultRow {
  /** Endplatzierung, 1-basiert. Die Mappe führt jeden Platz genau einmal. */
  rank: number;
  passNr: number;
  points: number;
  /** Spieler aus dem Stamm. `null` wäre eine Nummer ohne Ranglistenzeile. */
  playerId: string | null;
}

export interface TournamentRecord {
  /** „2025-09-01-tonys-wirtshaus" — Datum und Spielort, sonst nichts. */
  id: string;
  seasonId: string;
  date: string;
  venueId: string;
  venueName: string;
  /** Lokal, in dem heute nicht mehr gespielt wird → keine Spielort-Seite. */
  formerVenue: boolean;
  participants: number;
  results: TournamentResultRow[];
  /**
   * Gegenüber der Auswertung berichtigt (siehe `corrections.ts`). Dann sind
   * Feldgröße und Punkte hier andere als in der Mappe — die Oberfläche weist
   * das beim Turnier aus.
   */
  corrected: boolean;
  /** Starterzahl, die die Arbeitsmappe führt — ohne Berichtigung dieselbe. */
  participantsInWorkbook: number;
}

/**
 * Passnummer → Spieler-ID, je Saison aus deren eigener Wertung. Nicht über den
 * Gesamtstamm: Dort tragen ein paar Nummern in verschiedenen Saisons
 * verschiedene Menschen (siehe `passNumberConflicts`), und ein Ergebnis gehört
 * zu dem, der in dieser Saison so gewertet wurde.
 */
const PLAYER_BY_PASS: Record<string, Map<number, string>> = {
  [FINAL_SEASON.id]: new Map(
    [...PARSED_MEN, ...PARSED_WOMEN].map(row => [row.passNr, row.playerId]),
  ),
  [RUNNING_SEASON.id]: new Map(
    [...PARSED_RUNNING_MEN, ...PARSED_RUNNING_WOMEN].map(row => [row.passNr, row.playerId]),
  ),
};

const RAW: Record<string, string[]> = {
  [FINAL_SEASON.id]: RESULTS_2025_26_RAW,
  [RUNNING_SEASON.id]: RESULTS_2026_27_RAW,
};

/**
 * Spieler-ID zu einer Passnummer: erst aus der Wertung DIESER Saison, sonst
 * aus dem Stamm. Der zweite Weg greift bei berichtigten Zeilen — wer in der
 * Auswertung fehlt, steht auch in ihrer Rangliste nicht.
 */
function playerFor(passNr: number, seasonId: string): string | null {
  return PLAYER_BY_PASS[seasonId]?.get(passNr)
    ?? getPlayerByPassNr(passNr)?.id
    ?? null;
}

function parse(raw: string, seasonId: string): TournamentRecord {
  const [date, venueId, results] = raw.split('|');
  const id = `${date}-${venueId}`;

  // Zeilen der Mappe: Passnummer und die dort verbuchten Punkte.
  const zeilen = results.split(',').map(eintrag => {
    const [pass, points] = eintrag.split(':');
    return { passNr: Number(pass), points: Number(points) };
  });

  // Berichtigungen einsetzen und danach ALLE Punkte neu rechnen: Der
  // Schlüssel hängt an der Feldgröße, ein Starter mehr ändert jede Zeile.
  const korrekturen = correctionsFor(id);
  for (const k of korrekturen) {
    zeilen.splice(k.insertAfterRank, 0, { passNr: k.passNr, points: 0 });
  }
  const participants = zeilen.length;

  return {
    id,
    seasonId,
    date,
    venueId,
    venueName: venueName(venueId),
    formerVenue: isFormerVenue(venueId),
    participants,
    corrected: korrekturen.length > 0,
    participantsInWorkbook: zeilen.length - korrekturen.length,
    results: zeilen.map((zeile, index) => ({
      rank: index + 1,
      passNr: zeile.passNr,
      points: korrekturen.length > 0 ? pointsFor(index + 1, participants) : zeile.points,
      playerId: playerFor(zeile.passNr, seasonId),
    })),
  };
}

/** Alle Turniere einer Saison, ältestes zuerst (so wie in der Mappe). */
const BY_SEASON: Record<string, TournamentRecord[]> = Object.fromEntries(
  Object.entries(RAW).map(([seasonId, rows]) => [
    seasonId, rows.map(raw => parse(raw, seasonId)),
  ]),
);

export function tournamentsOfSeason(seasonId: string): TournamentRecord[] {
  return BY_SEASON[seasonId] ?? [];
}

/** Neuestes zuerst — die übliche Reihenfolge in der Oberfläche. */
export function tournamentsOfSeasonDesc(seasonId: string): TournamentRecord[] {
  return [...tournamentsOfSeason(seasonId)]
    .sort((a, b) => b.date.localeCompare(a.date) || a.venueName.localeCompare(b.venueName));
}

/** Alle Turniere beider Saisons, neuestes zuerst. */
export const ALL_TOURNAMENTS: TournamentRecord[] = Object.values(BY_SEASON)
  .flat()
  .sort((a, b) => b.date.localeCompare(a.date) || a.venueName.localeCompare(b.venueName));

const BY_ID = new Map(ALL_TOURNAMENTS.map(t => [t.id, t]));

export function getTournamentRecord(id: string): TournamentRecord | undefined {
  return BY_ID.get(id);
}

/** Turniere eines Spielorts, neuestes zuerst. */
export function tournamentsAtVenue(venueId: string, seasonId?: string): TournamentRecord[] {
  return ALL_TOURNAMENTS.filter(
    t => t.venueId === venueId && (!seasonId || t.seasonId === seasonId),
  );
}

export interface Appearance {
  tournament: TournamentRecord;
  result: TournamentResultRow;
}

const BY_PLAYER = new Map<string, Appearance[]>();
for (const tournament of ALL_TOURNAMENTS) {
  for (const result of tournament.results) {
    if (!result.playerId) continue;
    const liste = BY_PLAYER.get(result.playerId);
    if (liste) liste.push({ tournament, result });
    else BY_PLAYER.set(result.playerId, [{ tournament, result }]);
  }
}

/** Alle Turniere eines Spielers samt seinem Ergebnis, neuestes zuerst. */
export function appearancesOf(playerId: string, seasonId?: string): Appearance[] {
  const alle = BY_PLAYER.get(playerId) ?? [];
  return seasonId ? alle.filter(a => a.tournament.seasonId === seasonId) : alle;
}

export interface PlayerSeasonStats {
  starts: number;
  points: number;
  /** Beste Platzierung der Saison. */
  bestFinish: number;
  wins: number;
  podiums: number;
  /** Spielorte, an denen der Spieler angetreten ist. */
  venueIds: string[];
}

const STATS = new Map<string, PlayerSeasonStats>();
for (const [playerId, auftritte] of BY_PLAYER) {
  for (const seasonId of Object.keys(BY_SEASON)) {
    const saison = auftritte.filter(a => a.tournament.seasonId === seasonId);
    if (!saison.length) continue;
    STATS.set(`${seasonId}|${playerId}`, {
      starts: saison.length,
      points: saison.reduce((sum, a) => sum + a.result.points, 0),
      bestFinish: Math.min(...saison.map(a => a.result.rank)),
      wins: saison.filter(a => a.result.rank === 1).length,
      podiums: saison.filter(a => a.result.rank <= 3).length,
      venueIds: [...new Set(saison.map(a => a.tournament.venueId))],
    });
  }
}

/** Saisonbilanz eines Spielers — `undefined`, wenn er nicht angetreten ist. */
export function playerSeasonStats(
  playerId: string, seasonId: string,
): PlayerSeasonStats | undefined {
  return STATS.get(`${seasonId}|${playerId}`);
}

export interface VenueSeasonSummary {
  venueId: string;
  name: string;
  formerVenue: boolean;
  tournaments: number;
  entries: number;
  /** Größtes Feld, das dieses Lokal in der Saison hatte. */
  largestField: number;
}

/** Spielorte einer Saison, nach Anzahl der Turniere sortiert. */
export function venuesOfSeason(seasonId: string): VenueSeasonSummary[] {
  const map = new Map<string, VenueSeasonSummary>();
  for (const t of tournamentsOfSeason(seasonId)) {
    const eintrag = map.get(t.venueId) ?? {
      venueId: t.venueId, name: t.venueName, formerVenue: t.formerVenue,
      tournaments: 0, entries: 0, largestField: 0,
    };
    eintrag.tournaments += 1;
    eintrag.entries += t.participants;
    eintrag.largestField = Math.max(eintrag.largestField, t.participants);
    map.set(t.venueId, eintrag);
  }
  return [...map.values()]
    .sort((a, b) => b.tournaments - a.tournaments || a.name.localeCompare(b.name));
}

export interface SeasonStats {
  seasonId: string;
  tournaments: number;
  entries: number;
  points: number;
  players: number;
  venues: number;
  firstDate: string;
  lastDate: string;
  largestField: number;
}

/** Kennzahlen einer Saison — alles gerechnet, nichts gepflegt. */
export function seasonStats(seasonId: string): SeasonStats {
  const liste = tournamentsOfSeason(seasonId);
  return {
    seasonId,
    tournaments: liste.length,
    entries: liste.reduce((sum, t) => sum + t.participants, 0),
    points: liste.reduce((sum, t) => sum + t.results.reduce((s, r) => s + r.points, 0), 0),
    players: new Set(liste.flatMap(t => t.results.map(r => r.passNr))).size,
    venues: new Set(liste.map(t => t.venueId)).size,
    firstDate: liste[0]?.date ?? '',
    lastDate: liste[liste.length - 1]?.date ?? '',
    largestField: Math.max(0, ...liste.map(t => t.participants)),
  };
}

/** Kennzahlen der beiden Saisons — vorgerechnet, weil oft gebraucht. */
export const ARCHIVE_STATS = seasonStats(FINAL_SEASON.id);
export const RUNNING_STATS = seasonStats(RUNNING_SEASON.id);
