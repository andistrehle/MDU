// ============================================================
// MDC — Doppelte Registereinträge stilllegen
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Die Turnierleitung pflegt das unter
// `/admin/passnummern`, von dort wird diese Datei als Commit abgelegt
// (`lib/mdc/register-commit.ts`) — genau wie Namen, News, Kalender und
// Ergebnisse. Von Hand bearbeiten ist erlaubt; nur die Form muss stimmen,
// weil die Verwaltung sie wieder einliest.
//
// WOFÜR DAS DA IST — genau ein Fall, und der ist echt:
//
//   Im Blatt „Teilnehmer" der Arbeitsmappe steht derselbe Mensch ZWEIMAL, mit
//   zwei verschiedenen Nummern. Gespielt hat er unter einer davon; die andere
//   Zeile ist versehentlich stehen geblieben.
//
//   Das ist nicht bloß unschön. Die Spieler-ID entsteht aus dem Namen: Beim
//   zweiten Eintrag hängt die Seite die Passnummer an („claudia-vaszi-251"),
//   und damit werden aus einem Menschen zwei — einer mit allen Ergebnissen
//   und der FALSCHEN Nummer, einer ohne Ergebnisse mit der richtigen.
//   Aufgefallen am 12.09.2026 bei Claudia Vaszi (196 und 251).
//
// WAS HIER NICHT HINEINGEHÖRT: eine Nummer, mit der jemand gespielt hat. Die
// Prüfung in `app/mdc/admin/passnummern/actions.ts` lehnt das ab. Eine Nummer
// stillzulegen heißt, dass sie im Register nie gestanden hätte — bei einer
// gespielten Nummer verlöre ein Turnier seinen Menschen.
//
// Der Eintrag greift NUR, solange die Mappe ihn braucht: Er nennt auch den
// Namen, der an der Nummer steht. Vergibt der Betreiber die Nummer später an
// jemand anderen, passt der Name nicht mehr und die Zeile bleibt stehen —
// sonst verschwände still ein neuer Spieler. Räumt er den Doppeleintrag aus
// der Mappe, meldet `scripts/mdc-check-saison.ts` „ERLEDIGT".
// ============================================================

export interface RegisterKorrektur {
  /** Die Nummer, deren Registerzeile nicht gilt. */
  passNr: number;
  /** Nachname in Großbuchstaben — so wie er in der Mappe steht. */
  lastName: string;
  /** Vorname in Großbuchstaben. */
  firstName: string;
  /** Die Nummer, unter der die Person wirklich läuft. Nur zur Erklärung. */
  stattdessen: number | null;
  /** Woher das bekannt ist — steht in der Verwaltung und im Prüflauf dabei. */
  note: string | null;
}

export const REGISTER_KORREKTUREN: RegisterKorrektur[] = [
  {
    "passNr": 196,
    "lastName": "VASZI",
    "firstName": "CLAUDIA",
    "stattdessen": 251,
    "note": "Vom Betreiber gemeldet am 12.09.2026: richtig ist 251. Unter 196 steht kein einziges Turnier, unter 251 alle 63."
  }
];

/**
 * Passt die Korrektur auf diese Registerzeile? Verglichen wird die Nummer UND
 * der Name — eine neu vergebene Nummer darf nicht stillschweigend unter eine
 * alte Korrektur fallen.
 */
export function greiftAuf(
  korrektur: RegisterKorrektur,
  passNr: number,
  lastName: string,
  firstName: string,
): boolean {
  return korrektur.passNr === passNr
    && korrektur.lastName.trim().toUpperCase() === lastName.trim().toUpperCase()
    && korrektur.firstName.trim().toUpperCase() === firstName.trim().toUpperCase();
}
