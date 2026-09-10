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

export const RESULTS_UPLOADED_RAW: string[] = [
  '2026-09-06|siebziger|71:212,153:192,119:172,164:152,259:132,340:112,198:92,102:72,260:52,74:52',
  '2026-09-08|ambasador|421:220,532:208,558:197,232:185,500:173,485:161,547:150,227:138,210:126,201:126,235:126,220:126,200:79,207:79,559:79,297:79,203:40',
  '2026-09-08|fuenf-sterne-boazn|533:214,153:196,131:177,340:159,428:141,501:123,338:105,379:87,460:68,450:68,454:68',
  '2026-09-09|djk-wuermtal|517:217,550:201,510:186,524:170,515:155,526:140,509:124,527:109,292:94,522:94,518:94,530:94,476:40',
  '2026-09-09|machete-1|314:217,147:201,428:186,171:170,120:155,396:140,5:124,155:109,316:94,379:94,301:94,340:94,537:40',
  '2026-09-09|siebziger|153:217,71:201,263:186,58:170,501:155,74:140,260:124,198:109,482:94,262:94,275:94,264:94,266:40',
];
