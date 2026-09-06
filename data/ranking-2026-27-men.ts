// ============================================================
// MDC — Rangliste Männer, Saison 2026/27 (Stand 2026-09-05)
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
//                 26 der 94 Zeilen teilen sich so einen Platz.
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
  '1|153|POGREMNO|JIMMY|5|899|10',
  '2|234|RALL|ALEX|4|840|8.3|u',
  '3|340|BURDULEA|MITA|5|789|7|d',
  '4|501|X|ANDI|5|610|5.5|u',
  '5|558|BÖHME|ALEX|3|540|4',
  '6|510|WÜRMTAL|TIMON|3|467|3.25|u',
  '7|23|RUHLAND|PATRICK|2|442|2.8|d',
  '8|532|ADILI|SAMET|2|436|2.5|u',
  '9|536|SANWALD|STEFAN|3|422|2',
  '10|51|JUNG|MANUEL|2|412|2|u',
  '11|421|RÖDIG|OLI|2|399|2|u',
  '12|517|DOENICKE|FREDDY|2|397|2|u',
  '13|26|LEHNER|MARTIN|2|396|1.7|u',
  '14|500|HOSSI|DANIEL|2|392|1.7|u',
  '|17|LWOWSKI|CHRISS (BONSAI)|2|392|1.7',
  '16|547|REXHEPI|SHABAN|2|381|1.7|u',
  '|428|SKARUPSKI|ENRICO|2|381|1.4|d',
  '18|526|SCHUSTER|DAVID|3|378|1.4|d',
  '19|259|70ER|DOMINIC|2|376|1.4|d',
  '20|512|WIMMER|FABIAN|3|369|1.4|u',
  '21|71|MASTRIA|DONATO|2|350|1.4|u',
  '22|527|MATTHES|UDO|3|339|1.4|d',
  '23|260|BRUNN|MICHAEL|2|331|1.4',
  '24|13|SCHREIL|MICHI|2|320|1.4|d',
  '25|232|HECHENBERGER|MARCUS (HECHI)|2|312|1.1|u',
  '26|12|BRUNNER|STEPHAN|3|303|1.1|d',
  '27|515|ROSSMAYR|DIETER|2|301|1.1|u',
  '28|201|FEICHTINGER|JÜRGEN|2|299|1.1|u',
  '29|528|SCHUSTER|ELIAS|2|277|1.1|u',
  '|314|BÖTTCHER|MARKUS (BIBO)|2|277|1.1|d',
  '31|485|SPIELMANN|ANDREAS|2|276|1.1|u',
  '32|522|LIBEER|YANNIK|2|268|1.1|u',
  '33|223|KRONBICHLER|MICHI|2|259|0.8|u',
  '34|559|RG|ROBERT|2|232|0.8|u',
  '|235|SCHRÖDER|ANDRE|2|232|0.8|u',
  '36|131|HÖFFNER|GERD|1|220|0.8',
  '37|550|POLLER|SANDY|1|211|0.8|d',
  '38|262|FRÖSE|PETER|2|204|0.8|d',
  '39|533|BIBER|ULI|1|195|0.8',
  '40|156|SCHMID|THOMAS|1|194|0.8|d',
  '41|207|AMBASADOR|JAKOB|2|192|0.8|u',
  '42|102|JAURICH|ENRICO|2|183|0.8|d',
  '43|267|BUCHHOLZ|MANUEL|1|182|0.8|d',
  '|203|KERKLAU|PETER|1|182|0.8|d',
  '45|210|JUCHEM|FRÄNKY|1|172|0.8',
  '46|200|LUDWIG|LEON|2|167|0.8|d',
  '47|185|KETIASHVILI|GIORGI|1|165|0.8|d',
  '48|124|SCHULZ-NEUBER|THORSTEN|1|163|0.8|d',
  '|63|MÜLLER|RONNY|1|163|0.5|d',
  '50|338|SCHMIDT|CHRIS|2|161|0.5|u',
  '51|476|MARX|CHRIS|1|158|0.5|d',
  '52|322|BAUMSTARK|KENNY|1|157|0.5',
  '|227|HOLLWEG|MAX|1|157|0.5|d',
  '54|174|MÜLLER|UWE|1|149|0.5|d',
  '55|263|MUHIC|ASIM|1|146|0.5|d',
  '56|157|MEIER|FLO|1|145|0.5',
  '57|524|LEIRICH|MARCO|1|137|0.5|d',
  '|521|PILSL|RUDI|1|137|0.5|d',
  '59|394|LEGENDARY|ARMIN|1|132|0.5|d',
  '|277|BARAC|MARIO|1|132|0.5|d',
  '|230|SCHUSTER|EIKE|1|132|0.5',
  '|198|FREINBERGER|FRANZ|1|132|0.5|d',
  '|132|LÖB|CHRIS|1|132|0.5|d',
  '|119|NEUMAIER|MICHAEL|1|132|0.5|d',
  '|66|DENGLER|PETER|1|132||d',
  '66|523|HATTON|DAVID|2|123||u',
  '67|514|WÜRMTAL|ROBBIE|1|120',
  '|503|LUTZ|THOMAS|1|120',
  '|459|DOSPIL|GERD|1|120',
  '70|5|ALBRECHT|SVEN|1|107||d',
  '71|74|MASTRIA|ANTONIO|1|103||d',
  '|64|HANSL|MATHIAS|1|103',
  '73|297|AMBASADOR|DAVID|1|102',
  '74|231|HERCEG|DRAGAN|1|101||d',
  '|140|ODIN|MICHI|1|101||d',
  '|3|BAUER|CHRISTIAN CB5|1|101||d',
  '77|370|LEGENDARY|ALI|1|99||d',
  '78|93|HOFSTETTER|THOMSEN|1|90||d',
  '79|482|5STERNE|KLAUSI|1|82||d',
  '|454|LENTNER|DENNIS|1|82||d',
  '|315|OPALKO|ARTUR|1|82||d',
  '|146|GNADE|STEVEN|1|82||d',
  '|21|LENZ|RENE (STANGL)|1|82||d',
  '84|509|PREISSL|DANIEL|1|70',
  '|178|MENZEL|TOBI|1|70',
  '86|375|BAHN|ERICH|1|65||d',
  '87|299|AMBASADOR|MESUT|1|62',
  '|212|SCHMALZL|THOMAS|1|62',
  '89|379|WAGNER|DIDI|1|57||d',
  '90|531|WÜRMTAL|HUBSI|1|53||d',
  '91|266|FISCHER|KURTI|1|46||d',
  '92|163|JOSIPOV|MATO|1|43||d',
  '93|374|LEGENDARY|KARIM|1|40||d',
  '|24|TOTH|ZOLTAN|1|40||d',
];
