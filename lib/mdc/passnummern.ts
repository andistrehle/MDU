// ============================================================
// MDC — Welche Passnummer ist vergeben, welche ist frei?
// ============================================================
//
// Die Seite vergibt keine Passnummern — das tut die Turnierleitung. Sie kann
// aber sagen, welche Nummern sie kennt, und daraus ergibt sich der Rest:
//
//   VERGEBEN   Die Nummer steht in mindestens einer Wertung (Archiv 2025/26,
//              Sommer-Ranking 2026, laufende Saison) oder wurde beim
//              Hochladen eines Ergebniszettels neu angelegt.
//
//   LÜCKE      Die Nummer steht in keiner davon. Das heißt „der Seite nicht
//              bekannt", nicht „darf vergeben werden" — wer einen Pass in der
//              Schublade hat und seit zwei Jahren nicht gespielt hat, steht
//              hier nicht. Genau so sind die Doppelbelegungen entstanden.
//              Deshalb schlägt die Seite als nächste Nummer NIE eine Lücke
//              vor, sondern immer eine über der höchsten vergebenen.
//
//   NEU        Zwei Menschen stehen auf derselben Nummer, weil sie nach dem
//   VERGEBEN   Aufhören des ersten neu vergeben wurde. Das ist kein Fehler und
//              für die Ergebnisse folgenlos: Jede Saison löst ihre
//              Passnummern über IHRE EIGENE Rangliste auf
//              (`data/tournament-results.ts`), und innerhalb einer Wertung ist
//              keine Nummer doppelt — nachgemessen: 400 Nummern im Archiv,
//              68 im Sommer-Ranking, 113 in der laufenden Saison, kein
//              einziger Konflikt. Die Doppelung entsteht erst in der
//              zusammengeführten Gesamtliste. Wo es auf einen einzelnen Namen
//              ankommt (Ergebnis-Upload), gilt der aus der jüngeren Wertung.
//
// Reine Auswertung vorhandener Daten — hier wird nichts geschrieben.
// ============================================================

import { PLAYERS, playerName, letzteQuelle, PASS_QUELLEN, type PassQuelle } from '@/data/players';
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
  /**
   * Trägt die Nummer heute. Bei einer einfach vergebenen Nummer immer wahr,
   * bei einer doppelten genau einmal.
   */
  aktuell: boolean;
}

export interface PassBelegung {
  passNr: number;
  inhaber: PassInhaber[];
}

export interface PassUebersicht {
  belegungen: PassBelegung[];
  /** Nummern ohne Inhaber, von 1 bis zur höchsten vergebenen. */
  frei: number[];
  /**
   * Der Vorschlag für den nächsten Pass: eine höher als die höchste je
   * vergebene. NICHT die kleinste Lücke.
   *
   * Eine Lücke heißt nur „die Seite kennt diese Nummer nicht" — wer einen Pass
   * in der Schublade hat und seit zwei Jahren nicht gespielt hat, steht in
   * keiner Wertung und reißt hier ein Loch. Vergibt man solche Löcher neu,
   * entstehen genau die Doppelbelegungen, die es schon gibt. Immer oben
   * weiterzählen kann dagegen nie kollidieren.
   */
  naechsteNeue: number;
  /** Kleinste Lücke — nur zur Ansicht, ausdrücklich nicht als Vorschlag. */
  kleinsteLuecke: number | null;
  hoechsteVergebene: number;
  /** Belegungen mit mehr als einem Inhaber, aufsteigend. */
  doppelt: PassBelegung[];
}

const LABEL: Record<PassQuelle, string> = {
  archiv: 'Saison 2025/26',
  sommer: 'Sommer-Ranking 2026',
  upload: 'beim Hochladen angelegt',
  laufend: 'laufende Saison',
};

/** Klartext für die Wertung, aus der ein Inhaber stammt. */
export function quelleLabel(quelle: PassQuelle): string {
  return LABEL[quelle];
}

export function passUebersicht(): PassUebersicht {
  const nach = new Map<number, PassInhaber[]>();

  for (const player of PLAYERS) {
    if (player.passNr === null) continue;
    const starts = appearancesOf(player.id);
    nach.set(player.passNr, [
      ...(nach.get(player.passNr) ?? []),
      {
        playerId: player.id,
        name: playerName(player),
        nickname: player.nickname,
        division: player.division,
        quelle: letzteQuelle(player.id) ?? 'archiv',
        // `appearancesOf` liefert die Starts, aus denen sich der letzte ergibt.
        letzterStart: starts.length
          ? starts.map(a => a.tournament.date).sort().at(-1) ?? null
          : null,
        starts: starts.length,
        aktuell: false,
      },
    ]);
  }

  const belegungen: PassBelegung[] = [...nach.entries()]
    .map(([passNr, inhaber]) => {
      // Der aus der jüngsten Wertung trägt die Nummer heute — dieselbe Regel
      // wie in `getPlayerByPassNr`, damit Oberfläche und Zuordnung dasselbe
      // sagen.
      const sortiert = [...inhaber].sort(
        (a, b) => PASS_QUELLEN.indexOf(b.quelle) - PASS_QUELLEN.indexOf(a.quelle),
      );
      sortiert[0].aktuell = true;
      return { passNr, inhaber: sortiert };
    })
    .sort((a, b) => a.passNr - b.passNr);

  const hoechsteVergebene = belegungen.length ? belegungen[belegungen.length - 1].passNr : 0;
  const frei: number[] = [];
  for (let n = 1; n <= hoechsteVergebene; n++) if (!nach.has(n)) frei.push(n);

  return {
    belegungen,
    frei,
    naechsteNeue: hoechsteVergebene + 1,
    kleinsteLuecke: frei[0] ?? null,
    hoechsteVergebene,
    doppelt: belegungen.filter(b => b.inhaber.length > 1),
  };
}
