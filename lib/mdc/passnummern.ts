// ============================================================
// MDC — Welche Passnummer ist vergeben, welche ist frei?
// ============================================================
//
// Maßgeblich ist seit September 2026 das Register (`data/register.ts`), das
// aus dem Blatt „Teilnehmer" der Arbeitsmappe kommt. Dort trägt jede Nummer
// genau einen Namen — auch die von Leuten, die noch nie gespielt haben.
//
//   VERGEBEN   Die Nummer steht im Register.
//
//   FREI       Sie steht nicht im Register und auch bei niemandem, der
//              gespielt hat. Anders als früher ist das jetzt eine belastbare
//              Aussage: Vorher hieß „frei" nur „der Seite unbekannt", und wer
//              seinen Pass in der Schublade hatte, sah aus wie eine Lücke.
//
//   FEHLT IM   Jemand hat mit dieser Nummer gespielt, im Register steht sie
//   REGISTER   aber ohne Namen. Das ist die einzige Sorte Fehler, die diese
//              Seite melden kann und soll — würde die Nummer neu vergeben,
//              hätte sie zwei Inhaber.
//
//   FRÜHERER   Die Nummer gehört im Register jemand anderem als dem, der
//   INHABER    früher damit gespielt hat. Kein Fehler: Beide behalten ihre
//              Ergebnisse, denn jede Saison löst ihre Passnummern über ihre
//              eigene Rangliste auf (`data/tournament-results.ts`).
//
// Reine Auswertung vorhandener Daten — hier wird nichts geschrieben.
// ============================================================

import { PLAYERS, playerName, letzteQuelle, type PassQuelle } from '@/data/players';
import { FREIE_NUMMERN, HOECHSTE_NUMMER, registerEintrag } from '@/data/register';
import { appearancesOf } from '@/data/tournament-results';
import type { Division } from '@/data/types';

export interface PassInhaber {
  playerId: string;
  name: string;
  nickname: string | null;
  division: Division;
  /** Jüngste Wertung, in der die Person steht. */
  quelle: PassQuelle;
  /** Tag des letzten Turniers, das die Seite kennt. */
  letzterStart: string | null;
  starts: number;
  /** Trägt die Nummer heute. Bei jeder Nummer genau einmal. */
  aktuell: boolean;
}

export interface PassBelegung {
  passNr: number;
  /** Steht die Nummer im Register des Betreibers? */
  imRegister: boolean;
  /** Aktueller Inhaber zuerst, dann die früheren. */
  inhaber: PassInhaber[];
}

export interface PassUebersicht {
  belegungen: PassBelegung[];
  /** Nummern ohne Inhaber, von 1 bis zur höchsten vergebenen. */
  frei: number[];
  /** Kleinste freie Nummer — der Vorschlag für den nächsten Pass. */
  naechsteFreie: number;
  hoechsteVergebene: number;
  /** Nummern, mit denen gespielt wurde, die im Register aber fehlen. */
  fehltImRegister: PassBelegung[];
  /** Nummern, die schon mal jemand anderem gehört haben. */
  mitVorgaenger: PassBelegung[];
}

const LABEL: Record<PassQuelle, string> = {
  register: 'noch kein Turnier gespielt',
  archiv: 'Saison 2025/26',
  sommer: 'Sommer-Ranking 2026',
  upload: 'beim Hochladen angelegt',
  laufend: 'laufende Saison',
};

/** Klartext für die Wertung, aus der ein Inhaber stammt. */
export function quelleLabel(quelle: PassQuelle): string {
  return LABEL[quelle];
}

function inhaberAus(playerId: string, aktuell: boolean): PassInhaber | null {
  const player = PLAYERS.find(p => p.id === playerId);
  if (!player) return null;
  const starts = appearancesOf(player.id);
  return {
    playerId: player.id,
    name: playerName(player),
    nickname: player.nickname,
    quelle: letzteQuelle(player.id) ?? 'register',
    division: player.division,
    letzterStart: starts.length
      ? starts.map(a => a.tournament.date).sort().at(-1) ?? null
      : null,
    starts: starts.length,
    aktuell,
  };
}

export function passUebersicht(): PassUebersicht {
  // Frühere Inhaber, nach der Nummer, die sie mal hatten.
  const frueher = new Map<number, string[]>();
  for (const p of PLAYERS) {
    if (p.formerPassNr === null) continue;
    frueher.set(p.formerPassNr, [...(frueher.get(p.formerPassNr) ?? []), p.id]);
  }

  // Je Nummer eine Zeile. Mehr als einen aktuellen Inhaber kann es nur bei
  // einer Nummer geben, die im Register fehlt — dort hat die Seite nichts,
  // woran sie entscheiden könnte, und sagt das lieber, als zu raten.
  const heutige = new Map<number, string[]>();
  for (const player of PLAYERS) {
    if (player.passNr === null) continue;
    heutige.set(player.passNr, [...(heutige.get(player.passNr) ?? []), player.id]);
  }

  const belegungen: PassBelegung[] = [...heutige.entries()]
    .map(([passNr, ids]) => ({
      passNr,
      imRegister: registerEintrag(passNr) !== undefined,
      inhaber: [
        ...ids.map(id => inhaberAus(id, true)),
        ...(frueher.get(passNr) ?? []).map(id => inhaberAus(id, false)),
      ].filter((i): i is PassInhaber => i !== null),
    }))
    .filter(b => b.inhaber.length > 0)
    .sort((a, b) => a.passNr - b.passNr);

  // Die höchste Nummer ist die des Registers — es sei denn, jemand spielt mit
  // einer noch höheren, die dort fehlt.
  const hoechsteVergebene = Math.max(
    HOECHSTE_NUMMER,
    belegungen.length ? belegungen[belegungen.length - 1].passNr : 0,
  );

  // Frei ist, was weder im Register steht noch von jemandem getragen wird.
  const getragen = new Set(belegungen.map(b => b.passNr));
  const frei = FREIE_NUMMERN.filter(n => !getragen.has(n));

  return {
    belegungen,
    frei,
    naechsteFreie: frei[0] ?? hoechsteVergebene + 1,
    hoechsteVergebene,
    fehltImRegister: belegungen.filter(b => !b.imRegister),
    mitVorgaenger: belegungen.filter(b => b.imRegister && b.inhaber.length > 1),
  };
}
