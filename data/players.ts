// ============================================================
// MDC — Spielerstamm
// ============================================================
//
// Der Stamm wird NICHT von Hand gepflegt, sondern aus den Auswertungen
// aufgebaut: den Endranglisten 2025/26, dem Sommer-Ranking 2026 und der
// laufenden Wertung 2026/27. Jeder Spieler, der irgendwo in einer Wertung
// steht, ist damit automatisch im Stamm — und umgekehrt kann kein Profil auf
// einen Spieler zeigen, den es in keiner Wertung gibt.
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
import { parseRankingRows, type ParsedRow } from './parse-ranking';
import { RANKING_MEN_2025_26_RAW } from './ranking-2025-26-men';
import { RANKING_WOMEN_2025_26_RAW } from './ranking-2025-26-women';
import { RANKING_MEN_2026_27_RAW } from './ranking-2026-27-men';
import { RANKING_WOMEN_2026_27_RAW } from './ranking-2026-27-women';
import { RANKING_SOMMER_MEN_RAW } from './ranking-sommer-2026-men';
import { RANKING_SOMMER_WOMEN_RAW } from './ranking-sommer-2026-women';
import { PLAYERS_UPLOADED_MEN_RAW, PLAYERS_UPLOADED_WOMEN_RAW } from './players-uploaded';
import { HAS_REGISTER, REGISTER, registerEintrag } from './register';

export const PARSED_MEN = parseRankingRows(RANKING_MEN_2025_26_RAW, 'men');
export const PARSED_WOMEN = parseRankingRows(RANKING_WOMEN_2025_26_RAW, 'women');
export const PARSED_RUNNING_MEN = parseRankingRows(RANKING_MEN_2026_27_RAW, 'men');
export const PARSED_RUNNING_WOMEN = parseRankingRows(RANKING_WOMEN_2026_27_RAW, 'women');
export const PARSED_SOMMER_MEN = parseRankingRows(RANKING_SOMMER_MEN_RAW, 'men');
export const PARSED_SOMMER_WOMEN = parseRankingRows(RANKING_SOMMER_WOMEN_RAW, 'women');

/**
 * Spieler, die über einen hochgeladenen Ergebniszettel dazugekommen sind und
 * noch in keiner Wertung stehen (`players-uploaded.ts`). Sie werden im Stamm
 * geführt wie alle anderen — sonst hätte ihr Ergebnis niemanden, zu dem es
 * gehört.
 */
export const PARSED_UPLOADED_MEN = parseRankingRows(PLAYERS_UPLOADED_MEN_RAW, 'men');
export const PARSED_UPLOADED_WOMEN = parseRankingRows(PLAYERS_UPLOADED_WOMEN_RAW, 'women');

/**
 * Der Stamm wird über die Spieler-ID zusammengeführt, NICHT über die
 * Passnummer: Ein paar Nummern zeigen in verschiedenen Wertungen auf
 * verschiedene Menschen, weil sie nach dem Aufhören des ersten neu vergeben
 * wurden. Über die Nummer zusammengeführt würde einer den anderen
 * überschreiben; über den Namen bleiben beide erhalten.
 *
 * Wem eine Nummer HEUTE gehört, entscheidet dann das Register
 * (`data/register.ts`) — nicht mehr eine Vermutung aus den Wertungen.
 */

/**
 * In welcher Wertung ein Spieler zuletzt aufgetaucht ist — von der ältesten
 * zur jüngsten. `register` heißt: Er hat eine Nummer, steht aber in keiner
 * Wertung, hat also noch kein Turnier gespielt.
 */
export const PASS_QUELLEN = ['register', 'archiv', 'sommer', 'upload', 'laufend'] as const;
export type PassQuelle = (typeof PASS_QUELLEN)[number];

const QUELLE_VON = new Map<string, PassQuelle>();

/**
 * Die jüngste Wertung, in der dieser Spieler steht. `undefined` gibt es nicht —
 * ohne Wertung wäre er nicht im Stamm.
 */
export function letzteQuelle(playerId: string): PassQuelle | undefined {
  return QUELLE_VON.get(playerId);
}

function buildPlayers(): Player[] {
  const players = new Map<string, Player>();

  const alle: { rows: ParsedRow[]; quelle: PassQuelle }[] = [
    { rows: [...PARSED_MEN, ...PARSED_WOMEN], quelle: 'archiv' },
    { rows: [...PARSED_SOMMER_MEN, ...PARSED_SOMMER_WOMEN], quelle: 'sommer' },
    // Beim Hochladen erfasste Neulinge stehen VOR der laufenden Wertung:
    // Taucht die Person später in der Mappe auf, gilt deren Schreibweise.
    { rows: [...PARSED_UPLOADED_MEN, ...PARSED_UPLOADED_WOMEN], quelle: 'upload' },
    // Zuletzt die laufende Saison: Wer dort steht, ist aktuell dabei — seine
    // Wertungsklasse und Schreibweise gelten.
    { rows: [...PARSED_RUNNING_MEN, ...PARSED_RUNNING_WOMEN], quelle: 'laufend' },
  ];

  for (const { rows, quelle } of alle) for (const row of rows) {
    const existing = players.get(row.playerId);
    QUELLE_VON.set(row.playerId, quelle);
    players.set(row.playerId, {
      id: row.playerId,
      passNr: row.passNr,
      formerPassNr: null,
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

  // ------------------------------------------------------------
  // Das Register hat das letzte Wort
  // ------------------------------------------------------------
  // Wer im Register steht, aber in keiner Wertung, kommt jetzt dazu: Er hat
  // eine Nummer und darf auf einem Ergebniszettel auftauchen, auch wenn er
  // noch nie gespielt hat. Die Wertungsklasse eines Spielers, der schon in
  // einer Rangliste steht, wird NICHT angefasst — sonst verschöbe sich
  // jemand aus seiner eigenen Wertung heraus.
  for (const row of REGISTER) {
    const existing = players.get(row.playerId);
    if (existing) {
      players.set(row.playerId, { ...existing, passNr: row.passNr });
      continue;
    }
    QUELLE_VON.set(row.playerId, 'register');
    players.set(row.playerId, {
      id: row.playerId,
      passNr: row.passNr,
      formerPassNr: null,
      firstName: row.firstName,
      lastName: row.lastName,
      nickname: row.nickname,
      division: row.division,
      photoUrl: null,
      homeVenueId: row.homeVenueId,
    });
  }

  // Und wessen Nummer im Register jemand anderem gehört, der ist ihr
  // ehemaliger Inhaber. Er behält alles außer der Nummer — seine Ergebnisse
  // hängen an der Spieler-ID, nicht an der Nummer.
  if (HAS_REGISTER) {
    for (const [id, player] of players) {
      if (player.passNr === null) continue;
      const eintrag = registerEintrag(player.passNr);
      if (eintrag && eintrag.playerId !== id) {
        players.set(id, { ...player, passNr: null, formerPassNr: player.passNr });
      }
    }
  }

  // Spieler ohne Passnummer (ehemalige Inhaber) stehen hinten.
  return [...players.values()].sort(
    (a, b) => (a.passNr ?? Infinity) - (b.passNr ?? Infinity) || a.id.localeCompare(b.id),
  );
}

/**
 * Passnummern, die mehr als einen Spieler tragen: In verschiedenen Wertungen
 * steht dort jeweils ein anderer Mensch — meistens, weil die Nummer nach dem
 * Aufhören des ersten Inhabers neu vergeben wurde.
 *
 * Zusammengeführt wird trotzdem nicht (siehe `buildPlayers`): Beide behalten
 * ihre Ergebnisse, und die Doppelbelegung ist sichtbar statt still aufgelöst.
 * Ausgewiesen wird sie in der Turnierverwaltung unter „Passnummern".
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

/**
 * Passnummer → Spieler. Seit es das Register gibt, ist das eindeutig: Dort
 * trägt jede Nummer genau einen Namen, und wer eine Nummer früher hatte, hat
 * hier keine mehr (`formerPassNr`).
 *
 * Für Ergebnisse einer bestimmten Saison gilt das NICHT: dort löst
 * `data/tournament-results.ts` die Nummer über die Rangliste genau dieser
 * Saison auf, damit alte Turniere beim richtigen Menschen bleiben.
 */
const BY_PASS = new Map<number, Player>(
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
