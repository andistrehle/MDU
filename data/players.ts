// ============================================================
// MDC — Spielerstamm
// ============================================================
//
// Der Stamm wird NICHT von Hand gepflegt, sondern aus den Auswertungen
// aufgebaut: den beiden Endranglisten 2025/26, dem Sommer-Ranking 2026 und
// den Ergebnislisten der laufenden Saison. Jeder Spieler, der irgendwo in
// einer Wertung steht, ist damit automatisch im Stamm — und umgekehrt kann
// kein Profil auf einen Spieler zeigen, den es in keiner Wertung gibt.
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
import { slugify } from '@/lib/mdc/names';
import { parseRankingRows } from './parse-ranking';
import { RESULT_SHEETS } from './results-2026-27';
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

  // Spieler ohne Passnummer (noch keine vergeben) stehen hinten.
  addPlayersFromSheets(players);

  // Spieler ohne Passnummer (noch keine vergeben) stehen hinten.
  return [...players.values()].sort(
    (a, b) => (a.passNr ?? Infinity) - (b.passNr ?? Infinity) || a.id.localeCompare(b.id),
  );
}

/**
 * Spieler ergänzen, die nur auf den Ergebnislisten der laufenden Saison
 * stehen. Das sind zwei Sorten:
 *
 *   1. Auf dem Zettel als „neu" angekreuzt, noch ohne Passnummer.
 *   2. Mit einer Passnummer, die in keiner der Ranglisten vorkommt — wer
 *      letzte Saison keine Punkte geholt hat, steht dort schlicht nicht.
 *
 * Bekannte Nummern werden NICHT überschrieben: Steht die Nummer schon im
 * Stamm, gilt der Name aus der offiziellen Auswertung, nicht der Kurzname
 * vom Zettel („Bonsai" bleibt Chriss Lwowski).
 *
 * Vom Zettel kennen wir oft nur einen Namen („Moni", „Jakob"). Dann steht
 * der als Vorname da und der Nachname bleibt leer — erfunden wird keiner.
 */
function addPlayersFromSheets(players: Map<string, Player>): void {
  const byPass = new Map<number, Player>();
  for (const p of players.values()) {
    if (p.passNr !== null && !byPass.has(p.passNr)) byPass.set(p.passNr, p);
  }

  for (const sheet of RESULT_SHEETS) {
    for (const row of sheet.rows) {
      // Nummer bereits im Stamm und Zuordnung unstrittig → nichts zu tun.
      if (row.passNr !== null && !row.unsure && byPass.has(row.passNr)) continue;

      // Ohne Wertungsklasse kein Stammeintrag: Die MDC wertet Männer und
      // Frauen getrennt, ein Spieler ohne Klasse hätte keinen Platz. Solche
      // Zeilen bleiben offen (siehe `openSheetRows` in `ranking.ts`) —
      // geraten wird die Klasse nicht.
      const division = row.division
        ?? (row.passNr !== null ? byPass.get(row.passNr)?.division : undefined);
      if (!division) continue;

      const teile = row.writtenName.split(/\s+/);
      const firstName = teile[0];
      const lastName = teile.slice(1).join(' ');
      const basis = slugify(row.writtenName);
      const id = row.passNr === null ? basis : `${basis}-${row.passNr}`;
      if (players.has(id)) continue;

      players.set(id, {
        id,
        passNr: row.passNr,
        firstName,
        lastName,
        nickname: null,
        division,
        photoUrl: null,
        // Kein Stammlokal ableiten: Wo einer einmal gespielt hat, ist noch
        // nicht sein Stammlokal.
        homeVenueId: null,
      });
      if (row.passNr !== null) byPass.set(row.passNr, players.get(id)!);
    }
  }
}

/**
 * Spieler-ID zu einer Zeile einer Ergebnisliste. Erst über die Passnummer,
 * sonst über den Namen vom Zettel — genau umgekehrt wie beim Anlegen.
 */
export function playerIdForSheetRow(row: {
  passNr: number | null; writtenName: string; unsure?: boolean;
}): string {
  if (row.passNr !== null && !row.unsure) {
    const bekannt = getPlayerByPassNr(row.passNr);
    if (bekannt) return bekannt.id;
  }
  const basis = slugify(row.writtenName);
  return row.passNr === null ? basis : `${basis}-${row.passNr}`;
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
    if (player.passNr === null) continue;
    byPass.set(player.passNr, [...(byPass.get(player.passNr) ?? []), player]);
  }
  return [...byPass.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([passNr, players]) => ({ passNr, players }))
    .sort((a, b) => a.passNr - b.passNr);
}

export const PLAYERS: Player[] = buildPlayers();

const BY_ID = new Map(PLAYERS.map(p => [p.id, p]));
const BY_PASS = new Map(
  PLAYERS.filter(p => p.passNr !== null).map(p => [p.passNr as number, p]),
);

export function getPlayer(id: string): Player | undefined {
  return BY_ID.get(id);
}

export function getPlayerByPassNr(passNr: number): Player | undefined {
  return BY_PASS.get(passNr);
}

export function playersOfDivision(division: Division): Player[] {
  return PLAYERS.filter(p => p.division === division);
}

/**
 * Voller Anzeigename „Vorname Nachname". Von manchen Spielern kennt die
 * Ergebnisliste nur einen Namen — dann steht auch nur der da, ohne Leerzeichen
 * am Ende.
 */
export function playerName(player: Player): string {
  return `${player.firstName} ${player.lastName}`.trim();
}

/** Kurzform für enge Tabellen: „P. Ruhland" — ohne Nachname nur der Vorname. */
export function playerShortName(player: Player): string {
  return player.lastName ? `${player.firstName.charAt(0)}. ${player.lastName}` : player.firstName;
}

/** Initialen für den Platzhalter-Avatar. */
export function playerInitials(player: Player): string {
  const zweite = player.lastName.charAt(0) || player.firstName.charAt(1) || '';
  return `${player.firstName.charAt(0)}${zweite}`.toUpperCase();
}

/** Freitextsuche über Name, Spitzname und Passnummer. */
export function searchPlayers(players: Player[], query: string): Player[] {
  const q = query.trim().toLowerCase();
  if (!q) return players;
  return players.filter(p =>
    playerName(p).toLowerCase().includes(q) ||
    (p.nickname?.toLowerCase().includes(q) ?? false) ||
    (p.passNr !== null && String(p.passNr).includes(q)),
  );
}
