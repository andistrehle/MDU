// ============================================================
// MDC — Register berichtigen und ergänzen
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Die Turnierleitung pflegt das unter
// `/admin/passnummern`, von dort wird diese Datei als Commit abgelegt
// (`lib/mdc/register-commit.ts`) — genau wie Namen, News, Kalender und
// Ergebnisse. Von Hand bearbeiten ist erlaubt; nur die Form muss stimmen,
// weil die Verwaltung sie wieder einliest.
//
// Maßgeblich bleibt das Blatt „Teilnehmer" der Arbeitsmappe
// (`data/register.generated.ts`). Diese Datei legt sich darüber — und zwar so,
// dass jeder Eintrag den nächsten Import übersteht UND von selbst wegfällt,
// sobald der Betreiber die Mappe nachzieht. Dann meldet
// `scripts/mdc-check-saison.ts` „ERLEDIGT".
//
// DREI ARTEN, alle drei aus echten Fällen entstanden:
//
//   stillgelegt  Dieselbe Person steht in der Mappe ZWEIMAL, unter zwei
//                Nummern. Das ist nicht bloß unordentlich: Die Spieler-ID
//                entsteht aus dem Namen, beim zweiten Eintrag hängt die Seite
//                die Passnummer an („claudia-vaszi-251") — aus einem Menschen
//                werden zwei, und der mit den Ergebnissen bekommt womöglich
//                die falsche Nummer angezeigt. Die Zeile OHNE einen einzigen
//                Start fällt weg, die Nummer wird wieder frei.
//                (Claudia Vaszi, 196 neben 251, 12.09.2026.)
//
//   inhaber      Die Mappe schreibt die Nummer noch dem Vorgänger zu, obwohl
//                sie längst jemand anderem gehört. Passnr. 281 stand auf
//                Morris Roll (ein Turnier im Februar 2026); zuletzt gespielt
//                hat damit Markus Hundseder im Sommer-Ranking, und ihm gehört
//                sie — vom Betreiber am 12.09.2026 so entschieden.
//
//   vergeben     Eine freie Nummer wird hier vergeben, statt erst in der
//                Mappe. Damit kann die Turnierleitung einen Pass ausgeben,
//                ohne die Datei aufzumachen — auch an jemanden, der schon
//                gespielt hat und seine Nummer verloren hatte.
//
// WAS SICH DADURCH NICHT ÄNDERT: die Ergebnisse. Jede Saison löst ihre
// Passnummern über ihre EIGENE Rangliste auf (`data/tournament-results.ts`).
// Rolls Februarturnier bleibt bei Roll, auch wenn die Nummer heute Hundseder
// gehört. Wer eine Nummer verliert, behält alles und wird als „früher
// Passnr. X" ausgewiesen.
// ============================================================

import type { Division } from './types';

/** Wem eine Nummer gehört — Schreibweise wie in der Arbeitsmappe. */
export interface Inhaber {
  /** Nachname in Großbuchstaben. */
  lastName: string;
  /** Vorname in Großbuchstaben, Spitzname in Klammern erlaubt. */
  firstName: string;
}

interface Basis {
  passNr: number;
  /** Woher das bekannt ist — steht in der Verwaltung und im Prüflauf dabei. */
  note: string | null;
}

export type RegisterKorrektur =
  /**
   * Die Zeile der Mappe gilt nicht. `lastName`/`firstName` sind der Name, den
   * die MAPPE dort führt: Vergibt der Betreiber die Nummer später an jemand
   * anderen, passt er nicht mehr und der Eintrag greift nicht — sonst
   * verschwände still ein neuer Spieler.
   */
  | (Basis & {
    art: 'stillgelegt';
    lastName: string;
    firstName: string;
    /** Die Nummer, unter der die Person wirklich läuft. Reine Erklärung. */
    stattdessen: number | null;
  })
  /** Die Zeile der Mappe gilt, aber für jemand anderen. */
  | (Basis & {
    art: 'inhaber';
    /** Name laut Mappe — dieselbe Absicherung wie oben. */
    lastName: string;
    firstName: string;
    gehoertZu: Inhaber;
  })
  /** Die Mappe kennt die Nummer noch nicht; hier wird sie vergeben. */
  | (Basis & {
    art: 'vergeben';
    gehoertZu: Inhaber;
    division: Division;
  });

export const REGISTER_KORREKTUREN: RegisterKorrektur[] = [
  {
    "art": "stillgelegt",
    "passNr": 196,
    "lastName": "VASZI",
    "firstName": "CLAUDIA",
    "stattdessen": 251,
    "note": "Vom Betreiber gemeldet am 12.09.2026: richtig ist 251. Unter 196 steht kein einziges Turnier, unter 251 alle 63."
  },
  {
    "art": "inhaber",
    "passNr": 281,
    "lastName": "ROLL",
    "firstName": "MORRIS",
    "gehoertZu": {
      "lastName": "HUNDSEDER",
      "firstName": "MARKUS"
    },
    "note": "Vom Betreiber entschieden am 12.09.2026: Die Nummer behält Hundseder. Rolls Turnier vom 09.02.2026 bleibt bei ihm."
  },
  {
    "art": "vergeben",
    "passNr": 490,
    "gehoertZu": {
      "lastName": "GLASHAUSER",
      "firstName": "DAGMAR"
    },
    "division": "women",
    "note": null
  }
];

function gleich(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/**
 * Passt die Korrektur auf diese Zeile der Arbeitsmappe? Verglichen wird die
 * Nummer UND der Name, den die MAPPE führt. Schreibt der Betreiber die Zeile
 * selbst richtig, greift die Korrektur nicht mehr — genau so ist es gewollt.
 */
export function greiftAuf(
  korrektur: RegisterKorrektur,
  passNr: number,
  lastName: string,
  firstName: string,
): boolean {
  if (korrektur.art === 'vergeben') return false;
  return korrektur.passNr === passNr
    && gleich(korrektur.lastName, lastName)
    && gleich(korrektur.firstName, firstName);
}

/** Eine Registerzeile im Rohformat — so, wie der Import sie schreibt. */
export function alsZeile(passNr: number, inhaber: Inhaber): string {
  return `0|${passNr}|${inhaber.lastName}|${inhaber.firstName}|0|0||`;
}
