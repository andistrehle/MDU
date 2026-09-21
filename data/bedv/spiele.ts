// ============================================================
// BeDV-Demo — Spielplan, Ergebnisse, Einzelspiele
// ============================================================
//
// Der Spielplan wird GERECHNET, nicht abgetippt:
//
//   1. Paarungen nach dem Rundenverfahren („Berger-Tabelle") — jede
//      Mannschaft genau einmal gegen jede andere, danach dieselbe Runde mit
//      getauschtem Heimrecht. Acht Mannschaften ergeben 14 Spieltage.
//   2. Ergebnisse aus der Spielstärke der Kader plus Heimvorteil plus
//      Rauschen — deterministisch aus der Begegnungs-Kennung (siehe
//      `lib/bedv/rng.ts`), also in jedem Build identisch.
//   3. Die 18 Einzelspiele einer Begegnung entstehen erst, wenn jemand sie
//      sehen will (`einzelspieleVon`). Sie summieren sich exakt auf das
//      Gesamtergebnis — der digitale Spielbericht zeigt deshalb genau die
//      Zahl, die auch in der Tabelle steht.
//
// Spielmodus der Demo: 18 Spiele je Begegnung — 12 Einzel und 6 Doppel,
// jedes über drei Gewinnlegs. Unentschieden ist bei 9:9 möglich.
// ============================================================

import { rngOf } from '@/lib/bedv/rng';
import { heute, type Tag } from '@/lib/bedv/format';
import type { Begegnung, Einzelspiel } from './typen';
import { LIGEN, teamsInLiga } from './ligen';
import { TEAMS, teamsDerLiga } from './teams';
import { kaderVon, teamStaerke } from './spieler';
import { GESPIELTE_SPIELTAGE, SAISON_AKTUELL, spieltagDatum, spieltagDatumArchiv } from './saison';

/** Spiele je Begegnung. */
export const SPIELE_JE_BEGEGNUNG = 18;
/** Davon Einzel; der Rest sind Doppel. */
export const EINZEL_JE_BEGEGNUNG = 12;

/**
 * Rundenverfahren: Wer spielt an Spieltag `runde` gegen wen?
 *
 * Die letzte Mannschaft steht fest, die übrigen rotieren um sie herum — so
 * kommt jede Paarung genau einmal vor. Das Heimrecht wechselt mit der Runde,
 * damit keine Mannschaft dauernd auswärts antritt.
 */
function paarungen(anzahl: number, runde: number): [number, number][] {
  const feld = Array.from({ length: anzahl }, (_, i) => i);
  const fest = feld.pop()!;
  const rotiert = feld.slice(runde % feld.length).concat(feld.slice(0, runde % feld.length));
  const halb = anzahl / 2;

  const out: [number, number][] = [];
  // Die feste Mannschaft trifft auf die erste der Rotation.
  out.push(runde % 2 === 0 ? [fest, rotiert[0]] : [rotiert[0], fest]);
  for (let i = 1; i < halb; i++) {
    const a = rotiert[i];
    const b = rotiert[rotiert.length - i];
    out.push(i % 2 === 0 ? [a, b] : [b, a]);
  }
  return out;
}

/**
 * Ergebnis einer Begegnung: Wie viele der 18 Spiele gewinnt die Heimmannschaft?
 *
 * Grundlage ist der Stärkeunterschied der Kader. Der Heimvorteil ist bewusst
 * klein (ein halbes Spiel) — im E-Dart spielt man am selben Automaten, der
 * Vorteil liegt in der Gewohnheit, nicht im Gerät.
 */
function heimPunkteVon(id: string, heimTeamId: string, gastTeamId: string): number {
  const rnd = rngOf(`erg:${id}`);
  const unterschied = teamStaerke(heimTeamId) - teamStaerke(gastTeamId);
  const anteil = 0.5 + unterschied * 1.15 + 0.03;
  // Drei Ziehungen gemittelt = glockenförmiges Rauschen. Eine einzelne
  // Gleichverteilung hätte zu viele 14:4-Klatschen erzeugt.
  const rauschen = ((rnd() + rnd() + rnd()) / 3 - 0.5) * 0.30;
  const roh = Math.round(SPIELE_JE_BEGEGNUNG * (anteil + rauschen));
  return Math.min(SPIELE_JE_BEGEGNUNG - 2, Math.max(2, roh));
}

function baueBegegnungen(): Begegnung[] {
  const out: Begegnung[] = [];

  for (const liga of LIGEN) {
    const teams = teamsDerLiga(liga.slug);
    const anzahl = teamsInLiga(liga.slug);
    const spieltageGesamt = (anzahl - 1) * 2;
    const istAktuell = liga.saisonId === SAISON_AKTUELL.id;

    for (let spieltag = 1; spieltag <= spieltageGesamt; spieltag++) {
      const runde = (spieltag - 1) % (anzahl - 1);
      const rueckrunde = spieltag > anzahl - 1;
      const datum: Tag = istAktuell
        ? spieltagDatum(spieltag)
        : spieltagDatumArchiv(spieltag, spieltageGesamt);

      for (const [a, b] of paarungen(anzahl, runde)) {
        // In der Rückrunde dreht sich das Heimrecht um.
        const heimIdx = rueckrunde ? b : a;
        const gastIdx = rueckrunde ? a : b;
        const heim = teams[heimIdx];
        const gast = teams[gastIdx];
        const id = `${liga.slug}-${spieltag}-${heim.id}`;

        // Abgeschlossene Spielzeiten sind komplett gespielt; in der laufenden
        // entscheidet der Spieltag.
        const gespielt = !istAktuell || spieltag <= GESPIELTE_SPIELTAGE;
        const heimPunkte = gespielt ? heimPunkteVon(id, heim.id, gast.id) : 0;

        out.push({
          id,
          saisonId: liga.saisonId,
          ligaSlug: liga.slug,
          spieltag,
          datum,
          // Gespielt wird am Heimspieltag der Gastgeber — die Uhrzeit kommt
          // aus deren Spielstätte.
          uhrzeit: heim.beginn,
          heimTeamId: heim.id,
          gastTeamId: gast.id,
          spielstaetteId: heim.spielstaetteId,
          status: gespielt ? 'gespielt' : 'geplant',
          heimPunkte,
          gastPunkte: gespielt ? SPIELE_JE_BEGEGNUNG - heimPunkte : 0,
          demo: true,
        });
      }
    }
  }
  // Nach Datum sortiert — so liest sich jede Liste von selbst chronologisch.
  return out.sort((x, y) => (x.datum < y.datum ? -1 : x.datum > y.datum ? 1 : x.id < y.id ? -1 : 1));
}

export const BEGEGNUNGEN: Begegnung[] = baueBegegnungen();

const NACH_ID = new Map(BEGEGNUNGEN.map(b => [b.id, b]));

export function begegnungById(id: string): Begegnung | undefined {
  return NACH_ID.get(id);
}

export function begegnungenDerLiga(ligaSlug: string): Begegnung[] {
  return BEGEGNUNGEN.filter(b => b.ligaSlug === ligaSlug);
}

export function begegnungenVonTeam(teamId: string): Begegnung[] {
  return BEGEGNUNGEN.filter(b => b.heimTeamId === teamId || b.gastTeamId === teamId);
}

/** Die nächsten Begegnungen ab heute — quer über alle laufenden Ligen. */
export function naechsteBegegnungen(anzahl: number, ligaSlug?: string): Begegnung[] {
  const ab = heute();
  return BEGEGNUNGEN
    .filter(b => b.status === 'geplant' && b.datum >= ab && (!ligaSlug || b.ligaSlug === ligaSlug))
    .slice(0, anzahl);
}

/**
 * Die zuletzt gespielten Begegnungen, neueste zuerst.
 *
 * Ohne Liga-Angabe nur die laufende Spielzeit: Die abgeschlossene Sommerliga
 * gehört ins Archiv, nicht unter „Letzte Ergebnisse" auf der Startseite.
 */
export function letzteErgebnisse(anzahl: number, ligaSlug?: string): Begegnung[] {
  const treffer = BEGEGNUNGEN.filter(b =>
    b.status === 'gespielt'
    && (ligaSlug ? b.ligaSlug === ligaSlug : b.saisonId === SAISON_AKTUELL.id));
  return treffer.slice(-anzahl).reverse();
}

/** Sieger einer Begegnung — `null` bei 9:9. */
export function sieger(b: Begegnung): string | null {
  if (b.status !== 'gespielt') return null;
  if (b.heimPunkte === b.gastPunkte) return null;
  return b.heimPunkte > b.gastPunkte ? b.heimTeamId : b.gastTeamId;
}

// ── Einzelspiele ────────────────────────────────────────────

/** Legs eines gewonnenen Einzelspiels: 3:0, 3:1 oder 3:2. */
function legsVon(rnd: () => number): [number, number] {
  const w = rnd();
  const verloren = w < 0.28 ? 0 : w < 0.66 ? 1 : 2;
  return [3, verloren];
}

/**
 * Die 18 Spiele einer Begegnung.
 *
 * Erst hier erzeugt, nicht beim Laden der Datei: Über 500 Begegnungen mal
 * 18 Zeilen wären 10.000 Objekte, die fast nie jemand anschaut. Gebraucht
 * werden sie auf der Spielbericht-Seite und in der Einzelrangliste.
 *
 * Die Summe stimmt IMMER mit dem Gesamtergebnis überein: Zuerst werden alle
 * 18 Spiele nach Spielstärke entschieden, danach werden so lange die
 * KNAPPSTEN Entscheidungen gedreht, bis die Zahl passt. Ein Spielbericht,
 * dessen Einzelspiele ein anderes Ergebnis ergeben als die Tabelle, wäre in
 * einer Verkaufsdemo der peinlichste denkbare Fehler.
 */
export function einzelspieleVon(begegnung: Begegnung): Einzelspiel[] {
  if (begegnung.status !== 'gespielt') return [];

  const heimKader = kaderVon(begegnung.heimTeamId);
  const gastKader = kaderVon(begegnung.gastTeamId);
  if (heimKader.length < 6 || gastKader.length < 6) return [];

  const rnd = rngOf(`einzel:${begegnung.id}`);
  const st = (id: string) => {
    const r = rngOf(`staerke:${id}`);
    return (r() + r()) / 2;
  };

  // Reihenfolge: vier Einzel, zwei Doppel — dreimal hintereinander.
  const bloecke: ('Einzel' | 'Doppel')[] = [];
  for (let i = 0; i < 3; i++) {
    bloecke.push('Einzel', 'Einzel', 'Einzel', 'Einzel', 'Doppel', 'Doppel');
  }

  const doppelPaare: [number, number][] = [[0, 1], [2, 3], [4, 5], [1, 2], [3, 4], [5, 0]];
  let einzelNr = 0;
  let doppelNr = 0;

  // Erst die Neigung je Spiel bestimmen — ohne schon zu entscheiden.
  const roh = bloecke.map((art, i) => {
    let heimIds: string[];
    let gastIds: string[];
    if (art === 'Einzel') {
      const j = einzelNr++;
      heimIds = [heimKader[j % 6].id];
      // Der Versatz sorgt dafür, dass jeder Gastspieler genau zweimal
      // antritt und nie zweimal gegen denselben Gegner.
      gastIds = [gastKader[(j + Math.floor(j / 6)) % 6].id];
    } else {
      const [a, b] = doppelPaare[doppelNr];
      const [c, d] = doppelPaare[(doppelNr + 2) % 6];
      doppelNr++;
      heimIds = [heimKader[a].id, heimKader[b].id];
      gastIds = [gastKader[c].id, gastKader[d].id];
    }

    const heimSt = heimIds.reduce((s, id) => s + st(id), 0) / heimIds.length;
    const gastSt = gastIds.reduce((s, id) => s + st(id), 0) / gastIds.length;
    // Wert > 0.5 heißt: Heim ist favorisiert. Der Abstand zu 0.5 ist das Maß
    // für „wie klar" — daran hängt später, welche Spiele gedreht werden.
    const neigung = Math.min(0.97, Math.max(0.03, 0.5 + (heimSt - gastSt) * 1.4 + (rnd() - 0.5) * 0.5));
    return { nummer: i + 1, art, heimIds, gastIds, neigung };
  });

  // Vorläufige Entscheidung.
  const heimGewinnt = roh.map(r => r.neigung >= 0.5);
  let ist = heimGewinnt.filter(Boolean).length;

  // Solange nachjustieren, bis die Summe exakt stimmt — immer das Spiel
  // drehen, das am knappsten war.
  const nachKnappheit = roh
    .map((r, i) => ({ i, knapp: Math.abs(r.neigung - 0.5) }))
    .sort((a, b) => a.knapp - b.knapp);
  for (const { i } of nachKnappheit) {
    if (ist === begegnung.heimPunkte) break;
    if (ist > begegnung.heimPunkte && heimGewinnt[i]) { heimGewinnt[i] = false; ist--; }
    else if (ist < begegnung.heimPunkte && !heimGewinnt[i]) { heimGewinnt[i] = true; ist++; }
  }

  return roh.map((r, i) => {
    const [gewonnen, verloren] = legsVon(rnd);
    return {
      nummer: r.nummer,
      art: r.art,
      heimSpielerIds: r.heimIds,
      gastSpielerIds: r.gastIds,
      heimLegs: heimGewinnt[i] ? gewonnen : verloren,
      gastLegs: heimGewinnt[i] ? verloren : gewonnen,
    };
  });
}

export { TEAMS };
