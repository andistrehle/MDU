// ============================================================
// MDC — Rangliste Männer, Saison 2026/27 (Stand 2026-09-06)
// ============================================================
//
// ERZEUGT aus der Arbeitsmappe des Betreibers durch
// `scripts/mdc-import-saison.py` (Blatt „Männer"). Nicht von Hand
// bearbeiten — sonst laufen Rangliste und Einzelergebnisse auseinander.
//
// Format je Zeile:
//
//   Platz | Passnr. | Name | Vorname | Anzahl TN | Punkte | % | Trend
//
// • Platz leer  → punktgleich mit der Zeile darüber (geteilter Platz).
//                 28 der 96 Zeilen teilen sich so einen Platz.
// • %           → Anteil an der Einzelranglisten-Ausschüttung (EZR).
//                 Der Euro-Betrag wird daraus berechnet (siehe ranking-final.ts),
//                 damit Prozent und Euro nicht auseinanderlaufen können.
// • Trend       → 'u' = ▲ gestiegen, 'd' = ▼ gefallen, leer = unverändert.
// • Schnitt     → wird als Punkte / Anzahl TN berechnet, nicht gepflegt.
//
// Jede Zeile ist gegen die Einzelergebnisse derselben Mappe gerechnet: Die
// Summe der Turnierpunkte einer Passnummer ergibt die Punktzahl hier, die
// Anzahl der Starts die Spalte „Anzahl TN".
//
// Die laufende Saison: Diese Datei wird bei jeder neuen Fassung der Mappe
// neu erzeugt. Vorher standen hier acht von Hand abgetippte Ergebniszettel;
// die Mappe hat sie ersetzt (siehe docs/mdc-demo.md).
// ============================================================

export const RANKING_MEN_2026_27_RAW: string[] = [
  '1|153|POGREMNO|JIMMY|5|901|10',
  '2|234|RALL|ALEX|4|840|8.3',
  '3|340|BURDULEA|MITA|5|792|7',
  '4|558|BÖHME|ALEX|4|672|5.5',
  '5|532|ADILI|SAMET|3|618|4',
  '6|501|X|ANDI|5|610|3.25',
  '7|500|HOSSI|DANIEL|3|549|2.8',
  '8|510|WÜRMTAL|TIMON|3|467|2.5',
  '9|23|RUHLAND|PATRICK|2|443|2',
  '10|536|SANWALD|STEFAN|3|424|2',
  '11|51|JUNG|MANUEL|2|413|2',
  '12|421|RÖDIG|OLI|2|399|2',
  '13|517|DOENICKE|FREDDY|2|397|1.7',
  '14|26|LEHNER|MARTIN|2|396|1.7',
  '15|17|LWOWSKI|CHRISS (BONSAI)|2|392|1.7',
  '16|547|REXHEPI|SHABAN|2|381|1.7|u',
  '|428|SKARUPSKI|ENRICO|2|381|1.4|u',
  '18|526|SCHUSTER|DAVID|3|380|1.4|d',
  '19|259|70ER|DOMINIC|2|377|1.4',
  '20|512|WIMMER|FABIAN|3|369|1.4',
  '21|71|MASTRIA|DONATO|2|350|1.4',
  '22|527|MATTHES|UDO|3|339|1.4',
  '23|260|BRUNN|MICHAEL|2|331|1.4',
  '24|13|SCHREIL|MICHI|2|320|1.4',
  '25|559|RG|ROBERT|3|314|1.1',
  '26|232|HECHENBERGER|MARCUS (HECHI)|2|312|1.1',
  '27|515|ROSSMAYR|DIETER|2|301|1.1',
  '28|201|FEICHTINGER|JÜRGEN|2|299|1.1',
  '29|210|JUCHEM|FRÄNKY|2|279|1.1',
  '30|528|SCHUSTER|ELIAS|2|277|1.1',
  '|314|BÖTTCHER|MARKUS (BIBO)|2|277|1.1',
  '32|485|SPIELMANN|ANDREAS|2|276|1.1',
  '33|522|LIBEER|YANNIK|2|268|0.8',
  '34|223|KRONBICHLER|MICHI|2|259|0.8',
  '35|207|AMBASADOR|JAKOB|3|249|0.8|u',
  '|12|BRUNNER|STEPHAN|3|249|0.8|d',
  '37|235|SCHRÖDER|ANDRE|2|232|0.8',
  '38|131|HÖFFNER|GERD|1|220|0.8',
  '39|550|POLLER|SANDY|1|211|0.8|u',
  '40|262|FRÖSE|PETER|2|209|0.8|d',
  '41|533|BIBER|ULI|1|195|0.8|u',
  '|156|SCHMID|THOMAS|1|195|0.8|d',
  '43|102|JAURICH|ENRICO|2|188|0.8',
  '44|267|BUCHHOLZ|MANUEL|1|182|0.8',
  '|203|KERKLAU|PETER|1|182|0.8',
  '46|200|LUDWIG|LEON|2|171|0.8',
  '47|185|KETIASHVILI|GIORGI|1|165|0.8|u',
  '|124|SCHULZ-NEUBER|THORSTEN|1|165|0.8|d',
  '|63|MÜLLER|RONNY|1|165|0.5|d',
  '50|338|SCHMIDT|CHRIS|2|161|0.5',
  '51|476|MARX|CHRIS|1|158|0.5',
  '52|322|BAUMSTARK|KENNY|1|157|0.5',
  '|227|HOLLWEG|MAX|1|157|0.5',
  '54|174|MÜLLER|UWE|1|149|0.5',
  '55|263|MUHIC|ASIM|1|146|0.5',
  '56|157|MEIER|FLO|1|145|0.5',
  '57|524|LEIRICH|MARCO|1|137|0.5|u',
  '|521|PILSL|RUDI|1|137|0.5|u',
  '59|198|FREINBERGER|FRANZ|1|136|0.5|d',
  '|119|NEUMAIER|MICHAEL|1|136|0.5|d',
  '|66|DENGLER|PETER|1|136|0.5|d',
  '|53|SCHUL|MICKY|1|136|0.5|d',
  '63|394|LEGENDARY|ARMIN|1|132|0.5',
  '|277|BARAC|MARIO|1|132|0.5',
  '|230|SCHUSTER|EIKE|1|132',
  '|132|LÖB|CHRIS|1|132',
  '67|523|HATTON|DAVID|2|123',
  '68|514|WÜRMTAL|ROBBIE|1|120',
  '|503|LUTZ|THOMAS|1|120',
  '|459|DOSPIL|GERD|1|120',
  '71|5|ALBRECHT|SVEN|1|107||u',
  '72|231|HERCEG|DRAGAN|1|106||d',
  '|140|ODIN|MICHI|1|106||d',
  '|3|BAUER|CHRISTIAN CB5|1|106||d',
  '75|74|MASTRIA|ANTONIO|1|103',
  '|64|HANSL|MATHIAS|1|103',
  '77|297|AMBASADOR|DAVID|1|102',
  '78|370|LEGENDARY|ALI|1|99',
  '79|93|HOFSTETTER|THOMSEN|1|90',
  '80|482|5STERNE|KLAUSI|1|82',
  '|454|LENTNER|DENNIS|1|82',
  '|315|OPALKO|ARTUR|1|82',
  '|146|GNADE|STEVEN|1|82',
  '|21|LENZ|RENE (STANGL)|1|82',
  '85|509|PREISSL|DANIEL|1|70',
  '|178|MENZEL|TOBI|1|70',
  '87|375|BAHN|ERICH|1|65',
  '88|299|AMBASADOR|MESUT|1|62',
  '|212|SCHMALZL|THOMAS|1|62',
  '90|379|WAGNER|DIDI|1|57',
  '91|531|WÜRMTAL|HUBSI|1|53',
  '92|163|JOSIPOV|MATO|1|47',
  '93|266|FISCHER|KURTI|1|46',
  '94|502|MILJANOVIC|MILE|1|40',
  '|374|LEGENDARY|KARIM|1|40',
  '|24|TOTH|ZOLTAN|1|40',
];
