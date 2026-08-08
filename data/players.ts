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

export const PARSED_MEN = parseRankingRows(RANKING_MEN_2025_26_RAW, 'men');
export const PARSED_WOMEN = parseRankingRows(RANKING_WOMEN_2025_26_RAW, 'women');

/**
 * Spieler, die (noch) in keiner vorliegenden Ranglistenseite stehen, aber im
 * Spielbetrieb auftauchen. Aktuell nur Patrick Müller: Er spielt das
 * Sommer-Ranking mit, seine Saisonplatzierung liegt in den noch fehlenden
 * Plätzen 199–280 der Männer-Auswertung.
 */
const EXTRA_PLAYERS: Player[] = [
  {
    id: 'patrick-mueller',
    passNr: 56,
    firstName: 'Patrick',
    lastName: 'Müller',
    nickname: null,
    division: 'men',
    photoUrl: null,
    homeVenueId: null,
  },
];

function buildPlayers(): Player[] {
  const players = new Map<number, Player>();

  for (const row of [...PARSED_MEN, ...PARSED_WOMEN]) {
    players.set(row.passNr, {
      id: row.playerId,
      passNr: row.passNr,
      firstName: row.firstName,
      lastName: row.lastName,
      nickname: row.nickname,
      division: row.division,
      photoUrl: null,
      homeVenueId: row.homeVenueId,
    });
  }
  for (const extra of EXTRA_PLAYERS) {
    if (!players.has(extra.passNr)) players.set(extra.passNr, extra);
  }

  return [...players.values()].sort((a, b) => a.passNr - b.passNr);
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
