// ============================================================
// MDC — Spielerstamm
// ============================================================
//
// Der Stamm wird NICHT von Hand gepflegt, sondern aus den beiden
// Endranglisten der Saison 2025/26 aufgebaut. Jeder Spieler, der in einer
// Rangliste steht, ist damit automatisch im Stamm — und umgekehrt kann kein
// Profil auf einen Spieler zeigen, den es in der Wertung nicht gibt.
//
// Bewusst NICHT gespeichert: Fotos, Geburtsdaten, Wurfhand, Lieblings-Doppel.
// Das sind echte Personen — was die MDC-Auswertung nicht hergibt, wird hier
// auch nicht erfunden. Die Oberfläche zeigt stattdessen Initialen-Avatare und
// leitet alles Weitere aus den Ergebnissen ab.
//
// Es gibt keinerlei Verknüpfung zum MDU-Spielerstamm (`lib/data/players.ts`) —
// MDC und MDU sind getrennte Projekte mit eigenen Passnummern.
// ============================================================

import type { Division, Player } from './types';
import { parseRankingRows } from './parse-ranking';
import { RANKING_MEN_2025_26_RAW } from './ranking-2025-26-men';
import { RANKING_WOMEN_2025_26_RAW } from './ranking-2025-26-women';
import { RANKING_SOMMER_MEN_RAW } from './ranking-sommer-2026-men';
import { RANKING_SOMMER_WOMEN_RAW } from './ranking-sommer-2026-women';

export const PARSED_MEN = parseRankingRows(RANKING_MEN_2025_26_RAW, 'men');
export const PARSED_WOMEN = parseRankingRows(RANKING_WOMEN_2025_26_RAW, 'women');
export const PARSED_SOMMER_MEN = parseRankingRows(RANKING_SOMMER_MEN_RAW, 'men');
export const PARSED_SOMMER_WOMEN = parseRankingRows(RANKING_SOMMER_WOMEN_RAW, 'women');

/**
 * Der Stamm wird über die Spieler-ID zusammengeführt, NICHT über die
 * Passnummer. Grund: Zwei Passnummern (84 und 303) zeigen in den beiden
 * Auswertungen auf verschiedene Menschen. Über die Nummer zusammengeführt
 * würde einer den anderen überschreiben; über den Namen bleiben beide
 * erhalten und die Doppelbelegung wird sichtbar statt still aufgelöst.
 */
function buildPlayers(): Player[] {
  const players = new Map<string, Player>();

  for (const row of [...PARSED_MEN, ...PARSED_WOMEN, ...PARSED_SOMMER_MEN, ...PARSED_SOMMER_WOMEN]) {
    const existing = players.get(row.playerId);
    players.set(row.playerId, {
      id: row.playerId,
      passNr: row.passNr,
      firstName: row.firstName,
      lastName: row.lastName,
      // Spitzname und Stammlokal stehen mal in der einen, mal in der anderen
      // Auswertung — der erste bekannte Wert gewinnt.
      nickname: existing?.nickname ?? row.nickname,
      division: row.division,
      photoUrl: null,
      homeVenueId: existing?.homeVenueId ?? row.homeVenueId,
    });
  }

  return [...players.values()].sort((a, b) => a.passNr - b.passNr || a.id.localeCompare(b.id));
}

/**
 * Passnummern, die mehr als einen Spieler tragen. Aktuell 84 und 303 — in der
 * Saison-Endrangliste und im Sommer-Ranking steht dort jeweils ein anderer
 * Mensch. Wird auf der Spielerseite ausgewiesen, damit es auffällt und
 * geklärt werden kann.
 */
export function passNumberConflicts(): { passNr: number; players: Player[] }[] {
  const byPass = new Map<number, Player[]>();
  for (const player of PLAYERS) {
    byPass.set(player.passNr, [...(byPass.get(player.passNr) ?? []), player]);
  }
  return [...byPass.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([passNr, players]) => ({ passNr, players }))
    .sort((a, b) => a.passNr - b.passNr);
}

export const PLAYERS: Player[] = buildPlayers();

const BY_ID = new Map(PLAYERS.map(p => [p.id, p]));
const BY_PASS = new Map(PLAYERS.map(p => [p.passNr, p]));

export function getPlayer(id: string): Player | undefined {
  return BY_ID.get(id);
}

export function getPlayerByPassNr(passNr: number): Player | undefined {
  return BY_PASS.get(passNr);
}

export function playersOfDivision(division: Division): Player[] {
  return PLAYERS.filter(p => p.division === division);
}

/** Voller Anzeigename „Vorname Nachname". */
export function playerName(player: Player): string {
  return `${player.firstName} ${player.lastName}`;
}

/** Kurzform für enge Tabellen: „P. Ruhland". */
export function playerShortName(player: Player): string {
  return `${player.firstName.charAt(0)}. ${player.lastName}`;
}

/** Initialen für den Platzhalter-Avatar. */
export function playerInitials(player: Player): string {
  return `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`.toUpperCase();
}

/** Freitextsuche über Name, Spitzname und Passnummer. */
export function searchPlayers(players: Player[], query: string): Player[] {
  const q = query.trim().toLowerCase();
  if (!q) return players;
  return players.filter(p =>
    playerName(p).toLowerCase().includes(q) ||
    (p.nickname?.toLowerCase().includes(q) ?? false) ||
    String(p.passNr).includes(q),
  );
}
