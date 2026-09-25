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
 * Erster Schritt: stillgelegte Zeilen raus, beim falschen Inhaber den Namen
 * tauschen. Beides VOR dem Einlesen.
 *
 * Die Reihenfolge ist wesentlich: Die Spieler-ID entsteht beim Einlesen, und
 * bei zwei gleichen Namen hängt `parseRankingRows` an den zweiten die
 * Passnummer an. Fiele eine Zeile erst danach weg oder bekäme erst danach
 * einen anderen Namen, behielte der Übriggebliebene die angehängte Nummer in
 * seiner Adresse — und wäre damit immer noch ein anderer Mensch als der in der
 * Rangliste.
 */
function bereinigt(zeilen: string[]): string[] {
  return zeilen.flatMap(zeile => {
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
}

const BEREINIGT_MEN = bereinigt(REGISTER_MEN_RAW);
const BEREINIGT_WOMEN = bereinigt(REGISTER_WOMEN_RAW);

/**
 * Welche Nummern kommen nach den Berichtigungen noch aus dem Grundbestand?
 *
 * ENTSCHEIDEND ist „nach den Berichtigungen". Hier stand bis zum 26.09.2026
 * der ROHE Bestand, und das hat einen echten Schaden angerichtet: Passnr. 196
 * war an Mario Markovinovic vergeben, der Grundbestand führte die Nummer aber
 * (fälschlich, als zweite Zeile) noch auf Claudia Vaszi. Die Stilllegung
 * dieser Zeile griff — die Vergabe aber nicht, weil sie auf die rohe Liste
 * schaute und die Nummer dort ja noch stand. Ergebnis: Markovinovic ohne
 * Nummer, und sein Turnier vom 23.09. lief unter Claudia Vaszi.
 *
 * Die beiden Arten müssen zusammenspielen: Was die eine freiräumt, muss die
 * andere vergeben dürfen. Deshalb zählt der bereinigte Bestand, nicht der rohe.
 */
const NUMMERN_IM_BESTAND = new Set(
  [...BEREINIGT_MEN, ...BEREINIGT_WOMEN].map(z => Number(z.split('|')[1])),
);

/** Zweiter Schritt: hier vergebene Nummern anhängen, die sonst niemand führt. */
function mitVergebenen(zeilen: string[], division: Division): string[] {
  const dazu = REGISTER_KORREKTUREN
    .filter(k => k.art === 'vergeben' && k.division === division && !NUMMERN_IM_BESTAND.has(k.passNr))
    .map(k => alsZeile(k.passNr, (k as Extract<RegisterKorrektur, { art: 'vergeben' }>).gehoertZu));

  return [...zeilen, ...dazu];
}

export const REGISTER_MEN = parseRankingRows(mitVergebenen(BEREINIGT_MEN, 'men'), 'men');
export const REGISTER_WOMEN = parseRankingRows(mitVergebenen(BEREINIGT_WOMEN, 'women'), 'women');

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
    // Wieder der bereinigte Bestand, aus demselben Grund wie oben: Sonst gilt
    // eine Vergabe als „erledigt", obwohl die Nummer durch eine Stilllegung
    // gerade erst frei geworden ist.
    return !NUMMERN_IM_BESTAND.has(k.passNr);
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
