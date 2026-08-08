// ============================================================
// MDC — Turniere: Zugriffs- und Auswertungsfunktionen
// ============================================================
//
// Die reinen Datensätze stehen in `tournaments.generated.ts` (erzeugt von
// `scripts/mdc-generate-tournaments.mjs`). Hier liegt alles, was von Hand
// gepflegt wird: Sortierungen, Filter und kleine Auswertungen.
// ============================================================

import type { Tournament, TournamentResult } from './types';
import { TOURNAMENTS } from './tournaments.generated';
import { DEMO_TODAY } from './season';
import { getVenue } from './venues';

export { TOURNAMENTS };

const BY_ID = new Map(TOURNAMENTS.map(t => [t.id, t]));

export function getTournament(id: string): Tournament | undefined {
  return BY_ID.get(id);
}

/** Gespielte Turniere, neuestes zuerst. */
export function finishedTournaments(): Tournament[] {
  return TOURNAMENTS
    .filter(t => t.status === 'finished')
    .sort((a, b) => b.date.localeCompare(a.date) || a.venueId.localeCompare(b.venueId));
}

/** Kommende Turniere, nächstes zuerst. */
export function upcomingTournaments(): Tournament[] {
  return TOURNAMENTS
    .filter(t => t.status !== 'finished')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

/** Das nächste anstehende Ranking-Turnier (für den Header-Button). */
export function nextTournament(): Tournament | undefined {
  return upcomingTournaments()[0];
}

/** Das zuletzt gespielte Turnier. */
export function latestTournament(): Tournament | undefined {
  return finishedTournaments()[0];
}

/**
 * Kommende Turniere der nächsten sieben Tage, nach Wochentag gruppiert —
 * Grundlage für „Diese Woche bei der MDC".
 */
export function tournamentsThisWeek(): { date: string; tournaments: Tournament[] }[] {
  const start = new Date(`${DEMO_TODAY}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const endIso = end.toISOString().slice(0, 10);

  const inRange = upcomingTournaments().filter(t => t.date >= DEMO_TODAY && t.date <= endIso);
  const dates = [...new Set(inRange.map(t => t.date))].sort();
  return dates.map(date => ({
    date,
    tournaments: inRange
      .filter(t => t.date === date)
      .sort((a, b) => a.time.localeCompare(b.time) || a.venueId.localeCompare(b.venueId)),
  }));
}

/** Turniere eines Spielorts, neueste zuerst. */
export function tournamentsAtVenue(venueId: string): Tournament[] {
  return TOURNAMENTS
    .filter(t => t.venueId === venueId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Alle gespielten Turniere eines Spielers samt seinem Ergebnis, neueste zuerst. */
export function tournamentsOfPlayer(playerId: string): { tournament: Tournament; result: TournamentResult }[] {
  return finishedTournaments()
    .map(tournament => {
      const result = tournament.results.find(r => r.playerId === playerId);
      return result ? { tournament, result } : null;
    })
    .filter((x): x is { tournament: Tournament; result: TournamentResult } => x !== null);
}

/** Die ersten drei Plätze eines beendeten Turniers. */
export function podium(tournament: Tournament): TournamentResult[] {
  return tournament.results.filter(r => r.rank <= 3).sort((a, b) => a.rank - b.rank);
}

/** Sieger-ID eines beendeten Turniers (oder null). */
export function winnerId(tournament: Tournament): string | null {
  return tournament.results.find(r => r.rank === 1)?.playerId ?? null;
}

/** Anzeigename inkl. Spielort: „Sommer-Ranking #10 · Harlekin". */
export function tournamentTitle(tournament: Tournament): string {
  const venue = getVenue(tournament.venueId);
  return venue ? `${tournament.name} · ${venue.name}` : tournament.name;
}

/** Freie Plätze eines noch offenen Turniers. */
export function freeSlots(tournament: Tournament): number {
  return Math.max(0, tournament.maxPlayers - tournament.participantIds.length);
}
