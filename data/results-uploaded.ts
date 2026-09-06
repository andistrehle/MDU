// ============================================================
// MDC — Turniere, die vom Ergebniszettel hochgeladen wurden
// ============================================================
//
// GESCHRIEBEN VON DER SEITE SELBST. Wer auf `/admin/ergebnis` ein Foto des
// Ergebniszettels hochlädt, die erkannte Liste prüft und freigibt, erzeugt hier
// eine Zeile (siehe `lib/mdc/ergebnis-commit.ts`). Von Hand bearbeiten ist
// erlaubt — es ist eine gewöhnliche Datei —, nur die Form muss stimmen.
//
// Format wie in den erzeugten Saisondateien, damit beides durch dieselbe
// Auswertung läuft:
//
//   Datum | Spielort-ID | Passnr.:Punkte, Passnr.:Punkte, …
//
// In Platzreihenfolge, der erste Eintrag ist Platz 1. Die Saison ergibt sich
// aus dem Datum (`data/season.ts`), die Punkte aus Platz und Feldgröße
// (`lib/mdc/points.ts`) — sie stehen trotzdem mit dabei, damit die Datei für
// sich lesbar bleibt und `scripts/mdc-check-saison.ts` nachrechnen kann.
//
// ── Verhältnis zur Arbeitsmappe ──────────────────────────────
//
// Die Mappe des Betreibers bleibt die maßgebliche Quelle. Taucht dasselbe
// Turnier (gleiches Datum, gleiches Lokal) später dort auf, gewinnt die Mappe
// und die Zeile hier wird ignoriert — nicht gelöscht, damit man beides
// vergleichen kann. Auf der Turnierseite steht dann wieder „aus der
// Auswertung" statt „vom Ergebniszettel".
//
// Aufräumen ist deshalb ungefährlich, aber auch nicht nötig: Eine Zeile, die
// von der Mappe überholt wurde, kostet nichts außer drei Zeilen Text.
// ============================================================

export const RESULTS_UPLOADED_RAW: string[] = [];
