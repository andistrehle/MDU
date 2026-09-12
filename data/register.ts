// ============================================================
// MDC — Passnummern-Register
// ============================================================
//
// Seit September 2026 führt der Betreiber im Blatt „Teilnehmer" seiner
// Arbeitsmappe eine vollständige Liste: welche Nummer welchem Menschen
// gehört. Sie ist ab jetzt die maßgebliche Antwort darauf — und zwar für
// immer, also auch für jemanden, der aufgehört hat.
//
// Warum das etwas ändert: Bis dahin konnte die Seite nur aus den Wertungen
// schließen, wer eine Nummer trägt. Wer nie gespielt hat, kam darin nicht vor,
// und seine Nummer sah aus wie frei. Genau so sind die Nummern entstanden, die
// bei zwei Menschen stehen. Das Register kennt auch die, die noch nicht
// gespielt haben — und damit ist eine Lücke jetzt wirklich eine Lücke.
//
// Was das Register NICHT ändert: die Ergebnisse. Jede Saison löst ihre
// Passnummern weiterhin über ihre eigene Rangliste auf
// (`data/tournament-results.ts`). Ein Turnier von 2025 bleibt bei dem, der es
// gespielt hat, auch wenn die Nummer heute jemand anderem gehört.
// ============================================================

import { parseRankingRows, type ParsedRow } from './parse-ranking';
import { REGISTER_MEN_RAW, REGISTER_WOMEN_RAW } from './register.generated';
import {
  alsZeile, greiftAuf, REGISTER_KORREKTUREN, type RegisterKorrektur,
} from './register-korrekturen';
import type { Division } from './types';

const ROH = [...REGISTER_MEN_RAW, ...REGISTER_WOMEN_RAW];

/**
 * Die Berichtigungen auf die Zeilen der Arbeitsmappe legen — VOR dem Einlesen.
 *
 * Die Reihenfolge ist wesentlich: Die Spieler-ID entsteht beim Einlesen, und
 * bei zwei gleichen Namen hängt `parseRankingRows` an den zweiten die
 * Passnummer an. Fiele eine Zeile erst danach weg oder bekäme erst danach
 * einen anderen Namen, behielte der Übriggebliebene die angehängte Nummer in
 * seiner Adresse — und wäre damit immer noch ein anderer Mensch als der in der
 * Rangliste.
 *
 * Drei Handgriffe: stillgelegte Zeilen raus, beim falschen Inhaber den Namen
 * tauschen, hier vergebene Nummern hinten anhängen.
 */
function mitKorrekturen(zeilen: string[], division: Division): string[] {
  const bearbeitet = zeilen.flatMap(zeile => {
    const teile = zeile.split('|');
    const passNr = Number(teile[1]);
    const treffer = REGISTER_KORREKTUREN.find(
      k => greiftAuf(k, passNr, teile[2] ?? '', teile[3] ?? ''),
    );
    if (!treffer) return [zeile];
    if (treffer.art === 'stillgelegt') return [];
    if (treffer.art === 'inhaber') return [alsZeile(passNr, treffer.gehoertZu)];
    return [zeile];
  });

  // Hier vergebene Nummern, die die Mappe noch nicht kennt.
  const schonDa = new Set(ROH.map(z => Number(z.split('|')[1])));
  const dazu = REGISTER_KORREKTUREN
    .filter(k => k.art === 'vergeben' && k.division === division && !schonDa.has(k.passNr))
    .map(k => alsZeile(k.passNr, (k as Extract<RegisterKorrektur, { art: 'vergeben' }>).gehoertZu));

  return [...bearbeitet, ...dazu];
}

export const REGISTER_MEN = parseRankingRows(mitKorrekturen(REGISTER_MEN_RAW, 'men'), 'men');
export const REGISTER_WOMEN = parseRankingRows(mitKorrekturen(REGISTER_WOMEN_RAW, 'women'), 'women');

/**
 * Greift die Berichtigung heute noch?
 *
 *   stillgelegt/inhaber  ja, solange die Mappe die Zeile so führt
 *   vergeben             ja, solange die Mappe die Nummer NICHT führt
 *
 * Zieht der Betreiber die Mappe nach, fällt der Eintrag von selbst heraus und
 * der Prüflauf meldet „ERLEDIGT".
 */
function greiftNoch(k: RegisterKorrektur): boolean {
  if (k.art === 'vergeben') {
    return !ROH.some(zeile => Number(zeile.split('|')[1]) === k.passNr);
  }
  return ROH.some(zeile => {
    const teile = zeile.split('|');
    return greiftAuf(k, Number(teile[1]), teile[2] ?? '', teile[3] ?? '');
  });
}

export const AKTIVE_REGISTER_KORREKTUREN: RegisterKorrektur[] =
  REGISTER_KORREKTUREN.filter(greiftNoch);

/** Berichtigungen, die ins Leere laufen — in der Mappe nachgezogen, hier löschbar. */
export const ERLEDIGTE_REGISTER_KORREKTUREN: RegisterKorrektur[] =
  REGISTER_KORREKTUREN.filter(k => !greiftNoch(k));

/** Alle Registereinträge, nach Nummer. */
export const REGISTER: ParsedRow[] = [...REGISTER_MEN, ...REGISTER_WOMEN]
  .sort((a, b) => a.passNr - b.passNr);

/** Gibt es überhaupt ein Register? Ohne bleibt alles beim Alten. */
export const HAS_REGISTER = REGISTER.length > 0;

const NACH_NUMMER = new Map(REGISTER.map(r => [r.passNr, r]));
const NACH_SPIELER = new Map(REGISTER.map(r => [r.playerId, r]));

/** Wem gehört diese Nummer laut Register? */
export function registerEintrag(passNr: number): ParsedRow | undefined {
  return NACH_NUMMER.get(passNr);
}

/** Welche Nummer hat dieser Spieler laut Register? */
export function registerNummer(playerId: string): number | null {
  return NACH_SPIELER.get(playerId)?.passNr ?? null;
}

/** Höchste vergebene Nummer — darüber ist alles frei. */
export const HOECHSTE_NUMMER = REGISTER.length
  ? REGISTER[REGISTER.length - 1].passNr
  : 0;

/**
 * Nummern von 1 bis zur höchsten vergebenen, die im Register keinen Namen
 * tragen. Seit es das Register gibt, sind das wirklich freie Nummern und
 * nicht bloß solche, von denen die Seite nichts weiß.
 */
export const FREIE_NUMMERN: number[] = (() => {
  const frei: number[] = [];
  for (let n = 1; n <= HOECHSTE_NUMMER; n++) if (!NACH_NUMMER.has(n)) frei.push(n);
  return frei;
})();
