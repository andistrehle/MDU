// ============================================================
// MDC — Einzelergebnisse der Saison 2025/26: Zugriff und Auswertung
// ============================================================
//
// Die Rohzeilen stehen in `archive-2025-26.generated.ts` und kommen aus der
// Arbeitsmappe des Betreibers (siehe `scripts/mdc-import-saison-2025-26.py`).
// Hier werden sie einmal aufgeschlüsselt und über kleine Funktionen
// zugänglich gemacht.
//
// ECHTE DATEN, echte Personen: 744 Turniere vom 01.09.2025 bis 26.07.2026.
// Die Summe der Punkte je Spieler ergibt exakt die Endrangliste derselben
// Saison — beides kommt aus derselben Mappe und wird beim Import
// gegeneinander gerechnet.
//
// Was hier bewusst NICHT steht: Turnierbäume, Legs, Meldestände. Die Mappe
// führt nur die Platzierung und die Punkte. Erfunden wird der Rest nicht —
// die Demo-Turniere unter `tournaments.ts` sind davon getrennt.
// ============================================================

import { ARCHIVE_2025_26_RAW } from './archive-2025-26.generated';
import { PARSED_MEN, PARSED_WOMEN } from './players';
import { isFormerVenue, venueName } from './venues';
import { FINAL_SEASON } from './season';

export interface ArchiveResult {
  /** Endplatzierung, 1-basiert. Die Mappe führt jeden Platz genau einmal. */
  rank: number;
  passNr: number;
  points: number;
  /** Spieler aus dem Stamm. `null` wäre eine Nummer ohne Ranglistenzeile. */
  playerId: string | null;
}

export interface ArchiveTournament {
  /** „2025-09-01-tonys-wirtshaus" — Datum und Spielort, sonst nichts. */
  id: string;
  date: string;
  venueId: string;
  venueName: string;
  /** Lokal, in dem heute nicht mehr gespielt wird → keine Spielort-Seite. */
  formerVenue: boolean;
  participants: number;
  results: ArchiveResult[];
}

/**
 * Passnummer → Spieler-ID, ausschließlich aus den beiden Wertungen DIESER
 * Saison. Nicht über den Gesamtstamm: Dort tragen ein paar Nummern in
 * verschiedenen Saisons verschiedene Menschen (siehe `passNumberConflicts`),
 * und ein Ergebnis von 2025/26 gehört zu dem, der damals so gewertet wurde.
 */
const PLAYER_BY_PASS = new Map<number, string>(
  [...PARSED_MEN, ...PARSED_WOMEN].map(row => [row.passNr, row.playerId]),
);

function parse(raw: string): ArchiveTournament {
  const [date, venueId, results] = raw.split('|');
  return {
    id: `${date}-${venueId}`,
    date,
    venueId,
    venueName: venueName(venueId),
    formerVenue: isFormerVenue(venueId),
    participants: results.split(',').length,
    results: results.split(',').map((eintrag, index) => {
      const [pass, points] = eintrag.split(':');
      const passNr = Number(pass);
      return {
        rank: index + 1,
        passNr,
        points: Number(points),
        playerId: PLAYER_BY_PASS.get(passNr) ?? null,
      };
    }),
  };
}

/** Alle Turniere der Saison, ältestes zuerst (so wie in der Mappe). */
export const ARCHIVE_TOURNAMENTS: ArchiveTournament[] = ARCHIVE_2025_26_RAW.map(parse);

/** Neuestes zuerst — die übliche Reihenfolge in der Oberfläche. */
export const ARCHIVE_TOURNAMENTS_DESC: ArchiveTournament[] = [...ARCHIVE_TOURNAMENTS]
  .sort((a, b) => b.date.localeCompare(a.date) || a.venueName.localeCompare(b.venueName));

const BY_ID = new Map(ARCHIVE_TOURNAMENTS.map(t => [t.id, t]));

export function getArchiveTournament(id: string): ArchiveTournament | undefined {
  return BY_ID.get(id);
}

/** Turniere eines Spielorts, neuestes zuerst. */
export function archiveTournamentsAtVenue(venueId: string): ArchiveTournament[] {
  return ARCHIVE_TOURNAMENTS_DESC.filter(t => t.venueId === venueId);
}

export interface ArchiveAppearance {
  tournament: ArchiveTournament;
  result: ArchiveResult;
}

const BY_PLAYER = new Map<string, ArchiveAppearance[]>();
for (const tournament of ARCHIVE_TOURNAMENTS_DESC) {
  for (const result of tournament.results) {
    if (!result.playerId) continue;
    const liste = BY_PLAYER.get(result.playerId);
    if (liste) liste.push({ tournament, result });
    else BY_PLAYER.set(result.playerId, [{ tournament, result }]);
  }
}

/** Alle Turniere eines Spielers samt seinem Ergebnis, neuestes zuerst. */
export function archiveAppearances(playerId: string): ArchiveAppearance[] {
  return BY_PLAYER.get(playerId) ?? [];
}

export interface ArchivePlayerStats {
  starts: number;
  points: number;
  /** Beste Platzierung der Saison. */
  bestFinish: number;
  wins: number;
  podiums: number;
  /** Spielorte, an denen der Spieler angetreten ist. */
  venueIds: string[];
}

const STATS_BY_PLAYER = new Map<string, ArchivePlayerStats>();
for (const [playerId, auftritte] of BY_PLAYER) {
  STATS_BY_PLAYER.set(playerId, {
    starts: auftritte.length,
    points: auftritte.reduce((sum, a) => sum + a.result.points, 0),
    bestFinish: Math.min(...auftritte.map(a => a.result.rank)),
    wins: auftritte.filter(a => a.result.rank === 1).length,
    podiums: auftritte.filter(a => a.result.rank <= 3).length,
    venueIds: [...new Set(auftritte.map(a => a.tournament.venueId))],
  });
}

/** Saisonbilanz eines Spielers — `undefined`, wenn er nicht angetreten ist. */
export function archivePlayerStats(playerId: string): ArchivePlayerStats | undefined {
  return STATS_BY_PLAYER.get(playerId);
}

export interface ArchiveVenueSummary {
  venueId: string;
  name: string;
  formerVenue: boolean;
  tournaments: number;
  entries: number;
  /** Größtes Feld, das dieses Lokal in der Saison hatte. */
  largestField: number;
}

/** Spielorte der Saison, nach Anzahl der Turniere sortiert. */
export function archiveVenues(): ArchiveVenueSummary[] {
  const map = new Map<string, ArchiveVenueSummary>();
  for (const t of ARCHIVE_TOURNAMENTS) {
    const eintrag = map.get(t.venueId) ?? {
      venueId: t.venueId, name: t.venueName, formerVenue: t.formerVenue,
      tournaments: 0, entries: 0, largestField: 0,
    };
    eintrag.tournaments += 1;
    eintrag.entries += t.participants;
    eintrag.largestField = Math.max(eintrag.largestField, t.participants);
    map.set(t.venueId, eintrag);
  }
  return [...map.values()].sort((a, b) => b.tournaments - a.tournaments || a.name.localeCompare(b.name));
}

/** Turniere eines Monats („2025-09"), neuestes zuerst. */
export function archiveMonths(): { month: string; tournaments: ArchiveTournament[] }[] {
  const map = new Map<string, ArchiveTournament[]>();
  for (const t of ARCHIVE_TOURNAMENTS_DESC) {
    const monat = t.date.slice(0, 7);
    map.set(monat, [...(map.get(monat) ?? []), t]);
  }
  return [...map.entries()]
    .map(([month, tournaments]) => ({ month, tournaments }))
    .sort((a, b) => b.month.localeCompare(a.month));
}

/** Kennzahlen der Saison — alles gerechnet, nichts gepflegt. */
export const ARCHIVE_STATS = {
  seasonId: FINAL_SEASON.id,
  tournaments: ARCHIVE_TOURNAMENTS.length,
  entries: ARCHIVE_TOURNAMENTS.reduce((sum, t) => sum + t.participants, 0),
  points: ARCHIVE_TOURNAMENTS.reduce(
    (sum, t) => sum + t.results.reduce((s, r) => s + r.points, 0), 0,
  ),
  players: new Set(
    ARCHIVE_TOURNAMENTS.flatMap(t => t.results.map(r => r.passNr)),
  ).size,
  venues: new Set(ARCHIVE_TOURNAMENTS.map(t => t.venueId)).size,
  firstDate: ARCHIVE_TOURNAMENTS[0].date,
  lastDate: ARCHIVE_TOURNAMENTS[ARCHIVE_TOURNAMENTS.length - 1].date,
  largestField: Math.max(...ARCHIVE_TOURNAMENTS.map(t => t.participants)),
};

/** Die Turniere mit dem größten Feld — Aufhänger für die Archivseite. */
export function biggestArchiveTournaments(limit = 5): ArchiveTournament[] {
  return [...ARCHIVE_TOURNAMENTS]
    .sort((a, b) => b.participants - a.participants || b.date.localeCompare(a.date))
    .slice(0, limit);
}
