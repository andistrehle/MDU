// ============================================================
// MDC — Rangliste Männer, Saison 2026/27 (Stand 2026-09-08)
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
//                 22 der 109 Zeilen teilen sich so einen Platz.
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
  '1|153|POGREMNO|JIMMY|7|1183|10',
  '2|340|BURDULEA|MITA|7|1069|8.3',
  '3|234|RALL|ALEX|4|840|7',
  '4|501|X|ANDI|6|762|5.5|u',
  '5|259|70ER|DOMINIC|4|708|4|u',
  '6|558|BÖHME|ALEX|4|672|3.25|d',
  '7|23|RUHLAND|PATRICK|3|667|2.8|u',
  '8|51|JUNG|MANUEL|3|628|2.5|u',
  '9|532|ADILI|SAMET|3|618|2|d',
  '10|71|MASTRIA|DONATO|3|562|2|d',
  '11|500|HOSSI|DANIEL|3|549|2|d',
  '12|260|BRUNN|MICHAEL|4|540|2|u',
  '13|119|NEUMAIER|MICHAEL|3|498|1.7|u',
  '14|510|WÜRMTAL|TIMON|3|467|1.7|d',
  '15|512|WIMMER|FABIAN|4|459|1.7|u',
  '16|536|SANWALD|STEFAN|3|424|1.7|d',
  '17|198|FREINBERGER|FRANZ|3|410|1.4|u',
  '18|421|RÖDIG|OLI|2|399|1.4|d',
  '19|517|DOENICKE|FREDDY|2|397|1.4|d',
  '20|26|LEHNER|MARTIN|2|396|1.4|d',
  '21|267|BUCHHOLZ|MANUEL|2|392|1.4|u',
  '|17|LWOWSKI|CHRISS (BONSAI)|2|392|1.4|d',
  '23|547|REXHEPI|SHABAN|2|381|1.4|d',
  '|428|SKARUPSKI|ENRICO|2|381|1.4|d',
  '25|526|SCHUSTER|DAVID|3|380|1.1|d',
  '26|164|BERNARDI|SASCHA|2|364|1.1|u',
  '27|102|JAURICH|ENRICO|4|350|1.1|u',
  '28|527|MATTHES|UDO|3|339|1.1|d',
  '29|13|SCHREIL|MICHI|2|320|1.1|d',
  '30|559|RG|ROBERT|3|314|1.1|d',
  '31|232|HECHENBERGER|MARCUS (HECHI)|2|312|1.1|d',
  '32|515|ROSSMAYR|DIETER|2|301|1.1|d',
  '33|201|FEICHTINGER|JÜRGEN|2|299|0.8|d',
  '34|124|SCHULZ-NEUBER|THORSTEN|2|289|0.8|u',
  '35|210|JUCHEM|FRÄNKY|2|279|0.8|d',
  '36|528|SCHUSTER|ELIAS|2|277|0.8|d',
  '|314|BÖTTCHER|MARKUS (BIBO)|2|277|0.8|d',
  '38|485|SPIELMANN|ANDREAS|2|276|0.8|d',
  '39|370|LEGENDARY|ALI|2|271|0.8|u',
  '40|522|LIBEER|YANNIK|2|268|0.8|d',
  '41|394|LEGENDARY|ARMIN|2|264|0.8|u',
  '42|140|ODIN|MICHI|2|263|0.8|u',
  '43|66|DENGLER|PETER|2|260|0.8|u',
  '|53|SCHUL|MICKY|2|260|0.8|u',
  '45|223|KRONBICHLER|MICHI|2|259|0.8|d',
  '46|207|AMBASADOR|JAKOB|3|249|0.8|d',
  '|12|BRUNNER|STEPHAN|3|249|0.8|d',
  '48|235|SCHRÖDER|ANDRE|2|232|0.8|d',
  '49|132|LÖB|CHRIS|2|231|0.5|u',
  '50|131|HÖFFNER|GERD|1|220|0.5|d',
  '51|550|POLLER|SANDY|1|211|0.5|d',
  '52|262|FRÖSE|PETER|2|209|0.5|d',
  '53|78|TOMIC|MLADEN|1|207|0.5',
  '54|231|HERCEG|DRAGAN|2|196|0.5|u',
  '55|533|BIBER|ULI|1|195|0.5|d',
  '|156|SCHMID|THOMAS|1|195|0.5|d',
  '57|385|SCHWEIGER|THOMAS|1|192|0.5',
  '58|179|MATEJKA|BALU|1|188|0.5',
  '59|203|KERKLAU|PETER|1|182|0.5|d',
  '60|118|HARLEKIN|SÖRKE|1|174|0.5',
  '61|482|5STERNE|KLAUSI|2|172|0.5|u',
  '62|200|LUDWIG|LEON|2|171|0.5|d',
  '63|185|KETIASHVILI|GIORGI|1|165|0.5|d',
  '|63|MÜLLER|RONNY|1|165|0.5|d',
  '|31|MEYER|PATRICK|1|165',
  '66|338|SCHMIDT|CHRIS|2|161||d',
  '67|476|MARX|CHRIS|1|158||d',
  '68|322|BAUMSTARK|KENNY|1|157||d',
  '|227|HOLLWEG|MAX|1|157||d',
  '|104|HARLEKIN|IGOR|1|157',
  '71|74|MASTRIA|ANTONIO|2|155||d',
  '72|374|LEGENDARY|KARIM|2|152||u',
  '73|174|MÜLLER|UWE|1|149||d',
  '74|263|MUHIC|ASIM|1|146||d',
  '75|157|MEIER|FLO|1|145||d',
  '76|4|MÜLLER|FRITZ|1|143',
  '77|524|LEIRICH|MARCO|1|137||d',
  '|521|PILSL|RUDI|1|137||d',
  '|375|BAHN|ERICH|2|137||u',
  '|163|JOSIPOV|MATO|2|137||u',
  '81|277|BARAC|MARIO|1|132||d',
  '|230|SCHUSTER|EIKE|1|132||d',
  '83|523|HATTON|DAVID|2|123||d',
  '84|146|GNADE|STEVEN|2|122',
  '85|305|WALTER|ANDI|1|121',
  '86|514|WÜRMTAL|ROBBIE|1|120||d',
  '|503|LUTZ|THOMAS|1|120||d',
  '|459|DOSPIL|GERD|1|120||d',
  '89|5|ALBRECHT|SVEN|1|107||d',
  '90|3|BAUER|CHRISTIAN CB5|1|106||d',
  '91|64|HANSL|MATHIAS|1|103||d',
  '92|297|AMBASADOR|DAVID|1|102||d',
  '93|388|Ö|MR|1|92',
  '94|93|HOFSTETTER|THOMSEN|1|90||d',
  '|57|SEIDL|PETER (LOCOMOTIVE)|1|90',
  '96|454|LENTNER|DENNIS|1|82||d',
  '|315|OPALKO|ARTUR|1|82||d',
  '|21|LENZ|RENE (STANGL)|1|82||d',
  '99|497|SCHERER|YVES|1|76',
  '100|509|PREISSL|DANIEL|1|70||d',
  '|178|MENZEL|TOBI|1|70||d',
  '102|299|AMBASADOR|MESUT|1|62||d',
  '|212|SCHMALZL|THOMAS|1|62||d',
  '104|379|WAGNER|DIDI|1|57||d',
  '105|303|STEINIGER|FRANK|1|54',
  '106|531|WÜRMTAL|HUBSI|1|53||d',
  '107|266|FISCHER|KURTI|1|46||d',
  '108|502|MILJANOVIC|MILE|1|40||d',
  '|24|TOTH|ZOLTAN|1|40||d',
];
