// ============================================================
// MDC — Lokale, in denen nicht mehr gespielt wird
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Die Turnierleitung nimmt ein Lokal unter
// `/admin/spielorte` heraus, von dort wird diese Datei als Commit abgelegt
// (`lib/mdc/spielort-commit.ts`) — wie News, Kalender, Namen und Ergebnisse.
// Von Hand bearbeiten ist erlaubt; nur die Form muss stimmen, weil die
// Verwaltung sie wieder einliest.
//
// WARUM NICHT EINFACH AUS DER ÜBERSICHT STREICHEN? Zwei Gründe:
//
//   1. Maßgeblich bleibt die Spielorte-Übersicht des Betreibers
//      (`VENUES_BASIS` in `data/venues.ts`) — von Hand gepflegt, mit
//      Kommentaren, nach Wochentagen gruppiert. Ein Programm, das darin
//      Zeilen löscht, müsste die Datei neu erzeugen und risse dabei alles
//      heraus, was daran erklärend ist. Wie bei den Änderungen liegt deshalb
//      hier nur, was sich geändert hat, und wird darübergelegt.
//   2. DIE KENNUNG STEHT IN JEDER ERGEBNISZEILE. Ein Lokal spurlos zu
//      entfernen hieße, alten Turnieren ihren Ort zu nehmen — auf der
//      Turnierseite stünde „Unbekannter Spielort". Ein Eintrag hier nimmt das
//      Lokal aus dem laufenden Betrieb (Spielorte-Seite, Wochenplan,
//      Ergebnis-Upload, Kalender) und macht es zugleich zu einem früheren
//      Lokal: Der Name bleibt an den Ergebnissen, nur die eigene Seite fällt
//      weg. Genau so stehen die von Hand gepflegten `FORMER_VENUES` da.
//
// RÜCKNEHMBAR: Wer versehentlich das falsche Lokal erwischt, nimmt den
// Eintrag unter `/admin/spielorte` wieder heraus — dann ist alles wie vorher.
//
// Ein Eintrag greift nur, solange es das Lokal in der Übersicht überhaupt noch
// gibt. Streicht der Betreiber es dort selbst, oder kommt zur neuen Saison eine
// neue Übersicht, fällt der Eintrag von allein weg;
// `scripts/mdc-check-saison.ts` meldet ihn dann als „ERLEDIGT".
// ============================================================

export interface EntfernterSpielort {
  /** Kennung des Lokals — wie in `VENUES_BASIS` bzw. `spielorte-neu.ts`. */
  venueId: string;
  /**
   * Der Name, der beim Entfernen galt. Damit behalten alte Turniere ihren
   * Ort, auch wenn die Übersicht irgendwann anders heißt.
   */
  name: string;
  /** Tag des Entfernens, `JJJJ-MM-TT` — steht in der Verwaltung dabei. */
  datum: string;
  /** Kurze Begründung, z. B. „Lokal hat zugesperrt". */
  note: string | null;
}

export const ENTFERNTE_SPIELORTE: EntfernterSpielort[] = [
  {
    "venueId": "lustiger-bauer",
    "name": "Lustiger Bauer",
    "datum": "2026-11-28",
    "note": null
  },
  {
    "venueId": "tonys-wirtshaus",
    "name": "Tonys Wirtshaus",
    "datum": "2026-11-28",
    "note": null
  }
];

const BY_ID = new Map(ENTFERNTE_SPIELORTE.map(e => [e.venueId, e]));

/** Ist dieses Lokal von der Seite aus herausgenommen worden? */
export function istEntfernt(venueId: string): boolean {
  return BY_ID.has(venueId);
}

/** Der Eintrag zu einem Lokal — oder `undefined`, wenn es keinen gibt. */
export function entfernungFuer(venueId: string): EntfernterSpielort | undefined {
  return BY_ID.get(venueId);
}
