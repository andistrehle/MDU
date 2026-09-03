// ============================================================
// MDC — Ergebnislisten der Saison 2026/27
// ============================================================
//
// ECHTE DATEN. Quelle: die handgeschriebenen Ergebnislisten der Lokale
// (Formular „ERGEBNISLISTE", Spalten Platz / M / F / neu / Passnr / Pkt /
// Vorname-Name). Abgetippt von den Fotos des Betreibers.
//
// Die Zeilen stehen absichtlich so da, wie sie auf dem Zettel stehen —
// inklusive der Kurznamen („Bonsai", „Micky", „Andi X"). Der vollständige
// Name kommt über die Passnummer aus dem Spielerstamm; der Zettelname bleibt
// daneben stehen, damit man beim Nachprüfen die Zeile wiederfindet.
//
// ── Wie das Abtippen geprüft wurde ───────────────────────────
//
// 1. PUNKTE GEGEN DIE FORMEL. Aus den fünf Listen ließ sich der Punkte-
//    schlüssel der MDC zurückrechnen (siehe `lib/mdc/points.ts`):
//
//        Punkte = max(40, round(232 − 200 × Platz / Teilnehmer))
//
//    Alle Punktwerte aller acht Listen (Felder mit 4, 6, 8, 12, 14, 19, 24
//    und 27 Startern) stimmen damit. Das prüft gleich zwei Dinge: den
//    Punktwert und die Feldgröße — ein verlesener Platz oder ein übersehener
//    Spieler würde hier auffallen.
//
//    Bei DJK Würmtal war die Feldgröße nicht abzählbar (durchgestrichene
//    Zeilen am Ende). Die Formel lässt nur ein einziges n zu, das auf alle
//    19 Zeilen passt — nämlich 19. Damit ist auch klar, dass die
//    durchgestrichene Zeile nicht mitzählt.
//
// 2. PASSNUMMER GEGEN NAMEN. Jede Nummer wurde im Spielerstamm nachgesehen
//    und der dort gespeicherte Name mit dem Zettelnamen verglichen. 65 der
//    73 Zeilen bestätigen sich dadurch selbst. Sechs Lesefehler sind so
//    aufgefallen und korrigiert:
//
//      427 → 428   „Enrico"  (427 ist Johannes Schmidt, 428 Enrico Skarupski)
//      337 → 338   „Chris"   (337 ist Alexander Bloms, 338 Chris Schmidt)
//      412 → 482   „Klausi"  (482 ist „Klausi 5Sterne" — im eigenen Lokal)
//      „Mechi"  → „Hechi"    (232 ist Marcus Hechenberger „Hechi")
//      „Ilev"   → „Oli"      (421 ist Oli Rödig)
//      „Iediko" → „Ildiko"   (204 ist Ildiko Molnar)
//
// ── Was noch zu bestätigen ist (`unsure: true`) ──────────────
//
// Fünf Nummern stehen im Stamm nicht. Das muss kein Lesefehler sein, und
// dafür gibt es einen konkreten Grund: In der Männer-Endrangliste 2025/26
// fehlen die Plätze 199–280 — 82 Spieler, die gespielt haben und in keiner
// Datei stehen (nachgezählt, siehe `docs/mdc-demo.md`). Genau dort dürften
// die männlichen der offenen Nummern zu finden sein.
//
// Bei den Frauen greift die Erklärung nicht: Deren Endrangliste ist
// lückenlos, ebenso beide Sommer-Ranglisten. Eine dort fehlende Nummer war
// letzte Saison also wirklich nicht dabei.
//
// Solange es nicht geklärt ist, laufen diese Zeilen als eigene, neue Spieler.
// Sie holen sich damit keine Punkte, die jemand anderem gehören.
//
//   156  „Thomas Schmid"  — im Stamm ist 156 nicht belegt
//   650  „Sandy"          — nicht belegt, und ohne M/F-Kreuz
//   531  „Hubsi"          — nicht belegt, ohne M/F-Kreuz, Zeile teils
//                            durchgestrichen
//   280  „Moni"           — nicht belegt; es gibt 249 „Moni Singh"
//                            (dort in der Männerwertung geführt)
//   243  „Michi"          — nicht belegt; es gibt 223 Michi Kronbichler
//                            und 252 Michi Moch
//
// Zwei weitere Zeilen tragen eine Initiale, die nicht zum Stamm passt. Die
// Passnummer ist dort aber eindeutig zu lesen, deshalb gilt sie:
//
//   51   Zettel „Manu S."  — Stamm: Manuel Jung
//   119  Zettel „Michi W." — Stamm: Michael Neumaier
//
// ── Spieler ohne Passnummer ──────────────────────────────────
//
// Drei Zeilen sind auf dem Zettel als „neu" angekreuzt und haben noch keine
// Nummer. Sie stehen mit `passNr: null` in den Daten — eine Nummer wird
// NICHT erfunden. Sobald der Betreiber eine vergibt, wird sie hier ergänzt.
// ============================================================

import type { Division } from './types';

export interface SheetRow {
  place: number;
  /**
   * Wertungsklasse laut Zettel. `null`, wenn die M/F-Spalte dort nicht
   * angekreuzt ist (kommt vor) — dann wird sie über die Passnummer aus dem
   * Spielerstamm geholt. Geht auch das nicht, bleibt die Zeile ohne Wertung
   * und wird als offener Punkt ausgewiesen, statt geraten zu werden.
   */
  division: Division | null;
  /** Passnummer vom Zettel. `null` = dort als „neu" ohne Nummer geführt. */
  passNr: number | null;
  points: number;
  /** Name genau so, wie er auf dem Zettel steht. */
  writtenName: string;
  /** Auf dem Zettel als „neu" angekreuzt. */
  isNew?: boolean;
  /** Zuordnung noch zu bestätigen — siehe Kopfkommentar. */
  unsure?: boolean;
}

export interface ResultSheet {
  id: string;
  venueId: string;
  /** ISO-Datum. */
  date: string;
  rows: SheetRow[];
}

/**
 * Eine Zeile je Zettelzeile, Felder wie auf dem Formular:
 * `Platz | M/F | Passnr | Punkte | Name`
 * M/F leer = auf dem Zettel nicht angekreuzt. Passnr leer = „neu" ohne
 * Nummer. Nachgestelltes `|?` = zu bestätigen.
 */
function rows(block: string): SheetRow[] {
  return block
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [place, mf, pass, points, name, flag] = line.split('|').map(s => s.trim());
      const row: SheetRow = {
        place: Number(place),
        division: mf === 'F' ? 'women' : mf === 'M' ? 'men' : null,
        passNr: pass === '' ? null : Number(pass),
        points: Number(points),
        writtenName: name,
      };
      if (pass === '') row.isNew = true;
      if (flag === '?') row.unsure = true;
      return row;
    });
}

export const RESULT_SHEETS: ResultSheet[] = [
  {
    id: 'r-2026-08-31-harlekin',
    venueId: 'harlekin',
    date: '2026-08-31',
    rows: rows(`
       1|M| 23|225|Pat
       2|M| 17|217|Bonsai
       3|M| 51|210|Manu S.
       4|M|259|202|Domi
       5|M|156|195|Thomas Schmid|?
       6|M|153|188|Jimmy
       7|F|301|180|Maria
       8|M|340|173|Mita
       9|M| 63|165|Ronny
       9|M|124|165|Thorsten
       9|M|536|165|Stefan S.
       9|M|526|165|David
      13|M| 66|136|Peter D.
      13|M|119|136|Michi W.
      13|M|198|136|Franz
      13|M| 53|136|Micky
      17|F|236|106|Sam
      17|M|140|106|Odin
      17|M|231|106|Dragan
      17|M|  3|106|CBS
      17|M|262|106|Peter F.
      17|M|102|106|Enrico
      17|F| 67|106|Cheyenne
      17|F| 65|106|Gudrun
      25|M| 12| 47|Stephan
      25|M|163| 47|Mateo
      25|M|200| 47|Leon
    `),
  },
  {
    id: 'r-2026-08-31-legendary',
    venueId: 'legendary',
    date: '2026-08-31',
    rows: rows(`
       1|M|234|199|Alex Rall
       2|M|501|165|Andy X
       3|M|394|132|Armin
       4|M|370| 99|Ali
       5|M|375| 65|Erich
       6|M|374| 40|Karim
    `),
  },
  {
    id: 'r-2026-08-31-bistro-118',
    venueId: 'bistro-118',
    date: '2026-08-31',
    rows: rows(`
       1|M|267|182|Manuel
       2|M|   |132|Christoph Löb
       3|M|   | 82|Steven Gnade
       4|M| 24| 40|Zoltan
    `),
  },
  {
    id: 'r-2026-09-01-ambasador',
    venueId: 'ambasador',
    date: '2026-09-01',
    rows: rows(`
       1|M|532|224|Samet
       2|M|510|215|Timon
       3|M|421|207|Oli
       4|M|547|199|Shaban
       5|M|500|190|Daniel
       6|M|203|182|Peter
       7|M|558|174|Alex
       8|F|280|165|Moni|?
       9|M|243|157|Michi|?
       9|M|227|157|Max
       9|M|536|157|Stefan
       9|M|201|157|Jörgen
      13|M|512|124|Fabi
      13|M|485|124|Spielmann
      13|M|200|124|Leon
      13|F|225|124|Wanda
      17|M|   | 90|Jakob
      17|M| 93| 90|Thomsen
      17|M|559| 90|Robert
      17|M|527| 90|Udo
      17|F|204| 90|Ildiko
      17|M|232| 90|Hechi
      17|M|501| 90|Andi X
      17|M|235| 90|Andre
    `),
  },
  {
    id: 'r-2026-09-01-fuenf-sterne-boazn',
    venueId: 'fuenf-sterne-boazn',
    date: '2026-09-01',
    rows: rows(`
       1|M|153|215|Jimmy
       2|M|428|199|Enrico
       3|M|340|182|Mita
       4|M|185|165|Giorgi
       5|M|174|149|Uwe
       6|M| 12|132|Stephan
       7|M|338|115|Chris
       8|F|301| 99|Maria
       9|M|454| 82|Dennis
       9|M|482| 82|Klausi
       9|M|102| 82|Enrico J.
       9|M| 21| 82|Stangl
    `),
  },
  {
    // Auf diesem Zettel ist die M/F-Spalte durchgehend leer (Bleistift-
    // Kopie). Die Wertungsklasse kommt deshalb über die Passnummer aus dem
    // Stamm — bei 650 „Sandy" und 531 „Hubsi" ist beides offen.
    id: 'r-2026-09-02-djk-wuermtal',
    venueId: 'djk-wuermtal',
    date: '2026-09-02',
    rows: rows(`
       1| |558|221|Alex
       2| |650|211|Sandy|?
       3| | 13|200|Michi
       4| |517|190|Freddy
       5| |527|179|Udo
       6| |515|169|Dieter
       7| |476|158|Chris
       8| |522|148|Yannick
       9| |521|137|Rudi
       9| |524|137|Marco
       9| |340|137|Mita
       9| |301|137|Maria
      13| |518| 95|Yvi
      13| |528| 95|Elias
      13| |526| 95|David jun.
      13| |510| 95|Timon
      17| |523| 53|Davidsen
      17| |537| 53|Angie
      17| |531| 53|Hubsi|?
    `),
  },
  {
    id: 'r-2026-09-02-siebziger',
    venueId: 'siebziger',
    date: '2026-09-02',
    rows: rows(`
       1|M| 23|218|Pat
       2|M|234|203|Alex R.
       3|M| 26|189|Lelli
       4|M|259|175|Domi
       5|M| 71|161|Donato
       6|M|263|146|Asim
       7|M|   |132|Mario Barac
       8|F| 58|118|Mandy
       9|M|262|103|Peter
       9|F| 50|103|die Alex
       9|M| 74|103|Toni
       9|F|236|103|Sam
      13|M|266| 46|Kurti
      13|F|264| 46|Melli
    `),
  },
  {
    id: 'r-2026-09-02-machete-1',
    venueId: 'machete-1',
    date: '2026-09-02',
    rows: rows(`
       1|M|   |207|Markus Böttcher (BIBO)
       2|M|428|182|Enrico
       3|M|153|157|Jimmy
       4|M|501|132|Andi X
       5|M|  5|107|Sven
       6|M|   | 82|Artur Opalko
       7|M|379| 57|Didi
       8|F|396| 40|Karin
    `),
  },
];

/** Zahl der Starter eines Turniers — die Feldgröße für den Punkteschlüssel. */
export function fieldSize(sheet: ResultSheet): number {
  return sheet.rows.length;
}

/** Alle Zeilen aller Listen, mit der Liste dabei. */
export function allSheetRows(): { sheet: ResultSheet; row: SheetRow }[] {
  return RESULT_SHEETS.flatMap(sheet => sheet.rows.map(row => ({ sheet, row })));
}

/** Zeilen, deren Zuordnung der Betreiber noch bestätigen muss. */
export function unsureRows(): { sheet: ResultSheet; row: SheetRow }[] {
  return allSheetRows().filter(({ row }) => row.unsure);
}

/** Zeilen ohne Passnummer („neu" auf dem Zettel). */
export function rowsWithoutPass(): { sheet: ResultSheet; row: SheetRow }[] {
  return allSheetRows().filter(({ row }) => row.passNr === null);
}
