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
// ── Verhältnis zur Arbeitsmappe (geändert am 12.09.2026) ─────
//
// DIESE DATEI IST DIE HAUPTQUELLE. Führt die Arbeitsmappe dasselbe Turnier
// (gleiches Datum, gleiches Lokal), gewinnt die Zeile hier — sie ist am
// Bildschirm gegen den Zettel geprüft worden, und Berichtigungen hängen an
// ihr.
//
// Bis dahin war es umgekehrt. Die Mappe läuft in der Übergangszeit als
// Gegenprobe weiter: `scripts/mdc-check-saison.ts` vergleicht beide Fassungen
// und meldet jede Abweichung. Solange dort „identisch" steht, ist der Abend
// zweimal unabhängig richtig erfasst worden.
// ============================================================

export const RESULTS_UPLOADED_RAW: string[] = [
  '2026-09-06|siebziger|71:212,153:192,119:172,164:152,259:132,340:112,198:92,102:72,260:52,74:52',
  '2026-09-08|ambasador|421:220,532:208,558:197,232:185,500:173,485:161,547:150,227:138,210:126,201:126,235:126,220:126,200:79,207:79,559:79,297:79,203:40',
  '2026-09-08|fuenf-sterne-boazn|533:214,153:196,131:177,340:159,428:141,501:123,338:105,379:87,460:68,450:68,454:68',
  '2026-09-09|djk-wuermtal|517:217,550:201,510:186,524:170,515:155,526:140,509:124,527:109,292:94,522:94,518:94,530:94,476:40',
  '2026-09-09|machete-1|314:217,147:201,428:186,171:170,120:155,396:140,5:124,155:109,316:94,379:94,301:94,340:94,537:40',
  '2026-09-09|siebziger|153:217,71:201,263:186,58:170,501:155,74:140,260:124,198:109,482:94,262:94,275:94,264:94,266:40',
  '2026-09-10|siebziger|234:220,51:207,281:195,153:182,260:170,97:157,482:145,263:132,410:120,71:120,262:120,198:120,80:70,64:70,338:70,267:70',
  '2026-09-11|ambasador|547:215,223:199,203:182,220:165,207:149,485:132,559:115,298:99,299:82,225:82,257:82,297:82',
  '2026-09-11|djk-wuermtal|520:212,164:192,13:172,510:152,526:132,477:112,533:92,178:72,530:52,537:52',
  '2026-09-11|fuenf-sterne-boazn|428:214,340:196,454:177,314:159,460:141,422:123,153:105,501:87,275:68,415:68,301:68',
  '2026-09-11|harlekin|23:199,259:165,78:132,124:99,198:65,236:40',
  '2026-09-13|ambasador|547:218,500:203,220:189,502:175,201:161,501:146,146:132,225:118,223:103,257:103,559:103,275:103,299:46,207:46',
  '2026-09-13|djk-wuermtal|517:212,533:192,558:172,525:152,476:132,526:112,524:92,509:72,536:52,515:52',
  '2026-09-13|harlekin|327:182,67:132,221:82,80:40',
  '2026-09-13|machete-1|428:182,340:132,558:82,509:40',
  '2026-09-13|siebziger|51:214,71:196,260:177,262:159,58:141,263:123,198:105,270:87,264:68,102:68,74:68',
  '2026-09-14|bistro-118|164:217,146:201,27:186,260:170,24:155,558:140,132:124,31:109,303:94,319:94,267:94,80:94,134:40',
  '2026-09-14|harlekin|23:220,259:207,65:195,340:182,301:170,502:157,67:145,318:132,198:120,163:120,338:120,140:120,236:70,53:70,66:70,342:70',
  '2026-09-14|legendary|365:212,385:192,379:172,370:152,375:132,394:112,275:92,388:72,501:52,374:52',
  '2026-09-15|ambasador|547:219,421:205,558:192,147:179,493:165,210:152,203:139,220:125,320:112,536:112,559:112,297:112,544:59,257:59,212:59',
  '2026-09-15|fuenf-sterne-boazn|51:215,260:199,533:182,340:165,428:149,498:132,275:115,246:99,501:82,499:82,363:82,460:82',
  '2026-09-16|djk-wuermtal|515:214,517:196,558:177,525:159,550:141,518:123,522:105,510:87,530:68,509:68,524:68',
];
