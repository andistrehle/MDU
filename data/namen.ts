// ============================================================
// MDC — Namenskorrekturen
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Die Turnierleitung pflegt das unter
// `/admin/passnummern`, von dort wird diese Datei als Commit abgelegt
// (`lib/mdc/namen-commit.ts`) — genau wie News, Kalender und Ergebnisse. Von
// Hand bearbeiten ist erlaubt; nur die Form muss stimmen, weil die Verwaltung
// sie wieder einliest.
//
// Wozu das gut ist — zwei Fälle, beide echt:
//
//   SCHREIBWEISE   Dieselbe Person steht in zwei Auswertungen verschieden
//                  geschrieben („Pogremino" ↔ „Pogremno"). Ohne Korrektur
//                  würden daraus zwei Menschen mit zwei Ranglistenzeilen —
//                  die Spieler-ID entsteht aus dem Namen.
//
//   LOKALNAME      Wer ohne Nachnamen antritt, wird unter dem Namen seines
//                  Lokals geführt („Ambasador David"). Trägt er ihn später
//                  auf einem Ergebniszettel nach, gehört er hierher.
//
// Die Korrektur greift auf ALLE Quellen zugleich: Register, laufende Wertung,
// Archiv, hochgeladene Zettel. Deshalb steht sie hier und nicht in einer der
// erzeugten Dateien — dort würde sie beim nächsten Import überschrieben, und
// solange sie nur an einer Stelle stünde, entstünden zwei Spieler.
//
// Namen bitte in GROSSBUCHSTABEN, so wie sie in der Arbeitsmappe stehen. Die
// Seite setzt sie selbst in die richtige Schreibweise (`titleCase`), und ein
// Spitzname darf wie üblich in Klammern hinter dem Vornamen stehen.
// ============================================================

import { slugify } from '@/lib/mdc/names';

export interface Namenskorrektur {
  /** Passnummer, um die es geht. */
  passNr: number;
  /** Nachname in Großbuchstaben. */
  lastName: string;
  /** Vorname in Großbuchstaben, Spitzname in Klammern erlaubt. */
  firstName: string;
  /**
   * Adresse, unter der das Profil vor der Korrektur stand. Die Spieler-ID
   * entsteht aus dem Namen — mit dem Namen ändert sich also die Adresse, und
   * ein alter Link liefe ins Leere. `app/mdc/spieler/[id]/page.tsx` leitet
   * deshalb von hier aus dauerhaft auf das heutige Profil um.
   */
  alteId: string | null;
  /** Woher der richtige Name kommt — steht in der Verwaltung dabei. */
  note: string | null;
}

export const NAMEN: Namenskorrektur[] = [
  {
    "passNr": 53,
    "lastName": "SCHUL",
    "firstName": "MICKY",
    "alteId": "mikky-schul",
    "note": "Saison 2025/26 „Schul Micky“, Sommer-Ranking „Schul Mikky“ — es gilt die Saison-Auswertung."
  },
  {
    "passNr": 153,
    "lastName": "POGREMNO",
    "firstName": "JIMMY",
    "alteId": "jimmy-pogremino",
    "note": "Saison 2025/26 „Pogremino“, Sommer-Ranking „Pogremno“ — richtig ist ohne i, vom Betreiber bestätigt."
  },
  {
    "passNr": 297,
    "lastName": "SEDLMEIER",
    "firstName": "DAVID",
    "alteId": "david-ambasador",
    "note": "Lief als „Ambasador David“, Nachname am 08.09.2026 auf dem Zettel nachgetragen."
  },
  {
    "passNr": 312,
    "lastName": "BEHREND",
    "firstName": "REINHOLD",
    "alteId": "reinhold-machete",
    "note": "Lief in der Saison 2025/26 als „Machete Reinhold“ unter dem Lokalnamen."
  }
];

const NACH_NUMMER = new Map(NAMEN.map(n => [n.passNr, n]));

/** Die Korrektur zu einer Passnummer, falls es eine gibt. */
export function namensKorrektur(passNr: number): Namenskorrektur | undefined {
  return NACH_NUMMER.get(passNr);
}

/** Alle Korrekturen, nach Passnummer. */
export function alleKorrekturen(): Namenskorrektur[] {
  return [...NAMEN].sort((a, b) => a.passNr - b.passNr);
}

/**
 * Die Adresse, die dieser Name ergibt — dieselbe Rechnung wie in
 * `parse-ranking.ts`: Slug aus Vor- und Nachname, ohne den Spitznamen in
 * Klammern. Bei Namensgleichheit hängt die Rangliste dort noch die Passnummer
 * an; das kommt hier nicht vor, weil die Umleitung nur greift, wenn es die
 * Adresse sonst nicht gibt.
 */
export function neuePlayerId(korrektur: Namenskorrektur): string {
  const ohneSpitzname = korrektur.firstName.replace(/\s*\([^)]*\)\s*$/, '');
  return slugify(`${ohneSpitzname} ${korrektur.lastName}`);
}

/**
 * Zeigt eine alte Profiladresse auf ein heutiges Profil? Dann gibt das die
 * neue Adresse zurück — sonst `null`. Damit bleibt ein Link, der vor der
 * Korrektur weitergegeben wurde, gültig, statt in einen 404 zu laufen.
 */
export function neueAdresseFuer(alteId: string): string | null {
  for (const korrektur of NAMEN) {
    if (korrektur.alteId !== alteId) continue;
    const neu = neuePlayerId(korrektur);
    return neu === alteId ? null : neu;
  }
  return null;
}
