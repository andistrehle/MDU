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
import { greiftAuf, REGISTER_KORREKTUREN, type RegisterKorrektur } from './register-korrekturen';

/**
 * Stillgelegte Zeilen raus — VOR dem Einlesen.
 *
 * Die Reihenfolge ist wesentlich: Die Spieler-ID entsteht beim Einlesen, und
 * bei zwei gleichen Namen hängt `parseRankingRows` an den zweiten die
 * Passnummer an. Fiele die falsche Zeile erst danach weg, behielte der
 * Übriggebliebene die angehängte Nummer in seiner Adresse — und wäre damit
 * immer noch ein anderer Mensch als der in der Rangliste.
 */
function ohneStillgelegte(zeilen: string[]): string[] {
  if (!REGISTER_KORREKTUREN.length) return zeilen;
  return zeilen.filter(zeile => {
    const teile = zeile.split('|');
    const passNr = Number(teile[1]);
    return !REGISTER_KORREKTUREN.some(k => greiftAuf(k, passNr, teile[2] ?? '', teile[3] ?? ''));
  });
}

export const REGISTER_MEN = parseRankingRows(ohneStillgelegte(REGISTER_MEN_RAW), 'men');
export const REGISTER_WOMEN = parseRankingRows(ohneStillgelegte(REGISTER_WOMEN_RAW), 'women');

/**
 * Korrekturen, die heute noch greifen — die Mappe führt den Doppeleintrag
 * also weiterhin. Verschwindet er dort, fällt der Eintrag hier heraus und der
 * Prüflauf meldet „ERLEDIGT".
 */
export const AKTIVE_REGISTER_KORREKTUREN: RegisterKorrektur[] = REGISTER_KORREKTUREN
  .filter(k => [...REGISTER_MEN_RAW, ...REGISTER_WOMEN_RAW].some(zeile => {
    const teile = zeile.split('|');
    return greiftAuf(k, Number(teile[1]), teile[2] ?? '', teile[3] ?? '');
  }));

/** Korrekturen, die ins Leere laufen — in der Mappe berichtigt, hier löschbar. */
export const ERLEDIGTE_REGISTER_KORREKTUREN: RegisterKorrektur[] = REGISTER_KORREKTUREN
  .filter(k => !AKTIVE_REGISTER_KORREKTUREN.includes(k));

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
